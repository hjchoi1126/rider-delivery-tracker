import { useCallback, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { BottomNavBar, TopAppBar } from './components/layout/AppShell';
import { EntryModal } from './components/EntryModal';
import { useDeliveries } from './hooks/useDeliveries';
import { GetUserIdLogic } from './lib/userId';
import { GetShiftSessionLogic, ToggleShiftLogic } from './lib/shiftSession';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LedgerPage } from './pages/LedgerPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { SettingsPage } from './pages/SettingsPage';
import type { AppTab } from './types/navigation';
import type { WorkDate } from './types/delivery';
import type { ExpenseBreakdown, PlatformIncome } from './types/delivery';

dayjs.locale('ko');

const USER_ID = GetUserIdLogic();

const TAB_TITLES: Record<AppTab, string> = {
  dashboard: '런앤콜',
  analytics: '수입 분석',
  ledger: '지출 및 장부',
  maintenance: '정비 관리',
  settings: '설정',
};

function App() {
  const {
    records,
    expenseRecords,
    recordMap,
    summary,
    loading,
    saving,
    error,
    yearMonth,
    setYearMonth,
    upsertDayData,
    clearError,
  } = useDeliveries({ userId: USER_ID });

  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [shift, setShift] = useState(GetShiftSessionLogic);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const OpenEntryLogic = useCallback((date?: Date) => {
    if (date) setSelectedDate(date);
    setIsModalOpen(true);
  }, []);

  const CloseEntryLogic = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const ToggleClockLogic = useCallback(() => {
    setShift(ToggleShiftLogic());
  }, []);

  const SaveDayLogic = useCallback(
    async (payload: {
      callCount: number;
      totalIncome: number;
      platformIncome: PlatformIncome;
      memo: string;
      expenseBreakdown: ExpenseBreakdown;
      expenseMemo: string;
    }) => {
      const workDate = dayjs(selectedDate).format('YYYY-MM-DD') as WorkDate;
      const expenseTotal = Object.values(payload.expenseBreakdown).reduce((a, b) => a + b, 0);
      const hasIncome =
        payload.callCount > 0 || payload.totalIncome > 0 || payload.memo.length > 0;
      const hasExpense = expenseTotal > 0 || payload.expenseMemo.length > 0;

      const success = await upsertDayData({
        userId: USER_ID,
        workDate,
        delivery: hasIncome
          ? {
              userId: USER_ID,
              workDate,
              callCount: payload.callCount,
              totalIncome: payload.totalIncome,
              platformIncome: payload.platformIncome,
              memo: payload.memo,
            }
          : null,
        expense: hasExpense
          ? {
              userId: USER_ID,
              workDate,
              breakdown: payload.expenseBreakdown,
              memo: payload.expenseMemo,
            }
          : null,
      });

      if (success) CloseEntryLogic();
    },
    [selectedDate, upsertDayData, CloseEntryLogic],
  );

  const workDateKey = dayjs(selectedDate).format('YYYY-MM-DD') as WorkDate;
  const selectedDelivery = records.find((r) => r.workDate === workDateKey);
  const selectedExpense = expenseRecords.find((e) => e.workDate === workDateKey);

  return (
    <div className="min-h-dvh bg-surface text-on-surface">
      <TopAppBar
        title={TAB_TITLES[activeTab]}
        onClockIn={ToggleClockLogic}
        clockedIn={shift.clockedIn}
      />

      {error && (
        <div className="mx-margin-mobile mt-3 rounded-xl border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container">
          <div className="flex items-center justify-between gap-2">
            <span>{error}</span>
            <button type="button" onClick={clearError} className="text-xs font-bold underline">
              닫기
            </button>
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <DashboardPage
          recordMap={recordMap}
          records={records}
          expenseRecords={expenseRecords}
          loading={loading}
          clockedIn={shift.clockedIn}
          onClockToggle={ToggleClockLogic}
          onOpenEntry={() => OpenEntryLogic()}
          onGoLedger={() => setActiveTab('ledger')}
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsPage summary={summary} recordMap={recordMap} loading={loading} />
      )}

      {activeTab === 'ledger' && (
        <LedgerPage
          summary={summary}
          recordMap={recordMap}
          records={records}
          expenseRecords={expenseRecords}
          yearMonth={yearMonth}
          loading={loading}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onMonthChange={setYearMonth}
          onOpenEntry={OpenEntryLogic}
        />
      )}

      {activeTab === 'maintenance' && <MaintenancePage />}

      {activeTab === 'settings' && <SettingsPage />}

      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />

      <EntryModal
        open={isModalOpen}
        selectedDate={selectedDate}
        saving={saving}
        delivery={selectedDelivery}
        expense={selectedExpense}
        onClose={CloseEntryLogic}
        onSave={SaveDayLogic}
      />
    </div>
  );
}

export default App;
