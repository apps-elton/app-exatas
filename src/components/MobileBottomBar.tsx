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
