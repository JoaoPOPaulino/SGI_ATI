import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

export async function enviarEmail(payload: EmailPayload): Promise<void> {
  const fromName = process.env.EMAIL_FROM_NAME || "SGI-ATI";
  await transporter.sendMail({
    from: `"${fromName}" <${process.env.GMAIL_USER}>`,
    to: Array.isArray(payload.to) ? payload.to.join(", ") : payload.to,
    subject: payload.subject,
    html: payload.html,
  });
}
