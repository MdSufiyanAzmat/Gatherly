const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendBookingEmail = async (userEmail, userName, eventTitle) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Booking Confirmed: ${eventTitle}`,
            html: `
                <h2>Booking Confirmed!</h2>
                <p><strong>Dear ${userName},</strong></p>
                <p>Your booking for <strong>${eventTitle}</strong> has been confirmed.</p>
                <p>We look forward to seeing you at the event!</p>
                <br>
                <p>Best regards,<br>Gatherly Team</p>
            `,
        });
        console.log(`Booking email sent to ${userEmail} for ${eventTitle}`);
    } catch (error) {
        console.error('Error sending booking email:', error);
    }
};

const sendOtpEmail = async (email, otp, type) => {
    try {
        const title = type === 'account_verification'
            ? 'Verify Your Account'
            : 'Gatherly Booking Verification';
        const message = type === 'account_verification'
            ? 'Please use the following OTP to verify your new Gatherly account'
            : 'Please use the following OTP to verify and confirm your event booking';

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: title,
            html: `
                <h2>${title}</h2>
                <p>${message}</p>
                <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
                <p>This OTP is valid for 10 minutes.</p>
                <br>
                <p>If you didn't request this, please ignore this email.</p>
                <p>Best regards,<br>Gatherly Team</p>
            `,
        });
        console.log(`OTP sent to ${email} for ${type}`);
    } catch (error) {
        console.error(`Unable to send OTP to ${email} for ${type}:`, error);
    }
};

const send = (to, subject, html) => transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
const greeting = (name) => `<p>Hi <strong>${name || 'there'}</strong>,</p>`;

const sendWelcomeEmail = (to, name) => send(to, 'Welcome to Gatherly!', `${greeting(name)}<p>Your account has been verified. You can now discover and book events.</p>`);
const sendRegistrationLinkEmail = (to, name, eventTitle, registrationLink) => send(to, `Registration link: ${eventTitle}`, `${greeting(name)}<p>Complete registration for <strong>${eventTitle}</strong> at <a href="${registrationLink}">the organizer's link</a>.</p>`);
const sendRegistrationConfirmationEmail = (to, name, eventTitle) => send(to, `Registration recorded: ${eventTitle}`, `${greeting(name)}<p>Your registration for <strong>${eventTitle}</strong> was recorded.</p>`);
const sendBookingConfirmedEmail = (to, name, eventTitle, amount) => send(to, `Booking confirmed: ${eventTitle}`, `${greeting(name)}<p>Your booking for <strong>${eventTitle}</strong> is confirmed${amount ? ` (₹${amount})` : ''}.</p>`);
const sendBookingRejectedEmail = (to, name, eventTitle, reason, flags = {}) => send(to, `${flags.eventCancelled ? 'Event cancelled' : 'Booking update'}: ${eventTitle}`, `${greeting(name)}<p>${flags.isAutoCancelled ? 'Your payment hold expired.' : flags.eventCancelled ? 'The organizer cancelled this event.' : 'Your booking was not confirmed.'}</p><p><strong>Note:</strong> ${reason || 'Contact the organizer directly regarding any payment or refund.'}</p><p>Payments are made directly to organizers; contact the organizer for any refund.</p>`);
const sendOwnerBookingNotification = ({ to, ownerName, buyerName, buyerEmail, eventTitle, amount, cancellation }) => send(to, `${cancellation ? 'Cancellation' : 'New booking'}: ${eventTitle}`, `${greeting(ownerName)}<p>${buyerName} (${buyerEmail}) ${cancellation ? 'cancelled a paid pending booking' : 'has a booking'} for <strong>${eventTitle}</strong>${amount ? ` (₹${amount})` : ''}.</p>`);
const sendProofSubmittedNotification = ({ to, ownerName, buyerName, buyerEmail, eventTitle, bookingId }) => send(to, `Payment proof submitted: ${eventTitle}`, `${greeting(ownerName)}<p>${buyerName} (${buyerEmail}) submitted payment proof for <strong>${eventTitle}</strong>.</p><p>Booking ID: ${bookingId}</p>`);
const sendNewEventEmail = ({ to, eventTitle, eventDate, eventLocation, eventId }) => {
    const eventUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/events/${eventId}`;
    return send(to, `New event: ${eventTitle}`, `<p>A new event has been published on Gatherly.</p><p><strong>${eventTitle}</strong></p><p>${new Date(eventDate).toLocaleDateString()}${eventLocation ? ` · ${eventLocation}` : ''}</p><p><a href="${eventUrl}">View event</a></p>`);
};

const sendNotification = async (label, sendEmail) => {
    try {
        await sendEmail();
    } catch (error) {
        console.error(`Unable to send ${label}:`, error.message);
    }
};

module.exports = {
    transporter, sendBookingEmail, sendOtpEmail, sendWelcomeEmail,
    sendRegistrationLinkEmail, sendRegistrationConfirmationEmail,
    sendBookingConfirmedEmail, sendBookingRejectedEmail,
    sendOwnerBookingNotification, sendProofSubmittedNotification, sendNewEventEmail, sendNotification,
};
