import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User as UserIcon,
  X,
} from 'lucide-react';
import {
  getFirebaseAuthErrorMessage,
  registerWithEmail,
  resetPasswordByEmail,
  signInWithEmail,
  signInWithGoogle,
} from '../lib/firebase';

export type AuthModalMode = 'login' | 'register' | 'reset';

interface AuthModalProps {
  open: boolean;
  initialMode?: AuthModalMode;
  onClose: () => void;
  onAuthenticated?: (method: 'google' | 'email_login' | 'email_register') => void;
}

const GoogleMark: React.FC = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
    />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  initialMode = 'login',
  onClose,
  onAuthenticated,
}) => {
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [googleBusy, setGoogleBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resetSentTo, setResetSentTo] = useState('');

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setErrorMsg('');
      setResetSentTo('');
    }
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !googleBusy && !emailBusy) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, googleBusy, emailBusy, onClose]);

  if (!open) return null;

  const isBusy = googleBusy || emailBusy;

  const handleGoogleSignIn = async () => {
    if (isBusy) return;
    setErrorMsg('');
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
      onAuthenticated?.('google');
      onClose();
    } catch (err) {
      setErrorMsg(getFirebaseAuthErrorMessage(err));
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;
    setErrorMsg('');
    setResetSentTo('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Ingresa un correo electrónico válido.');
      return;
    }

    if (mode === 'reset') {
      setEmailBusy(true);
      try {
        await resetPasswordByEmail(cleanEmail);
        setResetSentTo(cleanEmail);
      } catch (err) {
        setErrorMsg(getFirebaseAuthErrorMessage(err));
      } finally {
        setEmailBusy(false);
      }
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (mode === 'register') {
      if (fullName.trim().length < 2) {
        setErrorMsg('Escribe tu nombre completo para crear tu cuenta.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Las contraseñas no coinciden.');
        return;
      }
    }

    setEmailBusy(true);
    try {
      if (mode === 'register') {
        await registerWithEmail(fullName, cleanEmail, password);
        onAuthenticated?.('email_register');
      } else {
        await signInWithEmail(cleanEmail, password);
        onAuthenticated?.('email_login');
      }
      onClose();
    } catch (err) {
      setErrorMsg(getFirebaseAuthErrorMessage(err));
    } finally {
      setEmailBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs overflow-y-auto p-4 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl my-auto">
        {/* Top bar */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-teal-300">
              Acceso seguro · LimpiaMX
            </p>
            <h2
              id="auth-modal-title"
              className="font-display text-xl font-bold mt-0.5"
            >
              {mode === 'register'
                ? 'Crea tu cuenta'
                : mode === 'reset'
                  ? 'Recuperar contraseña'
                  : 'Inicia sesión en LimpiaMX'}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Elige Google o tu correo electrónico y contraseña.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar ventana de acceso"
            onClick={onClose}
            disabled={isBusy}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {mode !== 'reset' && (
            <>
              {/* Método 1: Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isBusy}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-sm font-semibold flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {googleBusy ? (
                  <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
                ) : (
                  <GoogleMark />
                )}
                <span>
                  {googleBusy ? 'Conectando con Google...' : 'Continuar con Google'}
                </span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-xs text-slate-500 whitespace-nowrap">
                  o usa tu correo electrónico
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              {/* Selector Iniciar sesión / Crear cuenta */}
              <div
                role="tablist"
                aria-label="Opciones con correo"
                className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl border border-slate-200"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'register'}
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                  }}
                  className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                    mode === 'register'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Crear cuenta
                </button>
              </div>
            </>
          )}

          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setResetSentTo('');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a iniciar sesión</span>
            </button>
          )}

          {/* Método 2: Correo electrónico y contraseña */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-fullname"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Nombre completo
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-fullname"
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. María López García"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Contraseña
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('reset');
                        setErrorMsg('');
                      }}
                      className="text-xs font-medium text-teal-700 hover:underline cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-password-confirm"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-password-confirm"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
                  />
                </div>
              </div>
            )}

            {errorMsg && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed"
              >
                {errorMsg}
              </div>
            )}

            {resetSentTo && (
              <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-start gap-2 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  Enviamos un enlace de recuperación a <strong>{resetSentTo}</strong>. Revisa tu bandeja o spam.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={isBusy}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {emailBusy && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {mode === 'register'
                  ? emailBusy
                    ? 'Creando cuenta...'
                    : 'Crear cuenta con correo'
                  : mode === 'reset'
                    ? emailBusy
                      ? 'Enviando enlace...'
                      : 'Enviar enlace de recuperación'
                    : emailBusy
                      ? 'Ingresando...'
                      : 'Ingresar con correo'}
              </span>
            </button>
          </form>

          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 text-center pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span>Protegido por Firebase Authentication</span>
          </p>
        </div>
      </div>
    </div>
  );
};
