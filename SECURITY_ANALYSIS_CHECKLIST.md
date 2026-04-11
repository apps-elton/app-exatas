# Checklist de Analise de Seguranca - Baseado em Pentest Externo

> **Nota:** O sistema anterior era Node.js/React. O sistema atual e Laravel 11 / Livewire / Blade.
> Nem todas as falhas se aplicam diretamente, mas o **principio de cada vulnerabilidade** deve ser verificado no contexto equivalente do Laravel.

---

## Parte 1 - Vulnerabilidades Corrigidas no Sistema Anterior

### CRITICAS

---

### 1. SQL Injection

**O que foi encontrado no outro sistema:**
Uma query SQL estava sendo montada com interpolacao direta de variavel do usuario, sem parametrizacao:
```js
// ANTES (vulneravel)
WHERE ur.user_id = ${decoded.userId}

// DEPOIS (corrigido)
WHERE ur.user_id = @userId  // query parametrizada
```

**O que analisar neste sistema:**
- [ ] Buscar por **todas** as ocorrencias de `DB::raw()`, `DB::select()`, `DB::statement()`, `DB::unprepared()` e verificar se alguma concatena ou interpola input do usuario
- [ ] Buscar por `whereRaw()`, `selectRaw()`, `orderByRaw()`, `groupByRaw()`, `havingRaw()` e verificar se os bindings sao usados corretamente (segundo parametro do metodo)
- [ ] Verificar se existe uso direto de `PDO` ou `mysqli` em qualquer arquivo PHP fora do framework (scripts avulsos na raiz, em `public/`, etc.)
- [ ] Verificar se queries do Eloquent ORM estao sendo usadas corretamente (sem concatenacao em `where()`, `find()`, etc.)
- [ ] Verificar se buscas com `LIKE` escapam os caracteres wildcard `%` e `_` do input do usuario antes de interpolar no pattern

**Equivalencia no Laravel:**
```php
// VULNERAVEL
DB::select("SELECT * FROM users WHERE id = {$request->id}");
$query->whereRaw("nome LIKE '%{$request->busca}%'");

// SEGURO
DB::select("SELECT * FROM users WHERE id = ?", [$request->id]);
$query->where('nome', 'like', '%' . str_replace(['%', '_'], ['\%', '\_'], $request->busca) . '%');
```

---

### 2. Rotas Administrativas/Sensiveis Desprotegidas

**O que foi encontrado no outro sistema:**
Rotas de geracao e listagem de codigos de afiliados (`/generate-codes`, `/list-codes`) estavam **totalmente abertas** - qualquer pessoa, mesmo sem autenticacao, podia acessa-las. Foram adicionados os middlewares `authenticateToken` + `requireAdmin`.

**O que analisar neste sistema:**
- [ ] Listar **todas** as rotas em `routes/web.php` e `routes/api.php` (se existir)
- [ ] Para cada rota, verificar se possui middleware de **autenticacao** (`auth`, `auth.plataforma`)
- [ ] Para cada rota administrativa, verificar se possui middleware de **autorizacao por perfil** (`perfil:administrador`, `perfil:super_admin`, etc.)
- [ ] Identificar rotas que aceitam `GET` para acoes que alteram estado (deveriam ser `POST`/`PUT`/`DELETE`)
- [ ] Verificar se existem **arquivos PHP avulsos** acessiveis diretamente pela URL (fora do framework Laravel, como scripts de debug, manutencao, migracao na pasta `public/` ou raiz do projeto)
- [ ] Verificar se existem **rotas de recuperacao, reset ou backdoor** sem autenticacao

**Equivalencia no Laravel:**
```php
// VULNERAVEL - qualquer pessoa acessa
Route::get('/admin/relatorios', [RelatorioController::class, 'index']);

// SEGURO - exige login + perfil admin
Route::middleware(['auth', 'perfil:administrador'])->group(function () {
    Route::get('/admin/relatorios', [RelatorioController::class, 'index']);
});
```

---

### 3. Rota de Acao Critica sem Restricao de Perfil

**O que foi encontrado no outro sistema:**
A rota `POST /:id/simulate-approval` permitia que **qualquer usuario autenticado** simulasse a aprovacao de um pagamento. Foi restrita para exigir `requireAdmin`.

