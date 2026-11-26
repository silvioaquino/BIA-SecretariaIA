-- No Supabase, tabelas do schema public ficam expostas na Data API (chave pública).
-- RLS ligado e SEM policies = ninguém lê pela API. O app usa o Prisma com o
-- usuário postgres (dono das tabelas), que não é afetado.
ALTER TABLE "Clinica" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConfigBia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profissional" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Procedimento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pagamento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WebhookEvento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
