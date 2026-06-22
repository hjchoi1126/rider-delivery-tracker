/** YYYY-MM 형식 (예: '2026-06') */
export type YearMonth = `${number}-${number}`;

/** YYYY-MM-DD 형식 (예: '2026-06-22') */
export type WorkDate = `${number}-${number}-${number}`;

/** Supabase deliveries 테이블 ↔ 앱 도메인 매핑 타입 */
export interface DeliveryRecord {
  id: string;
  userId: string;
  workDate: WorkDate;
  callCount: number;
  totalIncome: number;
  memo: string;
  createdAt: string;
}

/** upsertDeliveryData 입력 타입 */
export interface UpsertDeliveryInput {
  userId: string;
  workDate: WorkDate;
  callCount: number;
  totalIncome: number;
  memo?: string | null;
}

/** 월별 상단 통계 */
export interface MonthlySummary {
  totalIncome: number;
  totalCount: number;
}

/** 달력 타일 렌더링용 일별 요약 */
export interface CalendarDayRecord {
  count: number;
  income: number;
  memo: string;
}

export type DeliveryRecordMap = Record<WorkDate, CalendarDayRecord>;

/** fetchMonthlyData 반환 타입 */
export interface FetchMonthlyDataResult {
  records: DeliveryRecord[];
  recordMap: DeliveryRecordMap;
  summary: MonthlySummary;
}

/** 서비스 함수 공통 결과 타입 */
export interface DeliveryServiceResult<T> {
  data: T | null;
  error: string | null;
}

/** useDeliveries 훅 반환 타입 */
export interface UseDeliveriesReturn {
  records: DeliveryRecord[];
  recordMap: DeliveryRecordMap;
  summary: MonthlySummary;
  loading: boolean;
  saving: boolean;
  error: string | null;
  yearMonth: YearMonth;
  setYearMonth: (yearMonth: YearMonth) => void;
  refetch: () => Promise<void>;
  upsertDeliveryData: (data: UpsertDeliveryInput) => Promise<boolean>;
  deleteDeliveryData: (workDate: WorkDate) => Promise<boolean>;
  clearError: () => void;
}
