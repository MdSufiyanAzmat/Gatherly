const Event = require('../models/event');

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });
const eventFields = ['title', 'description', 'date', 'location', 'category', 'totalSeats', 'ticketPrice', 'imageUrl'];

const validateEventInput = (body) => {
    const missingField = eventFields.find((field) => body[field] === undefined || body[field] === null || body[field] === '');
    if (missingField) throw httpError(400, `${missingField} is required`);

    const textFields = ['title', 'description', 'location', 'category', 'imageUrl'];
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
    return event;
};

const ownerId = (event) => (event.createdBy?._id || event.createdBy)?.toString();
const isOwner = (event, user) => user && ownerId(event) === user._id.toString();
const isAdmin = (user) => user?.role === 'admin';

exports.submitEvent = async (req, res, next) => {
    try {
        const fields = validateEventInput(req.body);
        const event = await Event.create({
            ...fields,
            availableSeats: fields.totalSeats,
            createdBy: req.user._id,
            status: 'pending',
        });

        const populatedEvent = await event.populate('createdBy', 'name avatar');
        res.status(201).json({ success: true, data: populatedEvent, message: 'Event submitted! Awaiting admin approval.' });
    } catch (error) {
        next(error);
    }
};

exports.getPublicEvents = async (req, res, next) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 100);
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
                .skip((page - 1) * limit)
                .limit(limit),
            Event.countDocuments(filters),
        ]);

        res.json({
            success: true,
            data: { events, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
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
        res.json({ success: true, data: event, message: 'Event retrieved' });
    } catch (error) {
        next(error);
    }
};

exports.getMyEvents = async (req, res, next) => {
    try {
        const events = await Event.find({ createdBy: req.user._id })
            .populate('createdBy', 'name avatar')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: events, message: 'Your events retrieved' });
    } catch (error) {
        next(error);
    }
};

exports.getPendingEvents = async (req, res, next) => {
    try {
        const events = await Event.find({ status: 'pending' })
            .populate('createdBy', 'name avatar email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: events, message: 'Pending events retrieved' });
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
    } catch (error) {
        next(error);
    }
};

exports.approveEvent = (req, res, next) => reviewEvent(req, res, next, 'approved');
exports.rejectEvent = (req, res, next) => reviewEvent(req, res, next, 'rejected');

exports.deleteEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) throw httpError(404, 'Event not found');

        const creatorCanDelete = isOwner(event, req.user) && ['pending', 'rejected'].includes(event.status);
        if (!isAdmin(req.user) && !creatorCanDelete) {
            throw httpError(403, 'You are not allowed to delete this event');
        }

        await event.deleteOne();
        res.json({ success: true, data: { id: req.params.id }, message: 'Event deleted' });
    } catch (error) {
        next(error);
    }
};
