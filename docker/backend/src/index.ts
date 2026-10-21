import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth.js";
// Version: 2026-07-30 import-batch-qr
import { itensRouter } from "./routes/itens.js";
import { movimentacoesRouter } from "./routes/movimentacoes.js";
import { usuariosRouter } from "./routes/usuarios.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { emailRouter } from "./routes/email.js";
import { feedbackRouter } from "./routes/feedback.js";
import { emprestimosRouter } from "./routes/emprestimos.js";
import { eventosRouter } from "./routes/eventos.js";
import { laudosRouter } from "./routes/laudos.js";
import { locaisRouter } from "./routes/laudos.js";
import { assinaturasRouter } from "./routes/laudos.js";

import { query } from "./config/database.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "https://sgi-ati.vercel.app" }));
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRouter);
app.use("/api/itens", itensRouter);
app.use("/api/movimentacoes", movimentacoesRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/email", emailRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/emprestimos", emprestimosRouter);
app.use("/api/eventos", eventosRouter);
app.use("/api/laudos", laudosRouter);
app.use("/api/locais", locaisRouter);
app.use("/api/assinaturas", assinaturasRouter);

app.get("/api/health", async (_req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      res.status(503).json({
        status: "error",
        db: "missing_env",
        message: "DATABASE_URL não configurada no ambiente",
        timestamp: new Date().toISOString(),
      });
      return;
    }
    await query("SELECT 1");
    res.json({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: "error",
      db: "disconnected",
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.listen(PORT, () => {
  console.log(`SGI-ATI Backend rodando na porta ${PORT}`);
});

export default app;
