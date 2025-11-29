-- =============================================
-- TruTrace Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'analyst' CHECK (role IN ('analyst', 'admin', 'viewer')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  report_type TEXT CHECK (report_type IN ('Weekly Summary', 'Monthly Analysis', 'Custom Report', 'Threat Advisory')),
  priority TEXT CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Under Review', 'Completed', 'Archived')),
  source TEXT CHECK (source IN ('OSINT', 'IMAGERY', 'NEWSFEED', 'SIGINT', 'HUMINT')),
  analyst_id UUID REFERENCES users(id) ON DELETE SET NULL,
  region TEXT,
  report_id TEXT UNIQUE NOT NULL,
  file_size TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#4a9eff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report tags junction table
CREATE TABLE IF NOT EXISTS report_tags (
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (report_id, tag_id)
);

-- Attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  total_reports INTEGER DEFAULT 0,
  new_threats INTEGER DEFAULT 0,
  high_priority_alerts INTEGER DEFAULT 0,
  report_volume INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_analyst_id ON reports(analyst_id);
CREATE INDEX IF NOT EXISTS idx_comments_report_id ON comments(report_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_report_id ON attachments(report_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Reports policies
CREATE POLICY "Anyone can view reports"
  ON reports FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own reports"
  ON reports FOR UPDATE
  USING (analyst_id = auth.uid());

CREATE POLICY "Admins can delete reports"
  ON reports FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Tags policies
CREATE POLICY "Anyone can view tags"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage tags"
  ON tags FOR ALL
  USING (auth.role() = 'authenticated');

-- Report tags policies
CREATE POLICY "Anyone can view report tags"
  ON report_tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage report tags"
  ON report_tags FOR ALL
  USING (auth.role() = 'authenticated');

-- Comments policies
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (user_id = auth.uid());

-- Attachments policies
CREATE POLICY "Anyone can view attachments"
  ON attachments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can upload attachments"
  ON attachments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Analytics policies
CREATE POLICY "Anyone can view analytics"
  ON analytics FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage analytics"
  ON analytics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SEED DATA
-- =============================================

-- Insert default user
INSERT INTO users (email, full_name, role, avatar_url) VALUES
('alex.mercer@trutrace.com', 'Alex Mercer', 'analyst', NULL)
ON CONFLICT (email) DO NOTHING;

-- Insert sample tags
INSERT INTO tags (name, color) VALUES
('Cybersecurity', '#4a9eff'),
('Region-X', '#4a9eff'),
('Threat Actor-Y', '#d93025'),
('OSINT', '#34a853'),
('IMAGERY', '#fbbc04')
ON CONFLICT (name) DO NOTHING;

-- Insert sample reports
INSERT INTO reports (
  title, 
  description, 
  content,
  report_type,
  priority, 
  status, 
  source, 
  region, 
  report_id,
  analyst_id
) 
SELECT
  'Cyber Threat Advisory: Project Chimera',
  'A new state-sponsored threat actor, codenamed "Project Chimera", has been identified targeting financial institutions across North America.',
  'This report details the findings of Operation Nightfall, a comprehensive threat analysis initiative focused on identifying emerging cybersecurity risks targeting the financial sector in Q4.',
  'Threat Advisory',
  'Critical',
  'Active',
  'OSINT',
  'North America',
  'CTA-2024-0921',
  id
FROM users WHERE email = 'alex.mercer@trutrace.com'
ON CONFLICT (report_id) DO NOTHING;

INSERT INTO reports (
  title, 
  description, 
  content,
  report_type,
  priority, 
  status, 
  source, 
  region, 
  report_id,
  analyst_id
)
SELECT
  'Geopolitical Brief: East Asia Tensions',
  'Recent naval exercises in the South China Sea have escalated regional tensions. Satellite imagery confirms the deployment of...',
  'Analysis of recent geopolitical developments in the East Asia region.',
  'Custom Report',
  'High',
  'Under Review',
  'IMAGERY',
  'East Asia',
  'GPB-2024-0920',
  id
FROM users WHERE email = 'alex.mercer@trutrace.com'
ON CONFLICT (report_id) DO NOTHING;

-- Insert analytics data
INSERT INTO analytics (date, total_reports, new_threats, high_priority_alerts, report_volume) VALUES
(CURRENT_DATE, 1204, 87, 15, 892),
(CURRENT_DATE - INTERVAL '1 day', 1192, 85, 18, 877),
(CURRENT_DATE - INTERVAL '2 days', 1180, 83, 16, 865)
ON CONFLICT (date) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'TruTrace database schema created successfully!';
  RAISE NOTICE 'Sample data inserted.';
  RAISE NOTICE 'You can now connect your application.';
END $$;
