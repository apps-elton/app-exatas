# GeoTeach i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate GeoTeach from a custom LanguageContext to react-i18next supporting 12 languages with browser detection and flag-based language selector.

**Architecture:** Install react-i18next + i18next-browser-languagedetector. Create JSON locale files per language. Replace all `useLanguage()` calls with `useTranslation()`. Replace `LanguageToggle` with a new `LanguageSelector` dropdown with flags. Add RTL support for Arabic.

**Tech Stack:** react-i18next, i18next, i18next-browser-languagedetector, Tailwind RTL variants, shadcn/ui DropdownMenu

**Spec:** `docs/superpowers/specs/2026-04-12-i18n-internationalization-design.md`

---

## File Structure

### Files to Create
- `src/i18n/index.ts` — i18next configuration and initialization
- `src/i18n/locales/pt-BR.json` — Portuguese translations (migrated from LanguageContext + new hardcoded strings)
- `src/i18n/locales/en.json` — English translations
- `src/i18n/locales/es.json` — Spanish translations
- `src/i18n/locales/fr.json` — French translations
- `src/i18n/locales/de.json` — German translations
- `src/i18n/locales/it.json` — Italian translations
- `src/i18n/locales/ru.json` — Russian translations
- `src/i18n/locales/ja.json` — Japanese translations
- `src/i18n/locales/zh-CN.json` — Chinese Simplified translations
- `src/i18n/locales/ko.json` — Korean translations
- `src/i18n/locales/ar.json` — Arabic translations
- `src/i18n/locales/hi.json` — Hindi translations
- `src/components/LanguageSelector.tsx` — New flag-based language dropdown

### Files to Modify
- `src/main.tsx` — Import i18n init
- `src/App.tsx` — Remove LanguageProvider, add RTL dir management
- `src/components/SpaceSculptor.tsx` — Remove LanguageProvider/useLanguage, use useTranslation
- `src/components/GeometryCanvas.tsx` — Replace useLanguage with useTranslation
- `src/components/ControlPanel.tsx` — Replace useLanguage with useTranslation
- `src/components/EquationEditor.tsx` — Replace useLanguage with useTranslation
- `src/components/GeometryCalculations.tsx` — Replace useLanguage with useTranslation
- `src/components/AdvancedDrawingToolbar.tsx` — Replace useLanguage with useTranslation
- `src/components/ImageDownloadMenu.tsx` — Replace useLanguage with useTranslation
- `src/components/AppSidebar.tsx` — Replace hardcoded PT with t() calls
- `src/pages/Login.tsx` — Replace hardcoded PT with t() calls
- `src/pages/Signup.tsx` — Replace hardcoded PT with t() calls
- `src/pages/Dashboard.tsx` — Replace hardcoded PT with t() calls
- `src/pages/Projects.tsx` — Replace hardcoded PT with t() calls
- `src/pages/Settings.tsx` — Replace hardcoded PT with t() calls
- `src/pages/SchoolUsers.tsx` — Replace hardcoded PT with t() calls
- `src/components/admin/AdminSidebar.tsx` — Replace hardcoded PT with t() calls
- `src/pages/admin/AdminDashboard.tsx` — Replace hardcoded PT with t() calls
- `src/pages/admin/AdminTenants.tsx` — Replace hardcoded PT with t() calls
- `src/pages/admin/AdminUsers.tsx` — Replace hardcoded PT with t() calls
- `src/pages/admin/AdminSubscriptions.tsx` — Replace hardcoded PT with t() calls
- `src/pages/admin/AdminSupport.tsx` — Replace hardcoded PT with t() calls
- `src/pages/admin/AdminSystemSettings.tsx` — Replace hardcoded PT with t() calls
- `src/pages/NotFound.tsx` — Replace hardcoded PT with t() calls
- `src/components/ErrorBoundary.tsx` — Replace hardcoded PT with t() calls

### Files to Delete
- `src/context/LanguageContext.tsx` — Replaced by i18next
- `src/components/LanguageToggle.tsx` — Replaced by LanguageSelector

---

## Task 1: Install Dependencies and Create i18n Config

**Files:**
- Modify: `package.json`
- Create: `src/i18n/index.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: Install react-i18next and dependencies**

Run:
```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

Expected: packages added to package.json dependencies

- [ ] **Step 2: Create i18n configuration file**

Create `src/i18n/index.ts`:

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import ru from './locales/ru.json';
import ja from './locales/ja.json';
import zhCN from './locales/zh-CN.json';
import ko from './locales/ko.json';
import ar from './locales/ar.json';
import hi from './locales/hi.json';

