# GeoTeach UI Redesign - Geometry 3D Tool

## Overview

Redesign the Geometry 3D tool page to maximize canvas space for 3D visualization. Replace the current multi-panel layout (header + top toolbar + navigation sidebar + fixed control panel) with a single icon sidebar (64px) + floating panels + compact status bar. Canvas goes from ~62% to ~92% of screen.

## Current State (Problems)

- Navigation sidebar (256px) stays visible while working - useless during geometry work
- Fixed control panel (320px) always visible - 2390 lines, 7+ sections stacked
- Header (80px) with title "GeoTeach - Visualizador Interativo..." wastes vertical space
- TopToolbar (60px) duplicates control panel functionality
- Canvas only gets ~62% of screen area
- Too many elements competing for attention

## New Layout Architecture

### Screen Structure

```
[Sidebar 64px] [Canvas ~92% of remaining space]
               [StatusBar 32px at bottom]
```

### 1. Icon Sidebar (64px, always visible)

Replaces BOTH the navigation sidebar AND the top toolbar. Single vertical bar on the left edge.

**Top section (tools):**
- Geometry shape icon - opens Forma + Parametros panel
- Eye icon - opens Visualizacao panel  
- Palette icon - opens Estilo/Cores panel
- Pencil icon - toggles Drawing Tablet mode
- Ruler icon - opens Propriedades/Calculos panel

**Separator line**

**Bottom section (navigation + actions):**
- Home icon - navigate to Dashboard
- Folder icon - navigate to Projects
- Download icon - export image menu
- Globe icon - language selector (opens dropdown)
- Sun/Moon icon - theme toggle
- Settings icon - navigate to Settings
- Logout icon

**Behavior:**
- Each tool icon acts as a toggle: click to open its floating panel, click again to close
- Only one panel open at a time (clicking a different icon closes the current panel)
- Active icon gets highlighted background
- Navigation icons navigate immediately (no panel)
- Tooltips on hover showing the icon name

**Visual style:**
- Background: same as current sidebar (dark, matches theme)
- Icons: lucide-react, 20x20px
- Spacing: 8px padding, icons centered
- Border-right: subtle border separating from canvas
- No text labels (icons only)

### 2. Floating Panels (280px, over canvas)

When a tool icon is clicked, a panel slides out from the left (positioned at left: 64px) floating OVER the canvas. Does NOT push/resize the canvas.

**Panel structure:**
- Header: panel title + close (X) button
- Content: the relevant controls from current ControlPanel
- Backdrop: subtle shadow + blur effect
- Max height: 80vh, scrollable if content overflows
- Border-radius: 0 on left, 8px on right corners

**Panel contents by icon:**

**A) Geometry Panel (shape icon):**
- Shape type dropdown (Prisma, Cubo, Esfera, etc.)
- Parameter sliders (Height, Sides, Base Edge, Radius - contextual per shape)
- Revolution/Archimedean/Frustum controls when applicable

**B) Visualization Panel (eye icon):**
- Toggle switches: Edges, Vertices, Faces, Shadow, Height, Radius
- Inscribed/Circumscribed toggles
- Cross Section, Meridian Section, Dimensions, Unfolding toggles
- Vertex modes and Plane definition
- Auto-rotation toggle + speed slider

**C) Style Panel (palette icon):**
- Color pickers (edge, face, meridian section, height, inscribed, circumscribed)
- Opacity sliders
- Thickness controls

**D) Properties Panel (ruler icon):**
- Calculated properties (Base Area, Lateral Area, Total Area, Volume, Radii)
- Geometric Calculations component

**E) Drawing mode (pencil icon):**
- Does NOT open a panel - toggles the DrawingTablet overlay directly
- Drawing toolbar appears inline at the top of the canvas area (existing behavior)

### 3. Canvas Area (fills remaining space)

- Takes 100% of space after sidebar (calc(100vw - 64px) x 100vh - 32px statusbar)
- GeometryCanvas renders here
- Drawing overlays stack on top as before
- No header above it
- Panel collapse toggle button removed (panels are now floating)

