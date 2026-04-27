import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  FunctionSquare, 
  Settings2, 
  Superscript, 
  PenTool,
  LayoutDashboard, 
  FolderOpen, 
  Settings, 
  LogOut,
  Sun, 
  Moon,
  Calculator,
  Box
} from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTheme } from '@/hooks/useTheme';

export type EqPanelId = 'functions' | 'complex' | 'polynomials' | 'board';

interface EquationSidebarProps {
  activePanel: EqPanelId;
  onPanelToggle: (panel: EqPanelId) => void;
}

export function EquationSidebar({ activePanel, onPanelToggle }: EquationSidebarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const toolIcons = [
    { id: 'functions', icon: FunctionSquare, label: 'Funções Gráficas', action: () => onPanelToggle('functions'), isActive: activePanel === 'functions' },
    { id: 'complex', icon: Settings2, label: 'Plano Complexo', action: () => onPanelToggle('complex'), isActive: activePanel === 'complex' },
    { id: 'polynomials', icon: Superscript, label: 'Polinômios', action: () => onPanelToggle('polynomials'), isActive: activePanel === 'polynomials' },
    { id: 'board', icon: PenTool, label: 'Lousa', action: () => onPanelToggle('board'), isActive: activePanel === 'board' },
  ];

  const navIcons = [
    { id: 'app', icon: Box, label: 'Geometria 3D', action: () => navigate('/') },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', action: () => navigate('/dashboard') },
    { id: 'projects', icon: FolderOpen, label: 'Meus Projetos', action: () => navigate('/projects') },
    { id: 'settings', icon: Settings, label: 'Configurações', action: () => navigate('/settings') },
  ];

  return (
    <div className="w-16 h-full bg-background border-r border-border/30 hidden md:flex flex-col items-center py-3 flex-shrink-0 z-40">
      
      {/* Brand Icon */}
      <div className="mb-4">
        <Calculator className="w-7 h-7 text-primary" />
      </div>

      <div className="w-8 h-px bg-border/50 mb-3" />

      {/* Tool icons */}
      <div className="flex flex-col items-center gap-2">
        {toolIcons.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              title={item.label}
              className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
                item.isActive
                  ? 'bg-primary/20 text-primary shadow-inner scale-110'
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
              title={item.label}
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
          title="Alternar Tema"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <LanguageSelector collapsed />
        <button
          onClick={() => signOut()}
          title="Sair"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
