-- FormsBrief Database Migration
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'single_choice', 'multiple_choice')),
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  parent_question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  trigger_option_id UUID -- will reference options(id), added after options table
);

CREATE TABLE IF NOT EXISTS options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Add foreign key for trigger_option_id after options table exists
ALTER TABLE questions
  ADD CONSTRAINT fk_trigger_option
  FOREIGN KEY (trigger_option_id) REFERENCES options(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  value TEXT NOT NULL DEFAULT ''
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_questions_form_id ON questions(form_id);
CREATE INDEX IF NOT EXISTS idx_options_question_id ON options(question_id);
CREATE INDEX IF NOT EXISTS idx_responses_form_id ON responses(form_id);
CREATE INDEX IF NOT EXISTS idx_answers_response_id ON answers(response_id);
CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Public read access to published forms and their questions/options
CREATE POLICY "Public can read published forms"
  ON forms FOR SELECT
  USING (is_published = true);

CREATE POLICY "Public can read questions of published forms"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = questions.form_id AND forms.is_published = true
    )
  );

CREATE POLICY "Public can read options of published form questions"
  ON options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN forms ON forms.id = questions.form_id
      WHERE questions.id = options.question_id AND forms.is_published = true
    )
  );

-- Public can insert responses and answers (anonymous submissions)
CREATE POLICY "Public can submit responses"
  ON responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms WHERE forms.id = responses.form_id AND forms.is_published = true
    )
  );

CREATE POLICY "Public can submit answers"
  ON answers FOR INSERT
  WITH CHECK (true);

-- Service role (admin) bypasses RLS, so no admin policies needed
-- The admin client uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
