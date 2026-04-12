# GeoTeach SaaS - Auditoria Completa do Sistema

**Data:** 2026-04-12
**Escopo:** Seguranca, Qualidade de Codigo, Arquitetura, Prontidao para Producao
**Stack:** React 18 + TypeScript + Supabase + Vite + Tailwind + Vercel
**Codebase:** ~36K linhas, 171 arquivos TS/TSX

---

## Scorecard Geral

| Area | Nota | Status |
|------|------|--------|
| Seguranca | 4/10 | RLS critico, sem enforcement server-side |
| Qualidade de Codigo | 5/10 | Zero testes, strict mode off, error tracking ausente |
| Arquitetura | 6/10 | Boa base multi-tenant, mas logica toda no client |
| Prontidao Producao | 3/10 | Sem CI/CD, monitoring, Stripe, LGPD |
| **GERAL** | **4.5/10** | **Bom MVP, nao esta pronto para producao** |

---

## Secao 1: Seguranca

### Criticos

#### F1 - RLS Policies permissivas demais
- **Tabela:** `subscribers`
- **Problema:** Policies `update_subscription` e `insert_subscription` usam `USING (true)` / `WITH CHECK (true)`, permitindo que qualquer usuario autenticado modifique qualquer assinatura.
- **Impacto:** Um usuario pode escalar seu plano de "free" para "institution" via console do browser.
- **Local:** `supabase/migrations/20250901200631_968c067f-2e52-4311-9c69-900a3fbf78e5.sql`
- **Correcao:** Restringir policies para `auth.uid() = user_id` ou usar service role key em Edge Functions.

#### F2 - RLS ausente em tabelas sensiveis
- **Tabelas:** `profiles`, `tenants`, `projects`, `subscriptions`, `audit_log`, `system_settings`
- **Problema:** Se RLS nao esta habilitado, qualquer usuario autenticado com o anon key pode ler/escrever todas essas tabelas.
- **Impacto:** Vazamento de dados entre tenants, manipulacao de perfis alheios, alteracao de configuracoes do sistema.
- **Correcao:** Habilitar RLS em todas as tabelas e criar policies granulares por role e tenant_id.

### Altos

#### F3 - Protecao admin e client-side only
- **Componente:** `src/components/admin/SuperAdminRoute.tsx`
- **Problema:** `SuperAdminRoute` verifica `profile?.role !== 'superadmin'` no React, mas nao ha RLS no banco impedindo um teacher de fazer `supabase.from('profiles').update({role: 'superadmin'})`.
- **Impacto:** Escalacao de privilegio trivial.
- **Correcao:** RLS policy que impede update do campo `role` exceto por superadmin. Database function para mudanca de role.

#### F4 - Sem rate limiting
- **Endpoints:** Login, signup, password reset
- **Problema:** Sem protecao contra brute force. Supabase tem rate limiting basico mas nao configurado explicitamente.
- **Impacto:** Ataques de forca bruta em contas.
- **Correcao:** Configurar rate limiting no Supabase dashboard + considerar Cloudflare/Vercel rate limiting.

#### F5 - Sem validacao server-side nos RPCs
- **Funcoes:** `create_school_and_link_admin`, `accept_invite`
- **Problema:** Input do client sem sanitizacao visivel no SQL.
- **Impacto:** Potencial SQL injection ou dados malformados.
- **Correcao:** Adicionar validacao dentro das database functions (CHECK constraints, input sanitization).

### Medios

#### F6 - Sem headers de seguranca
- **Local:** `vercel.json`
- **Problema:** Falta CSP, HSTS, X-Frame-Options, X-Content-Type-Options.
- **Correcao:** Adicionar headers no vercel.json.

#### F7 - Audit log existe mas nao e usado
- **Tabela:** `audit_log`
- **Problema:** Tabela criada com campos `action`, `actor_id`, `target_id`, `metadata` mas nenhum codigo escreve nela.
- **Correcao:** Criar database triggers ou Edge Functions para log de operacoes sensiveis.

#### F8 - Limites de subscription nao enforced
- **Campos:** `projects_limit`, `storage_limit_mb` em `subscriptions`
- **Problema:** Valores armazenados mas nunca verificados antes de criar projetos.
- **Correcao:** RLS policy ou database function que verifica limites antes de INSERT em `projects`.

---

## Secao 2: Qualidade de Codigo

### Altos

#### F9 - TypeScript strict mode desabilitado
- **Local:** `tsconfig.json`
- **Problema:** `strict: false`, `noImplicitAny: false`, `strictNullChecks: false`. Permite bugs silenciosos como acessar propriedades de objetos undefined.
- **Impacto:** Bugs em runtime que o compilador deveria capturar. Em 36K linhas, risco alto.
- **Correcao:** Ativar incrementalmente: primeiro `strictNullChecks`, depois `noImplicitAny`, depois `strict: true`. Corrigir erros por modulo.

