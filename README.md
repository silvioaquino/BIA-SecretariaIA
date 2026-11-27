# Bia SaaS · Fase 1

A clínica se cadastra, personaliza a Bia, paga a mensalidade por Pix (QR Code no painel) e é **bloqueada automaticamente** quando atrasa. Quando paga, volta na hora.

**Stack:** Next.js 16 (App Router) · Supabase (Auth + Postgres) · Prisma 7 · Asaas · Tailwind 4

## Produtos e preços

Ficam em um lugar só: [`src/lib/planos.ts`](src/lib/planos.ts). A landing, o formulário, a assinatura e o upgrade leem dali.

| Porte | Bia Confirma | Bia Completa |
|---|---|---|
| Pequena (1-2) | R$ 197 | R$ 397 |
| Média (3-5) | R$ 397 | R$ 797 |
| Grande (6+) | R$ 697 | R$ 997 |
| Implantação | sem taxa | R$ 499 (grátis no upgrade para quem é Confirma há 60+ dias) |

- **Completa com implantação:** um Pix só (implantação + 1º mês) vence hoje, e a assinatura mensal começa no mês seguinte.
- **Upgrade Confirma → Completa** (página Assinatura):
  - gera o Pix da implantação; quando é pago, o webhook muda o valor da assinatura no Asaas e o produto da clínica;
  - para cliente antigo, aplica na hora.
  - Se a taxa de upgrade não for paga, a clínica **não** é bloqueada: só continua no Confirma.
- O n8n recebe `produto` em `/api/bia/clinica` para saber se liga o atendimento 24h.

## Landing page (`/`)

A ordem das seções segue o roteiro clássico de página que vende: problema → custo → solução → oferta → redução de risco.

1. Hero com resultado ("Paciente que confirma, aparece."), um CTA principal e uma conversa animada de exemplo.
2. Para quem é (odonto, médica, oftalmo).
3. Problema, com faixa de faltas citada de estudos brasileiros.
4. **Calculadora** de quanto a clínica perde com faltas e quanto recupera.
5. Como funciona (3 passos + linha do tempo).
6. Exemplos por especialidade.
7. Preços com seletor de tamanho. O CTA leva o plano até o cadastro (`/cadastro?produto=&porte=`).
8. Comparação com uma recepcionista extra (ancoragem de preço).
9. Segurança e LGPD.
10. Garantia de 7 dias (devolução de 100%) e análise de resultado com 30 dias.
11. Perguntas frequentes (quebra de objeções).
12. CTA final.
13. Botão fixo no celular.

**Sem depoimentos de propósito:** ainda não existem clientes, e o `marca/marca.json` proíbe números ou resultados inventados. Quando o primeiro estudo de caso sair, ele entra entre as seções 5 e 6 e passa a ser o elemento mais forte da página.

## Prospecção (uso interno) · Etapa 1: coleta e pontuação

Toda segunda, às 6h, a rota `/api/cron/prospeccao` faz o seguinte:
1. Busca no **Google Places** cada termo × cidade (ver `src/lib/prospeccao/config.ts`): 7 termos × 6 cidades, até 3 páginas cada. São no máximo 126 chamadas por semana, dentro das 1.000 grátis por mês.
2. Joga fora o que está fora das 6 cidades e junta com o que já existe, pelo `place_id`, pelo telefone ou pelo nome + cidade. Nada é duplicado, e o que foi digitado à mão (status, observações) não é tocado.
3. Confere na Evolution se o telefone tem WhatsApp. Essa etapa é opcional, só consulta e não envia nada.
4. Dá uma **pontuação de 0 a 100** e uma faixa (A ≥ 70, B 45-69, C < 45) a cada clínica, com os motivos. Os critérios são os do plano:
   - 30 a 300 avaliações;
   - nota 4 ou mais;
   - WhatsApp;
   - oftalmologia na frente.

   Hospital, rede pública, farmácia, ótica e clínica fechada viram `descartado`.

| Comando | O que faz |
|---|---|
| `npm run prospects:importar -- ../semana-1/prospeccao-clinicas.csv` | importa a lista da semana 1 (também aceita o export JSON da aba Planilha do painel) |
| GET `/api/cron/prospeccao?cidade=Olinda` + `Authorization: Bearer <CRON_SECRET>` | coleta só uma cidade (bom para o 1º teste) |
| `npm test` | testes de telefone, cidade e pontuação |

Para ligar a coleta, crie a chave em **Google Cloud → Places API (New)**, restrinja a chave a essa API e coloque em `GOOGLE_PLACES_API_KEY`.

## Prospecção · Etapa 2: fila do dia (`/admin/prospeccao`)

Só entra quem está logado com um e-mail de `ADMIN_EMAILS`. Para os outros, a página não existe (404).

