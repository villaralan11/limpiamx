import React from 'react';
import { CheckCircle2, MapPin, Star } from 'lucide-react';
import {
  CITIES_MX,
  CITY_SLUGS,
  CityMX,
  CleanerListing,
} from '../types/marketplace';
import { CITY_PAGE_CONTENT } from '../data/cityPages';
import { CityRateStats } from '../lib/pricing';
import { formatMxn } from '../types/marketplace';
import { VerifiedBadge } from './SharedUI';
import { ActiveSection } from './Header';

interface CityPageProps {
  city: CityMX;
  cleaners: CleanerListing[];
  rateStats: CityRateStats;
  onSelectCleaner: (cleaner: CleanerListing) => void;
  onNavigate: (section: ActiveSection) => void;
  onExploreCity: (city: CityMX) => void;
}

export const CityPage: React.FC<CityPageProps> = ({
  city,
  cleaners,
  rateStats,
  onSelectCleaner,
  onNavigate,
  onExploreCity,
}) => {
  const content = CITY_PAGE_CONTENT[city];
  const cityCleaners = cleaners
    .filter((cl) => cl.city === city && cl.status === 'active')
    .slice(0, 6);
  const otherCities = CITIES_MX.filter((c) => c !== city);

  const handleExplore = () => {
    onExploreCity(city);
    onNavigate('explorar');
  };

  return (
    <div className="bg-slate-50">
      {/* Encabezado editorial */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <nav aria-label="Ruta" className="text-xs text-slate-500 mb-4">
            <button
              type="button"
              onClick={() => onNavigate('explorar')}
              className="hover:text-teal-700 cursor-pointer"
            >
              Inicio
            </button>
            <span className="mx-1.5">/</span>
            <span className="text-slate-700">Limpieza en {city}</span>
          </nav>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3 text-balance">
            {content.headline}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
            {content.intro[0]}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="font-display text-xl font-bold text-slate-900 tabular-nums">
                {formatMxn(rateStats.avgRate)}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                tarifa promedio por hora
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="font-display text-xl font-bold text-slate-900 tabular-nums">
                {formatMxn(rateStats.minRate)} – {formatMxn(rateStats.maxRate)}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                rango de tarifas del catálogo
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="font-display text-xl font-bold text-slate-900 tabular-nums">
                {rateStats.count}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                perfiles activos publicados
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="font-display text-xl font-bold text-slate-900 tabular-nums">
                {content.zonasDestacadas.length}+
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                colonias con cobertura declarada
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <button
              type="button"
              onClick={handleExplore}
              className="px-5 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors cursor-pointer"
            >
              Ver profesionales en {city}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('cotizador')}
              className="px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cotizar mi limpieza
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Pros de la ciudad */}
        <section>
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">
            Por qué contratar en {city} con LimpiaMX
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            {content.intro[1]}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {content.ventajas.map((v) => (
              <div
                key={v.title}
                className="bg-white border border-slate-200 rounded-xl p-5"
              >
                <div className="flex items-start gap-2.5 mb-1.5">
                  <CheckCircle2 className="w-4.5 h-4.5 text-teal-700 shrink-0 mt-0.5" />
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {v.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {v.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Colonias destacadas */}
        <section>
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">
            Colonias con más demanda
          </h2>
          <p className="text-sm text-slate-600 mb-5">{content.intro[2]}</p>
          <div className="flex flex-wrap gap-2">
            {content.zonasDestacadas.map((zona) => (
              <span
                key={zona}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-700"
              >
                <MapPin className="w-3.5 h-3.5 text-teal-700" />
                {zona}
              </span>
            ))}
          </div>
        </section>

        {/* Profesionales de la ciudad */}
        <section>
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">
            Profesionales destacados en {city}
          </h2>
          <p className="text-sm text-slate-600 mb-5">
            Tarifa por hora visible, reseñas de contrataciones reales y coberturas por colonia.
          </p>
          {cityCleaners.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-600">
              Aún no hay perfiles activos publicados para {city}. Publícalos
              gratis desde Anúnciate.
            </div>
          ) : (
            <div className="space-y-3">
              {cityCleaners.map((cl) => (
                <button
                  key={cl.id}
                  type="button"
                  onClick={() => onSelectCleaner(cl)}
                  className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  <img
                    src={cl.photoUrl}
                    alt={cl.displayName}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-display text-base font-semibold text-slate-900 truncate">
                        {cl.businessName || cl.displayName}
                      </h3>
                      {cl.identityVerified && <VerifiedBadge compact />}
                    </div>
                    <p className="text-xs text-slate-500 truncate mb-1">
                      {cl.city} · {cl.colonias.slice(0, 3).join(', ')}
                    </p>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {cl.headline}
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-900 tabular-nums">
                      <Star className="w-3.5 h-3.5 inline fill-amber-500 text-amber-500 mr-1" />
                      {cl.ratingAvg.toFixed(1)}
                    </p>
                    <p className="text-sm font-bold text-teal-800 tabular-nums">
                      {formatMxn(cl.hourlyRateMxn)}/hr
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Consejos locales */}
        <section>
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-4">
            Consejos locales antes de reservar
          </h2>
          <ol className="space-y-3">
            {content.consejos.map((tip, idx) => (
              <li key={tip} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-700 text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-700 leading-relaxed">{tip}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ de la ciudad */}
        <section>
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-4">
            Preguntas frecuentes sobre limpieza en {city}
          </h2>
          <div className="space-y-3">
            {content.faq.map((item) => (
              <details
                key={item.q}
                className="bg-white border border-slate-200 rounded-xl px-5 py-4"
              >
                <summary className="text-sm font-semibold text-slate-900 cursor-pointer">
                  {item.q}
                </summary>
                <p className="text-sm text-slate-600 leading-relaxed mt-2.5">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Otras ciudades */}
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold text-slate-900 mb-3">
            Limpieza en otras ciudades
          </h2>
          <div className="flex flex-wrap gap-2">
            {otherCities.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onNavigate(CITY_SLUGS[c] as ActiveSection)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:border-teal-600 hover:bg-teal-50/60 text-sm text-slate-700 transition-colors cursor-pointer"
              >
                Limpieza en {c}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
