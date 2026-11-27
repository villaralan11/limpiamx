import React from 'react';
import { ShieldCheck } from 'lucide-react';

// ---------------------------------------------------------------------------
// Insignia "Verificado" (identidad con INE)
// ---------------------------------------------------------------------------

export const VerifiedBadge: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => {
  if (compact) {
    return (
      <span
        title="Identidad verificada con INE"
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded px-1.5 py-0.5 shrink-0"
      >
        <ShieldCheck className="w-3 h-3 text-teal-700" />
        Verificado
      </span>
    );
  }
  return (
    <span
      title="Identidad verificada con INE por el equipo de LimpiaMX"
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1"
    >
      <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
      <span>Verificado con INE</span>
    </span>
  );
};

// ---------------------------------------------------------------------------
// Icono de WhatsApp (marca oficial simplificada, SVG inline)
// ---------------------------------------------------------------------------

export const WhatsAppIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

// ---------------------------------------------------------------------------
// Ilustraciones SVG (sin dependencias externas, colores del sistema)
// ---------------------------------------------------------------------------

export const IllustrationSearch: React.FC<{ className?: string }> = ({
  className = 'w-40 h-32 mx-auto',
}) => (
  <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
    <rect x="30" y="70" width="120" height="70" rx="10" fill="#f0fdfa" stroke="#99f6e4" />
    <rect x="45" y="88" width="90" height="8" rx="4" fill="#ccfbf1" />
    <rect x="45" y="104" width="70" height="8" rx="4" fill="#ccfbf1" />
    <rect x="45" y="120" width="80" height="8" rx="4" fill="#ccfbf1" />
    <circle cx="140" cy="55" r="28" fill="none" stroke="#0f766e" strokeWidth="6" />
    <line x1="160" y1="75" x2="180" y2="95" stroke="#0f766e" strokeWidth="8" strokeLinecap="round" />
    <path d="M128 45 q12 -8 24 0" fill="none" stroke="#14b8a6" strokeWidth="4" strokeLinecap="round" />
    <circle cx="55" cy="40" r="4" fill="#99f6e4" />
    <circle cx="70" cy="25" r="3" fill="#5eead4" />
    <circle cx="92" cy="42" r="3.5" fill="#99f6e4" />
  </svg>
);

export const IllustrationFavorites: React.FC<{ className?: string }> = ({
  className = 'w-40 h-32 mx-auto',
}) => (
  <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
    <rect x="35" y="50" width="130" height="90" rx="12" fill="#f0fdfa" stroke="#99f6e4" />
    <rect x="60" y="30" width="80" height="60" rx="10" fill="#ccfbf1" />
    <path
      d="M100 105 c-14 -12 -30 -22 -30 -38 a14 14 0 0 1 26 -8 a14 14 0 0 1 26 8 c0 16 -16 26 -30 38 z"
      transform="translate(4,-12) scale(0.9)"
      fill="#14b8a6"
    />
    <circle cx="50" cy="40" r="4" fill="#99f6e4" />
    <circle cx="152" cy="35" r="3" fill="#5eead4" />
  </svg>
);

export const IllustrationCalendar: React.FC<{ className?: string }> = ({
  className = 'w-40 h-32 mx-auto',
}) => (
  <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
    <rect x="35" y="40" width="130" height="95" rx="12" fill="#f0fdfa" stroke="#99f6e4" />
    <rect x="35" y="40" width="130" height="26" rx="12" fill="#0f766e" />
    <rect x="35" y="55" width="130" height="12" fill="#0f766e" />
    <rect x="58" y="28" width="10" height="24" rx="5" fill="#134e4a" />
    <rect x="132" y="28" width="10" height="24" rx="5" fill="#134e4a" />
    {[0, 1, 2, 3, 4].map((col) =>
      [0, 1, 2].map((row) => (
        <rect
          key={`${col}-${row}`}
          x={52 + col * 21}
          y={80 + row * 16}
          width="14"
          height="10"
          rx="3"
          fill={col === 2 && row === 1 ? '#14b8a6' : '#ccfbf1'}
        />
      ))
    )}
    <circle cx="172" cy="130" r="10" fill="#fbbf24" />
    <path d="M172 124 l3 4 6 -7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const IllustrationNotFound: React.FC<{ className?: string }> = ({
  className = 'w-48 h-36 mx-auto',
}) => (
  <svg viewBox="0 0 220 170" className={className} aria-hidden="true">
    <rect x="45" y="60" width="90" height="85" rx="10" fill="#f0fdfa" stroke="#99f6e4" />
    <path d="M45 60 L90 25 L135 60 Z" fill="#ccfbf1" stroke="#99f6e4" />
    <rect x="78" y="105" width="24" height="40" rx="4" fill="#0f766e" />
    <rect x="105" y="75" width="20" height="18" rx="4" fill="#fbbf24" />
    <line x1="150" y1="70" x2="185" y2="105" stroke="#0f766e" strokeWidth="7" strokeLinecap="round" />
    <circle cx="145" cy="62" r="18" fill="none" stroke="#14b8a6" strokeWidth="6" />
    <text x="145" y="68" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#0f766e">?</text>
    <circle cx="60" cy="35" r="4" fill="#99f6e4" />
    <circle cx="190" cy="45" r="3" fill="#5eead4" />
    <path d="M150 145 q10 8 24 4" fill="none" stroke="#99f6e4" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const IllustrationRadar: React.FC<{ className?: string }> = ({
  className = 'w-40 h-32 mx-auto',
}) => (
  <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
    <circle cx="100" cy="85" r="55" fill="#f0fdfa" stroke="#99f6e4" />
    <circle cx="100" cy="85" r="35" fill="none" stroke="#ccfbf1" strokeWidth="4" />
    <circle cx="100" cy="85" r="18" fill="none" stroke="#14b8a6" strokeWidth="4" />
    <circle cx="100" cy="85" r="6" fill="#0f766e" />
    <circle cx="128" cy="60" r="7" fill="#fbbf24" />
    <circle cx="75" cy="105" r="7" fill="#fbbf24" />
    <line x1="100" y1="85" x2="150" y2="45" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />
    <circle cx="150" cy="45" r="4" fill="#14b8a6" />
  </svg>
);

// ---------------------------------------------------------------------------
// EmptyState reutilizable para catálogo, favoritos, reservas y radar
// ---------------------------------------------------------------------------

type EmptyIllustration = 'search' | 'favorites' | 'calendar' | 'radar';

interface EmptyStateProps {
  variant: EmptyIllustration;
  title: string;
  body: string;
  action?: React.ReactNode;
  secondary?: React.ReactNode;
}

const ILLUSTRATIONS: Record<EmptyIllustration, React.FC<{ className?: string }>> = {
  search: IllustrationSearch,
  favorites: IllustrationFavorites,
  calendar: IllustrationCalendar,
  radar: IllustrationRadar,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant,
  title,
  body,
  action,
  secondary,
}) => {
  const Illustration = ILLUSTRATIONS[variant];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
      <Illustration />
      <h3 className="font-display text-lg font-semibold text-slate-900 mt-4 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
        {body}
      </p>
      {(action || secondary) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {action}
          {secondary}
        </div>
      )}
    </div>
  );
};
