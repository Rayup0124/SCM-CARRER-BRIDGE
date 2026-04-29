-- Migration: Row Level Security (RLS) policies
-- RLS must be enabled for Supabase to enforce access control

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_stats ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS policies
-- ============================================================
-- Everyone can read users (for company profiles, etc.)
CREATE POLICY "Users are publicly readable" ON users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Only admins can insert/delete users
CREATE POLICY "Only admins can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() IS NULL
  );

-- ============================================================
-- COMPANIES policies
-- ============================================================
-- Companies are publicly readable (for student browsing)
CREATE POLICY "Companies are publicly readable" ON companies
  FOR SELECT USING (true);

-- Only the company itself can update its profile
CREATE POLICY "Companies can update own profile" ON companies
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- INTERNSHIPS policies
-- ============================================================
-- Internships are publicly readable
CREATE POLICY "Internships are publicly readable" ON internships
  FOR SELECT USING (true);

-- Only the owning company can insert/update/delete
CREATE POLICY "Companies can manage own internships" ON internships
  FOR ALL USING (auth.uid() = company_id);

-- ============================================================
-- APPLICATIONS policies
-- ============================================================
-- Students can read their own applications
CREATE POLICY "Students can read own applications" ON applications
  FOR SELECT USING (student_id = auth.uid());

-- Students can apply (insert)
CREATE POLICY "Students can create applications" ON applications
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Students can update their own applications
CREATE POLICY "Students can update own applications" ON applications
  FOR UPDATE USING (student_id = auth.uid());

-- Companies can read applications for their internships
CREATE POLICY "Companies can read applications for their internships" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM internships
      WHERE internships.id = applications.internship_id
      AND internships.company_id = auth.uid()
    )
  );

-- Companies can update applications for their internships
CREATE POLICY "Companies can update applications for their internships" ON applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM internships
      WHERE internships.id = applications.internship_id
      AND internships.company_id = auth.uid()
    )
  );

-- ============================================================
-- FAVORITES policies
-- ============================================================
-- Students can manage their own favorites
CREATE POLICY "Students can manage own favorites" ON favorites
  FOR ALL USING (student_id = auth.uid());

-- ============================================================
-- ANNOUNCEMENTS policies
-- ============================================================
-- Announcements are publicly readable
CREATE POLICY "Announcements are publicly readable" ON announcements
  FOR SELECT USING (true);

-- Only admins can manage announcements
CREATE POLICY "Only admins can manage announcements" ON announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- SKILL_STATS policies
-- ============================================================
-- Skill stats are publicly readable
CREATE POLICY "Skill stats are publicly readable" ON skill_stats
  FOR SELECT USING (true);

-- Anyone can insert/update skill stats (used by companies posting internships)
CREATE POLICY "Anyone can manage skill stats" ON skill_stats
  FOR ALL USING (true);
