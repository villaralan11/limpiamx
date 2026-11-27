import React, { useMemo, useState } from 'react';
import { Calculator, CheckCircle2, Info } from 'lucide-react';
import {
  CITIES_MX,
  CityMX,
  CleanerListing,
  formatMxn,
  SERVICE_CATEGORIES,
  ServiceCategory,
} from '../types/marketplace';
import {
  buildQuote,
  computeCityRateStats,
  estimateHours,
  QuoteFrequency,
  QuoteResult,
} from '../lib/pricing';
import { ActiveSection } from './Header';

interface QuoteCalculatorProps {
  cleaners: CleanerListing[];
  initialCity?: CityMX;
  onNavigate: (section: ActiveSection) => void;
  onExploreCity: (city: CityMX) => void;
}

const FREQUENCY_OPTIONS: { id: QuoteFrequency; label: string; note: string }[] = [
  { id: 'unica', label: 'Una sola vez', note: 'Precio estándar' },
  { id: 'quincenal', label: 'Cada quincena', note: '−8% de referencia' },
  { id: 'semanal', label: 'Cada semana', note: '−15% de referencia' },
];

const SERVICE_NOTES: Partial<Record<ServiceCategory, string>> = {
  Hogar: 'Mantenimiento general de espacios habitados.',
  Profunda: 'Detalle a fondo: canceles, azulejos, interior de electrodomésticos.',
  Oficina: 'Escritorios, sanitarios y áreas comunes.',
  Airbnb: 'Rotación entre huéspedes con cambio de blancos.',
  'Post-obra': 'Polvo fino, residuos de pintura y ventaneles.',
  Planchado: 'Planchado y acomodo de ropa a domicilio.',
};

