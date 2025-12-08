-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text DEFAULT 'award'::text,
  link text DEFAULT '#'::text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT achievements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.alumni (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  job_title text,
  graduation_year text,
  quote text,
  linkedin_url text,
  image_url text,
  sort_order integer DEFAULT 0,
  CONSTRAINT alumni_pkey PRIMARY KEY (id)
);
CREATE TABLE public.applications (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  prn text,
  branch text,
  year text,
  motivation text,
  experience text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT applications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.events (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text NOT NULL,
  description text,
  event_date timestamp with time zone NOT NULL,
  time text,
  location text,
  capacity text,
  redirect_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  sort_order integer DEFAULT 0,
  CONSTRAINT events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.gallery_albums (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text NOT NULL,
  description text,
  event_date date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT gallery_albums_pkey PRIMARY KEY (id)
);
CREATE TABLE public.media_gallery (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  entity_type text NOT NULL,
  entity_id bigint NOT NULL,
  image_url text NOT NULL,
  is_primary boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  media_type text DEFAULT 'IMAGE'::text,
  CONSTRAINT media_gallery_pkey PRIMARY KEY (id)
);
CREATE TABLE public.partners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website_url text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partners_pkey PRIMARY KEY (id)
);
CREATE TABLE public.projects (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text NOT NULL,
  description text,
  category text DEFAULT 'General'::text,
  status text DEFAULT 'Active'::text,
  project_year text,
  github_url text,
  technologies ARRAY DEFAULT '{}'::text[],
  contributors ARRAY DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  sort_order integer DEFAULT 0,
  CONSTRAINT projects_pkey PRIMARY KEY (id)
);
CREATE TABLE public.site_config (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  key_name text NOT NULL UNIQUE,
  value_boolean boolean DEFAULT false,
  CONSTRAINT site_config_pkey PRIMARY KEY (id)
);
CREATE TABLE public.team_members (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  team_role text NOT NULL,
  department text,
  bio text,
  image_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  linkedin_url text,
  CONSTRAINT team_members_pkey PRIMARY KEY (id)
);
CREATE TABLE public.timeline_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  year text NOT NULL,
  title text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT timeline_events_pkey PRIMARY KEY (id)
);