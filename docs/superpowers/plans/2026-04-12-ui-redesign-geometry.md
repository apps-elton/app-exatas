# UI Redesign - Geometry 3D Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Geometry 3D tool page to maximize canvas space (~92%) using a single 64px icon sidebar with floating panels, replacing the current multi-panel layout.

**Architecture:** Create an IconSidebar component (64px) with tool + nav icons. Extract ControlPanel sections into standalone panel components rendered inside a FloatingPanel wrapper. Remove Header, TopToolbar, and AppLayout wrapper from the Geometry page. Add a CompactStatusBar at the bottom.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui, lucide-react, react-i18next

**Spec:** `docs/superpowers/specs/2026-04-12-ui-redesign-geometry-design.md`

---

## File Structure

### Files to Create
- `src/components/IconSidebar.tsx` — 64px vertical icon bar with tool + navigation icons
- `src/components/FloatingPanel.tsx` — Reusable floating panel wrapper (slide animation, shadow, close)
- `src/components/panels/GeometryPanel.tsx` — Shape selection + parameter sliders
- `src/components/panels/VisualizationPanel.tsx` — All visualization toggle switches
- `src/components/panels/StylePanel.tsx` — Color pickers, opacity, thickness
- `src/components/panels/PropertiesPanel.tsx` — Properties display + calculations
- `src/components/CompactStatusBar.tsx` — Bottom status bar with shape info + action buttons

### Files to Modify
- `src/pages/Index.tsx` — Remove AppLayout wrapper, render SpaceSculptor directly
- `src/components/SpaceSculptor.tsx` — Complete layout restructure: remove header, TopToolbar, aside; integrate IconSidebar + FloatingPanel + CompactStatusBar

### Files Preserved (no changes)
- `src/components/ControlPanel.tsx` — Kept for reference, panels extract its JSX sections
- `src/components/GeometryCanvas.tsx` — No changes
- `src/components/DrawingTablet.tsx` — No changes
- `src/components/AppLayout.tsx` — Still used by Dashboard, Projects, Settings, Admin

---

## Task 1: Create FloatingPanel Component

**Files:**
- Create: `src/components/FloatingPanel.tsx`

- [ ] **Step 1: Create the FloatingPanel component**

Create `src/components/FloatingPanel.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingPanelProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function FloatingPanel({ title, isOpen, onClose, children }: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const sidebar = document.getElementById('icon-sidebar');
        if (sidebar && sidebar.contains(e.target as Node)) return;
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div
      ref={panelRef}
      className={`fixed top-0 bottom-0 left-16 w-72 bg-background/95 backdrop-blur-xl border-r border-border/50 shadow-2xl z-30 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-48px)] p-3 space-y-4">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Success

- [ ] **Step 3: Commit**

```bash
git add src/components/FloatingPanel.tsx
git commit -m "feat(ui): create FloatingPanel component with slide animation and click-outside close"
```

---

## Task 2: Create Panel Sub-Components (Extract from ControlPanel)

**Files:**
- Create: `src/components/panels/GeometryPanel.tsx`
- Create: `src/components/panels/VisualizationPanel.tsx`
- Create: `src/components/panels/StylePanel.tsx`
- Create: `src/components/panels/PropertiesPanel.tsx`

These panels extract the JSX sections from `src/components/ControlPanel.tsx` into standalone components. Each receives the same core props.

- [ ] **Step 1: Create shared panel props type**

Create `src/components/panels/GeometryPanel.tsx`. First, read `src/components/ControlPanel.tsx` to understand the full props interface and the "Forma Geometrica" + "Parametros" sections (lines 219-637). Then create GeometryPanel containing:

- Shape type dropdown (select from all geometry types)
- Parameter sliders (Height, Sides, Base Edge, Radius — contextual per shape type)
- Revolution Solids Manager (conditional)
- Archimedean Solids Manager (conditional)
- Frustum controls (conditional)

The component must import `useTranslation` and use `t()` for all labels. It receives these props:

```tsx
import { GeometryParams, VisualizationOptions, StyleOptions, GeometryProperties } from '@/types/geometry';

interface PanelProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
  properties: GeometryProperties;
  onParamsChange: (params: GeometryParams) => void;
  onOptionsChange: (options: VisualizationOptions) => void;
  onStyleChange: (style: StyleOptions) => void;
}
```

