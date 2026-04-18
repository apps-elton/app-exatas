# Fase 1 Foundation — 3 Perfis no Ar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Colocar no ar o sistema com os 3 perfis de signup (Escola, Professor autônomo, Aluno B2C) no tier Free, rodando em `app.clickexatas.com.br` com Cloudflare na frente da Vercel e banco Supabase preparado para as fases seguintes (monetização, white-label, super admin).

**Architecture:** Usa a stack existente (Vite + React + Supabase + Vercel) sem migração. Adiciona schema novo no Supabase (role `student`, tabela `plans`, tabela `classes`, tabela `class_enrollments`, colunas em `tenants`, 2 RPCs novas). Adiciona 3º botão "Sou Aluno" no Signup.tsx. Configura Cloudflare zone e proxies na frente de Vercel.

**Tech Stack:**
- Backend/DB: Supabase Postgres (project `duqrveawgopqohrfiogz`), RLS, RPCs em PL/pgSQL
- Frontend: Vite + React 18 + TypeScript + react-i18next + @supabase/supabase-js
- Tests: Vitest (já configurado, testes em `src/**/__tests__/*.test.ts`)
- Infra: Vercel (atual) + Cloudflare (novo proxy)
- MCP Supabase: autenticado e scoped para o projeto, use `apply_migration`/`execute_sql` para DB

**Pré-requisitos antes de começar:**
- MCP Supabase autenticado e funcionando (testar com `list_tables`)
- Conta Vercel com acesso de admin ao projeto
- Conta Cloudflare com zone `clickexatas.com.br` ou capacidade de criá-la
- `git` limpo em `main` com working tree limpo (faça commit/stash antes de começar)

---

## File Structure

### Arquivos NOVOS

| Path | Responsabilidade |
|---|---|
| `supabase/migrations/20260418001_add_student_role.sql` | Migration: adiciona `'student'` ao enum `user_role` |
| `supabase/migrations/20260418002_extend_tenants.sql` | Migration: novas colunas em `tenants` |
| `supabase/migrations/20260418003_create_plans.sql` | Migration: tabela `plans` + RLS |
| `supabase/migrations/20260418004_seed_plans.sql` | Migration: seed dos 9 tiers |
| `supabase/migrations/20260418005_add_plan_id_to_subscriptions.sql` | Migration: FK `subscriptions.plan_id` + backfill |
| `supabase/migrations/20260418006_create_classes.sql` | Migration: tabela `classes` + RLS |
| `supabase/migrations/20260418007_create_class_enrollments.sql` | Migration: tabela `class_enrollments` + RLS |
| `supabase/migrations/20260418008_rls_for_students.sql` | Migration: policies para role `student` |
| `supabase/migrations/20260418009_rpc_create_student_account.sql` | Migration: RPC `create_student_account()` |
| `supabase/migrations/20260418010_rpc_get_tenant_by_host.sql` | Migration: RPC pública `get_tenant_by_host()` |
| `src/lib/__tests__/signup-validation.test.ts` | Unit tests pra validação de signup do aluno |
| `src/lib/signup-validation.ts` | Helper puro de validação extraído do Signup.tsx (facilita teste) |
| `docs/infra/cloudflare-setup.md` | Documentação passo-a-passo da config Cloudflare |
| `docs/infra/vercel-domains.md` | Documentação passo-a-passo da config Vercel domains |

### Arquivos MODIFICADOS

| Path | Mudança |
|---|---|
| `src/pages/Signup.tsx` | Adicionar `'student'` em AccountType, novo card de escolha, flow de submit do aluno |
| `src/integrations/supabase/types.ts` | Regenerar via Supabase CLI/MCP após migrations |
| `public/locales/*/translation.json` (todos idiomas) | Adicionar keys: `signup.student_title`, `signup.student_description`, `signup.student_register_title`, `signup.student_subtitle`, `signup.submit_student`, `signup.success_student` |

---

## Task 1: Adicionar role 'student' ao enum user_role

**Files:**
- Create: `supabase/migrations/20260418001_add_student_role.sql`

- [ ] **Step 1: Verificar estado atual do enum (deve ter 3 valores)**

Execute via MCP Supabase:

```sql
SELECT unnest(enum_range(NULL::user_role))::text AS role;
```

Expected: retorna 3 linhas: `superadmin`, `admin`, `teacher`. Se já retornar `student`, pule esta tarefa.

- [ ] **Step 2: Criar arquivo de migration**

Create `supabase/migrations/20260418001_add_student_role.sql`:

```sql
-- Add 'student' role to user_role enum
-- Used by Aluno B2C signup (conta pessoal sem tenant)

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'student';

-- Note: Postgres requires ALTER TYPE ADD VALUE to be outside a transaction block.
-- Supabase MCP apply_migration handles this correctly.
```

- [ ] **Step 3: Aplicar migration via MCP**

Invoke tool `mcp__supabase__apply_migration`:
- `name`: `add_student_role`
- `query`: contents of the SQL file above

- [ ] **Step 4: Verificar que o enum agora tem 4 valores**

Execute via MCP:

```sql
SELECT unnest(enum_range(NULL::user_role))::text AS role ORDER BY 1;
```

Expected: 4 linhas — `admin`, `student`, `superadmin`, `teacher`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260418001_add_student_role.sql
git commit -m "feat(db): add 'student' role to user_role enum for B2C accounts"
```

---

## Task 2: Estender schema de tenants

**Files:**
- Create: `supabase/migrations/20260418002_extend_tenants.sql`

- [ ] **Step 1: Verificar colunas atuais de tenants**

Execute via MCP:

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tenants'
ORDER BY ordinal_position;
```

Expected: confirmar que NÃO existem `is_solo`, `display_name`, `custom_domain_status`, `cloudflare_hostname_id`, `branding_enabled_at` (se alguma já existir, remova do SQL abaixo).

- [ ] **Step 2: Criar arquivo de migration**

Create `supabase/migrations/20260418002_extend_tenants.sql`:

```sql
-- Extend tenants table for solo-tenant flag, custom domain state (Cloudflare for SaaS),
-- and display branding.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS is_solo boolean NOT NULL DEFAULT false;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS display_name text;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS custom_domain_status text
    CHECK (custom_domain_status IN ('pending', 'active', 'failed', 'revoked'));

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS cloudflare_hostname_id text;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS branding_enabled_at timestamptz;

-- Unique index on cloudflare_hostname_id when not null
CREATE UNIQUE INDEX IF NOT EXISTS tenants_cloudflare_hostname_id_idx
  ON public.tenants(cloudflare_hostname_id)
  WHERE cloudflare_hostname_id IS NOT NULL;

COMMENT ON COLUMN public.tenants.is_solo IS
  'True para tenants criados por professor autônomo (1 membro), false para escolas';
COMMENT ON COLUMN public.tenants.custom_domain_status IS
  'Estado da validação Cloudflare for SaaS do domínio custom';
```

- [ ] **Step 3: Aplicar migration via MCP**

Invoke `mcp__supabase__apply_migration`:
- `name`: `extend_tenants`
- `query`: contents of the SQL file above

- [ ] **Step 4: Verificar colunas novas**

Execute via MCP:

```sql
SELECT column_name, data_type, is_nullable FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tenants'
  AND column_name IN ('is_solo', 'display_name', 'custom_domain_status', 'cloudflare_hostname_id', 'branding_enabled_at')
ORDER BY column_name;
```

