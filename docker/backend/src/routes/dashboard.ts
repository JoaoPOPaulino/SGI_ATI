import { Router, Request, Response } from "express";
import { query } from "../config/database.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();

// GET /api/dashboard
dashboardRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const [statsResult, pendingResult, recentResult, loansResult, chartResult] = await Promise.all([
      query("SELECT status, condicao FROM public.itens"),
      query("SELECT id, tipo, item_nome, destino, solicitante_id, solicitante_nome, status_aprovacao, data_movimentacao FROM public.movimentacoes WHERE status_aprovacao = 'PENDENTE' ORDER BY data_movimentacao DESC LIMIT 20"),
      query("SELECT id, tipo, item_nome, destino, solicitante_id, solicitante_nome, status_aprovacao, data_movimentacao FROM public.movimentacoes ORDER BY data_movimentacao DESC LIMIT 5"),
      query("SELECT id, item_nome, data_retorno_prevista FROM public.loans WHERE status = 'ATIVO' AND data_retorno_prevista < NOW() ORDER BY data_retorno_prevista ASC LIMIT 10"),
      query("SELECT data_movimentacao FROM public.movimentacoes WHERE data_movimentacao >= NOW() - INTERVAL '7 days'"),
    ]);

    const itens = statsResult.rows;

    res.json({
      stats: {
        total: itens.length,
        manutencao: itens.filter(i => i.status === "EM_MANUTENCAO").length,
        emprestados: itens.filter(i => i.status === "EMPRESTADO").length,
        emEvento: itens.filter(i => i.status === "EM_EVENTO").length,
        disponiveis: itens.filter(i => i.status === "ATIVO" || i.status === "EM_ESTOQUE").length,
        aguardandoBaixa: itens.filter(i => i.status === "AGUARDANDO_BAIXA").length,
        aguardandoRetirada: itens.filter(i => i.status === "EM_ESTOQUE").length,
      },
      pendingMovs: pendingResult.rows,
      recentMovs: recentResult.rows,
      overdueLoans: loansResult.rows,
      chartData: chartResult.rows,
    });
  } catch (err: any) {
    res.status(500).json({
      stats: { total: 0, manutencao: 0, emprestados: 0, emEvento: 0, disponiveis: 0, aguardandoBaixa: 0, prontosRetirada: 0 },
      pendingMovs: [], recentMovs: [], overdueLoans: [], chartData: [],
    });
  }
});

// GET /api/dashboard/meus-itens
dashboardRouter.get("/meus-itens", requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await query(
      "SELECT id, nome, numero_patrimonio, numero_serie, status, localizacao_atual, categoria FROM public.itens WHERE atribuido_a_id = $1 AND status != 'BAIXADO' ORDER BY nome",
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json([]);
  }
});
