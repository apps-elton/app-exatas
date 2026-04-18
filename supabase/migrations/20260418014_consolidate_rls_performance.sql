-- Consolidate RLS policies on new tables (plans, classes, class_enrollments)
-- to reduce multiple_permissive_policies and use (select auth.uid()) for perf.
-- Only touches tables created in this branch — does NOT modify legacy table policies.

-- ============================================
-- plans
-- ============================================
DROP POLICY IF EXISTS "plans_select_active_public" ON public.plans;
DROP POLICY IF EXISTS "plans_select_superadmin" ON public.plans;
DROP POLICY IF EXISTS "plans_insert_superadmin" ON public.plans;
DROP POLICY IF EXISTS "plans_update_superadmin" ON public.plans;
DROP POLICY IF EXISTS "plans_no_delete" ON public.plans;

-- Public can read active plans
CREATE POLICY "plans_read_active" ON public.plans FOR SELECT
  USING (active = true);

-- Superadmin full access (SELECT/INSERT/UPDATE/DELETE)
CREATE POLICY "plans_all_superadmin" ON public.plans FOR ALL
  USING ((SELECT public.is_superadmin()))
  WITH CHECK ((SELECT public.is_superadmin()));

-- Explicit deny for non-superadmin DELETE (defense in depth since no ALL-allow exists for them)
-- Not strictly needed because missing policy = denied, but documents intent.

-- ============================================
-- classes
-- ============================================
DROP POLICY IF EXISTS "classes_select_tenant" ON public.classes;
DROP POLICY IF EXISTS "classes_select_superadmin" ON public.classes;
DROP POLICY IF EXISTS "classes_select_enrolled_student" ON public.classes;
DROP POLICY IF EXISTS "classes_insert_own_tenant" ON public.classes;
DROP POLICY IF EXISTS "classes_update_own" ON public.classes;
DROP POLICY IF EXISTS "classes_delete_superadmin" ON public.classes;

-- SELECT: teacher/admin of tenant, superadmin, or enrolled student
CREATE POLICY "classes_select" ON public.classes FOR SELECT
  USING (
    (SELECT public.is_superadmin())
    OR (
      tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid()))
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role IN ('teacher', 'admin', 'superadmin')
      )
    )
    OR id IN (
      SELECT class_id FROM public.class_enrollments
      WHERE student_id = (SELECT auth.uid()) AND is_active = true
    )
  );

-- INSERT: teacher/admin creating class in their tenant, must set teacher_id to self
CREATE POLICY "classes_insert" ON public.classes FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = (SELECT auth.uid()))
    AND teacher_id = (SELECT auth.uid())
  );

-- UPDATE: class owner or tenant admin
CREATE POLICY "classes_update" ON public.classes FOR UPDATE
  USING (
    teacher_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.tenant_id = classes.tenant_id
        AND p.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    teacher_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.tenant_id = classes.tenant_id
        AND p.role IN ('admin', 'superadmin')
    )
  );

-- DELETE: superadmin only
CREATE POLICY "classes_delete" ON public.classes FOR DELETE
  USING ((SELECT public.is_superadmin()));

-- ============================================
-- class_enrollments
-- ============================================
DROP POLICY IF EXISTS "enrollments_select_own" ON public.class_enrollments;
DROP POLICY IF EXISTS "enrollments_select_teacher" ON public.class_enrollments;
DROP POLICY IF EXISTS "enrollments_select_tenant_admin" ON public.class_enrollments;
DROP POLICY IF EXISTS "enrollments_select_superadmin" ON public.class_enrollments;
DROP POLICY IF EXISTS "enrollments_insert_teacher" ON public.class_enrollments;
DROP POLICY IF EXISTS "enrollments_update_teacher_or_admin" ON public.class_enrollments;
DROP POLICY IF EXISTS "enrollments_delete_superadmin" ON public.class_enrollments;

-- SELECT: own, teacher of class, tenant admin, or superadmin
CREATE POLICY "enrollments_select" ON public.class_enrollments FOR SELECT
  USING (
    (SELECT public.is_superadmin())
    OR student_id = (SELECT auth.uid())
    OR class_id IN (SELECT id FROM public.classes WHERE teacher_id = (SELECT auth.uid()))
    OR tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'superadmin')
    )
  );

-- INSERT: teacher of the class, tenant_id auto-derived from class
CREATE POLICY "enrollments_insert" ON public.class_enrollments FOR INSERT
  WITH CHECK (
    class_id IN (SELECT id FROM public.classes WHERE teacher_id = (SELECT auth.uid()))
    AND tenant_id = (SELECT tenant_id FROM public.classes WHERE id = class_id)
  );

-- UPDATE: teacher of class or tenant admin (soft-delete pattern)
CREATE POLICY "enrollments_update" ON public.class_enrollments FOR UPDATE
  USING (
    class_id IN (SELECT id FROM public.classes WHERE teacher_id = (SELECT auth.uid()))
    OR tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    class_id IN (SELECT id FROM public.classes WHERE teacher_id = (SELECT auth.uid()))
    OR tenant_id IN (
      SELECT tenant_id FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'superadmin')
    )
  );

-- DELETE: superadmin only
CREATE POLICY "enrollments_delete" ON public.class_enrollments FOR DELETE
  USING ((SELECT public.is_superadmin()));

COMMENT ON TABLE public.class_enrollments IS
  'Matrículas de alunos em turmas. Aluno NÃO vira membro do tenant. '
  'DELETE restrito a superadmin — professores/admins usam UPDATE is_active=false para soft-delete.';