Expected: 5 linhas retornadas com os tipos corretos.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260418002_extend_tenants.sql
git commit -m "feat(db): extend tenants with solo flag, display_name, custom domain state"
```

---

## Task 3: Criar tabela plans

**Files:**
- Create: `supabase/migrations/20260418003_create_plans.sql`

- [ ] **Step 1: Verificar que tabela plans NÃO existe**

Execute via MCP:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'plans'
) AS plans_exists;
```

Expected: `plans_exists = false`. Se `true`, pule para Task 4.

- [ ] **Step 2: Criar arquivo de migration**

Create `supabase/migrations/20260418003_create_plans.sql`:

```sql
-- Plans table: substitui o enum subscription_plan por uma tabela editável.
-- Cada plano é único por (profile_type, tier).

CREATE TABLE public.plans (
  id               text PRIMARY KEY,
  profile_type     text NOT NULL CHECK (profile_type IN ('school', 'teacher', 'student')),
  tier             text NOT NULL CHECK (tier IN ('free', 'pro', 'premium')),
  name             text NOT NULL,
  description      text,
  prices           jsonb NOT NULL DEFAULT '{}'::jsonb,
  stripe_price_ids jsonb NOT NULL DEFAULT '{}'::jsonb,
  limits           jsonb NOT NULL DEFAULT '{}'::jsonb,
  active           boolean NOT NULL DEFAULT true,
  sort_order       integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_type, tier)
);

-- Auto-update updated_at
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: todos podem ler planos ativos (página pública de pricing).
-- Só superadmin pode modificar.
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_select_active_public"
  ON public.plans FOR SELECT
  USING (active = true);

CREATE POLICY "plans_select_superadmin"
  ON public.plans FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  ));

CREATE POLICY "plans_insert_superadmin"
  ON public.plans FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  ));

CREATE POLICY "plans_update_superadmin"
  ON public.plans FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  ));

CREATE POLICY "plans_no_delete"
  ON public.plans FOR DELETE
  USING (false);

COMMENT ON TABLE public.plans IS
  'Planos de assinatura com 9 tiers (3 perfis x free/pro/premium)';
```

- [ ] **Step 3: Aplicar migration via MCP**

Invoke `mcp__supabase__apply_migration`:
- `name`: `create_plans`
- `query`: contents of SQL file

- [ ] **Step 4: Verificar tabela e policies**

Execute via MCP:

```sql
SELECT count(*) AS policies_count FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'plans';
```

Expected: `policies_count = 5` (select public, select superadmin, insert superadmin, update superadmin, no delete).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260418003_create_plans.sql
git commit -m "feat(db): create plans table with RLS policies"
```

---

## Task 4: Seed dos 9 planos iniciais

**Files:**
- Create: `supabase/migrations/20260418004_seed_plans.sql`

- [ ] **Step 1: Criar arquivo de migration com seed**

Create `supabase/migrations/20260418004_seed_plans.sql`:

```sql
-- Seed inicial dos 9 planos.
-- Preços em centavos. stripe_price_ids ficam vazios — serão preenchidos na Fase 2.
-- Uso INSERT ... ON CONFLICT DO NOTHING para idempotência.

INSERT INTO public.plans (id, profile_type, tier, name, description, prices, limits, sort_order) VALUES

-- ESCOLA
('school_free', 'school', 'free', 'Escola Free',
 'Comece gratuito: 1 turma, 5 alunos, 1 professor',
 '{"BRL": 0, "USD": 0}'::jsonb,
 '{"turmas": 1, "alunos": 5, "professores": 1, "projetos": 5, "storage_mb": 100, "branding": false, "custom_domain": false, "subdomain": false, "ads": false, "export": false}'::jsonb,
 10),

('school_pro', 'school', 'pro', 'Escola Pro',
 '10 turmas, 100 alunos, 5 professores, branding personalizado',
 '{"BRL": 14900, "USD": 2900}'::jsonb,
 '{"turmas": 10, "alunos": 100, "professores": 5, "projetos": 100, "storage_mb": 1000, "branding": true, "custom_domain": false, "subdomain": true, "ads": false, "export": true}'::jsonb,
 20),

('school_premium', 'school', 'premium', 'Escola Premium',
 'Ilimitado + domínio próprio + suporte prioritário',
 '{"BRL": 44900, "USD": 8900}'::jsonb,
 '{"turmas": null, "alunos": null, "professores": null, "projetos": null, "storage_mb": 10000, "branding": true, "custom_domain": true, "subdomain": true, "ads": false, "export": true}'::jsonb,
 30),

-- PROFESSOR AUTÔNOMO
('teacher_free', 'teacher', 'free', 'Professor Free',
 'Comece gratuito: 1 turma, 10 alunos, 3 projetos',
 '{"BRL": 0, "USD": 0}'::jsonb,
 '{"turmas": 1, "alunos": 10, "professores": 1, "projetos": 3, "storage_mb": 100, "branding": false, "custom_domain": false, "subdomain": false, "ads": false, "export": false}'::jsonb,
 40),

('teacher_pro', 'teacher', 'pro', 'Professor Pro',
 '5 turmas, 50 alunos, 20 projetos, branding pessoal',
 '{"BRL": 3900, "USD": 900}'::jsonb,
 '{"turmas": 5, "alunos": 50, "professores": 1, "projetos": 20, "storage_mb": 500, "branding": true, "custom_domain": false, "subdomain": true, "ads": false, "export": true}'::jsonb,
 50),

('teacher_premium', 'teacher', 'premium', 'Professor Premium',
 'Ilimitado + domínio próprio',
 '{"BRL": 8900, "USD": 1900}'::jsonb,
 '{"turmas": null, "alunos": null, "professores": 1, "projetos": null, "storage_mb": 2000, "branding": true, "custom_domain": true, "subdomain": true, "ads": false, "export": true}'::jsonb,
 60),

-- ALUNO B2C
('student_free', 'student', 'free', 'Aluno Free',
 'Acesso básico com ads, 3 projetos pessoais',
 '{"BRL": 0, "USD": 0}'::jsonb,
 '{"turmas": 0, "alunos": 0, "professores": 0, "projetos": 3, "storage_mb": 50, "branding": false, "custom_domain": false, "subdomain": false, "ads": true, "export": false}'::jsonb,
 70),

('student_pro', 'student', 'pro', 'Aluno Pro',
 'Projetos ilimitados, sem ads, com export',
 '{"BRL": 1900, "USD": 499}'::jsonb,
 '{"turmas": 0, "alunos": 0, "professores": 0, "projetos": null, "storage_mb": 500, "branding": false, "custom_domain": false, "subdomain": false, "ads": false, "export": true}'::jsonb,
 80),

('student_premium', 'student', 'premium', 'Aluno Premium',
 'Pro + anotações avançadas (IA futura)',
 '{"BRL": 3900, "USD": 999}'::jsonb,
 '{"turmas": 0, "alunos": 0, "professores": 0, "projetos": null, "storage_mb": 2000, "branding": false, "custom_domain": false, "subdomain": false, "ads": false, "export": true}'::jsonb,
 90)

