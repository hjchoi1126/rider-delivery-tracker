import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { SumPlatformIncomeLogic } from '../services/deliveryService';
import { FormatCurrencyLogic } from '../lib/format';
import type {
  DeliveryRecord,
  ExpenseBreakdown,
  ExpenseRecord,
  PlatformIncome,
  PlatformKey,
} from '../types/delivery';
import {
  EMPTY_EXPENSE,
  EMPTY_PLATFORM_INCOME,
  EXPENSE_LABELS,
  PLATFORM_KEYS,
  PLATFORM_LABELS,
} from '../types/delivery';

type ModalTab = 'income' | 'expense';

const CreateEmptyPlatformChecksLogic = (): Record<PlatformKey, boolean> =>
  Object.fromEntries(PLATFORM_KEYS.map((key) => [key, false])) as Record<PlatformKey, boolean>;
const EXPENSE_KEYS = Object.keys(EXPENSE_LABELS) as (keyof ExpenseBreakdown)[];

interface EntryModalProps {
  open: boolean;
  selectedDate: Date;
  saving: boolean;
  delivery?: DeliveryRecord;
  expense?: ExpenseRecord;
  onClose: () => void;
  onSave: (payload: {
    callCount: number;
    totalIncome: number;
    platformIncome: PlatformIncome;
    memo: string;
    expenseBreakdown: ExpenseBreakdown;
    expenseMemo: string;
  }) => Promise<void>;
}

