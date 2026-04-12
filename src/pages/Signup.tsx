import { useState, useEffect } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, UserPlus, Box, Check, GraduationCap, School } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';

type AccountType = 'teacher' | 'school' | null;

interface InviteData {
  id: string;
  tenant_id: string;
  role: string;
  tenant_name: string;
}

export default function Signup() {
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
        setInviteError('Convite inválido, expirado ou já utilizado.');
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

    if (!passwordChecks.length) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (!passwordChecks.match) {
      setError('As senhas não coincidem');
      return;
    }
    if (accountType === 'school' && !schoolName.trim()) {
      setError('Informe o nome da escola');
      return;
    }

    setSubmitting(true);

    try {
      const role = inviteData ? inviteData.role : accountType === 'school' ? 'admin' : 'teacher';

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
            ? 'Este email já está cadastrado'
            : signUpError.message
        );
        setSubmitting(false);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setError('Erro ao criar conta. Tente novamente.');
        setSubmitting(false);
        return;
      }

      // Wait for trigger to create profile
      await new Promise(r => setTimeout(r, 1000));

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
          setError('Erro ao criar escola: ' + rpcError.message);
          setSubmitting(false);
          return;
        }
      }

      // 3. If invite, use RPC to accept invite atomically
      if (inviteData) {
        const { error: rpcError } = await supabase.rpc('accept_invite', {
          invite_token: inviteToken,
        });

        if (rpcError) {
          setError('Erro ao aceitar convite: ' + rpcError.message);
          setSubmitting(false);
          return;
        }
      }

      // Sign out so user goes through login flow
      await supabase.auth.signOut();

      setSuccess(true);
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    }
    setSubmitting(false);
  };

  // Invite loading state
  if (inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-poppins">Verificando convite...</p>
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
            Comece grátis e explore geometria 3D como nunca antes
          </p>
          <div className="mt-12 space-y-4 text-left max-w-sm mx-auto">
            {[
              'Visualize 20+ sólidos geométricos em 3D',
              'Use mesa digitalizadora com sensibilidade à pressão',
              'Crie cortes, planificações e construções geométricas',
              'Salve e compartilhe seus projetos',
            ].map((item, i) => (
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
                Convite inválido
              </h2>
              <p className="text-muted-foreground font-nunito mb-6">{inviteError}</p>
              <Link to="/signup">
                <Button variant="outline" className="h-12 px-8 font-poppins font-semibold">
                  Criar conta sem convite
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
                Conta criada!
              </h2>
              <p className="text-muted-foreground font-nunito mb-6">
                {accountType === 'school'
                  ? `Sua escola "${schoolName}" foi cadastrada. Verifique seu email e faça login.`
                  : inviteData
                  ? `Você foi adicionado à ${inviteData.tenant_name}. Verifique seu email e faça login.`
                  : 'Verifique seu email para confirmar sua conta. Depois é só fazer login.'}
              </p>
              <Link to="/login">
                <Button className="h-12 px-8 font-poppins font-semibold">
                  Ir para o login
                </Button>
              </Link>
            </div>
          )}

          {/* Account type selection */}
          {!success && !inviteError && !accountType && (
            <>
              <h2 className="text-2xl font-bold font-poppins text-foreground mb-2">
                Criar conta
              </h2>
              <p className="text-muted-foreground font-nunito mb-8">
                Como você quer usar o GeoTeach?
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
                    <p className="font-poppins font-semibold text-foreground">Sou Professor</p>
                    <p className="text-sm text-muted-foreground font-nunito">
                      Conta individual gratuita para usar geometria 3D
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
                    <p className="font-poppins font-semibold text-foreground">Sou Escola</p>
                    <p className="text-sm text-muted-foreground font-nunito">
                      Cadastre sua escola e convide professores
                    </p>
                  </div>
                </button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-muted-foreground font-nunito text-sm">
                  Já tem conta?{' '}
                  <Link to="/login" className="text-primary font-semibold hover:underline">
                    Fazer login
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
                    &larr; Voltar
                  </button>
                )}
              </div>

              <h2 className="text-2xl font-bold font-poppins text-foreground mb-2">
                {inviteData
                  ? `Convite para ${inviteData.tenant_name}`
                  : accountType === 'school'
                  ? 'Cadastrar Escola'
                  : 'Criar conta de Professor'}
              </h2>
              <p className="text-muted-foreground font-nunito mb-8">
                {inviteData
                  ? `Crie sua conta para acessar a ${inviteData.tenant_name}`
                  : accountType === 'school'
                  ? 'Você será o administrador da escola'
                  : 'Conta individual gratuita'}
              </p>

              <form onSubmit={handleSignup} className="space-y-5">
                {/* School name (only for school signup) */}
                {accountType === 'school' && !inviteData && (
                  <div className="space-y-2">
                    <Label htmlFor="school" className="font-poppins text-sm">Nome da Escola</Label>
                    <Input
                      id="school"
                      type="text"
                      placeholder="Ex: Colégio São Paulo"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      required
                      className="h-12 bg-card border-border/50 font-nunito"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name" className="font-poppins text-sm">
                    {accountType === 'school' ? 'Seu nome (administrador)' : 'Nome completo'}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-12 bg-card border-border/50 font-nunito"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-poppins text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-card border-border/50 font-nunito"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-poppins text-sm">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
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
                        6+ caracteres
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="font-poppins text-sm">Confirmar senha</Label>
                  <Input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 bg-card border-border/50 font-nunito"
                  />
                  {confirmPassword.length > 0 && (
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <div className={`w-2 h-2 rounded-full ${passwordChecks.match ? 'bg-green-500' : 'bg-destructive'}`} />
                      <span className={passwordChecks.match ? 'text-green-500' : 'text-destructive'}>
                        {passwordChecks.match ? 'Senhas coincidem' : 'Senhas não coincidem'}
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
                    ? 'Criando...'
                    : accountType === 'school'
                    ? 'Cadastrar Escola'
                    : 'Criar conta grátis'}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-muted-foreground font-nunito text-sm">
                  Já tem conta?{' '}
                  <Link to="/login" className="text-primary font-semibold hover:underline">
                    Fazer login
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
