-- Migration: Update ratings and comments schema for consolidated system

-- Add email column to ratings table 
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS 
  email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add name column to ratings table
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS name TEXT;

-- Add unique constraint to ensure one email can rate a post only once
ALTER TABLE public.ratings 
  DROP CONSTRAINT IF EXISTS unique_user_post_rating;
  
ALTER TABLE public.ratings 
  ADD CONSTRAINT unique_user_post_rating UNIQUE (post_id, email);

-- Add comment_count column to track how many times a user has commented on a post
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 1;

-- Create index on email in comments table for faster lookups
CREATE INDEX IF NOT EXISTS idx_comments_email ON public.comments(email);

-- Create index on post_id and email in comments table for faster constraint checks
CREATE INDEX IF NOT EXISTS idx_comments_post_email ON public.comments(post_id, email);

-- Ensure tables have RLS enabled
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Update or create RLS policies for ratings
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.ratings;
CREATE POLICY "Allow anonymous insert" ON public.ratings
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Update or create RLS policies for comments
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.comments;
CREATE POLICY "Allow anonymous insert" ON public.comments
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Grant public access for selecting, inserting
GRANT SELECT, INSERT ON public.ratings TO anon, authenticated;
GRANT SELECT, INSERT ON public.comments TO anon, authenticated;

COMMENT ON TABLE public.ratings IS 'User ratings for blog posts with email tracking';
COMMENT ON COLUMN public.ratings.email IS 'User email to prevent duplicate ratings';
COMMENT ON COLUMN public.comments.comment_count IS 'Number of times this user has commented on this post'; 