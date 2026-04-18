# Design: Multi-tenant com 3 perfis (Escola, Professor Autônomo, Aluno B2C) + White-label + Planos

**Status:** Draft para revisão
**Data:** 2026-04-18
**Autor:** Design colaborativo (usuário + Claude)
**Projeto:** CLIQUE EXATAS / GeoTeach SaaS
**Supabase project ID:** `duqrveawgopqohrfiogz`
**Domínio principal:** `cliqueexatas.com.br` / `app.cliqueexatas.com.br`

---

## 1. Contexto e motivação

O sistema já tem multi-tenancy com RLS, signup para `teacher` e `school`, painel admin de super admin, e uma stack Vite + React + Supabase + Vercel. O objetivo agora é:

1. Adicionar o terceiro perfil — **Aluno B2C** (pessoa física que quer estudar em casa, compra licença individual)
2. Montar um sistema de **planos Free/Pro/Premium** diferenciado por perfil (9 tiers no total)
3. Habilitar **white-label** completo (logo, cores, subdomínio, domínio próprio via Cloudflare for SaaS)
4. Robustecer o **painel de super admin** para suportar atendimento completo sem acesso a SQL
5. Configurar **Cloudflare** na frente da Vercel (CDN + DDoS + Cloudflare for SaaS) **sem migrar a stack** (Vercel + Supabase continuam)

Validação: os primeiros usuários serão professores autônomos (amigos do fundador que pediram para usar). Escola e Aluno B2C são apostas de expansão que a arquitetura precisa suportar desde o início, mas cuja demanda real ainda não foi validada.

---

## 2. Arquitetura geral

### 2.1 Stack (decisão travada)

```
Usuários (multi-idioma, multi-região)
    ↓
Cloudflare (CDN + DDoS + WAF + for SaaS para custom hostnames)
    ↓
Vercel (Vite SPA + edge functions curtas)
    ↓
Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)
    ↑
Stripe (BRL + USD, webhooks → Supabase Edge Functions)
```

**Decisão:** NÃO migrar para Cloudflare Workers/D1. Justificativa: D1 é SQLite sem RLS nativo, exigiria reescrever toda a camada de segurança multi-tenant já construída; Workers tem limite de 50ms CPU que quebra integrações longas (webhooks Stripe, Cloudflare API); Postgres é portável, D1 é lock-in. Cloudflare na frente da Vercel entrega os ganhos de edge sem os riscos.

### 2.2 Domínios

| Domínio | Conteúdo | Branding |
|---|---|---|
| `cliqueexatas.com.br` | Landing pública (marketing, pricing, blog) | CLIQUE EXATAS sempre |
| `app.cliqueexatas.com.br` | App principal (login + dashboard) | Default para tenants sem branding e sempre para Aluno B2C |
| `{slug}.cliqueexatas.com.br` | Tenants Pro (Escola e Professor) com subdomínio | Branding do tenant |
| `portal.escola.com.br` (etc) | Tenants Premium com domínio próprio, via Cloudflare for SaaS | Branding do tenant |
| `customers.cliqueexatas.com.br` | Fallback origin do Cloudflare for SaaS (não é acessado diretamente pelo usuário) | N/A |

---

## 3. Modelo dos 3 perfis (data model)

| Perfil | Tipo de conta | Estrutura | Tem membros? |
|---|---|---|---|
| **Escola** | Tenant organizacional (`tenants.is_solo = false`) | Vários professores + turmas + alunos convidados | Sim, convida por `tenant_invites` |
| **Professor autônomo** | Tenant solo (`tenants.is_solo = true`) | Um único admin/teacher + turmas + alunos convidados | Só o dono; alunos entram via `class_enrollments` |
| **Aluno B2C** | Conta pessoal (`profiles.role = 'student'`, `tenant_id NULL`) | Usuário individual, sem tenant | Não tem membros |

**Ponto-chave:** Escola e Professor usam a **mesma tabela `tenants`**, diferenciados apenas pela flag `is_solo`. Isso evita duplicar código de turmas/alunos/convites. Aluno B2C **não entra em `tenants`** — é profile com role `student` e linha própria em `subscriptions`. Se no futuro um aluno B2C também for convidado para uma turma (via `class_enrollments`), ele mantém sua conta B2C **sem** virar membro do tenant do professor.

---

## 4. Plans / pricing (data model e matriz)

### 4.1 Estrutura: tabela `plans` (substitui enum `subscription_plan`)

