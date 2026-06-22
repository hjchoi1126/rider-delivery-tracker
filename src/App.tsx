import { useCallback, useState } from 'react';
import Calendar from 'react-calendar';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { useDeliveries } from './hooks/useDeliveries';
import { GetUserIdLogic } from './lib/userId';
import type { WorkDate, YearMonth } from './types/delivery';

dayjs.locale('ko');

type ValuePiece = Date | null;
type CalendarValue = ValuePiece | [ValuePiece, ValuePiece];

const FormatCurrencyLogic = (value: number): string =>
  new Intl.NumberFormat('ko-KR').format(value);

const USER_ID = GetUserIdLogic();

function App() {
  const {
    recordMap,
    summary,
    loading,
    saving,
    error,
    yearMonth,
    setYearMonth,
    upsertDeliveryData,
    deleteDeliveryData,
  } = useDeliveries({ userId: USER_ID });

  const activeMonth = dayjs(`${yearMonth}-01`);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCount, setFormCount] = useState('');
  const [formIncome, setFormIncome] = useState('');
  const [formMemo, setFormMemo] = useState('');

  const OpenModalLogic = useCallback(
    (date: Date) => {
      const key = dayjs(date).format('YYYY-MM-DD') as WorkDate;
      const existing = recordMap[key];

      setSelectedDate(date);
      setFormCount(existing ? String(existing.count) : '');
      setFormIncome(existing ? String(existing.income) : '');
      setFormMemo(existing?.memo ?? '');
      setIsModalOpen(true);
    },
    [recordMap],
  );

  const CloseModalLogic = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const SaveRecordLogic = useCallback(async () => {
    const workDate = dayjs(selectedDate).format('YYYY-MM-DD') as WorkDate;
    const callCount = Number(formCount) || 0;
    const totalIncome = Number(formIncome) || 0;
    const memo = formMemo.trim();
    const isEmpty = callCount === 0 && totalIncome === 0 && !memo;

    const success = isEmpty
      ? await deleteDeliveryData(workDate)
      : await upsertDeliveryData({
          userId: USER_ID,
          workDate,
          callCount,
          totalIncome,
          memo,
        });

    if (success) {
      CloseModalLogic();
    }
  }, [
    selectedDate,
    formCount,
    formIncome,
    formMemo,
    deleteDeliveryData,
    upsertDeliveryData,
    CloseModalLogic,
  ]);

  const HandleCalendarChange = (value: CalendarValue) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  const HandleActiveStartDateChange = ({
    activeStartDate,
  }: {
    activeStartDate: Date | null;
  }) => {
    if (activeStartDate) {
      setYearMonth(dayjs(activeStartDate).format('YYYY-MM') as YearMonth);
    }
  };

  const TileClassNameLogic = ({ date }: { date: Date }) => {
    const key = dayjs(date).format('YYYY-MM-DD') as WorkDate;
    return recordMap[key] ? 'has-record' : '';
  };

  const TileContentLogic = ({ date }: { date: Date }) => {
    const key = dayjs(date).format('YYYY-MM-DD') as WorkDate;
    const record = recordMap[key];
    if (!record?.income) return null;

    return (
      <span className="pointer-events-none text-[0.6rem] font-semibold leading-none text-mint-300">
        {(record.income / 10000).toFixed(0)}만
      </span>
    );
  };

  return (
    <div className="flex min-h-dvh justify-center px-3 py-5 sm:px-4">
      <div className="flex w-full max-w-[425px] flex-col gap-4">
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-400/30 bg-red-950/60 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        {/* 헤더 요약 */}
        <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 p-6 shadow-2xl shadow-black/30 ring-1 ring-white/10">
          <p className="mb-1 text-sm font-medium text-sky-400">
            {activeMonth.format('YYYY년 M월')}
          </p>
          <h1 className="mb-6 text-lg font-bold tracking-tight text-white">
            배달 수입 기록
          </h1>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/5 p-4 backdrop-blur-sm ring-1 ring-white/10">
              <p className="mb-1 text-xs font-medium text-slate-400">총 배달 수입</p>
              <p className="text-2xl font-extrabold tracking-tight text-mint-300">
                {loading ? '—' : FormatCurrencyLogic(summary.totalIncome)}
                <span className="ml-0.5 text-base font-semibold text-mint-400/80">원</span>
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 backdrop-blur-sm ring-1 ring-white/10">
              <p className="mb-1 text-xs font-medium text-slate-400">총 배달 건수</p>
              <p className="text-2xl font-extrabold tracking-tight text-sky-400">
                {loading ? '—' : FormatCurrencyLogic(summary.totalCount)}
                <span className="ml-0.5 text-base font-semibold text-sky-400/80">건</span>
              </p>
            </div>
          </div>
        </header>

        {/* 달력 */}
        <section className="relative rounded-3xl bg-navy-900/80 p-4 shadow-xl shadow-black/20 ring-1 ring-white/10 backdrop-blur-md">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-navy-950/50 backdrop-blur-[1px]">
              <p className="text-sm font-medium text-mint-300">불러오는 중...</p>
            </div>
          )}
          <Calendar
            className="rider-calendar"
            value={selectedDate}
            onChange={HandleCalendarChange}
            onClickDay={OpenModalLogic}
            onActiveStartDateChange={HandleActiveStartDateChange}
            tileClassName={TileClassNameLogic}
            tileContent={TileContentLogic}
            formatDay={(_, date) => dayjs(date).format('D')}
            prev2Label={null}
            next2Label={null}
            calendarType="gregory"
            locale="ko-KR"
          />
          <p className="mt-3 text-center text-xs text-slate-500">
            날짜를 탭하면 수입을 기록할 수 있어요
          </p>
        </section>
      </div>

      {/* 수입 입력 모달 */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-sm"
          onClick={CloseModalLogic}
          role="presentation"
        >
          <div
            className="w-full max-w-[380px] animate-[fadeIn_0.2s_ease-out] rounded-3xl bg-gradient-to-b from-navy-800 to-navy-950 p-6 shadow-2xl ring-1 ring-white/15"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-mint-400">선택한 날짜</p>
                <h2 id="modal-title" className="text-xl font-bold text-white">
                  {dayjs(selectedDate).format('YYYY-MM-DD')}
                </h2>
              </div>
              <button
                type="button"
                onClick={CloseModalLogic}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white disabled:opacity-50"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">
                  배달 건수
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="0"
                  value={formCount}
                  onChange={(e) => setFormCount(e.target.value)}
                  disabled={saving}
                  className="w-full rounded-xl border border-white/10 bg-navy-950/60 px-4 py-3 text-base text-white placeholder:text-slate-600 outline-none transition focus:border-mint-400/50 focus:ring-2 focus:ring-mint-400/20 disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">
                  배달 수입 (원)
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="0"
                  value={formIncome}
                  onChange={(e) => setFormIncome(e.target.value)}
                  disabled={saving}
                  className="w-full rounded-xl border border-white/10 bg-navy-950/60 px-4 py-3 text-base text-white placeholder:text-slate-600 outline-none transition focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-300">메모</span>
                <textarea
                  rows={3}
                  placeholder="오늘의 배달 메모를 남겨보세요"
                  value={formMemo}
                  onChange={(e) => setFormMemo(e.target.value)}
                  disabled={saving}
                  className="w-full resize-none rounded-xl border border-white/10 bg-navy-950/60 px-4 py-3 text-base text-white placeholder:text-slate-600 outline-none transition focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20 disabled:opacity-60"
                />
              </label>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={CloseModalLogic}
                disabled={saving}
                className="rounded-xl border border-white/15 bg-white/5 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={SaveRecordLogic}
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-sky-400 to-mint-400 py-3.5 text-sm font-bold text-navy-950 shadow-lg shadow-sky-400/25 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default App;
