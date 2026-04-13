# Mobile Responsive Fix - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all mobile responsiveness issues — hidden sidebar on mobile with bottom tab bar, bottom sheet panels, admin hamburger menu, touch targets, viewport fixes.

**Architecture:** Mobile-first approach using md (768px) breakpoint. Below md: bottom tab bar + vaul Drawer for panels, hamburger + Sheet for admin. Above md: current desktop layout unchanged. All new components are mobile-only wrappers.

**Tech Stack:** React, Tailwind CSS (md breakpoint), vaul Drawer (already installed), shadcn Sheet (already installed), lucide-react icons

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/MobileBottomBar.tsx` | Bottom tab bar for SpaceSculptor on mobile |
| Create | `src/components/MobilePanelSheet.tsx` | vaul Drawer wrapper for panels on mobile |
| Create | `src/components/admin/AdminMobileHeader.tsx` | Hamburger + title header for admin mobile |
| Modify | `src/components/IconSidebar.tsx` | Add `hidden md:flex` |
| Modify | `src/components/CompactStatusBar.tsx` | Add `hidden md:flex` |
| Modify | `src/components/FloatingPanel.tsx` | Add `hidden md:block` |
| Modify | `src/components/SpaceSculptor.tsx` | Integrate MobileBottomBar + MobilePanelSheet, use h-dvh |
| Modify | `src/components/admin/AdminSidebar.tsx` | Add `hidden md:flex` |
| Modify | `src/components/admin/AdminLayout.tsx` | Integrate AdminMobileHeader |
| Modify | `src/components/AppSidebar.tsx` | Add `hidden md:flex` |
| Modify | `src/components/AppLayout.tsx` | Add mobile header for non-admin pages |
| Modify | `src/pages/Settings.tsx` | Responsive tabs |
| Modify | `src/pages/Projects.tsx` | Responsive grid gap |
| Modify | `index.html` | Add viewport-fit=cover |

---

### Task 1: viewport-fit and h-dvh foundation

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Update viewport meta tag**

In `index.html`, change line 5:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```
to:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "fix(mobile): add viewport-fit=cover for safe area support"
```

---

### Task 2: Create MobileBottomBar component

**Files:**
- Create: `src/components/MobileBottomBar.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useTranslation } from 'react-i18next';
import { Box, Eye, Palette, Pencil, Ruler } from 'lucide-react';
import { PanelId } from './IconSidebar';

interface MobileBottomBarProps {
  activePanel: PanelId;
  onPanelToggle: (panel: PanelId) => void;
  isDrawingActive: boolean;
  onDrawingToggle: () => void;
}