ON CONFLICT (id) DO NOTHING;
```

- [ ] **Step 2: Aplicar migration via MCP**

Invoke `mcp__supabase__apply_migration`:
- `name`: `seed_plans`
- `query`: contents of SQL file

- [ ] **Step 3: Verificar seed**

Execute via MCP:

```sql
SELECT id, profile_type, tier, (prices->>'BRL')::int AS price_brl_cents
FROM public.plans ORDER BY sort_order;
```

Expected: 9 linhas. Valores de `price_brl_cents`: `0, 14900, 44900, 0, 3900, 8900, 0, 1900, 3900`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260418004_seed_plans.sql
git commit -m "feat(db): seed 9 initial plans (3 profiles x free/pro/premium)"
```

---

## Task 5: Adicionar plan_id FK em subscriptions

**Files:**
- Create: `supabase/migrations/20260418005_add_plan_id_to_subscriptions.sql`

- [ ] **Step 1: Verificar o enum atual de subscription_plan**

Execute via MCP:

```sql
SELECT unnest(enum_range(NULL::subscription_plan))::text AS plan_value;
```

Expected: `free`, `professor`, `institution`.

- [ ] **Step 2: Criar arquivo de migration**

Create `supabase/migrations/20260418005_add_plan_id_to_subscriptions.sql`:

```sql
-- Add plan_id FK to subscriptions, backfill from enum, keep enum as legacy.
-- Strategy: migrate existing 'free' -> 'teacher_free' (since most existing users are teachers),
-- 'professor' -> 'teacher_pro', 'institution' -> 'school_pro'.
-- Superadmin can reassign via painel após migração.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_id text REFERENCES public.plans(id);

-- Backfill plan_id based on existing enum value and tenant.is_solo (if tenant exists)
-- For B2C users (tenant_id IS NULL), free -> student_free (rare in current data, should be 0 rows)
UPDATE public.subscriptions s
SET plan_id = CASE
  WHEN s.tenant_id IS NULL AND s.plan = 'free' THEN 'student_free'
  WHEN EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = s.tenant_id AND t.is_solo = true)
    THEN CASE s.plan
      WHEN 'free'::subscription_plan THEN 'teacher_free'
      WHEN 'professor'::subscription_plan THEN 'teacher_pro'
      WHEN 'institution'::subscription_plan THEN 'school_pro'
    END
  ELSE CASE s.plan
    WHEN 'free'::subscription_plan THEN 'school_free'
    WHEN 'professor'::subscription_plan THEN 'teacher_pro'
    WHEN 'institution'::subscription_plan THEN 'school_pro'
  END
END
WHERE s.plan_id IS NULL;

-- For any remaining rows (shouldn't exist), default to school_free
UPDATE public.subscriptions SET plan_id = 'school_free' WHERE plan_id IS NULL;

-- Now make plan_id NOT NULL
ALTER TABLE public.subscriptions ALTER COLUMN plan_id SET NOT NULL;

-- Index for lookups
CREATE INDEX IF NOT EXISTS subscriptions_plan_id_idx ON public.subscriptions(plan_id);

COMMENT ON COLUMN public.subscriptions.plan_id IS
  'FK para plans.id. Substitui o enum legacy subscription_plan.';
COMMENT ON COLUMN public.subscriptions.plan IS
  'LEGACY: use plan_id. Manter por compatibilidade até Fase 2.';
```

- [ ] **Step 3: Aplicar migration via MCP**

Invoke `mcp__supabase__apply_migration`:
- `name`: `add_plan_id_to_subscriptions`
- `query`: contents of SQL file

- [ ] **Step 4: Verificar backfill**

Execute via MCP:

```sql
SELECT count(*) AS total, count(plan_id) AS with_plan_id
FROM public.subscriptions;
```

Expected: `total = with_plan_id` (todas as subscriptions têm plan_id agora).

```sql
SELECT plan_id, count(*) FROM public.subscriptions GROUP BY plan_id ORDER BY plan_id;
```

Expected: distribuição coerente (geralmente só `school_free` ou `teacher_free` em dev).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260418005_add_plan_id_to_subscriptions.sql
git commit -m "feat(db): add plan_id FK to subscriptions with backfill from legacy enum"
```

---

## Task 6: Criar tabela classes

**Files:**
- Create: `supabase/migrations/20260418006_create_classes.sql`

- [ ] **Step 1: Criar arquivo de migration**

Create `supabase/migrations/20260418006_create_classes.sql`:

```sql
-- Turmas: criadas pelo owner de um tenant (escola admin ou professor autônomo).
-- Uma turma pertence a um tenant e é gerida por um professor (profiles.id com role teacher ou admin).

CREATE TABLE public.classes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  teacher_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name         text NOT NULL,
  description  text,
  join_code    text UNIQUE,        -- código curto para aluno entrar (6 chars)
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX classes_tenant_id_idx ON public.classes(tenant_id);
CREATE INDEX classes_teacher_id_idx ON public.classes(teacher_id);

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Teachers/admins veem turmas do seu tenant
CREATE POLICY "classes_select_tenant"
  ON public.classes FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Superadmin vê todas
CREATE POLICY "classes_select_superadmin"
  ON public.classes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  ));

-- Criação: só teacher/admin do tenant, e teacher_id precisa ser o próprio criador
CREATE POLICY "classes_insert_own_tenant"
  ON public.classes FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    AND teacher_id = auth.uid()
  );

-- Update: só o professor dono ou admin do mesmo tenant
CREATE POLICY "classes_update_own"
  ON public.classes FOR UPDATE
  USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = classes.tenant_id
        AND p.role IN ('admin', 'superadmin')
    )
  );

-- Delete: só superadmin (soft-delete preferido via is_active)
CREATE POLICY "classes_delete_superadmin"
  ON public.classes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  ));

COMMENT ON TABLE public.classes IS
  'Turmas criadas por escolas ou professores autônomos';
COMMENT ON COLUMN public.classes.join_code IS
  'Código curto (6 chars) para aluno entrar. Gerado via trigger.';
```

- [ ] **Step 2: Aplicar migration via MCP**

Invoke `mcp__supabase__apply_migration`:
- `name`: `create_classes`
- `query`: contents of SQL file

- [ ] **Step 3: Verificar tabela e policies**

Execute via MCP:

```sql
SELECT count(*) AS policies_count FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'classes';
```

Expected: `policies_count = 5`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260418006_create_classes.sql
git commit -m "feat(db): create classes table for turmas with RLS"
```

---

## Task 7: Criar tabela class_enrollments

**Files:**
- Create: `supabase/migrations/20260418007_create_class_enrollments.sql`

- [ ] **Step 1: Criar arquivo de migration**

Create `supabase/migrations/20260418007_create_class_enrollments.sql`:

