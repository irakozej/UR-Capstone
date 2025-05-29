const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,      // your Gmail
    pass: process.env.SMTP_PASSWORD    // your Gmail app password
  }
});

const sendEmail = async ({ to, subject, text }) => {
  const mailOptions = {
    from: `"TutorConnect" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    text
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
