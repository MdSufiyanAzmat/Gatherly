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
                <p>Best regards,<br>Eventora Team</p>
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
            : 'Eventora Booking Verification';
        const message = type === 'account_verification'
            ? 'Please use the following OTP to verify your new Eventora account'
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
                <p>Best regards,<br>Eventora Team</p>
            `,
        });
        console.log(`OTP sent to ${email} for ${type}`);
    } catch (error) {
        console.error(`Unable to send OTP to ${email} for ${type}:`, error);
    }
};

// Do not catch errors here: BullMQ needs the rejection to retry the job.
const sendWelcomeEmail = async (to, name) => transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Welcome to Eventora!',
    html: `
        <h2>Welcome to Eventora!</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your account has been verified successfully. You can now discover and book events.</p>
        <br>
        <p>Best regards,<br>Eventora Team</p>
    `,
});

module.exports = { transporter, sendBookingEmail, sendOtpEmail, sendWelcomeEmail };
