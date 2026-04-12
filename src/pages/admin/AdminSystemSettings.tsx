import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Settings, Save } from 'lucide-react';
import { toast } from 'sonner';

interface PlatformSettings {
  name: string;
  registration_enabled: boolean;
  maintenance_mode: boolean;
}

interface PlanDefaults {
  free: { projects_limit: number; storage_limit_mb: number };
  professor: { projects_limit: number; storage_limit_mb: number };
  institution: { projects_limit: number; storage_limit_mb: number };
}

interface SecuritySettings {
  min_password_length: number;
  session_timeout_hours: number;
}

const DEFAULT_PLATFORM: PlatformSettings = {
  name: 'GeoTeach',
  registration_enabled: true,
  maintenance_mode: false,
};

const DEFAULT_PLANS: PlanDefaults = {
  free: { projects_limit: 3, storage_limit_mb: 100 },
  professor: { projects_limit: 50, storage_limit_mb: 5120 },
  institution: { projects_limit: 500, storage_limit_mb: 51200 },
};

const DEFAULT_SECURITY: SecuritySettings = {
  min_password_length: 8,
  session_timeout_hours: 24,
};

export default function AdminSystemSettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platform, setPlatform] = useState<PlatformSettings>(DEFAULT_PLATFORM);
  const [plans, setPlans] = useState<PlanDefaults>(DEFAULT_PLANS);
  const [security, setSecurity] = useState<SecuritySettings>(DEFAULT_SECURITY);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .in('key', ['platform', 'plan_defaults', 'security']);

    if (error) {
      toast.error(t('admin.system_load_error'));
      console.error(error);
    } else if (data) {
      for (const row of data) {
        if (row.key === 'platform') {
          setPlatform({ ...DEFAULT_PLATFORM, ...(row.value as Record<string, unknown>) } as PlatformSettings);
        } else if (row.key === 'plan_defaults') {
          setPlans({ ...DEFAULT_PLANS, ...(row.value as Record<string, unknown>) } as PlanDefaults);
        } else if (row.key === 'security') {
          setSecurity({ ...DEFAULT_SECURITY, ...(row.value as Record<string, unknown>) } as SecuritySettings);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const upsertSetting = async (key: string, value: unknown) => {
    const { error } = await supabase
      .from('system_settings')
      .upsert(
        { key, value: value as Record<string, unknown>, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    return error;
  };

  const handleSave = async () => {
    setSaving(true);
    const errors = await Promise.all([
      upsertSetting('platform', platform),
      upsertSetting('plan_defaults', plans),
      upsertSetting('security', security),
    ]);

    const hasError = errors.some((e) => e !== null);
    if (hasError) {
      toast.error(t('admin.system_save_error'));
      errors.forEach((e) => e && console.error(e));
    } else {
      toast.success(t('admin.system_save_success'));
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full py-20">
          <Loader2 className="w-8 h-8 animate-spin text-red-400" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-poppins font-bold text-foreground flex items-center gap-2">
              <Settings className="w-6 h-6 text-red-400" />
              {t('admin.system_title')}
            </h1>
            <p className="text-sm font-nunito text-muted-foreground mt-1">
              {t('admin.system_subtitle')}
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-red-500 hover:bg-red-600 text-white font-nunito"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {t('admin.system_save')}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="platform" className="space-y-6">
          <TabsList className="bg-muted/30 border border-border/50">
            <TabsTrigger value="platform" className="font-nunito">{t('admin.system_tab_platform')}</TabsTrigger>
            <TabsTrigger value="plans" className="font-nunito">{t('admin.system_tab_plans')}</TabsTrigger>
            <TabsTrigger value="security" className="font-nunito">{t('admin.system_tab_security')}</TabsTrigger>
          </TabsList>

          {/* Plataforma */}
          <TabsContent value="platform">
            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-6 space-y-6">
              <h2 className="text-lg font-poppins font-semibold text-foreground">{t('admin.system_platform_title')}</h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-nunito font-medium text-foreground">
                    {t('admin.system_platform_name')}
                  </label>
                  <Input
                    value={platform.name}
                    onChange={(e) => setPlatform({ ...platform, name: e.target.value })}
                    className="max-w-md"
                  />
                </div>

                <div className="flex items-center justify-between max-w-md rounded-lg border border-border/30 p-4">
                  <div>
                    <p className="text-sm font-nunito font-medium text-foreground">
                      {t('admin.system_registration_enabled')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.system_registration_description')}
                    </p>
                  </div>
                  <Switch
                    checked={platform.registration_enabled}
                    onCheckedChange={(checked) =>
                      setPlatform({ ...platform, registration_enabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between max-w-md rounded-lg border border-border/30 p-4">
                  <div>
                    <p className="text-sm font-nunito font-medium text-foreground">
                      {t('admin.system_maintenance_mode')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.system_maintenance_description')}
                    </p>
                  </div>
                  <Switch
                    checked={platform.maintenance_mode}
                    onCheckedChange={(checked) =>
                      setPlatform({ ...platform, maintenance_mode: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Planos */}
          <TabsContent value="plans">
            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-6 space-y-6">
              <h2 className="text-lg font-poppins font-semibold text-foreground">
                {t('admin.system_plan_limits_title')}
              </h2>

              <div className="grid gap-6">
                {(['free', 'professor', 'institution'] as const).map((plan) => {
                  const colors = {
                    free: 'border-gray-500/30',
                    professor: 'border-blue-500/30',
                    institution: 'border-purple-500/30',
                  };
                  const labels = {
                    free: 'Free',
                    professor: 'Professor',
                    institution: 'Institution',
                  };
                  return (
                    <div
                      key={plan}
                      className={`rounded-lg border ${colors[plan]} p-4 space-y-4`}
                    >
                      <h3 className="font-poppins font-semibold text-foreground">
                        {labels[plan]}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-nunito font-medium text-foreground">
                            {t('admin.system_projects_limit')}
                          </label>
                          <Input
                            type="number"
                            min={0}
                            value={plans[plan].projects_limit}
                            onChange={(e) =>
                              setPlans({
                                ...plans,
                                [plan]: {
                                  ...plans[plan],
                                  projects_limit: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-nunito font-medium text-foreground">
                            {t('admin.system_storage_limit')}
                          </label>
                          <Input
                            type="number"
                            min={0}
                            value={plans[plan].storage_limit_mb}
                            onChange={(e) =>
                              setPlans({
                                ...plans,
                                [plan]: {
                                  ...plans[plan],
                                  storage_limit_mb: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Seguranca */}
          <TabsContent value="security">
            <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur p-6 space-y-6">
              <h2 className="text-lg font-poppins font-semibold text-foreground">{t('admin.system_security_title')}</h2>

              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm font-nunito font-medium text-foreground">
                    {t('admin.system_min_password_length')}
                  </label>
                  <Input
                    type="number"
                    min={4}
                    max={32}
                    value={security.min_password_length}
                    onChange={(e) =>
                      setSecurity({
                        ...security,
                        min_password_length: parseInt(e.target.value) || 8,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('admin.system_min_password_description')}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-nunito font-medium text-foreground">
                    {t('admin.system_session_timeout')}
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={720}
                    value={security.session_timeout_hours}
                    onChange={(e) =>
                      setSecurity({
                        ...security,
                        session_timeout_hours: parseInt(e.target.value) || 24,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('admin.system_session_timeout_description')}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
