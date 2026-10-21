import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000, // aumentado para tolerar cold start do Render/Neon
});

pool.on("error", (err: Error) => {
  console.error("Pool PostgreSQL: erro inesperado", err.message);
});

// Retry automático para tolerar cold start do Render (banco Neon pode demorar para conectar)
export async function query(text: string, params?: unknown[], retries = 3): Promise<pg.QueryResult> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`Query lenta (${duration}ms): ${text.substring(0, 100)}`);
    }
    return result;
  } catch (err: any) {
    const isConnectionError =
      err.code === "ECONNREFUSED" ||
      err.code === "ENOTFOUND" ||
      err.code === "ETIMEDOUT" ||
      err.code === "ECONNRESET" ||
      err.code === "57P01" ||
      err.message?.includes("read ECONNRESET") ||
      err.message?.includes("Connection terminated") ||
      err.message?.includes("connection timeout") ||
      err.message?.includes("getaddrinfo");

    if (isConnectionError && retries > 0) {
      const delay = (4 - retries) * 1500; // 1.5s, 3s, 4.5s
      console.warn(`[db] Falha de conexão (${err.code || err.message}). Tentando novamente em ${delay}ms... (${retries} restantes)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return query(text, params, retries - 1);
    }
    throw err;
  }
}

export function getClient() {
  return pool.connect();
}

export default pool;