#### F10 - Zero testes
- **Problema:** Nenhum framework de testes instalado. Nenhum arquivo `*.test.*` ou `*.spec.*`.
- **Impacto:** Para SaaS multi-tenant com subscriptions (dinheiro), qualquer deploy pode quebrar funcionalidade critica sem ninguem saber.
- **Correcao:** Instalar Vitest + Testing Library. Comecar com testes para AuthContext, RPC calls, e fluxos de subscription. Adicionar Playwright para E2E.

#### F11 - Sem error logging centralizado
- **Local:** `src/components/ErrorBoundary.tsx`
- **Problema:** `TODO: Sentry integration`. Erros em producao sao silenciosos.
- **Correcao:** Integrar Sentry (API key pendente conforme projeto). Adicionar error boundaries granulares.

### Medios

#### F12 - Duas tabelas de subscription
- **Tabelas:** `subscriptions` e `subscribers`
- **Problema:** Campos sobrepostos (`stripe_customer_id`, plano, status). Indica migracao incompleta ou duplicacao.
- **Correcao:** Consolidar em uma unica tabela. Migrar dados e remover a tabela legada.

#### F13 - Apenas 1 migration file
- **Local:** `supabase/migrations/`
- **Problema:** Todo o schema num unico arquivo. Mudancas futuras dificeis de rastrear.
- **Correcao:** A partir de agora, criar migrations incrementais para cada alteracao.

#### F14 - Hardcoded strings fora do i18n
- **Locais:** `ErrorBoundary`, mensagens de erro diversas
- **Problema:** Strings em portugues hardcoded apesar de 12 idiomas configurados.
- **Correcao:** Mover todas as strings user-facing para arquivos i18n.

### Baixos

#### F15 - Package manager misto
- **Problema:** `bun.lockb` presente mas projeto usa npm. Pode causar inconsistencias.
- **Correcao:** Escolher um e remover o lock file do outro.

#### F16 - Componentes grandes
- **Problema:** Alguns componentes provavelmente excedem 300+ linhas.
- **Correcao:** Extrair sub-componentes conforme padrao ja estabelecido (FloatingPanel pattern).

---

## Secao 3: Arquitetura

### Altos

#### F17 - Multi-tenancy sem enforcement no banco
- **Problema:** `tenant_id` e nullable em `projects`, `subscriptions`, `profiles`. Sem RLS por tenant.
- **Impacto:** Dados podem vazar entre escolas. Projetos orfaos sem tenant.
- **Correcao:** Tornar `tenant_id` NOT NULL (exceto superadmin). RLS policies filtrando por `tenant_id` do usuario autenticado.

#### F18 - Toda logica de negocio no client
- **Problema:** Sem Edge Functions. Verificacao de limites, criacao de escola, gestao de convites rodam no browser.
- **Impacto:** Qualquer regra pode ser bypassada manipulando requests.
- **Correcao:** Mover logica critica para Supabase Edge Functions (Deno). Manter client apenas para UI.

#### F19 - Sem camada de API
- **Problema:** App fala diretamente com Supabase via client SDK. Sem backend intermediario.
- **Impacto:** Limita rate limiting custom, webhooks, integracao com terceiros.
- **Correcao:** Para MVP, Edge Functions cobrem. Para escala, considerar API layer (Next.js API routes ou similar).

### Medios

#### F20 - AuthContext faz muito
- **Local:** `src/contexts/AuthContext.tsx`
- **Problema:** Busca sessao, perfil, subscription, e gerencia estado de auth num unico contexto.
- **Impacto:** Se qualquer parte falha, todo auth context quebra.
- **Correcao:** Separar em AuthContext (sessao), ProfileContext (perfil), SubscriptionContext (plano).

#### F21 - Sem cache strategy
- **Problema:** TanStack Query instalado mas invalidacao de cache entre mutations nao esta clara.
- **Correcao:** Definir staleTime, gcTime, e invalidateQueries apos mutations.

#### F22 - Database functions sem versionamento
- **Problema:** Funcoes na migration inicial. Alteracoes futuras precisam de migrations novas.
- **Correcao:** Documentar funcoes existentes. Usar migrations incrementais para mudancas.

### Baixos

#### F23 - 3D rendering no mesmo bundle
- **Problema:** Three.js + React Three Fiber + Drei (~500KB+) carregam mesmo em paginas admin.
- **Correcao:** Code splitting com `React.lazy()` para componentes 3D.

#### F24 - Sem feature flags
- **Problema:** Funcionalidades vao direto para todos os usuarios.
- **Correcao:** Implementar feature flags simples via `system_settings` ou servico externo.