```sql
-- class_enrollments: matrícula de alunos em turmas.
-- Um aluno (profiles com role=student) pode entrar numa turma sem virar membro do tenant.
-- tenant_id é denormalizado pra facilitar enforcement de limites.

CREATE TABLE public.class_enrollments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invited_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  invited_email text,
  joined_at   timestamptz,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id)
);

CREATE INDEX class_enrollments_class_id_idx ON public.class_enrollments(class_id);
CREATE INDEX class_enrollments_student_id_idx ON public.class_enrollments(student_id);
CREATE INDEX class_enrollments_tenant_id_idx ON public.class_enrollments(tenant_id);

-- RLS
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

-- Aluno vê matrículas próprias
CREATE POLICY "enrollments_select_own"
  ON public.class_enrollments FOR SELECT
  USING (student_id = auth.uid());

-- Professores veem matrículas das suas turmas
CREATE POLICY "enrollments_select_teacher"
  ON public.class_enrollments FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM public.classes WHERE teacher_id = auth.uid()
    )
  );

-- Admin do tenant vê todas as matrículas do tenant
CREATE POLICY "enrollments_select_tenant_admin"
  ON public.class_enrollments FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Superadmin vê tudo (já coberto pela anterior se tenant_id igual, mas explicito para cross-tenant)
CREATE POLICY "enrollments_select_superadmin"
  ON public.class_enrollments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'
  ));

-- Professor pode matricular aluno na sua turma
CREATE POLICY "enrollments_insert_teacher"
  ON public.class_enrollments FOR INSERT
  WITH CHECK (
    class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
    AND tenant_id = (SELECT tenant_id FROM public.classes WHERE id = class_id)
  );

-- Aluno pode se auto-matricular via join_code (fluxo: UI chama RPC que valida code e faz INSERT com SECURITY DEFINER)
-- Por ora, sem policy direta de self-insert — vai usar RPC.

-- Update: só professor ou admin
CREATE POLICY "enrollments_update_teacher_or_admin"
  ON public.class_enrollments FOR UPDATE
  USING (
    class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
    OR tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Delete: só superadmin (aluno pode ser removido via is_active = false)
CREATE POLICY "enrollments_delete_superadmin"
  ON public.class_enrollments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'
  ));

COMMENT ON TABLE public.class_enrollments IS
  'Matrículas de alunos em turmas. Aluno NÃO vira membro do tenant — apenas tem vínculo com a turma.';
```

- [ ] **Step 2: Aplicar migration via MCP**

Invoke `mcp__supabase__apply_migration`:
- `name`: `create_class_enrollments`
- `query`: contents of SQL file

- [ ] **Step 3: Verificar tabela e policies**

Execute via MCP:

```sql
SELECT count(*) AS policies_count FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'class_enrollments';
```

Expected: `policies_count = 6`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260418007_create_class_enrollments.sql
git commit -m "feat(db): create class_enrollments table for student-class links"
```

---

## Task 8: Policies adicionais para role student

**Files:**
- Create: `supabase/migrations/20260418008_rls_for_students.sql`

- [ ] **Step 1: Criar arquivo de migration**

Create `supabase/migrations/20260418008_rls_for_students.sql`:

```sql
-- Policies específicas para role 'student'.
-- Student tem tenant_id = NULL (conta B2C pessoal) ou pode ser convidado de turmas (via class_enrollments).
-- Student só pode ver seu próprio profile e subscriptions, e seus projetos pessoais.

-- Permite que student acesse seus próprios projetos (projetos com user_id = student.id e tenant_id IS NULL)
-- A policy projects_select_own já cobre (user_id = auth.uid()), então sem mudança necessária aqui.

-- Student pode ler plans (já coberto pela policy plans_select_active_public)

-- Garantir que student pode ler tenants públicos via RPC get_tenant_by_host (Task 10 cria RPC com SECURITY DEFINER)

-- Bloqueio explícito: student não pode inserir em tenant_invites
CREATE POLICY "tenant_invites_no_student_insert"
  ON public.tenant_invites FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Student pode ler turmas em que está matriculado (via class_enrollments), mas não outras.
-- Adicionar policy em classes:
CREATE POLICY "classes_select_enrolled_student"
  ON public.classes FOR SELECT
  USING (
    id IN (
      SELECT class_id FROM public.class_enrollments
      WHERE student_id = auth.uid() AND is_active = true
    )
  );

-- Student pode ver profile do professor das turmas em que está matriculado (para UI "aula com X")
-- Isso já é coberto se a policy profiles_select_tenant não bloquear explicitamente.
-- Adicionar policy específica para esse caso:
CREATE POLICY "profiles_select_teacher_of_enrolled_class"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT c.teacher_id FROM public.classes c
      JOIN public.class_enrollments e ON e.class_id = c.id
      WHERE e.student_id = auth.uid() AND e.is_active = true
    )
  );

COMMENT ON POLICY "classes_select_enrolled_student" ON public.classes IS
  'Student vê turmas em que está ativamente matriculado';
```

- [ ] **Step 2: Aplicar migration via MCP**

Invoke `mcp__supabase__apply_migration`:
- `name`: `rls_for_students`
- `query`: contents of SQL file

- [ ] **Step 3: Verificar policies novas**

Execute via MCP:

```sql
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public'
  AND policyname IN (
    'tenant_invites_no_student_insert',
    'classes_select_enrolled_student',
    'profiles_select_teacher_of_enrolled_class'
  );
```

Expected: 3 linhas retornadas.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260418008_rls_for_students.sql
git commit -m "feat(db): add RLS policies for student role and enrolled classes"
```

---

## Task 9: RPC create_student_account

**Files:**
- Create: `supabase/migrations/20260418009_rpc_create_student_account.sql`

- [ ] **Step 1: Criar arquivo de migration**

Create `supabase/migrations/20260418009_rpc_create_student_account.sql`:

```sql
-- RPC para finalizar signup de aluno B2C após auth.signUp ter criado o user.
-- Requisitos: usuário já autenticado (JWT válido), profile.tenant_id ficará NULL.
-- Atualiza role para 'student' e cria subscription no plano student_free.

CREATE OR REPLACE FUNCTION public.create_student_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing_profile public.profiles;
  v_existing_sub public.subscriptions;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- Buscar profile criado pelo trigger de signup
  SELECT * INTO v_existing_profile FROM public.profiles WHERE id = v_user_id;

  IF v_existing_profile.id IS NULL THEN
    RAISE EXCEPTION 'Profile not found for current user' USING ERRCODE = 'P0002';
  END IF;

  -- Se já é student configurado, retornar OK (idempotente)
  IF v_existing_profile.role = 'student' AND v_existing_profile.tenant_id IS NULL THEN
    SELECT * INTO v_existing_sub FROM public.subscriptions WHERE user_id = v_user_id LIMIT 1;
    IF v_existing_sub.plan_id = 'student_free' THEN
      RETURN jsonb_build_object('ok', true, 'already_configured', true);
    END IF;
  END IF;

  -- Se profile já está vinculado a um tenant, não permitir conversão (evita bypass)
  IF v_existing_profile.tenant_id IS NOT NULL THEN
    RAISE EXCEPTION 'User is already linked to a tenant; cannot convert to student'
      USING ERRCODE = '42501';
  END IF;

  -- Atualizar role para student
  UPDATE public.profiles
  SET role = 'student', tenant_id = NULL, updated_at = now()
  WHERE id = v_user_id;

  -- Criar subscription student_free (ou atualizar se já existe)
  INSERT INTO public.subscriptions (user_id, tenant_id, plan, plan_id, status, projects_limit, storage_limit_mb)
  VALUES (v_user_id, NULL, 'free'::subscription_plan, 'student_free', 'active'::subscription_status, 3, 50)
  ON CONFLICT (user_id) DO UPDATE
    SET plan_id = 'student_free',
        plan = 'free'::subscription_plan,
        status = 'active'::subscription_status,
        projects_limit = 3,
        storage_limit_mb = 50,
        tenant_id = NULL,
        updated_at = now();

  -- Audit log
  INSERT INTO public.audit_log (actor_id, action, target_type, target_id, metadata)
  VALUES (v_user_id, 'student_account_created', 'profile', v_user_id::text,
          jsonb_build_object('plan_id', 'student_free'));

  RETURN jsonb_build_object('ok', true, 'user_id', v_user_id, 'plan_id', 'student_free');
END;
$$;

-- Permitir que qualquer usuário autenticado chame (a função valida auth.uid() internamente)
REVOKE ALL ON FUNCTION public.create_student_account() FROM public;
GRANT EXECUTE ON FUNCTION public.create_student_account() TO authenticated;

COMMENT ON FUNCTION public.create_student_account() IS
  'Finaliza signup de aluno B2C: muda role para student, cria subscription student_free. Idempotente.';
```

