import nodemailer from "nodemailer";

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

export async function enviarEmail(payload: EmailPayload): Promise<void> {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !pass) throw new Error("Configure GMAIL_USER e GMAIL_APP_PASSWORD.");
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 465, secure: true,
    auth: { user, pass },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  });
  const result = await transporter.sendMail({
    from: { name: process.env.EMAIL_FROM_NAME || "SGI-ATI", address: user },
    replyTo: user,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });
  if (result.rejected.length || !result.accepted.length) {
    throw new Error("O Gmail não aceitou todos os destinatários.");
  }
}
