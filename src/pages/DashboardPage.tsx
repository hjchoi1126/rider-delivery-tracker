import { useState } from 'react';
import dayjs from 'dayjs';
import { FormatCurrencyLogic, FormatWonLogic, CalcPercentLogic } from '../lib/format';
import { GetActivePlatformLabelsLogic } from '../services/deliveryService';
import {
  GetDailyGoalLogic,
  GetWorkedHoursLogic,
  SetDailyGoalLogic,
} from '../lib/shiftSession';
import type { DeliveryRecord, DeliveryRecordMap, ExpenseRecord } from '../types/delivery';
import { EXPENSE_LABELS } from '../types/delivery';

interface DashboardPageProps {
  recordMap: DeliveryRecordMap;
  records: DeliveryRecord[];
  expenseRecords: ExpenseRecord[];
  loading: boolean;
  clockedIn: boolean;
  onClockToggle: () => void;
  onOpenEntry: () => void;
  onGoLedger: () => void;
}

export function DashboardPage({
  recordMap,
  records,
  expenseRecords,
  loading,
  clockedIn,
  onClockToggle,
  onOpenEntry,
  onGoLedger,
}: DashboardPageProps) {
  const today = dayjs().format('YYYY-MM-DD');
  const todayRecord = recordMap[today as keyof DeliveryRecordMap];
  const todayNet = todayRecord?.netProfit ?? 0;
  const todayIncome = todayRecord?.income ?? 0;
  const workedHours = GetWorkedHoursLogic();
  const hourlyWage = workedHours > 0 ? Math.round(todayIncome / workedHours) : 0;
  const [dailyGoal, setDailyGoal] = useState(GetDailyGoalLogic);
  const [goalInput, setGoalInput] = useState(String(GetDailyGoalLogic()));
  const goalPercent = CalcPercentLogic(todayNet > 0 ? todayNet : todayIncome, dailyGoal);
  const goalRemain = Math.max(dailyGoal - (todayNet > 0 ? todayNet : todayIncome), 0);

  const SaveDailyGoalLogic = () => {
    const value = Number(goalInput) || 150_000;
    SetDailyGoalLogic(value);
    setDailyGoal(value);
    setGoalInput(String(value));
  };

  const recentItems = BuildRecentActivityLogic(records, expenseRecords).slice(0, 3);

  return (
    <main className="space-y-6 px-margin-mobile pt-6 pb-28">
      <section className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-low p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <span className="text-xs font-medium tracking-wider text-on-surface-variant uppercase">
              상태
            </span>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 shrink-0 rounded-full ${clockedIn ? 'bg-secondary' : 'animate-pulse bg-error'}`}
              />
              <span className="text-lg font-semibold">{clockedIn ? '운행 중' : '미운행'}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClockToggle}
            className={`flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-bold transition active:scale-95 ${
              clockedIn
                ? 'bg-secondary text-on-secondary shadow-sm'
                : 'bg-primary-container text-on-primary-container glow-primary'
            }`}
          >
            <span className="material-symbols-outlined text-xl">
              {clockedIn ? 'stop' : 'play_arrow'}
            </span>
            {clockedIn ? '퇴근' : '출근'}
          </button>
        </div>

        <div className="border-t border-outline-variant/60 pt-4">
          <label className="mb-2 block text-xs font-bold tracking-wide text-on-surface-variant uppercase">
            일일 목표 수입
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && SaveDailyGoalLogic()}
              className="min-w-0 flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm font-semibold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="150000"
            />
            <button
              type="button"
              onClick={SaveDailyGoalLogic}
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary transition active:scale-95"
            >
              저장
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-on-surface-variant">
            목표 {FormatCurrencyLogic(dailyGoal)}원 · 달성 {goalPercent}%
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <StatCardLogic
          label="오늘 순수익"
          icon="trending_up"
          iconClass="text-secondary"
          value={loading ? '—' : FormatCurrencyLogic(todayNet)}
          unit="원"
          sub={todayIncome > 0 ? `수입 ${FormatWonLogic(todayIncome)}` : undefined}
        />

        <StatCardLogic
          label="실시간 시급"
          icon="speed"
          iconClass="text-primary-container"
          value={hourlyWage > 0 ? FormatCurrencyLogic(hourlyWage) : '—'}
          unit="원/h"
          sub={clockedIn ? `${workedHours.toFixed(1)}h 운행` : '운행 후 계산'}
        />

        <StatCardLogic
          label="목표 달성도"
          icon="flag"
          iconClass="text-primary"
          value={`${goalPercent}%`}
          unit=""
          sub={`${FormatCurrencyLogic(goalRemain)}원 남음`}
          progress={goalPercent}
        />

        <button
          type="button"
          onClick={onOpenEntry}
          className="flex min-h-[108px] flex-col items-center justify-center gap-1.5 rounded-xl border border-primary-container/30 bg-primary-container p-3 text-on-primary-container shadow-sm transition active:scale-95"
        >
          <span className="material-symbols-outlined text-2xl">add_circle</span>
          <span className="text-center text-xs font-bold leading-tight">수입/지출<br />입력</span>
        </button>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between px-1">
          <h3 className="text-xs font-bold tracking-widest text-on-surface-variant uppercase">
            최근 활동
          </h3>
          <button
            type="button"
            onClick={onGoLedger}
            className="text-sm font-bold text-primary"
          >
            장부 보기
          </button>
        </div>
        <div className="space-y-2">
          {recentItems.length === 0 && !loading && (
            <p className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-center text-sm text-on-surface-variant">
              아직 기록이 없습니다. 수입/지출을 입력해 보세요.
            </p>
          )}
          {recentItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    item.type === 'income'
                      ? 'bg-secondary-container/30 text-on-secondary-container'
                      : 'bg-error-container/30 text-error'
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {item.type === 'income' ? 'delivery_dining' : item.icon}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-on-surface">{item.title}</p>
                  <p className="text-xs text-on-surface-variant">{item.subtitle}</p>
                </div>
              </div>
              <p
                className={`text-lg font-semibold ${
                  item.type === 'income' ? 'text-secondary' : 'text-error'
                }`}
              >
                {item.type === 'income' ? '+' : '-'}
                {FormatCurrencyLogic(item.amount)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatCardLogic({
  label,
  icon,
  iconClass,
  value,
  unit,
  sub,
  progress,
}: {
  label: string;
  icon: string;
  iconClass: string;
  value: string;
  unit: string;
  sub?: string;
  progress?: number;
}) {
  return (
    <div className="flex min-h-[108px] flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-wide text-on-surface-variant uppercase">
          {label}
        </span>
        <span className={`material-symbols-outlined text-base ${iconClass}`}>{icon}</span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-bold text-on-surface">{value}</span>
        {unit && <span className="text-[10px] text-on-surface-variant">{unit}</span>}
      </div>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <div
            className="h-full bg-primary-container transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
      {sub && <p className="mt-1 truncate text-[10px] text-on-surface-variant">{sub}</p>}
    </div>
  );
}

function BuildRecentActivityLogic(records: DeliveryRecord[], expenses: ExpenseRecord[]) {
  type Activity = {
    id: string;
    type: 'income' | 'expense';
    title: string;
    subtitle: string;
    amount: number;
    icon: string;
    sortKey: string;
  };

  const items: Activity[] = [];

  for (const r of records) {
    if (r.totalIncome <= 0) continue;
    const platforms = GetActivePlatformLabelsLogic(r.platformIncome);
    items.push({
      id: `income-${r.id}`,
      type: 'income',
      title: platforms ? `${platforms} 수입` : '배달 수입',
      subtitle: `${dayjs(r.workDate).format('M월 D일')} • ${r.callCount}건`,
      amount: r.totalIncome,
      icon: 'delivery_dining',
      sortKey: r.workDate,
    });
  }

  for (const e of expenses) {
    if (e.totalExpense <= 0) continue;
    const topCategory = (Object.keys(EXPENSE_LABELS) as (keyof typeof EXPENSE_LABELS)[]).find(
      (k) => e.breakdown[k] > 0,
    );
    items.push({
      id: `expense-${e.id}`,
      type: 'expense',
      title: topCategory ? EXPENSE_LABELS[topCategory] : '지출',
      subtitle: dayjs(e.workDate).format('M월 D일'),
      amount: e.totalExpense,
      icon: 'local_gas_station',
      sortKey: e.workDate,
    });
  }

  return items.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}
