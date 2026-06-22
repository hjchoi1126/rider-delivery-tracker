import { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import dayjs from 'dayjs';
import { FormatWonLogic } from '../lib/format';
import { GetActivePlatformLabelsLogic } from '../services/deliveryService';
import type {
  DeliveryRecord,
  DeliveryRecordMap,
  ExpenseRecord,
  MonthlySummary,
  WorkDate,
  YearMonth,
} from '../types/delivery';
import { EXPENSE_LABELS, PLATFORM_KEYS, PLATFORM_LABELS } from '../types/delivery';

type Filter = 'all' | 'income' | 'expense';

interface LedgerPageProps {
  summary: MonthlySummary;
  recordMap: DeliveryRecordMap;
  records: DeliveryRecord[];
  expenseRecords: ExpenseRecord[];
  yearMonth: YearMonth;
  loading: boolean;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (yearMonth: YearMonth) => void;
  onOpenEntry: (date?: Date) => void;
}

export function LedgerPage({
  summary,
  recordMap,
  records,
  expenseRecords,
  yearMonth,
  loading,
  selectedDate,
  onDateSelect,
  onMonthChange,
  onOpenEntry,
}: LedgerPageProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const activeMonth = dayjs(`${yearMonth}-01`);

  const transactions = useMemo(
    () => BuildTransactionListLogic(records, expenseRecords, filter),
    [records, expenseRecords, filter],
  );

  const grouped = useMemo(() => {
    const groups: Record<string, typeof transactions> = {};
    for (const tx of transactions) {
      if (!groups[tx.dateKey]) groups[tx.dateKey] = [];
      groups[tx.dateKey].push(tx);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions]);

  const TileClassNameLogic = ({ date }: { date: Date }) => {
    const key = dayjs(date).format('YYYY-MM-DD') as WorkDate;
    return recordMap[key] ? 'has-record' : '';
  };

  const TileContentLogic = ({ date }: { date: Date }) => {
    const key = dayjs(date).format('YYYY-MM-DD') as WorkDate;
    const record = recordMap[key];
    if (!record) return null;
    const val = record.netProfit || record.income;
    if (!val) return null;
    return (
      <span className="pointer-events-none text-[0.55rem] font-semibold text-primary">
        {(val / 10000).toFixed(0)}만
      </span>
    );
  };

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-margin-mobile py-6 pb-28">
      <section className="mb-8">
        <div className="relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container p-6 shadow-sm">
          <h2 className="mb-2 text-sm text-on-surface-variant">
            {activeMonth.format('M월')} 순수익
          </h2>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">
              {loading ? '—' : FormatWonLogic(summary.netProfit)}
            </span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-3">
              <p className="text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">
                총 수입
              </p>
              <p className="text-lg font-semibold text-on-surface">
                {FormatWonLogic(summary.totalIncome)}
              </p>
            </div>
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-3">
              <p className="text-[10px] font-bold tracking-wider text-on-surface-variant uppercase">
                총 지출
              </p>
              <p className="text-lg font-semibold text-error">
                {FormatWonLogic(summary.totalExpense)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
        <Calendar
          className="rider-calendar"
          value={selectedDate}
          onChange={(value) => {
            if (value instanceof Date) onDateSelect(value);
          }}
          onClickDay={(date) => {
            onDateSelect(date);
            onOpenEntry(date);
          }}
          onActiveStartDateChange={({ activeStartDate }) => {
            if (activeStartDate) {
              onMonthChange(dayjs(activeStartDate).format('YYYY-MM') as YearMonth);
            }
          }}
          tileClassName={TileClassNameLogic}
          tileContent={TileContentLogic}
          formatDay={(_, date) => dayjs(date).format('D')}
          prev2Label={null}
          next2Label={null}
          calendarType="gregory"
          locale="ko-KR"
        />
      </section>

      <section className="no-scrollbar mb-6 flex gap-2 overflow-x-auto py-1">
        {(
          [
            ['all', '전체'],
            ['income', '수입'],
            ['expense', '지출'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`shrink-0 rounded-full px-6 py-2 text-sm font-bold whitespace-nowrap transition active:scale-95 ${
              filter === key
                ? 'bg-primary text-on-primary shadow'
                : 'border border-outline-variant bg-surface-container-high text-on-surface-variant'
            }`}
          >
            {label}
          </button>
        ))}
      </section>

      <section className="space-y-8">
        {grouped.length === 0 && !loading && (
          <p className="text-center text-sm text-on-surface-variant">거래 내역이 없습니다.</p>
        )}
        {grouped.map(([dateKey, items]) => (
          <div key={dateKey}>
            <h3 className="sticky top-16 z-10 mb-4 bg-background/95 py-2 text-sm font-bold text-on-surface-variant backdrop-blur-sm">
              {FormatDateGroupLogic(dateKey)}
            </h3>
            <div className="space-y-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenEntry(dayjs(item.dateKey).toDate())}
                  className="flex w-full items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-low p-4 transition active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${
                        item.type === 'income'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-error/10 text-error'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined ${
                          item.type === 'income' ? 'material-symbols-filled' : ''
                        }`}
                      >
                        {item.icon}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-on-surface">{item.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        {item.tag && (
                          <span className="rounded bg-primary-container/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                            {item.tag}
                          </span>
                        )}
                        <span className="text-xs text-on-surface-variant">{item.subtitle}</span>
                      </div>
                    </div>
                  </div>
                  <p
                    className={`text-lg font-semibold ${
                      item.type === 'income' ? 'text-primary' : 'text-on-surface'
                    }`}
                  >
                    {item.type === 'income' ? '+' : '-'}
                    {FormatWonLogic(item.amount)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <button
        type="button"
        onClick={() => onOpenEntry()}
        className="fixed right-6 bottom-24 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-2xl transition hover:scale-105 active:scale-90"
      >
        <span className="material-symbols-outlined text-3xl font-bold">add</span>
      </button>
    </main>
  );
}

function FormatDateGroupLogic(dateKey: string): string {
  const d = dayjs(dateKey);
  const today = dayjs();
  if (d.isSame(today, 'day')) return `오늘, ${d.format('M월 D일')}`;
  if (d.isSame(today.subtract(1, 'day'), 'day')) return `어제, ${d.format('M월 D일')}`;
  return d.format('M월 D일 dddd');
}

function BuildTransactionListLogic(
  records: DeliveryRecord[],
  expenses: ExpenseRecord[],
  filter: Filter,
) {
  type Tx = {
    id: string;
    type: 'income' | 'expense';
    dateKey: string;
    title: string;
    subtitle: string;
    amount: number;
    tag?: string;
    icon: string;
  };

  const list: Tx[] = [];

  if (filter !== 'expense') {
    for (const r of records) {
      if (r.totalIncome <= 0) continue;
      const platforms = GetActivePlatformLabelsLogic(r.platformIncome);
      const activeKeys = PLATFORM_KEYS.filter((key) => r.platformIncome[key] > 0);
      list.push({
        id: `in-${r.id}`,
        type: 'income',
        dateKey: r.workDate,
        title: platforms ? `${platforms} 수입` : '배달 수입',
        subtitle: `${r.callCount}건 완료`,
        amount: r.totalIncome,
        tag: activeKeys.length === 1 ? PLATFORM_LABELS[activeKeys[0]] : undefined,
        icon: 'payments',
      });
    }
  }

  if (filter !== 'income') {
    for (const e of expenses) {
      const entries = (Object.keys(EXPENSE_LABELS) as (keyof typeof EXPENSE_LABELS)[])
        .filter((k) => e.breakdown[k] > 0)
        .map((k) => ({
          key: k,
          amount: e.breakdown[k],
          label: EXPENSE_LABELS[k],
        }));

      for (const entry of entries) {
        list.push({
          id: `ex-${e.id}-${entry.key}`,
          type: 'expense',
          dateKey: e.workDate,
          title: entry.label,
          subtitle: e.memo || '지출',
          amount: entry.amount,
          icon:
            entry.key === 'fuel'
              ? 'local_gas_station'
              : entry.key === 'food'
                ? 'restaurant'
                : 'motorcycle',
        });
      }
    }
  }

  return list.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}
