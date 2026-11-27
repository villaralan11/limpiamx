import { CleanerListing } from '../types/marketplace';

// ---------------------------------------------------------------------------
// Código de seguridad en la puerta (diferenciador de LimpiaMX)
// ---------------------------------------------------------------------------
// Cada reserva genera un código de 6 dígitos DETERMINÍSTICO derivado del folio
// y la fecha. Así el cliente y el profesional ven el mismo código sin guardar
// campos nuevos en Firestore (las reglas validan el esquema con hasOnly).
// En producción: genera el código al confirmar la reserva y guárdalo cifrado.

export function getDoorCode(bookingId: string, scheduledDate: string): string {
  const seed = `${bookingId}|${scheduledDate}`;
  let hash = 7;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 2147483647;
  }
  return String(100000 + (hash % 900000));
}

export interface DoorCodeInfo {
  code: string;
  expiresLabel: string;
}

export function getDoorCodeInfo(booking: {
  id: string;
  scheduledDate: string;
}): DoorCodeInfo {
  const code = getDoorCode(booking.id, booking.scheduledDate);
  const date = new Date(`${booking.scheduledDate}T12:00:00`);
  const label = Number.isNaN(date.getTime())
    ? 'el día del servicio'
    : `válido el ${date.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })}`;
  return { code, expiresLabel: label };
}

// ---------------------------------------------------------------------------
// Disponibilidad semanal derivada del texto del anuncio
// ---------------------------------------------------------------------------
// "Lun a Sáb · 08:30 a 18:00" → días habilitados. Se complementa con fechas
// ya reservadas (deterministas por perfil) para el calendario de reserva.

const DAY_ALIASES: { key: number; regex: RegExp }[] = [
  { key: 0, regex: /\bdom/i },
  { key: 1, regex: /\blun/i },
  { key: 2, regex: /\bmar/i },
  { key: 3, regex: /\bmi[eé]/i },
  { key: 4, regex: /\bjue/i },
  { key: 5, regex: /\bvie/i },
  { key: 6, regex: /\bs[aá]b/i },
];

export function parseAvailableWeekdays(availability: string): number[] {
  const days = DAY_ALIASES.filter((d) => d.regex.test(availability)).map(
    (d) => d.key
  );
  return days.length > 0 ? days : [1, 2, 3, 4, 5, 6];
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Fechas "ya ocupadas" deterministas para perfiles de demostración:
 * ~2 fechas ocupadas por semana a partir del hash del id. En producción esto
 * se alimenta de las reservas confirmadas reales de cada profesional.
 */
export function getDemoBookedDates(cleaner: CleanerListing): Set<string> {
  const booked = new Set<string>();
  let hash = 5;
  for (let i = 0; i < cleaner.id.length; i++) {
    hash = (hash * 33 + cleaner.id.charCodeAt(i)) % 1000003;
  }
  const today = new Date();
  for (let offset = 1; offset <= 21; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dayIndex = d.getDay();
    const availableDays = parseAvailableWeekdays(cleaner.availability);
    if (!availableDays.includes(dayIndex)) continue;
    // Uno de cada cinco días disponibles queda ocupado, con rotación estable.
    if ((hash + offset * 7) % 5 === 0) {
      booked.add(isoDate(d));
    }
  }
  return booked;
}

export function isCleanerAvailableOn(
  cleaner: CleanerListing,
  dateIso: string
): boolean {
  const date = new Date(`${dateIso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const todayIso = isoDate(new Date());
  if (dateIso <= todayIso) return false;
  if (!parseAvailableWeekdays(cleaner.availability).includes(date.getDay())) {
    return false;
  }
  return !getDemoBookedDates(cleaner).has(dateIso);
}

/** Próximos N días con estado de disponibilidad, para el calendario del modal. */
export function getAvailabilityPreview(
  cleaner: CleanerListing,
  days = 14
): { dateIso: string; weekdayLabel: string; dayLabel: string; available: boolean; booked: boolean }[] {
  const booked = getDemoBookedDates(cleaner);
  const weekdays = parseAvailableWeekdays(cleaner.availability);
  const out: {
    dateIso: string;
    weekdayLabel: string;
    dayLabel: string;
    available: boolean;
    booked: boolean;
  }[] = [];
  const today = new Date();
  for (let offset = 1; out.length < days && offset <= 30; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dateIso = isoDate(d);
    const isWeekdayOk = weekdays.includes(d.getDay());
    const isBooked = booked.has(dateIso);
    out.push({
      dateIso,
      weekdayLabel: d.toLocaleDateString('es-MX', { weekday: 'short' }),
      dayLabel: d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
      available: isWeekdayOk && !isBooked,
      booked: isBooked,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Reglas de cancelación
// ---------------------------------------------------------------------------

export interface CancellationRuleTier {
  window: string;
  charge: string;
  tone: 'ok' | 'warn' | 'bad';
}

export const CANCELLATION_TIERS: CancellationRuleTier[] = [
  {
    window: 'Más de 24 horas antes del servicio',
    charge: 'Cancelación gratuita, reprogramación sin costo',
    tone: 'ok',
  },
  {
    window: 'Menos de 24 horas antes',
    charge: 'Cargo del 50% de las horas acordadas',
    tone: 'warn',
  },
  {
    window: 'El profesional no llega (más de 30 min de tolerancia)',
    charge: 'Cancelación sin cargo y prioridad para reagenda',
    tone: 'ok',
  },
  {
    window: 'El cliente no abre la puerta (sin aviso)',
    charge: 'Cargo del 100% de la primera hora',
    tone: 'bad',
  },
];

export function getFreeCancellationDeadline(
  scheduledDate: string,
  scheduledTime: string
): string | null {
  const dateTime = new Date(`${scheduledDate}T${scheduledTime || '09:00'}:00`);
  if (Number.isNaN(dateTime.getTime())) return null;
  const deadline = new Date(dateTime.getTime() - 24 * 60 * 60 * 1000);
  return deadline.toLocaleString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