export const QuoteCalculator: React.FC<QuoteCalculatorProps> = ({
  cleaners,
  initialCity = 'CDMX',
  onNavigate,
  onExploreCity,
}) => {
  const [city, setCity] = useState<CityMX>(initialCity);
  const [serviceType, setServiceType] = useState<ServiceCategory>('Hogar');
  const [areaM2, setAreaM2] = useState(80);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [suppliesIncluded, setSuppliesIncluded] = useState(true);
  const [frequency, setFrequency] = useState<QuoteFrequency>('unica');

  const stats = useMemo(
    () => computeCityRateStats(cleaners, city),
    [cleaners, city]
  );

  const input = useMemo(
    () => ({
      city,
      serviceType,
      areaM2,
      bedrooms,
      bathrooms,
      suppliesIncluded,
      frequency,
    }),
    [city, serviceType, areaM2, bedrooms, bathrooms, suppliesIncluded, frequency]
  );

  const quote: QuoteResult = useMemo(() => buildQuote(input, stats), [input, stats]);
  const hours = estimateHours(input);

  const handleExplore = () => {
    onExploreCity(city);
    onNavigate('explorar');
  };

  return (
    <div className="bg-slate-50 min-h-full">
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-teal-700 text-white flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <h1 className="font-display text-3xl font-bold text-slate-900">
              Cotizador de limpieza
            </h1>
          </div>
          <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
            Dinos qué tipo de inmueble tienes y te damos un estimado de horas y
            costo basado en las tarifas reales del catálogo de tu ciudad. Es una
            referencia para reservar y negociar, no un precio fijo.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulario */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="quote-city"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Ciudad
              </label>
              <select
                id="quote-city"
                value={city}
                onChange={(e) => setCity(e.target.value as CityMX)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 cursor-pointer"
              >
                {CITIES_MX.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="quote-service"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Tipo de servicio
              </label>
              <select
                id="quote-service"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceCategory)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 cursor-pointer"
              >
                {SERVICE_CATEGORIES.map((s) => (
                  <option key={s} value={s}>
                    Limpieza {s}
                  </option>
                ))}
              </select>
              {SERVICE_NOTES[serviceType] && (
                <p className="text-[11px] text-slate-500 mt-1">
                  {SERVICE_NOTES[serviceType]}
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="quote-area"
                className="text-xs font-medium text-slate-700"
              >
                Metros cuadrados
              </label>
              <span className="text-xs font-semibold text-teal-800 tabular-nums">
                {areaM2} m²
              </span>
            </div>
            <input
              id="quote-area"
              type="range"
              min={30}
              max={400}
              step={10}
              value={areaM2}
              onChange={(e) => setAreaM2(Number(e.target.value))}
              className="w-full accent-teal-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 tabular-nums mt-0.5">
              <span>30 m²</span>
              <span>400 m²</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="quote-bedrooms"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Recámaras
              </label>
              <select
                id="quote-bedrooms"
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 cursor-pointer tabular-nums"
              >
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n === 0 ? 'Estudio / sin recámara' : n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="quote-bathrooms"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Baños
              </label>
              <select
                id="quote-bathrooms"
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 cursor-pointer tabular-nums"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-700 mb-2">
              Frecuencia
            </p>
            <div className="grid grid-cols-3 gap-2">
              {FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFrequency(opt.id)}
                  className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    frequency === opt.id
                      ? 'border-teal-700 bg-teal-50 text-teal-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                    {opt.note}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <label className="inline-flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={suppliesIncluded}
              onChange={(e) => setSuppliesIncluded(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-teal-700 border-slate-300"
            />
            <span>
              El profesional trae insumos y productos
              <span className="block text-xs text-slate-500">
                Si usas los tuyos, la tarifa estimada baja ~8%.
              </span>
            </span>
          </label>
        </div>

        {/* Resultado */}
        <div className="lg:col-span-5">
          <div className="bg-white border-2 border-teal-600 rounded-xl p-6 sticky top-20">
            <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider mb-1">
              Estimado para tu limpieza
            </p>
            <p className="text-[11px] text-slate-500 mb-4 tabular-nums">
              {city} · {areaM2} m² · {bedrooms}{' '}
              {bedrooms === 1 ? 'recámara' : 'recámaras'} · {bathrooms}{' '}
              {bathrooms === 1 ? 'baño' : 'baños'}
            </p>

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
              <p className="font-display text-2xl sm:text-3xl font-bold text-teal-900 tabular-nums leading-tight">
                {formatMxn(quote.totalLow)} – {formatMxn(quote.totalHigh)}
              </p>
              <p className="text-xs text-teal-800 mt-1 tabular-nums">
                total estimado · {hours} {hours === 1 ? 'hora' : 'horas'} ×{' '}
                {formatMxn(quote.rateLow)}–{formatMxn(quote.rateHigh)}/hr
              </p>
            </div>

            <ul className="space-y-2.5 text-sm text-slate-700 mb-5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  Tarifa promedio por hora en {city}:{' '}
                  <strong className="tabular-nums">
                    {formatMxn(stats.avgRate)}
                  </strong>{' '}
                  (rango {formatMxn(stats.minRate)}–{formatMxn(stats.maxRate)}).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  {SERVICE_NOTES[serviceType] ?? 'Servicio estándar del catálogo.'}
                </span>
              </li>
              {quote.frequencyDiscountPct > 0 && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <span>
                    Descuento por frecuencia de referencia: −
                    {quote.frequencyDiscountPct}% (se acuerda con el profesional).
                  </span>
                </li>
              )}
            </ul>

            <button
              type="button"
              onClick={handleExplore}
              className="w-full py-3 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors cursor-pointer"
            >
              Ver profesionales en {city}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('seguridad')}
              className="w-full py-2.5 mt-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Conocer la garantía y el código de la puerta
            </button>

            <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3 mt-4">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 leading-relaxed">
                El estimado usa horas calculadas por m², recámaras y baños, con
                recargos por tipo de servicio. La tarifa final la fija cada
                profesional y puede variar según el estado del inmueble.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
