-- Initial Schema Migration

-- Enable HTTP extension if not already enabled (often needed for Supabase features)
-- create extension if not exists http with schema extensions;

-- Enable pgcrypto extension for UUID generation if needed
-- create extension if not exists pgcrypto with schema extensions;

-- Create home_page_content table
CREATE TABLE public.home_page_content (
    id bigint PRIMARY KEY DEFAULT 1, -- Assuming a single row with fixed ID 1
    hero_title text,
    hero_subtitle text,
    about_text text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    -- Ensure only one row can exist with id = 1
    CONSTRAINT home_page_content_singleton CHECK (id = 1)
);

-- Create site_settings table
CREATE TABLE public.site_settings (
    id bigint PRIMARY KEY DEFAULT 1, -- Assuming a single row with fixed ID 1
    site_title text,
    site_description text,
    github_url text,
    linkedin_url text,
    twitter_url text,
    enable_comments boolean DEFAULT true NOT NULL,
    enable_analytics boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    -- Ensure only one row can exist with id = 1
    CONSTRAINT site_settings_singleton CHECK (id = 1)
);

-- Create blog_posts table
CREATE TABLE public.blog_posts (
    id text PRIMARY KEY, -- e.g., 'blog/my-slug' or 'project/my-project'
    title text NOT NULL,
    excerpt text,
    content text,
    category text,
    tags jsonb, -- Using jsonb for flexibility
    date timestamp with time zone, -- Consider renaming for clarity (e.g., published_at)
    read_time text,
    author_name text,
    author_role text,
    technologies jsonb,
    features jsonb,
    detailed_description text,
    image_url text,
    featured_image text,
    author_image text,
    link text,
    is_draft boolean DEFAULT false NOT NULL,
    slug text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL, -- e.g., 'draft', 'published', 'archived'
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    like_count integer DEFAULT 0 NOT NULL,
    seo_score integer
);

-- Optional: Add an index for faster slug lookup if needed
-- CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update 'updated_at' on blog_posts modification
CREATE TRIGGER on_blog_post_update
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();


-- Row Level Security (RLS) Policies --

-- Enable RLS for the tables
ALTER TABLE public.home_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to home_page_content
CREATE POLICY "Allow public read access" ON public.home_page_content
  FOR SELECT USING (true);

-- Policy: Allow public read access to site_settings
CREATE POLICY "Allow public read access" ON public.site_settings
  FOR SELECT USING (true);

-- Policy: Allow public read access to published blog posts
CREATE POLICY "Allow public read access for published posts" ON public.blog_posts
  FOR SELECT USING (status = 'published' AND is_draft = false);

-- WARNING: The following policies allow ANY anonymous user to modify data.
-- This is generally UNSAFE for production without proper authentication and authorization checks.
-- These are included TEMPORARILY based on the request to not implement auth yet.
-- Replace these with authenticated policies as soon as possible.

-- Policy: Allow anonymous users to update home_page_content (UNSAFE)
CREATE POLICY "Allow anon update" ON public.home_page_content
  FOR UPDATE USING (true) WITH CHECK (true);

-- Policy: Allow anonymous users to update site_settings (UNSAFE)
CREATE POLICY "Allow anon update" ON public.site_settings
  FOR UPDATE USING (true) WITH CHECK (true);

-- Policy: Allow anonymous users to insert/update/delete blog posts (UNSAFE)
CREATE POLICY "Allow anon modifications" ON public.blog_posts
  FOR ALL USING (true) WITH CHECK (true); -- Allows INSERT, UPDATE, DELETE


-- Seed initial data (Optional but recommended) --

-- Seed home_page_content (only if table is empty)
INSERT INTO public.home_page_content (id, hero_title, hero_subtitle, about_text)
SELECT 1, 'Repeat', 'Building intelligent applications that solve complex business challenges', 'I''m a fullstack developer specializing in AI-powered applications and Google Workspace automation. With a focus on creating practical solutions for businesses, I build tools that enhance productivity and streamline workflows.'
WHERE NOT EXISTS (SELECT 1 FROM public.home_page_content WHERE id = 1);

-- Seed site_settings (only if table is empty)
INSERT INTO public.site_settings (id, site_title, site_description, github_url, linkedin_url, twitter_url, enable_comments, enable_analytics)
SELECT 1, 'Repeat', 'Professional portfolio of ASSAD, a fullstack developer specializing in AI-powered applications and Google Workspace automation.', 'https://github.com', 'https://linkedin.com', 'https://twitter.com', true, true
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE id = 1);

-- Note: Blog posts seeding is usually more complex and might be better handled via a separate script or manually. 

