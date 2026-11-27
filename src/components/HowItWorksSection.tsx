import React from 'react';
import {
  ArrowRight,
  CalendarCheck,
  KeyRound,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  UserPlus,
} from 'lucide-react';

interface HowItWorksSectionProps {
  isSignedIn: boolean;
  onSignIn: () => void;
  onGoToProfile: () => void;
  onGoToExplore: () => void;
  onGoToQuote: () => void;
  onGoToPublish: () => void;
}

const RegisterIllustration: React.FC = () => (
  <div
    className="relative h-32 rounded-lg bg-teal-50/70 px-5 flex items-center justify-between overflow-hidden"
    aria-hidden="true"
  >
    <div className="w-12 h-12 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0">
      <UserPlus className="w-6 h-6" />
    </div>
    <svg
      viewBox="0 0 180 88"
      className="w-40 h-22 text-teal-800"
      fill="none"
    >
      <rect x="12" y="10" width="156" height="68" rx="10" fill="#ffffff" />
      <circle cx="40" cy="36" r="13" fill="#ccfbf1" />
      <circle cx="40" cy="33" r="5" fill="#0f766e" />
      <path
        d="M30 46c2.4-4 6-6 10-6s7.6 2 10 6"
        stroke="#0f766e"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <rect x="64" y="26" width="66" height="7" rx="3.5" fill="#0f172a" />
      <rect x="64" y="39" width="48" height="5" rx="2.5" fill="#94a3b8" />
      <rect x="64" y="54" width="84" height="10" rx="5" fill="#f1f5f9" />
      <circle cx="147" cy="28" r="10" fill="#0f766e" />
      <path
        d="M142.5 28l3 3 5.5-5.5"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 self-start mt-3" />
  </div>
);

const SearchIllustration: React.FC = () => (
  <div
    className="relative h-32 rounded-lg bg-slate-100/90 px-5 flex items-center justify-between overflow-hidden"
    aria-hidden="true"
  >
    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
      <Search className="w-6 h-6" />
    </div>
    <svg
      viewBox="0 0 180 88"
      className="w-40 h-22"
      fill="none"
    >
      <rect x="10" y="8" width="160" height="24" rx="8" fill="#ffffff" />
      <circle cx="26" cy="20" r="5" stroke="#0f766e" strokeWidth="2" />
      <path
        d="M30 24l3.5 3.5"
        stroke="#0f766e"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="40" y="17" width="76" height="6" rx="3" fill="#cbd5e1" />
      <rect x="10" y="40" width="160" height="40" rx="8" fill="#ffffff" />
      <circle cx="30" cy="60" r="10" fill="#e2e8f0" />
      <rect x="48" y="51" width="60" height="6" rx="3" fill="#0f172a" />
      <rect x="48" y="63" width="44" height="5" rx="2.5" fill="#94a3b8" />
      <rect x="122" y="52" width="38" height="16" rx="5" fill="#ccfbf1" />
      <path
        d="M130 60h22"
        stroke="#0f766e"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
    <div className="flex flex-col items-end justify-between h-full py-3 shrink-0">
      <MapPin className="w-5 h-5 text-teal-700" />
      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
    </div>
  </div>
);