**O que analisar neste sistema:**
- [ ] Identificar todas as rotas que executam **acoes criticas**: aprovacao, reprovacao, liberacao de pagamento, exclusao, alteracao de status, impersonacao
- [ ] Para cada uma, verificar se o middleware de perfil/role esta aplicado corretamente
- [ ] Verificar se o **controller valida ownership** (o usuario que esta agindo tem permissao sobre AQUELE recurso especifico, nao apenas sobre o tipo de recurso)
- [ ] Verificar se um usuario da Empresa A pode agir sobre recursos da Empresa B (IDOR cross-tenant)

**Equivalencia no Laravel:**
```php
// VULNERAVEL - qualquer usuario autenticado aprova
Route::post('/viagens/{viagem}/aprovar', [ViagemController::class, 'aprovar'])
    ->middleware('auth');

// SEGURO - somente gestor/admin + verificacao de empresa
Route::post('/viagens/{viagem}/aprovar', [ViagemController::class, 'aprovar'])
    ->middleware(['auth', 'perfil:administrador,gestor']);

// E no controller:
public function aprovar(Viagem $viagem) {
    if ($viagem->empresa_id !== auth()->user()->empresa_id) {
        abort(403);
    }
    // ...
}
```

---

### ALTAS

---

### 4. Role/Perfil Exposto nas Respostas de Login

**O que foi encontrado no outro sistema:**
O campo `role` era retornado nas respostas de login, verify-code, googleLogin e googleRegister. Tambem estava no payload do JWT. Um atacante podia ver seu role, manipular o localStorage, e o frontend confiava nesse valor para liberar acesso a rotas admin. O role foi removido das respostas e do JWT; o middleware agora busca do banco a cada request.

**O que analisar neste sistema:**
- [ ] Verificar o que o `LoginController` e `PlataformaLoginController` retornam apos login (redirect, JSON, session data)
- [ ] Verificar se o campo `perfil` e armazenado em cookie, session client-side, ou exposto em alguma resposta JSON
- [ ] Verificar se os models de usuario possuem `$hidden` corretamente configurado para nao serializar campos sensiveis
- [ ] Verificar se existe alguma rota de API que retorna o objeto usuario com o perfil exposto desnecessariamente
- [ ] Verificar se o frontend (Blade/Livewire) confia em algum dado client-side para exibir/esconder funcionalidades admin (em vez de validar no servidor)

**Equivalencia no Laravel:**
```php
// VULNERAVEL - expoe role na resposta
return response()->json([
    'user' => $usuario, // se $hidden nao inclui 'perfil', ele aparece
    'token' => $token,
]);

// SEGURO - model com $hidden
class Usuario extends Authenticatable {
    protected $hidden = ['senha', 'remember_token'];
    // O 'perfil' pode ser retornado se necessario para o frontend,
    // mas o backend NUNCA deve confiar em dados vindos do client
}
```

---

### 5. Endpoint de Configuracao do Sistema Expondo Dados Sensiveis

**O que foi encontrado no outro sistema:**
`GET /system/config` retornava configuracoes sensiveis para qualquer usuario autenticado. Foi protegido com `requireAdmin` e criado um endpoint `/system/config/public` com dados nao-sensiveis.

**O que analisar neste sistema:**
- [ ] Verificar se existe alguma rota que expoe configuracoes do sistema (empresa, plataforma) para usuarios sem permissao adequada
- [ ] Verificar se endpoints de configuracao retornam dados sensiveis (chaves API, credenciais, configs internas) que nao deveriam ser acessiveis
- [ ] Verificar se os `ConfiguracaoController` e `SiteController` possuem restricao de perfil
- [ ] Verificar se existem arquivos de configuracao (`.env`, `env_prod`, etc.) acessiveis via URL

**Equivalencia no Laravel:**
```php
// VULNERAVEL - qualquer usuario ve configs
Route::get('/configuracoes', [ConfigController::class, 'index'])->middleware('auth');

// SEGURO - somente admin
Route::get('/configuracoes', [ConfigController::class, 'index'])
    ->middleware(['auth', 'perfil:administrador']);
```

---

### 6. Frontend Confiando em Dados Client-Side para Controle de Acesso

**O que foi encontrado no outro sistema:**
As rotas `/admin/*` usavam `ProtectedRoute` que verificava role no localStorage. Um atacante podia alterar o localStorage para se passar por admin. Foi criado `AdminRoute` que valida o role via `GET /auth/me` no servidor antes de renderizar.