```sql
CREATE TABLE public.plans (
  id              text PRIMARY KEY,           -- ex: 'school_pro', 'teacher_free', 'student_premium'
  profile_type    text NOT NULL CHECK (profile_type IN ('school', 'teacher', 'student')),
  tier            text NOT NULL CHECK (tier IN ('free', 'pro', 'premium')),
  name            text NOT NULL,              -- display name (ex: "Escola Pro")
  description     text,
  prices          jsonb NOT NULL DEFAULT '{}', -- { "BRL": 14900, "USD": 2900 } em centavos
  stripe_price_ids jsonb NOT NULL DEFAULT '{}', -- { "BRL": "price_xxx", "USD": "price_yyy" }
  limits          jsonb NOT NULL DEFAULT '{}', -- { turmas, alunos, professores, projetos, storage_mb, branding, custom_domain }
  active          boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_type, tier)
);
```

A tabela `subscriptions` passa a ter `plan_id text REFERENCES plans(id)` em vez do enum rígido. O enum `subscription_plan` atual (`free, professor, institution`) vira legado e sai após migração.

### 4.2 Matriz de planos (9 tiers)

| Perfil | Tier | Preço BRL | Preço USD | Limites principais |
|---|---|---|---|---|
| **Escola** | Free | R$ 0 | $0 | 1 turma, 5 alunos, 1 professor, sem branding |
| **Escola** | Pro | R$ 149/mês | $29/mês | 10 turmas, 100 alunos, 5 professores, subdomínio + logo/cor |
| **Escola** | Premium | R$ 449/mês | $89/mês | Ilimitado, + domínio próprio, suporte prioritário |
| **Professor** | Free | R$ 0 | $0 | 1 turma, 10 alunos, 3 projetos |
| **Professor** | Pro | R$ 39/mês | $9/mês | 5 turmas, 50 alunos, 20 projetos, subdomínio + logo/cor |
| **Professor** | Premium | R$ 89/mês | $19/mês | Ilimitado, + domínio próprio |
| **Aluno** | Free | R$ 0 | $0 | Conteúdo básico, 3 projetos, com ads |
| **Aluno** | Pro | R$ 19/mês | $4.99/mês | Ilimitado projetos, sem ads, export |
| **Aluno** | Premium | R$ 39/mês | $9.99/mês | + Anotações avançadas, IA futura |

**Observações:**
- Todos os tiers pagos terão variante **anual com 20% de desconto** (2 preços no Stripe, ambos referenciados em `stripe_price_ids` com sufixo ou estrutura aninhada).
- Preços são ponto de partida — ajustáveis via painel admin sem deploy.
- Aluno B2C **não tem branding nem domínio próprio** em nenhum tier.
- Limites enforçados via trigger `check_plan_limit(tenant_id, limit_key)` antes de INSERT em `classes`, `class_enrollments`, `profiles` (quando `tenant_id` ≠ NULL), `projects`.

### 4.3 Estrutura do JSONB `limits`

```json
{
  "turmas": 10,
  "alunos": 100,
  "professores": 5,
  "projetos": null,       // null = ilimitado
  "storage_mb": 500,
  "branding": true,       // logo + cor customizáveis
  "custom_domain": false, // domínio próprio via Cloudflare for SaaS
  "subdomain": true,      // {slug}.cliqueexatas.com.br
  "ads": false,
  "export": true
}
```

---

## 5. White-label (branding + domínio custom)

### 5.1 Schema (colunas novas em `tenants`)

Tabela `tenants` **já tem** `custom_domain`, `logo_url`, `primary_color`, `secondary_color` no banco real (divergência do repo). Faltam:

```sql
ALTER TABLE public.tenants ADD COLUMN is_solo boolean NOT NULL DEFAULT false;
ALTER TABLE public.tenants ADD COLUMN display_name text;
ALTER TABLE public.tenants ADD COLUMN custom_domain_status text
  CHECK (custom_domain_status IN ('pending', 'active', 'failed', 'revoked'));
ALTER TABLE public.tenants ADD COLUMN cloudflare_hostname_id text;
ALTER TABLE public.tenants ADD COLUMN branding_enabled_at timestamptz;

CREATE UNIQUE INDEX tenants_cloudflare_hostname_id_idx
  ON public.tenants(cloudflare_hostname_id) WHERE cloudflare_hostname_id IS NOT NULL;
```

Observações:
- `slug` (já unique) serve de subdomínio: `{slug}.cliqueexatas.com.br`.
- `display_name` é opcional; se NULL, UI usa `name`.

### 5.2 Resolução de tenant (frontend)

No bootstrap do app:

