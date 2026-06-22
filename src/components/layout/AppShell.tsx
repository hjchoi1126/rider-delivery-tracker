import type { AppTab } from '../../types/navigation';

interface TopAppBarProps {
  title: string;
  onClockIn?: () => void;
  clockedIn?: boolean;
}

export function TopAppBar({ title, onClockIn, clockedIn = false }: TopAppBarProps) {
  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-margin-mobile">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-surface-container-highest">
          <span className="material-symbols-outlined text-primary">two_wheeler</span>
        </div>
        <h1 className="text-xl font-bold text-primary">{title}</h1>
      </div>
      {onClockIn && (
        <button
          type="button"
          onClick={onClockIn}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition active:scale-95 ${
            clockedIn
              ? 'bg-secondary text-on-secondary'
              : 'bg-primary-container text-on-primary-container'
          }`}
        >
          {clockedIn ? '퇴근' : '출근'}
        </button>
      )}
    </header>
  );
}

interface BottomNavBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const NAV_ITEMS: { id: AppTab; label: string; icon: string }[] = [
  { id: 'dashboard', label: '대시보드', icon: 'dashboard' },
  { id: 'analytics', label: '분석', icon: 'monitoring' },
  { id: 'ledger', label: '장부', icon: 'receipt_long' },
  { id: 'maintenance', label: '정비', icon: 'build' },
  { id: 'settings', label: '설정', icon: 'settings' },
];

export function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-xl border-t border-outline-variant bg-surface-container-lowest px-base py-sm pb-safe">
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center px-3 py-1 transition active:scale-90 ${
              isActive
                ? 'rounded-full bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className={`material-symbols-outlined ${isActive ? 'material-symbols-filled' : ''}`}>
              {item.icon}
            </span>
            <span className={`mt-0.5 text-xs ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