- [ ] **Step 2: Verificar que subscriptions.user_id tem UNIQUE constraint (senão ON CONFLICT falha)**

Execute via MCP:

```sql
SELECT conname FROM pg_constraint
WHERE conrelid = 'public.subscriptions'::regclass
  AND contype IN ('p', 'u')
  AND conkey::text LIKE '%' || (
    SELECT attnum::text FROM pg_attribute
    WHERE attrelid = 'public.subscriptions'::regclass AND attname = 'user_id'
  ) || '%';
```

Expected: ao menos uma linha retornada com constraint UNIQUE ou PK em `user_id`.

**Se nenhuma constraint:** adicionar `ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);` no topo do arquivo de migration. Se já existe, pular.

- [ ] **Step 3: Aplicar migration via MCP**

Invoke `mcp__supabase__apply_migration`:
- `name`: `rpc_create_student_account`
- `query`: contents of SQL file

- [ ] **Step 4: Verificar função existe**

Execute via MCP:

```sql
SELECT proname, prosecdef FROM pg_proc
WHERE pronamespace = 'public'::regnamespace AND proname = 'create_student_account';
```

Expected: 1 linha com `prosecdef = true` (SECURITY DEFINER).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260418009_rpc_create_student_account.sql
git commit -m "feat(db): add RPC create_student_account for B2C student signup"
```

---

## Task 10: RPC get_tenant_by_host

**Files:**
- Create: `supabase/migrations/20260418010_rpc_get_tenant_by_host.sql`

- [ ] **Step 1: Criar arquivo de migration**

Create `supabase/migrations/20260418010_rpc_get_tenant_by_host.sql`:

```sql
-- RPC pública (sem auth) para o frontend resolver tenant pelo host atual.
-- Retorna apenas dados públicos de branding, não expõe info sensível.
-- Casos:
--   host = 'app.clickexatas.com.br' ou 'clickexatas.com.br' → retorna null
--   host = '{slug}.clickexatas.com.br' → match por tenants.slug
--   host = 'portal.escola.com.br' → match por tenants.custom_domain

CREATE OR REPLACE FUNCTION public.get_tenant_by_host(p_host text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_main_domain text := 'clickexatas.com.br';
  v_app_host text := 'app.clickexatas.com.br';
  v_slug text;
  v_tenant record;
BEGIN
  -- Normalizar host (lowercase, sem porta)
  p_host := lower(split_part(p_host, ':', 1));

  -- Hosts principais retornam null (sem tenant, usa branding default)
  IF p_host IN (v_main_domain, v_app_host) THEN
    RETURN NULL;
  END IF;

  -- Tentar match por custom_domain (Escola Premium)
  SELECT id, display_name, name, logo_url, primary_color, secondary_color, slug, is_active
    INTO v_tenant
  FROM public.tenants
  WHERE custom_domain = p_host
    AND custom_domain_status = 'active'
    AND is_active = true
  LIMIT 1;

  IF v_tenant.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'id', v_tenant.id,
      'display_name', COALESCE(v_tenant.display_name, v_tenant.name),
      'logo_url', v_tenant.logo_url,
      'primary_color', v_tenant.primary_color,
      'secondary_color', v_tenant.secondary_color,
      'slug', v_tenant.slug,
      'match_type', 'custom_domain'
    );
  END IF;

  -- Tentar match por subdomínio: {slug}.clickexatas.com.br
  IF p_host LIKE '%.' || v_main_domain THEN
    v_slug := split_part(p_host, '.', 1);

    SELECT id, display_name, name, logo_url, primary_color, secondary_color, slug, is_active
      INTO v_tenant
    FROM public.tenants
    WHERE slug = v_slug AND is_active = true
    LIMIT 1;

    IF v_tenant.id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'id', v_tenant.id,
        'display_name', COALESCE(v_tenant.display_name, v_tenant.name),
        'logo_url', v_tenant.logo_url,
        'primary_color', v_tenant.primary_color,
        'secondary_color', v_tenant.secondary_color,
        'slug', v_tenant.slug,
        'match_type', 'subdomain'
      );
    END IF;
  END IF;

  -- Sem match
  RETURN NULL;
END;
$$;

