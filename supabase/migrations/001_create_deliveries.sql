-- ============================================================
-- deliveries: 라이더 일자별 배달 건수·수입 기록 테이블
-- Supabase SQL Editor 또는 migration으로 실행
-- ============================================================

CREATE TABLE IF NOT EXISTS public.deliveries (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL,
  work_date     DATE        NOT NULL,
  call_count    INTEGER     NOT NULL DEFAULT 0
                            CHECK (call_count >= 0),
  total_income  BIGINT      NOT NULL DEFAULT 0
                            CHECK (total_income >= 0),
  memo          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 동일 라이더·동일 날짜 중복 기록 방지
  CONSTRAINT deliveries_user_date_unique UNIQUE (user_id, work_date)
);

COMMENT ON TABLE  public.deliveries              IS '라이더 일자별 배달 건수·수입 기록';
COMMENT ON COLUMN public.deliveries.user_id      IS '유저 구분 코드';
COMMENT ON COLUMN public.deliveries.work_date    IS '근무일 (YYYY-MM-DD)';
COMMENT ON COLUMN public.deliveries.call_count   IS '배달 건수';
COMMENT ON COLUMN public.deliveries.total_income IS '총 수입 (원)';
COMMENT ON COLUMN public.deliveries.memo         IS '한 줄 메모';

-- 조회 성능용 인덱스
CREATE INDEX IF NOT EXISTS idx_deliveries_user_id
  ON public.deliveries (user_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_work_date
  ON public.deliveries (work_date);

CREATE INDEX IF NOT EXISTS idx_deliveries_user_work_date
  ON public.deliveries (user_id, work_date DESC);

-- Row Level Security (Supabase Auth 연동 시 활성화 권장)
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- 예시 정책: Supabase Auth UUID를 user_id로 사용하는 경우
-- auth.uid()::text 와 user_id 컬럼을 매핑해 사용합니다.
-- CREATE POLICY "deliveries_select_own"
--   ON public.deliveries FOR SELECT
--   USING (auth.uid()::text = user_id);
--
-- CREATE POLICY "deliveries_insert_own"
--   ON public.deliveries FOR INSERT
--   WITH CHECK (auth.uid()::text = user_id);
--
-- CREATE POLICY "deliveries_update_own"
--   ON public.deliveries FOR UPDATE
--   USING (auth.uid()::text = user_id)
--   WITH CHECK (auth.uid()::text = user_id);
--
-- CREATE POLICY "deliveries_delete_own"
--   ON public.deliveries FOR DELETE
--   USING (auth.uid()::text = user_id);
