const nodemailer = require("nodemailer");
const emailConfig = require("../configs/email");

const transporter = nodemailer.createTransport(emailConfig);

const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: emailConfig.auth.user, // Sender address
      to, // List of recipients
      subject, // Subject line
      text, // Plain text body
      html, // HTML body
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = { sendEmail };