Copy the JSX from ControlPanel.tsx lines 219-637 into this component, adapting the local state and handlers.

- [ ] **Step 2: Create VisualizationPanel**

Create `src/components/panels/VisualizationPanel.tsx`. Extract lines 639-1887 from ControlPanel — all the toggle switches for visualization options (edges, vertices, faces, shadow, height, radius, inscribed/circumscribed, cross section, meridian section, dimensions, unfolding, vertex modes, plane definition, auto-rotation).

Uses same `PanelProps` interface.

- [ ] **Step 3: Create StylePanel**

Create `src/components/panels/StylePanel.tsx`. Extract lines 1890-2292 from ControlPanel — color pickers, opacity sliders, thickness controls for edges, faces, meridian section, inscribed/circumscribed shapes.

Uses same `PanelProps` interface.

- [ ] **Step 4: Create PropertiesPanel**

Create `src/components/panels/PropertiesPanel.tsx`. Extract lines 2334-2385 from ControlPanel — properties display (base area, lateral area, total area, volume, inscribed radius, circumscribed radius) and GeometryCalculations component.

Uses same `PanelProps` interface (only reads `properties` and `params`).

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Success (panels are not yet used, just created)

- [ ] **Step 6: Commit**

```bash
git add src/components/panels/
git commit -m "feat(ui): extract ControlPanel sections into standalone panel components"
```

---

## Task 3: Create IconSidebar Component

**Files:**
- Create: `src/components/IconSidebar.tsx`

- [ ] **Step 1: Create IconSidebar**

Create `src/components/IconSidebar.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box, Eye, Palette, Pencil, Ruler,
  LayoutDashboard, FolderOpen, Download, Settings, LogOut,
  Sun, Moon
} from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTheme } from '@/hooks/useTheme';

export type PanelId = 'geometry' | 'visualization' | 'style' | 'properties' | null;

interface IconSidebarProps {
  activePanel: PanelId;
  onPanelToggle: (panel: PanelId) => void;
  isDrawingActive: boolean;
  onDrawingToggle: () => void;
  onExportImage: () => void;
}

interface SidebarIcon {
  id: string;
  icon: React.ElementType;
  labelKey: string;
  action: () => void;
  isActive?: boolean;
  separator?: boolean;
}

export function IconSidebar({ activePanel, onPanelToggle, isDrawingActive, onDrawingToggle, onExportImage }: IconSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const toolIcons: SidebarIcon[] = [
    { id: 'geometry', icon: Box, labelKey: 'geometry_form.title', action: () => onPanelToggle('geometry'), isActive: activePanel === 'geometry' },
    { id: 'visualization', icon: Eye, labelKey: 'panel.visualization', action: () => onPanelToggle('visualization'), isActive: activePanel === 'visualization' },
    { id: 'style', icon: Palette, labelKey: 'panel.style', action: () => onPanelToggle('style'), isActive: activePanel === 'style' },
    { id: 'drawing', icon: Pencil, labelKey: 'tablet.name', action: onDrawingToggle, isActive: isDrawingActive },
    { id: 'properties', icon: Ruler, labelKey: 'panel.properties', action: () => onPanelToggle('properties'), isActive: activePanel === 'properties' },
  ];

  const navIcons: SidebarIcon[] = [
    { id: 'dashboard', icon: LayoutDashboard, labelKey: 'sidebar.dashboard', action: () => navigate('/dashboard') },
    { id: 'projects', icon: FolderOpen, labelKey: 'sidebar.my_projects', action: () => navigate('/projects') },
    { id: 'export', icon: Download, labelKey: 'button.download', action: onExportImage },
    { id: 'settings', icon: Settings, labelKey: 'sidebar.settings', action: () => navigate('/settings') },
  ];

  const renderIcon = (item: SidebarIcon) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={item.action}
        title={t(item.labelKey)}
        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
          item.isActive
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
      >
        <Icon className="h-5 w-5" />
      </button>
    );
  };

  return (
    <div id="icon-sidebar" className="w-16 h-full bg-background border-r border-border/30 flex flex-col items-center py-3 flex-shrink-0">
      {/* Tool icons */}
      <div className="flex flex-col items-center gap-1">
        {toolIcons.map(renderIcon)}
      </div>

      {/* Separator */}
      <div className="w-8 h-px bg-border/50 my-3" />

      {/* Nav icons */}
      <div className="flex flex-col items-center gap-1">
        {navIcons.map(renderIcon)}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom: theme + language + logout */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={toggleTheme}
          title={t('sidebar.theme')}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <LanguageSelector collapsed />
        <button
          onClick={() => signOut()}
          title={t('sidebar.logout')}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add missing translation keys**

Add `sidebar.theme` key to all 12 locale files:
- pt-BR: "Alternar tema"
- en: "Toggle theme"
- (and all others)

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Success

- [ ] **Step 4: Commit**

```bash
git add src/components/IconSidebar.tsx src/i18n/locales/
git commit -m "feat(ui): create IconSidebar component with tool and navigation icons"
```

---

## Task 4: Create CompactStatusBar Component

**Files:**
- Create: `src/components/CompactStatusBar.tsx`

- [ ] **Step 1: Create CompactStatusBar**

Create `src/components/CompactStatusBar.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { Maximize, Focus, Camera, Unlock } from 'lucide-react';
import { GeometryParams } from '@/types/geometry';