-- Create media_library table
CREATE TABLE public.media_library (
    id text PRIMARY KEY, -- e.g., 'media-1746218490050' or a generated UUID
    name text NOT NULL,
    url text NOT NULL, -- Store the full public Supabase URL
    size text,
    type text,
    bucket text,
    path text, -- The path within the Supabase storage bucket
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Optional: Add indexes for faster lookup if needed, e.g., by path or bucket
-- CREATE INDEX idx_media_library_path ON public.media_library(path);

-- Enable RLS for the media_library table
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to media_library
CREATE POLICY "Allow public read access" ON public.media_library
  FOR SELECT USING (true);

-- Policy: Allow anonymous users to insert/update/delete media library entries (UNSAFE - Placeholder)
-- Replace with authenticated policies later
CREATE POLICY "Allow anon modifications" ON public.media_library
  FOR ALL USING (true) WITH CHECK (true); -- Allows INSERT, UPDATE, DELETE

-- Comment indicating that this table stores metadata for files in Supabase Storage
COMMENT ON TABLE public.media_library IS 'Stores metadata for files uploaded to Supabase Storage.';


-- ==== Newsletter Subscriptions Table Creation ====
-- Migration: Add newsletter_subscriptions and contact_submissions tables

-- ==== Newsletter Subscriptions Table ====

CREATE TABLE public.newsletter_subscriptions (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    email text NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'), -- Mandatory, unique, basic format check
    name text, -- Optional
    subscription_status text NOT NULL DEFAULT 'active', -- e.g., 'active', 'unsubscribed'
    ip_address text, -- Captured metadata
    country text,    -- Captured metadata
    region text,     -- Captured metadata (maps to regionName)
    city text,       -- Captured metadata
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL -- For status changes
);

COMMENT ON TABLE public.newsletter_subscriptions IS 'Stores email addresses and optional names for newsletter signups.';
COMMENT ON COLUMN public.newsletter_subscriptions.email IS 'Subscriber email address.';
COMMENT ON COLUMN public.newsletter_subscriptions.name IS 'Optional subscriber name.';
COMMENT ON COLUMN public.newsletter_subscriptions.subscription_status IS 'Current status (e.g., active, unsubscribed).';
COMMENT ON COLUMN public.newsletter_subscriptions.ip_address IS 'IP address recorded at signup.';
COMMENT ON COLUMN public.newsletter_subscriptions.country IS 'Country recorded at signup.';
COMMENT ON COLUMN public.newsletter_subscriptions.region IS 'Region/State recorded at signup.';
COMMENT ON COLUMN public.newsletter_subscriptions.city IS 'City recorded at signup.';

-- Function to automatically update 'updated_at' timestamp (if not already created)
-- Ensure this function exists or create it separately if needed.
-- CREATE OR REPLACE FUNCTION public.handle_updated_at() ...

-- Trigger to update 'updated_at' on newsletter_subscriptions modification
CREATE TRIGGER on_newsletter_subscription_update
  BEFORE UPDATE ON public.newsletter_subscriptions
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Index for faster email lookups
CREATE INDEX idx_newsletter_subscriptions_email ON public.newsletter_subscriptions(email);

-- ==== Contact Form Submissions Table ====

CREATE TABLE public.contact_submissions (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name text NOT NULL, -- Sender's name from form
    email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'), -- Sender's email, basic format check
    message text NOT NULL, -- Message content from form
    ip_address text, -- Captured metadata
    country text,    -- Captured metadata
    region text,     -- Captured metadata (maps to regionName)
    city text,       -- Captured metadata
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.contact_submissions IS 'Stores submissions from the contact form.';
COMMENT ON COLUMN public.contact_submissions.name IS 'Name provided in the contact form.';
COMMENT ON COLUMN public.contact_submissions.email IS 'Email address provided in the contact form.';
COMMENT ON COLUMN public.contact_submissions.message IS 'Message content from the contact form.';
COMMENT ON COLUMN public.contact_submissions.ip_address IS 'IP address recorded at submission.';
COMMENT ON COLUMN public.contact_submissions.country IS 'Country recorded at submission.';
COMMENT ON COLUMN public.contact_submissions.region IS 'Region/State recorded at submission.';
COMMENT ON COLUMN public.contact_submissions.city IS 'City recorded at submission.';

-- Optional: Index for searching by email or date
-- CREATE INDEX idx_contact_submissions_email ON public.contact_submissions(email);
-- CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions(created_at);


-- ==== Row Level Security (RLS) Policies ====

-- Enable RLS for the new tables
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public insert access for newsletter subscriptions (for signup form)
DROP POLICY IF EXISTS "Allow public insert" ON public.newsletter_subscriptions;
CREATE POLICY "Allow public insert" ON public.newsletter_subscriptions
  FOR INSERT
  TO public -- Allows anyone, including anonymous users
  WITH CHECK (true); -- No specific check required for insertion itself

-- Allow public insert access for contact submissions (for contact form)
DROP POLICY IF EXISTS "Allow public insert" ON public.contact_submissions;
CREATE POLICY "Allow public insert" ON public.contact_submissions
  FOR INSERT
  TO public -- Allows anyone, including anonymous users
  WITH CHECK (true); -- No specific check required for insertion itself

-- NOTE: SELECT, UPDATE, DELETE policies are intentionally omitted for the 'public' role.
-- Access for reading or managing these records should be granted to specific authenticated roles (e.g., 'authenticated', 'service_role', or custom admin roles).
-- Example (Admin read access - DO NOT APPLY unless intended):
-- CREATE POLICY "Allow admin read access" ON public.newsletter_subscriptions FOR SELECT TO service_role USING (true);
-- CREATE POLICY "Allow admin read access" ON public.contact_submissions FOR SELECT TO service_role USING (true);


-- ==== Comments Table ====
-- Migration: Add comments table

CREATE TABLE public.comments (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    -- Link to the post being commented on. Ensures comments are deleted if the post is.
    post_id text NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    name text NOT NULL CHECK (char_length(name) > 0),
    email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    content text NOT NULL CHECK (char_length(content) > 0),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    -- Comments require approval before being publicly visible
    approved boolean DEFAULT false NOT NULL
);

COMMENT ON TABLE public.comments IS 'Stores user comments on blog posts and projects.';
COMMENT ON COLUMN public.comments.post_id IS 'The ID of the blog_posts entry this comment belongs to.';
COMMENT ON COLUMN public.comments.approved IS 'Whether the comment has been approved by an admin and is publicly visible.';

-- Index for faster lookups of comments by post_id
CREATE INDEX idx_comments_post_id ON public.comments(post_id);

-- Enable Row Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a comment (INSERT)
-- We don't check for 'approved' here because comments start as unapproved.
CREATE POLICY "Allow public inserts" ON public.comments
    FOR INSERT TO public
    WITH CHECK (true);

-- Allow anyone to view comments that have been approved (SELECT)
CREATE POLICY "Allow public view of approved comments" ON public.comments
    FOR SELECT TO public
    USING (approved = true);

-- Prevent public users from updating or deleting comments
-- (No UPDATE or DELETE policies are defined for the 'public' role) 

-- ==== Ratings Table ====
-- Migration: Add ratings table

CREATE TABLE public.ratings (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    -- Link to the post being rated. Ensures ratings are deleted if the post is.
    post_id text NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    -- Rating value from 1 to 5
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    -- Optional: Store a unique client identifier (e.g., browser fingerprint hash, session ID)
    -- This could be used for basic duplicate rating prevention, though not foolproof.
    client_identifier text
);

COMMENT ON TABLE public.ratings IS 'Stores user ratings (1-5) for blog posts and projects.';
COMMENT ON COLUMN public.ratings.post_id IS 'The ID of the blog_posts entry this rating belongs to.';
COMMENT ON COLUMN public.ratings.client_identifier IS 'An identifier for the client submitting the rating (optional, for simple duplicate prevention).';

-- Index for faster lookups/aggregation of ratings by post_id
CREATE INDEX idx_ratings_post_id ON public.ratings(post_id);

-- Enable Row Level Security
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a rating (INSERT)
CREATE POLICY "Allow public inserts" ON public.ratings
    FOR INSERT TO public
    WITH CHECK (true);

-- Allow anyone to view all ratings (SELECT)
-- Needed to calculate average ratings on the frontend or backend.
CREATE POLICY "Allow public view" ON public.ratings
    FOR SELECT TO public
    USING (true);

-- Prevent public users from updating or deleting ratings
-- (No UPDATE or DELETE policies are defined for the 'public' role) 



-- filename: 0010_add_visitor_tracking.sql

-- Table for storing unique visitor data
CREATE TABLE public.site_visitors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id text NOT NULL UNIQUE,
  first_visit_timestamp timestamptz DEFAULT now() NOT NULL,
  last_visit_timestamp timestamptz DEFAULT now() NOT NULL,
  visit_count integer DEFAULT 1 NOT NULL,
  user_agent text,
  referrer text,
  is_bot boolean DEFAULT false
);

COMMENT ON TABLE public.site_visitors IS 'Stores unique visitor data based on browser fingerprinting';
COMMENT ON COLUMN public.site_visitors.visitor_id IS 'Unique fingerprint identifier for the visitor';
COMMENT ON COLUMN public.site_visitors.visit_count IS 'Total number of visits from this visitor';

-- Table for tracking individual visit sessions
CREATE TABLE public.visit_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id text NOT NULL REFERENCES public.site_visitors(visitor_id) ON DELETE CASCADE,
  session_start timestamptz DEFAULT now() NOT NULL,
  session_end timestamptz,
  pages_visited integer DEFAULT 1 NOT NULL,
  entry_page text,
  exit_page text,
  duration_seconds integer
);