| Seção | Quem entra | Meta |
|---|---|---|
| Follow-ups de hoje | abordadas por WhatsApp sem resposta, no 3º e no 7º dia | todas |
| WhatsApp: primeira mensagem | `novo` com celular ou WhatsApp confirmado, por pontuação | 10 por dia |
| Ligações | `novo` com fixo, sem WhatsApp, ou que não atendeu ontem | 5 por dia |
| Visitas · Rota 3 | `novo` em Itapissuma e Itamaracá | todas |

Como funciona cada cartão:
- Traz a mensagem do roteiro já personalizada (nome de quem está logado, cidade e frase do tipo de clínica), e o texto pode ser editado.
- **Abrir no WhatsApp** abre o `wa.me` com o texto pronto. Quem envia é a pessoa, do número comercial.
- Depois de enviar, marque o que aconteceu. O sistema calcula o próximo passo e grava o histórico em `InteracaoProspect`.

As regras seguem o roteiro:
- follow-up no 3º e no 7º dia; depois do 2º sem resposta, a clínica vira `sem_resposta` e sai da fila;
- 3 ligações sem atender também viram `sem_resposta`;
- "Pular hoje" devolve a clínica para a fila amanhã.

Os textos ficam em `src/lib/prospeccao/mensagens.ts`. Se o roteiro mudar, mude lá também.

## Prospecção · Etapa 3: respostas e avisos

```
WhatsApp comercial ──(Evolution, evento MESSAGES_UPSERT)──► /api/webhooks/whatsapp-comercial?token=…
   │
   ├─ clínica da lista respondeu ──► status "respondeu" + trecho no histórico
   │                                 + aviso no WhatsApp de vocês (com ⚠️ se parecer "não quero mais")
   │                                 + some dos follow-ups e aparece em "Responderam" no topo da fila
   ├─ vocês mandaram do comercial para uma clínica "novo" ──► registra o envio sozinho (se esquecerem o botão)
   └─ grupo, status, número fora da lista, mensagem repetida ──► ignora
```

**Resumo da manhã** (`/api/cron/resumo-prospeccao`, seg a sex, 8h): manda no WhatsApp de vocês quantas responderam, os follow-ups, os WhatsApps e as ligações do dia, e o que foi feito ontem. Com `?previa=1`, mostra o texto sem enviar.

Como ligar:
1. Na Evolution, conecte o **WhatsApp comercial** numa instância (lendo o QR). Coloque o nome dela em `EVOLUTION_INSTANCIA_COMERCIAL`.
2. Configure o webhook dessa instância: URL `https://SEU_DOMINIO/api/webhooks/whatsapp-comercial?token=<EVOLUTION_WEBHOOK_TOKEN>`, evento `MESSAGES_UPSERT`.
3. `EVOLUTION_INSTANCIA` é quem manda os avisos (pode ser a da demo), e `ALERTA_WHATSAPP` são os números de vocês dois.

> A instância comercial só **lê** as mensagens. Nada é enviado automaticamente para clínica: os avisos vão só para os números de `ALERTA_WHATSAPP`.

## Prospecção · Etapa 4: relatório de sexta

- **Página** `/admin/prospeccao/relatorio` (link no topo da fila):
  - o que vocês fizeram na semana × meta (10 WhatsApp e 5 ligações por dia útil) × semana passada;
  - o que voltou (respostas, conversas, propostas, pilotos);
  - **funil desde o começo**;
  - tabelas por tipo de clínica, por cidade e por canal.
- **WhatsApp:** `/api/cron/relatorio-prospeccao`, toda sexta às 17h, manda a versão curta para `ALERTA_WHATSAPP`, a tempo da revisão de 30 minutos. Com `?previa=1`, só mostra o texto.
- **Tipo de clínica "na frente"** (regra do PLANO-DE-EXECUCAO.md): ganha quem tem mais pilotos e, no empate, a maior taxa de conversa. Só entra na comparação o tipo com 5 ou mais abordadas.
- O funil conta cada clínica até a etapa **mais funda que já alcançou**. Quem conversou e depois desistiu continua contando em "conversaram".
- Para o funil andar, use a seção **Em negociação** da fila: Proposta enviada → Fechou o piloto → Virou cliente.

## Fluxo

```
/cadastro ──► e-mail de confirmação ──► /onboarding (4 passos) ──► /painel/assinatura
                                                                  │  "Gerar Pix" cria o cliente e a assinatura no Asaas
                                                                  │  e mostra o QR Code + copia e cola
                                                                  ▼
Asaas ── webhook ──► /api/webhooks/asaas ──► grava a cobrança ──► recalcula o status
Vercel cron (diário) ──► /api/cron/cobranca ──► aplica a carência e confere o Asaas
n8n ──► /api/bia/clinica?instancia=... ──► { ativa, config, profissionais, procedimentos }
```

### Status da clínica