interface CompactStatusBarProps {
  params: GeometryParams;
  isFrozen: boolean;
  onCenterView: () => void;
  onToggleFreeze: () => void;
  onFullscreen: () => void;
}

export function CompactStatusBar({ params, isFrozen, onCenterView, onToggleFreeze, onFullscreen }: CompactStatusBarProps) {
  const { t } = useTranslation();

  const shapeLabel = t(`geometry.${params.type}`) || params.type;
  const info = [
    shapeLabel,
    params.numSides ? `${params.numSides} ${t('params.sides').toLowerCase()}` : null,
    params.height ? `H:${params.height.toFixed(1)}` : null,
    params.radius ? `R:${params.radius.toFixed(1)}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className="h-8 bg-background/80 backdrop-blur border-t border-border/30 flex items-center justify-between px-3 text-xs text-muted-foreground flex-shrink-0">
      <span className="font-medium">{info}</span>
      <div className="flex items-center gap-1">
        <button onClick={onCenterView} title={t('button.center_view')} className="p-1 hover:text-foreground transition-colors">
          <Focus className="h-3.5 w-3.5" />
        </button>
        <button onClick={onToggleFreeze} title={isFrozen ? t('button.unfreeze_view') : t('button.freeze_view')} className="p-1 hover:text-foreground transition-colors">
          {isFrozen ? <Unlock className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
        </button>
        <button onClick={onFullscreen} title="Fullscreen" className="p-1 hover:text-foreground transition-colors">
          <Maximize className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Success

- [ ] **Step 3: Commit**

```bash
git add src/components/CompactStatusBar.tsx
git commit -m "feat(ui): create CompactStatusBar with shape info and action buttons"
```

---

## Task 5: Restructure SpaceSculptor Layout

**Files:**
- Modify: `src/components/SpaceSculptor.tsx`

This is the main task. Replace the entire layout structure: remove header, TopToolbar, ControlPanel aside. Add IconSidebar + FloatingPanel + panel components + CompactStatusBar.

- [ ] **Step 1: Read current SpaceSculptor completely**

Read `src/components/SpaceSculptor.tsx` fully to understand all state, handlers, and the complete JSX tree.

- [ ] **Step 2: Update imports**

Replace old imports with new components. Remove: TopToolbar, ThemeToggle, PanelLeftClose, PanelLeftOpen, StatusBar (ui).
Add: IconSidebar, FloatingPanel, panel components, CompactStatusBar.

```tsx
// Remove these imports:
// import TopToolbar from './TopToolbar';
// import StatusBar from '@/components/ui/StatusBar';
// import { ThemeToggle } from './ThemeToggle';
// Remove PanelLeftClose, PanelLeftOpen from lucide imports

// Add these imports:
import { IconSidebar, PanelId } from './IconSidebar';
import { FloatingPanel } from './FloatingPanel';
import { GeometryPanel } from './panels/GeometryPanel';
import { VisualizationPanel } from './panels/VisualizationPanel';
import { StylePanel } from './panels/StylePanel';
import { PropertiesPanel } from './panels/PropertiesPanel';
import { CompactStatusBar } from './CompactStatusBar';
```

- [ ] **Step 3: Add panel state**

In SpaceSculptorContent, replace the `panelCollapsed` state with:

```tsx
const [activePanel, setActivePanel] = useState<PanelId>(null);

const handlePanelToggle = useCallback((panel: PanelId) => {
  setActivePanel(prev => prev === panel ? null : panel);
}, []);

const handleFullscreen = useCallback(() => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
}, []);
```

- [ ] **Step 4: Replace the entire layout JSX**

Remove the old layout (header + TopToolbar + aside + panel toggle + section). Replace with:

```tsx
<div className="h-full bg-gradient-nebula text-foreground flex">
  {/* Icon Sidebar */}
  <IconSidebar
    activePanel={activePanel}
    onPanelToggle={handlePanelToggle}
    isDrawingActive={isTabletActive}
    onDrawingToggle={() => setIsTabletActive(!isTabletActive)}
    onExportImage={() => handleExportImage('png', 'hd')}
  />

  {/* Floating Panels */}
  <FloatingPanel title={t('geometry_form.title')} isOpen={activePanel === 'geometry'} onClose={() => setActivePanel(null)}>
    <GeometryPanel params={params} options={options} style={style} properties={properties}
      onParamsChange={updateParams} onOptionsChange={(o) => { addToHistory('options_change', options); setOptions(o); }} onStyleChange={(s) => { addToHistory('style_change', style); setStyle(s); }} />
  </FloatingPanel>

  <FloatingPanel title={t('panel.visualization')} isOpen={activePanel === 'visualization'} onClose={() => setActivePanel(null)}>
    <VisualizationPanel params={params} options={options} style={style} properties={properties}
      onParamsChange={updateParams} onOptionsChange={(o) => { addToHistory('options_change', options); setOptions(o); }} onStyleChange={(s) => { addToHistory('style_change', style); setStyle(s); }} />
  </FloatingPanel>

  <FloatingPanel title={t('panel.style')} isOpen={activePanel === 'style'} onClose={() => setActivePanel(null)}>
    <StylePanel params={params} options={options} style={style} properties={properties}
      onParamsChange={updateParams} onOptionsChange={(o) => { addToHistory('options_change', options); setOptions(o); }} onStyleChange={(s) => { addToHistory('style_change', style); setStyle(s); }} />
  </FloatingPanel>

  <FloatingPanel title={t('panel.properties')} isOpen={activePanel === 'properties'} onClose={() => setActivePanel(null)}>
    <PropertiesPanel params={params} options={options} style={style} properties={properties}
      onParamsChange={updateParams} onOptionsChange={(o) => { addToHistory('options_change', options); setOptions(o); }} onStyleChange={(s) => { addToHistory('style_change', style); setStyle(s); }} />
  </FloatingPanel>

  {/* Main Canvas Area */}
  <div className="flex-1 flex flex-col min-w-0 min-h-0">
    <div className="flex-1 relative">
      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <div ref={geometryCanvasRef} className="w-full h-full">
          <GeometryCanvas
            params={params} options={options} style={style}
            onControlsRef={(ref) => { orbitControlsRef.current = ref; }}
            onVertexSelect={/* keep existing handler */}
          />
        </div>
      </div>

      {/* Drawing overlays - keep existing */}
      {/* ... DrawingOverlayWrapper, FrozenCanvas, DrawingTablet ... */}
    </div>

    {/* Compact Status Bar */}
    <CompactStatusBar
      params={params}
      isFrozen={!!frozenImage}
      onCenterView={() => orbitControlsRef.current?.reset?.()}
      onToggleFreeze={/* keep existing freeze handler */}
      onFullscreen={handleFullscreen}
    />
  </div>
</div>
```

Keep ALL existing canvas-related JSX (GeometryCanvas, DrawingOverlayWrapper, FrozenCanvas, DrawingTablet layers) exactly as-is inside the canvas area div. Only the outer layout structure changes.

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Success

- [ ] **Step 6: Commit**

```bash
git add src/components/SpaceSculptor.tsx
git commit -m "feat(ui): restructure SpaceSculptor with IconSidebar + floating panels + status bar"
```

---

## Task 6: Remove AppLayout from Index Page

**Files:**
- Modify: `src/pages/Index.tsx`

- [ ] **Step 1: Read Index.tsx**

Read `src/pages/Index.tsx` to see current structure.

- [ ] **Step 2: Remove AppLayout wrapper**

Change Index.tsx to render SpaceSculptor WITHOUT AppLayout:

```tsx
import SpaceSculptor from '@/components/SpaceSculptor';

const Index = () => {
  return <SpaceSculptor />;
};

export default Index;
```

This removes the AppSidebar navigation from the Geometry page — it's now handled by IconSidebar.

- [ ] **Step 3: Verify the App.tsx route still works**

Read `src/App.tsx` to verify the "/" route is still wrapped in ProtectedRoute. The ProtectedRoute should NOT depend on AppLayout.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Success

- [ ] **Step 5: Commit**

```bash
git add src/pages/Index.tsx
git commit -m "feat(ui): render Geometry 3D page without AppLayout wrapper"
```

---

## Task 7: Visual Polish and Keyboard Shortcuts

**Files:**
- Modify: `src/components/SpaceSculptor.tsx`
- Modify: `src/components/IconSidebar.tsx`

- [ ] **Step 1: Add keyboard shortcuts to SpaceSculptor**

Add keyboard shortcut handler in SpaceSculptorContent:

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    switch (e.key) {
      case '1': handlePanelToggle('geometry'); break;
      case '2': handlePanelToggle('visualization'); break;
      case '3': handlePanelToggle('style'); break;
      case '4': handlePanelToggle('properties'); break;
      case '5': setIsTabletActive(prev => !prev); break;
      case 'f': case 'F': if (!e.ctrlKey && !e.metaKey) handleFullscreen(); break;
      case ' ': e.preventDefault(); setOptions(prev => ({ ...prev, autoRotate: !prev.autoRotate })); break;
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [handlePanelToggle, handleFullscreen]);
```

- [ ] **Step 2: Add number badges to IconSidebar tool icons**

Add small number indicators (1-5) to each tool icon for discoverability:

```tsx
<span className="absolute -top-0.5 -right-0.5 text-[9px] text-muted-foreground/50">{index + 1}</span>
```

Make each icon button `relative` to position the badge.

- [ ] **Step 3: Verify build and test in browser**

Run: `npm run build`
Then `npm run dev` and verify:
- Icon sidebar shows on left with all icons
- Clicking icons opens/closes floating panels
- Pressing 1-5 opens panels via keyboard
- Canvas fills most of the screen
- StatusBar shows at bottom with shape info
- Navigation icons (Dashboard, Projects, Settings) navigate correctly
- Language selector and theme toggle work

- [ ] **Step 4: Commit**

```bash
git add src/components/SpaceSculptor.tsx src/components/IconSidebar.tsx
git commit -m "feat(ui): add keyboard shortcuts and number badges to icon sidebar"
```

---

## Task 8: Final Cleanup

**Files:**
- Modify: `src/components/SpaceSculptor.tsx` (remove unused imports)

- [ ] **Step 1: Remove unused imports from SpaceSculptor**

Remove any imports that are no longer used after the restructure:
- `TopToolbar` (if still imported)
- `StatusBar` from ui/
- `ThemeToggle`
- `PanelLeftClose`, `PanelLeftOpen` from lucide
- `ControlPanel` (if panels fully replace it)

- [ ] **Step 2: Search for other dead references**

Run grep to find any remaining references to removed components:
```bash
grep -rn "TopToolbar\|PanelLeftClose\|PanelLeftOpen" src/ --include="*.tsx" | grep -v node_modules | grep -v ".backup"
```

Fix any found.

- [ ] **Step 3: Final build verification**

Run: `npm run build`
Expected: Clean build, no errors, no unused import warnings.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(ui): cleanup unused imports and dead references"
```
