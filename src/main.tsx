import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Tier 1 Google Maps Demo Key quota & auth failure listener
function notifyGmpUnavailable() {
  (window as unknown as { __gmpUnavailable?: boolean }).__gmpUnavailable = true;
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
}

(window as unknown as {gm_authFailure?: () => void}).gm_authFailure = () => {
  notifyGmpUnavailable();
};

const origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  origConsoleError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (
    msg.includes('OverQuotaMapError') ||
    msg.includes('QuotaExceededError') ||
    msg.includes('RefererNotAllowedMapError') ||
    msg.includes('ApiNotActivatedMapError') ||
    msg.includes('InvalidKeyMapError') ||
    msg.includes('BillingNotEnabledMapError') ||
    msg.includes('ApiProjectMapError')
  ) {
    notifyGmpUnavailable();
  }
};

createRoot(document.getElementById('root')!).render(<App />);

// PWA: registra el service worker solo en producción y en contexto seguro.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Sin conexión o entorno no seguro: la app funciona igual sin instalarse.
    });
  });
}

