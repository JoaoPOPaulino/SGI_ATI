import { z } from "zod";

export const itemSchema = z
  .object({
    nome: z
      .string()
      .min(1, "O nome do item é obrigatório.")
      .max(200, "Nome muito longo."),
    tipo: z.enum(["PATRIMONIADO", "SERIALIZADO", "NAO_SERIALIZADO"]),
    categoria: z.string().min(1, "A categoria é obrigatória."),
    condicao: z.enum(["NOVO", "BOM", "REGULAR", "RUIM", "ESTRAGADO"], {
      errorMap: () => ({ message: "Selecione uma condição válida." }),
    }),
    status: z.enum([
      "ATIVO",
      "EM_MANUTENCAO",
      "AGUARDANDO_BAIXA",
      "BAIXADO",
      "GUARDADO",
      "EMPRESTADO",
      "EM_EVENTO",
    ]),
    predio: z.string().min(1, "O Prédio é obrigatório."),
    andar: z.string().min(1, "O Andar é obrigatório."),
    setor: z.string().min(1, "O Setor é obrigatório."),
    sala: z.string().optional(),
    numeroPatrimonio: z.string().optional(),
    numeroSerie: z.string().optional(),
    marca: z.string().optional(),
    modelo: z.string().optional(),
    quantidade: z.number().min(0).optional(),
    atribuidoAId: z.string().optional(),
    atribuidoANome: z.string().optional(),
    polo: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === "PATRIMONIADO") {
      const patDigits = (data.numeroPatrimonio || "").replace(/\D/g, "");
      if (patDigits.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Itens patrimoniados exigem o Nº de Patrimônio.",
          path: ["numeroPatrimonio"],
        });
      } else if (patDigits.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "O Nº de Patrimônio deve conter exatamente 6 dígitos (ex: PAT-123456).",
          path: ["numeroPatrimonio"],
        });
      }
    }
    if (data.tipo === "SERIALIZADO" && !(data.numeroSerie || "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Itens serializados exigem o Número de Série.",
        path: ["numeroSerie"],
      });
    }
    if (data.status === "ATIVO" && data.condicao === "ESTRAGADO") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Equipamento ESTRAGADO não pode estar ATIVO. Altere o status para EM_MANUTENCAO ou a condição.",
        path: ["status"],
      });
    }
    if (
      data.status === "EM_MANUTENCAO" &&
      (data.condicao === "NOVO" || data.condicao === "REGULAR")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Equipamento em manutenção deve estar RUIM ou ESTRAGADO. Ajuste a condição.",
        path: ["condicao"],
      });
    }
  });

export type ItemFormData = z.infer<typeof itemSchema>;

export const movimentacaoSchema = z
  .object({
    tipo: z.enum(["TRANSFERENCIA", "MANUTENCAO", "VIAGEM"]),
    chamado: z.string().optional(),
    itemId: z.string().min(1, "Selecione o equipamento."),
    destinoPolo: z.string().optional(),
    destinoAndar: z.string().optional(),
    destinoSetor: z.string().optional(),
    destinoSala: z.string().optional(),
    destinoEstacao: z.string().optional(),
    observacao: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo !== "VIAGEM" && !(data.chamado || "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe o número do chamado.",
        path: ["chamado"],
      });
    }
    if (data.tipo === "VIAGEM" || data.tipo === "TRANSFERENCIA") {
      const destino = [
        data.destinoPolo,
        data.destinoAndar,
        data.destinoSetor,
        data.destinoSala,
        data.destinoEstacao,
      ]
        .filter(Boolean)
        .join("");
      if (!destino) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o endereço hierárquico de destino.",
          path: ["destinoPolo"],
        });
      }
    }
  });

export type MovimentacaoFormData = z.infer<typeof movimentacaoSchema>;

export const loanSchema = z.object({
  itemId: z.string().min(1, "Selecione o equipamento."),
  responsavel: z.string().min(1, "Informe o nome do responsável."),
  dataRetorno: z
    .string()
    .min(1, "Informe a data de retorno.")
    .refine(
      (val) => {
        if (!val) return false;
        return new Date(val) > new Date();
      },
      { message: "A data de retorno deve ser futura." },
    ),
});

export type LoanFormData = z.infer<typeof loanSchema>;

export const eventoSchema = z
  .object({
    nome: z.string().min(1, "Informe o nome do evento."),
    local: z.string().min(1, "Informe o local."),
    dataInicio: z.string().min(1, "Informe a data de início."),
    dataFim: z.string().min(1, "Informe a data de fim."),
    itensSelecionados: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (!data.dataInicio || !data.dataFim) return true;
      return new Date(data.dataFim) >= new Date(data.dataInicio);
    },
    {
      message: "A data de fim não pode ser anterior à data de início.",
      path: ["dataFim"],
    },
  );

export type EventoFormData = z.infer<typeof eventoSchema>;

const cpfDigits = (cpf: string) => cpf.replace(/\D/g, "");

export const isValidCpf = (cpf: string): boolean => {
  const digits = cpfDigits(cpf);
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  return true;
};

export const userSchema = z.object({
  nome: z
    .string()
    .min(3, { message: "O nome deve ter no mínimo 3 caracteres." })
    .max(50, { message: "O nome deve ter no máximo 50 caracteres." }),
  email: z
    .string()
    .email({ message: "Formato de e-mail inválido." })
    .toLowerCase(),
  cpf: z.string().refine((v) => isValidCpf(v), {
    message: "CPF inválido. Informe 11 dígitos.",
  }),
  perfil: z.enum(["ESTAGIARIO", "TECNICO", "SUPERIOR", "ADMIN"] as const),
  polo: z.string().optional(),
});
