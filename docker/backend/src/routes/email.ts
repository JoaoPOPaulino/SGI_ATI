import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { enviarEmail } from "../services/email.js";

export const emailRouter = Router();

// POST /api/email
emailRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { to, subject, html } = req.body;
    if (!to || !subject || !html) {
      res.status(400).json({ success: false, error: "Dados incompletos." });
      return;
    }
    await enviarEmail({ to, subject, html });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
