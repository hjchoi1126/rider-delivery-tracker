import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Supabase 환경변수 설정 여부 */
export const IsSupabaseConfiguredLogic = (): boolean =>
  Boolean(supabaseUrl && supabaseAnonKey);

let supabaseInstance: SupabaseClient | null = null;

/** 설정된 Supabase 클라이언트 반환 */
export const GetSupabaseLogic = (): SupabaseClient => {
  if (!IsSupabaseConfiguredLogic()) {
    throw new Error(
      'Supabase 환경변수가 설정되지 않았습니다. VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 .env 파일에 추가해 주세요.',
    );
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseInstance;
};

/** deliveries 테이블 Row 타입 */
export interface DeliveryRow {
  id: string;
  user_id: string;
  work_date: string;
  call_count: number;
  total_income: number;
  memo: string | null;
  created_at: string;
}

export interface DeliveryInsert {
  user_id: string;
  work_date: string;
  call_count?: number;
  total_income?: number;
  memo?: string | null;
}

export interface DeliveryUpdate {
  call_count?: number;
  total_income?: number;
  memo?: string | null;
}
