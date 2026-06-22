export function SetupScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-navy-900/90 p-6 shadow-2xl ring-1 ring-white/10">
        <p className="mb-2 text-sm font-medium text-sky-400">설정 필요</p>
        <h1 className="mb-4 text-xl font-bold text-white">Supabase 연결이 필요합니다</h1>
        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          환경 변수가 없어 앱을 시작할 수 없습니다. 프로젝트 루트에{' '}
          <code className="rounded bg-navy-950 px-1.5 py-0.5 text-mint-300">.env</code>{' '}
          파일을 만들고 아래 값을 채워 주세요.
        </p>
        <pre className="mb-4 overflow-x-auto rounded-2xl bg-navy-950 p-4 text-xs leading-relaxed text-slate-300">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
        </pre>
        <p className="text-xs text-slate-500">
          저장 후 개발 서버를 다시 시작하세요. (터미널에서 Ctrl+C → npm run dev)
        </p>
      </div>
    </div>
  );
}
