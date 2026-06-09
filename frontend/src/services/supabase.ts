import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Credenciais do Supabase não encontradas. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env",
  );
}

function getAuthHeaders(): Record<string, string> {
  try {
    const raw = localStorage.getItem("sgi_ati_session");
    if (!raw) return { "x-user-perfil": "ESTAGIARIO", "x-user-id": "" };
    const session = JSON.parse(raw);
    return {
      "x-user-perfil": session.perfil || "ESTAGIARIO",
      "x-user-id": session.id || "",
    };
  } catch {
    return { "x-user-perfil": "ESTAGIARIO", "x-user-id": "" };
  }
}

const customFetch: typeof fetch = async (input, init) => {
  const headers = new Headers(init?.headers);
  const authHeaders = getAuthHeaders();
  headers.set("x-user-perfil", authHeaders["x-user-perfil"]);
  headers.set("x-user-id", authHeaders["x-user-id"]);
  return fetch(input, { ...init, headers });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: customFetch,
  },
});
