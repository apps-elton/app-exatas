# Supabase Auth Email Templates (CLIQUE EXATAS)

Templates prontos pra colar em https://supabase.com/dashboard/project/duqrveawgopqohrfiogz/auth/templates

Todos usam a mesma identidade visual dos emails transacionais (welcome, invite) enviados pela Edge Function `send-email`.

## Variáveis Supabase disponíveis

- `{{ .ConfirmationURL }}` — URL de ação (confirmar/resetar/entrar)
- `{{ .Email }}` — email do destinatário
- `{{ .SiteURL }}` — URL do app
- `{{ .Token }}` — código OTP numérico (6 dígitos)
- `{{ .TokenHash }}` — hash (uso avançado)

## Instrução de uso

Para cada template abaixo:
1. Abre a aba correspondente (ex: "Magic Link")
2. Cola o **Subject** e o **Message (HTML)** nos campos
3. Clica em **Save**

---

## 1. Magic Link

### Subject
```
Seu link de acesso ao CLIQUE EXATAS
```

### Message (HTML)
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Seu link de acesso</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">Seu link de acesso ao CLIQUE EXATAS, válido por 1 hora.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f3f4f6">
  <tr><td align="center" style="padding:40px 16px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px">
      <tr><td align="center" style="padding:0 0 32px">
        <span style="display:inline-block;vertical-align:middle;width:40px;height:40px;background:#3b82f6;border-radius:10px;text-align:center;line-height:40px;color:#fff;font-size:20px;font-weight:700;margin-right:12px">C</span>
        <span style="display:inline-block;vertical-align:middle;font-size:20px;font-weight:700;color:#111827">CLIQUE EXATAS</span>
      </td></tr>
      <tr><td style="background:#fff;border-radius:16px;padding:48px 40px;box-shadow:0 1px 2px rgba(0,0,0,.04),0 8px 24px rgba(0,0,0,.06)">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111827">Seu link de acesso</h1>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#4b5563">Clique no botão abaixo para entrar. Este link é válido por <strong>1 hora</strong> e só pode ser usado uma vez.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:10px;background:#3b82f6">
          <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;border-radius:10px">Entrar agora &rarr;</a>
        </td></tr></table>
        <p style="margin:24px 0 0;padding:16px;background:#f9fafb;border-radius:8px;color:#6b7280;font-size:13px;line-height:1.5">Se você não solicitou este link, pode ignorar este email — ninguém conseguirá entrar na sua conta sem acesso à sua caixa de entrada.</p>
      </td></tr>
      <tr><td style="padding:32px 24px 0;text-align:center">
        <p style="margin:0 0 6px;font-size:13px;color:#6b7280">CLIQUE EXATAS · Plataforma de Geometria 3D</p>
        <p style="margin:0;font-size:12px;color:#9ca3af">Email enviado para {{ .Email }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
```

---

## 2. Confirm Signup

### Subject
```
Confirme seu email no CLIQUE EXATAS
```

### Message (HTML)
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirme seu email</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">Confirme seu email para ativar sua conta.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f3f4f6">
  <tr><td align="center" style="padding:40px 16px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px">
      <tr><td align="center" style="padding:0 0 32px">
        <span style="display:inline-block;vertical-align:middle;width:40px;height:40px;background:#3b82f6;border-radius:10px;text-align:center;line-height:40px;color:#fff;font-size:20px;font-weight:700;margin-right:12px">C</span>
        <span style="display:inline-block;vertical-align:middle;font-size:20px;font-weight:700;color:#111827">CLIQUE EXATAS</span>
      </td></tr>
      <tr><td style="background:#fff;border-radius:16px;padding:48px 40px;box-shadow:0 1px 2px rgba(0,0,0,.04),0 8px 24px rgba(0,0,0,.06)">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111827">Bem-vindo! 👋</h1>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#4b5563">Só falta confirmar seu email pra ativar sua conta e começar a usar a plataforma de geometria 3D.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:10px;background:#3b82f6">
          <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;border-radius:10px">Confirmar email &rarr;</a>
        </td></tr></table>
        <p style="margin:24px 0 0;padding:16px;background:#eff6ff;border-radius:8px;color:#1e40af;font-size:13px;line-height:1.5"><strong>Você começa no trial de 7 dias do plano Pro</strong>. Aproveite todos os recursos sem limitação — depois do trial, sua conta vira Free automaticamente.</p>
      </td></tr>
      <tr><td style="padding:32px 24px 0;text-align:center">
        <p style="margin:0 0 6px;font-size:13px;color:#6b7280">CLIQUE EXATAS · Plataforma de Geometria 3D</p>
        <p style="margin:0;font-size:12px;color:#9ca3af">Se não foi você que criou essa conta, pode ignorar este email.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
```

---

## 3. Invite User

### Subject
```
Você foi convidado para o CLIQUE EXATAS
```

### Message (HTML)
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Convite</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">Alguém te convidou para o CLIQUE EXATAS.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f3f4f6">
  <tr><td align="center" style="padding:40px 16px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px">
      <tr><td align="center" style="padding:0 0 32px">
        <span style="display:inline-block;vertical-align:middle;width:40px;height:40px;background:#3b82f6;border-radius:10px;text-align:center;line-height:40px;color:#fff;font-size:20px;font-weight:700;margin-right:12px">C</span>
        <span style="display:inline-block;vertical-align:middle;font-size:20px;font-weight:700;color:#111827">CLIQUE EXATAS</span>
      </td></tr>
      <tr><td style="background:#fff;border-radius:16px;padding:48px 40px;box-shadow:0 1px 2px rgba(0,0,0,.04),0 8px 24px rgba(0,0,0,.06)">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111827">Você foi convidado</h1>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#4b5563">Você recebeu um convite para fazer parte do <strong>CLIQUE EXATAS</strong>, a plataforma de geometria 3D para professores e escolas.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:10px;background:#3b82f6">
          <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;border-radius:10px">Aceitar convite &rarr;</a>
        </td></tr></table>
        <p style="margin:24px 0 0;padding:16px;background:#f9fafb;border-radius:8px;color:#6b7280;font-size:13px;line-height:1.5">Este convite expira em 7 dias. Se você não conhece quem convidou, pode ignorar com segurança.</p>
      </td></tr>
      <tr><td style="padding:32px 24px 0;text-align:center">
        <p style="margin:0 0 6px;font-size:13px;color:#6b7280">CLIQUE EXATAS · Plataforma de Geometria 3D</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
```

---

## 4. Reset Password

### Subject
```
Redefinir senha do CLIQUE EXATAS
```

### Message (HTML)
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Redefinir senha</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">Redefina sua senha do CLIQUE EXATAS.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f3f4f6">
  <tr><td align="center" style="padding:40px 16px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px">
      <tr><td align="center" style="padding:0 0 32px">
        <span style="display:inline-block;vertical-align:middle;width:40px;height:40px;background:#3b82f6;border-radius:10px;text-align:center;line-height:40px;color:#fff;font-size:20px;font-weight:700;margin-right:12px">C</span>
        <span style="display:inline-block;vertical-align:middle;font-size:20px;font-weight:700;color:#111827">CLIQUE EXATAS</span>
      </td></tr>
      <tr><td style="background:#fff;border-radius:16px;padding:48px 40px;box-shadow:0 1px 2px rgba(0,0,0,.04),0 8px 24px rgba(0,0,0,.06)">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111827">Redefinir senha</h1>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#4b5563">Você pediu pra redefinir sua senha. Clique no botão abaixo pra criar uma nova. Este link é válido por <strong>1 hora</strong>.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:10px;background:#3b82f6">
          <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;border-radius:10px">Redefinir senha &rarr;</a>
        </td></tr></table>
        <p style="margin:24px 0 0;padding:16px;background:#fef3c7;border-radius:8px;color:#92400e;font-size:13px;line-height:1.5"><strong>Não foi você?</strong> Ignore este email. Sua senha atual continua válida e ninguém conseguirá acessar sem acesso à sua caixa de entrada.</p>
      </td></tr>
      <tr><td style="padding:32px 24px 0;text-align:center">
        <p style="margin:0 0 6px;font-size:13px;color:#6b7280">CLIQUE EXATAS · Plataforma de Geometria 3D</p>
        <p style="margin:0;font-size:12px;color:#9ca3af">Email enviado para {{ .Email }}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
```

---

## 5. Change Email Address

### Subject
```
Confirme a mudança de email do CLIQUE EXATAS
```

### Message (HTML)
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirmar mudança de email</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">Confirme sua mudança de email.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f3f4f6">
  <tr><td align="center" style="padding:40px 16px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px">
      <tr><td align="center" style="padding:0 0 32px">
        <span style="display:inline-block;vertical-align:middle;width:40px;height:40px;background:#3b82f6;border-radius:10px;text-align:center;line-height:40px;color:#fff;font-size:20px;font-weight:700;margin-right:12px">C</span>
        <span style="display:inline-block;vertical-align:middle;font-size:20px;font-weight:700;color:#111827">CLIQUE EXATAS</span>
      </td></tr>
      <tr><td style="background:#fff;border-radius:16px;padding:48px 40px;box-shadow:0 1px 2px rgba(0,0,0,.04),0 8px 24px rgba(0,0,0,.06)">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111827">Confirmar novo email</h1>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#4b5563">Você pediu pra mudar seu email. Clique no botão abaixo pra confirmar o novo endereço.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:10px;background:#3b82f6">
          <a href="{{ .ConfirmationURL }}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;border-radius:10px">Confirmar mudança &rarr;</a>
        </td></tr></table>
        <p style="margin:24px 0 0;padding:16px;background:#fef3c7;border-radius:8px;color:#92400e;font-size:13px;line-height:1.5"><strong>Não foi você?</strong> Ignore este email e sua conta continuará com o email atual.</p>
      </td></tr>
      <tr><td style="padding:32px 24px 0;text-align:center">
        <p style="margin:0 0 6px;font-size:13px;color:#6b7280">CLIQUE EXATAS · Plataforma de Geometria 3D</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
```

---

## 6. Reauthentication (OTP de 6 dígitos)

### Subject
```
Código de verificação CLIQUE EXATAS
```

### Message (HTML)
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Código de verificação</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;-webkit-font-smoothing:antialiased">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f3f4f6">
  <tr><td align="center" style="padding:40px 16px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px">
      <tr><td align="center" style="padding:0 0 32px">
        <span style="display:inline-block;vertical-align:middle;width:40px;height:40px;background:#3b82f6;border-radius:10px;text-align:center;line-height:40px;color:#fff;font-size:20px;font-weight:700;margin-right:12px">C</span>
        <span style="display:inline-block;vertical-align:middle;font-size:20px;font-weight:700;color:#111827">CLIQUE EXATAS</span>
      </td></tr>
      <tr><td style="background:#fff;border-radius:16px;padding:48px 40px;box-shadow:0 1px 2px rgba(0,0,0,.04),0 8px 24px rgba(0,0,0,.06)">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111827">Seu código de verificação</h1>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#4b5563">Use o código abaixo pra confirmar sua ação. O código expira em <strong>10 minutos</strong>.</p>
        <div style="background:#f9fafb;border:2px solid #3b82f6;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px">
          <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#111827;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">{{ .Token }}</div>
        </div>
        <p style="margin:0;padding:16px;background:#fef3c7;border-radius:8px;color:#92400e;font-size:13px;line-height:1.5"><strong>Não foi você?</strong> Ignore este email e troque sua senha — alguém pode estar tentando acessar sua conta.</p>
      </td></tr>
      <tr><td style="padding:32px 24px 0;text-align:center">
        <p style="margin:0 0 6px;font-size:13px;color:#6b7280">CLIQUE EXATAS · Plataforma de Geometria 3D</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
```