**O que analisar neste sistema:**
- [ ] Verificar se views Blade ou componentes Livewire exibem/escondem conteudo admin baseados apenas em dados da session do browser ou JavaScript client-side
- [ ] Verificar se toda restricao visual no frontend tem uma **correspondente validacao no backend** (middleware + controller)
- [ ] Verificar se a manipulacao de session/cookies pelo usuario poderia conceder acesso visual a areas restritas (mesmo que o backend bloqueie as acoes, a informacao visual pode vazar dados)

**Equivalencia no Laravel/Blade:**
```blade
{{-- ACEITAVEL - pois Blade e renderizado no servidor --}}
@if(auth()->user()->perfil === 'administrador')
    <a href="/admin">Painel Admin</a>
@endif

{{-- VULNERAVEL - JavaScript client-side decidindo acesso --}}
<script>
    if (localStorage.getItem('role') === 'admin') {
        document.getElementById('admin-panel').style.display = 'block';
    }
</script>
```

> **Nota:** Em Laravel com Blade, as views sao renderizadas no servidor, o que mitiga naturalmente este problema. Porem, verificar componentes JavaScript/Alpine.js que possam tomar decisoes de acesso no client.

---

### 7. Validacao de Role Apos Login via Servidor

**O que foi encontrado no outro sistema:**
Apos login (normal, admin, 2FA, Google), o frontend agora chama `GET /auth/me` para obter o role real do servidor, em vez de confiar no que veio na resposta de login. O `MaintenanceWrapper` tambem foi corrigido para nao confiar em localStorage.

**O que analisar neste sistema:**
- [ ] Verificar se apos o login, a session Laravel e populada com dados do usuario vindos diretamente do banco
- [ ] Verificar se o middleware `ResolverEmpresa` e `VerificarPerfil` buscam dados frescos do banco a cada request (em vez de confiar em dados cacheados na session)
- [ ] Verificar se a impersonacao (session de admin atuando como usuario de empresa) valida tokens e expiracao a cada request
- [ ] Verificar se existe algum mecanismo client-side (Alpine.js, JavaScript) que armazena e reutiliza o perfil sem revalidar com o servidor

---

## Parte 2 - Verificacoes Adicionais de Seguranca

---

### 8. Validacao de Campos de Input/Textarea contra Code Injection

**Objetivo:** Garantir que todos os campos de entrada do sistema validem e restrinjam o conteudo para impedir injecao de codigo (HTML, JavaScript, SQL, PHP).

**O que analisar:**
- [ ] Verificar se **todo** metodo `store()` e `update()` em **todos** os controllers possui `$request->validate()` com regras adequadas
- [ ] Verificar se campos `string` possuem regra `max` (limite de caracteres)
- [ ] Verificar se campos numericos possuem `numeric`, `integer`, `min`, `max`
- [ ] Verificar se campos de email possuem `email`
- [ ] Verificar se campos de data possuem `date`, `date_format`
- [ ] Verificar se campos de selecao possuem `in:opcao1,opcao2,...` ou `Rule::in()`
- [ ] Verificar se existe algum controller que usa `$request->all()` ou `$request->except()` diretamente em `create()`/`update()` sem validacao previa
- [ ] Verificar se valores de configuracao (chave-valor) sao validados com whitelist de chaves permitidas
- [ ] Verificar se **todas** as views Blade usam `{{ }}` (escapado) e nao `{!! !!}` (raw) para dados do usuario
- [ ] Verificar se dados do usuario inseridos em blocos `<style>` ou `<script>` sao tratados no contexto correto (CSS/JS escaping e diferente de HTML escaping)

**Exemplo de validacao adequada no Laravel:**
```php
$validated = $request->validate([
    'nome' => ['required', 'string', 'max:255'],
    'email' => ['required', 'email', 'max:255'],
    'descricao' => ['nullable', 'string', 'max:5000'],
    'valor' => ['required', 'numeric', 'min:0', 'max:999999.99'],
    'status' => ['required', Rule::in(['ativo', 'inativo'])],
    'data' => ['required', 'date', 'after_or_equal:today'],
]);
```

---

### 9. Sanitizacao de Dados

**Objetivo:** Alem da validacao, garantir que dados sao sanitizados (limpos) antes de serem armazenados ou exibidos.

