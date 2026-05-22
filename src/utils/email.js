const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    if (process.env.NODE_ENV === 'test') {
      return { messageId: 'test-message-id', skipped: true };
    }

    if (!config.email.user || !config.email.password) {
      logger.warn('Email credentials not configured. Skipping email send.');
      return { messageId: 'mock-message-id' };
    }

    const info = await transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      html
    });

    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    throw new Error('Failed to send email');
  }
};

const sendVerificationEmail = async (user, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/verify-email/${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Email Verification</h2>
      <p>Hello ${user.fullName},</p>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${verifyUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">
        Verify Email
      </a>
      <p>Or copy this link: ${verifyUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
      <hr>
      <p style="color: #666; font-size: 12px;">Legal Services Marketplace</p>
    </div>
  `;

  return sendEmail(user.email, 'Verify Your Email - Legal Services Marketplace', html);
};

const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password/${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset</h2>
      <p>Hello ${user.fullName},</p>
      <p>You requested to reset your password. Click the button below to reset it:</p>
      <a href="${resetUrl}" style="background-color: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">
        Reset Password
      </a>
      <p>Or copy this link: ${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
      <hr>
      <p style="color: #666; font-size: 12px;">Legal Services Marketplace</p>
    </div>
  `;

  return sendEmail(user.email, 'Reset Your Password - Legal Services Marketplace', html);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
};
