-- MVP 단계: Supabase Auth 도입 전 anon/authenticated 클라이언트 CRUD 허용
-- Auth 연동 후 001_create_deliveries.sql 주석의 본인 데이터 정책으로 교체할 것

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
