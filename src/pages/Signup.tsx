import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, UserPlus, Box, Check } from 'lucide-react';

export default function Signup() {
  const { signUp, session, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  const passwordChecks = {
    length: password.length >= 6,
    match: password === confirmPassword && confirmPassword.length > 0,
  };

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

    setSubmitting(true);
    const { error } = await signUp(email, password, fullName);
    if (error) {
      setError(
        error.includes('already registered')
          ? 'Este email já está cadastrado'
          : error
      );
    } else {
      setSuccess(true);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
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

          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold font-poppins text-foreground mb-2">
                Conta criada!
              </h2>
              <p className="text-muted-foreground font-nunito mb-6">
                Verifique seu email para confirmar sua conta. Depois é só fazer login.
              </p>
              <Link to="/login">
                <Button className="h-12 px-8 font-poppins font-semibold">
                  Ir para o login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold font-poppins text-foreground mb-2">
                Criar conta
              </h2>
              <p className="text-muted-foreground font-nunito mb-8">
                Comece a usar o GeoTeach gratuitamente
              </p>

              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-poppins text-sm">Nome completo</Label>
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
                  {submitting ? 'Criando conta...' : 'Criar conta grátis'}
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