COMMENT ON TABLE public.visit_sessions IS 'Tracks individual visitor sessions';
COMMENT ON COLUMN public.visit_sessions.duration_seconds IS 'Session duration in seconds, calculated on session end';

-- Table for daily visitor statistics aggregation
CREATE TABLE public.daily_visitor_stats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL UNIQUE,
  unique_visitors integer DEFAULT 0 NOT NULL,
  total_pageviews integer DEFAULT 0 NOT NULL,
  returning_visitors integer DEFAULT 0 NOT NULL,
  avg_session_duration numeric(10,2) DEFAULT 0 NOT NULL
);

COMMENT ON TABLE public.daily_visitor_stats IS 'Aggregated daily visitor statistics';

-- Table for page view tracking
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES public.visit_sessions(id) ON DELETE CASCADE,
  page_path text NOT NULL,
  view_timestamp timestamptz DEFAULT now() NOT NULL,
  duration_seconds integer
);

COMMENT ON TABLE public.page_views IS 'Individual page view data within sessions';

-- Create indexes for performance
CREATE INDEX idx_site_visitors_visitor_id ON public.site_visitors(visitor_id);
CREATE INDEX idx_visit_sessions_visitor_id ON public.visit_sessions(visitor_id);
CREATE INDEX idx_visit_sessions_start ON public.visit_sessions(session_start);
CREATE INDEX idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX idx_page_views_page_path ON public.page_views(page_path);
CREATE INDEX idx_daily_visitor_stats_date ON public.daily_visitor_stats(date);

