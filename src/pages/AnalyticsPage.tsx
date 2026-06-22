import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { FormatWonLogic, CalcPercentLogic } from '../lib/format';
import { SumPlatformIncomeLogic } from '../services/deliveryService';
import type { DeliveryRecordMap, MonthlySummary } from '../types/delivery';
import { PLATFORM_KEYS, PLATFORM_LABELS } from '../types/delivery';
import type { PlatformKey } from '../types/delivery';

type Period = 'day' | 'week' | 'month';

interface AnalyticsPageProps {
  summary: MonthlySummary;
  recordMap: DeliveryRecordMap;
  loading: boolean;
}

const PLATFORM_COLORS: Record<PlatformKey, string> = {
  baemin: '#a8dcfa',
  coupang: '#6eb5e0',
  yogiyo: '#b8e0f5',
  ddangyo: '#cce9f9',
  ubereats: '#8ecae6',
  agency: '#d6ebff',
};

export function AnalyticsPage({ summary, recordMap, loading }: AnalyticsPageProps) {
  const [period, setPeriod] = useState<Period>('week');

  const platformData = useMemo(() => {
    const total = SumPlatformIncomeLogic(summary.platformIncome);
    return PLATFORM_KEYS
      .map((key) => ({
        key,
        label: PLATFORM_LABELS[key],
        amount: summary.platformIncome[key],
        percent: CalcPercentLogic(summary.platformIncome[key], total),
        color: PLATFORM_COLORS[key],
      }))
      .filter((item) => item.amount > 0);
  }, [summary.platformIncome]);

  const conicGradient = useMemo(() => {
    if (platformData.length === 0) return 'conic-gradient(#e0e3e5 0% 100%)';
    let acc = 0;
    const stops = platformData.map((item) => {
      const start = acc;
      acc += item.percent;
      return `${item.color} ${start}% ${acc}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }, [platformData]);

  const weekBars = useMemo(() => {
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    const start = dayjs().startOf('week').add(1, 'day');
    return days.map((label, i) => {
      const date = start.add(i, 'day').format('YYYY-MM-DD');
      const record = recordMap[date as keyof DeliveryRecordMap];
      const value = record?.netProfit ?? record?.income ?? 0;
      return { label, value, date };
    });
  }, [recordMap]);

  const maxBar = Math.max(...weekBars.map((b) => b.value), 1);
  const bestDay = weekBars.reduce((best, cur) => (cur.value > best.value ? cur : best), weekBars[0]);
  const bestHourly = bestDay.value > 0 ? Math.round(bestDay.value / 8) : 0;

  const dailyList = useMemo(() => {
    return Object.entries(recordMap)
      .filter(([, r]) => r.income > 0 || r.expense > 0)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 5)
      .map(([date, record]) => ({
        date,
        label: dayjs(date).format('M월 D일 dddd'),
        count: record.count,
        income: record.income,
        net: record.netProfit,
      }));
  }, [recordMap]);

  const displayTotal =
    period === 'month' ? summary.netProfit : weekBars.reduce((s, b) => s + b.value, 0);

  return (
    <main className="space-y-md px-margin-mobile pt-6 pb-28">
      <div className="flex rounded-lg border border-outline-variant bg-surface-container-low p-1">
        {(
          [
            ['day', '일간'],
            ['week', '주간'],
            ['month', '월간'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key)}
            className={`flex-1 rounded py-2 text-sm font-medium transition ${
              period === key
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="py-4">
        <p className="text-xs tracking-wider text-on-surface-variant uppercase">총 순수익</p>
        <div className="flex items-baseline gap-2">
          <span className="text-[40px] leading-tight font-bold text-primary">
            {loading ? '—' : FormatWonLogic(displayTotal)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-md md:grid-cols-12">
        <section className="relative overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest p-5 md:col-span-5">
          <h3 className="mb-6 flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">pie_chart</span>
            플랫폼별 수익 비중
          </h3>
          <div className="flex items-center justify-between">
            <div className="relative h-32 w-32 shrink-0">
              <div className="absolute inset-0 rounded-full" style={{ background: conicGradient }} />
              <div className="absolute inset-4 rounded-full bg-surface-container-lowest" />
            </div>
            <div className="ml-6 flex-1 space-y-2">
              {platformData.length === 0 && (
                <p className="text-sm text-on-surface-variant">플랫폼 데이터 없음</p>
              )}
              {platformData.map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-on-surface">{item.label}</span>
                  </div>
                  <span className="font-bold text-primary">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 md:col-span-7">
          <h3 className="mb-6 flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">equalizer</span>
            일별 수익 효율
          </h3>
          <div className="mt-4 flex h-32 items-end justify-between gap-2 px-2">
            {weekBars.map((bar) => {
              const height = maxBar > 0 ? (bar.value / maxBar) * 100 : 0;
              const isBest = bar.value === bestDay.value && bar.value > 0;
              return (
                <div key={bar.label} className="relative flex-1">
                  <div
                    className={`chart-bar-transition w-full rounded-t ${
                      isBest ? 'bg-primary-container' : 'bg-secondary-fixed-dim opacity-70'
                    }`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span
                    className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] ${
                      isBest ? 'font-bold text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-10 flex items-center justify-between border-t border-outline-variant pt-3">
            <span className="text-[10px] text-on-surface-variant">
              최고 일수익: {FormatWonLogic(bestDay.value)}
            </span>
            <span className="text-xs font-bold text-primary">
              시급 환산 ₩{bestHourly.toLocaleString()}/hr
            </span>
          </div>
        </section>
      </div>

      <section className="space-y-md">
        <h3 className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">lightbulb</span>
          수익 최적화 팁
        </h3>
        <div className="grid grid-cols-1 gap-md md:grid-cols-2">
          <div className="flex items-start gap-4 rounded-lg border-l-4 border-primary bg-surface-container-low p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-primary/10">
              <span className="material-symbols-outlined text-primary">schedule</span>
            </div>
            <div>
              <h4 className="text-base font-semibold text-on-surface">
                플랫폼별 수입을 기록하세요
              </h4>
              <p className="mt-1 text-sm text-on-surface-variant">
                배민·쿠팡·대행 태그를 입력하면 어느 플랫폼이 수익성이 좋은지 분석할 수 있습니다.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-lg border-l-4 border-secondary bg-surface-container-low p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-secondary/10">
              <span className="material-symbols-outlined text-secondary">local_gas_station</span>
            </div>
            <div>
              <h4 className="text-base font-semibold text-on-surface">지출도 함께 관리하세요</h4>
              <p className="mt-1 text-sm text-on-surface-variant">
                주유비·리스료를 입력하면 순수익이 자동 계산되어 실제 남는 돈을 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
          <h3 className="text-xs text-on-surface-variant">일자별 상세 수입</h3>
        </div>
        <div className="divide-y divide-outline-variant">
          {dailyList.length === 0 && !loading && (
            <p className="p-5 text-center text-sm text-on-surface-variant">기록이 없습니다.</p>
          )}
          {dailyList.map((item) => (
            <div
              key={item.date}
              className="flex items-center justify-between px-5 py-4 transition hover:bg-surface-container-low"
            >
              <div className="flex flex-col">
                <span className="text-base font-semibold text-on-surface">{item.label}</span>
                <span className="text-xs text-on-surface-variant">{item.count}건 배달</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-primary">
                  {FormatWonLogic(item.net || item.income)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
