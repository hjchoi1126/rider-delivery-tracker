import dayjs from 'dayjs';
import { GetSupabaseLogic, type DeliveryInsert, type DeliveryRow } from '../supabaseClient';
import type {
  DeliveryRecord,
  DeliveryRecordMap,
  DeliveryServiceResult,
  FetchMonthlyDataResult,
  MonthlySummary,
  UpsertDeliveryInput,
  WorkDate,
  YearMonth,
} from '../types/delivery';

const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const WORK_DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const ToErrorMessageLogic = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '알 수 없는 오류가 발생했습니다.';
};

export const ParseYearMonthLogic = (
  yearMonth: YearMonth,
): { start: WorkDate; end: WorkDate } => {
  if (!YEAR_MONTH_PATTERN.test(yearMonth)) {
    throw new Error(`yearMonth 형식이 올바르지 않습니다. (예: '2026-06') → ${yearMonth}`);
  }

  const month = dayjs(`${yearMonth}-01`);

  if (!month.isValid()) {
    throw new Error(`유효하지 않은 yearMonth입니다: ${yearMonth}`);
  }

  return {
    start: month.startOf('month').format('YYYY-MM-DD') as WorkDate,
    end: month.endOf('month').format('YYYY-MM-DD') as WorkDate,
  };
};

export const AssertWorkDateLogic = (workDate: string): WorkDate => {
  if (!WORK_DATE_PATTERN.test(workDate)) {
    throw new Error(`workDate 형식이 올바르지 않습니다. (예: '2026-06-22') → ${workDate}`);
  }
  return workDate as WorkDate;
};

export const MapRowToRecordLogic = (row: DeliveryRow): DeliveryRecord => ({
  id: row.id,
  userId: row.user_id,
  workDate: row.work_date as WorkDate,
  callCount: row.call_count,
  totalIncome: Number(row.total_income),
  memo: row.memo ?? '',
  createdAt: row.created_at,
});

export const ToRecordMapLogic = (records: DeliveryRecord[]): DeliveryRecordMap =>
  records.reduce<DeliveryRecordMap>((acc, record) => {
    acc[record.workDate] = {
      count: record.callCount,
      income: record.totalIncome,
      memo: record.memo,
    };
    return acc;
  }, {} as DeliveryRecordMap);

export const CalcMonthlySummaryLogic = (records: DeliveryRecord[]): MonthlySummary =>
  records.reduce<MonthlySummary>(
    (acc, record) => ({
      totalIncome: acc.totalIncome + record.totalIncome,
      totalCount: acc.totalCount + record.callCount,
    }),
    { totalIncome: 0, totalCount: 0 },
  );

/**
 * 유저 ID + 년-월 기준 해당 월 전체 배달 기록 조회
 */
export async function fetchMonthlyData(
  userId: string,
  yearMonth: YearMonth,
): Promise<DeliveryServiceResult<FetchMonthlyDataResult>> {
  try {
    if (!userId.trim()) {
      return { data: null, error: 'userId가 비어 있습니다.' };
    }

    const { start, end } = ParseYearMonthLogic(yearMonth);

    const { data, error } = await GetSupabaseLogic()
      .from('deliveries')
      .select('*')
      .eq('user_id', userId)
      .gte('work_date', start)
      .lte('work_date', end)
      .order('work_date', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    const records = (data ?? []).map(MapRowToRecordLogic);
    const recordMap = ToRecordMapLogic(records);
    const summary = CalcMonthlySummaryLogic(records);

    return {
      data: { records, recordMap, summary },
      error: null,
    };
  } catch (error) {
    return { data: null, error: ToErrorMessageLogic(error) };
  }
}

/**
 * 특정 날짜 배달 기록 upsert (있으면 Update, 없으면 Insert)
 */
export async function upsertDeliveryData(
  input: UpsertDeliveryInput,
): Promise<DeliveryServiceResult<DeliveryRecord>> {
  try {
    if (!input.userId.trim()) {
      return { data: null, error: 'userId가 비어 있습니다.' };
    }

    const workDate = AssertWorkDateLogic(input.workDate);

    if (input.callCount < 0 || input.totalIncome < 0) {
      return { data: null, error: '건수와 수입은 0 이상이어야 합니다.' };
    }

    const payload: DeliveryInsert = {
      user_id: input.userId,
      work_date: workDate,
      call_count: input.callCount,
      total_income: input.totalIncome,
      memo: input.memo?.trim() || null,
    };

    const { data, error } = await GetSupabaseLogic()
      .from('deliveries')
      .upsert(payload, { onConflict: 'user_id,work_date' })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: MapRowToRecordLogic(data as DeliveryRow), error: null };
  } catch (error) {
    return { data: null, error: ToErrorMessageLogic(error) };
  }
}

/**
 * 특정 날짜 배달 기록 삭제
 */
export async function deleteDeliveryData(
  userId: string,
  workDate: WorkDate,
): Promise<DeliveryServiceResult<null>> {
  try {
    if (!userId.trim()) {
      return { data: null, error: 'userId가 비어 있습니다.' };
    }

    const validWorkDate = AssertWorkDateLogic(workDate);

    const { error } = await GetSupabaseLogic()
      .from('deliveries')
      .delete()
      .eq('user_id', userId)
      .eq('work_date', validWorkDate);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: ToErrorMessageLogic(error) };
  }
}
