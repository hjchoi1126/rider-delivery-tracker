import { useCallback, useEffect, useState } from 'react';
import {
  CalcMonthlySummaryLogic,
  deleteDeliveryData,
  fetchMonthlyData,
  MergeRecordMapLogic,
  upsertDayData,
  upsertDeliveryData,
} from '../services/deliveryService';
import type {
  DeliveryRecord,
  DeliveryRecordMap,
  ExpenseRecord,
  MonthlySummary,
  UpsertDayInput,
  UpsertDeliveryInput,
  UseDeliveriesReturn,
  WorkDate,
  YearMonth,
} from '../types/delivery';
import { EMPTY_PLATFORM_INCOME } from '../types/delivery';

const EMPTY_SUMMARY: MonthlySummary = {
  totalIncome: 0,
  totalExpense: 0,
  netProfit: 0,
  totalCount: 0,
  platformIncome: { ...EMPTY_PLATFORM_INCOME },
};

interface UseDeliveriesOptions {
  userId: string;
  initialYearMonth?: YearMonth;
}

export function useDeliveries({
  userId,
  initialYearMonth,
}: UseDeliveriesOptions): UseDeliveriesReturn {
  const [yearMonth, setYearMonth] = useState<YearMonth>(
    initialYearMonth ?? (new Date().toISOString().slice(0, 7) as YearMonth),
  );
  const [records, setRecords] = useState<DeliveryRecord[]>([]);
  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>([]);
  const [recordMap, setRecordMap] = useState<DeliveryRecordMap>({});
  const [summary, setSummary] = useState<MonthlySummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchMonthlyData(userId, yearMonth);

      if (result.error || !result.data) {
        setRecords([]);
        setExpenseRecords([]);
        setRecordMap({});
        setSummary(EMPTY_SUMMARY);
        setError(result.error ?? '데이터를 불러오지 못했습니다.');
        return;
      }

      setRecords(result.data.records);
      setExpenseRecords(result.data.expenseRecords);
      setRecordMap(result.data.recordMap);
      setSummary(result.data.summary);
    } catch (err) {
      setRecords([]);
      setExpenseRecords([]);
      setRecordMap({});
      setSummary(EMPTY_SUMMARY);
      setError(err instanceof Error ? err.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [userId, yearMonth]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const applyLocalStateLogic = useCallback(
    (nextRecords: DeliveryRecord[], nextExpenseRecords: ExpenseRecord[]) => {
      setRecords(nextRecords);
      setExpenseRecords(nextExpenseRecords);
      setRecordMap(MergeRecordMapLogic(nextRecords, nextExpenseRecords));
      setSummary(CalcMonthlySummaryLogic(nextRecords, nextExpenseRecords));
    },
    [],
  );

  const handleUpsertDayData = useCallback(
    async (input: UpsertDayInput): Promise<boolean> => {
      setSaving(true);
      setError(null);

      try {
        const result = await upsertDayData(input);

        if (result.error) {
          setError(result.error);
          return false;
        }

        const workDate = input.workDate;
        let nextRecords = records.filter((item) => item.workDate !== workDate);
        let nextExpenseRecords = expenseRecords.filter((item) => item.workDate !== workDate);

        if (result.data?.delivery) {
          nextRecords = [...nextRecords, result.data.delivery].sort((a, b) =>
            a.workDate.localeCompare(b.workDate),
          );
        }

        if (result.data?.expense) {
          nextExpenseRecords = [...nextExpenseRecords, result.data.expense].sort((a, b) =>
            a.workDate.localeCompare(b.workDate),
          );
        }

        applyLocalStateLogic(nextRecords, nextExpenseRecords);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [records, expenseRecords, applyLocalStateLogic],
  );

  const handleUpsertDeliveryData = useCallback(
    async (data: UpsertDeliveryInput): Promise<boolean> => {
      setSaving(true);
      setError(null);

      try {
        const result = await upsertDeliveryData(data);

        if (result.error || !result.data) {
          setError(result.error ?? '저장에 실패했습니다.');
          return false;
        }

        const saved = result.data;
        const nextRecords = [...records.filter((item) => item.workDate !== saved.workDate), saved].sort(
          (a, b) => a.workDate.localeCompare(b.workDate),
        );

        applyLocalStateLogic(nextRecords, expenseRecords);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [records, expenseRecords, applyLocalStateLogic],
  );

  const handleDeleteDeliveryData = useCallback(
    async (workDate: WorkDate): Promise<boolean> => {
      setSaving(true);
      setError(null);

      try {
        const result = await deleteDeliveryData(userId, workDate);

        if (result.error) {
          setError(result.error);
          return false;
        }

        const nextRecords = records.filter((item) => item.workDate !== workDate);
        applyLocalStateLogic(nextRecords, expenseRecords);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [userId, records, expenseRecords, applyLocalStateLogic],
  );

  return {
    records,
    expenseRecords,
    recordMap,
    summary,
    loading,
    saving,
    error,
    yearMonth,
    setYearMonth,
    refetch,
    upsertDayData: handleUpsertDayData,
    upsertDeliveryData: handleUpsertDeliveryData,
    deleteDeliveryData: handleDeleteDeliveryData,
    clearError,
  };
}

export { fetchMonthlyData, upsertDeliveryData } from '../services/deliveryService';
