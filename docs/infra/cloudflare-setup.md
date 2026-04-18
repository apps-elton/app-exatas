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
