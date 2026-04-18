-- class_enrollments: matrícula de alunos em turmas.

CREATE TABLE public.class_enrollments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id     uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invited_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  invited_email text,
  joined_at    timestamptz,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id)
);

CREATE INDEX class_enrollments_class_id_idx ON public.class_enrollments(class_id);
CREATE INDEX class_enrollments_student_id_idx ON public.class_enrollments(student_id);
CREATE INDEX class_enrollments_tenant_id_idx ON public.class_enrollments(tenant_id);

ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments_select_own"
  ON public.class_enrollments FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "enrollments_select_teacher"
  ON public.class_enrollments FOR SELECT
  USING (class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid()));

CREATE POLICY "enrollments_select_tenant_admin"
  ON public.class_enrollments FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "enrollments_select_superadmin"
  ON public.class_enrollments FOR SELECT
  USING (public.is_superadmin());

CREATE POLICY "enrollments_insert_teacher"
  ON public.class_enrollments FOR INSERT
  WITH CHECK (
    class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
    AND tenant_id = (SELECT tenant_id FROM public.classes WHERE id = class_id)
  );

CREATE POLICY "enrollments_update_teacher_or_admin"
  ON public.class_enrollments FOR UPDATE
  USING (
    class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
    OR tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "enrollments_delete_superadmin"
  ON public.class_enrollments FOR DELETE
  USING (public.is_superadmin());

COMMENT ON TABLE public.class_enrollments IS
  'Matrículas de alunos em turmas. Aluno NÃO vira membro do tenant.';