-- Permitir chamada anônima (sem auth)
REVOKE ALL ON FUNCTION public.get_tenant_by_host(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_tenant_by_host(text) TO anon, authenticated;

COMMENT ON FUNCTION public.get_tenant_by_host(text) IS
  'Resolve tenant pelo host HTTP. Retorna branding público ou null. Usado no bootstrap do frontend.';
```

- [ ] **Step 2: Aplicar migration via MCP**

Invoke `mcp__supabase__apply_migration`:
- `name`: `rpc_get_tenant_by_host`
- `query`: contents of SQL file

- [ ] **Step 3: Testar a função com valores controlados**

Execute via MCP:

```sql
-- Host principal deve retornar null
SELECT public.get_tenant_by_host('app.clickexatas.com.br') AS result_app;
SELECT public.get_tenant_by_host('clickexatas.com.br') AS result_main;

-- Subdomínio inexistente deve retornar null
SELECT public.get_tenant_by_host('inexistente.clickexatas.com.br') AS result_no_match;

-- Se existir algum tenant, testar com o slug dele
SELECT slug FROM public.tenants LIMIT 1;
-- Rode: SELECT public.get_tenant_by_host('<slug>.clickexatas.com.br');
```

Expected: primeiras 3 retornam `NULL`. Se houver tenant, o 4º retorna JSON com `match_type = 'subdomain'`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260418010_rpc_get_tenant_by_host.sql
git commit -m "feat(db): add public RPC get_tenant_by_host for branding resolution"
```

---

## Task 11: Regenerar tipos TypeScript do Supabase

**Files:**
- Modify: `src/integrations/supabase/types.ts`

- [ ] **Step 1: Gerar novos tipos via MCP**

Invoke `mcp__supabase__generate_typescript_types`. Pegue a saída (string grande com todas as tabelas e types).

- [ ] **Step 2: Substituir o conteúdo de `src/integrations/supabase/types.ts`**

Write o conteúdo recebido no Step 1 em `src/integrations/supabase/types.ts` (sobrescreve completamente).

- [ ] **Step 3: Verificar que TypeScript compila**

Run:

```bash
npx tsc --noEmit
```

Expected: sem erros. Se houver erro em `Signup.tsx` referenciando tipos antigos, pode deixar para Task 12 (que vai modificar Signup.tsx de qualquer forma).

- [ ] **Step 4: Commit**

```bash
git add src/integrations/supabase/types.ts
git commit -m "chore(types): regenerate Supabase types after schema changes"
```

---

## Task 12: Atualizar Signup.tsx para suportar 'student'

**Files:**
- Modify: `src/pages/Signup.tsx`

- [ ] **Step 1: Alterar tipo AccountType e adicionar card de aluno**

Edit `src/pages/Signup.tsx`, linha 12:

```typescript
// ANTES
type AccountType = 'teacher' | 'school' | null;

// DEPOIS
type AccountType = 'teacher' | 'school' | 'student' | null;
```

- [ ] **Step 2: Adicionar import do ícone de aluno**

Edit linha 9 (imports do lucide-react). Adicionar `BookOpen` à lista:

```typescript
// ANTES
import { Eye, EyeOff, UserPlus, Box, Check, GraduationCap, School } from 'lucide-react';

// DEPOIS
import { Eye, EyeOff, UserPlus, Box, Check, GraduationCap, School, BookOpen } from 'lucide-react';
```

- [ ] **Step 3: Adicionar card de seleção "Sou Aluno" na UI**

Edit `src/pages/Signup.tsx`, encontre o bloco `{/* Account type selection */}` (~linha 275). Após o botão `setAccountType('school')` (~linha 313), adicionar o 3º card antes do `</div>` que fecha `space-y-4`:

```tsx
                <button
                  onClick={() => setAccountType('student')}
                  className="w-full flex items-center gap-4 p-5 rounded-xl border border-border/50 hover:border-sky-400/50 hover:bg-sky-400/5 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-sky-400/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-sky-400" />
                  </div>
                  <div>
                    <p className="font-poppins font-semibold text-foreground">{t('signup.student_title')}</p>
                    <p className="text-sm text-muted-foreground font-nunito">
                      {t('signup.student_description')}
                    </p>
                  </div>
                </button>
```

- [ ] **Step 4: Atualizar role logic e flow para student**

Edit linha ~104 (dentro de `handleSignup`, logo antes de `const { data: authData, error: signUpError }`):

```typescript
// ANTES
const role = inviteData ? inviteData.role : accountType === 'school' ? 'admin' : 'teacher';

// DEPOIS
const role = inviteData
  ? inviteData.role
  : accountType === 'school'
    ? 'admin'
    : accountType === 'student'
      ? 'student'
      : 'teacher';
```

- [ ] **Step 5: Adicionar flow RPC create_student_account após signup do aluno**

Edit após o bloco do `accept_invite` (~linha 163, antes do `supabase.auth.signOut()`). Adicionar:

```typescript
      // 4. If student signup, finalize via RPC
      if (accountType === 'student' && !inviteData) {
        const { error: rpcError } = await supabase.rpc('create_student_account');
        if (rpcError) {
          setError(t('signup.error_create_student', { message: rpcError.message }));
          setSubmitting(false);
          return;
        }
      }
```

- [ ] **Step 6: Atualizar títulos, subtítulos, validação e success para student**

No bloco "Signup form" (~linha 328), atualizar o título condicional:

```tsx
// Dentro do <h2>
{inviteData
  ? t('signup.invite_for_tenant', { tenant: inviteData.tenant_name })
  : accountType === 'school'
    ? t('signup.school_register_title')
    : accountType === 'student'
      ? t('signup.student_register_title')
      : t('signup.teacher_register_title')}
```

E o subtítulo (<p> logo abaixo):

```tsx
{inviteData
  ? t('signup.invite_create_to_access', { tenant: inviteData.tenant_name })
  : accountType === 'school'
    ? t('signup.school_admin_subtitle')
    : accountType === 'student'
      ? t('signup.student_subtitle')
      : t('signup.teacher_free_subtitle')}
```

E o texto do botão submit (~linha 468):

```tsx
{submitting
  ? t('signup.submitting')
  : accountType === 'school'
    ? t('signup.submit_school')
    : accountType === 'student'
      ? t('signup.submit_student')
      : t('signup.submit_teacher')}
```

E a mensagem de success (~linha 259):

```tsx
{accountType === 'school'
  ? t('signup.success_school', { schoolName })
  : accountType === 'student'
    ? t('signup.success_student')
    : inviteData
      ? t('signup.success_invite', { tenant: inviteData.tenant_name })
      : t('signup.success_default')}
```

- [ ] **Step 7: Verificar que TypeScript compila**

Run:

```bash
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 8: Commit**

```bash
git add src/pages/Signup.tsx
git commit -m "feat(signup): add 'Sou Aluno' option for B2C student signup"
```

---

## Task 13: Adicionar traduções de signup do aluno

**Files:**
- Modify: `public/locales/pt-BR/translation.json` (e todos os outros idiomas suportados)

- [ ] **Step 1: Listar todos os arquivos de tradução**

Run:

```bash
ls public/locales/
```

- [ ] **Step 2: Adicionar novas keys em `public/locales/pt-BR/translation.json`**

Abra o arquivo e localize o bloco `"signup": { ... }`. Adicionar (antes do `}` que fecha o bloco signup):

```json
    "student_title": "Sou Aluno",
    "student_description": "Estudar em casa com a plataforma",
    "student_register_title": "Criar conta de aluno",
    "student_subtitle": "Comece gratuito e estude com a plataforma",
    "submit_student": "Criar conta de aluno",
    "success_student": "Conta de aluno criada! Faça login para começar.",
    "error_create_student": "Erro ao criar conta de aluno: {{message}}"
```

(Se já existir `,` no final da última key antes, adicione `,` antes da nova lista.)

- [ ] **Step 3: Repetir para os outros idiomas**

Para cada idioma em `public/locales/` (inglês, espanhol, etc.), traduzir as mesmas keys. Exemplo para `en`:

```json
    "student_title": "I'm a Student",
    "student_description": "Study from home with the platform",
    "student_register_title": "Create student account",
    "student_subtitle": "Start free and study with the platform",
    "submit_student": "Create student account",
    "success_student": "Student account created! Log in to get started.",
    "error_create_student": "Error creating student account: {{message}}"
```

Para idiomas sem tradução própria feita manualmente, use pt-BR como fallback temporário (i18next cuida disso).

- [ ] **Step 4: Rodar o app em dev e visualizar a tela de signup**

Run:

```bash
npm run dev
```

Abrir navegador em `http://localhost:5173/signup` — deve aparecer o 3º botão "Sou Aluno" com ícone de livro aberto. Clicar → formulário carrega com título/subtítulo corretos.

Ctrl+C para parar o dev server.

- [ ] **Step 5: Commit**

```bash
git add public/locales/
git commit -m "feat(i18n): add student signup translations"
```

---

## Task 14: Teste unitário para validação de signup

**Files:**
- Create: `src/lib/signup-validation.ts`
- Create: `src/lib/__tests__/signup-validation.test.ts`
- Modify: `src/pages/Signup.tsx` (usar o helper)

- [ ] **Step 1: Escrever o teste primeiro (failing)**

