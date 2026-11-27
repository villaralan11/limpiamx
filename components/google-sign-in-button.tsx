'use client';

import { useState } from 'react';
import { Chrome, LoaderCircle } from 'lucide-react';
import { isFirebaseConfigured, signInWithGoogle } from '@/lib/firebase';

export function GoogleSignInButton({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleClick() {
    setMessage('');
    setLoading(true);
    try {
      await signInWithGoogle();
      setMessage('Sesión iniciada');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" className={`btn ${compact ? 'btn-primary btn-small' : 'btn-primary'}`} onClick={handleClick} disabled={loading} aria-label="Iniciar sesión con Google">
        {loading ? <LoaderCircle size={15} className="animate-spin" /> : <Chrome size={15} />}
        {loading ? 'Abriendo Google…' : compact ? 'Entrar' : 'Continuar con Google'}
      </button>
      {message && <p role="status" className="form-note" style={{ margin: '8px 0 0' }}>{message}</p>}
      {!isFirebaseConfigured() && <span className="sr-only">Configura Firebase para habilitar este acceso.</span>}
    </div>
  );
}