export function MobileBottomBar({ activePanel, onPanelToggle, isDrawingActive, onDrawingToggle }: MobileBottomBarProps) {
  const { t } = useTranslation();

  const items = [
    { id: 'geometry' as PanelId, icon: Box, labelKey: 'geometry_form.title', action: () => onPanelToggle('geometry'), isActive: activePanel === 'geometry' },
    { id: 'visualization' as PanelId, icon: Eye, labelKey: 'panel.visualization', action: () => onPanelToggle('visualization'), isActive: activePanel === 'visualization' },
    { id: 'style' as PanelId, icon: Palette, labelKey: 'panel.style', action: () => onPanelToggle('style'), isActive: activePanel === 'style' },
    { id: 'drawing' as PanelId, icon: Pencil, labelKey: 'tablet.name', action: onDrawingToggle, isActive: isDrawingActive },
    { id: 'properties' as PanelId, icon: Ruler, labelKey: 'panel.properties', action: () => onPanelToggle('properties'), isActive: activePanel === 'properties' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border/30 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-14">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] gap-0.5 transition-colors ${
                item.isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] leading-none">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/MobileBottomBar.tsx
git commit -m "feat(mobile): create MobileBottomBar component"
```

---

### Task 3: Create MobilePanelSheet component

**Files:**
- Create: `src/components/MobilePanelSheet.tsx`

**Context:** Uses the existing vaul Drawer component at `src/components/ui/drawer.tsx`. Exports: `Drawer`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerClose`, `DrawerOverlay`, `DrawerPortal`.

- [ ] **Step 1: Create the component**

```tsx
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface MobilePanelSheetProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobilePanelSheet({ title, isOpen, onClose, children }: MobilePanelSheetProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border/30 pb-3">
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto p-4 space-y-4">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/MobilePanelSheet.tsx
git commit -m "feat(mobile): create MobilePanelSheet with vaul Drawer"
```

---

### Task 4: Integrate mobile components into SpaceSculptor

**Files:**
- Modify: `src/components/SpaceSculptor.tsx`
- Modify: `src/components/IconSidebar.tsx`
- Modify: `src/components/CompactStatusBar.tsx`
- Modify: `src/components/FloatingPanel.tsx`

**Context:** SpaceSculptor is a large file (~1360 lines). We need surgical edits:
1. Add `hidden md:flex` to IconSidebar wrapper
2. Add `hidden md:flex` to CompactStatusBar wrapper
3. Add `hidden md:block` to FloatingPanel
4. Add MobileBottomBar and MobilePanelSheet for mobile
5. Change `h-screen` to `h-dvh`

- [ ] **Step 1: Hide IconSidebar on mobile**

In `src/components/IconSidebar.tsx`, line 44, change:
```tsx
<div id="icon-sidebar" className="w-16 h-full bg-background border-r border-border/30 flex flex-col items-center py-3 flex-shrink-0 z-40">
```
to:
```tsx
<div id="icon-sidebar" className="w-16 h-full bg-background border-r border-border/30 hidden md:flex flex-col items-center py-3 flex-shrink-0 z-40">
```

- [ ] **Step 2: Hide CompactStatusBar on mobile**

In `src/components/CompactStatusBar.tsx`, line 25, change:
```tsx
<div className="h-8 bg-background/80 backdrop-blur border-t border-border/30 flex items-center justify-between px-3 text-xs text-muted-foreground flex-shrink-0">
```
to:
```tsx
<div className="h-8 bg-background/80 backdrop-blur border-t border-border/30 hidden md:flex items-center justify-between px-3 text-xs text-muted-foreground flex-shrink-0">
```

- [ ] **Step 3: Hide FloatingPanel on mobile**

In `src/components/FloatingPanel.tsx`, line 38, change:
```tsx
className={`fixed top-0 bottom-0 left-16 w-72 bg-background/95 backdrop-blur-xl border-r border-border/50 shadow-2xl z-30 transition-all duration-300 ease-in-out ${
```
to:
```tsx
className={`fixed top-0 bottom-0 left-16 w-72 bg-background/95 backdrop-blur-xl border-r border-border/50 shadow-2xl z-30 transition-all duration-300 ease-in-out hidden md:block ${
```

- [ ] **Step 4: Add imports to SpaceSculptor**

In `src/components/SpaceSculptor.tsx`, after line 20 (`import { CompactStatusBar } from './CompactStatusBar';`), add:
```tsx
import { MobileBottomBar } from './MobileBottomBar';
import { MobilePanelSheet } from './MobilePanelSheet';
```

- [ ] **Step 5: Change h-screen to h-dvh in SpaceSculptor**

In `src/components/SpaceSculptor.tsx`, line 1150, change:
```tsx
<div className="h-screen bg-gradient-nebula text-foreground flex overflow-hidden">
```
to:
```tsx
<div className="h-dvh bg-gradient-nebula text-foreground flex overflow-hidden">
```

- [ ] **Step 6: Add MobileBottomBar to SpaceSculptor**

In `src/components/SpaceSculptor.tsx`, after the CompactStatusBar block (after line 1351 `)}`) and before the closing `</div>` of the main canvas area (line 1352 `</div>`), add:

```tsx
        {/* Mobile Bottom Bar */}
        {!isFullscreen && (
          <MobileBottomBar
            activePanel={activePanel}
            onPanelToggle={handlePanelToggle}
            isDrawingActive={isTabletActive}
            onDrawingToggle={() => setIsTabletActive(!isTabletActive)}
          />
        )}
```

- [ ] **Step 7: Add MobilePanelSheet instances to SpaceSculptor**

In `src/components/SpaceSculptor.tsx`, after the MobileBottomBar block just added, add:

```tsx
        {/* Mobile Panel Sheets */}
        <MobilePanelSheet title={t('geometry_form.title')} isOpen={activePanel === 'geometry'} onClose={() => setActivePanel(null)}>
          <GeometryPanel params={params} options={options} style={style} properties={properties}
            onParamsChange={updateParams}
            onOptionsChange={(o) => { addToHistory('options_change', options); setOptions(o); }}
            onStyleChange={(s) => { addToHistory('style_change', style); setStyle(s); }}
          />
        </MobilePanelSheet>

        <MobilePanelSheet title={t('panel.visualization')} isOpen={activePanel === 'visualization'} onClose={() => setActivePanel(null)}>
          <VisualizationPanel params={params} options={options} style={style} properties={properties}
            onParamsChange={updateParams}
            onOptionsChange={(o) => { addToHistory('options_change', options); setOptions(o); }}
            onStyleChange={(s) => { addToHistory('style_change', style); setStyle(s); }}
          />
        </MobilePanelSheet>

        <MobilePanelSheet title={t('panel.style')} isOpen={activePanel === 'style'} onClose={() => setActivePanel(null)}>
          <StylePanel params={params} options={options} style={style} properties={properties}
            onParamsChange={updateParams}
            onOptionsChange={(o) => { addToHistory('options_change', options); setOptions(o); }}
            onStyleChange={(s) => { addToHistory('style_change', style); setStyle(s); }}
          />
        </MobilePanelSheet>

        <MobilePanelSheet title={t('panel.properties')} isOpen={activePanel === 'properties'} onClose={() => setActivePanel(null)}>
          <PropertiesPanel params={params} options={options} style={style} properties={properties}
            onParamsChange={updateParams}
            onOptionsChange={(o) => { addToHistory('options_change', options); setOptions(o); }}
            onStyleChange={(s) => { addToHistory('style_change', style); setStyle(s); }}
          />
        </MobilePanelSheet>
```

- [ ] **Step 8: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/components/IconSidebar.tsx src/components/CompactStatusBar.tsx src/components/FloatingPanel.tsx src/components/SpaceSculptor.tsx
git commit -m "feat(mobile): integrate bottom bar and panel sheets into SpaceSculptor"
```

---

### Task 5: Create AdminMobileHeader and fix AdminLayout

**Files:**
- Create: `src/components/admin/AdminMobileHeader.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`
- Modify: `src/components/admin/AdminLayout.tsx`

- [ ] **Step 1: Create AdminMobileHeader**

```tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import {
  Menu,
  LayoutDashboard,
  School,
  Users,
  CreditCard,
  MessageSquare,
  Settings,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

export function AdminMobileHeader() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const ADMIN_NAV = [
    { label: t('sidebar.dashboard'), icon: LayoutDashboard, path: '/admin' },
    { label: t('sidebar.tenants'), icon: School, path: '/admin/tenants' },
    { label: t('sidebar.users'), icon: Users, path: '/admin/users' },
    { label: t('sidebar.subscriptions'), icon: CreditCard, path: '/admin/subscriptions' },
    { label: t('sidebar.support'), icon: MessageSquare, path: '/admin/support' },
    { label: t('sidebar.system'), icon: Settings, path: '/admin/settings' },
  ];

  const currentPage = ADMIN_NAV.find(n => n.path === location.pathname);

  return (
    <div className="md:hidden flex items-center h-12 px-3 border-b border-red-400/20 bg-background/95 backdrop-blur">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2">
            <Menu className="h-5 w-5 text-foreground" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex items-center gap-2 p-4 border-b border-red-400/20">
            <Shield className="w-6 h-6 text-red-400" />
            <div>
              <span className="font-poppins font-bold text-foreground">GeoTeach</span>
              <span className="text-xs text-red-400 font-poppins ml-1">{t('roles.admin')}</span>
            </div>
          </div>
          <div className="px-4 py-3 border-b border-border/30">
            <p className="text-sm font-poppins font-semibold text-foreground truncate">{profile?.full_name}</p>
            <p className="text-xs text-red-400">{t('roles.superadmin')}</p>
          </div>
          <nav className="p-2 space-y-1">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-nunito transition-colors ${
                    isActive
                      ? 'bg-red-400/10 text-red-400 font-semibold'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-red-400' : ''}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="p-2 border-t border-border/30 mt-auto">
            <button
              onClick={() => { navigate('/'); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-nunito text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('sidebar.back_to_app')}
            </button>
          </div>
        </SheetContent>
      </Sheet>
      <span className="font-poppins font-semibold text-sm text-foreground ml-1">
        {currentPage?.label || 'Admin'}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Hide AdminSidebar on mobile**

In `src/components/admin/AdminSidebar.tsx`, line 31, change:
```tsx
<div className="h-screen w-64 flex flex-col border-r border-red-400/20 bg-background/95 backdrop-blur">
```
to:
```tsx
<div className="h-screen w-64 hidden md:flex flex-col border-r border-red-400/20 bg-background/95 backdrop-blur">
```

- [ ] **Step 3: Update AdminLayout**

Replace `src/components/admin/AdminLayout.tsx` with:
```tsx
import { AdminSidebar } from './AdminSidebar';
import { AdminMobileHeader } from './AdminMobileHeader';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row h-dvh overflow-hidden">
      <AdminSidebar />
      <AdminMobileHeader />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AdminMobileHeader.tsx src/components/admin/AdminSidebar.tsx src/components/admin/AdminLayout.tsx
git commit -m "feat(mobile): add hamburger menu for admin pages"
```

---

### Task 6: Fix AppLayout and AppSidebar for mobile

**Files:**
- Modify: `src/components/AppSidebar.tsx`
- Modify: `src/components/AppLayout.tsx`

**Context:** AppSidebar is used by Dashboard, Projects, SchoolUsers, Settings pages via AppLayout. It has a collapse toggle (w-16 vs w-64) but never hides completely on mobile.

- [ ] **Step 1: Read AppSidebar to find the root div**

Read `src/components/AppSidebar.tsx` and find the root `<div>` element. Add `hidden md:flex` to it.

The root div likely has classes like `h-screen flex flex-col border-r...` — add `hidden md:flex` so it becomes `h-screen hidden md:flex flex-col border-r...`.

- [ ] **Step 2: Update AppLayout for mobile**

Replace `src/components/AppLayout.tsx` with:
```tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppSidebar } from './AppSidebar';
import { Menu, LayoutDashboard, FolderOpen, Settings, Users, Box } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const NAV = [
    { label: t('sidebar.geometry'), icon: Box, path: '/' },
    { label: t('sidebar.dashboard'), icon: LayoutDashboard, path: '/dashboard' },
    { label: t('sidebar.my_projects'), icon: FolderOpen, path: '/projects' },
    { label: t('sidebar.school_users'), icon: Users, path: '/school/users' },
    { label: t('sidebar.settings'), icon: Settings, path: '/settings' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-dvh overflow-hidden">
      <AppSidebar />
      {/* Mobile header */}
      <div className="md:hidden flex items-center h-12 px-3 border-b border-border/30 bg-background/95 backdrop-blur">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2">
              <Menu className="h-5 w-5 text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="p-4 border-b border-border/30">
              <span className="font-poppins font-bold text-foreground">GeoTeach</span>
            </div>
            <nav className="p-2 space-y-1">
              {NAV.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-nunito transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
        <span className="font-poppins font-semibold text-sm text-foreground ml-1">
          {NAV.find(n => n.path === location.pathname)?.label || 'GeoTeach'}
        </span>
      </div>
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/AppSidebar.tsx src/components/AppLayout.tsx
git commit -m "feat(mobile): add hamburger menu for app pages (dashboard, projects, settings)"
```

---

### Task 7: Responsive fixes for Settings and Projects

**Files:**
- Modify: `src/pages/Settings.tsx`
- Modify: `src/pages/Projects.tsx`

- [ ] **Step 1: Read Settings.tsx and find the tabs container**

Read `src/pages/Settings.tsx`. Find the tab buttons container (likely a `<div className="flex gap-1 bg-muted/30..."`). Change it to stack vertically on mobile:
- Add `flex-col md:flex-row` to the container
- Change padding from `p-6` to `p-4 md:p-6` on the outer content wrapper

- [ ] **Step 2: Fix Projects grid gap**

In `src/pages/Projects.tsx`, find the grid container (line 184):
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
```
Change to:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Settings.tsx src/pages/Projects.tsx
git commit -m "fix(mobile): responsive tabs and grid gap for settings and projects"
```

---

### Task 8: Final verification

- [ ] **Step 1: Run full quality suite**

```bash
npm run lint && npx tsc --noEmit && npx vitest run && npm run build
```

Expected: All pass.

- [ ] **Step 2: Verify all commits**

Run: `git log --oneline -8`

Expected: 7 commits for mobile fix tasks.

- [ ] **Step 3: Test in browser**

Run: `npm run dev`

Open http://localhost:8080 in browser. Use Chrome DevTools (F12) > Toggle Device Toolbar (Ctrl+Shift+M) to test:
- iPhone SE (375px): Bottom bar visible, sidebar hidden, panels open as sheets
- iPad (768px): Desktop layout, sidebar visible
- Resize window to verify breakpoint transition

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "fix(mobile): final responsive adjustments"
```
