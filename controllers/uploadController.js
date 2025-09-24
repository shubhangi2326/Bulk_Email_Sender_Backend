import xlsx from "xlsx";
import nodemailer from "nodemailer";
import fs from "fs";
import User from "../models/User.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

const sendBulkEmails = async (emailData) => {
  const first100Users = emailData.slice(0, 100);
  const results = { success: [], failed: [] };

  console.log(`📧 Sending emails to ${first100Users.length} users...`);

  const emailPromises = first100Users.map(async (user) => {
    try {
       const mailOptions = {
        from: `"Bulk Email System" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: '🚀 Bulk Email Test - MERN Stack',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4CAF50;">Hi ${user.name}! 👋</h2>
            <p style="font-size: 16px; color: #333;">You have received this email from our <strong>MERN Stack Bulk Email System</strong>.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #666;">✅ System is working perfectly!</p>
              <p style="margin: 5px 0 0 0; color: #666;">📧 Email sent to: <strong>${user.email}</strong></p>
            </div>
            <p style="font-size: 14px; color: #888;">This email was sent as part of a bulk email test.</p>
          </div>
        `,
        text: `Hi ${user.name}! You received this from MERN Stack Bulk Email System. Email: ${user.email}`
      };
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ SUCCESS: ${user.email} - MessageID: ${info.messageId}`);
      return { email: user.email, status: "success" };
    } catch (error) {
      console.log(`❌ FAILED: ${user.email} - Error: ${error.message}`);
      return { email: user.email, status: "failed" };
    }
  });

  const emailResults = await Promise.all(emailPromises);
  emailResults.forEach((result) => {
    if (result.status === "success") results.success.push(result);
    else results.failed.push(result);
  });

  console.log(
    `📊 SUMMARY: ${results.success.length} sent, ${results.failed.length} failed`
  );
  return results;
};

export const handleUploadAndSend = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const data = xlsx.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]]
    );
    const emailData = data.filter((row) => row.name && row.email);

    if (emailData.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "No valid data in Excel file." });
    }

    await User.deleteMany({});
    await User.insertMany(emailData);
    console.log(`💾 Saved ${emailData.length} users to database`);

    const emailResults = await sendBulkEmails(emailData);
    fs.unlinkSync(req.file.path);

    res.json({
      message: `📧 Sent emails to ${emailResults.success.length} users`,
      successCount: emailResults.success.length,
      failedCount: emailResults.failed.length,
      successEmails: emailResults.success.map((r) => r.email),
      failedEmails: emailResults.failed.map((r) => r.email),
    });
  } catch (error) {
    console.error("Error processing file:", error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Server error while processing file." });
  }
};
