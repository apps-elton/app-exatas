import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, LogIn, Box, Shield, School, GraduationCap, Wrench } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';

const TEST_ACCOUNTS = [
  {
    labelKey: 'login.dev_superadmin',
    descriptionKey: 'login.dev_superadmin_desc',
    email: 'superadmin@geoteach.dev',
    password: 'GeoTeach@2026',
    role: 'superadmin' as const,
    icon: Shield,
    color: 'text-red-400 border-red-400/30 hover:bg-red-400/10',
  },
  {
    labelKey: 'login.dev_school_admin',
    descriptionKey: 'login.dev_school_admin_desc',
    email: 'admin@escola-teste.dev',
    password: 'GeoTeach@2026',
    role: 'admin' as const,
    icon: School,
    color: 'text-amber-400 border-amber-400/30 hover:bg-amber-400/10',
  },
  {
    labelKey: 'login.dev_teacher',
    descriptionKey: 'login.dev_teacher_desc',
    email: 'professor@geoteach.dev',
    password: 'GeoTeach@2026',
    role: 'teacher' as const,
    icon: GraduationCap,
    color: 'text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10',
  },
];

export default function Login() {
  const { t } = useTranslation();
  const { signIn, signOut, resetPassword, session, profile, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [devMessage, setDevMessage] = useState('');

  if (loading) return null;
  if (session && !submitting) {
    // Wait for profile to load from database before redirecting
    if (!profile) return null;
    // Redirect based on role from database profile (not user_metadata)
    if (profile.role === 'superadmin') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  const quickLogin = async (account: typeof TEST_ACCOUNTS[number]) => {
    setError('');
    setDevMessage('');
    setSubmitting(true);

    // Always sign out first and wait for state to clear
    await supabase.auth.signOut();
    // Wait for auth state to fully clear
    await new Promise(r => setTimeout(r, 500));

    // Try to sign in
    const { error: signInError } = await signIn(account.email, account.password);

    if (signInError) {
      // User doesn't exist yet — create it
      const label = t(account.labelKey);
      setDevMessage(t('login.dev_creating_account', { label }));

      const { error: signUpError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: { full_name: label, role: account.role },
        },
      });

      if (signUpError) {
        setError(t('login.dev_create_error', { label, message: signUpError.message }));
        setSubmitting(false);
        return;
      }

      // Wait for the trigger to create the profile
      await new Promise(r => setTimeout(r, 1000));

      // Try signing in again
      const { error: retryError } = await signIn(account.email, account.password);
      if (retryError) {
        setDevMessage(t('login.dev_account_created_verify'));
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error } = await signIn(email, password);
    if (error) {
      setError(
        error.includes('Invalid login')
          ? t('login.invalid_credentials')
          : error
      );
    }
    setSubmitting(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error } = await resetPassword(email);
    if (error) {
      setError(error);
    } else {
      setResetSent(true);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex bg-background relative">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </div>
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/10 to-background">
        <div className="relative z-10 text-center px-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Box className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-5xl font-bold font-poppins text-foreground mb-4">
            GeoTeach
          </h1>
          <p className="text-xl text-muted-foreground font-nunito max-w-md">
            {t('login.hero_subtitle')}
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-sm mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary font-poppins">20+</div>
              <div className="text-xs text-muted-foreground mt-1">{t('login.hero_solids')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent font-poppins">15+</div>
              <div className="text-xs text-muted-foreground mt-1">{t('login.hero_tools')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary font-poppins">2</div>
              <div className="text-xs text-muted-foreground mt-1">{t('login.hero_languages')}</div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-32 h-32 border border-primary/20 rounded-full" />
        <div className="absolute bottom-32 right-16 w-48 h-48 border border-secondary/15 rounded-full" />
        <div className="absolute top-1/3 right-24 w-20 h-20 border border-accent/20 rotate-45" />
      </div>

      {/* Right side - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Box className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-bold font-poppins text-foreground">GeoTeach</h1>
          </div>

          {mode === 'login' ? (
            <>
              <h2 className="text-2xl font-bold font-poppins text-foreground mb-2">
                {t('login.title')}
              </h2>
              <p className="text-muted-foreground font-nunito mb-8">
                {t('login.subtitle')}
              </p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-poppins text-sm">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.email_placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-card border-border/50 font-nunito"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-poppins text-sm">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.password_placeholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 bg-card border-border/50 font-nunito pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-nunito">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 font-poppins font-semibold text-base gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogIn className="w-5 h-5" />
                  )}
                  {submitting ? t('login.submitting') : t('login.submit')}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => { setMode('reset'); setError(''); }}
                  className="text-sm text-primary hover:underline font-nunito"
                >
                  {t('login.forgot_password')}
                </button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-muted-foreground font-nunito text-sm">
                  {t('login.no_account')}{' '}
                  <Link to="/signup" className="text-primary font-semibold hover:underline">
                    {t('login.create_free_account')}
                  </Link>
                </p>
              </div>

              {/* DEV PANEL - Acesso rápido para testes (só em dev) */}
              {import.meta.env.DEV && <div className="mt-8 border border-dashed border-muted-foreground/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-poppins font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('login.dev_panel_title')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/70 font-nunito mb-3">
                  {t('login.dev_panel_description')}
                </p>
                <div className="space-y-2">
                  {TEST_ACCOUNTS.map((account) => {
                    const Icon = account.icon;
                    return (
                      <button
                        key={account.email}
                        onClick={() => quickLogin(account)}
                        disabled={submitting}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${account.color}`}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        <div className="text-left">
                          <div className="text-sm font-poppins font-semibold">{t(account.labelKey)}</div>
                          <div className="text-xs text-muted-foreground">{t(account.descriptionKey)} — {account.email}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {devMessage && (
                  <div className="mt-3 p-2 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-nunito">
                    {devMessage}
                  </div>
                )}
              </div>}
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold font-poppins text-foreground mb-2">
                {t('login.reset_title')}
              </h2>
              <p className="text-muted-foreground font-nunito mb-8">
                {t('login.reset_subtitle')}
              </p>

              {resetSent ? (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-foreground font-nunito">
                  <p className="font-semibold mb-1">{t('login.reset_sent_title')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('login.reset_sent_description')}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="font-poppins text-sm">{t('auth.email')}</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder={t('auth.email_placeholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-card border-border/50 font-nunito"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-nunito">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 font-poppins font-semibold text-base"
                  >
                    {submitting ? t('login.reset_submitting') : t('login.reset_submit')}
                  </Button>
                </form>
              )}

              <div className="mt-4 text-center">
                <button
                  onClick={() => { setMode('login'); setError(''); setResetSent(false); }}
                  className="text-sm text-primary hover:underline font-nunito"
                >
                  {t('login.reset_back_to_login')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
