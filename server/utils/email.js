const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const sendBrevoEmail = async ({ to, subject, html }) => {
    const res = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            sender: {
                name: 'Gatherly Team',
                email: process.env.EMAIL_USER,
            },
            to: [{ email: to }],
            subject,
            htmlContent: html,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Brevo API error ${res.status}: ${err}`);
    }

    return res.json();
};

const sendBookingEmail = async (userEmail, userName, eventTitle) => {
    try {
        await sendBrevoEmail({
            to: userEmail,
            subject: `Booking Confirmed: ${eventTitle}`,
            html: `
                <h2>Booking Confirmed! 🎉</h2>
                <p><strong>Dear ${userName},</strong></p>
                <p>Your booking for <strong>${eventTitle}</strong> has been confirmed.</p>
                <p>We look forward to seeing you at the event!</p>
                <br>
                <p>Best regards,<br>Gatherly Team</p>
            `,
        });
        console.log(`Booking email sent to ${userEmail} for ${eventTitle}`);
    } catch (error) {
        console.log('Error sending booking email: ', error);
    }
};

const sendOtpEmail = async (email, otp, type) => {
    try {
        const title = type === 'account_verification'
            ? 'Verify Your Account'
            : 'Gatherly Booking Verification';

        const msg = type === 'account_verification'
            ? 'Please use the following OTP to verify your new Gatherly account'
            : 'Please use the following OTP to verify and confirm your event booking';

        await sendBrevoEmail({
            to: email,
            subject: title,
            html: `
                <h2>${title}</h2>
                <p>${msg}</p>
                <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
                <p>This OTP is valid for 10 minutes.</p>
                <br>
                <p>If you didn't request this, please ignore this email.</p>
                <p>Best regards,<br>Gatherly Team</p>
            `,
        });
    } catch (error) {
        console.log(`Unable to send OTP to ${email} for ${type}:`, error);
    }
};

module.exports = { sendBookingEmail, sendOtpEmail };