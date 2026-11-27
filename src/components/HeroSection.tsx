import React, { useEffect, useState } from 'react';
import { MapPin, Search, ArrowRight, Calculator } from 'lucide-react';
import { CITIES_MX, CityMX, HERO_IMAGE_URL } from '../types/marketplace';
import { SITE } from '../data/siteContent';

interface HeroSectionProps {
  selectedCity: CityMX | 'Todas';
  searchQuery: string;
  totalCleaners?: number;
  totalReviews?: number;
  totalCompleted?: number;
  onSearchSubmit: (city: CityMX | 'Todas', queryText: string) => void;
  onGoToPublish: () => void;
  onGoToQuote?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  selectedCity,
  searchQuery,
  totalCleaners = 28,
  totalReviews = 42,
  totalCompleted = 940,
  onSearchSubmit,
  onGoToPublish,
  onGoToQuote,
}) => {
  const [cityInput, setCityInput] = useState<CityMX | 'Todas'>(selectedCity);
  const [queryInput, setQueryInput] = useState(searchQuery);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setCityInput(selectedCity);
  }, [selectedCity]);
  useEffect(() => {
    setQueryInput(searchQuery);
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(cityInput, queryInput);
  };

  return (
    <section className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10 lg:pt-14 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs sm:text-sm font-medium text-teal-800 mb-3">
              {CITIES_MX.join(' · ')}
            </p>

            <h1
              className="font-display font-bold text-slate-900 tracking-tight leading-[1.08] mb-5 max-w-2xl"
              style={{
                fontSize: 'clamp(2.25rem, 3.8vw, 3.35rem)',
                textWrap: 'balance',
              }}
            >
              Personal de limpieza de confianza para tu hogar, oficina o Airbnb
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mb-7">
              Compara tarifas transparentes por hora en MXN, revisa{' '}
              <span className="font-medium text-slate-800 tabular-nums">
                {totalReviews} reseñas verificadas
              </span>{' '}
              y contrata directo por colonia en 7 ciudades de México, sin anticipos ni
              comisiones ocultas.
            </p>

            <form
              onSubmit={handleSubmit}
              className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col sm:flex-row gap-2 mb-5"
            >
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg sm:w-44 shrink-0">
                <MapPin className="w-4 h-4 text-teal-700 shrink-0" />
                <label htmlFor="hero-city" className="sr-only">
                  Ciudad
                </label>
                <select
                  id="hero-city"
                  value={cityInput}
                  onChange={(e) =>
                    setCityInput(e.target.value as CityMX | 'Todas')
                  }
                  className="w-full bg-transparent text-sm font-medium text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="Todas">Todo México</option>
                  {CITIES_MX.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg flex-1 min-w-0">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <label htmlFor="hero-query" className="sr-only">
                  Colonia, alcaldía o especialidad
                </label>
                <input
                  id="hero-query"
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Colonia o servicio (ej. Roma Norte, Airbnb)"
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                Buscar personal
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <button
                type="button"
                onClick={onGoToPublish}
                className="inline-flex items-center gap-1.5 font-medium text-slate-900 hover:text-teal-700 transition-colors cursor-pointer py-1.5"
              >
                <span>Publica tu perfil gratis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {onGoToQuote && (
                <button
                  type="button"
                  onClick={onGoToQuote}
                  className="inline-flex items-center gap-1.5 font-medium text-teal-700 hover:text-teal-800 transition-colors cursor-pointer py-1.5"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Calcular costo en MXN</span>
                </button>
              )}
              <a
                href={`https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent('Hola, quiero información para contratar limpieza en LimpiaMX.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-teal-700 transition-colors py-1.5 tabular-nums"
              >
                <span>WhatsApp {SITE.whatsappDisplay}</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-64 sm:h-80 lg:h-full min-h-[340px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              {!imgFailed ? (
                <img
                  src={HERO_IMAGE_URL}
                  alt="Sala luminosa en departamento mexicano recién limpiado"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 via-teal-50 to-slate-200 flex flex-col items-center justify-center p-8 text-center">
                  <span className="font-display text-2xl font-semibold text-slate-800 mb-1">
                    LimpiaMX
                  </span>
                  <span className="text-sm text-slate-600">
                    Espacios impecables en todo México
                  </span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 sm:p-6">
                <p className="text-sm font-medium text-white tabular-nums">
                  {totalCleaners} profesionales activos · {totalCompleted.toLocaleString('es-MX')}+ servicios completados en México
                </p>
                <p className="text-xs text-slate-200 mt-1">
                  Tarifas claras por hora desde $175 MXN · Reservas con código de seguridad de 6 dígitos
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Marketplace Metrics Strip */}
        <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="font-display text-lg font-semibold text-slate-900 tabular-nums">
              {totalCompleted.toLocaleString('es-MX')}+ servicios
            </p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Limpiezas concluidas en casas, oficinas y estancias Airbnb
            </p>
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-slate-900 tabular-nums">
              Desde $175 MXN/hr
            </p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Tarifas transparentes por hora sin cargos ocultos
            </p>
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-slate-900 tabular-nums">
              {CITIES_MX.length} Zonas Metro
            </p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Cobertura por colonia y alcaldía con mapa radar
            </p>
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-slate-900 tabular-nums">
              Trato directo y seguro
            </p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Acceso con Google o correo, verificación INE y código en puerta
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
