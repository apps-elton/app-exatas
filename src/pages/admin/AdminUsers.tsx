import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Search, ToggleLeft, ToggleRight } from 'lucide-react';
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

const ROLES: UserRole[] = ['superadmin', 'admin', 'teacher'];

const roleBadgeClass: Record<string, string> = {
  superadmin: 'bg-red-400/10 text-red-400',
  admin: 'bg-amber-400/10 text-amber-400',
  teacher: 'bg-emerald-400/10 text-emerald-400',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tenants, setTenants] = useState<Record<string, string>>({});
  const [subscriptions, setSubscriptions] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

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

      // Build tenant lookup
      const tenantMap: Record<string, string> = {};
      ((tenantsRes.data as TenantInfo[]) ?? []).forEach((t) => {
        tenantMap[t.id] = t.name;
      });
      setTenants(tenantMap);

      // Build subscription lookup
      const subMap: Record<string, string> = {};
      ((subsRes.data as SubscriptionInfo[]) ?? []).forEach((s) => {
        if (s.user_id) {
          subMap[s.user_id] = s.plan;
        }
      });
      setSubscriptions(subMap);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success('Role atualizado');
    } catch (err) {
      console.error('Erro ao alterar role:', err);
      toast.error('Erro ao atualizar');
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
      toast.success('Status atualizado');
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      toast.error('Erro ao atualizar');
    }
  };

  const filtered = users.filter(
    (u) =>
      (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">
            Usuários
            {!loading && (
              <span className="ml-2 text-base font-nunito font-normal text-muted-foreground">
                ({users.length})
              </span>
            )}
          </h1>
          <p className="text-sm font-nunito text-muted-foreground">
            Gerencie todos os usuários do sistema
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border/30 bg-background text-foreground text-sm font-nunito focus:outline-none focus:ring-2 focus:ring-red-400/50"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border/30 rounded-xl p-12 text-center">
            <p className="text-sm font-nunito text-muted-foreground">
              Nenhum usuário encontrado.
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border/30 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-nunito">
                <thead>
                  <tr className="border-b border-border/30 text-muted-foreground bg-muted/30">
                    <th className="text-left py-3 px-4 font-semibold">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-center py-3 px-4 font-semibold">Role</th>
                    <th className="text-left py-3 px-4 font-semibold">Tenant</th>
                    <th className="text-center py-3 px-4 font-semibold">Plano</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Criado em</th>
                    <th className="text-center py-3 px-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
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
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${roleBadgeClass[user.role] || 'bg-zinc-400/10 text-zinc-400'}`}
                        >
                          {user.role}
                        </span>
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
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Role dropdown */}
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user.id, e.target.value as UserRole)
                            }
                            className="px-2 py-1 rounded-lg border border-border/30 bg-background text-foreground text-xs font-nunito focus:outline-none focus:ring-2 focus:ring-red-400/50 cursor-pointer"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>

                          {/* Toggle active */}
                          <button
                            onClick={() => handleToggleActive(user)}
                            title={user.is_active ? 'Desativar' : 'Ativar'}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
