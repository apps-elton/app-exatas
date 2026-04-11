import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Box,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FolderOpen,
  CreditCard,
  Settings,
  LogOut,
  User,
  Shield,
  School,
  GraduationCap,
  Crown,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'app', label: 'Geometria 3D', icon: Box, path: '/' },
  { id: 'projects', label: 'Meus Projetos', icon: FolderOpen, path: '/projects' },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', disabled: true },
  { id: 'settings', label: 'Configurações', icon: Settings, path: '/settings' },
];

const ROLE_CONFIG = {
  superadmin: { label: 'Super Admin', icon: Shield, color: 'text-red-400', bg: 'bg-red-400/10' },
  admin: { label: 'Admin', icon: School, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  teacher: { label: 'Professor', icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
};

const PLAN_CONFIG = {
  free: { label: 'Gratuito', color: 'text-muted-foreground' },
  professor: { label: 'Professor', color: 'text-primary' },
  institution: { label: 'Instituição', color: 'text-accent' },
};

export function AppSidebar() {
  const { profile, subscription, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const role = profile?.role ?? 'teacher';
  const plan = subscription?.plan ?? 'free';
  const roleConfig = ROLE_CONFIG[role];
  const planConfig = PLAN_CONFIG[plan];
  const RoleIcon = roleConfig.icon;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div
      className={`h-screen flex flex-col border-r border-border/30 bg-background/95 backdrop-blur transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Box className="w-7 h-7 text-primary shrink-0" />
            <span className="font-poppins font-bold text-lg text-foreground">GeoTeach</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={`shrink-0 h-8 w-8 ${collapsed ? 'mx-auto' : ''}`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* User info */}
      <div className={`p-3 border-b border-border/30 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <div className={`w-9 h-9 rounded-full ${roleConfig.bg} flex items-center justify-center`}>
            <RoleIcon className={`w-4 h-4 ${roleConfig.color}`} />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${roleConfig.bg} flex items-center justify-center shrink-0`}>
              <RoleIcon className={`w-5 h-5 ${roleConfig.color}`} />
            </div>
            <div className="min-w-0">
              <p className="font-poppins font-semibold text-sm text-foreground truncate">
                {profile?.full_name ?? 'Usuário'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium ${roleConfig.color}`}>{roleConfig.label}</span>
                <span className="text-muted-foreground/40">·</span>
                <div className="flex items-center gap-1">
                  {plan !== 'free' && <Crown className="w-3 h-3 text-amber-400" />}
                  <span className={`text-xs ${planConfig.color}`}>{planConfig.label}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && navigate(item.path)}
              disabled={item.disabled}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-nunito transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : item.disabled
                  ? 'text-muted-foreground/40 cursor-not-allowed'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : ''}`} />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {!collapsed && item.disabled && (
                <span className="ml-auto text-[10px] bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded">Em breve</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin Panel link (superadmin only) */}
      {role === 'superadmin' && (
        <div className="px-2 pb-1">
          <button
            onClick={() => navigate('/admin')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-nunito transition-colors border border-red-400/20 ${
              location.pathname.startsWith('/admin')
                ? 'bg-red-400/10 text-red-400 font-semibold'
                : 'text-red-400/70 hover:bg-red-400/10 hover:text-red-400'
            } ${collapsed ? 'justify-center px-0' : ''}`}
            title={collapsed ? 'Painel Admin' : undefined}
          >
            <Shield className={`w-5 h-5 shrink-0`} />
            {!collapsed && <span>Painel Admin</span>}
          </button>
        </div>
      )}

      {/* Upgrade banner (only for free plan) */}
      {plan === 'free' && !collapsed && (
        <div className="mx-3 mb-2 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
          <p className="text-xs font-poppins font-semibold text-foreground mb-1">Upgrade para Pro</p>
          <p className="text-[11px] text-muted-foreground mb-2">Projetos ilimitados e mais recursos</p>
          <Button size="sm" className="w-full h-7 text-xs font-poppins" disabled>
            Em breve
          </Button>
        </div>
      )}

      {/* Logout */}
      <div className="p-2 border-t border-border/30">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-nunito text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
}
