-- 요기요, 땡겨요, 우버이츠 플랫폼 컬럼 추가
ALTER TABLE deliveries
  ADD COLUMN IF NOT EXISTS platform_yogiyo BIGINT NOT NULL DEFAULT 0 CHECK (platform_yogiyo >= 0),
  ADD COLUMN IF NOT EXISTS platform_ddangyo BIGINT NOT NULL DEFAULT 0 CHECK (platform_ddangyo >= 0),
  ADD COLUMN IF NOT EXISTS platform_ubereats BIGINT NOT NULL DEFAULT 0 CHECK (platform_ubereats >= 0);
