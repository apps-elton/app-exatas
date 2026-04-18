# Vercel Domains Setup

## Pré-requisitos

- Cloudflare zone `clickexatas.com.br` ativa e DNS propagado (ver `docs/infra/cloudflare-setup.md`)
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
