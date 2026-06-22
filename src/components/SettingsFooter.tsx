import { useRef } from 'react';

const APP_VERSION = 'v1.0.0';
const EASTER_EGG_TAP_COUNT = 5;
const TAP_RESET_MS = 2500;

export function SettingsFooter() {
  const tapCountRef = useRef(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const HandleVersionClickLogic = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    tapCountRef.current += 1;

    if (tapCountRef.current >= EASTER_EGG_TAP_COUNT) {
      alert('💙 라이더분들의 안전 운전을 기원합니다! - 개발자 최혜진 💙');
      tapCountRef.current = 0;
      return;
    }

    resetTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, TAP_RESET_MS);
  };

  return (
    <footer className="mt-8 space-y-4 border-t border-outline-variant/50 pt-8">
      <div className="rounded-xl border border-outline-variant/40 bg-gradient-to-br from-surface-container-low via-surface-container-lowest to-primary-fixed/30 p-5">
        <div className="mb-4 text-center">
          <p className="text-lg font-bold text-primary">런앤콜</p>
          <p className="mt-1 text-xs text-on-surface-variant">
            Run &amp; Call · 수입·지출·플랫폼별 분석
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/80 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container/15 ring-1 ring-primary-container/25">
            <span className="material-symbols-outlined text-primary">verified</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
              made by
            </p>
            <p className="truncate bg-gradient-to-r from-primary to-primary-container bg-clip-text font-mono text-base font-bold text-transparent">
              @choihyejin
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 pb-2">
        <button
          type="button"
          onClick={HandleVersionClickLogic}
          className="rounded-full px-3 py-1 text-xs font-mono text-on-surface-variant transition active:scale-95 hover:bg-surface-container-high hover:text-primary"
          aria-label="앱 버전"
        >
          {APP_VERSION}
        </button>
        <p className="text-[10px] text-outline">tap for luck 🛵</p>
      </div>
    </footer>
  );
}
