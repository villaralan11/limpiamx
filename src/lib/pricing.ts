import {
  CATALOG_CLEANERS,
} from '../data/catalog';
import {
  CityMX,
  CleanerListing,
  formatMxn,
  ServiceCategory,
} from '../types/marketplace';

// ---------------------------------------------------------------------------
// Estadísticas de tarifas por ciudad (derivadas del catálogo + anuncios vivos)
// ---------------------------------------------------------------------------

export interface CityRateStats {
  city: CityMX | 'Todas';
  count: number;
  minRate: number;
  maxRate: number;
  avgRate: number;
}

export function computeCityRateStats(
  cleaners: CleanerListing[],
  city: CityMX | 'Todas'
): CityRateStats {
  const pool = cleaners.filter(
    (cl) => cl.status === 'active' && (city === 'Todas' || cl.city === city)
  );
  const rates = pool.map((cl) => cl.hourlyRateMxn);
  if (rates.length === 0) {
    // Fallback: usa el catálogo estático para que la UI nunca se quede sin números.
    const fallback = CATALOG_CLEANERS.filter(
      (cl) => city === 'Todas' || cl.city === city
    ).map((cl) => cl.hourlyRateMxn);
    return summarize(city, fallback);
  }
  return summarize(city, rates);
}

function summarize(
  city: CityMX | 'Todas',
  rates: number[]
): CityRateStats {
  if (rates.length === 0) {
    return { city, count: 0, minRate: 195, maxRate: 270, avgRate: 224 };
  }
  return {
    city,
    count: rates.length,
    minRate: Math.min(...rates),
    maxRate: Math.max(...rates),
    avgRate: Math.round(rates.reduce((s, r) => s + r, 0) / rates.length),
  };
}

// ---------------------------------------------------------------------------
// Cotizador: m², recámaras y baños → horas estimadas y rango de precio
// ---------------------------------------------------------------------------

export type QuoteFrequency = 'unica' | 'quincenal' | 'semanal';

export interface QuoteInput {
  city: CityMX;
  serviceType: ServiceCategory;
  areaM2: number;
  bedrooms: number;
  bathrooms: number;
  suppliesIncluded: boolean;
  frequency: QuoteFrequency;
}

export interface QuoteResult {
  hours: number;
  rateLow: number;
  rateHigh: number;
  totalLow: number;
  totalHigh: number;
  avgRate: number;
  frequencyDiscountPct: number;
}

/** Recargo o descuento por tipo de servicio sobre el trabajo base. */
const SERVICE_HOURS_FACTOR: Record<ServiceCategory, number> = {
  Hogar: 1,
  Profunda: 1.55,
  Oficina: 0.9,
  Airbnb: 0.85,
  'Post-obra': 1.8,
  Planchado: 0.6,
};

/** Ajuste de tarifa por hora según especialidad (profundidad y riesgo). */
const SERVICE_RATE_FACTOR: Record<ServiceCategory, number> = {
  Hogar: 1,
  Profunda: 1.12,
  Oficina: 1.05,
  Airbnb: 1.05,
  'Post-obra': 1.2,
  Planchado: 0.92,
};

const FREQUENCY_DISCOUNT_PCT: Record<QuoteFrequency, number> = {
  unica: 0,
  quincenal: 8,
  semanal: 15,
};

/**
 * Modelo de horas: toma en cuenta superficie, recámaras y baños.
 * Calibrado para un departamento de 80 m², 2 recámaras y 1 baño ≈ 4.5 horas.
 */
export function estimateHours(input: QuoteInput): number {
  const base =
    1.5 +
    input.areaM2 / 35 +
    input.bedrooms * 0.75 +
    input.bathrooms * 0.5;
  const withService = base * (SERVICE_HOURS_FACTOR[input.serviceType] ?? 1);
  return Math.max(2, Math.min(12, Math.ceil(withService)));
}

export function buildQuote(
  input: QuoteInput,
  stats: CityRateStats
): QuoteResult {
  const hours = estimateHours(input);
  const serviceRateFactor = SERVICE_RATE_FACTOR[input.serviceType] ?? 1;
  const suppliesFactor = input.suppliesIncluded ? 1 : 0.92;
  const midpoint = stats.avgRate * serviceRateFactor * suppliesFactor;
  const spread = 0.12; // rango honesto de ±12%
  const applyFrequency = (value: number) =>
    Math.round(value * (1 - FREQUENCY_DISCOUNT_PCT[input.frequency] / 100));

  const rateLow = applyFrequency(midpoint * (1 - spread));
  const rateHigh = applyFrequency(midpoint * (1 + spread));
  return {
    hours,
    rateLow,
    rateHigh,
    totalLow: rateLow * hours,
    totalHigh: rateHigh * hours,
    avgRate: Math.round(midpoint),
    frequencyDiscountPct: FREQUENCY_DISCOUNT_PCT[input.frequency],
  };
}

export function formatQuoteRange(result: QuoteResult): string {
  return `${formatMxn(result.totalLow)} – ${formatMxn(result.totalHigh)} MXN`;
}
