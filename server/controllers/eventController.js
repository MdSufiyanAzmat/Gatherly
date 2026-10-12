const Event = require('../models/event');
const Booking = require('../models/booking');
const { sendBookingRejectedEmail, sendNotification } = require('../services/emailService');
const { notifySubscribersOfNewEvent } = require('../services/eventNotificationService');
const { getPagination, paginationMetadata } = require('../utils/pagination');

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });
const eventFields = ['title', 'description', 'date', 'location', 'category', 'totalSeats', 'ticketPrice'];

const validateEventInput = (body) => {
    const missingField = eventFields.find((field) => body[field] === undefined || body[field] === null || body[field] === '');
    if (missingField) throw httpError(400, `${missingField} is required`);

    const textFields = ['title', 'description', 'location', 'category'];
    const event = {};
    for (const field of textFields) {
        if (typeof body[field] !== 'string' || !body[field].trim()) {
            throw httpError(400, `${field} must be a non-empty string`);
        }
        event[field] = body[field].trim();
    }

    event.date = new Date(body.date);
    if (Number.isNaN(event.date.getTime())) throw httpError(400, 'date must be valid');

    event.totalSeats = Number(body.totalSeats);
    event.ticketPrice = Number(body.ticketPrice);
    if (!Number.isInteger(event.totalSeats) || event.totalSeats < 1) {
        throw httpError(400, 'totalSeats must be a positive whole number');
    }
    if (!Number.isFinite(event.ticketPrice) || event.ticketPrice < 0) {
        throw httpError(400, 'ticketPrice must be a non-negative number');
    }

    event.registrationLink = body.registrationLink?.trim() || null;
    if (event.registrationLink) {
        try {
            const url = new URL(event.registrationLink);
            if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
        } catch (error) {
            throw httpError(400, 'registrationLink must be a valid HTTP(S) URL');
        }
    }

    event.paymentInfo = {
        phoneNumber: body.phoneNumber?.trim() || null,
        notes: body.paymentNotes?.trim() || null,
    };
    return event;
};

const ownerId = (event) => (event.createdBy?._id || event.createdBy)?.toString();
const isOwner = (event, user) => user && ownerId(event) === user._id.toString();
const isAdmin = (user) => user?.role === 'admin';

const buildFile = (file, directory) => (file ? {
    url: `/uploads/${directory}/${file.filename}`,
    filename: file.filename,
} : undefined);

const serializeEvent = (event, user) => {
    const data = event.toObject ? event.toObject({ virtuals: true }) : event;
    data.likeCount = data.likes?.length || 0;
    data.likedByCurrentUser = Boolean(user && data.likes?.some((id) => id.toString() === user._id.toString()));
    return data;
};

const createEvent = async (req, res, next, { approvedImmediately = false } = {}) => {
    try {
        const fields = validateEventInput(req.body);
        const image = buildFile(req.files?.image?.[0], 'events');
        const qrCode = buildFile(req.files?.qrCode?.[0], 'events');

        if (fields.ticketPrice > 0 && !fields.paymentInfo.phoneNumber && !qrCode) {
            throw httpError(400, 'Paid events require a UPI phone/ID or QR code.');
        }
        const event = await Event.create({
            ...fields,
            ...(image && { image }),
            paymentInfo: { ...fields.paymentInfo, ...(qrCode && { qrCode }) },
            availableSeats: fields.totalSeats,
            createdBy: req.user._id,
            status: approvedImmediately ? 'approved' : 'pending',
            reviewedBy: approvedImmediately ? req.user._id : null,
            reviewedAt: approvedImmediately ? new Date() : null,
        });

        const populatedEvent = await event.populate('createdBy', 'name avatar');
        res.status(201).json({
            success: true,
            data: populatedEvent,
            message: approvedImmediately ? 'Event published.' : 'Event submitted! Awaiting admin approval.',
        });
        if (approvedImmediately) {
            void notifySubscribersOfNewEvent(event).catch((error) => console.error('New-event notification failed:', error.message));
        }
    } catch (error) {
        next(error);
    }
};

/** Creates a user event submission with multipart image/payment data; it remains pending admin approval. */
exports.submitEvent = (req, res, next) => createEvent(req, res, next);

/** Creates an administrator-owned event and publishes it immediately. */
exports.submitAdminEvent = (req, res, next) => createEvent(req, res, next, { approvedImmediately: true });

exports.getPublicEvents = async (req, res, next) => {
    try {
        const pagination = getPagination(req.query);
        const filters = { status: 'approved' };

        if (req.query.search?.trim()) {
            const search = new RegExp(req.query.search.trim(), 'i');
            filters.$or = [{ title: search }, { description: search }, { location: search }, { category: search }];
        }
        if (req.query.location?.trim()) filters.location = new RegExp(req.query.location.trim(), 'i');
        if (req.query.category?.trim()) filters.category = new RegExp(req.query.category.trim(), 'i');
        if (req.query.dateFrom || req.query.dateTo) {
            filters.date = {};
            if (req.query.dateFrom) filters.date.$gte = new Date(req.query.dateFrom);
            if (req.query.dateTo) filters.date.$lte = new Date(req.query.dateTo);
        }
        if (req.query.minPrice || req.query.maxPrice) {
            filters.ticketPrice = {};
            if (req.query.minPrice) filters.ticketPrice.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) filters.ticketPrice.$lte = Number(req.query.maxPrice);
        }

        const [events, total] = await Promise.all([
            Event.find(filters)
                .populate('createdBy', 'name avatar')
                .sort({ date: 1 })
                .skip(pagination.skip)
                .limit(pagination.limit),
            Event.countDocuments(filters),
        ]);

        res.json({
            success: true,
            data: { events, pagination: paginationMetadata(pagination, total) },
            message: 'Public events retrieved',
        });
    } catch (error) {
        next(error);
    }
};

