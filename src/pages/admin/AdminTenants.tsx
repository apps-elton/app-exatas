import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Search, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  max_users: number;
  is_active: boolean;
  created_at: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminTenants() {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formMaxUsers, setFormMaxUsers] = useState(5);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug, custom_domain, max_users, is_active, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data ?? []);

      // Fetch user counts per tenant
      const { data: profiles } = await supabase
        .from('profiles')
        .select('tenant_id');

      const counts: Record<string, number> = {};
      (profiles ?? []).forEach((p) => {
        if (p.tenant_id) {
          counts[p.tenant_id] = (counts[p.tenant_id] || 0) + 1;
        }
      });
      setUserCounts(counts);
    } catch (err) {
      console.error('Erro ao carregar tenants:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Auto-slug from name
  useEffect(() => {
    setFormSlug(slugify(formName));
  }, [formName]);

  const handleCreate = async () => {
    if (!formName.trim() || !formSlug.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('tenants').insert({
        name: formName.trim(),
        slug: formSlug.trim(),
        max_users: formMaxUsers,
      });
      if (error) throw error;
      setFormName('');
      setFormSlug('');
      setFormMaxUsers(5);
      setShowForm(false);
      await fetchTenants();
    } catch (err) {
      console.error('Erro ao criar tenant:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (tenant: Tenant) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ is_active: !tenant.is_active })
        .eq('id', tenant.id);
      if (error) throw error;
      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, is_active: !t.is_active } : t))
      );
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tenant?')) return;
    try {
      const { error } = await supabase.from('tenants').delete().eq('id', id);
      if (error) throw error;
      setTenants((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Erro ao excluir tenant:', err);
    }
  };

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-poppins font-bold text-foreground">
              Tenants (Escolas)
            </h1>
            <p className="text-sm font-nunito text-muted-foreground">
              Gerencie as instituições cadastradas no sistema
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-400 text-white font-nunito text-sm font-semibold hover:bg-red-500 transition-colors"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancelar' : 'Novo Tenant'}
          </button>
        </div>

        {/* Inline Create Form */}
        {showForm && (
          <div className="bg-card border border-border/30 rounded-xl p-5">
            <h2 className="text-base font-poppins font-semibold text-foreground mb-4">
              Criar Novo Tenant
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-nunito text-muted-foreground mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Escola Municipal"
                  className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background text-foreground text-sm font-nunito focus:outline-none focus:ring-2 focus:ring-red-400/50"
                />
              </div>
              <div>
                <label className="block text-sm font-nunito text-muted-foreground mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="escola-municipal"
                  className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background text-foreground text-sm font-nunito focus:outline-none focus:ring-2 focus:ring-red-400/50"
                />
              </div>
              <div>
                <label className="block text-sm font-nunito text-muted-foreground mb-1">
                  Max Usuários
                </label>
                <input
                  type="number"
                  value={formMaxUsers}
                  onChange={(e) => setFormMaxUsers(Number(e.target.value))}
                  min={1}
                  className="w-full px-3 py-2 rounded-lg border border-border/30 bg-background text-foreground text-sm font-nunito focus:outline-none focus:ring-2 focus:ring-red-400/50"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCreate}
                disabled={saving || !formName.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-400 text-white font-nunito text-sm font-semibold hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
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
              Nenhum tenant encontrado.
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border/30 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-nunito">
                <thead>
                  <tr className="border-b border-border/30 text-muted-foreground bg-muted/30">
                    <th className="text-left py-3 px-4 font-semibold">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold">Slug</th>
                    <th className="text-left py-3 px-4 font-semibold">Domínio</th>
                    <th className="text-center py-3 px-4 font-semibold">Usuários</th>
                    <th className="text-center py-3 px-4 font-semibold">Max Usuários</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Criado em</th>
                    <th className="text-center py-3 px-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className="border-b border-border/10 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3 px-4 text-foreground font-semibold">{tenant.name}</td>
                      <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                        {tenant.slug}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {tenant.custom_domain || '—'}
                      </td>
                      <td className="py-3 px-4 text-center text-foreground">
                        {userCounts[tenant.id] ?? 0}
                      </td>
                      <td className="py-3 px-4 text-center text-foreground">{tenant.max_users}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            tenant.is_active
                              ? 'bg-emerald-400/10 text-emerald-400'
                              : 'bg-zinc-400/10 text-zinc-400'
                          }`}
                        >
                          {tenant.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {formatDate(tenant.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleActive(tenant)}
                            title={tenant.is_active ? 'Desativar' : 'Ativar'}
                            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                          >
                            {tenant.is_active ? (
                              <ToggleRight className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(tenant.id)}
                            title="Excluir"
                            className="p-1.5 rounded-lg hover:bg-red-400/10 transition-colors text-muted-foreground hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
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
    </AdminLayout>
  );
}
