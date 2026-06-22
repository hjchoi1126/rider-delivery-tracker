import dayjs from 'dayjs';
import {
  GetSupabaseLogic,
  type DeliveryInsert,
  type DeliveryRow,
  type ExpenseInsert,
  type ExpenseRow,
} from '../supabaseClient';
import type {
  DeliveryRecord,
  DeliveryRecordMap,
  DeliveryServiceResult,
  ExpenseBreakdown,
  ExpenseRecord,
  FetchMonthlyDataResult,
  MonthlySummary,
  PlatformIncome,
  PlatformKey,
  UpsertDayInput,
  UpsertDeliveryInput,
  UpsertExpenseInput,
  WorkDate,
  YearMonth,
} from '../types/delivery';
import { EMPTY_PLATFORM_INCOME, PLATFORM_KEYS, PLATFORM_LABELS } from '../types/delivery';

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

export const SumExpenseLogic = (breakdown: ExpenseBreakdown): number =>
  breakdown.fuel +
  breakdown.maintenance +
  breakdown.insurance +
  breakdown.food +
  breakdown.lease +
  breakdown.other;

type PlatformDbColumn =
  | 'platform_baemin'
  | 'platform_coupang'
  | 'platform_yogiyo'
  | 'platform_ddangyo'
  | 'platform_ubereats'
  | 'platform_agency';

const PLATFORM_DB_COLUMNS: Record<PlatformKey, PlatformDbColumn> = {
  baemin: 'platform_baemin',
  coupang: 'platform_coupang',
  yogiyo: 'platform_yogiyo',
  ddangyo: 'platform_ddangyo',
  ubereats: 'platform_ubereats',
  agency: 'platform_agency',
};

export const SumPlatformIncomeLogic = (platformIncome: PlatformIncome): number =>
  PLATFORM_KEYS.reduce((sum, key) => sum + platformIncome[key], 0);

export const GetActivePlatformLabelsLogic = (platformIncome: PlatformIncome): string =>
  PLATFORM_KEYS.filter((key) => platformIncome[key] > 0)
    .map((key) => PLATFORM_LABELS[key])
    .join(', ');

export const MapPlatformIncomeFromRowLogic = (row: DeliveryRow): PlatformIncome => {
  const platformIncome = { ...EMPTY_PLATFORM_INCOME };
  for (const key of PLATFORM_KEYS) {
    const column = PLATFORM_DB_COLUMNS[key];
    platformIncome[key] = Number(row[column] ?? 0);
  }
  return platformIncome;
};

export const MapPlatformIncomeToInsertLogic = (
  platformIncome: PlatformIncome,
): Pick<DeliveryInsert, PlatformDbColumn> => {
  const payload = {} as Pick<DeliveryInsert, PlatformDbColumn>;
  for (const key of PLATFORM_KEYS) {
    payload[PLATFORM_DB_COLUMNS[key]] = platformIncome[key];
  }
  return payload;
};

export const MapRowToRecordLogic = (row: DeliveryRow): DeliveryRecord => ({
  id: row.id,
  userId: row.user_id,
  workDate: row.work_date as WorkDate,
  callCount: row.call_count,
  totalIncome: Number(row.total_income),
  platformIncome: MapPlatformIncomeFromRowLogic(row),
  memo: row.memo ?? '',
  createdAt: row.created_at,
});

export const MapExpenseRowToRecordLogic = (row: ExpenseRow): ExpenseRecord => {
  const breakdown: ExpenseBreakdown = {
    fuel: Number(row.fuel),
    maintenance: Number(row.maintenance),
    insurance: Number(row.insurance),
    food: Number(row.food),
    lease: Number(row.lease),
    other: Number(row.other),
  };

  return {
    id: row.id,
    userId: row.user_id,
    workDate: row.work_date as WorkDate,
    breakdown,
    totalExpense: SumExpenseLogic(breakdown),
    memo: row.memo ?? '',
    createdAt: row.created_at,
  };
};

export const MergeRecordMapLogic = (
  deliveries: DeliveryRecord[],
  expenses: ExpenseRecord[],
): DeliveryRecordMap => {
  const map: DeliveryRecordMap = {} as DeliveryRecordMap;

  for (const record of deliveries) {
    map[record.workDate] = {
      count: record.callCount,
      income: record.totalIncome,
      expense: 0,
      netProfit: record.totalIncome,
      memo: record.memo,
      platformIncome: record.platformIncome,
    };
  }

  for (const expense of expenses) {
    const existing = map[expense.workDate];
    if (existing) {
      existing.expense = expense.totalExpense;
      existing.netProfit = existing.income - expense.totalExpense;
    } else {
      map[expense.workDate] = {
        count: 0,
        income: 0,
        expense: expense.totalExpense,
        netProfit: -expense.totalExpense,
        memo: expense.memo,
        platformIncome: { ...EMPTY_PLATFORM_INCOME },
      };
    }
  }

  return map;
};