export function EntryModal({
  open,
  selectedDate,
  saving,
  delivery,
  expense,
  onClose,
  onSave,
}: EntryModalProps) {
  const [modalTab, setModalTab] = useState<ModalTab>('income');
  const [amount, setAmount] = useState('0');
  const [formCount, setFormCount] = useState('');
  const [formMemo, setFormMemo] = useState('');
  const [platformChecks, setPlatformChecks] = useState<Record<PlatformKey, boolean>>(
    CreateEmptyPlatformChecksLogic,
  );
  const [platformAmounts, setPlatformAmounts] = useState<PlatformIncome>({
    ...EMPTY_PLATFORM_INCOME,
  });
  const [selectedExpenseKey, setSelectedExpenseKey] = useState<keyof ExpenseBreakdown>('fuel');
  const [formExpense, setFormExpense] = useState<ExpenseBreakdown>({ ...EMPTY_EXPENSE });
  const [formExpenseMemo, setFormExpenseMemo] = useState('');

  useEffect(() => {
    if (!open) return;

    setModalTab('income');
    setFormCount(delivery ? String(delivery.callCount) : '');
    setFormMemo(delivery?.memo ?? '');
    setAmount(delivery ? String(delivery.totalIncome) : '0');

    const nextChecks = Object.fromEntries(
      PLATFORM_KEYS.map((key) => [key, (delivery?.platformIncome[key] ?? 0) > 0]),
    ) as Record<PlatformKey, boolean>;
    setPlatformChecks(nextChecks);
    setPlatformAmounts(delivery?.platformIncome ?? { ...EMPTY_PLATFORM_INCOME });
    setFormExpense(expense?.breakdown ?? { ...EMPTY_EXPENSE });
    setFormExpenseMemo(expense?.memo ?? '');
    setSelectedExpenseKey('fuel');
  }, [open, delivery, expense]);

  const BuildPlatformIncomeLogic = (): PlatformIncome => {
    const result = { ...EMPTY_PLATFORM_INCOME };
    for (const key of PLATFORM_KEYS) {
      if (platformChecks[key]) {
        result[key] = Number(platformAmounts[key]) || 0;
      }
    }
    return result;
  };

  const AppendNumLogic = (num: string) => {
    setAmount((prev) => {
      if (prev === '0') return num === '00' ? '0' : num;
      if (prev.length >= 9) return prev;
      return prev + num;
    });
  };

  const BackspaceLogic = () => {
    setAmount((prev) => {
      const next = prev.slice(0, -1);
      return next === '' ? '0' : next;
    });
  };

  const TogglePlatformLogic = (key: PlatformKey) => {
    setPlatformChecks((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next[key]) {
        setPlatformAmounts((amounts) => ({ ...amounts, [key]: 0 }));
      }
      return next;
    });
  };

  const SaveLogic = useCallback(async () => {
    const platformIncome = BuildPlatformIncomeLogic();
    const platformSum = SumPlatformIncomeLogic(platformIncome);
    const totalIncome = platformSum > 0 ? platformSum : Number(amount) || 0;
    const callCount = Number(formCount) || 0;

    if (modalTab === 'expense') {
      const expenseAmount = Number(amount) || 0;
      const nextExpense = { ...formExpense, [selectedExpenseKey]: expenseAmount };
      await onSave({
        callCount,
        totalIncome,
        platformIncome,
        memo: formMemo.trim(),
        expenseBreakdown: nextExpense,
        expenseMemo: formExpenseMemo.trim(),
      });
      return;
    }

    await onSave({
      callCount,
      totalIncome,
      platformIncome,
      memo: formMemo.trim(),
      expenseBreakdown: formExpense,
      expenseMemo: formExpenseMemo.trim(),
    });
  }, [
    amount,
    formCount,
    formMemo,
    formExpense,
    formExpenseMemo,
    modalTab,
    selectedExpenseKey,
    platformChecks,
    platformAmounts,
    onSave,
  ]);

  if (!open) return null;

  const platformSumPreview = SumPlatformIncomeLogic(BuildPlatformIncomeLogic());
  const displayAmount = Number(amount) || 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-surface"
      role="dialog"
      aria-modal="true"
    >
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-outline/30 bg-surface-container-high">
            <span className="material-symbols-outlined text-primary">edit_note</span>
          </div>
          <h1 className="text-lg font-bold text-on-surface">새 내역 입력</h1>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-xl px-3 py-1 text-sm text-on-surface-variant transition hover:bg-surface-container-low"
        >
          취소
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-36">
        <div className="px-container-padding pt-6">
          <p className="mb-2 text-center text-xs text-on-surface-variant">
            {dayjs(selectedDate).format('YYYY년 M월 D일')}
          </p>
          <div className="flex w-full rounded-xl bg-surface-container-low p-1">
            <button
              type="button"
              onClick={() => setModalTab('income')}
              className={`flex-1 rounded-lg py-3 text-sm font-medium transition ${
                modalTab === 'income'
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              수입
            </button>
            <button
              type="button"
              onClick={() => setModalTab('expense')}
              className={`flex-1 rounded-lg py-3 text-sm font-medium transition ${
                modalTab === 'expense'
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              지출
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center px-container-padding py-8">
          <span className="mb-2 text-xs text-on-surface-variant">금액 입력</span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-primary">₩</span>
            <span className="text-4xl font-bold text-on-surface">
              {FormatCurrencyLogic(displayAmount)}
            </span>
          </div>
        </div>

        {modalTab === 'income' ? (
          <>
            <div className="no-scrollbar flex items-center gap-3 overflow-x-auto px-container-padding py-2">
              {PLATFORM_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => TogglePlatformLogic(key)}
                  className={`shrink-0 rounded-full border px-5 py-2 text-sm font-medium whitespace-nowrap transition ${
                    platformChecks[key]
                      ? 'border-primary-container bg-primary-fixed text-on-primary-fixed'
                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {PLATFORM_LABELS[key]}
                </button>
              ))}
            </div>
            {PLATFORM_KEYS.some((k) => platformChecks[k]) && (
              <div className="mt-4 space-y-2 px-container-padding">
                {PLATFORM_KEYS.filter((k) => platformChecks[k]).map((key) => (
                  <div key={key} className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-3">
                    <span className="text-sm font-medium">{PLATFORM_LABELS[key]}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={platformAmounts[key] || ''}
                      onChange={(e) =>
                        setPlatformAmounts((prev) => ({
                          ...prev,
                          [key]: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-28 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-right text-sm outline-none focus:border-primary"
                      placeholder="0"
                    />
                  </div>
                ))}
                {platformSumPreview > 0 && (
                  <p className="text-center text-xs text-primary">
                    플랫폼 합계: {FormatCurrencyLogic(platformSumPreview)}원
                  </p>
                )}
              </div>
            )}
            <div className="mt-4 px-container-padding">
              <label className="block">
                <span className="mb-1.5 block text-sm text-on-surface-variant">배달 건수</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={formCount}
                  onChange={(e) => setFormCount(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-on-surface outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="0"
                />
              </label>
            </div>
          </>
        ) : (
          <div className="no-scrollbar flex items-center gap-3 overflow-x-auto px-container-padding py-2">
            {EXPENSE_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedExpenseKey(key);
                  setAmount(String(formExpense[key] || 0));
                }}
                className={`shrink-0 rounded-full border px-5 py-2 text-sm font-medium whitespace-nowrap transition ${
                  selectedExpenseKey === key
                    ? 'border-primary-container bg-primary-fixed text-on-primary-fixed'
                    : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {EXPENSE_LABELS[key]}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 px-container-padding">
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 focus-within:ring-2 focus-within:ring-primary/20">
            <label className="mb-1 block text-xs text-on-surface-variant">메모</label>
            <input
              type="text"
              value={modalTab === 'income' ? formMemo : formExpenseMemo}
              onChange={(e) =>
                modalTab === 'income'
                  ? setFormMemo(e.target.value)
                  : setFormExpenseMemo(e.target.value)
              }
              placeholder="상세 내용을 입력하세요..."
              className="w-full border-none bg-transparent p-0 text-on-surface outline-none placeholder:text-outline"
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3 px-container-padding pb-8">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0'].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => AppendNumLogic(key)}
              className="h-14 rounded-xl bg-surface-container-low text-xl font-semibold text-on-surface transition active:bg-primary-container active:text-on-primary-container"
            >
              {key}
            </button>
          ))}
          <button
            type="button"
            onClick={BackspaceLogic}
            className="flex h-14 items-center justify-center rounded-xl bg-surface-container-low text-error transition active:bg-error-container"
          >
            <span className="material-symbols-outlined">backspace</span>
          </button>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-background via-background/90 to-transparent p-container-padding pt-8 pb-6">
        <button
          type="button"
          onClick={SaveLogic}
          disabled={saving}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary-container text-base font-bold text-on-primary-container shadow-lg transition active:scale-95 disabled:opacity-60"
        >
          <span className="material-symbols-outlined material-symbols-filled">save</span>
          {saving ? '저장 중...' : '내역 저장하기'}
        </button>
      </div>
    </div>
  );
}