Create `src/lib/__tests__/signup-validation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateSignupInput, type SignupInput } from '../signup-validation';

describe('validateSignupInput', () => {
  const base: SignupInput = {
    accountType: 'teacher',
    fullName: 'Maria',
    email: 'maria@example.com',
    password: 'senha123',
    confirmPassword: 'senha123',
    schoolName: '',
  };

  it('accepts valid teacher signup', () => {
    expect(validateSignupInput(base)).toEqual({ ok: true });
  });

  it('accepts valid student signup without schoolName', () => {
    expect(validateSignupInput({ ...base, accountType: 'student' })).toEqual({ ok: true });
  });

  it('rejects password shorter than 6 chars', () => {
    const result = validateSignupInput({ ...base, password: 'abc', confirmPassword: 'abc' });
    expect(result).toEqual({ ok: false, errorKey: 'signup.error_password_min' });
  });

  it('rejects mismatched passwords', () => {
    const result = validateSignupInput({ ...base, confirmPassword: 'outra' });
    expect(result).toEqual({ ok: false, errorKey: 'signup.error_passwords_mismatch' });
  });

  it('rejects school signup without schoolName', () => {
    const result = validateSignupInput({ ...base, accountType: 'school', schoolName: '' });
    expect(result).toEqual({ ok: false, errorKey: 'signup.error_school_name_required' });
  });

  it('allows school signup with schoolName', () => {
    const result = validateSignupInput({ ...base, accountType: 'school', schoolName: 'Escola ABC' });
    expect(result).toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: Rodar o teste e verificar que falha**

Run:

```bash
npx vitest run src/lib/__tests__/signup-validation.test.ts
```

Expected: FAIL com erro "Cannot find module '../signup-validation'".

- [ ] **Step 3: Criar o helper mínimo para passar**

Create `src/lib/signup-validation.ts`:

```typescript
export type AccountType = 'teacher' | 'school' | 'student';

export interface SignupInput {
  accountType: AccountType;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  schoolName: string;
}

export type SignupValidationResult =
  | { ok: true }
  | { ok: false; errorKey: string };

export function validateSignupInput(input: SignupInput): SignupValidationResult {
  if (input.password.length < 6) {
    return { ok: false, errorKey: 'signup.error_password_min' };
  }
  if (input.password !== input.confirmPassword) {
    return { ok: false, errorKey: 'signup.error_passwords_mismatch' };
  }
  if (input.accountType === 'school' && !input.schoolName.trim()) {
    return { ok: false, errorKey: 'signup.error_school_name_required' };
  }
  return { ok: true };
}
```

- [ ] **Step 4: Rodar o teste e verificar que passa**

Run:

```bash
npx vitest run src/lib/__tests__/signup-validation.test.ts
```

Expected: PASS — 6 testes OK.

- [ ] **Step 5: Refatorar Signup.tsx para usar o helper**

Edit `src/pages/Signup.tsx`:

Adicionar import no topo:

```typescript
import { validateSignupInput } from '@/lib/signup-validation';
```

No início de `handleSignup`, substituir o bloco manual de validação (linhas ~87-99, os três ifs de password/match/schoolName):

```typescript
// ANTES (remover 3 ifs manuais)
if (!passwordChecks.length) { ... }
if (!passwordChecks.match) { ... }
if (accountType === 'school' && !schoolName.trim()) { ... }

// DEPOIS
const validation = validateSignupInput({
  accountType: accountType!,
  fullName,
  email,
  password,
  confirmPassword,
  schoolName,
});
if (!validation.ok) {
  setError(t(validation.errorKey));
  return;
}
```

- [ ] **Step 6: Rodar typecheck e todos os testes**

Run:

```bash
npx tsc --noEmit && npx vitest run
```

Expected: typecheck OK, todos os testes (incluindo os existentes de GeometryCalculator e cn) passam.

- [ ] **Step 7: Commit**

```bash
git add src/lib/signup-validation.ts src/lib/__tests__/signup-validation.test.ts src/pages/Signup.tsx
git commit -m "feat(signup): extract validation helper with unit tests"
```

---

## Task 15: Documentar configuração Cloudflare (manual, pelo usuário)

**Files:**
- Create: `docs/infra/cloudflare-setup.md`

Esta task é documentação — a ação é manual pelo usuário. O engenheiro escreve o guia.

- [ ] **Step 1: Criar o guia**

Create `docs/infra/cloudflare-setup.md`:

````markdown
# Cloudflare Setup para CLIQUE EXATAS

## Objetivo

Colocar Cloudflare na frente da Vercel para:
- CDN global + DDoS + WAF
- Wildcard SSL em `*.clickexatas.com.br`
- Preparar Cloudflare for SaaS (custom domains dos tenants Premium — Fase 3)

## Passo 1 — Adicionar zone

1. Acesse https://dash.cloudflare.com → **Add a Site**
2. Digite `clickexatas.com.br`
3. Plano: **Free** funciona para CDN/DDoS. Para Cloudflare for SaaS (Fase 3) será necessário **SaaS plan** pago.
4. Cloudflare dá 2 nameservers — atualize no seu registrar (onde comprou o domínio) para apontar para os NS da Cloudflare.
5. Aguarde propagação DNS (até 24h, normalmente 5-30 min).

## Passo 2 — DNS records

No painel da zone, em **DNS → Records**, adicionar:

| Type | Name | Target | Proxy |
|---|---|---|---|
| CNAME | `app` | `cname.vercel-dns.com` | **Proxied (laranja)** |
| CNAME | `*` | `cname.vercel-dns.com` | **Proxied (laranja)** |
| CNAME | `@` | `cname.vercel-dns.com` | **Proxied (laranja)** |

O wildcard CNAME cobre `{slug}.clickexatas.com.br`.

## Passo 3 — SSL/TLS

Em **SSL/TLS → Overview**:
- Mode: **Full (strict)**

Em **SSL/TLS → Edge Certificates**:
- **Always Use HTTPS**: ON
- **Automatic HTTPS Rewrites**: ON
- **Minimum TLS Version**: 1.2

## Passo 4 — Cloudflare for SaaS (preparar, configurar na Fase 3)

Em **SSL/TLS → Custom Hostnames**:
- Ativar Cloudflare for SaaS (requer plano SaaS pago, ~$0 base + $2/hostname/mês)
- Fallback origin: `customers.clickexatas.com.br` (você cria esse record CNAME apontando para Vercel na Fase 3)
- Não adicionar custom hostnames agora — será feito via API na Fase 3

## Passo 5 — Criar API Token para Edge Functions

Em **My Profile → API Tokens → Create Token**:
- Usar template **Custom token**
- Permissões:
  - Zone.Zone.Read
  - Zone.SSL and Certificates.Edit
  - Zone.Custom Hostnames.Edit
- Zone Resources: Include → `clickexatas.com.br`
- TTL: sem expiração ou 1 ano

**Guarde o token como secret na Supabase:**
- Supabase Dashboard → Project Settings → Edge Functions → Secrets
- Key: `CLOUDFLARE_API_TOKEN`, Value: o token gerado
- Também adicione: `CLOUDFLARE_ZONE_ID` = o Zone ID da zone clickexatas.com.br (mostrado no Overview da zone)

## Verificação

Depois que DNS propagar:

```bash
curl -I https://clickexatas.com.br
curl -I https://app.clickexatas.com.br
curl -I https://qualquer-slug.clickexatas.com.br
```

Expected: respostas com header `server: cloudflare` e `cf-ray: ...`.
````

- [ ] **Step 2: Commit**

```bash
git add docs/infra/cloudflare-setup.md
git commit -m "docs(infra): add Cloudflare setup guide"
```

- [ ] **Step 3: Executar o setup manualmente (você, o engenheiro humano)**

Siga o guia `docs/infra/cloudflare-setup.md` passo a passo. Não pule para Task 16 até confirmar que `curl -I https://app.clickexatas.com.br` retorna `server: cloudflare`.

