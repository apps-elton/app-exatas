import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/LanguageSelector';
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
  Users,
  Shield,
  School,
  GraduationCap,
  BookOpen,
  Crown,
  MessageSquare,
  Clock,
  Calculator,
} from 'lucide-react';

const ROLE_STYLE = {
  superadmin: {
    icon: Shield,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/40',
    tint: 'bg-red-400/5',
  },
  admin: {
    icon: School,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/40',
    tint: 'bg-amber-400/5',
  },
  teacher: {
    icon: GraduationCap,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/40',
    tint: 'bg-emerald-400/5',
  },
  student: {
    icon: BookOpen,
    color: 'text-sky-400',
    bg: 'bg-sky-400/10',
    border: 'border-sky-400/40',
    tint: 'bg-sky-400/5',
  },
};

const PLAN_STYLE = {
  free: { color: 'text-muted-foreground' },
  professor: { color: 'text-primary' },
  institution: { color: 'text-accent' },
};

export function AppSidebar() {
  const { profile, subscription, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const role = profile?.role ?? 'teacher';
  const plan = subscription?.plan ?? 'free';
  const roleStyle = ROLE_STYLE[role];
  const planStyle = PLAN_STYLE[plan];
  const RoleIcon = roleStyle.icon;

  // Trial countdown
  const trialEndsAt = (subscription as { trial_ends_at?: string | null } | null)?.trial_ends_at ?? null;
  const isTrialing = subscription?.status === 'trialing' && !!trialEndsAt;
  const trialDaysRemaining = isTrialing && trialEndsAt
    ? Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)
    : null;

  const roleLabel =
    role === 'superadmin'
      ? t('roles.superadmin')
      : role === 'admin'
      ? t('roles.admin')
      : role === 'student'
      ? t('roles.student')
      : t('roles.teacher');
  const planLabel = plan === 'free' ? t('plans.free') : plan === 'professor' ? t('plans.professor') : t('plans.institution');

  const TEACHER_NAV = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard, path: '/dashboard' },
    { id: 'app', label: t('sidebar.geometry3d'), icon: Box, path: '/' },
    { id: 'projects', label: t('sidebar.my_projects'), icon: FolderOpen, path: '/projects' },
    { id: 'equation-breaker', label: 'Equation Breaker', icon: Calculator, path: '/equation-breaker' },
    { id: 'settings', label: t('sidebar.settings'), icon: Settings, path: '/settings' },
  ];

  const ADMIN_NAV = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard, path: '/dashboard' },
    { id: 'app', label: t('sidebar.geometry3d'), icon: Box, path: '/' },
    { id: 'projects', label: t('sidebar.my_projects'), icon: FolderOpen, path: '/projects' },
    { id: 'equation-breaker', label: 'Equation Breaker', icon: Calculator, path: '/equation-breaker' },
    { id: 'users', label: t('sidebar.school_users'), icon: Users, path: '/school/users' },
    { id: 'settings', label: t('sidebar.settings'), icon: Settings, path: '/settings' },
  ];

  const SUPERADMIN_NAV = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard, path: '/admin' },
    { id: 'tenants', label: t('sidebar.tenants'), icon: School, path: '/admin/tenants' },
    { id: 'users', label: t('sidebar.users'), icon: Users, path: '/admin/users' },
    { id: 'subscriptions', label: t('sidebar.subscriptions'), icon: CreditCard, path: '/admin/subscriptions' },
    { id: 'support', label: t('sidebar.support'), icon: MessageSquare, path: '/admin/support' },
    { id: 'system', label: t('sidebar.system'), icon: Settings, path: '/admin/settings' },
    { id: 'divider', label: '', icon: Box, path: '', divider: true },
    { id: 'app', label: t('sidebar.geometry3d'), icon: Box, path: '/' },
    { id: 'equation-breaker', label: 'Equation Breaker', icon: Calculator, path: '/equation-breaker' },
    { id: 'projects', label: t('sidebar.projects'), icon: FolderOpen, path: '/projects' },
  ];

  const navItems = role === 'superadmin'
    ? SUPERADMIN_NAV
    : role === 'admin'
    ? ADMIN_NAV
    : TEACHER_NAV;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div
      className={`h-screen hidden md:flex flex-col border-r border-border/30 bg-background/95 backdrop-blur transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        {!collapsed && (
          <div className="flex items-center gap-2">
            {role === 'superadmin' ? (
              <>
                <Shield className="w-6 h-6 text-red-400 shrink-0" />
                <span className="font-poppins font-bold text-foreground">GeoTeach</span>
                <span className="text-xs text-red-400 font-poppins font-semibold">{t('sidebar.admin')}</span>
              </>
            ) : (
              <>
                <Box className="w-7 h-7 text-primary shrink-0" />
                <span className="font-poppins font-bold text-lg text-foreground">GeoTeach</span>
              </>
            )}
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
          <div className={`w-9 h-9 rounded-full ${roleStyle.bg} flex items-center justify-center`}>
            <RoleIcon className={`w-4 h-4 ${roleStyle.color}`} />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${roleStyle.bg} flex items-center justify-center shrink-0`}>
              <RoleIcon className={`w-5 h-5 ${roleStyle.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-poppins font-semibold text-sm text-foreground truncate">
                {profile?.full_name ?? t('sidebar.user_fallback')}
              </p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              <div
                className={`mt-1.5 flex items-center gap-1.5 px-1.5 py-0.5 rounded-r-md border-l-2 ${roleStyle.border} ${roleStyle.tint}`}
              >
                <RoleIcon className={`w-3 h-3 shrink-0 ${roleStyle.color}`} />
                <span className={`text-xs font-poppins font-semibold ${roleStyle.color}`}>
                  {roleLabel}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <div className="flex items-center gap-1 min-w-0">
                  {plan !== 'free' && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                  <span className={`text-xs truncate ${planStyle.color}`}>{planLabel}</span>
                </div>
              </div>
              {isTrialing && trialDaysRemaining !== null && (
                trialDaysRemaining > 0 ? (
                  <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/30">
                    <Clock className="w-3 h-3 shrink-0 text-primary" />
                    <span className="text-[11px] font-poppins font-semibold text-primary">
                      {t('sidebar.trial_days_remaining', { count: trialDaysRemaining })}
                    </span>
                  </div>
                ) : (
                  <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/40 border border-border/40">
                    <Clock className="w-3 h-3 shrink-0 text-muted-foreground" />
                    <span className="text-[11px] font-poppins font-semibold text-muted-foreground">
                      {t('sidebar.trial_expired')}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if ((item as any).divider) {
            return (
              <div key={item.id} className={`my-2 border-t border-border/30 ${collapsed ? 'mx-1' : 'mx-2'}`} />
            );
          }
          const Icon = item.icon;
          const isActive = item.path === '/admin'
            ? location.pathname === '/admin'
            : item.path !== '/'
            ? location.pathname.startsWith(item.path)
            : location.pathname === '/';
          const accentColor = role === 'superadmin' ? 'text-red-400 bg-red-400/10' : 'text-primary bg-primary/10';
          return (
            <button
              key={item.id}
              onClick={() => !(item as any).disabled && navigate(item.path)}
              disabled={(item as any).disabled}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-nunito transition-colors ${
                isActive
                  ? `${accentColor} font-semibold`
                  : (item as any).disabled
                  ? 'text-muted-foreground/40 cursor-not-allowed'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0`} />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {!collapsed && (item as any).disabled && (
                <span className="ml-auto text-[10px] bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded">{t('common.coming_soon')}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Upgrade banner (only for free plan) */}
      {plan === 'free' && !collapsed && (
        <div className="mx-3 mb-2 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
          <p className="text-xs font-poppins font-semibold text-foreground mb-1">{t('sidebar.upgrade_to_pro')}</p>
          <p className="text-[11px] text-muted-foreground mb-2">{t('sidebar.unlimited_projects')}</p>
          <Button size="sm" className="w-full h-7 text-xs font-poppins" disabled>
            {t('common.coming_soon')}
          </Button>
        </div>
      )}

      {/* Language Selector */}
      <div className={`px-2 pt-2 ${collapsed ? 'flex justify-center' : ''}`}>
        <LanguageSelector collapsed={collapsed} />
      </div>

      {/* Logout */}
      <div className="p-2 border-t border-border/30">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-nunito text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title={collapsed ? t('sidebar.logout') : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>{t('sidebar.logout')}</span>}
        </button>
      </div>
    </div>
  );
}
