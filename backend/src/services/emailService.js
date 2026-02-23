const nodemailer = require('nodemailer');

// Configure transporter (use your real SMTP credentials)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'your@email.com',
    pass: process.env.SMTP_PASS || 'yourpassword'
  }
});

// Send payment receipt email
async function sendPaymentReceipt(to, tenantName, amount, date) {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@rentms.com',
    to,
    subject: 'Rent Payment Receipt',
    html: `<h2>Payment Receipt</h2><p>Dear ${tenantName},<br>Your payment of $${amount} was received on ${date}.<br>Thank you!</p>`
  };
  return transporter.sendMail(mailOptions);
}

// Send rent due notification email
async function sendRentDueNotification(to, tenantName, dueDate) {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@rentms.com',
    to,
    subject: 'Rent Payment Due Soon',
    html: `<h2>Rent Due Reminder</h2><p>Dear ${tenantName},<br>Your rent is due on ${dueDate}. Please ensure timely payment.</p>`
  };
  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendPaymentReceipt,
  sendRentDueNotification
};
