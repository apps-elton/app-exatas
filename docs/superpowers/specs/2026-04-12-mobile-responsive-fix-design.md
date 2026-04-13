# Mobile Responsive Fix - Design Spec

**Data:** 2026-04-12
**Escopo:** Corrigir todos os problemas de responsividade mobile
**Breakpoint:** md (768px) como ponto de corte mobile/desktop
**Componentes afetados:** IconSidebar, FloatingPanel, CompactStatusBar, SpaceSculptor, AdminSidebar, ToolBar, Settings, Projects

---

## Decisoes de Design

- SpaceSculptor mobile: Bottom Tab Bar + Bottom Sheet para paineis
- Admin mobile: Hamburger + Sheet drawer (shadcn Sheet)
- Bottom Sheet: usar vaul Drawer (ja instalado)
- Breakpoint: md (768px)

---

## Secao 1: Bottom Tab Bar (SpaceSculptor)

### Mobile (< 768px)

- IconSidebar lateral escondido via `hidden md:flex`
- Novo componente `MobileBottomBar` fixo no bottom da tela
  - 4-5 icones principais: Geometria, Desenho, Salvar, Configuracoes
  - Icones com labels curtos embaixo (estilo app nativo)
  - Background solido com border-top
  - Z-index acima do canvas (z-50)
  - Padding bottom para safe area (home indicator iOS)
- CompactStatusBar escondido no mobile via `hidden md:flex`
- Canvas 3D ocupa 100% da largura da tela

### Desktop (>= 768px)

- Sem mudancas — IconSidebar lateral + FloatingPanel mantidos

---

## Secao 2: Bottom Sheet para Paineis

### Mobile (< 768px)

- Ao tocar num icone da MobileBottomBar, o painel correspondente abre como Bottom Sheet
- Implementado com vaul Drawer (ja instalado: vaul ^0.9.9)
- Sheet cobre ~60% da tela, canvas 3D visivel no topo
- Handle de arraste no topo do sheet (barra cinza 40px x 4px)
- Toque fora do sheet fecha
- Snap points: 60% (default) e 90% (expandido)
- Conteudo do sheet: mesmo conteudo dos FloatingPanels atuais (GeometryPanel, DrawingPanel, etc.)
- Cada panel renderizado dentro do Drawer.Content

### Desktop (>= 768px)

- FloatingPanel atual mantido sem mudancas

---

## Secao 3: Admin Mobile (Hamburger + Sheet)

### Mobile (< 768px)

- AdminSidebar escondido via `hidden md:flex`
- Novo componente `AdminMobileHeader` fixo no topo:
  - Botao hamburger a esquerda
  - Titulo da pagina atual ao centro
  - Height: 48px minimo (touch-friendly)
- Ao tocar no hamburger, abre Sheet lateral (shadcn Sheet side="left")
  - Conteudo: mesmos 6 links do AdminSidebar
  - Sheet fecha ao navegar (onClick fecha o sheet)
- Conteudo admin ocupa 100% da largura com padding responsivo

### Desktop (>= 768px)

- AdminSidebar atual mantido

---

## Secao 4: Touch Targets e Fixes Gerais

### Touch targets

- Todos os botoes interativos no mobile: minimo 44x44px
- MobileBottomBar icones: 44x44px touch area
- AdminMobileHeader hamburger: 44x44px

### Viewport height

- SpaceSculptor: trocar `h-screen` por `h-dvh` (dynamic viewport height)
- Fallback: `h-screen` para browsers sem suporte a dvh
- Classe: `h-dvh` (Tailwind 3.4+ suporta nativamente)

### Safe areas

- MobileBottomBar: `pb-[env(safe-area-inset-bottom)]` para home indicator
- Adicionar `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` ao index.html

### ToolBar de desenho (mobile)

- Mostrar apenas ferramentas essenciais: lapiz, borracha, seletor de cor
- Botao "mais" (three dots) para ferramentas adicionais
- Toolbar reduzida em altura no mobile

### Settings page

- Tabs: `flex-col md:flex-row` para stack vertical no mobile
- Padding: `p-4 md:p-6`

### Projects page

- Grid gap: `gap-2 md:gap-4`
- Cards mantidos em grid-cols-1 no mobile (ja correto)

---

## Componentes a Criar

| Componente | Arquivo | Responsabilidade |
|-----------|--------|-----------------|
| MobileBottomBar | `src/components/MobileBottomBar.tsx` | Tab bar fixa no bottom com icones de navegacao |
| MobilePanelSheet | `src/components/MobilePanelSheet.tsx` | Wrapper do vaul Drawer para paineis |
| AdminMobileHeader | `src/components/admin/AdminMobileHeader.tsx` | Header com hamburger para admin mobile |

## Componentes a Modificar

| Componente | Arquivo | Mudanca |
|-----------|--------|--------|
| IconSidebar | `src/components/IconSidebar.tsx` | Adicionar `hidden md:flex` |
| CompactStatusBar | `src/components/CompactStatusBar.tsx` | Adicionar `hidden md:flex` |
| SpaceSculptor | `src/components/SpaceSculptor.tsx` | Integrar MobileBottomBar + MobilePanelSheet, trocar h-screen por h-dvh |
| FloatingPanel | `src/components/FloatingPanel.tsx` | Sem mudanca (usado apenas no desktop) |
| AdminSidebar | `src/components/admin/AdminSidebar.tsx` | Adicionar `hidden md:flex` |
| Admin pages | `src/pages/admin/*.tsx` | Integrar AdminMobileHeader |
| Settings | `src/pages/Settings.tsx` | Tabs responsive |
| Projects | `src/pages/Projects.tsx` | Gap responsive |
| index.html | `index.html` | viewport-fit=cover meta tag |

---

## Fora de Escopo

- Redesign completo da UI (apenas responsividade)
- PWA / offline (Phase 4 item separado)
- Otimizacao de performance do canvas 3D no mobile
- Gestos de toque no canvas 3D (pinch-to-zoom, etc.)
