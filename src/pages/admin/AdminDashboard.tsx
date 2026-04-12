import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { School, Users, FolderKanban, TicketCheck, Loader2 } from 'lucide-react';

interface KPI {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface RecentUser {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  created_at: string;
}

interface RecentTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    open: 'bg-emerald-400/10 text-emerald-400',
    closed: 'bg-zinc-400/10 text-zinc-400',
    in_progress: 'bg-amber-400/10 text-amber-400',
    pending: 'bg-yellow-400/10 text-yellow-400',
  };
  return map[status] || 'bg-zinc-400/10 text-zinc-400';
};

const priorityBadge = (priority: string) => {
  const map: Record<string, string> = {
    high: 'bg-red-400/10 text-red-400',
    medium: 'bg-amber-400/10 text-amber-400',
    low: 'bg-emerald-400/10 text-emerald-400',
    urgent: 'bg-rose-500/10 text-rose-500',
  };
  return map[priority] || 'bg-zinc-400/10 text-zinc-400';
};

const roleBadge = (role: string) => {
  const map: Record<string, string> = {
    superadmin: 'bg-red-400/10 text-red-400',
    admin: 'bg-amber-400/10 text-amber-400',
    teacher: 'bg-emerald-400/10 text-emerald-400',
  };
  return map[role] || 'bg-zinc-400/10 text-zinc-400';
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [tenantsRes, profilesRes, projectsRes] = await Promise.all([
          supabase.from('tenants').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('projects').select('id', { count: 'exact', head: true }),
        ]);

        // Try support_tickets - may not exist yet
        let ticketsCount = 0;
        let tickets: RecentTicket[] = [];
        try {
          const ticketsCountRes = await (supabase as any)
            .from('support_tickets')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'open');
          ticketsCount = ticketsCountRes.count ?? 0;

          const ticketsDataRes = await (supabase as any)
            .from('support_tickets')
            .select('id, subject, status, priority, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
          tickets = ticketsDataRes.data ?? [];
        } catch {
          // Table may not exist yet
        }

        setKpis([
          {
            label: t('admin.total_tenants'),
            value: tenantsRes.count ?? 0,
            icon: School,
            color: 'text-blue-400',
            bgColor: 'bg-blue-400/10',
          },
          {
            label: t('admin.total_users'),
            value: profilesRes.count ?? 0,
            icon: Users,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-400/10',
          },
          {
            label: t('admin.total_projects'),
            value: projectsRes.count ?? 0,
            icon: FolderKanban,
            color: 'text-violet-400',
            bgColor: 'bg-violet-400/10',
          },
          {
            label: t('admin.open_tickets'),
            value: ticketsCount,
            icon: TicketCheck,
            color: 'text-amber-400',
            bgColor: 'bg-amber-400/10',
          },
        ]);

        setRecentTickets(tickets);

        // Recent users
        const usersRes = await supabase
          .from('profiles')
          .select('id, full_name, email, role, created_at')
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentUsers(usersRes.data ?? []);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">{t('admin.dashboard_title')}</h1>
          <p className="text-sm font-nunito text-muted-foreground">
            {t('admin.dashboard_subtitle')}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={kpi.label}
                    className="bg-card border border-border/30 rounded-xl p-5 flex items-center gap-4"
                  >
                    <div className={`${kpi.bgColor} p-3 rounded-lg`}>
                      <Icon className={`w-6 h-6 ${kpi.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-nunito text-muted-foreground">{kpi.label}</p>
                      <p className={`text-2xl font-poppins font-bold ${kpi.color}`}>
                        {kpi.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Two column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Users */}
              <div className="bg-card border border-border/30 rounded-xl p-5">
                <h2 className="text-lg font-poppins font-semibold text-foreground mb-4">
                  {t('admin.recent_users')}
                </h2>
                {recentUsers.length === 0 ? (
                  <p className="text-sm font-nunito text-muted-foreground py-8 text-center">
                    {t('admin.no_users_found')}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm font-nunito">
                      <thead>
                        <tr className="border-b border-border/30 text-muted-foreground">
                          <th className="text-left py-2 pr-2 font-semibold">{t('admin.table_name')}</th>
                          <th className="text-left py-2 pr-2 font-semibold">{t('admin.table_email')}</th>
                          <th className="text-left py-2 pr-2 font-semibold">{t('admin.table_role')}</th>
                          <th className="text-left py-2 font-semibold">{t('admin.table_created_at')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentUsers.map((user) => (
                          <tr key={user.id} className="border-b border-border/10">
                            <td className="py-2.5 pr-2 text-foreground">
                              {user.full_name || '—'}
                            </td>
                            <td className="py-2.5 pr-2 text-muted-foreground truncate max-w-[160px]">
                              {user.email}
                            </td>
                            <td className="py-2.5 pr-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${roleBadge(user.role)}`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="py-2.5 text-muted-foreground text-xs">
                              {formatDate(user.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Recent Tickets */}
              <div className="bg-card border border-border/30 rounded-xl p-5">
                <h2 className="text-lg font-poppins font-semibold text-foreground mb-4">
                  {t('admin.recent_tickets')}
                </h2>
                {recentTickets.length === 0 ? (
                  <p className="text-sm font-nunito text-muted-foreground py-8 text-center">
                    {t('admin.no_tickets_found')}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm font-nunito">
                      <thead>
                        <tr className="border-b border-border/30 text-muted-foreground">
                          <th className="text-left py-2 pr-2 font-semibold">{t('admin.table_subject')}</th>
                          <th className="text-left py-2 pr-2 font-semibold">{t('admin.table_status')}</th>
                          <th className="text-left py-2 pr-2 font-semibold">{t('admin.table_priority')}</th>
                          <th className="text-left py-2 font-semibold">{t('admin.table_created_at')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTickets.map((ticket) => (
                          <tr key={ticket.id} className="border-b border-border/10">
                            <td className="py-2.5 pr-2 text-foreground truncate max-w-[180px]">
                              {ticket.subject}
                            </td>
                            <td className="py-2.5 pr-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(ticket.status)}`}
                              >
                                {ticket.status}
                              </span>
                            </td>
                            <td className="py-2.5 pr-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityBadge(ticket.priority)}`}
                              >
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="py-2.5 text-muted-foreground text-xs">
                              {formatDate(ticket.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
