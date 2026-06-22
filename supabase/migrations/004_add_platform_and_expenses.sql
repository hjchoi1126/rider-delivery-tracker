-- 플랫폼별 수입 + 일자별 지출 테이블

ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS platform_baemin BIGINT NOT NULL DEFAULT 0 CHECK (platform_baemin >= 0),
  ADD COLUMN IF NOT EXISTS platform_coupang BIGINT NOT NULL DEFAULT 0 CHECK (platform_coupang >= 0),
  ADD COLUMN IF NOT EXISTS platform_agency BIGINT NOT NULL DEFAULT 0 CHECK (platform_agency >= 0);

CREATE TABLE IF NOT EXISTS public.expenses (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL,
  work_date     DATE        NOT NULL,
  fuel          BIGINT      NOT NULL DEFAULT 0 CHECK (fuel >= 0),
  maintenance   BIGINT      NOT NULL DEFAULT 0 CHECK (maintenance >= 0),
  insurance     BIGINT      NOT NULL DEFAULT 0 CHECK (insurance >= 0),
  food          BIGINT      NOT NULL DEFAULT 0 CHECK (food >= 0),
  lease         BIGINT      NOT NULL DEFAULT 0 CHECK (lease >= 0),
  other         BIGINT      NOT NULL DEFAULT 0 CHECK (other >= 0),
  memo          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT expenses_user_date_unique UNIQUE (user_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses (user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_work_date ON public.expenses (work_date);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.expenses TO anon, authenticated;

DROP POLICY IF EXISTS "expenses_anon_select" ON public.expenses;
DROP POLICY IF EXISTS "expenses_anon_insert" ON public.expenses;
DROP POLICY IF EXISTS "expenses_anon_update" ON public.expenses;
DROP POLICY IF EXISTS "expenses_anon_delete" ON public.expenses;

CREATE POLICY "expenses_anon_select"
  ON public.expenses FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "expenses_anon_insert"
  ON public.expenses FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "expenses_anon_update"
  ON public.expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "expenses_anon_delete"
  ON public.expenses FOR DELETE TO anon, authenticated USING (true);