exports.getEventById = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id).populate('createdBy', 'name avatar');
        if (!event || (event.status !== 'approved' && !isAdmin(req.user) && !isOwner(event, req.user))) {
            throw httpError(404, 'Event not found');
        }
        await event.populate('comments.author', 'name');
        res.json({ success: true, data: serializeEvent(event, req.user), message: 'Event retrieved' });
    } catch (error) {
        next(error);
    }
};

exports.getMyEvents = async (req, res, next) => {
    try {
        const pagination = getPagination(req.query);
        const filter = { createdBy: req.user._id };
        const [events, total] = await Promise.all([
            Event.find(filter).populate('createdBy', 'name avatar').sort({ createdAt: -1 })
                .skip(pagination.skip).limit(pagination.limit),
            Event.countDocuments(filter),
        ]);
        res.json({ success: true, data: { events, pagination: paginationMetadata(pagination, total) }, message: 'Your events retrieved' });
    } catch (error) {
        next(error);
    }
};

/** Records an authenticated user's external-link registration without creating a booking or reserving a seat. */
exports.registerExternal = async (req, res, next) => {
    try {
        const event = await Event.findOneAndUpdate(
            { _id: req.params.id, status: 'approved', registrationLink: { $type: 'string', $ne: '' } },
            { $addToSet: { registrations: req.user._id } },
            { new: true }
        );
        if (!event) throw httpError(404, 'External registration event not found');
        res.json({ success: true, data: { id: event._id }, message: 'External registration recorded.' });
    } catch (error) {
        next(error);
    }
};

exports.getPendingEvents = async (req, res, next) => {
    try {
        const pagination = getPagination(req.query);
        const filter = { status: 'pending' };
        const [events, total] = await Promise.all([
            Event.find(filter).populate('createdBy', 'name avatar email').sort({ createdAt: -1 })
                .skip(pagination.skip).limit(pagination.limit),
            Event.countDocuments(filter),
        ]);
        res.json({ success: true, data: { events, pagination: paginationMetadata(pagination, total) }, message: 'Pending events retrieved' });
    } catch (error) {
        next(error);
    }
};

const reviewEvent = async (req, res, next, status) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) throw httpError(404, 'Event not found');
        if (event.status !== 'pending') throw httpError(400, 'Only pending events can be reviewed');

        if (status === 'rejected') {
            if (typeof req.body.reason !== 'string' || !req.body.reason.trim()) {
                throw httpError(400, 'A rejection reason is required');
            }
            event.rejectionReason = req.body.reason.trim();
        } else {
            event.rejectionReason = null;
        }

        event.status = status;
        event.reviewedBy = req.user._id;
        event.reviewedAt = new Date();
        await event.save();
        await event.populate('createdBy', 'name avatar');
        res.json({ success: true, data: event, message: `Event ${status}` });
        if (status === 'approved') {
            void notifySubscribersOfNewEvent(event).catch((error) => console.error('New-event notification failed:', error.message));
        }
    } catch (error) {
        next(error);
    }
};

exports.approveEvent = (req, res, next) => reviewEvent(req, res, next, 'approved');
exports.rejectEvent = (req, res, next) => reviewEvent(req, res, next, 'rejected');

exports.toggleLike = async (req, res, next) => {
    try {
        const event = await Event.findOne({ _id: req.params.id, status: 'approved' });
        if (!event) throw httpError(404, 'Event not found');

        const userId = req.user._id;
        const index = event.likes.findIndex((id) => id.toString() === userId.toString());
        if (index >= 0) event.likes.splice(index, 1);
        else event.likes.push(userId);
        await event.save();
        res.json({ success: true, data: { liked: index < 0, likeCount: event.likes.length }, message: index < 0 ? 'Event liked.' : 'Like removed.' });
    } catch (error) {
        next(error);
    }
};

exports.addComment = async (req, res, next) => {
    try {
        const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
        if (!text) throw httpError(400, 'Comment text is required.');
        if (text.length > 1000) throw httpError(400, 'Comment must be 1000 characters or fewer.');

        const event = await Event.findOne({ _id: req.params.id, status: 'approved' });
        if (!event) throw httpError(404, 'Event not found');
        event.comments.push({ author: req.user._id, text });
        await event.save();
        await event.populate('comments.author', 'name');
        const comment = event.comments[event.comments.length - 1];
        res.status(201).json({ success: true, data: comment, message: 'Comment added.' });
    } catch (error) {
        next(error);
    }
};

exports.deleteEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) throw httpError(404, 'Event not found');

        const creatorCanDelete = isOwner(event, req.user);
        if (!isAdmin(req.user) && !creatorCanDelete) {
            throw httpError(403, 'You are not allowed to delete this event');
        }

        // Existing reservations are cancelled before deletion. Seats no longer matter after the event is gone.
        const affectedBookings = await Booking.find({
            eventId: event._id,
            status: { $in: ['pending', 'confirmed'] },
        }).populate('userId', 'name email');
        await Booking.updateMany(
            { _id: { $in: affectedBookings.map((booking) => booking._id) } },
            { $set: { status: 'cancelled', ownerNote: 'The organizer cancelled this event.' } }
        );
        await event.deleteOne();

        affectedBookings.forEach((booking) => {
            void sendNotification('event cancellation email', () => sendBookingRejectedEmail(
                booking.userId?.email, booking.userId?.name, event.title,
                'The organizer cancelled this event.', { eventCancelled: true }
            ));
        });
        res.json({ success: true, data: { id: req.params.id }, message: 'Event deleted' });
    } catch (error) {
        next(error);
    }
};
