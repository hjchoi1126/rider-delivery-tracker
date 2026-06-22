-- deliveries 테이블 권한 오류 수정
-- "permission denied for table deliveries" 발생 시 SQL Editor에서 실행

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.deliveries TO anon, authenticated;

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deliveries_anon_select" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_anon_insert" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_anon_update" ON public.deliveries;
DROP POLICY IF EXISTS "deliveries_anon_delete" ON public.deliveries;

CREATE POLICY "deliveries_anon_select"
  ON public.deliveries FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "deliveries_anon_insert"
  ON public.deliveries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "deliveries_anon_update"
  ON public.deliveries FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "deliveries_anon_delete"
  ON public.deliveries FOR DELETE
  TO anon, authenticated
  USING (true);