### 4. Status Bar (32px, bottom of canvas)

Compact info bar at the bottom of the canvas area.

**Left side:**
- Current shape name + key parameters: "Prisma - 5 lados - H:4.0 - A:2.0"
- Active tool/mode indicator when relevant

**Right side:**
- Center View button (icon only)
- Freeze/Unfreeze View button (icon only)
- Fullscreen button (icon only) - hides everything including sidebar, Esc to exit

**Style:**
- Semi-transparent background (bg-background/80 backdrop-blur)
- Small text (text-xs)
- Floats at bottom of canvas, doesn't push content

### 5. Removed Elements

- **Header section** (title + subtitle + buttons) - REMOVED entirely
- **TopToolbar** - REMOVED (tools moved to sidebar icons)  
- **AppSidebar navigation** - REMOVED from Geometry 3D page (replaced by icon sidebar bottom section)
- **ControlPanel aside** - REMOVED as fixed panel (content reorganized into floating panels)
- **Old panel collapse toggle button** - REMOVED

## Component Architecture

### New Components

- `src/components/IconSidebar.tsx` - The 64px icon sidebar with tool + nav icons
- `src/components/FloatingPanel.tsx` - Generic floating panel wrapper (slide animation, shadow, close button)
- `src/components/panels/GeometryPanel.tsx` - Shape + Parameters content
- `src/components/panels/VisualizationPanel.tsx` - Visualization toggles content
- `src/components/panels/StylePanel.tsx` - Colors + opacity content
- `src/components/panels/PropertiesPanel.tsx` - Properties + calculations content
- `src/components/CompactStatusBar.tsx` - Bottom status bar with info + action buttons

### Modified Components

- `src/components/SpaceSculptor.tsx` - New layout structure (remove header, TopToolbar, aside; add IconSidebar, FloatingPanel, CompactStatusBar)
- `src/pages/Index.tsx` - Render SpaceSculptor WITHOUT AppLayout wrapper (no nav sidebar on geometry page)
- `src/components/AppLayout.tsx` - No changes (still used by Dashboard, Projects, Settings, Admin pages)

### Removed/Deprecated

- `src/components/TopToolbar.tsx` - Functionality moved to IconSidebar
- Header section in SpaceSculptor - Removed

### Preserved (no changes)

- `src/components/ControlPanel.tsx` - Kept as-is but content extracted into panel sub-components. Can be refactored later.
- `src/components/GeometryCanvas.tsx` - No changes
- `src/components/DrawingTablet.tsx` - No changes to functionality
- All geometry/ sub-components - No changes

## Layout for Other Pages

Only the Geometry 3D page (Index/route "/") gets the new layout. All other pages (Dashboard, Projects, Settings, Admin) keep the current AppLayout with AppSidebar.

## Keyboard Shortcuts

- `Esc` - Close floating panel / Exit fullscreen
- `F11` or `F` - Toggle fullscreen mode
- `1-5` - Quick open panels (1=Geometry, 2=Visualization, 3=Style, 4=Properties, 5=Drawing)
- `Space` - Toggle auto-rotation

## Responsive Behavior

- Desktop (>1024px): Full icon sidebar + floating panels
- Tablet (768-1024px): Same layout, panels slightly narrower (240px)
- Mobile (<768px): Out of scope for now (3D geometry tool is desktop-focused)

## Migration Strategy

- Extract ControlPanel sections into separate panel components
- Build IconSidebar and FloatingPanel as new components
- Modify SpaceSculptor to use new layout
- Modify Index page to skip AppLayout
- Keep old components until new ones are validated
- Delete deprecated components after verification

## Success Criteria

- Canvas area is 90%+ of screen on a 1920x1080 display
- All current functionality remains accessible
- Teacher can present to class with maximum 3D visibility
- Single click to access any tool panel
- Smooth panel open/close animations (300ms)
- No regression in 3D rendering performance