-- Function to update visitor data on new visit
CREATE OR REPLACE FUNCTION update_visitor_on_visit()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last visit time and increment visit count
  UPDATE public.site_visitors
  SET last_visit_timestamp = NEW.session_start,
      visit_count = visit_count + 1
  WHERE visitor_id = NEW.visitor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update visitor data when a new session is created
CREATE TRIGGER on_new_visit_session
  AFTER INSERT ON public.visit_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_visitor_on_visit();

-- Function to calculate session duration when a session ends
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate duration in seconds when session_end is set
  IF NEW.session_end IS NOT NULL AND OLD.session_end IS NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.session_end - NEW.session_start))::integer;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate session duration when session_end is updated
CREATE TRIGGER on_session_end
  BEFORE UPDATE ON public.visit_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_duration();

-- Function to update daily stats with new visitor
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  today_date date := date(NEW.session_start);
  is_returning boolean;
BEGIN
  -- Check if this is a returning visitor (visit_count > 1)
  SELECT (visit_count > 1) INTO is_returning
  FROM public.site_visitors
  WHERE visitor_id = NEW.visitor_id;

  -- Insert or update daily stats
  INSERT INTO public.daily_visitor_stats (date, unique_visitors, total_pageviews, returning_visitors)
  VALUES (today_date, 1, 1, CASE WHEN is_returning THEN 1 ELSE 0 END)
  ON CONFLICT (date) DO UPDATE
  SET 
    unique_visitors = public.daily_visitor_stats.unique_visitors + 1,
    total_pageviews = public.daily_visitor_stats.total_pageviews + 1,
    returning_visitors = public.daily_visitor_stats.returning_visitors + 
      CASE WHEN is_returning THEN 1 ELSE 0 END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update daily stats on new session
CREATE TRIGGER on_new_session_update_stats
  AFTER INSERT ON public.visit_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_stats();

-- Function to increment page views
CREATE OR REPLACE FUNCTION increment_page_views()
RETURNS TRIGGER AS $$
DECLARE
  view_date date := date(NEW.view_timestamp);
BEGIN
  -- Update total pageviews in daily stats
  INSERT INTO public.daily_visitor_stats (date, unique_visitors, total_pageviews, returning_visitors)
  VALUES (view_date, 0, 1, 0)
  ON CONFLICT (date) DO UPDATE
  SET total_pageviews = public.daily_visitor_stats.total_pageviews + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update pageview stats
CREATE TRIGGER on_new_page_view
  AFTER INSERT ON public.page_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_page_views();

-- Enable Row Level Security
ALTER TABLE public.site_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_visitor_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only allow anonymous users to INSERT visitor data
CREATE POLICY "Allow public insert" ON public.site_visitors
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public insert" ON public.visit_sessions
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow public insert" ON public.page_views
  FOR INSERT TO public
  WITH CHECK (true);

-- RLS Policies: Allow public to read aggregated stats only
CREATE POLICY "Allow public read of aggregated stats" ON public.daily_visitor_stats
  FOR SELECT TO public
  USING (true);

-- RLS Policies: Allow service role to perform all operations
CREATE POLICY "Allow service_role full access" ON public.site_visitors
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full access" ON public.visit_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full access" ON public.page_views
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full access" ON public.daily_visitor_stats
  FOR ALL TO service_role USING (true) WITH CHECK (true);