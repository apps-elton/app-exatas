import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  FolderOpen,
  Box,
  School,
  CreditCard,
  Clock,
  Loader2,
  ArrowRight,
  Crown,
} from 'lucide-react';

interface RecentProject {
  id: string;
  name: string;
  updated_at: string;
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuito',
  professor: 'Professor',
  institution: 'Instituição',
};

export default function Dashboard() {
  const { user, profile, subscription } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projectCount, setProjectCount] = useState(0);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [tenantName, setTenantName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      const [countRes, recentRes] = await Promise.all([
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('projects')
          .select('id, name, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(5),
      ]);

      setProjectCount(countRes.count ?? 0);
      setRecentProjects(recentRes.data ?? []);

      if (profile?.tenant_id) {
        const { data } = await supabase
          .from('tenants')
          .select('name')
          .eq('id', profile.tenant_id)
          .single();
        setTenantName(data?.name ?? null);
      }

      setLoading(false);
    })();
  }, [user, profile?.tenant_id]);

  const plan = subscription?.plan ?? 'free';
  const limit = subscription?.projects_limit ?? 3;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">
            Olá, {profile?.full_name?.split(' ')[0] ?? 'Professor'}!
          </h1>
          <p className="text-sm font-nunito text-muted-foreground">
            Seu painel de atividades no GeoTeach
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
              {/* Projects */}
              <div className="bg-card border border-border/30 rounded-xl p-5 flex items-center gap-4">
                <div className="bg-violet-400/10 p-3 rounded-lg">
                  <FolderOpen className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-nunito text-muted-foreground">Projetos</p>
                  <p className="text-2xl font-poppins font-bold text-violet-400">
                    {projectCount}
                    <span className="text-sm text-muted-foreground font-normal">/{limit}</span>
                  </p>
                </div>
              </div>

              {/* Plan */}
              <div className="bg-card border border-border/30 rounded-xl p-5 flex items-center gap-4">
                <div className="bg-amber-400/10 p-3 rounded-lg">
                  {plan === 'free' ? (
                    <CreditCard className="w-6 h-6 text-amber-400" />
                  ) : (
                    <Crown className="w-6 h-6 text-amber-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-nunito text-muted-foreground">Plano</p>
                  <p className="text-2xl font-poppins font-bold text-amber-400">
                    {PLAN_LABELS[plan] ?? plan}
                  </p>
                </div>
              </div>

              {/* School */}
              <div className="bg-card border border-border/30 rounded-xl p-5 flex items-center gap-4">
                <div className="bg-blue-400/10 p-3 rounded-lg">
                  <School className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-nunito text-muted-foreground">Escola</p>
                  <p className="text-lg font-poppins font-bold text-blue-400 truncate max-w-[140px]">
                    {tenantName ?? 'Individual'}
                  </p>
                </div>
              </div>

              {/* Role */}
              <div className="bg-card border border-border/30 rounded-xl p-5 flex items-center gap-4">
                <div className="bg-emerald-400/10 p-3 rounded-lg">
                  <Box className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-nunito text-muted-foreground">Cargo</p>
                  <p className="text-2xl font-poppins font-bold text-emerald-400">
                    {profile?.role === 'admin' ? 'Admin' : 'Professor'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Projects */}
            <div className="bg-card border border-border/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-poppins font-semibold text-foreground">
                  Projetos Recentes
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/projects')}
                  className="gap-1 text-xs font-nunito"
                >
                  Ver todos <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              {recentProjects.length === 0 ? (
                <div className="text-center py-8">
                  <Box className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-nunito text-muted-foreground mb-4">
                    Você ainda não criou nenhum projeto.
                  </p>
                  <Button onClick={() => navigate('/')} className="gap-2 font-poppins">
                    <Box className="w-4 h-4" />
                    Criar primeiro projeto
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentProjects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => navigate('/projects')}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <FolderOpen className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-nunito text-foreground">{project.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(project.updated_at).toLocaleDateString('pt-BR')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Upgrade banner for free plan */}
            {plan === 'free' && (
              <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10 border border-primary/20 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-poppins font-bold text-foreground mb-1">
                      Faça upgrade para desbloquear mais recursos
                    </h3>
                    <p className="text-sm font-nunito text-muted-foreground">
                      Projetos ilimitados, mais armazenamento e funcionalidades avançadas.
                    </p>
                  </div>
                  <Button disabled className="font-poppins shrink-0">
                    Em breve
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
