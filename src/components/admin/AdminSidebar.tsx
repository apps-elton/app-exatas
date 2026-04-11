import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  School,
  Users,
  CreditCard,
  MessageSquare,
  Settings,
  ArrowLeft,
  Shield,
} from 'lucide-react';

const ADMIN_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Tenants', icon: School, path: '/admin/tenants' },
  { label: 'Usuários', icon: Users, path: '/admin/users' },
  { label: 'Assinaturas', icon: CreditCard, path: '/admin/subscriptions' },
  { label: 'Suporte', icon: MessageSquare, path: '/admin/support' },
  { label: 'Sistema', icon: Settings, path: '/admin/settings' },
];

export function AdminSidebar() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="h-screen w-64 flex flex-col border-r border-red-400/20 bg-background/95 backdrop-blur">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-red-400/20">
        <Shield className="w-6 h-6 text-red-400" />
        <div>
          <span className="font-poppins font-bold text-foreground">GeoTeach</span>
          <span className="text-xs text-red-400 font-poppins ml-1">Admin</span>
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-3 border-b border-border/30">
        <p className="text-sm font-poppins font-semibold text-foreground truncate">{profile?.full_name}</p>
        <p className="text-xs text-red-400">Super Admin</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
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

      {/* Back */}
      <div className="p-2 border-t border-border/30">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-nunito text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar ao App
        </button>
      </div>
    </div>
  );
}
