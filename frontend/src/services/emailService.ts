import { api } from "./api";

export async function enviarEmailComprovante(params: {
  requerenteEmail: string;
  requerenteNome: string;
  coletorNome: string;
  coletorCpf?: string;
  coletorAssinaturaBase64: string;
  itemNome: string;
  chamado?: string;
  dataAssinatura: string;
  usuarioLogadoEmail: string;
}): Promise<void> {
  try {
    await api.post("/email", {
      to: [params.requerenteEmail, params.usuarioLogadoEmail],
      subject: `[SGI-ATI] Comprovante de Coleta — ${params.itemNome}`,
      html: `<p>Coleta registrada para ${params.itemNome} por ${params.coletorNome}.</p>`,
    });
  } catch (err) {
    console.error("Falha no envio de e-mail:", err);
  }
}

export async function enviarEmailDevolucao(params: {
  requerenteEmail: string;
  requerenteNome: string;
  receptorNome: string;
  receptorEmail?: string;
  receptorCpf?: string;
  itemNome: string;
  chamado?: string;
  dataAssinatura: string;
  usuarioLogadoEmail: string;
  usuarioLogadoNome: string;
}): Promise<void> {
  try {
    await api.post("/email", {
      to: [params.requerenteEmail, params.usuarioLogadoEmail],
      subject: `[SGI-ATI] Devolução Confirmada — ${params.itemNome}`,
      html: `<p>Devolução de ${params.itemNome} confirmada por ${params.receptorNome}.</p>`,
    });
  } catch (err) {
    console.error("Falha no envio de e-mail:", err);
  }
}
