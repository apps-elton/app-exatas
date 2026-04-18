-- Drop profiles_select_teacher_of_enrolled_class to fix infinite RLS recursion.
-- The policy caused: profiles SELECT → classes SELECT (via subquery)
--                   → profiles SELECT (via classes policy) → infinite loop → 500 error.
-- This view is YAGNI for Fase 1 — no UI surfaces 'teacher profile via enrollment' yet.
-- When Fase 3 adds student dashboard with teacher info, re-add using a SECURITY DEFINER
-- function that bypasses RLS during the lookup.

DROP POLICY IF EXISTS "profiles_select_teacher_of_enrolled_class" ON public.profiles;
