-- Migration: Initial schema for SCM Career Bridge
-- Migrated from MongoDB to Supabase (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS table (students and admins)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  student_id TEXT UNIQUE,
  programme TEXT,
  skills TEXT[] DEFAULT '{}',
  resume_url TEXT DEFAULT '',
  resume_urls TEXT[] DEFAULT '{}',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- COMPANIES table
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  hr_email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  description TEXT DEFAULT '',
  website TEXT DEFAULT '',
  document_urls TEXT[] DEFAULT '{}',
  verification_status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (verification_status IN ('pending_review', 'pending_documents', 'approved', 'rejected')),
  admin_request_message TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_hr_email ON companies(hr_email);
CREATE INDEX IF NOT EXISTS idx_companies_verification ON companies(verification_status);

-- ============================================================
-- INTERNSHIPS table
-- ============================================================
CREATE TABLE IF NOT EXISTS internships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  duration TEXT,
  skills TEXT[] DEFAULT '{}',
  targeted_programmes TEXT[] DEFAULT '{}',
  supervisor_name TEXT,
  meeting_cadence TEXT,
  deliverable_checkpoints TEXT,
  status TEXT DEFAULT 'Open',
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_published BOOLEAN DEFAULT TRUE,
  is_draft BOOLEAN DEFAULT FALSE,
  required_attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_internships_company ON internships(company_id);
CREATE INDEX IF NOT EXISTS idx_internships_status ON internships(status);
CREATE INDEX IF NOT EXISTS idx_internships_published ON internships(is_published);

-- ============================================================
-- APPLICATIONS table
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Reviewed', 'Interviewing', 'Accepted', 'Rejected')),
  note TEXT DEFAULT '',
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, internship_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_internship ON applications(internship_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- ============================================================
-- FAVORITES table
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, internship_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_student ON favorites(student_id);
CREATE INDEX IF NOT EXISTS idx_favorites_internship ON favorites(internship_id);

-- ============================================================
-- ANNOUNCEMENTS table
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  posted_by TEXT DEFAULT 'SCM Admin',
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);

-- ============================================================
-- SKILL_STATS table
-- ============================================================
CREATE TABLE IF NOT EXISTS skill_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill TEXT NOT NULL UNIQUE,
  count INTEGER NOT NULL DEFAULT 1 CHECK (count >= 1),
  source TEXT NOT NULL DEFAULT 'dynamic' CHECK (source IN ('fixed', 'dynamic')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_stats_skill ON skill_stats(skill);

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER internships_updated_at BEFORE UPDATE ON internships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER skill_stats_updated_at BEFORE UPDATE ON skill_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
