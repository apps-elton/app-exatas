-- Turmas: criadas pelo owner de um tenant (escola admin ou professor autônomo).

CREATE TABLE public.classes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  teacher_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name         text NOT NULL,
  description  text,
  join_code    text UNIQUE,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX classes_tenant_id_idx ON public.classes(tenant_id);
CREATE INDEX classes_teacher_id_idx ON public.classes(teacher_id);

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classes_select_tenant"
  ON public.classes FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "classes_select_superadmin"
  ON public.classes FOR SELECT
  USING (public.is_superadmin());

CREATE POLICY "classes_insert_own_tenant"
  ON public.classes FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    AND teacher_id = auth.uid()
  );

CREATE POLICY "classes_update_own"
  ON public.classes FOR UPDATE
  USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = classes.tenant_id
        AND p.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "classes_delete_superadmin"
  ON public.classes FOR DELETE
  USING (public.is_superadmin());

COMMENT ON TABLE public.classes IS 'Turmas criadas por escolas ou professores autônomos';
COMMENT ON COLUMN public.classes.join_code IS 'Código curto (6 chars) para aluno entrar.';
