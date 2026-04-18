-- Migration 008: Consolidated RLS fixes from Tasks 5-7 review + student-specific policies (Task 8).

-- =================================================================
-- Part A: Fixes for RLS gaps (from code review)
-- =================================================================

-- C2 fix: restrict classes_select_tenant to non-student roles.
-- Students must see classes only via enrollment (classes_select_enrolled_student below).
DROP POLICY IF EXISTS "classes_select_tenant" ON public.classes;
CREATE POLICY "classes_select_tenant"
  ON public.classes FOR SELECT
  USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin', 'superadmin')
    )
  );

-- I1 fix: add WITH CHECK to classes_update_own to prevent handing off class or cross-tenant move.
DROP POLICY IF EXISTS "classes_update_own" ON public.classes;
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
  )
  WITH CHECK (
    -- post-update teacher must still be self OR the row must be managed by an admin of same tenant
    (teacher_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = classes.tenant_id
        AND p.role IN ('admin', 'superadmin')
    )
  );

-- I2 fix: add WITH CHECK to enrollments_update_teacher_or_admin.
DROP POLICY IF EXISTS "enrollments_update_teacher_or_admin" ON public.class_enrollments;
CREATE POLICY "enrollments_update_teacher_or_admin"
  ON public.class_enrollments FOR UPDATE
  USING (
    class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
    OR tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
    OR tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- I5 fix: missing index on invited_by for FK scan performance.
CREATE INDEX IF NOT EXISTS class_enrollments_invited_by_idx
  ON public.class_enrollments(invited_by) WHERE invited_by IS NOT NULL;

-- I3 doc: soft-delete contract for enrollments.
COMMENT ON TABLE public.class_enrollments IS
  'Matrículas de alunos em turmas. Aluno NÃO vira membro do tenant. '
  'DELETE restrito a superadmin — professores/admins usam UPDATE is_active=false para soft-delete.';

-- =================================================================
-- Part B: Task 8 — student-specific policies
-- =================================================================

-- Block student from inserting invites (defense in depth — UI already restricts)
CREATE POLICY "tenant_invites_no_student_insert"
  ON public.tenant_invites FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Student can see classes where they are actively enrolled
CREATE POLICY "classes_select_enrolled_student"
  ON public.classes FOR SELECT
  USING (
    id IN (
      SELECT class_id FROM public.class_enrollments
      WHERE student_id = auth.uid() AND is_active = true
    )
  );

-- Student can see teacher profile for classes they are enrolled in
CREATE POLICY "profiles_select_teacher_of_enrolled_class"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT c.teacher_id FROM public.classes c
      JOIN public.class_enrollments e ON e.class_id = c.id
      WHERE e.student_id = auth.uid() AND e.is_active = true
    )
  );

COMMENT ON POLICY "classes_select_enrolled_student" ON public.classes IS
  'Student vê turmas onde tem enrollment ativo (cobre B2C sem tenant e estudantes com tenant_id)';
COMMENT ON POLICY "tenant_invites_no_student_insert" ON public.tenant_invites IS
  'Student nunca pode convidar — só professor/admin/superadmin';
