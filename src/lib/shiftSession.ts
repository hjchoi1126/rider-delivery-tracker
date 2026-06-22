const SHIFT_KEY = 'rider-shift-session';
const GOAL_KEY = 'rider-daily-goal';

interface ShiftSession {
  clockedIn: boolean;
  startTime: number | null;
}

export const GetShiftSessionLogic = (): ShiftSession => {
  try {
    const raw = localStorage.getItem(SHIFT_KEY);
    if (!raw) return { clockedIn: false, startTime: null };
    return JSON.parse(raw) as ShiftSession;
  } catch {
    return { clockedIn: false, startTime: null };
  }
};

export const ToggleShiftLogic = (): ShiftSession => {
  const current = GetShiftSessionLogic();
  const next: ShiftSession = current.clockedIn
    ? { clockedIn: false, startTime: null }
    : { clockedIn: true, startTime: Date.now() };

  localStorage.setItem(SHIFT_KEY, JSON.stringify(next));
  return next;
};

export const GetWorkedHoursLogic = (): number => {
  const { clockedIn, startTime } = GetShiftSessionLogic();
  if (!clockedIn || !startTime) return 0;
  return (Date.now() - startTime) / (1000 * 60 * 60);
};

export const GetDailyGoalLogic = (): number => {
  const stored = localStorage.getItem(GOAL_KEY);
  if (stored) return Number(stored) || 150_000;
  return 150_000;
};

export const SetDailyGoalLogic = (amount: number): void => {
  localStorage.setItem(GOAL_KEY, String(amount));
};
