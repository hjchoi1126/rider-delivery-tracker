import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { SetupScreen } from './components/SetupScreen';
import { IsSupabaseConfiguredLogic } from './supabaseClient';

async function BootstrapLogic() {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  const root = createRoot(rootElement);

  if (!IsSupabaseConfiguredLogic()) {
    root.render(
      <StrictMode>
        <SetupScreen />
      </StrictMode>,
    );
    return;
  }

  const { registerSW } = await import('virtual:pwa-register');
  registerSW({ immediate: true });

  const { default: App } = await import('./App');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void BootstrapLogic();
