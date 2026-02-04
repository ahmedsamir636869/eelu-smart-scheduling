const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

/**
 * Send email using an HTML template
 * @param {string} to - Email address
 * @param {string} subject - Email subject
 * @param {string} templateName - Template file name (e.g., 'ResetPassowrd.html')
 * @param {Object} data - Data to replace placeholders (e.g., { userName: 'Ahmed', otpCode: '123456' })
 */
const sendEmail = async (to, subject, templateName, data = {}) => {
  // Read the HTML template
  const templatePath = path.join(__dirname, '../templates', templateName);
  let html = fs.readFileSync(templatePath, 'utf8');
  
  // Replace all placeholders with actual values
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    html = html.replace(regex, value);
  }
  
  const mailOptions = {
    from: `"EELU" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: subject,
    html: html,
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to} using template: ${templateName}`);
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sendEmail,
};
