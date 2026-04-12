import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  Trash2,
  FolderOpen,
  Clock,
  Box,
  MoreVertical,
  Globe,
  Lock,
  Copy,
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Project = Tables<'projects'>;

export default function Projects() {
  const { t, i18n } = useTranslation();
  const { user, subscription } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const projectsLimit = subscription?.projects_limit ?? 3;
  const projectsUsed = projects.length;
  const canCreate = projectsUsed < projectsLimit;

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    setProjects(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async () => {
    if (!user || !canCreate) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: t('projects.default_name', { number: projectsUsed + 1 }),
        geometry_data: {},
      })
      .select()
      .single();

    if (data && !error) {
      navigate(`/?project=${data.id}`);
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('projects.confirm_delete'))) return;
    await supabase.from('projects').delete().eq('id', id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setMenuOpen(null);
  };

  const handleTogglePublic = async (project: Project) => {
    const shareToken = project.is_public ? null : crypto.randomUUID().slice(0, 8);
    await supabase
      .from('projects')
      .update({ is_public: !project.is_public, share_token: shareToken })
      .eq('id', project.id);
    fetchProjects();
    setMenuOpen(null);
  };

  const handleDuplicate = async (project: Project) => {
    if (!user || !canCreate) return;
    await supabase.from('projects').insert({
      user_id: user.id,
      name: `${project.name} ${t('projects.copy_suffix')}`,
      geometry_data: project.geometry_data,
      drawing_data: project.drawing_data,
    });
    fetchProjects();
    setMenuOpen(null);
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="border-b border-border/30 bg-background/95 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold font-poppins text-foreground">{t('projects.title')}</h1>
              <p className="text-sm text-muted-foreground font-nunito mt-1">
                {t('projects.used_of', { used: projectsUsed, limit: projectsLimit })}
              </p>
            </div>
            <Button
              onClick={handleCreate}
              disabled={!canCreate || creating}
              className="gap-2 font-poppins"
            >
              <Plus className="w-4 h-4" />
              {t('projects.new_project')}
            </Button>
          </div>

          {/* Usage bar */}
          <div className="w-full bg-muted/50 rounded-full h-1.5 mb-4">
            <div
              className="bg-primary h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min((projectsUsed / projectsLimit) * 100, 100)}%` }}
            />
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('projects.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border/50 font-nunito"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FolderOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-poppins font-semibold text-foreground mb-2">
                {search ? t('projects.no_results') : t('projects.no_projects_yet')}
              </h3>
              <p className="text-sm text-muted-foreground font-nunito mb-4">
                {search
                  ? t('projects.try_other_terms')
                  : t('projects.create_first')}
              </p>
              {!search && (
                <Button onClick={handleCreate} disabled={!canCreate} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t('projects.create_first_button')}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((project) => (
                <div
                  key={project.id}
                  className="group relative rounded-xl border border-border/30 bg-card hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => navigate(`/?project=${project.id}`)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-muted/30 rounded-t-xl flex items-center justify-center">
                    {project.thumbnail_url ? (
                      <img
                        src={project.thumbnail_url}
                        alt={project.name}
                        className="w-full h-full object-cover rounded-t-xl"
                      />
                    ) : (
                      <Box className="w-12 h-12 text-muted-foreground/20" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-poppins font-semibold text-sm text-foreground truncate">
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-nunito">
                            {formatDate(project.updated_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {project.is_public ? (
                            <Globe className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          )}
                          <span className="text-[11px] text-muted-foreground">
                            {project.is_public ? t('projects.public') : t('projects.private')}
                          </span>
                        </div>
                      </div>

                      {/* Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(menuOpen === project.id ? null : project.id);
                          }}
                          className="p-1 rounded hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                        {menuOpen === project.id && (
                          <div
                            className="absolute right-0 top-8 z-50 w-44 rounded-lg border border-border/50 bg-popover shadow-lg py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleDuplicate(project)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50"
                            >
                              <Copy className="w-4 h-4" /> {t('projects.duplicate')}
                            </button>
                            <button
                              onClick={() => handleTogglePublic(project)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50"
                            >
                              {project.is_public ? (
                                <><Lock className="w-4 h-4" /> {t('projects.make_private')}</>
                              ) : (
                                <><Globe className="w-4 h-4" /> {t('projects.make_public')}</>
                              )}
                            </button>
                            <hr className="my-1 border-border/30" />
                            <button
                              onClick={() => handleDelete(project.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" /> {t('projects.delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
