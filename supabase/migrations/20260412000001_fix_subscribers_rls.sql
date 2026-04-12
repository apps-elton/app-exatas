-- Fix F1: Subscribers table has overly permissive UPDATE and INSERT policies.
-- Drop the permissive policies and replace with restrictive ones.

-- Drop existing permissive policies
DROP POLICY IF EXISTS "update_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

-- Users can only update their own subscription (for non-sensitive fields like updated_at).
-- Actual plan changes should go through Edge Functions using service_role key.
CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Only the user themselves can insert their own subscription row.
-- Edge Functions using service_role key bypass RLS entirely.
CREATE POLICY "insert_own_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy - users should not delete subscription rows
CREATE POLICY "no_delete_subscription" ON public.subscribers
FOR DELETE
USING (false);
