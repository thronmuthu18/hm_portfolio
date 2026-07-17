const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Singleton SMTP Transporter
 * Created once at module load time — reused for every email dispatch.
 * Nodemailer manages the connection pool internally.
 */
let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    return null;
  }

  _transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: parseInt(smtpPort) === 465,
    auth: { user: smtpUser, pass: smtpPass },
    pool: true,          // Enable connection pooling — reuse SMTP connection
    maxConnections: 5,   // Max concurrent connections to SMTP server
    maxMessages: 100,    // Rotate connection after 100 messages
    rateLimit: 5,        // Max 5 messages per second to avoid rate limits
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });

  return _transporter;
};

/**
 * Escape HTML special characters in user-supplied template content
 * Prevents email header injection and XSS in email clients
 */
const esc = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

/**
 * Send Contact Enquiry Email Notification to the Developer
 * @param {Object} data - Form submission details
 */
exports.sendEnquiryEmail = async (data) => {
  try {
    const { fullName, email, phone, projectType, budget, projectDescription } = data;

    const transporter = getTransporter();

    if (!transporter) {
      logger.server('EmailService', 'SMTP transport not configured — skipping email notification.');
      return false;
    }

    const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
    const receiverEmail = process.env.RECEIVER_EMAIL || 'sudalaimuthusudalai754@gmail.com';

    const submissionTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    // HTML template — all user-supplied values are escaped to prevent injection
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Freelance Enquiry Received</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background-color: #060911;
            color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(10, 15, 29, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #3b82f6, #a855f7);
            padding: 30px;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 0.5px;
          }
          .header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            color: #d1d5db;
          }
          .content { padding: 30px; }
          .info-group {
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 15px;
          }
          .info-group:last-child { border-bottom: none; padding-bottom: 0; }
          .label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #a855f7;
            font-weight: 600;
            margin-bottom: 5px;
          }
          .value { font-size: 16px; color: #e5e7eb; line-height: 1.5; }
          .description-box {
            background-color: #0d1324;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 15px;
            color: #d1d5db;
            font-size: 15px;
            line-height: 1.6;
            white-space: pre-line;
            margin-top: 5px;
          }
          .footer {
            background-color: rgba(10, 15, 29, 0.5);
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
          .footer a { color: #3b82f6; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Freelance Enquiry</h1>
            <p>Sudalaimuthu A | Full Stack Web Developer</p>
          </div>
          <div class="content">
            <div class="info-group">
              <div class="label">Full Name</div>
              <div class="value" style="font-weight: 600; color: #ffffff;">${esc(fullName)}</div>
            </div>
            <div class="info-group">
              <div class="label">Email Address</div>
              <div class="value"><a href="mailto:${esc(email)}" style="color: #3b82f6; text-decoration: none;">${esc(email)}</a></div>
            </div>
            <div class="info-group">
              <div class="label">Phone Number</div>
              <div class="value"><a href="tel:${esc(phone)}" style="color: #e5e7eb; text-decoration: none;">${esc(phone)}</a></div>
            </div>
            <div class="info-group">
              <div class="label">Project Type Requested</div>
              <div class="value" style="color: #06b6d4; font-weight: 500;">${esc(projectType)}</div>
            </div>
            <div class="info-group">
              <div class="label">Project Budget</div>
              <div class="value" style="color: #10b981; font-weight: 600;">${esc(budget)}</div>
            </div>
            <div class="info-group" style="margin-bottom: 0;">
              <div class="label">Project Description</div>
              <div class="description-box">${esc(projectDescription)}</div>
            </div>
          </div>
          <div class="footer">
            <p>Submitted on: ${esc(submissionTime)} (IST)</p>
            <p>This is an automated notification from your developer portfolio. Respond promptly.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Portfolio Contact Form" <${smtpUser}>`,
      to: receiverEmail,
      subject: `💼 Freelance Enquiry from ${esc(fullName)} - ${esc(projectType)}`,
      text: `New Enquiry:\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nProject: ${projectType}\nBudget: ${budget}\nDescription: ${projectDescription}\nSubmitted: ${submissionTime}`,
      html: htmlTemplate
    };

    await transporter.sendMail(mailOptions);
    logger.activity('EmailService', `Enquiry notification sent to developer inbox.`);
    return true;
  } catch (error) {
    logger.server('EmailService', 'Failed to dispatch enquiry email', { error: error.message });
    // Return false instead of throwing to prevent API request crashes
    return false;
  }
};

/**
 * Send direct email to client
 */
exports.sendDirectEmail = async ({ to, subject, body }) => {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error('SMTP transport is not configured.');
  }

  const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const mailOptions = {
    from: `"Developer CRM" <${smtpUser}>`,
    to,
    subject,
    text: body
  };

  await transporter.sendMail(mailOptions);
  return true;
};

