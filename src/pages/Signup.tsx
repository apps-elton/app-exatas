import { useState, useEffect } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, UserPlus, Box, Check, GraduationCap, School, BookOpen } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { validateSignupInput } from '@/lib/signup-validation';
import { sendEmail } from '@/lib/email';

type AccountType = 'teacher' | 'school' | 'student' | null;

interface InviteData {
  id: string;
  tenant_id: string;
  role: string;
  tenant_name: string;
}

async function waitForProfile(userId: string, timeoutMs = 3000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { data } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
    if (data) return true;
    await new Promise(r => setTimeout(r, 200));
  }
  return false;
}

export default function Signup() {
  const { t } = useTranslation();
  const { session, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const [accountType, setAccountType] = useState<AccountType>(inviteToken ? 'teacher' : null);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);
  const [inviteError, setInviteError] = useState('');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate invite token
  useEffect(() => {
    if (!inviteToken) return;
    (async () => {
      setInviteLoading(true);
      const { data, error } = await supabase
        .from('tenant_invites')
        .select('id, tenant_id, role, tenants(name)')
        .eq('token', inviteToken)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        setInviteError(t('signup.invite_invalid_message'));
        setInviteLoading(false);
        return;
      }

      const tenantName = (data as any).tenants?.name ?? 'Escola';
      setInviteData({
        id: data.id,
        tenant_id: data.tenant_id,
        role: data.role,
        tenant_name: tenantName,
      });
      setInviteLoading(false);
    })();
  }, [inviteToken]);

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  const passwordChecks = {
    length: password.length >= 6,
    match: password === confirmPassword && confirmPassword.length > 0,
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = validateSignupInput({
      accountType: accountType!,
      fullName,
      email,
      password,
      confirmPassword,
      schoolName,
    });
    if (!validation.ok) {
      setError(t(validation.errorKey));
      return;
    }

    setSubmitting(true);

    try {
      const role = inviteData
        ? inviteData.role
        : accountType === 'school'
          ? 'admin'
          : accountType === 'student'
            ? 'student'
            : 'teacher';

      // 1. Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      });

      if (signUpError) {
        setError(
          signUpError.message.includes('already registered')
            ? t('signup.error_already_registered')
            : signUpError.message
        );
        setSubmitting(false);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setError(t('signup.error_create_account'));
        setSubmitting(false);
        return;
      }

      // Wait for trigger to create profile (poll instead of fixed delay)
      const profileReady = await waitForProfile(userId);
      if (!profileReady) {
        setError(t('signup.error_create_account'));
        setSubmitting(false);
        await supabase.auth.signOut();
        return;
      }

      // Sign in to get a session (needed for RPC calls)
      await supabase.auth.signInWithPassword({ email, password });

      // 2. If school signup, use RPC to create tenant atomically
      if (accountType === 'school' && !inviteData) {
        const slug = generateSlug(schoolName) + '-' + Date.now().toString(36);
        const { error: rpcError } = await supabase.rpc('create_school_and_link_admin', {
          school_name: schoolName,
          school_slug: slug,
        });

        if (rpcError) {
          setError(t('signup.error_create_school', { message: rpcError.message }));
          setSubmitting(false);
          await supabase.auth.signOut();
          return;
        }
      }

      // 3. If invite, use RPC to accept invite atomically
      if (inviteData) {
        const { error: rpcError } = await supabase.rpc('accept_invite', {
          invite_token: inviteToken,
        });

        if (rpcError) {
          setError(t('signup.error_accept_invite', { message: rpcError.message }));
          setSubmitting(false);
          await supabase.auth.signOut();
          return;
        }
      }

      // 4. If student signup, finalize via RPC
      if (accountType === 'student' && !inviteData) {
        const { error: rpcError } = await supabase.rpc('create_student_account');
        if (rpcError) {
          setError(t('signup.error_create_student', { message: rpcError.message }));
          setSubmitting(false);
          await supabase.auth.signOut();
          return;
        }
      }

      // 5. Send welcome email (fire-and-forget; failures must not block UX).
      // Must run while the session is still active (Edge Function requires JWT).
      if (!inviteData) {
        const welcomeTemplate =
          accountType === 'school'
            ? 'welcome_school'
            : accountType === 'student'
              ? 'welcome_student'
              : 'welcome_teacher';
        sendEmail({
          template: welcomeTemplate,
          to: email,
          data: {
            name: fullName,
            ...(accountType === 'school' ? { schoolName } : {}),
          },
        }).catch(() => {
          // Silently swallow — welcome email is nice-to-have, not critical.
        });
      }

      // Sign out so user goes through login flow
      await supabase.auth.signOut();

      setSuccess(true);
    } catch (err) {
      setError(t('signup.error_unexpected'));
    }
    setSubmitting(false);
  };

  // Invite loading state
  if (inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-poppins">{t('signup.invite_loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background relative">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </div>
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-gradient-to-br from-secondary/20 via-primary/10 to-background">
        <div className="relative z-10 text-center px-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Box className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-5xl font-bold font-poppins text-foreground mb-4">
            GeoTeach
          </h1>
          <p className="text-xl text-muted-foreground font-nunito max-w-md">
            {t('signup.hero_subtitle')}
          </p>
          <div className="mt-12 space-y-4 text-left max-w-sm mx-auto">
            {([
              t('signup.hero_feature_1'),
              t('signup.hero_feature_2'),
              t('signup.hero_feature_3'),
              t('signup.hero_feature_4'),
            ]).map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <span className="text-muted-foreground font-nunito text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-20 left-16 w-40 h-40 border border-primary/15 rounded-full" />
        <div className="absolute top-24 right-20 w-28 h-28 border border-secondary/20 rounded-full" />
      </div>

      {/* Right side - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Box className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-bold font-poppins text-foreground">GeoTeach</h1>
          </div>

          {/* Invite error */}
          {inviteError && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">!</span>
              </div>
              <h2 className="text-2xl font-bold font-poppins text-foreground mb-2">
                {t('signup.invite_invalid_title')}
              </h2>
              <p className="text-muted-foreground font-nunito mb-6">{inviteError}</p>
              <Link to="/signup">
                <Button variant="outline" className="h-12 px-8 font-poppins font-semibold">
                  {t('signup.invite_create_without')}
                </Button>
              </Link>
            </div>
          )}

          {/* Success */}
          {success && !inviteError && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold font-poppins text-foreground mb-2">
                {t('signup.success_title')}
              </h2>
              <p className="text-muted-foreground font-nunito mb-6">
                {accountType === 'school'
                  ? t('signup.success_school', { schoolName })
                  : accountType === 'student'
                    ? t('signup.success_student')
                    : inviteData
                      ? t('signup.success_invite', { tenant: inviteData.tenant_name })
                      : t('signup.success_default')}
              </p>
              <Link to="/login">
                <Button className="h-12 px-8 font-poppins font-semibold">
                  {t('signup.go_to_login_button')}
                </Button>
              </Link>
            </div>
          )}

          {/* Account type selection */}
          {!success && !inviteError && !accountType && (
            <>
              <h2 className="text-2xl font-bold font-poppins text-foreground mb-2">
                {t('signup.title')}
              </h2>
              <p className="text-muted-foreground font-nunito mb-8">
                {t('signup.subtitle')}
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => setAccountType('teacher')}
                  className="w-full flex items-center gap-4 p-5 rounded-xl border border-border/50 hover:border-emerald-400/50 hover:bg-emerald-400/5 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-400/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-poppins font-semibold text-foreground">{t('signup.teacher_title')}</p>
                    <p className="text-sm text-muted-foreground font-nunito">
                      {t('signup.teacher_description')}
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setAccountType('school')}
                  className="w-full flex items-center gap-4 p-5 rounded-xl border border-border/50 hover:border-amber-400/50 hover:bg-amber-400/5 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-400/10 flex items-center justify-center shrink-0">
                    <School className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-poppins font-semibold text-foreground">{t('signup.school_title')}</p>
                    <p className="text-sm text-muted-foreground font-nunito">
                      {t('signup.school_description')}
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setAccountType('student')}
                  className="w-full flex items-center gap-4 p-5 rounded-xl border border-border/50 hover:border-sky-400/50 hover:bg-sky-400/5 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-sky-400/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-sky-400" />
                  </div>
                  <div>
                    <p className="font-poppins font-semibold text-foreground">{t('signup.student_title')}</p>
                    <p className="text-sm text-muted-foreground font-nunito">
                      {t('signup.student_description')}
                    </p>
                  </div>
                </button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-muted-foreground font-nunito text-sm">
                  {t('signup.already_have_account')}{' '}
                  <Link to="/login" className="text-primary font-semibold hover:underline">
                    {t('signup.go_to_login')}
                  </Link>
                </p>
              </div>
            </>
          )}

          {/* Signup form */}
          {!success && !inviteError && accountType && (
            <>
              <div className="flex items-center gap-2 mb-6">
                {!inviteData && (
                  <button
                    onClick={() => setAccountType(null)}
                    className="text-sm text-muted-foreground hover:text-foreground font-nunito"
                  >
                    {t('signup.back')}
                  </button>
                )}
              </div>

              <h2 className="text-2xl font-bold font-poppins text-foreground mb-2">
                {inviteData
                  ? t('signup.invite_for_tenant', { tenant: inviteData.tenant_name })
                  : accountType === 'school'
                    ? t('signup.school_register_title')
                    : accountType === 'student'
                      ? t('signup.student_register_title')
                      : t('signup.teacher_register_title')}
              </h2>
              <p className="text-muted-foreground font-nunito mb-8">
                {inviteData
                  ? t('signup.invite_create_to_access', { tenant: inviteData.tenant_name })
                  : accountType === 'school'
                    ? t('signup.school_admin_subtitle')
                    : accountType === 'student'
                      ? t('signup.student_subtitle')
                      : t('signup.teacher_free_subtitle')}
              </p>

              <form onSubmit={handleSignup} className="space-y-5">
                {/* School name (only for school signup) */}
                {accountType === 'school' && !inviteData && (
                  <div className="space-y-2">
                    <Label htmlFor="school" className="font-poppins text-sm">{t('signup.school_name_label')}</Label>
                    <Input
                      id="school"
                      type="text"
                      placeholder={t('signup.school_name_placeholder')}
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      required
                      className="h-12 bg-card border-border/50 font-nunito"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name" className="font-poppins text-sm">
                    {accountType === 'school' ? t('signup.admin_name_label') : t('auth.full_name')}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t('auth.full_name_placeholder')}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-12 bg-card border-border/50 font-nunito"
                  />
                </div>

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
                      placeholder={t('auth.new_password_placeholder')}
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
                  {password.length > 0 && (
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <div className={`w-2 h-2 rounded-full ${passwordChecks.length ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                      <span className={passwordChecks.length ? 'text-green-500' : 'text-muted-foreground'}>
                        {t('auth.min_chars')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="font-poppins text-sm">{t('auth.confirm_password')}</Label>
                  <Input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.confirm_password_placeholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 bg-card border-border/50 font-nunito"
                  />
                  {confirmPassword.length > 0 && (
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <div className={`w-2 h-2 rounded-full ${passwordChecks.match ? 'bg-green-500' : 'bg-destructive'}`} />
                      <span className={passwordChecks.match ? 'text-green-500' : 'text-destructive'}>
                        {passwordChecks.match ? t('auth.passwords_match') : t('auth.passwords_dont_match')}
                      </span>
                    </div>
                  )}
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
                    <UserPlus className="w-5 h-5" />
                  )}
                  {submitting
                    ? t('signup.submitting')
                    : accountType === 'school'
                      ? t('signup.submit_school')
                      : accountType === 'student'
                        ? t('signup.submit_student')
                        : t('signup.submit_teacher')}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-muted-foreground font-nunito text-sm">
                  {t('signup.already_have_account')}{' '}
                  <Link to="/login" className="text-primary font-semibold hover:underline">
                    {t('signup.go_to_login')}
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
