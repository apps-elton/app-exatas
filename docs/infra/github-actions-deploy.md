# GitHub Actions Auto-Deploy Setup

O workflow `.github/workflows/ci.yml` tem um job `deploy-production` que roda no push para `main` **depois** que o job `quality` (lint + typecheck + test + build) passar. Se CI falhar, deploy não acontece.

## Configurar secrets no GitHub (uma vez)

Você precisa adicionar **3 secrets** no repositório `apps-elton/app-exatas`:

GitHub → Settings → Secrets and variables → Actions → New repository secret

### Como obter os valores

**1. `VERCEL_TOKEN`**

- Acesse: https://vercel.com/account/tokens
- **Create Token** → name: `GitHub Actions Deploy`, scope: `Full Account`, expiration: sem expiração (ou 1 ano)
- Copie o token (só aparece uma vez)

**2. `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`**

Rode localmente uma vez (dentro do repo):

```bash
npm install --global vercel@latest
vercel link
```

Siga as instruções (scope da conta, seleciona o projeto). Isso cria `.vercel/project.json` com `orgId` e `projectId`.

```bash
cat .vercel/project.json
```

Exemplo:
```json
{"orgId":"team_xxx","projectId":"prj_yyy"}
```

Copie `orgId` → `VERCEL_ORG_ID` no GitHub. Copie `projectId` → `VERCEL_PROJECT_ID`.

**NÃO commite `.vercel/project.json`** — `.vercel/` já deve estar no `.gitignore`. Se não estiver, adicione.

## Testando

Depois de configurar os 3 secrets:

1. Faça merge do PR em `main`
2. Abra o GitHub Actions → vai ver `CI` rodar com 2 jobs:
   - `quality` (Lint, Type Check, Test, Build)
   - `deploy-production` (roda só se quality passar)
3. Deploy aparece em https://vercel.com/[seu-projeto]/deployments

## Se você já tem Vercel GitHub Integration ativa

A integração nativa da Vercel (via GitHub App) também deploya no push para main automaticamente. Com o workflow acima ativado, você terá **2 deploys** a cada push.

Opções:
- **A (recomendado):** Desabilite a integração nativa da Vercel para esse repo (Vercel Dashboard → Project → Git → Disconnect) e deixe só o GitHub Actions controlar. Vantagem: deploy gatilhado apenas se CI passar.
- **B:** Mantenha a integração nativa e remova o job `deploy-production` deste workflow. Simples, mas deploy roda mesmo se testes falharem.

## Rollback

Se um deploy de produção quebrar, no Vercel Dashboard → Deployments → clique num deploy anterior verde → **Promote to Production**. Leva ~30s para propagar.
