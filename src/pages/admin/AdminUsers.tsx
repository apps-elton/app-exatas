import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Search, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  tenant_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface TenantInfo {
  id: string;
  name: string;
}

interface SubscriptionInfo {
  user_id: string | null;
  plan: string;
}

const ALL_ROLES: UserRole[] = ['superadmin', 'admin', 'teacher', 'student'];
type FilterValue = 'all' | UserRole;

const roleBadgeClass: Record<string, string> = {
  superadmin: 'bg-red-400/10 text-red-400',
  admin: 'bg-amber-400/10 text-amber-400',
  teacher: 'bg-emerald-400/10 text-emerald-400',
  student: 'bg-sky-400/10 text-sky-400',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function AdminUsers() {
  const { t } = useTranslation();
  const { profile: currentProfile } = useAuth();
  const isSuperadmin = currentProfile?.role === 'superadmin';
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tenants, setTenants] = useState<Record<string, string>>({});
  const [subscriptions, setSubscriptions] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');
  const [openRolePopover, setOpenRolePopover] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, tenantsRes, subsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, role, tenant_id, is_active, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('tenants').select('id, name'),
        supabase.from('subscriptions').select('user_id, plan'),
      ]);

      setUsers((usersRes.data as UserProfile[]) ?? []);

      const tenantMap: Record<string, string> = {};
      ((tenantsRes.data as TenantInfo[]) ?? []).forEach((tn) => {
        tenantMap[tn.id] = tn.name;
      });
      setTenants(tenantMap);

      const subMap: Record<string, string> = {};
      ((subsRes.data as SubscriptionInfo[]) ?? []).forEach((s) => {
        if (s.user_id) {
          subMap[s.user_id] = s.plan;
        }
      });
      setSubscriptions(subMap);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setOpenRolePopover(null);
    try {
      const { error } = await supabase.rpc('admin_change_user_role', {
        p_user_id: userId,
        p_new_role: newRole,
      });
      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(t('admin.users.role_changed'));
    } catch (err) {
      console.error('Error changing role:', err);
      toast.error(t('admin.users.role_change_error'));
    }
  };

  const handleToggleActive = async (user: UserProfile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);
      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      );
      toast.success(t('admin.users_status_updated'));
    } catch (err) {
      console.error('Error changing status:', err);
      toast.error(t('admin.users_status_error'));
    }
  };

  const roleCounts = useMemo(() => {
    const counts: Record<FilterValue, number> = {
      all: users.length,
      superadmin: 0,
      admin: 0,
      teacher: 0,
      student: 0,
    };
    for (const u of users) {
      counts[u.role]++;
    }
    return counts;
  }, [users]);

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase();
    return users.filter((u) => {
      if (filter !== 'all' && u.role !== filter) return false;
      if (
        searchLower &&
        !(u.full_name ?? '').toLowerCase().includes(searchLower) &&
        !u.email.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
      return true;
    });
  }, [users, filter, search]);

  const FILTERS: { value: FilterValue; labelKey: string }[] = [
    { value: 'all', labelKey: 'admin.users.filter_all' },
    { value: 'superadmin', labelKey: 'admin.users.filter_superadmin' },
    { value: 'admin', labelKey: 'admin.users.filter_admin' },
    { value: 'teacher', labelKey: 'admin.users.filter_teacher' },
    { value: 'student', labelKey: 'admin.users.filter_student' },
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">
            {t('admin.users_title')}
            {!loading && (
              <span className="ml-2 text-base font-nunito font-normal text-muted-foreground">
                ({users.length})
              </span>
            )}
          </h1>
          <p className="text-sm font-nunito text-muted-foreground">
            {t('admin.users_subtitle')}
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.users_search_placeholder')}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border/30 bg-background text-foreground text-sm font-nunito focus:outline-none focus:ring-2 focus:ring-red-400/50"
          />
        </div>

        {/* Role filter chips */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            const count = roleCounts[f.value];
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-poppins font-semibold transition-colors border ${
                  active
                    ? 'bg-red-400/10 text-red-400 border-red-400/30'
                    : 'bg-muted/20 text-muted-foreground border-border/30 hover:bg-muted/40 hover:text-foreground'
                }`}
              >
                {t(f.labelKey)} ({count})
              </button>
            );
          })}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border/30 rounded-xl p-12 text-center">
            <p className="text-sm font-nunito text-muted-foreground">
              {t('admin.users_no_results')}
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border/30 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-nunito">
                <thead>
                  <tr className="border-b border-border/30 text-muted-foreground bg-muted/30">
                    <th className="text-left py-3 px-4 font-semibold">{t('admin.users_table_name')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('admin.users_table_email')}</th>
                    <th className="text-center py-3 px-4 font-semibold">{t('admin.users_table_role')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('admin.users_table_tenant')}</th>
                    <th className="text-center py-3 px-4 font-semibold">{t('admin.users_table_plan')}</th>
                    <th className="text-center py-3 px-4 font-semibold">{t('admin.users_table_status')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('admin.users_table_created_at')}</th>
                    <th className="text-center py-3 px-4 font-semibold">{t('admin.users_table_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => {
                    const badgeClass =
                      roleBadgeClass[user.role] || 'bg-zinc-400/10 text-zinc-400';
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-border/10 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-3 px-4 text-foreground font-semibold">
                          {user.full_name || '—'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground truncate max-w-[200px]">
                          {user.email}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isSuperadmin ? (
                            <Popover
                              open={openRolePopover === user.id}
                              onOpenChange={(o) =>
                                setOpenRolePopover(o ? user.id : null)
                              }
                            >
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  title={t('admin.users.change_role')}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80 ${badgeClass}`}
                                >
                                  {user.role}
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent align="center" className="w-40 p-1">
                                <div className="text-[10px] uppercase tracking-wide text-muted-foreground px-2 py-1">
                                  {t('admin.users.change_role')}
                                </div>
                                {ALL_ROLES.map((r) => (
                                  <button
                                    key={r}
                                    onClick={() => handleRoleChange(user.id, r)}
                                    disabled={r === user.role}
                                    className={`w-full text-left px-2 py-1.5 rounded-md text-xs font-nunito transition-colors ${
                                      r === user.role
                                        ? 'bg-muted/50 text-muted-foreground cursor-default'
                                        : 'hover:bg-muted/60 text-foreground'
                                    }`}
                                  >
                                    <span
                                      className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${
                                        roleBadgeClass[r]?.split(' ')[0] ?? ''
                                      }`}
                                    />
                                    {r}
                                  </button>
                                ))}
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}
                            >
                              {user.role}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {user.tenant_id ? tenants[user.tenant_id] || '—' : '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-400/10 text-blue-400">
                            {subscriptions[user.id] || 'free'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              user.is_active
                                ? 'bg-emerald-400/10 text-emerald-400'
                                : 'bg-zinc-400/10 text-zinc-400'
                            }`}
                          >
                            {user.is_active ? t('common.active') : t('common.inactive')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleToggleActive(user)}
                              title={user.is_active ? t('common.deactivate') : t('common.activate')}
                              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                            >
                              {user.is_active ? (
                                <ToggleRight className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <ToggleLeft className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
