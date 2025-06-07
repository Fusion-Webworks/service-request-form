const nodemailer = require('nodemailer');
const ErrorResponse = require('../utils/errorResponse');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

exports.sendEmail = async ({ email, subject, message }) => {
  try {
    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject,
      text: message
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    throw new ErrorResponse('Email could not be sent', 500);
  }
};

exports.sendTicketAssignedEmail = async (email, ticketId, assignerName) => {
  try {
    const message = `You have been assigned to ticket #${ticketId} by ${assignerName}. Please log in to the system to view details.`;

    await this.sendEmail({
      email,
      subject: 'New Ticket Assignment',
      message
    });
  } catch (err) {
    throw new ErrorResponse('Assignment email could not be sent', 500);
  }
};

exports.sendTicketStatusEmail = async (email, ticketId, status) => {
  try {
    const message = `The status of your ticket #${ticketId} has been updated to ${status}.`;

    await this.sendEmail({
      email,
      subject: 'Ticket Status Update',
      message
    });
  } catch (err) {
    throw new ErrorResponse('Status update email could not be sent', 500);
  }
};