---

## Secao 4: Prontidao para Producao

### Criticos

#### F25 - Sem monitoring/observabilidade
- **Problema:** Nenhum APM (Sentry, Datadog, LogRocket). Erros em producao passam despercebidos.
- **Correcao:** Integrar Sentry (frontend) + Supabase logs (backend). Configurar alertas.

#### F26 - Sem backup strategy documentada
- **Problema:** Supabase faz backups automaticos no plano Pro, mas sem documentacao de recovery plan.
- **Correcao:** Documentar processo de restore. Testar recovery. Configurar Point-in-Time Recovery se disponivel.

### Altos

#### F27 - Sem CI/CD pipeline
- **Problema:** Nao existe `.github/workflows/`. Deploy manual via Vercel auto-deploy.
- **Correcao:** Criar GitHub Actions: lint, type-check, test, build. Gate de qualidade antes de deploy.

#### F28 - Sem health checks
- **Problema:** Nenhum endpoint de status.
- **Correcao:** Edge Function simples que verifica conectividade com Supabase.

#### F29 - Integracoes pendentes
- **Pendentes:** Sentry (error tracking), Grafana (monitoring), Resend (emails transacionais).
- **Correcao:** Obter API keys e integrar. Prioridade: Sentry > Resend > Grafana.

#### F30 - Sem Stripe integrado
- **Problema:** Campos `stripe_customer_id` existem mas nenhum codigo integra com Stripe.
- **Correcao:** Implementar Stripe Checkout + webhooks via Edge Functions.

### Medios

#### F31 - Vercel config minimo
- **Local:** `vercel.json`
- **Problema:** Apenas rewrite para SPA. Faltam security headers e cache headers.
- **Correcao:** Adicionar headers block no vercel.json.

#### F32 - Sem SEO/meta tags
- **Problema:** SPA sem SSR. Paginas publicas sem indexacao adequada.
- **Correcao:** Adicionar react-helmet para meta tags dinamicas. Considerar SSR futuro se SEO for prioridade.

#### F33 - Sem politica de password
- **Problema:** Supabase aceita senhas fracas por padrao.
- **Correcao:** Configurar password strength no Supabase dashboard + validacao client-side com Zod.

#### F34 - Sem LGPD compliance
- **Problema:** Sem pagina de politica de privacidade, sem mecanismo de export/delete de dados pessoais.
- **Impacto:** Para SaaS brasileiro, LGPD e obrigatoria. Risco legal.
- **Correcao:** Criar pagina de privacidade. Implementar endpoint de export/delete de dados. Consent banner.

### Baixos

#### F35 - Sem PWA config
- **Problema:** Sem service worker, sem manifest.json.
- **Correcao:** Adicionar vite-plugin-pwa se offline for desejado.

#### F36 - Sem sitemap/robots.txt
- **Problema:** Sem controle de crawling.
- **Correcao:** Adicionar robots.txt e sitemap.xml no public/.

---

## Priorizacao de Correcoes

### Fase 1 - Seguranca Critica (deve ser feita antes de qualquer usuario real)
1. F1 - Corrigir RLS policies da tabela subscribers
2. F2 - Habilitar RLS em todas as tabelas
3. F3 - RLS para proteger campo role
4. F17 - Enforcement de tenant_id no banco
5. F18 - Mover logica critica para Edge Functions

### Fase 2 - Qualidade Minima (antes de beta)
6. F10 - Setup de testes (Vitest + Playwright)
7. F9 - TypeScript strictNullChecks
8. F11 - Integrar Sentry
9. F25 - Monitoring basico
10. F27 - CI/CD pipeline

### Fase 3 - Producao (antes de launch)
11. F30 - Integrar Stripe
12. F34 - LGPD compliance
13. F6 - Security headers
14. F29 - Integracoes pendentes (Resend, Grafana)
15. F12 - Consolidar tabelas de subscription
16. F7 - Ativar audit log
17. F8 - Enforcar limites de subscription

### Fase 4 - Otimizacao (pos-launch)
18. F20 - Separar AuthContext
19. F23 - Code splitting para 3D
20. F24 - Feature flags
21. F4 - Rate limiting avancado
22. Demais findings medios e baixos

---

## Decisoes de Design

- **Abordagem:** Documento unico de auditoria com findings categorizados por severidade
- **Priorizacao:** Seguranca > Testes > Monitoring > Integracao > Otimizacao
- **Filosofia:** Corrigir o que pode causar dano real primeiro (RLS, escalacao de privilegio), depois o que permite detectar problemas (testes, monitoring), depois features de negocio (Stripe, LGPD)
- **Scope:** 36 findings em 4 dominios, 4 fases de implementacao