const ScheduleIllustration: React.FC = () => (
  <div
    className="relative h-32 rounded-lg bg-teal-50/70 px-5 flex items-center justify-between overflow-hidden"
    aria-hidden="true"
  >
    <div className="w-12 h-12 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0">
      <CalendarCheck className="w-6 h-6" />
    </div>
    <svg
      viewBox="0 0 180 88"
      className="w-40 h-22"
      fill="none"
    >
      <rect x="14" y="10" width="152" height="68" rx="10" fill="#ffffff" />
      <rect x="14" y="10" width="152" height="20" rx="10" fill="#0f172a" />
      <rect x="14" y="22" width="152" height="8" fill="#0f172a" />
      <circle cx="44" cy="20" r="2.5" fill="#5eead4" />
      <circle cx="136" cy="20" r="2.5" fill="#5eead4" />
      <rect x="28" y="40" width="22" height="12" rx="3" fill="#f1f5f9" />
      <rect x="58" y="40" width="22" height="12" rx="3" fill="#f1f5f9" />
      <rect x="88" y="40" width="22" height="12" rx="3" fill="#0f766e" />
      <rect x="118" y="40" width="22" height="12" rx="3" fill="#f1f5f9" />
      <rect x="28" y="58" width="64" height="8" rx="4" fill="#e2e8f0" />
      <rect x="104" y="58" width="48" height="8" rx="4" fill="#ccfbf1" />
    </svg>
    <KeyRound className="w-5 h-5 text-teal-700 shrink-0 self-start mt-3" />
  </div>
);

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  isSignedIn,
  onSignIn,
  onGoToProfile,
  onGoToExplore,
  onGoToQuote,
  onGoToPublish,
}) => {
  const steps = [
    {
      number: '01',
      eyebrow: 'Paso 01 · Cuenta en segundos',
      title: 'Regístrate en LimpiaMX',
      description:
        'Inicia sesión con Google o con tu correo y contraseña, registra tu teléfono y define tu colonia en México para recibir confirmaciones sin formularios largos.',
      illustration: <RegisterIllustration />,
      actionLabel: isSignedIn ? 'Ver mi perfil' : 'Crear cuenta gratis',
      onAction: isSignedIn ? onGoToProfile : onSignIn,
      isPrimary: !isSignedIn,
    },
    {
      number: '02',
      eyebrow: 'Paso 02 · Directorio y mapa radar',
      title: 'Busca profesional',
      description:
        'Filtra por ciudad, colonia y tipo de limpieza (hogar, profunda, oficina o Airbnb). Compara tarifas transparentes en MXN, experiencia y reseñas verificadas.',
      illustration: <SearchIllustration />,
      actionLabel: 'Explorar profesionales',
      onAction: onGoToExplore,
      isPrimary: false,
    },
    {
      number: '03',
      eyebrow: 'Paso 03 · Reserva protegida',
      title: 'Agenda la limpieza',
      description:
        'Elige fecha, hora y duración, conoce el total exacto en MXN antes de confirmar y coordina la visita con código de seguridad en puerta y chat directo.',
      illustration: <ScheduleIllustration />,
      actionLabel: 'Cotizar y agendar',
      onAction: onGoToQuote,
      isPrimary: true,
    },
  ];

  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-titulo"
      className="bg-slate-50 border-t border-slate-200 py-16 sm:py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-12">
          <div className="max-w-2xl">
            <p className="text-xs font-mono font-medium text-teal-800 tracking-wide mb-2">
              Cómo funciona · Flujo en 3 pasos
            </p>
            <h2
              id="como-funciona-titulo"
              className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance"
            >
              Contrata limpieza confiable en tres pasos claros
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md">
            Desde crear tu cuenta hasta recibir a tu profesional en puerta, cada paso muestra precios reales en MXN y comunicación directa.
          </p>
        </div>

        <ol className="bg-white border border-slate-200 rounded-xl grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {steps.map((step, index) => (
            <li key={step.number} className="p-6 sm:p-8 flex flex-col">
              <div className="flex items-center justify-between gap-3 mb-5">
                <span className="text-xs font-medium text-slate-500">
                  {step.eyebrow}
                </span>
                <span className="font-mono text-sm font-semibold text-teal-700 tabular-nums">
                  {step.number}
                </span>
              </div>

              <div className="mb-6">{step.illustration}</div>

              <div className="flex items-center gap-2 mb-2.5">
                <h3 className="font-display text-xl font-semibold text-slate-900">
                  {step.title}
                </h3>
                {index < steps.length - 1 && (
                  <ArrowRight
                    className="hidden lg:inline w-4 h-4 text-slate-300 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </div>

              <p className="text-sm text-slate-600 leading-relaxed flex-1">
                {step.description}
              </p>

              <div className="mt-6 pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={step.onAction}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                    step.isPrimary
                      ? 'bg-teal-700 text-white hover:bg-teal-800'
                      : 'bg-slate-900 text-white hover:bg-teal-700'
                  }`}
                >
                  <span>{step.actionLabel}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              ¿Ofreces servicios de limpieza?
            </span>{' '}
            Regístrate con Google o tu correo electrónico, fija tu tarifa por hora en MXN y recibe solicitudes en tu colonia sin costo de publicación.
          </p>
          <button
            type="button"
            onClick={onGoToPublish}
            className="self-start sm:self-auto px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-medium hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Publicar mi servicio gratis
          </button>
        </div>
      </div>
    </section>
  );
};