1. `const host = window.location.host`
2. RPC pública `get_tenant_by_host(host)` retorna `{ id, display_name, logo_url, primary_color, secondary_color }` ou `null`
3. Se host ∈ `['app.cliqueexatas.com.br', 'cliqueexatas.com.br']` → sem tenant (branding default)
4. Senão, match por `subdomain` extraído do host ou por `custom_domain`
5. ThemeProvider injeta CSS vars `--primary` e `--accent` antes do primeiro render (evita FOUC)

A RPC retorna só campos públicos (não expõe `id` interno em queries subsequentes sem auth).

### 5.3 Cloudflare for SaaS — fluxo de custom domain

1. Tenant Premium acessa `/settings/custom-domain`, informa `portal.escola.com.br`
2. Edge Function `add-custom-domain` chama `POST https://api.cloudflare.com/client/v4/zones/{zone_id}/custom_hostnames` com:
   ```json
   { "hostname": "portal.escola.com.br", "ssl": { "method": "http", "type": "dv", "settings": { "min_tls_version": "1.2" } } }
   ```
3. Resposta inclui `id` (salvo em `tenants.cloudflare_hostname_id`), status inicial = `pending`
4. UI mostra instrução: "Adicione um CNAME `portal` → `customers.cliqueexatas.com.br` no provedor DNS da escola"
5. Edge Function `check-custom-domain-status` (cron 5min) faz GET `/custom_hostnames/{id}` e atualiza `tenants.custom_domain_status` quando Cloudflare validar
6. Quando ativo, Cloudflare roteia: `portal.escola.com.br` → cert SSL emitido pela Cloudflare → origin `customers.cliqueexatas.com.br` → Vercel. Vercel precisa aceitar hostname arbitrário; middleware do app resolve tenant via `get_tenant_by_host(host)`

**Custo:** Cloudflare for SaaS cobra ~$2/hostname/mês (embutido no preço Premium). Conta Cloudflare precisa ter SaaS habilitado.

### 5.4 Config Vercel / Cloudflare

**Vercel (Domains):**
- Adicionar: `cliqueexatas.com.br`, `app.cliqueexatas.com.br`, `*.cliqueexatas.com.br`, `customers.cliqueexatas.com.br`
- Todos proxied via Cloudflare (SSL/TLS mode "Full (strict)")