**O que analisar:**
- [ ] Verificar se existe uso de `strip_tags()`, `htmlspecialchars()`, `htmlentities()` onde necessario
- [ ] Verificar se o Blade `{{ }}` e usado consistentemente (ele aplica `htmlspecialchars` automaticamente)
- [ ] Verificar se campos que aceitam texto livre (observacoes, descricoes, mensagens) passam por sanitizacao antes de ir ao banco
- [ ] Verificar se nomes de arquivo originais de uploads sao sanitizados antes de serem armazenados (remover caracteres especiais, path traversal `../`, null bytes)
- [ ] Verificar se dados retornados do banco sao escapados ao serem renderizados em contextos diferentes (HTML, CSS, JavaScript, URL, SQL)
- [ ] Verificar se existe alguma instancia de `{!! !!}` em views Blade renderizando dados do usuario sem tratamento

---

### 10. Seguranca de Upload de Arquivos

**Objetivo:** Garantir que o sistema de upload nao permita envio de arquivos maliciosos que possam ser executados no servidor ou usados para ataque.

**O que analisar:**

#### 10.1 Validacao de Tipo Real do Arquivo
- [ ] Verificar se **todos** os endpoints de upload validam o tipo do arquivo
- [ ] Verificar se a validacao usa `mimetypes` (verifica conteudo real/magic bytes) alem de `mimes` (verifica extensao)
- [ ] Verificar se arquivos `.php`, `.phtml`, `.php5`, `.shtml`, `.cgi`, `.pl`, `.py`, `.sh`, `.bash`, `.exe`, `.bat` sao **explicitamente bloqueados**
- [ ] Verificar se extensoes duplas (ex: `imagem.jpg.php`) sao tratadas
- [ ] Considerar uso de biblioteca de verificacao real de tipo como `finfo_file()` ou Intervention Image para imagens

**Exemplo de validacao robusta:**
```php
'arquivo' => [
    'required', 'file',
    'mimes:jpg,jpeg,png,pdf,heic',                                    // verifica extensao
    'mimetypes:image/jpeg,image/png,application/pdf,image/heic',       // verifica conteudo real
    'max:10240',                                                       // 10MB
],
```

#### 10.2 Limite de Tamanho
- [ ] Verificar se **todos** os endpoints de upload possuem regra `max` (em KB)
- [ ] Verificar se os limites sao consistentes entre endpoints similares
- [ ] Verificar `upload_max_filesize` e `post_max_size` no `php.ini`
- [ ] Verificar se o frontend tambem impoe limite (para UX, nao para seguranca)

#### 10.3 Armazenamento Seguro
- [ ] Verificar se arquivos sao armazenados **fora** do diretorio web publico (disco `local` em vez de `public`)
- [ ] Se armazenados em diretorio publico, verificar se existe `.htaccess` bloqueando execucao PHP
- [ ] Verificar se o nome do arquivo armazenado e gerado pelo sistema (hash aleatorio) e nao o nome original do usuario
- [ ] Verificar se existe protecao contra path traversal no caminho de armazenamento

#### 10.4 Acesso aos Arquivos
- [ ] Verificar se arquivos sao servidos por controller autenticado (em vez de URL publica direta)
- [ ] Verificar se existe controle de acesso por empresa (usuario da Empresa A nao acessa arquivo da Empresa B)
- [ ] Verificar se headers `Content-Disposition` e `X-Content-Type-Options: nosniff` sao enviados ao servir arquivos

#### 10.5 Processamento de Imagens
- [ ] Verificar se imagens sao re-processadas apos upload (re-encoding strip EXIF e codigo embedded)
- [ ] Considerar uso de Intervention Image (`Image::make()->encode()`) para sanitizar imagens

---

### 11. Limites de Tamanho e Caracteres em Campos

**Objetivo:** Prevenir abuso por payload excessivo (DoS, bloat de banco, memory exhaustion).

**O que analisar:**
- [ ] Verificar se **todo** campo `string` na validacao possui regra `max`
- [ ] Verificar se os limites de `max` no validation sao **compativeis** com o tamanho da coluna no banco (`VARCHAR(255)` = `max:255`)
- [ ] Verificar se campos `text` / `longText` no banco possuem limite logico na validacao (ex: `max:5000` ou `max:10000`)
- [ ] Verificar se campos `decimal` possuem `min` e `max` para evitar valores negativos ou absurdos
- [ ] Verificar se campos de telefone, CPF, CNPJ possuem validacao de formato (`regex`)

**Tabela de referencia:**

