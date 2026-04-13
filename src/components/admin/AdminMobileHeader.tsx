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