| Status | Quando | Bia responde? |
|---|---|---|
| `CADASTRO` | conta criada, sem assinatura | não |
| `AGUARDANDO_PAGAMENTO` | assinatura criada, 1ª mensalidade em aberto | não |
| `ATIVA` | em dia | **sim** |
| `ATRASADA` | mensalidade vencida há até `CARENCIA_DIAS` (5) dias | **sim** (com aviso no painel) |
| `BLOQUEADA` | passou da carência, ou a última cobrança foi estornada | não |
| `CANCELADA` | assinatura apagada ou inativada no Asaas | não |

O status é **sempre recalculado a partir das cobranças** (`src/lib/cobranca.ts`). Por isso tanto faz se o webhook chega duas vezes, fora de ordem ou se perde: o cron diário corrige.

## Como colocar no ar

### 1. Supabase
1. Crie o projeto (região São Paulo).
2. **Authentication → URL Configuration:**
   - Site URL: o domínio do app;
   - Redirect URLs: `https://SEU_DOMINIO/auth/confirmar` e `http://localhost:3000/auth/confirmar`.
3. **Connect → ORMs → Prisma:** copie as duas URLs para o `.env` (veja `.env.example`):
   - `DATABASE_URL`, porta 6543;
   - `DIRECT_URL`, porta 5432.
4. Crie as tabelas:
   ```powershell
   npx prisma migrate deploy
   ```
   A 2ª migration liga o **RLS em todas as tabelas**. Sem isso, a chave pública do Supabase leria os dados das clínicas pela API.

### 2. Asaas (comece pelo Sandbox)
1. Crie uma conta em `sandbox.asaas.com` → **Integrações → Chave de API**. A chave começa com `$aact_hmlg_`. Coloque em `ASAAS_API_KEY`.
2. **Integrações → Webhooks → Adicionar:**
   - URL: `https://SEU_DOMINIO/api/webhooks/asaas`;
   - Token de autenticação: um texto aleatório longo, o mesmo de `ASAAS_WEBHOOK_TOKEN`;
   - Eventos: todos de **Cobranças** e de **Assinaturas**.
3. No sandbox, pague a cobrança pelo painel do Asaas para simular o Pix. No app, o botão **"Já paguei"** consulta o Asaas na hora.
4. Para produção, troque `ASAAS_API_URL` para `https://api.asaas.com/v3` e use a chave `$aact_prod_`.

### 3. Variáveis e deploy
Copie `.env.example` para `.env.local` e preencha. Na Vercel, cadastre as mesmas variáveis. O `vercel.json` já agenda o cron diário (11h UTC = 8h em Recife), e a Vercel envia o `CRON_SECRET` sozinha.

> Sem Vercel? Crie no n8n um **Schedule Trigger** diário. Ele faz um GET em `/api/cron/cobranca` com o header `Authorization: Bearer <CRON_SECRET>`.

### 4. Ligar no n8n (prévia da Fase 2)
No workflow **01 - Entrada e saída**, logo depois do webhook da Evolution, adicione um **HTTP Request**:
- GET `https://SEU_DOMINIO/api/bia/clinica?instancia={{ $json.body.instance }}`
- Header: `x-bia-token: <BIA_API_TOKEN>`

Depois, adicione um **IF** em `ativa`. Se for falso, o fluxo para e a Bia não responde. Se for verdadeiro, o `config` substitui o nó fixo `configClinica`.

O campo `Clinica.evolutionInstance` liga a clínica à instância. Por enquanto, preencha à mão no Supabase. Na Fase 2, o painel cria a instância e mostra o QR do WhatsApp.

## Desenvolvimento local

```powershell
npm install
npx prisma dev -n bia -d
npx prisma migrate deploy
npm run dev
```

`prisma dev` sobe um Postgres local. Ele tem um banco só, então use `migrate deploy`, e não `migrate dev`. O login precisa de um projeto Supabase de verdade (pode ser o de teste).

## Estrutura

| Caminho | O que é |
|---|---|
| `prisma/schema.prisma` | Clinica, Usuario, ConfigBia, Profissional, Procedimento, Pagamento, WebhookEvento |
| `src/proxy.ts` | renova a sessão do Supabase e protege `/painel` e `/onboarding` |
| `src/lib/asaas.ts` | cliente da API do Asaas |
| `src/lib/cobranca.ts` | regra de status e bloqueio |
| `src/components/FormBia.tsx` | formulário de 4 passos (mesmos campos do `configClinica`) |
| `src/app/api/webhooks/asaas` | webhook (token + idempotência pelo id do evento) |
| `src/app/api/cron/cobranca` | carência e conferência diária |
| `src/app/api/bia/clinica` | consulta do n8n |

## Pendências conhecidas
- **Termos de uso e política de privacidade** (`/termos`, `/privacidade`) são rascunhos. Revisar com advogado, porque envolve dado de saúde (LGPD).
- Trocar plano e cancelar ainda é pelo suporte, direto no Asaas.
- Recuperar senha ainda não tem tela.
