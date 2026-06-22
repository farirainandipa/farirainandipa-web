-- Articles table for Insights blog posts
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_published BOOLEAN DEFAULT true
);

-- Contact submissions table
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  service TEXT NOT NULL,
  message TEXT NOT NULL,
  submission_type TEXT NOT NULL DEFAULT 'enquiry',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table for configurable service categories
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  display_order INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service items table (individual services within each category)
CREATE TABLE service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for articles (public read, authenticated write)
CREATE POLICY "select_articles_public" ON articles FOR SELECT
  TO public USING (is_published = true);

CREATE POLICY "select_all_articles_authenticated" ON articles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_articles_authenticated" ON articles FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_articles_authenticated" ON articles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_articles_authenticated" ON articles FOR DELETE
  TO authenticated USING (true);

-- RLS Policies for contact_submissions (only authenticated can read)
CREATE POLICY "insert_contact_submissions_public" ON contact_submissions FOR INSERT
  TO public WITH CHECK (true);

CREATE POLICY "select_contact_submissions_authenticated" ON contact_submissions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "update_contact_submissions_authenticated" ON contact_submissions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_contact_submissions_authenticated" ON contact_submissions FOR DELETE
  TO authenticated USING (true);

-- RLS Policies for services (public read, authenticated write)
CREATE POLICY "select_services_public" ON services FOR SELECT
  TO public USING (is_active = true);

CREATE POLICY "select_all_services_authenticated" ON services FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_services_authenticated" ON services FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_services_authenticated" ON services FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_services_authenticated" ON services FOR DELETE
  TO authenticated USING (true);

-- RLS Policies for service_items (public read, authenticated write)
CREATE POLICY "select_service_items_public" ON service_items FOR SELECT
  TO public USING (true);

CREATE POLICY "insert_service_items_authenticated" ON service_items FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_service_items_authenticated" ON service_items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_service_items_authenticated" ON service_items FOR DELETE
  TO authenticated USING (true);

-- Index for faster slug lookups
CREATE INDEX articles_slug_idx ON articles(slug);
CREATE INDEX contact_submissions_status_idx ON contact_submissions(status);
CREATE INDEX services_category_key_idx ON services(category_key);
CREATE INDEX service_items_service_id_idx ON service_items(service_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();