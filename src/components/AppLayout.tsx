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
    { label: t('sidebar.geometry3d'), icon: Box, path: '/' },
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