**Cloudflare (zone `cliqueexatas.com.br`):**
- Wildcard CNAME `*.cliqueexatas.com.br` → `cname.vercel-dns.com` (proxied)
- CNAME `app.cliqueexatas.com.br` → `cname.vercel-dns.com` (proxied)
- SSL/TLS mode: Full (strict)
- Cloudflare for SaaS habilitado com fallback origin `customers.cliqueexatas.com.br`
- API token com escopos `Zone:Edit`, `SSL and Certificates:Edit`, `Custom Hostnames:Edit` salvo em Supabase Edge Function secret (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`)

---

## 6. Super Admin completo para suporte

### 6.1 Capacidades (9 núcleo)

1. **Impersonate user** — "Login as" com TTL 30min, banner vermelho fixo "VOCÊ ESTÁ VISUALIZANDO COMO [X]", audit log obrigatório
2. **Visão cross-tenant read-only** — todas as tabelas com policy `..._select_superadmin`
3. **Gerenciar assinaturas** — mudar plano manual, estender trial, cancelar, **refund via Stripe API dentro do painel** (aprovado)
4. **Gerenciar usuários** — reset senha (dispara email Resend), desativar/reativar, mudar role, desbloquear após falhas
5. **Gerenciar tenants** — editar branding, suspender soft-delete com restauração, forçar downgrade
6. **Custom domain dashboard** — status Cloudflare for SaaS, re-validar, revogar
7. **Audit log navegável** — filtros por tenant, usuário, ação, período
8. **System controls** — feature flags (já existe via `system_settings`), modo manutenção, broadcast banner global ou por tenant
9. **Exportar dados de tenant** — CSV/JSON (LGPD, portabilidade)

### 6.2 Segurança da impersonation

- RPC `start_impersonation(target_user_id uuid) RETURNS jsonb` — só superadmin executa, retorna JWT claim `impersonating_user_id` + `impersonation_exp` (30min)
- Middleware frontend detecta claim e:
  - Injeta banner vermelho fixo
  - Bloqueia: alterar senha, deletar dados, pagamentos
  - Permite: navegação, leitura, algumas escritas limitadas (útil para reproduzir bug)
- Log em `audit_log` com `action = 'impersonate_start'` / `'impersonate_end'` / `'impersonate_action'`
- Ações destrutivas (deletar tenant, mudar role para `superadmin`, refund grande) exigem re-auth com senha do próprio super admin

### 6.3 Integrações que o painel chama (Edge Functions)

| Edge Function | O que faz |
|---|---|
| `stripe-admin-refund` | Chama Stripe API `POST /refunds`, loga no audit |
| `stripe-admin-update-subscription` | Mudar plano manual, estender trial, cancelar |
| `cloudflare-hostname-retry` | Re-validar ou revogar custom hostname |
| `admin-impersonate-start` | Cria JWT com claim, loga audit |
| `admin-tenant-export` | Gera CSV/JSON com dados do tenant (LGPD) |
| `admin-broadcast` | Cria banner em `system_settings` (global ou por tenant) |

### 6.4 Páginas admin

- `/admin` (dashboard) — KPIs: MRR, tenants ativos, trials expirando, churn
- `/admin/tenants` — CRUD completo
- `/admin/users` — CRUD + impersonate
- `/admin/subscriptions` — refund, extend trial, mudar plano
- `/admin/custom-domains` — **nova**, status Cloudflare
- `/admin/audit-log` — **nova**, navegável
- `/admin/broadcasts` — **nova**, criação de banners
- `/admin/support` — tickets (já existe, expandir)
- `/admin/settings` — system_settings, feature flags
- `/admin/impersonation-log` — **nova**, auditoria dedicada

---

## 7. Migrations necessárias (ordem de aplicação)

Numeração sugerida com prefixo `20260418*`:

1. **`20260418_001_add_student_role`** — adiciona `'student'` ao enum `user_role`
2. **`20260418_002_extend_tenants_schema`** — `is_solo`, `display_name`, `custom_domain_status`, `cloudflare_hostname_id`, `branding_enabled_at`
3. **`20260418_003_create_plans_table`** — tabela `plans` + seed dos 9 tiers
4. **`20260418_004_add_plan_id_to_subscriptions`** — FK para `plans`, backfill, manter enum `subscription_plan` como legado
5. **`20260418_005_create_classes_and_enrollments`** — tabelas `classes` e `class_enrollments` (turmas e matrículas de alunos)
6. **`20260418_006_rpc_create_student_account`** — RPC para signup de Aluno B2C
7. **`20260418_007_rpc_get_tenant_by_host`** — RPC pública para resolver tenant por subdomain/custom_domain
8. **`20260418_008_rpc_start_impersonation`** — RPC de impersonation com TTL
9. **`20260418_009_enforcement_triggers`** — triggers `check_plan_limit()` em turmas, alunos, professores, projetos
10. **`20260418_010_rls_policies_students_and_enrollments`** — policies para novos roles e tabelas
11. **`20260418_011_audit_triggers_extended`** — triggers de audit para impersonation, custom_domain, plano changes

**Nota crítica:** o repo local tem migrations com nomes `subscribers` e enum `essentials`, mas o banco real usa `subscriptions` e enum `free`. As migrations novas **devem refletir o schema real** (verificado via MCP), não o repo. Uma migration de reconciliação pode ser necessária se o repo for fonte da verdade.

---

## 8. Stripe — produtos, prices, webhooks

### 8.1 Produtos e prices

Para cada um dos 6 tiers pagos (Pro e Premium de cada perfil; Free não tem price), criar 2 prices no Stripe (monthly + annual com 20% off), em 2 moedas (BRL + USD) = **24 `stripe_price_ids`** no total.

Sugestão de naming:
- Product: `escola_pro`, `escola_premium`, `professor_pro`, etc.
- Price: `escola_pro_monthly_brl`, `escola_pro_annual_usd`, etc.

Salvar IDs em `plans.stripe_price_ids`:
```json
{
  "BRL_monthly": "price_1AbcBRL",
  "BRL_annual":  "price_1AbcBRLY",
  "USD_monthly": "price_1AbcUSD",
  "USD_annual":  "price_1AbcUSDY"
}
```

### 8.2 Edge Functions

- `create-checkout-session` — recebe `{ plan_id, currency, billing_cycle }`, cria Checkout Session, retorna URL
- `stripe-webhook` — handler para eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Atualiza `subscriptions.plan_id`, `status`, `current_period_end`
- `create-billing-portal` — gera URL do Stripe Billing Portal para usuário gerenciar assinatura

### 8.3 Moeda

Detectada pelo locale do i18n (se `pt-BR` → BRL, se `en` ou `es` → USD, configurável). Override manual pelo usuário no checkout (dropdown).

---

## 9. Roadmap em 5 fases (aprovado)

### Fase 1 — Foundation + 3 perfis no ar (1-2 semanas)

- Migrations 001-007 e 010
- Signup: adicionar botão "Sou Aluno / Estudar em casa"
- RPC `create_student_account()`
- Cloudflare zone setup, DNS, SSL, proxy
- Deploy `app.cliqueexatas.com.br` como URL principal

**Deliverable:** amigos professores, escolas, e alunos se cadastram no tier Free e usam o app.

### Fase 2 — Monetização (1-2 semanas)

- Stripe products/prices (6 tiers pagos × 2 moedas × 2 ciclos = **24 `stripe_price_ids`**; tiers Free não têm price)
- Edge Functions `create-checkout-session`, `stripe-webhook`, `create-billing-portal`
- Triggers de enforcement (migration 009)
- Landing `/pricing` com matriz 3×3
- Flow upgrade/downgrade in-app

**Deliverable:** primeiro MRR.

### Fase 3 — White-label (3-5 dias — reduzido)

- UI `/settings/branding` (upload logo via Supabase Storage bucket `tenant-assets`, picker de cores)
- ThemeProvider dinâmico com resolução de tenant por host (RPC `get_tenant_by_host`)
- Subdomínio wildcard funcionando
- Edge Functions `add-custom-domain`, `check-custom-domain-status`
- UI `/settings/custom-domain` para Escola e Professor Premium

**Deliverable:** Escola Pro customiza, Premium ganha domínio próprio.

### Fase 4 — Super Admin completo (1 semana)

- RPC `start_impersonation` + middleware + banner (migration 008, 011)
- `/admin/custom-domains` com integração Cloudflare
- Edge Function `stripe-admin-refund`, integração em `/admin/subscriptions`
- `/admin/audit-log`, `/admin/broadcasts`, `/admin/impersonation-log`
- Export CSV (`admin-tenant-export`)

**Deliverable:** suporte 100% via painel, sem SQL.

### Fase 5 — Polimento contínuo

- Sentry DSN ativo + Resend API key
- Paginação admin tables
- 2FA superadmin (opcional)
- Performance audit
- Rate limiting Supabase
- Landing `cliqueexatas.com.br` polida

---

## 10. Riscos e mitigations

| Risco | Mitigation |
|---|---|
| Divergência schema repo vs. banco real | Fazer migration de reconciliação na Fase 1; tratar banco como fonte da verdade |
| Cloudflare for SaaS requer plano específico | Confirmar conta Cloudflare tem SaaS antes de Fase 3; se não, adiar custom domain sem bloquear fase |
| Stripe fees em Aluno Pro (R$ 19) apertam margem (~7%) | Considerar aumentar para R$ 24 ou focar plano anual (pagamento único, menos fees) |
| Impersonation → vazamento de dados | TTL 30min + bloqueios de escrita sensível + audit obrigatório + re-auth para ações destrutivas |
| i18n quebra com branding dinâmico | Testar FOUC com CSS vars injetadas antes do React mount; fallback para branding default |
| Volume de migrations (~11) | Aplicar uma por vez, testar em branch Supabase de dev, depois merge para main |

---

## 11. Fora de escopo (este spec não cobre)

- 2FA obrigatório para usuários comuns (Fase 5+)
- SSO/SAML para escolas Enterprise (futuro)
- Marketplace de conteúdo entre professores (futuro)
- App mobile nativo (fora de escopo — já tem PWA via Vite)
- IA de geometria para aluno Premium (está no plano como teaser, mas implementação é outro spec)
- Integração com Google Classroom / Microsoft Teams (futuro)

---

## 12. Aprovações

- Seção 1 (3 perfis) — ✅ aprovado
- Seção 2 (planos + matriz + multi-moeda) — ✅ aprovado
- Seção 3 (white-label + Cloudflare for SaaS, custom domain para Escola E Professor Premium) — ✅ aprovado
- Seção 4 (infra Vercel + Supabase + Cloudflare na frente, **sem migrar**) — ✅ aprovado
- Seção 5 (super admin: impersonation 30min + banner + audit, refund via painel) — ✅ aprovado
- Seção 6 (roadmap 5 fases sequenciais, nada removido) — ✅ aprovado

---

## 13. Próximos passos

1. Usuário revisa este spec e aprova
2. Invocar skill `writing-plans` para gerar plano de implementação detalhado baseado neste spec
3. Plano de implementação será quebrado por fase, com checklist executável
