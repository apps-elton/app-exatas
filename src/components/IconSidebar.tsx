import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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

export function IconSidebar({ activePanel, onPanelToggle, isDrawingActive, onDrawingToggle, onExportImage }: IconSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const toolIcons = [
    { id: 'geometry', icon: Box, labelKey: 'geometry_form.title', action: () => onPanelToggle('geometry'), isActive: activePanel === 'geometry' },
    { id: 'visualization', icon: Eye, labelKey: 'panel.visualization', action: () => onPanelToggle('visualization'), isActive: activePanel === 'visualization' },
    { id: 'style', icon: Palette, labelKey: 'panel.style', action: () => onPanelToggle('style'), isActive: activePanel === 'style' },
    { id: 'drawing', icon: Pencil, labelKey: 'tablet.name', action: onDrawingToggle, isActive: isDrawingActive },
    { id: 'properties', icon: Ruler, labelKey: 'panel.properties', action: () => onPanelToggle('properties'), isActive: activePanel === 'properties' },
  ];

  const navIcons = [
    { id: 'dashboard', icon: LayoutDashboard, labelKey: 'sidebar.dashboard', action: () => navigate('/dashboard') },
    { id: 'projects', icon: FolderOpen, labelKey: 'sidebar.my_projects', action: () => navigate('/projects') },
    { id: 'export', icon: Download, labelKey: 'button.download', action: onExportImage },
    { id: 'settings', icon: Settings, labelKey: 'sidebar.settings', action: () => navigate('/settings') },
  ];

  return (
    <div id="icon-sidebar" className="w-16 h-full bg-background border-r border-border/30 flex flex-col items-center py-3 flex-shrink-0">
      {/* Tool icons */}
      <div className="flex flex-col items-center gap-1">
        {toolIcons.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              title={t(item.labelKey)}
              className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                item.isActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>

      {/* Separator */}
      <div className="w-8 h-px bg-border/50 my-3" />

      {/* Nav icons */}
      <div className="flex flex-col items-center gap-1">
        {navIcons.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              title={t(item.labelKey)}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom: theme + language + logout */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={toggleTheme}
          title={t('panel.style')}
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
