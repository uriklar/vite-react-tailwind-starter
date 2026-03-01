CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  bracket jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS official_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  results jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);
