export function MaintenancePage() {
  return (
    <main className="mx-auto mt-8 max-w-screen-md space-y-8 px-margin-mobile pb-28">
      <section className="rounded-lg border border-outline-variant bg-surface-container-low p-6">
        <div className="flex flex-col space-y-4">
          <label className="text-sm text-on-surface-variant">현재 주행거리 (KM)</label>
          <div className="relative">
            <input
              type="number"
              defaultValue={12450}
              className="w-full appearance-none rounded-lg border border-outline-variant bg-surface-container-lowest p-4 text-2xl font-bold text-primary outline-none transition focus:border-primary"
            />
          </div>
          <button
            type="button"
            className="w-full rounded-lg bg-primary-container py-4 font-bold text-on-primary-container transition hover:brightness-105 active:scale-[0.98]"
          >
            주행거리 업데이트
          </button>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <StatusCardLogic
          title="엔진오일"
          status="점검"
          statusColor="error"
          fill={85}
          fillColor="bg-error"
          footer="교체 예정"
          subfooter="500km"
          icon="oil_barrel"
        />
        <StatusCardLogic
          title="타이어"
          status="양호"
          statusColor="primary"
          fill={35}
          fillColor="bg-primary-container"
          footer="안전"
          subfooter="8,200km"
          icon="tire_repair"
        />
        <StatusCardLogic
          title="브레이크"
          status="양호"
          statusColor="primary"
          fill={20}
          fillColor="bg-primary-container"
          footer="안전"
          subfooter="12,000km"
          icon="settings_input_component"
        />
      </section>

      <div className="flex flex-col items-center gap-6 rounded-lg border border-error/10 bg-error-container p-6 text-on-error-container md:flex-row">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-error">
          <span className="material-symbols-outlined text-3xl text-on-error">priority_high</span>
        </div>
        <div className="flex-grow text-center md:text-left">
          <h4 className="text-lg font-semibold text-error">주의: 정비 시기가 다가옵니다</h4>
          <p className="text-sm opacity-90">
            엔진오일 교체 주기(3,000km)에 근접했습니다. 안전한 운행을 위해 점검을 권장합니다.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-primary-container px-6 py-3 font-bold whitespace-nowrap text-on-primary-container transition active:scale-95"
        >
          정비 기록하기
        </button>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-primary">정비 기록</h2>
        <div className="space-y-3">
          <HistoryRowLogic
            title="뒷타이어 교체"
            meta="2025.10.14 • 9,450 KM"
            amount="₩124,000"
            icon="tire_repair"
          />
          <HistoryRowLogic
            title="종합 점검 및 오일 교환"
            meta="2025.07.22 • 5,200 KM"
            amount="₩85,500"
            icon="oil_barrel"
          />
        </div>
      </section>
    </main>
  );
}

function StatusCardLogic({
  title,
  status,
  statusColor,
  fill,
  fillColor,
  footer,
  subfooter,
  icon,
}: {
  title: string;
  status: string;
  statusColor: 'error' | 'primary';
  fill: number;
  fillColor: string;
  footer: string;
  subfooter: string;
  icon: string;
}) {
  return (
    <div className="flex min-h-[140px] flex-col rounded-xl border border-outline-variant bg-surface-container-lowest p-2.5 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-1">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            statusColor === 'error' ? 'bg-error/10' : 'bg-primary/10'
          }`}
        >
          <span
            className={`material-symbols-outlined material-symbols-filled text-sm ${
              statusColor === 'error' ? 'text-error' : 'text-primary'
            }`}
          >
            {icon}
          </span>
        </div>
        <span
          className={`rounded px-1.5 py-0.5 text-[9px] font-bold leading-none ${
            statusColor === 'error'
              ? 'bg-error-container text-on-error-container'
              : 'bg-primary-fixed text-on-primary-fixed'
          }`}
        >
          {status}
        </span>
      </div>

      <h3 className="mb-2 truncate text-xs font-bold text-on-surface">{title}</h3>

      <div className="flex flex-1 items-end justify-center py-1">
        <div className="relative h-14 w-5 overflow-hidden rounded-full bg-surface-container-high">
          <div
            className={`absolute bottom-0 w-full ${fillColor} chart-bar-transition`}
            style={{ height: `${fill}%` }}
          />
        </div>
      </div>

      <div className="mt-2 text-center">
        <p
          className={`text-[10px] font-semibold leading-tight ${
            statusColor === 'error' ? 'text-error' : 'text-primary'
          }`}
        >
          {footer}
        </p>
        <p className="mt-0.5 truncate text-[9px] text-on-surface-variant">{subfooter}</p>
      </div>
    </div>
  );
}

function HistoryRowLogic({
  title,
  meta,
  amount,
  icon,
}: {
  title: string;
  meta: string;
  amount: string;
  icon: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-lowest p-4 transition hover:bg-surface-container-low">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-high">
          <span className="material-symbols-outlined text-on-surface-variant">{icon}</span>
        </div>
        <div>
          <p className="text-on-surface">{title}</p>
          <p className="text-xs tracking-wider text-on-surface-variant uppercase">{meta}</p>
        </div>
      </div>
      <p className="text-lg font-semibold text-primary">{amount}</p>
    </div>
  );
}
