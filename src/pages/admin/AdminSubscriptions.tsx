import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Subscription = Tables<'subscriptions'>;
type Profile = Tables<'profiles'>;

type SubscriptionWithProfile = Subscription & {
  profiles: Pick<Profile, 'email' | 'full_name'> | null;
};

type Plan = 'free' | 'professor' | 'institution';
type Status = 'active' | 'canceled' | 'past_due' | 'trialing' | 'inactive';

const PLAN_LIMITS: Record<Plan, { projects: number; storage: number }> = {
  free: { projects: 3, storage: 100 },
  professor: { projects: 50, storage: 5120 },
  institution: { projects: 500, storage: 51200 },
};

const PLAN_COLORS: Record<Plan, string> = {
  free: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  professor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  institution: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  canceled: 'bg-red-500/20 text-red-400 border-red-500/30',
  past_due: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  trialing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, profiles!subscriptions_user_id_fkey(email, full_name)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar assinaturas');
      console.error(error);
    } else {
      setSubscriptions((data as SubscriptionWithProfile[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handlePlanChange = async (subscriptionId: string, newPlan: Plan) => {
    const limits = PLAN_LIMITS[newPlan];
    const { error } = await supabase
      .from('subscriptions')
      .update({
        plan: newPlan,
        projects_limit: limits.projects,
        storage_limit_mb: limits.storage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (error) {
      toast.error('Erro ao atualizar plano');
      console.error(error);
    } else {
      toast.success(`Plano atualizado para ${newPlan}`);
      fetchSubscriptions();
    }
  };

  const counts = {
    free: subscriptions.filter((s) => s.plan === 'free').length,
    professor: subscriptions.filter((s) => s.plan === 'professor').length,
    institution: subscriptions.filter((s) => s.plan === 'institution').length,
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-red-400" />
            Assinaturas
          </h1>
          <p className="text-sm font-nunito text-muted-foreground mt-1">
            Gerencie as assinaturas dos usuarios da plataforma
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([
            { plan: 'free' as Plan, label: 'Free', color: 'border-gray-500/30' },
            { plan: 'professor' as Plan, label: 'Professor', color: 'border-blue-500/30' },
            { plan: 'institution' as Plan, label: 'Institution', color: 'border-purple-500/30' },
          ]).map(({ plan, label, color }) => (
            <div
              key={plan}
              className={`rounded-xl border ${color} bg-card/50 backdrop-blur p-5`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-nunito text-muted-foreground">{label}</span>
                <Badge className={PLAN_COLORS[plan]}>{plan}</Badge>
              </div>
              <p className="text-3xl font-poppins font-bold text-foreground mt-2">
                {counts[plan]}
              </p>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-400" />
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-nunito">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left px-4 py-3 font-poppins font-semibold text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-3 font-poppins font-semibold text-muted-foreground">Plano</th>
                    <th className="text-left px-4 py-3 font-poppins font-semibold text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-poppins font-semibold text-muted-foreground">Projetos Limite</th>
                    <th className="text-left px-4 py-3 font-poppins font-semibold text-muted-foreground">Storage Limite</th>
                    <th className="text-left px-4 py-3 font-poppins font-semibold text-muted-foreground">Criado em</th>
                    <th className="text-left px-4 py-3 font-poppins font-semibold text-muted-foreground">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 text-foreground">
                        {sub.profiles?.email || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={PLAN_COLORS[sub.plan as Plan]}>
                          {sub.plan}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={STATUS_COLORS[sub.status as Status] || STATUS_COLORS.inactive}>
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-foreground">{sub.projects_limit}</td>
                      <td className="px-4 py-3 text-foreground">{sub.storage_limit_mb} MB</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={sub.plan}
                          onValueChange={(value) =>
                            handlePlanChange(sub.id, value as Plan)
                          }
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="professor">Professor</SelectItem>
                            <SelectItem value="institution">Institution</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                  {subscriptions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-muted-foreground">
                        Nenhuma assinatura encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
