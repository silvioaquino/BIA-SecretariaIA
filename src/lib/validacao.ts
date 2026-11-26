import { z } from "zod";

export const soDigitos = (v: string) => v.replace(/\D/g, "");

/** Normaliza telefone BR para 55 + DDD + número. */
export function normalizarTelefone(v: string) {
  const d = soDigitos(v);
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return d;
}

export const DIAS = [
  ["seg", "Segunda"],
  ["ter", "Terça"],
  ["qua", "Quarta"],
  ["qui", "Quinta"],
  ["sex", "Sexta"],
  ["sab", "Sábado"],
  ["dom", "Domingo"],
] as const;

const telefone = z
  .string()
  .transform(normalizarTelefone)
  .refine((d) => /^55\d{10,11}$/.test(d), "WhatsApp inválido (use DDD + número)");

const texto = (min = 1, msg = "Campo obrigatório") => z.string().trim().min(min, msg);
const opcional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

const lista = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean),
  );

const horario = z
  .object({ aberto: z.boolean(), inicio: z.string(), fim: z.string() })
  .refine((h) => !h.aberto || (h.inicio && h.fim && h.inicio < h.fim), "Horário inválido");

export const onboardingSchema = z.object({
  // clínica
  nome: texto(2, "Informe o nome da clínica"),
  cpfCnpj: z
    .string()
    .transform(soDigitos)
    .refine((d) => d.length === 11 || d.length === 14, "CPF ou CNPJ inválido"),
  email: z.email("E-mail inválido"),
  whatsapp: telefone,
  cidade: opcional,
  porte: z.enum(["PEQUENA", "MEDIA", "GRANDE"]),
  produto: z.enum(["CONFIRMA", "COMPLETA"]),
  fonteAgenda: z.enum(["PLANILHA", "GOOGLE"]),
  especialidade: z.enum(["ODONTOLOGIA", "MEDICINA", "OFTALMOLOGIA", "OUTRA"]),
  // atendimento
  nomeExibicao: texto(2, "Informe como a Bia deve chamar a clínica"),
  endereco: texto(5, "Informe o endereço"),
  linkMaps: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^https?:\/\//.test(v), "Link do Maps inválido"),
  telefoneRecepcao: telefone,
  modoAgenda: z.enum(["DIRETO", "PRE"]),
  horarios: z
    .string()
    .transform((s, ctx) => {
      try {
        return z.record(z.string(), horario).parse(JSON.parse(s));
      } catch {
        ctx.addIssue({ code: "custom", message: "Revise os horários de atendimento" });
        return z.NEVER;
      }
    }),
  // equipe e serviços
  profissionais: z.string().transform((s, ctx) => {
    try {
      const r = z
        .array(
          z.object({
            nome: z.string().trim(),
            especialidade: z.string().trim().optional(),
            atendimento: z.string().trim().optional(),
            idAgenda: z.string().trim().optional(),
          }),
        )
        .parse(JSON.parse(s))
        .filter((p) => p.nome);
      if (!r.length) throw new Error();
      return r;
    } catch {
      ctx.addIssue({ code: "custom", message: "Cadastre pelo menos um profissional" });
      return z.NEVER;
    }
  }),
  procedimentos: z.string().transform((s, ctx) => {
    try {
      return z
        .array(
          z.object({
            nome: z.string().trim(),
            descricao: z.string().trim().optional(),
            duracaoMin: z.string().optional(),
            valor: z.string().optional(),
            orientacoes: z.string().trim().optional(),
          }),
        )
        .parse(JSON.parse(s))
        .filter((p) => p.nome)
        .map((p) => ({
          nome: p.nome,
          descricao: p.descricao || null,
          orientacoes: p.orientacoes || null,
          duracaoMin: p.duracaoMin ? Number.parseInt(p.duracaoMin, 10) || null : null,
          valor: p.valor ? Number.parseFloat(p.valor.replace(",", ".")) || null : null,
        }));
    } catch {
      ctx.addIssue({ code: "custom", message: "Revise os procedimentos" });
      return z.NEVER;
    }
  }),
  // regras
  aceitaParticular: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  convenios: lista,
  formasPagamento: lista,
  orientacoesGerais: opcional,
  mensagemBoasVindas: opcional,
  informacoesExtras: opcional,
  aceiteTermos: z.literal("on", { error: "É preciso aceitar os termos e a política de privacidade" }),
});

export type DadosOnboarding = z.infer<typeof onboardingSchema>;
