export type AppTab = 'dashboard' | 'analytics' | 'ledger' | 'maintenance' | 'settings';

export const APP_TABS: { id: AppTab; label: string; icon: string }[] = [
  { id: 'dashboard', label: '대시보드', icon: 'dashboard' },
  { id: 'analytics', label: '분석', icon: 'monitoring' },
  { id: 'ledger', label: '장부', icon: 'receipt_long' },
  { id: 'maintenance', label: '정비', icon: 'build' },
  { id: 'settings', label: '설정', icon: 'settings' },
];
