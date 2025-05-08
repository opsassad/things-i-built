-- Migration: Comprehensive fix for newsletter_subscriptions RLS

-- First, enable RLS if it's not already enabled
ALTER TABLE IF EXISTS public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies - clean slate approach
DROP POLICY IF EXISTS "Allow public insert" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Allow public update for upsert" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Allow public update" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Allow public delete" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Allow public select" ON public.newsletter_subscriptions;

-- Create comprehensive policies
-- 1. Allow SELECT to all authenticated users (but not anonymous)
CREATE POLICY "Allow authenticated select" ON public.newsletter_subscriptions
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Allow INSERT to anyone (including anonymous)
CREATE POLICY "Allow public insert" ON public.newsletter_subscriptions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 3. Allow UPDATE to anyone (including anonymous) - critical for upsert to work
CREATE POLICY "Allow public update" ON public.newsletter_subscriptions
  FOR UPDATE
  TO public
  USING (true);  -- Allow any update operations

-- Grant necessary permissions at the database level too
-- These are separate from RLS policies but both are needed
GRANT SELECT, INSERT, UPDATE ON public.newsletter_subscriptions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.newsletter_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.newsletter_subscriptions TO service_role; 