export const LANGUAGES = [
  { code: 'pt-BR', name: 'Portugues', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: 'en', name: 'English', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'es', name: 'Espanol', flag: '\u{1F1F2}\u{1F1FD}' },
  { code: 'fr', name: 'Francais', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'de', name: 'Deutsch', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'it', name: 'Italiano', flag: '\u{1F1EE}\u{1F1F9}' },
  { code: 'ru', name: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439', flag: '\u{1F1F7}\u{1F1FA}' },
  { code: 'ja', name: '\u65E5\u672C\u8A9E', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'zh-CN', name: '\u4E2D\u6587', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'ko', name: '\uD55C\uAD6D\uC5B4', flag: '\u{1F1F0}\u{1F1F7}' },
  { code: 'ar', name: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629', flag: '\u{1F1F8}\u{1F1E6}' },
  { code: 'hi', name: '\u0939\u093F\u0928\u094D\u0926\u0940', flag: '\u{1F1EE}\u{1F1F3}' },
] as const;

export const RTL_LANGUAGES = ['ar'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
      it: { translation: it },
      ru: { translation: ru },
      ja: { translation: ja },
      'zh-CN': { translation: zhCN },
      ko: { translation: ko },
      ar: { translation: ar },
      hi: { translation: hi },
    },
    fallbackLng: 'pt-BR',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'space-sculptor-language',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

- [ ] **Step 3: Import i18n in main.tsx**

Add at the top of `src/main.tsx`, before the App import:

```ts
import './i18n';
```

This must be the first non-React import so i18n initializes before any component renders.

- [ ] **Step 4: Verify build compiles**

Run: `npm run build`

Expected: Build succeeds (locale JSON files don't exist yet, so create empty `{}` placeholder files for all 12 locales to avoid import errors)

- [ ] **Step 5: Commit**

```bash
git add src/i18n/ src/main.tsx package.json package-lock.json
git commit -m "feat(i18n): install react-i18next and create i18n config"
```

---

## Task 2: Create pt-BR and en Locale Files (Migrate Existing Keys)

**Files:**
- Create: `src/i18n/locales/pt-BR.json`
- Create: `src/i18n/locales/en.json`

Migrate all ~120 existing keys from `src/context/LanguageContext.tsx` translations object into JSON files. Also extract all hardcoded Portuguese strings from pages into new keys.

- [ ] **Step 1: Create pt-BR.json with all keys**

Create `src/i18n/locales/pt-BR.json`. This file must contain ALL translation keys: the existing ~120 from LanguageContext PLUS all new keys for hardcoded strings across every page.

Key structure — flat with dot-separated namespaces:

```json
{
  "app.title": "Space Sculptor",
  "app.subtitle": "Ferramenta de Geometria 3D",

  "tabs.geometry": "Geometria 3D",
  "tabs.notes": "Quadro de Anotacoes",

  "drawing.interaction": "Interacao",
  "drawing.visualization": "Visualizacao",
  "drawing.connect_vertices": "Conectar Vertices",
  "drawing.create_planes": "Criar Planos",
  "drawing.measurements": "Medicoes",
  "drawing.constructions": "Construcoes",
  "drawing.activate_drawing": "Ativar Desenho",
  "drawing.add_equation": "Adicionar Equacao",

  "interaction.navigate": "Navegar",
  "interaction.connect_vertices": "Conectar Vertices",
  "interaction.create_plane": "Criar Plano",
  "interaction.constructions": "Construcoes",

  "visualization.cross_section": "Secao Transversal",
  "visualization.meridian_section": "Secao Meridiana",
  "visualization.dimensions": "Dimensoes",
  "visualization.shadow": "Sombra",
  "visualization.unfolding": "Planificacao",

  "vertex_modes.title": "Modos de Selecao de Vertices",
  "vertex_modes.meridian": "Meridiana",
  "vertex_modes.planes": "Planos",
  "vertex_modes.connections": "Conexoes",
  "vertex_modes.constructions": "Construcoes",

  "plane_definition.title": "Definir Plano (3 Pontos)",

  "shapes.inscribed_circumscribed": "Formas Inscritas/Circunscritas",
  "shapes.instruction": "Selecione cubo, esfera, cilindro ou cone para ver opcoes de inscricao/circunscricao",

  "colors.edge_color": "Cor das Arestas",
  "colors.meridian_section_color": "Cor Secao Meridiana",
  "colors.height_color": "Cor da Altura",
  "colors.face_color": "Cor da Face",
  "colors.inscribed_circumference_color": "Cor da Circunferencia Inscrita",
  "colors.circumscribed_circumference_color": "Cor da Circunferencia Circunscrita",
  "colors.inscribed_shapes_color": "Cor Formas Inscritas",
  "colors.circumscribed_shapes_color": "Cor Formas Circunscritas",

  "controls.title": "Controles",
  "controls.auto_rotation": "Auto Rotacao",
  "controls.reset_view": "Resetar Vista",
  "controls.download": "Baixar",

  "opacity.meridian_section": "Opacidade da Secao Meridiana",
  "opacity.general": "Opacidade",
  "speed.rotation": "Velocidade",

  "tips.teachers": "Dicas para Professores",
  "tips.pedagogical_strategies": "Estrategias Pedagogicas",
  "tips.video_interaction": "Interacao em Videoaulas",
  "tips.group_dynamics": "Dinamicas de Grupo",
  "tips.advanced_resources": "Recursos Avancados",
  "tips.special_tip": "Dica especial: Use Ctrl+Click para multiplas selecoes no quadro de anotacoes e experimente diferentes combinacoes de visualizacao para criar explicacoes mais dinamicas.",

  "strategies.rotation_3d": "Use a rotacao 3D para mostrar diferentes perspectivas da mesma forma",
  "strategies.volume_comparison": "Compare volumes usando a visualizacao simultanea de diferentes geometrias",
  "strategies.color_demonstration": "Demonstre conceitos de areas lateral e total alterando as cores",
  "strategies.notes_highlighting": "Use o quadro de anotacoes para destacar elementos importantes durante a explicacao",

  "video.record_explanations": "Grave explicacoes enquanto manipula as formas em tempo real",
  "video.digital_tablet": "Use a mesa digitalizadora para fazer anotacoes diretas sobre as formas 3D",
  "video.light_dark_mode": "Alterne entre modo claro e escuro conforme o ambiente de gravacao",
  "video.screen_captures": "Salve capturas de tela em momentos-chave da explicacao",

  "group.project_screen": "Projete na tela e peca para os alunos identificarem propriedades",
  "group.calculation_challenges": "Crie desafios de calculo usando os valores exibidos",
  "group.auto_rotation": "Use o modo de rotacao automatica para discussoes em grupo",
  "group.real_vs_virtual": "Compare formas reais com os modelos virtuais",

  "advanced.inscribed_circumscribed": "Mostre raios inscritos e circunscritos para conectar com trigonometria",
  "advanced.apothems": "Use apotemas para explicar conceitos de geometria plana vs. espacial",
  "advanced.prism_sides": "Varie numeros de lados em prismas para mostrar tendencias matematicas",
  "advanced.formula_connection": "Conecte visualizacoes com formulas matematicas em tempo real",

  "geometric.inscribed_radius": "Raio Inscrito",
  "geometric.circumscribed_radius": "Raio Circunscrito",
  "geometric.inscribed_circumference": "Circunferencia Inscrita",
  "geometric.circumscribed_circumference": "Circunferencia Circunscrita",
  "geometric.labels": "Rotulos",
  "geometric.mesh": "Malha",

  "geometry.prism": "Prisma",
  "geometry.pyramid": "Piramide",
  "geometry.cylinder": "Cilindro",
  "geometry.cone": "Cone",
  "geometry.cube": "Cubo",
  "geometry.sphere": "Esfera",
  "geometry.tetrahedron_4_faces": "Tetraedro (4 faces)",
  "geometry.octahedron_8_faces": "Octaedro (8 faces)",
  "geometry.dodecahedron_12_faces": "Dodecaedro (12 faces)",
  "geometry.icosahedron_20_faces": "Icosaedro (20 faces)",

  "geometry_form.title": "Forma Geometrica",
  "geometry_form.type": "Tipo",

  "calculations.title": "Calculos Geometricos",
  "calculations.inscribed_radius_apothem": "Raio Inscrito (Apotema)",
  "calculations.center_to_edge_midpoint": "centro ao meio da aresta",

  "options.show_vertices": "Mostrar Vertices",
  "options.show_edges": "Mostrar Arestas",
  "options.show_faces": "Mostrar Faces",
  "options.show_shadow": "Mostrar Sombra",
  "options.show_height": "Mostrar Altura",
  "options.show_radius": "Mostrar Raio",
  "options.show_inscribed_radius": "Mostrar Raio Inscrito",
  "options.show_circumscribed_radius": "Mostrar Raio Circunscrito",
  "options.show_base_radius": "Mostrar Raio da Base",

  "params.height": "Altura",
  "params.sides": "Lados",
  "params.base_edge": "Aresta da Base",
  "params.num_sides": "Numero de Lados",

  "properties.base_area": "Area da Base",
  "properties.lateral_area": "Area Lateral",
  "properties.total_area": "Area Total",
  "properties.volume": "Volume",
  "properties.inscribed_radius": "Raio Inscrito",
  "properties.circumscribed_radius": "Raio Circunscrito",
  "properties.base_area_label": "Area da Base:",
  "properties.lateral_area_label": "Area Lateral:",
  "properties.total_area_label": "Area Total:",
  "properties.inscribed_radius_label": "Raio Inscrito:",
  "properties.circumscribed_radius_label": "Raio Circunscrito:",
  "properties.volume_label": "Volume:",

  "message.connection_created": "Conexao criada!",
  "message.segment_removed": "Segmento removido!",
  "message.plane_created": "Plano criado!",
  "message.measurement_added": "Medicao adicionada!",

  "button.download": "Baixar",
  "button.clear": "Limpar",
  "button.delete": "Excluir",
  "button.create": "Criar",
  "button.cancel": "Cancelar",
  "button.save": "Salvar",
  "button.load": "Carregar",
  "button.freeze_view": "Congelar Vista",
  "button.unfreeze_view": "Descongelar Vista",
  "button.deactivate": "Desativar",
  "button.back": "Voltar",
  "button.edit": "Editar",
  "button.confirm": "Confirmar",
  "button.close": "Fechar",
  "button.search": "Buscar",

  "vertex_mode.connection": "Conexao",
  "vertex_mode.plane": "Plano",
  "vertex_mode.measurement": "Medicao",

  "color.vertex": "Vertice",
  "color.edge": "Aresta",
  "color.face": "Face",
  "color.segment": "Segmento",
  "color.plane": "Plano",

  "tool.select": "Selecao",
  "tool.pen": "Caneta",
  "tool.eraser": "Borracha",
  "tool.text": "Texto",
  "tool.unknown": "Ferramenta",

  "panel.parameters": "Parametros",
  "panel.visualization": "Visualizacao",
  "panel.style": "Estilo",
  "panel.properties": "Propriedades",

  "language.select": "Idioma",

  "sidebar.dashboard": "Dashboard",
  "sidebar.geometry3d": "Geometria 3D",
  "sidebar.my_projects": "Meus Projetos",
  "sidebar.settings": "Configuracoes",
  "sidebar.school_users": "Usuarios da Escola",
  "sidebar.tenants": "Tenants",
  "sidebar.users": "Usuarios",
  "sidebar.subscriptions": "Assinaturas",
  "sidebar.support": "Suporte",
  "sidebar.system": "Sistema",
  "sidebar.admin": "Admin",
  "sidebar.logout": "Sair",
  "sidebar.upgrade_pro": "Upgrade para Pro",
  "sidebar.upgrade_desc": "Projetos ilimitados e mais recursos",
  "sidebar.coming_soon": "Em breve",
  "sidebar.back_to_app": "Voltar ao App",
  "sidebar.user": "Usuario",

  "roles.super_admin": "Super Admin",
  "roles.admin": "Admin",
  "roles.teacher": "Professor",

  "plans.free": "Gratuito",
  "plans.teacher": "Professor",
  "plans.institution": "Instituicao",

  "auth.login": "Entrar",
  "auth.logging_in": "Entrando...",
  "auth.signup": "Criar conta",
  "auth.email": "Email",
  "auth.password": "Senha",
  "auth.your_password": "Sua senha",
  "auth.forgot_password": "Esqueci minha senha",
  "auth.no_account": "Ainda nao tem conta?",
  "auth.create_free": "Criar conta gratis",
  "auth.have_account": "Ja tem conta?",
  "auth.do_login": "Fazer login",
  "auth.access_account": "Acesse sua conta para continuar",
  "auth.wrong_credentials": "Email ou senha incorretos",
  "auth.creating_account": "Criando conta...",
  "auth.error_creating": "Erro ao criar conta. Tente novamente.",
  "auth.account_created": "Conta criada!",
  "auth.recover_password": "Recuperar senha",
  "auth.recover_desc": "Enviaremos um link para redefinir sua senha",
  "auth.email_sent": "Email enviado!",
  "auth.check_inbox": "Verifique sua caixa de entrada e clique no link para redefinir sua senha.",
  "auth.sending": "Enviando...",
  "auth.send_recovery": "Enviar link de recuperacao",
  "auth.back_to_login": "Voltar ao login",
  "auth.password_min": "A senha deve ter pelo menos 6 caracteres",
  "auth.passwords_mismatch": "As senhas nao coincidem",
  "auth.passwords_match": "Senhas coincidem",
  "auth.passwords_dont_match": "Senhas nao coincidem",
  "auth.confirm_password": "Confirmar senha",
  "auth.repeat_password": "Repita a senha",
  "auth.min_chars": "6+ caracteres",
  "auth.full_name": "Nome completo",
  "auth.new_password": "Nova senha",
  "auth.confirm_new_password": "Confirmar nova senha",
  "auth.repeat_new_password": "Repita a nova senha",

  "auth.dev_panel": "Painel de Desenvolvimento",
  "auth.dev_panel_desc": "Acesso rapido com contas de teste. Na primeira vez, a conta sera criada automaticamente.",
  "auth.test_super_admin": "Suporte e gestao global",
  "auth.test_school_admin": "Diretor / Coordenador",
  "auth.test_teacher": "Usuario individual",

  "login.hero_title": "Geometria 3D interativa para professores e escolas",
  "login.hero_solids": "Solidos 3D",
  "login.hero_tools": "Ferramentas",
  "login.hero_languages": "Idiomas",

  "signup.title_teacher": "Criar conta",
  "signup.title_school": "Cadastrar Escola",
  "signup.subtitle": "Comece gratis e explore geometria 3D como nunca antes",
  "signup.choose_type": "Como voce quer usar o GeoTeach?",
  "signup.type_teacher": "Sou Professor",
  "signup.type_teacher_desc": "Conta individual gratuita para usar geometria 3D",
  "signup.type_school": "Sou Escola",
  "signup.type_school_desc": "Cadastre sua escola e convide professores",
  "signup.school_name": "Nome da Escola",
  "signup.school_placeholder": "Ex: Colegio Sao Paulo",
  "signup.admin_name": "Seu nome (administrador)",
  "signup.feature_1": "Visualize 20+ solidos geometricos em 3D",
  "signup.feature_2": "Use mesa digitalizadora com sensibilidade a pressao",
  "signup.feature_3": "Crie cortes, planificacoes e construcoes geometricas",
  "signup.feature_4": "Salve e compartilhe seus projetos",
  "signup.invalid_invite": "Convite invalido, expirado ou ja utilizado.",
  "signup.school_name_required": "Informe o nome da escola",
  "signup.email_exists": "Este email ja esta cadastrado",
  "signup.error_school": "Erro ao criar escola: ",
  "signup.error_invite": "Erro ao aceitar convite: ",
  "signup.unexpected_error": "Erro inesperado. Tente novamente.",
  "signup.verifying_invite": "Verificando convite...",
  "signup.invalid_invite_title": "Convite invalido",
  "signup.account_created_title": "Conta criada!",
  "signup.go_to_login": "Ir para o login",
  "signup.register_school": "Cadastrar Escola",
  "signup.create_free_account": "Criar conta gratis",

  "dashboard.greeting": "Ola, {{name}}!",
  "dashboard.subtitle": "Seu painel de atividades no GeoTeach",
  "dashboard.projects": "Projetos",
  "dashboard.plan": "Plano",
  "dashboard.school": "Escola",
  "dashboard.individual": "Individual",
  "dashboard.role": "Cargo",
  "dashboard.recent_projects": "Projetos Recentes",
  "dashboard.view_all": "Ver todos",
  "dashboard.no_projects": "Voce ainda nao criou nenhum projeto.",
  "dashboard.create_first": "Criar primeiro projeto",
  "dashboard.upgrade_title": "Faca upgrade para desbloquear mais recursos",
  "dashboard.upgrade_desc": "Projetos ilimitados, mais armazenamento e funcionalidades avancadas.",

  "projects.title": "Meus Projetos",
  "projects.used_of": "de {{limit}} projetos utilizados",
  "projects.new": "Novo Projeto",
  "projects.search": "Buscar projetos...",
  "projects.none_found": "Nenhum projeto encontrado",
  "projects.none_yet": "Nenhum projeto ainda",
  "projects.try_other": "Tente buscar com outros termos",
  "projects.create_first_desc": "Crie seu primeiro projeto para comecar",
  "projects.create_first": "Criar primeiro projeto",
  "projects.public": "Publico",
  "projects.private": "Privado",
  "projects.duplicate": "Duplicar",
  "projects.make_private": "Tornar privado",
  "projects.make_public": "Tornar publico",
  "projects.delete": "Excluir",
  "projects.confirm_delete": "Tem certeza que deseja excluir este projeto?",
  "projects.default_name": "Projeto {{number}}",
  "projects.copy_suffix": "(copia)",

  "settings.title": "Configuracoes",
  "settings.subtitle": "Gerencie seu perfil, seguranca e plano",
  "settings.tab_profile": "Perfil",
  "settings.tab_security": "Seguranca",
  "settings.tab_plan": "Meu Plano",
  "settings.personal_info": "Informacoes Pessoais",
  "settings.full_name": "Nome completo",
  "settings.email_readonly": "O email nao pode ser alterado",
  "settings.saved": "Salvo",
  "settings.saving": "Salvando...",
  "settings.save_changes": "Salvar alteracoes",
  "settings.error_save": "Erro ao salvar perfil",
  "settings.profile_updated": "Perfil atualizado",
  "settings.change_password": "Alterar Senha",
  "settings.min_chars": "Minimo 6 caracteres",
  "settings.changing": "Alterando...",
  "settings.change_password_btn": "Alterar senha",
  "settings.error_password": "Erro ao alterar senha",
  "settings.password_changed": "Senha alterada com sucesso",
  "settings.active_session": "Sessao Ativa",
  "settings.logged_since": "Voce esta logado desde {{date}}",
  "settings.current_browser": "Navegador atual — ativo agora",
  "settings.current_plan": "Plano Atual",
  "settings.projects_used": "Projetos usados",
  "settings.storage": "Armazenamento",
  "settings.all_plans": "Todos os Planos",
  "settings.current": "Atual",
  "settings.plan_free_price": "R$ 0",
  "settings.plan_teacher_price": "R$ 29/mes",
  "settings.plan_institution_price": "R$ 299/mes",

  "school.title": "Minha Escola",
  "school.users": "Usuarios",
  "school.invite": "Convidar",

  "admin.dashboard": "Dashboard",
  "admin.tenants": "Tenants",
  "admin.users": "Usuarios",
  "admin.subscriptions": "Assinaturas",
  "admin.support": "Suporte",
  "admin.system": "Sistema",
  "admin.super_admin": "Super Admin",
  "admin.new_tenant": "Novo Tenant",
  "admin.error_loading": "Erro ao carregar",
  "admin.tenant_created": "Tenant criado com sucesso",

  "common.email": "Email",
  "common.loading": "Carregando...",
  "common.error": "Erro",
  "common.success": "Sucesso",
  "common.coming_soon": "Em breve",

  "errors.generic": "Ocorreu um erro inesperado",
  "errors.try_again": "Tente novamente",
  "errors.page_not_found": "Pagina nao encontrada",
  "errors.go_home": "Voltar ao inicio"
}
```

**IMPORTANT:** The actual file must include proper Portuguese accented characters (a, e, i, o, u with accents, c-cedilha, til). The above uses simplified ASCII for plan readability. When implementing, use the exact Portuguese text from `LanguageContext.tsx` for migrated keys, and from each page file for new keys.

- [ ] **Step 2: Create en.json with all English translations**

Create `src/i18n/locales/en.json` — same structure as pt-BR.json but in English. Migrate existing English translations from `LanguageContext.tsx` `en` object. For new keys (dashboard, projects, settings, auth, admin, sidebar), write proper English translations.

- [ ] **Step 3: Verify both files parse correctly**

Run:
```bash
node -e "const pt = require('./src/i18n/locales/pt-BR.json'); const en = require('./src/i18n/locales/en.json'); console.log('pt keys:', Object.keys(pt).length, 'en keys:', Object.keys(en).length); const ptKeys = new Set(Object.keys(pt)); const enKeys = new Set(Object.keys(en)); const missing = [...ptKeys].filter(k => !enKeys.has(k)); if (missing.length) { console.log('Missing in en:', missing); process.exit(1); } console.log('OK: all keys match');"
```

Expected: Both files have the same number of keys and all keys match.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/pt-BR.json src/i18n/locales/en.json
git commit -m "feat(i18n): add pt-BR and en locale files with all translation keys"
```

---

## Task 3: Create Translation Files for All 10 Remaining Languages

**Files:**
- Create: `src/i18n/locales/es.json`
- Create: `src/i18n/locales/fr.json`
- Create: `src/i18n/locales/de.json`
- Create: `src/i18n/locales/it.json`
- Create: `src/i18n/locales/ru.json`
- Create: `src/i18n/locales/ja.json`
- Create: `src/i18n/locales/zh-CN.json`
- Create: `src/i18n/locales/ko.json`
- Create: `src/i18n/locales/ar.json`
- Create: `src/i18n/locales/hi.json`

Each file must have the EXACT same set of keys as `pt-BR.json`, translated into the target language. Use the `en.json` as reference for meaning where helpful.

- [ ] **Step 1: Create es.json (Spanish - LATAM)**

Translate all keys to Latin American Spanish. Use "ustedes" form, not "vosotros". Example keys:
- `"auth.login": "Iniciar sesion"`
- `"dashboard.greeting": "Hola, {{name}}!"`
- `"projects.title": "Mis Proyectos"`

- [ ] **Step 2: Create fr.json (French)**

Translate all keys to French. Example keys:
- `"auth.login": "Se connecter"`
- `"dashboard.greeting": "Bonjour, {{name}} !"`
- `"projects.title": "Mes Projets"`

- [ ] **Step 3: Create de.json (German)**

Translate all keys to German. Example keys:
- `"auth.login": "Anmelden"`
- `"dashboard.greeting": "Hallo, {{name}}!"`
- `"projects.title": "Meine Projekte"`

- [ ] **Step 4: Create it.json (Italian)**

Translate all keys to Italian.

- [ ] **Step 5: Create ru.json (Russian)**

Translate all keys to Russian (Cyrillic script).

- [ ] **Step 6: Create ja.json (Japanese)**

Translate all keys to Japanese. Use polite form (desu/masu).

- [ ] **Step 7: Create zh-CN.json (Simplified Chinese)**

Translate all keys to Simplified Chinese.

- [ ] **Step 8: Create ko.json (Korean)**

Translate all keys to Korean.

- [ ] **Step 9: Create ar.json (Arabic)**

Translate all keys to Modern Standard Arabic. Text direction is RTL — handled by app config, not in the JSON.

- [ ] **Step 10: Create hi.json (Hindi)**

Translate all keys to Hindi (Devanagari script).

- [ ] **Step 11: Verify all locale files have matching keys**

Run:
```bash
node -e "
const fs = require('fs');
const locales = ['pt-BR','en','es','fr','de','it','ru','ja','zh-CN','ko','ar','hi'];
const base = JSON.parse(fs.readFileSync('src/i18n/locales/pt-BR.json','utf8'));
const baseKeys = Object.keys(base).sort();
let ok = true;
for (const loc of locales) {
  const data = JSON.parse(fs.readFileSync('src/i18n/locales/' + loc + '.json','utf8'));
  const keys = Object.keys(data).sort();
  const missing = baseKeys.filter(k => !keys.includes(k));
  const extra = keys.filter(k => !baseKeys.includes(k));
  if (missing.length) { console.log(loc + ' missing:', missing); ok = false; }
  if (extra.length) { console.log(loc + ' extra:', extra); ok = false; }
}
if (ok) console.log('All 12 locale files have matching keys');
else process.exit(1);
"
```

Expected: "All 12 locale files have matching keys"

- [ ] **Step 12: Commit**

```bash
git add src/i18n/locales/
git commit -m "feat(i18n): add translation files for all 12 languages"
```

---

## Task 4: Create LanguageSelector Component

**Files:**
- Create: `src/components/LanguageSelector.tsx`

- [ ] **Step 1: Create the LanguageSelector component**

Create `src/components/LanguageSelector.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { LANGUAGES, RTL_LANGUAGES } from '@/i18n';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    const dir = RTL_LANGUAGES.includes(code) ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = code;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang.flag} {currentLang.name}</span>
          <span className="sm:hidden">{currentLang.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={i18n.language === lang.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 2: Verify component compiles**

Run: `npm run build`

Expected: No TypeScript errors for LanguageSelector.tsx

- [ ] **Step 3: Commit**

```bash
git add src/components/LanguageSelector.tsx
git commit -m "feat(i18n): create LanguageSelector component with flags for 12 languages"
```

---

## Task 5: Wire Up i18n in App.tsx and Place LanguageSelector

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/AppSidebar.tsx`
- Modify: `src/pages/Login.tsx`
- Modify: `src/pages/Signup.tsx`

- [ ] **Step 1: Add RTL effect and remove LanguageProvider from App.tsx**

In `src/App.tsx`, add an effect component that sets `dir` and `lang` on the html element when the language changes:

```tsx
import { useTranslation } from 'react-i18next';
import { RTL_LANGUAGES } from '@/i18n';
import { useEffect } from 'react';

function DirectionManager() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const dir = RTL_LANGUAGES.includes(i18n.language) ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  return null;
}
```

Add `<DirectionManager />` inside the provider tree (after `<AuthProvider>`).

Remove any `LanguageProvider` import if present (currently App.tsx doesn't have one, but verify).

- [ ] **Step 2: Add LanguageSelector to AppSidebar**

In `src/components/AppSidebar.tsx`, import `LanguageSelector` and add it in the sidebar footer area, above the logout button.

```tsx
import { LanguageSelector } from '@/components/LanguageSelector';
```

Place `<LanguageSelector />` in the sidebar footer section.

- [ ] **Step 3: Add LanguageSelector to Login page**

In `src/pages/Login.tsx`, add the LanguageSelector in the top-right corner:

```tsx
import { LanguageSelector } from '@/components/LanguageSelector';
```

Add at the top of the page layout:
```tsx
<div className="absolute top-4 right-4 z-10">
  <LanguageSelector />
</div>
```

- [ ] **Step 4: Add LanguageSelector to Signup page**

Same pattern as Login — add LanguageSelector in top-right corner of `src/pages/Signup.tsx`.

- [ ] **Step 5: Verify the app starts and selector shows**

Run: `npm run dev`

Open browser, verify:
1. Language selector appears on login page (top-right)
2. Language selector appears in sidebar when logged in
3. Clicking a language changes i18n language (check with React DevTools or console)

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/AppSidebar.tsx src/pages/Login.tsx src/pages/Signup.tsx
git commit -m "feat(i18n): wire LanguageSelector into App, sidebar, login, and signup"
```

---

## Task 6: Migrate Geometry Components from useLanguage to useTranslation

**Files:**
- Modify: `src/components/SpaceSculptor.tsx`
- Modify: `src/components/GeometryCanvas.tsx`
- Modify: `src/components/ControlPanel.tsx`
- Modify: `src/components/EquationEditor.tsx`
- Modify: `src/components/GeometryCalculations.tsx`
- Modify: `src/components/AdvancedDrawingToolbar.tsx`
- Modify: `src/components/ImageDownloadMenu.tsx`

For each file, the migration is the same pattern:

- [ ] **Step 1: Migrate SpaceSculptor.tsx**

Replace:
```ts
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
```
With:
```ts
import { useTranslation } from 'react-i18next';
```

Replace:
```ts
const { t } = useLanguage();
```
With:
```ts
const { t } = useTranslation();
```

Remove the `<LanguageProvider>` wrapper from the component's render if present. Remove the `<LanguageToggle />` import and usage (it's replaced by LanguageSelector in the sidebar).

- [ ] **Step 2: Migrate GeometryCanvas.tsx**

Same pattern: replace `useLanguage` import/call with `useTranslation`.

- [ ] **Step 3: Migrate ControlPanel.tsx**

Same pattern.

- [ ] **Step 4: Migrate EquationEditor.tsx**

Same pattern.

- [ ] **Step 5: Migrate GeometryCalculations.tsx**

Same pattern.

- [ ] **Step 6: Migrate AdvancedDrawingToolbar.tsx**

Same pattern.

- [ ] **Step 7: Migrate ImageDownloadMenu.tsx**

Same pattern.

- [ ] **Step 8: Verify build compiles**

Run: `npm run build`

Expected: No errors. All geometry components now use react-i18next.

- [ ] **Step 9: Commit**

```bash
git add src/components/SpaceSculptor.tsx src/components/GeometryCanvas.tsx src/components/ControlPanel.tsx src/components/EquationEditor.tsx src/components/GeometryCalculations.tsx src/components/AdvancedDrawingToolbar.tsx src/components/ImageDownloadMenu.tsx
git commit -m "refactor(i18n): migrate geometry components from useLanguage to useTranslation"
```

---

## Task 7: Replace Hardcoded Strings in Auth Pages (Login + Signup)

**Files:**
- Modify: `src/pages/Login.tsx`
- Modify: `src/pages/Signup.tsx`

- [ ] **Step 1: Replace all hardcoded strings in Login.tsx**

Add `useTranslation` import. Replace every hardcoded Portuguese string with `t('key')` calls. Examples:

```tsx
const { t } = useTranslation();

// Before:
<h1>Entrar</h1>
// After:
<h1>{t('auth.login')}</h1>

// Before:
<p>Acesse sua conta para continuar</p>
// After:
<p>{t('auth.access_account')}</p>

// Before:
placeholder="Email"
// After:
placeholder={t('auth.email')}
```

Replace ALL strings in the file — labels, placeholders, error messages, button text, test account descriptions, hero section text.

- [ ] **Step 2: Replace all hardcoded strings in Signup.tsx**

Same approach for Signup.tsx. Replace every Portuguese string with `t()` calls. Handle the school name placeholder, feature bullets, error messages, form labels, etc.

- [ ] **Step 3: Verify Login and Signup pages render correctly**

Run: `npm run dev`

Visit `/login` and `/signup`. Switch languages using the selector. Verify all text changes.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Login.tsx src/pages/Signup.tsx
git commit -m "feat(i18n): replace hardcoded strings in Login and Signup pages"
```

---

## Task 8: Replace Hardcoded Strings in Dashboard, Projects, Settings

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Projects.tsx`
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Replace all hardcoded strings in Dashboard.tsx**

Add `useTranslation` import. Replace all Portuguese strings:

```tsx
const { t } = useTranslation();

// Use interpolation for dynamic values:
// Before: `Ola, ${profile?.full_name?.split(' ')[0] ?? 'Professor'}!`
// After: t('dashboard.greeting', { name: profile?.full_name?.split(' ')[0] ?? t('roles.teacher') })
```

Replace PLAN_LABELS, greeting, stat labels, section headers, empty state text, upgrade CTA.

- [ ] **Step 2: Replace all hardcoded strings in Projects.tsx**

Replace project labels, search placeholder, empty states, confirm dialog, dropdown actions, copy suffix.

For the date formatting, use:
```tsx
new Date(project.updated_at).toLocaleDateString(i18n.language)
```
instead of hardcoded `'pt-BR'`.

- [ ] **Step 3: Replace all hardcoded strings in Settings.tsx**

Replace tab labels, form labels, password change text, plan details, session info. Handle PLAN_DETAILS object with translated names and feature lists.

- [ ] **Step 4: Verify all three pages**

Run: `npm run dev`. Visit each page, switch languages, verify all text translates.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx src/pages/Projects.tsx src/pages/Settings.tsx
git commit -m "feat(i18n): replace hardcoded strings in Dashboard, Projects, Settings"
```

---

## Task 9: Replace Hardcoded Strings in Sidebar and School Pages

**Files:**
- Modify: `src/components/AppSidebar.tsx`
- Modify: `src/pages/SchoolUsers.tsx`

- [ ] **Step 1: Replace strings in AppSidebar.tsx**

Replace navigation labels, role labels, plan labels, upgrade CTA, and logout button with `t()` calls.

```tsx
const { t } = useTranslation();

// Before:
const NAV_ITEMS = [
  { label: 'Dashboard', ... },
  { label: 'Geometria 3D', ... },
];
// After:
const NAV_ITEMS = [
  { label: t('sidebar.dashboard'), ... },
  { label: t('sidebar.geometry3d'), ... },
];
```

Note: since these use `t()` inside the component body, the arrays must be computed inside the component (not as module-level constants). If they're currently module-level, move them inside.

- [ ] **Step 2: Replace strings in SchoolUsers.tsx**

Replace all hardcoded strings in the school users management page.

- [ ] **Step 3: Verify sidebar and school page**

Run: `npm run dev`. Check sidebar labels and school users page in multiple languages.

- [ ] **Step 4: Commit**

```bash
git add src/components/AppSidebar.tsx src/pages/SchoolUsers.tsx
git commit -m "feat(i18n): replace hardcoded strings in AppSidebar and SchoolUsers"
```

---

## Task 10: Replace Hardcoded Strings in Admin Pages

**Files:**
- Modify: `src/components/admin/AdminSidebar.tsx`
- Modify: `src/pages/admin/AdminDashboard.tsx`
- Modify: `src/pages/admin/AdminTenants.tsx`
- Modify: `src/pages/admin/AdminUsers.tsx`
- Modify: `src/pages/admin/AdminSubscriptions.tsx`
- Modify: `src/pages/admin/AdminSupport.tsx`
- Modify: `src/pages/admin/AdminSystemSettings.tsx`

- [ ] **Step 1: Replace strings in AdminSidebar.tsx**

Replace navigation labels, role label, "Back to App" link.

- [ ] **Step 2: Replace strings in AdminDashboard.tsx**

Replace page title, table headers, error messages.

- [ ] **Step 3: Replace strings in AdminTenants.tsx**

Replace form labels, button text, toast messages, dialog text.

- [ ] **Step 4: Replace strings in AdminUsers.tsx**

Replace table headers, labels.

- [ ] **Step 5: Replace strings in AdminSubscriptions.tsx**

Replace table headers, labels.

- [ ] **Step 6: Replace strings in AdminSupport.tsx and AdminSystemSettings.tsx**

Replace any remaining hardcoded strings.

- [ ] **Step 7: Verify admin pages**

Run: `npm run dev`. Login as super admin, navigate admin pages, switch languages.

- [ ] **Step 8: Commit**

```bash
git add src/components/admin/ src/pages/admin/
git commit -m "feat(i18n): replace hardcoded strings in all admin pages"
```

---

## Task 11: Replace Strings in Error/Misc Components and Cleanup

**Files:**
- Modify: `src/components/ErrorBoundary.tsx`
- Modify: `src/pages/NotFound.tsx`
- Delete: `src/context/LanguageContext.tsx`
- Delete: `src/components/LanguageToggle.tsx`

- [ ] **Step 1: Replace strings in ErrorBoundary.tsx**

Add `useTranslation` and replace error display text.

- [ ] **Step 2: Replace strings in NotFound.tsx**

Add `useTranslation` and replace 404 page text.

- [ ] **Step 3: Search for any remaining hardcoded Portuguese strings**

Run:
```bash
grep -rn "Erro\|Sucesso\|Carregando\|Salvar\|Cancelar\|Excluir\|Voltar\|Configurac\|Projeto\|Usuario" src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules\|\.json\|i18n/\|LanguageContext"
```

Fix any remaining hardcoded strings found.

- [ ] **Step 4: Search for remaining useLanguage imports**

Run:
```bash
grep -rn "useLanguage\|LanguageContext\|LanguageProvider\|LanguageToggle" src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules"
```

Expected: ZERO results (all migrated).

- [ ] **Step 5: Delete old language files**

```bash
rm src/context/LanguageContext.tsx
rm src/components/LanguageToggle.tsx
```

- [ ] **Step 6: Verify build compiles clean**

Run: `npm run build`

Expected: No errors, no warnings about missing imports.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(i18n): remove old LanguageContext and LanguageToggle, fix remaining strings"
```

---

## Task 12: Final Verification and RTL Testing

**Files:** None (testing only)

- [ ] **Step 1: Full app walkthrough in Portuguese**

Run: `npm run dev`

Walk through every page: Login, Signup, Dashboard, Projects, Settings, SchoolUsers, Geometry 3D tool, Admin pages. Verify all text displays correctly in Portuguese.

- [ ] **Step 2: Switch to English and verify**

Use LanguageSelector to switch to English. Walk through all pages. Verify all text is in English.

- [ ] **Step 3: Switch to Arabic and verify RTL**

Switch to Arabic. Verify:
- `<html dir="rtl">` is set
- Layout mirrors correctly (sidebar on right, text right-aligned)
- No overlapping or broken UI elements

- [ ] **Step 4: Switch to Japanese and verify**

Verify CJK characters render correctly, no truncation in UI elements.

- [ ] **Step 5: Check browser detection**

Clear localStorage (`localStorage.removeItem('space-sculptor-language')`). Reload. Verify the app detects browser language.

- [ ] **Step 6: Check language persistence**

Select German. Reload page. Verify German persists.

- [ ] **Step 7: Check i18next missing key warnings**

Open browser console. Switch through all 12 languages. Look for any `i18next::translator: missingKey` warnings. Fix any found.

- [ ] **Step 8: Final commit if any fixes**

```bash
git add -A
git commit -m "fix(i18n): final adjustments from verification testing"
```
