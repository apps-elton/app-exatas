import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  Lock,
  CreditCard,
  Shield,
  Save,
  Check,
  Crown,
  Box,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, profile, subscription } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'plan'>('profile');

  // Profile form
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Password form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const plan = subscription?.plan ?? 'free';

  const PLAN_DETAILS = {
    free: {
      name: t('settings.plan_free_name'),
      price: t('settings.plan_free_price'),
      color: 'text-muted-foreground',
      features: [
        t('settings.plan_free_feature_1'),
        t('settings.plan_free_feature_2'),
        t('settings.plan_free_feature_3'),
      ],
    },
    professor: {
      name: t('settings.plan_professor_name'),
      price: t('settings.plan_professor_price'),
      color: 'text-primary',
      features: [
        t('settings.plan_professor_feature_1'),
        t('settings.plan_professor_feature_2'),
        t('settings.plan_professor_feature_3'),
        t('settings.plan_professor_feature_4'),
      ],
    },
    institution: {
      name: t('settings.plan_institution_name'),
      price: t('settings.plan_institution_price'),
      color: 'text-accent',
      features: [
        t('settings.plan_institution_feature_1'),
        t('settings.plan_institution_feature_2'),
        t('settings.plan_institution_feature_3'),
        t('settings.plan_institution_feature_4'),
        t('settings.plan_institution_feature_5'),
      ],
    },
  };

  const planDetails = PLAN_DETAILS[plan];

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    if (error) {
      toast.error(t('settings.save_profile_error'));
    } else {
      toast.success(t('settings.save_profile_success'));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error(t('settings.password_min_error'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('settings.password_mismatch_error'));
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error(t('settings.change_password_error'));
    } else {
      toast.success(t('settings.change_password_success'));
      setNewPassword('');
      setConfirmPassword('');
    }
    setChangingPassword(false);
  };

  const tabs = [
    { id: 'profile' as const, label: t('settings.tab_profile'), icon: User },
    { id: 'security' as const, label: t('settings.tab_security'), icon: Lock },
    { id: 'plan' as const, label: t('settings.tab_plan'), icon: CreditCard },
  ];

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="border-b border-border/30 bg-background/95 backdrop-blur px-6 py-4">
          <h1 className="text-2xl font-bold font-poppins text-foreground">{t('settings.title')}</h1>
          <p className="text-sm text-muted-foreground font-nunito mt-1">
            {t('settings.subtitle')}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-4 md:p-6">
            {/* Tabs */}
            <div className="flex flex-col md:flex-row gap-1 bg-muted/30 rounded-lg p-1 mb-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-poppins transition-colors ${
                      activeTab === tab.id
                        ? 'bg-background text-foreground shadow-sm font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border/30 bg-card p-6">
                  <h2 className="text-lg font-poppins font-semibold text-foreground mb-4">
                    {t('settings.personal_info')}
                  </h2>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-poppins font-semibold text-foreground">{profile?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{profile?.email}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Shield className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground capitalize">{profile?.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-poppins text-sm">{t('auth.full_name')}</Label>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-background border-border/50 font-nunito"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-poppins text-sm">{t('auth.email')}</Label>
                      <Input
                        value={profile?.email ?? ''}
                        disabled
                        className="bg-muted/30 border-border/50 font-nunito"
                      />
                      <p className="text-xs text-muted-foreground">{t('settings.email_readonly')}</p>
                    </div>

                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving || fullName === profile?.full_name}
                      className="gap-2 font-poppins"
                    >
                      {saved ? (
                        <><Check className="w-4 h-4" /> {t('settings.saved')}</>
                      ) : (
                        <><Save className="w-4 h-4" /> {saving ? t('settings.saving') : t('settings.save_changes')}</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border/30 bg-card p-6">
                  <h2 className="text-lg font-poppins font-semibold text-foreground mb-4">
                    {t('settings.change_password')}
                  </h2>

                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label className="font-poppins text-sm">{t('auth.new_password')}</Label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('auth.new_password_placeholder')}
                        className="bg-background border-border/50 font-nunito"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-poppins text-sm">{t('auth.confirm_new_password')}</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('auth.repeat_new_password_placeholder')}
                        className="bg-background border-border/50 font-nunito"
                      />
                    </div>

                    <Button
                      onClick={handleChangePassword}
                      disabled={changingPassword || !newPassword || !confirmPassword}
                      className="gap-2 font-poppins"
                    >
                      <Lock className="w-4 h-4" />
                      {changingPassword ? t('settings.changing_password') : t('settings.change_password_button')}
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-border/30 bg-card p-6">
                  <h2 className="text-lg font-poppins font-semibold text-foreground mb-2">
                    {t('settings.active_session')}
                  </h2>
                  <p className="text-sm text-muted-foreground font-nunito mb-4">
                    {t('settings.logged_since', { date: new Date(profile?.created_at ?? '').toLocaleDateString(i18n.language) })}
                  </p>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-sm font-nunito text-foreground">{t('settings.current_browser')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Plan Tab */}
            {activeTab === 'plan' && (
              <div className="space-y-6">
                {/* Current plan */}
                <div className="rounded-xl border border-border/30 bg-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-poppins font-semibold text-foreground">
                      {t('settings.current_plan')}
                    </h2>
                    {plan !== 'free' && <Crown className="w-5 h-5 text-amber-400" />}
                  </div>

                  <div className="flex items-baseline gap-3 mb-4">
                    <span className={`text-3xl font-bold font-poppins ${planDetails.color}`}>
                      {planDetails.name}
                    </span>
                    <span className="text-muted-foreground font-nunito">{planDetails.price}</span>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {planDetails.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm font-nunito">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {subscription && (
                    <div className="pt-4 border-t border-border/30 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-nunito">{t('settings.projects_used')}</span>
                        <span className="font-poppins font-semibold text-foreground">
                          — / {subscription.projects_limit}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-nunito">{t('settings.storage')}</span>
                        <span className="font-poppins font-semibold text-foreground">
                          — / {subscription.storage_limit_mb}MB
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* All plans */}
                <h3 className="text-lg font-poppins font-semibold text-foreground">{t('settings.all_plans')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(Object.entries(PLAN_DETAILS) as [keyof typeof PLAN_DETAILS, typeof PLAN_DETAILS[keyof typeof PLAN_DETAILS]][]).map(
                    ([key, details]) => (
                      <div
                        key={key}
                        className={`rounded-xl border p-5 ${
                          key === plan
                            ? 'border-primary bg-primary/5'
                            : 'border-border/30 bg-card'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-poppins font-bold ${details.color}`}>{details.name}</h4>
                          {key === plan && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded font-poppins">
                              {t('settings.current_badge')}
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-bold font-poppins text-foreground mb-3">
                          {details.price}
                        </p>
                        <ul className="space-y-1.5">
                          {details.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs font-nunito text-muted-foreground">
                              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        {key !== plan && key !== 'free' && (
                          <Button size="sm" variant="outline" className="w-full mt-4 font-poppins" disabled>
                            {t('common.coming_soon')}
                          </Button>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
