import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { sendEmail } from '@/lib/email';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  Trash2,
  Search,
  Loader2,
  Link as LinkIcon,
  Clock,
} from 'lucide-react';

interface TenantUser {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface Invite {
  id: string;
  token: string;
  email: string | null;
  role: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export default function SchoolUsers() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  const fetchData = useCallback(async () => {
    if (!profile?.tenant_id) return;
    setLoading(true);

    const [usersRes, invitesRes, tenantRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, role, is_active, created_at')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: true }),
      supabase
        .from('tenant_invites')
        .select('id, token, email, role, expires_at, used_at, created_at')
        .eq('tenant_id', profile.tenant_id)
        .is('used_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('tenants')
        .select('name')
        .eq('id', profile.tenant_id)
        .single(),
    ]);

    setUsers(usersRes.data ?? []);
    setInvites(invitesRes.data ?? []);
    setTenantName(tenantRes.data?.name ?? t('school.default_name'));
    setLoading(false);
  }, [profile?.tenant_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createInvite = async () => {
    if (!profile?.tenant_id || !profile?.id) return;
    setCreating(true);

    const trimmedEmail = inviteEmail.trim();
    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    const emailToStore = emailIsValid ? trimmedEmail : null;

    const { data: inserted, error } = await supabase
      .from('tenant_invites')
      .insert({
        tenant_id: profile.tenant_id,
        created_by: profile.id,
        role: 'teacher' as any,
        ...(emailToStore ? { email: emailToStore } : {}),
      })
      .select()
      .single();

    if (!error) {
      if (emailToStore && inserted?.token) {
        sendEmail({
          template: 'invite',
          to: emailToStore,
          data: {
            tenantName,
            inviterName: profile?.full_name ?? 'Administrador',
            inviteToken: inserted.token,
          },
        }).catch(() => {
          // Non-blocking — invite is created even if email fails
        });
        toast.success(t('school.invite_sent_with_email', { email: emailToStore }));
      } else {
        toast.success(t('school.invite_created_no_email'));
      }
      setInviteEmail('');
      await fetchData();
    }
    setCreating(false);
  };

  const revokeInvite = async (id: string) => {
    await supabase.from('tenant_invites').delete().eq('id', id);
    await fetchData();
  };

  const toggleUserActive = async (userId: string, currentActive: boolean) => {
    if (userId === profile?.id) return; // Can't deactivate yourself
    await supabase.from('profiles').update({ is_active: !currentActive }).eq('id', userId);
    await fetchData();
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/signup?invite=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const filteredUsers = users.filter(
    u =>
      (u.full_name?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-poppins font-bold text-foreground">
              {t('school.title', { name: tenantName })}
            </h1>
            <p className="text-sm font-nunito text-muted-foreground">
              {t('school.subtitle')}
            </p>
          </div>
          <div className="flex flex-col gap-1 md:min-w-[340px]">
            <div className="flex items-center gap-2">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={t('school.invite_email_placeholder')}
                className="h-9 font-nunito"
                disabled={creating}
              />
              <Button onClick={createInvite} disabled={creating} className="gap-2 font-poppins shrink-0">
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {t('school.generate_invite')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground font-nunito">
              {t('school.invite_email_helper')}
            </p>
          </div>
        </div>

        {/* Pending invites */}
        {invites.length > 0 && (
          <div className="bg-card border border-border/30 rounded-xl p-5">
            <h2 className="text-lg font-poppins font-semibold text-foreground mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              {t('school.pending_invites')}
            </h2>
            <div className="space-y-3">
              {invites.map(invite => (
                <div
                  key={invite.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isExpired(invite.expires_at)
                      ? 'border-destructive/20 bg-destructive/5'
                      : 'border-border/30 bg-muted/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Clock className={`w-4 h-4 ${isExpired(invite.expires_at) ? 'text-destructive' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="text-sm font-nunito text-foreground">
                        {t('school.invite_for_role', { role: invite.role })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isExpired(invite.expires_at)
                          ? t('school.invite_expired')
                          : t('school.invite_expires_at', { date: new Date(invite.expires_at).toLocaleDateString('pt-BR') })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isExpired(invite.expires_at) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyInviteLink(invite.token)}
                        className="gap-1.5 text-xs"
                      >
                        {copiedToken === invite.token ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-500" />
                            {t('school.copied')}
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            {t('school.copy_link')}
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeInvite(invite.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users list */}
        <div className="bg-card border border-border/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-poppins font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {t('school.members', { count: users.length })}
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('school.search_placeholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 font-nunito"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 font-nunito">
              {t('school.no_members_found')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-nunito">
                <thead>
                  <tr className="border-b border-border/30 text-muted-foreground">
                    <th className="text-left py-2 pr-2 font-semibold">{t('school.table_name')}</th>
                    <th className="text-left py-2 pr-2 font-semibold">{t('school.table_email')}</th>
                    <th className="text-left py-2 pr-2 font-semibold">{t('school.table_role')}</th>
                    <th className="text-left py-2 pr-2 font-semibold">{t('school.table_status')}</th>
                    <th className="text-left py-2 font-semibold">{t('school.table_since')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-border/10">
                      <td className="py-2.5 pr-2 text-foreground">
                        {user.full_name || '—'}
                        {user.id === profile?.id && (
                          <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{t('school.you_badge')}</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-2 text-muted-foreground truncate max-w-[200px]">
                        {user.email}
                      </td>
                      <td className="py-2.5 pr-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          user.role === 'admin'
                            ? 'bg-amber-400/10 text-amber-400'
                            : 'bg-emerald-400/10 text-emerald-400'
                        }`}>
                          {user.role === 'admin' ? t('roles.admin') : t('roles.teacher')}
                        </span>
                      </td>
                      <td className="py-2.5 pr-2">
                        <button
                          onClick={() => toggleUserActive(user.id, user.is_active)}
                          disabled={user.id === profile?.id}
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                            user.is_active
                              ? 'bg-green-400/10 text-green-400 hover:bg-green-400/20'
                              : 'bg-zinc-400/10 text-zinc-400 hover:bg-zinc-400/20'
                          } ${user.id === profile?.id ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          {user.is_active ? t('school.status_active') : t('school.status_inactive')}
                        </button>
                      </td>
                      <td className="py-2.5 text-muted-foreground text-xs">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
