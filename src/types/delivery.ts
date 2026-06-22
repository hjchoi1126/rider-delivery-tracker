/** YYYY-MM 형식 (예: '2026-06') */
export type YearMonth = `${number}-${number}`;

/** YYYY-MM-DD 형식 (예: '2026-06-22') */
export type WorkDate = `${number}-${number}-${number}`;

export type PlatformKey =
  | 'baemin'
  | 'coupang'
  | 'yogiyo'
  | 'ddangyo'
  | 'ubereats'
  | 'agency';

export interface PlatformIncome {
  baemin: number;
  coupang: number;
  yogiyo: number;
  ddangyo: number;
  ubereats: number;
  agency: number;
}

export interface ExpenseBreakdown {
  fuel: number;
  maintenance: number;
  insurance: number;
  food: number;
  lease: number;
  other: number;
}

export const PLATFORM_KEYS: PlatformKey[] = [
  'baemin',
  'coupang',
  'yogiyo',
  'ddangyo',
  'ubereats',
  'agency',
];

export const EMPTY_PLATFORM_INCOME: PlatformIncome = {
  baemin: 0,
  coupang: 0,
  yogiyo: 0,
  ddangyo: 0,
  ubereats: 0,
  agency: 0,
};

export const EMPTY_EXPENSE: ExpenseBreakdown = {
  fuel: 0,
  maintenance: 0,
  insurance: 0,
  food: 0,
  lease: 0,
  other: 0,
};

export const PLATFORM_LABELS: Record<PlatformKey, string> = {
  baemin: '배민',
  coupang: '쿠팡',
  yogiyo: '요기요',
  ddangyo: '땡겨요',
  ubereats: '우버이츠',
  agency: '대행',
};

export const EXPENSE_LABELS: Record<keyof ExpenseBreakdown, string> = {
  fuel: '주유비',
  maintenance: '정비비',
  insurance: '보험료',
  food: '식비',
  lease: '리스료',
  other: '기타',
};

/** Supabase deliveries 테이블 ↔ 앱 도메인 매핑 타입 */
export interface DeliveryRecord {
  id: string;
  userId: string;
  workDate: WorkDate;
  callCount: number;
  totalIncome: number;
  platformIncome: PlatformIncome;
  memo: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  userId: string;
  workDate: WorkDate;
  breakdown: ExpenseBreakdown;
  totalExpense: number;
  memo: string;
  createdAt: string;
}

/** upsertDeliveryData 입력 타입 */
export interface UpsertDeliveryInput {
  userId: string;
  workDate: WorkDate;
  callCount: number;
  totalIncome: number;
  platformIncome?: PlatformIncome;
  memo?: string | null;
}

export interface UpsertExpenseInput {
  userId: string;
  workDate: WorkDate;
  breakdown: ExpenseBreakdown;
  memo?: string | null;
}

export interface UpsertDayInput {
  userId: string;
  workDate: WorkDate;
  delivery: UpsertDeliveryInput | null;
  expense: UpsertExpenseInput | null;
}

/** 월별 상단 통계 */
export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  totalCount: number;
  platformIncome: PlatformIncome;
}

/** 달력 타일 렌더링용 일별 요약 */
export interface CalendarDayRecord {
  count: number;
  income: number;
  expense: number;
  netProfit: number;
  memo: string;
  platformIncome: PlatformIncome;
}

export type DeliveryRecordMap = Record<WorkDate, CalendarDayRecord>;

/** fetchMonthlyData 반환 타입 */
export interface FetchMonthlyDataResult {
  records: DeliveryRecord[];
  expenseRecords: ExpenseRecord[];
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
  expenseRecords: ExpenseRecord[];
  recordMap: DeliveryRecordMap;
  summary: MonthlySummary;
  loading: boolean;
  saving: boolean;
  error: string | null;
  yearMonth: YearMonth;
  setYearMonth: (yearMonth: YearMonth) => void;
  refetch: () => Promise<void>;
  upsertDayData: (input: UpsertDayInput) => Promise<boolean>;
  upsertDeliveryData: (data: UpsertDeliveryInput) => Promise<boolean>;
  deleteDeliveryData: (workDate: WorkDate) => Promise<boolean>;
  clearError: () => void;
}
