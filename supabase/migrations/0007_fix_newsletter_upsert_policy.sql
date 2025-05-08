-- Migration: Fix RLS policies for newsletter_subscriptions upsert

-- Drop existing policies first to ensure a clean state
DROP POLICY IF EXISTS "Allow public insert" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Allow public update for upsert" ON public.newsletter_subscriptions;

-- Allow public insert access (needed for new subscriptions)
CREATE POLICY "Allow public insert" ON public.newsletter_subscriptions
  FOR INSERT
  TO public -- Allows anyone, including anonymous users
  WITH CHECK (true); -- No specific check required for insertion itself

-- Allow public update access (needed for the UPDATE part of UPSERT on conflict)
-- This policy needs to allow updating rows based on the conflict target (email).
-- USING (true) allows the policy to apply to any row for the update check.
-- WITH CHECK (true) allows any valid data to be written during the update.
CREATE POLICY "Allow public update for upsert" ON public.newsletter_subscriptions
  FOR UPDATE
  TO public
  USING (true) 
  WITH CHECK (true);

COMMENT ON POLICY "Allow public insert" ON public.newsletter_subscriptions 
IS 'Allows anonymous users to insert new newsletter subscriptions.';

COMMENT ON POLICY "Allow public update for upsert" ON public.newsletter_subscriptions 
IS 'Allows anonymous users to update existing records, specifically for UPSERT operations on email conflict.'; 