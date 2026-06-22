import { SettingsFooter } from '../components/SettingsFooter';

export function SettingsPage() {
  return (
    <main className="space-y-6 px-margin-mobile pt-6 pb-28">
      <section className="rounded-xl border border-outline-variant bg-surface-container-low p-6">
        <h2 className="mb-2 text-lg font-bold text-on-surface">앱 정보</h2>
        <p className="text-sm text-on-surface-variant">
          매일의 배달 수입과 지출을 기록하고, 한 달 순수익을 한눈에 확인하세요.
        </p>
      </section>

      <SettingsFooter />
    </main>
  );
}