| Tipo de Campo | Regra Minima Recomendada |
|---|---|
| Nome / Titulo | `string\|max:255` |
| Descricao / Observacao | `string\|max:5000` |
| Email | `email\|max:255` |
| Telefone | `string\|max:20\|regex:/^[\d\s\(\)\-\+]+$/` |
| CPF | `string\|size:14\|regex:/^\d{3}\.\d{3}\.\d{3}\-\d{2}$/` |
| CNPJ | `string\|size:18\|regex:/^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/` |
| Valor monetario | `numeric\|min:0\|max:999999.99` |
| Cor hexadecimal | `string\|regex:/^#[0-9a-fA-F]{3,8}$/` |
| Icone (classe CSS) | `string\|max:100\|regex:/^[a-zA-Z0-9\-_ ]+$/` |

---

### 12. Politica de Senhas Seguras e Troca Periodica

**Objetivo:** Garantir que o sistema incentive e enforce senhas seguras, e que haja mecanismo de rotacao periodica.

**O que analisar:**

#### 12.1 Complexidade de Senha
- [ ] Verificar as regras de validacao de senha em **todos** os pontos de criacao/alteracao de usuario
- [ ] Verificar se exige: minimo 8 caracteres, letras maiusculas, minusculas, numeros e caracteres especiais
- [ ] Verificar se existe alguma senha padrao hardcoded no codigo (ex: `'123456'`, `'password'`, `'Mudar@1234'`)
- [ ] Verificar seeders e scripts de criacao de usuarios para senhas fracas

**Regra recomendada no Laravel:**
```php
use Illuminate\Validation\Rules\Password;

'senha' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()->symbols()],
```

#### 12.2 Troca Periodica
- [ ] Verificar se existe coluna `senha_alterada_em` (ou similar) na tabela de usuarios
- [ ] Verificar se existe middleware que verifica idade da senha e forca troca apos periodo definido (ex: 90 dias)
- [ ] Verificar se usuarios criados com senhas padrao sao obrigados a trocar no primeiro login
- [ ] Verificar se existe fluxo de "esqueci minha senha" implementado e protegido com rate limiting

#### 12.3 Protecao contra Forca Bruta
- [ ] Verificar se endpoints de login possuem rate limiting (`throttle` middleware)
- [ ] Verificar se existe mecanismo de lockout apos N tentativas falhas
- [ ] Verificar se tentativas falhas sao logadas para auditoria
- [ ] Verificar se existe protecao contra credential stuffing (CAPTCHA apos N falhas)

#### 12.4 Hashing
- [ ] Verificar se senhas sao armazenadas com hashing seguro (bcrypt ou Argon2)
- [ ] Verificar se o Model de usuario usa cast `'hashed'` ou `Hash::make()` em todos os pontos de criacao/alteracao
- [ ] Verificar se nenhum endpoint retorna o hash da senha na resposta

---

## Parte 3 - Resultado Esperado da Analise

Apos a analise de todos os pontos acima, o resultado deve conter para cada item:

1. **Status:** Vulneravel / Seguro / Nao Aplicavel
2. **Evidencia:** Arquivo, linha, trecho de codigo que comprova
3. **Severidade:** Critica / Alta / Media / Baixa
4. **Correcao Proposta:** Codigo ou configuracao especifica para remediar
5. **Correcao Aplicada:** Confirmacao de que a correcao foi implementada

---

## Parte 4 - Resumo de Categorias para Analise Paralela

Para otimizar a analise, as verificacoes podem ser divididas em **5 frentes paralelas**:

| Frente | Itens Cobertos | Escopo de Arquivos |
|---|---|---|
| **SQL Injection & Queries** | 1, parte do 8 | Models, Controllers, scripts PHP avulsos, `config/database.php` |
| **Rotas & Controle de Acesso** | 2, 3, 4, 5, 6, 7 | `routes/web.php`, todos os Middlewares, Controllers de Auth, Impersonacao |
| **Input Validation & XSS** | 8, 9, 11 | Todos os Controllers (metodos store/update), todas as Views Blade |
| **Upload de Arquivos** | 10 (10.1 a 10.5) | Controllers com upload, `config/filesystems.php`, Views com `<input type="file">` |
| **Senhas & Dados Sensiveis** | 12, parte do 4 e 5 | Controllers de Auth, Models de Usuario, Seeders, configs, `config/session.php` |

---

*Documento organizado a partir de relatorio de pentest externo.*