export const CalcMonthlySummaryLogic = (
  deliveries: DeliveryRecord[],
  expenses: ExpenseRecord[],
): MonthlySummary => {
  const deliverySummary = deliveries.reduce(
    (acc, record) => {
      const platformIncome = { ...acc.platformIncome };
      for (const key of PLATFORM_KEYS) {
        platformIncome[key] += record.platformIncome[key];
      }
      return {
        totalIncome: acc.totalIncome + record.totalIncome,
        totalCount: acc.totalCount + record.callCount,
        platformIncome,
      };
    },
    {
      totalIncome: 0,
      totalCount: 0,
      platformIncome: { ...EMPTY_PLATFORM_INCOME },
    },
  );

  const totalExpense = expenses.reduce((sum, record) => sum + record.totalExpense, 0);

  return {
    totalIncome: deliverySummary.totalIncome,
    totalExpense,
    netProfit: deliverySummary.totalIncome - totalExpense,
    totalCount: deliverySummary.totalCount,
    platformIncome: deliverySummary.platformIncome,
  };
};

/**
 * 유저 ID + 년-월 기준 해당 월 전체 배달·지출 기록 조회
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
    const supabase = GetSupabaseLogic();

    const [deliveryResult, expenseResult] = await Promise.all([
      supabase
        .from('deliveries')
        .select('*')
        .eq('user_id', userId)
        .gte('work_date', start)
        .lte('work_date', end)
        .order('work_date', { ascending: true }),
      supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .gte('work_date', start)
        .lte('work_date', end)
        .order('work_date', { ascending: true }),
    ]);

    if (deliveryResult.error) {
      return { data: null, error: deliveryResult.error.message };
    }

    if (expenseResult.error) {
      return { data: null, error: expenseResult.error.message };
    }

    const records = (deliveryResult.data ?? []).map((row) =>
      MapRowToRecordLogic(row as DeliveryRow),
    );
    const expenseRecords = (expenseResult.data ?? []).map((row) =>
      MapExpenseRowToRecordLogic(row as ExpenseRow),
    );
    const recordMap = MergeRecordMapLogic(records, expenseRecords);
    const summary = CalcMonthlySummaryLogic(records, expenseRecords);

    return {
      data: { records, expenseRecords, recordMap, summary },
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
    const platformIncome = input.platformIncome ?? EMPTY_PLATFORM_INCOME;

    if (input.callCount < 0 || input.totalIncome < 0) {
      return { data: null, error: '건수와 수입은 0 이상이어야 합니다.' };
    }

    const payload: DeliveryInsert = {
      user_id: input.userId,
      work_date: workDate,
      call_count: input.callCount,
      total_income: input.totalIncome,
      ...MapPlatformIncomeToInsertLogic(platformIncome),
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

export async function upsertExpenseData(
  input: UpsertExpenseInput,
): Promise<DeliveryServiceResult<ExpenseRecord>> {
  try {
    if (!input.userId.trim()) {
      return { data: null, error: 'userId가 비어 있습니다.' };
    }

    const workDate = AssertWorkDateLogic(input.workDate);
    const breakdown = input.breakdown;

    const payload: ExpenseInsert = {
      user_id: input.userId,
      work_date: workDate,
      fuel: breakdown.fuel,
      maintenance: breakdown.maintenance,
      insurance: breakdown.insurance,
      food: breakdown.food,
      lease: breakdown.lease,
      other: breakdown.other,
      memo: input.memo?.trim() || null,
    };

    const { data, error } = await GetSupabaseLogic()
      .from('expenses')
      .upsert(payload, { onConflict: 'user_id,work_date' })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: MapExpenseRowToRecordLogic(data as ExpenseRow), error: null };
  } catch (error) {
    return { data: null, error: ToErrorMessageLogic(error) };
  }
}

export async function deleteExpenseData(
  userId: string,
  workDate: WorkDate,
): Promise<DeliveryServiceResult<null>> {
  try {
    if (!userId.trim()) {
      return { data: null, error: 'userId가 비어 있습니다.' };
    }

    const validWorkDate = AssertWorkDateLogic(workDate);

    const { error } = await GetSupabaseLogic()
      .from('expenses')
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

export async function upsertDayData(
  input: UpsertDayInput,
): Promise<DeliveryServiceResult<{ delivery: DeliveryRecord | null; expense: ExpenseRecord | null }>> {
  let delivery: DeliveryRecord | null = null;
  let expense: ExpenseRecord | null = null;

  if (input.delivery) {
    const deliveryResult = await upsertDeliveryData(input.delivery);
    if (deliveryResult.error) {
      return { data: null, error: deliveryResult.error };
    }
    delivery = deliveryResult.data;
  } else {
    const deleteResult = await deleteDeliveryData(input.userId, input.workDate);
    if (deleteResult.error) {
      return { data: null, error: deleteResult.error };
    }
  }

  if (input.expense) {
    const expenseResult = await upsertExpenseData(input.expense);
    if (expenseResult.error) {
      return { data: null, error: expenseResult.error };
    }
    expense = expenseResult.data;
  } else {
    const deleteResult = await deleteExpenseData(input.userId, input.workDate);
    if (deleteResult.error) {
      return { data: null, error: deleteResult.error };
    }
  }

  return { data: { delivery, expense }, error: null };
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
