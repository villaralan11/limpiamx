import React, { useState } from 'react';
import type { ActiveSection } from './Header';

const STORAGE_KEY = 'limpiamx_notice_ack_v1';

function alreadyAcknowledged(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export const CookieBanner: React.FC<{
  onNavigate: (s: ActiveSection) => void;
}> = ({ onNavigate }) => {
  const [visible, setVisible] = useState(() => !alreadyAcknowledged());

  if (!visible) return null;

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // sin almacenamiento disponible: solo se oculta en esta visita
    }
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Aviso de privacidad y almacenamiento"
      className="fixed bottom-0 inset-x-0 sm:inset-x-auto sm:left-5 sm:bottom-5 z-40 sm:max-w-md bg-white border border-slate-200 sm:rounded-xl shadow-lg p-4"
    >
      <p className="text-sm text-slate-700 leading-relaxed">
        Usamos almacenamiento del navegador para mantener tu sesión y recordar
        preferencias. No usamos cookies de publicidad.{' '}
        <button
          type="button"
          onClick={() => onNavigate('privacidad')}
          className="text-teal-700 hover:text-teal-800 underline underline-offset-2 cursor-pointer"
        >
          Leer el aviso de privacidad
        </button>
      </p>
      <button
        type="button"
        onClick={accept}
        className="mt-3 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer"
      >
        Entendido
      </button>
    </div>
  );
};
