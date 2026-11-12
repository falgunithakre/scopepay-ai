/*
# Create scopes table for ScopePay AI

1. New Tables
- `scopes`
  - `id` (uuid, primary key, auto-generated)
  - `project_title` (text) — the title the client entered or the AI refined
  - `client_email` (text) — client contact email entered on the brief
  - `brief` (text) — the original plain-English project description
  - `summary` (text) — AI-generated structured summary of the work
  - `timeline_weeks` (integer) — estimated timeline in weeks from the AI
  - `total_usd` (numeric) — total price across all milestones
  - `milestones` (jsonb) — array of milestone objects: { id, title, deliverables: string[], amountUSD }
  - `payment_status` (text, default 'pending') — pending | milestone1_paid
  - `created_at` (timestamp)

2. Security
- Enable RLS on `scopes`.
- Grant SELECT, INSERT, UPDATE to `anon` and `authenticated` (single-tenant demo app, no sign-in screen).
- Policies allow anon + authenticated to select, insert, and update because scope documents are intentionally shared demo data.

3. Notes
- No user_id column: this app has no sign-in, so policies target `anon, authenticated`.
- Milestones stored as JSONB because they are read back as a whole document, never queried individually.
*/

CREATE TABLE IF NOT EXISTS scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_title text NOT NULL,
  client_email text NOT NULL,
  brief text NOT NULL,
  summary text NOT NULL,
  timeline_weeks integer NOT NULL DEFAULT 6,
  total_usd numeric NOT NULL DEFAULT 0,
  milestones jsonb NOT NULL DEFAULT '[]'::jsonb,
  payment_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE scopes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON scopes TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_scopes" ON scopes;
CREATE POLICY "anon_select_scopes" ON scopes
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_scopes" ON scopes;
CREATE POLICY "anon_insert_scopes" ON scopes
FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_scopes" ON scopes;
CREATE POLICY "anon_update_scopes" ON scopes
FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