Marque esta task como concluída apenas depois da verificação.

---

## Task 16: Configurar domínios na Vercel (manual, pelo usuário)

**Files:**
- Create: `docs/infra/vercel-domains.md`

- [ ] **Step 1: Criar o guia**

Create `docs/infra/vercel-domains.md`:

````markdown
# Vercel Domains Setup

## Pré-requisitos

- Cloudflare zone `clickexatas.com.br` ativa e DNS propagado (Task 15 concluída)
- Acesso admin ao projeto Vercel do CLIQUE EXATAS

## Passo 1 — Adicionar domínios no projeto Vercel

Vercel Dashboard → seu projeto → **Settings → Domains**.

Adicionar:

1. `clickexatas.com.br` — Vercel vai pedir pra adicionar registro TXT/CNAME no DNS. Como Cloudflare já tá com CNAME `@` → `cname.vercel-dns.com`, a Vercel deve verificar automaticamente. Pode levar 1-2 min.

2. `app.clickexatas.com.br` — idem, CNAME já existe.

3. `*.clickexatas.com.br` — Vercel pode pedir TXT record adicional (`_vercel` com valor específico). Se pedir, adicione no Cloudflare DNS como **DNS only (cinza)**, não proxied.

4. **NÃO adicione `customers.clickexatas.com.br` agora** — é pra Fase 3 (Cloudflare for SaaS fallback).

## Passo 2 — Configurar redirects (opcional)

Se quiser que `clickexatas.com.br` redirecione para `app.clickexatas.com.br` ou separar landing/app, configure redirects no `vercel.json` em um PR separado.

**Por ora, deixe ambos apontando para o mesmo app** — landing e app no mesmo bundle. Separação vem na Fase 5.

## Passo 3 — Verificar SSL na Vercel

No painel de Domains, cada domínio deve mostrar status **Valid** com ícone verde.

Se algum ficar em **Invalid Configuration**:
- Confirme que o CNAME na Cloudflare está **Proxied (laranja)**. A Vercel valida via HTTP challenge que passa pela Cloudflare.
- Se ainda falhar, desmarque temporariamente o proxy (DNS only/cinza), deixe a Vercel validar e emitir cert, depois volte a proxiar.

## Verificação

```bash
# Deve retornar 200 e html do app
curl https://app.clickexatas.com.br

# Headers devem ter:
# server: cloudflare
# cf-ray: ...
# x-vercel-id: ... (prova que Vercel é origin)
curl -I https://app.clickexatas.com.br
```
````

- [ ] **Step 2: Commit**

```bash
git add docs/infra/vercel-domains.md
git commit -m "docs(infra): add Vercel domains setup guide"
```

- [ ] **Step 3: Executar o setup manualmente**

Siga `docs/infra/vercel-domains.md`. Confirme via `curl -I` que o app responde em `app.clickexatas.com.br` via Cloudflare → Vercel.

---

## Task 17: Deploy + smoke test end-to-end

**Files:**
- Nenhum novo. Testes manuais + commit final de marcação.

- [ ] **Step 1: Garantir que tudo está commitado**

Run:

```bash
git status
```

Expected: `working tree clean`. Se houver mudanças pendentes, commit antes de seguir.

- [ ] **Step 2: Rodar build local**

Run:

```bash
npm run build
```

Expected: build sem erros. Bundle final em `dist/`.

- [ ] **Step 3: Rodar todos os testes**

Run:

```bash
npm run test
```

Expected: todos passam, incluindo os novos de `signup-validation`.

- [ ] **Step 4: Push para main — Vercel faz deploy automático**

Run:

```bash
git push origin main
```

Esperar ~2-3 min para Vercel terminar o deploy. Acompanhar em https://vercel.com/[seu-projeto]/deployments.

- [ ] **Step 5: Smoke test manual em produção**

Abrir `https://app.clickexatas.com.br/signup` no navegador.

Verificar checklist:
- [ ] 3 cards aparecem: "Sou Professor", "Sou Escola", "Sou Aluno"
- [ ] Clicar em "Sou Aluno" → formulário carrega
- [ ] Preencher email fake (ex: `teste-aluno@test.local`), senha 6 chars, criar conta
- [ ] Aparece mensagem de sucesso "Conta de aluno criada!"
- [ ] Ir em `/login`, entrar com o mesmo email/senha
- [ ] Entrou na aplicação? Profile tem `role = 'student'` e `tenant_id = NULL`?

- [ ] **Step 6: Verificar no banco via MCP**

Execute via MCP:

```sql
SELECT p.email, p.role, p.tenant_id, s.plan_id, s.status
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.id
WHERE p.email = 'teste-aluno@test.local';
```

Expected: 1 linha, `role = student`, `tenant_id = NULL`, `plan_id = student_free`, `status = active`.

- [ ] **Step 7: Testar signup de professor (regressão)**

No navegador, `/signup` → "Sou Professor" → criar conta nova → confirmar login e dashboard funcionam.

- [ ] **Step 8: Testar signup de escola (regressão)**

Idem com "Sou Escola" → criar tenant novo → confirmar `/school/users` funciona.

- [ ] **Step 9: Commit tag final da Fase 1**

Run:

```bash
git tag -a fase-1-foundation -m "Fase 1 Foundation shipped: 3 profile signup at app.clickexatas.com.br"
git push origin fase-1-foundation
```

---

## Self-Review checklist (o engenheiro executor revisa ao final)

- [ ] Todas as 10 migrations aplicadas e com policies contadas corretamente
- [ ] Tabela `plans` populada com exatamente 9 linhas
- [ ] `subscriptions.plan_id` NOT NULL e todas as linhas preenchidas
- [ ] Tipo `user_role` tem os 4 valores: superadmin, admin, teacher, student
- [ ] Signup.tsx mostra 3 cards e todos os 3 flows funcionam em produção
- [ ] `npx tsc --noEmit` passa sem erros
- [ ] `npm run test` passa (pelo menos os novos testes de `signup-validation`)
- [ ] Cloudflare está na frente da Vercel (curl retorna `server: cloudflare`)
- [ ] Smoke test em produção validou os 3 signups e o login subsequente

---

## Riscos conhecidos durante a execução

- **ALTER TYPE ADD VALUE precisa estar fora de transação** (Task 1). O MCP `apply_migration` gerencia isso, mas se aplicar manualmente via psql com `-1`, vai falhar. Use Dashboard SQL Editor ou MCP.
- **Regeneração de types pode mudar muito código** (Task 11). Se outros componentes quebrarem por mudança de tipo, faça fix em PR separado, não misture com esta fase.
- **Cloudflare propagação DNS pode levar horas** (Task 15). Não bloqueie a execução das outras tasks — as migrations e código continuam rodando no Vercel atual enquanto DNS propaga.
- **Testes em produção com usuários reais:** o smoke test usa email de teste, mas se houver usuários reais já cadastrados durante a migration, o backfill da Task 5 pode atribuir plano errado. Revisar `SELECT plan_id, count(*) FROM subscriptions GROUP BY plan_id` após Task 5 e corrigir manualmente se houver discrepância.

---

## Depois da Fase 1

Ao terminar e validar esta fase em produção, invoque novamente `superpowers:writing-plans` com o mesmo spec para gerar o plano da **Fase 2 (Monetização com Stripe)**. O spec já descreve o escopo de cada fase — só precisa gerar o plano executável.
