import React, { useMemo } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  Clock,
  Hammer,
  House,
  KeyRound,
  LifeBuoy,
  LogIn,
  MapPin,
  MessageSquareText,
  Shirt,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import {
  CITIES_MX,
  CityMX,
  CleanerListing,
  ReviewRecord,
  SERVICE_CATEGORIES,
  ServiceCategory,
} from '../types/marketplace';
import {
  FAQ_ITEMS,
  PLANS,
  REVENUE_IDEAS,
  SAFETY_NOW,
  SAFETY_SOON,
  SERVICE_INFO,
  SITE,
} from '../data/siteContent';
import type { ActiveSection } from './Header';

const WRAP = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

export function SectionHeading({
  title,
  text,
}: {
  title: string;
  text?: string;
}) {
  return (
    <div className="max-w-2xl mb-8 sm:mb-10">
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
        {title}
      </h2>
      {text && <p className="text-base text-slate-600 leading-relaxed">{text}</p>}
    </div>
  );
}

/* ---------- 1. Franja de cifras ---------- */

export function StatsStrip({
  cleaners,
  reviews,
}: {
  cleaners: CleanerListing[];
  reviews: ReviewRecord[];
}) {
  const { avgRate, totalCompleted } = useMemo(() => {
    if (cleaners.length === 0) return { avgRate: 0, totalCompleted: 0 };
    const rateSum = cleaners.reduce((sum, c) => sum + c.hourlyRateMxn, 0);
    const completedSum = cleaners.reduce((sum, c) => sum + c.completedCount, 0);
    return {
      avgRate: Math.round(rateSum / cleaners.length),
      totalCompleted: completedSum,
    };
  }, [cleaners]);

  const stats = [
    { value: String(cleaners.length), label: 'profesionales activos en el directorio' },
    {
      value: `${totalCompleted.toLocaleString('es-MX')}+`,
      label: 'servicios concluidos con reseña o historial',
    },
    { value: String(reviews.length), label: 'reseñas de contrataciones reales' },
    { value: avgRate ? `$${avgRate}` : '—', label: 'MXN por hora, tarifa promedio' },
  ];

  return (
    <section aria-label="Cifras de LimpiaMX" className="bg-slate-900 text-white">
      <dl className={`${WRAP} py-6 grid grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-6`}>
        {stats.map((s) => (
          <div key={s.label}>
            <dd className="font-display text-2xl sm:text-3xl font-bold tabular-nums">
              {s.value}
            </dd>
            <dt className="text-xs sm:text-sm text-slate-300 mt-0.5">{s.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ---------- 2. Servicios ---------- */

const SERVICE_ICON: Record<ServiceCategory, React.ElementType> = {
  Hogar: House,
  Profunda: Sparkles,
  Oficina: Building2,
  Airbnb: KeyRound,
  'Post-obra': Hammer,
  Planchado: Shirt,
};

export function ServiceTiles({
  onSelect,
}: {
  onSelect: (service: ServiceCategory) => void;
}) {
  return (
    <section
      aria-labelledby="servicios-titulo"
      className="bg-white border-b border-slate-200"
    >
      <div className={`${WRAP} py-10 sm:py-12`}>
        <h2
          id="servicios-titulo"
          className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-5"
        >
          ¿Qué necesitas limpiar?
        </h2>
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {SERVICE_CATEGORIES.map((srv) => {
            const Icon = SERVICE_ICON[srv];
            const info = SERVICE_INFO[srv];
            return (
              <li key={srv}>
                <button
                  type="button"
                  onClick={() => onSelect(srv)}
                  className="w-full h-full text-left bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-teal-600 hover:bg-teal-50/50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                  <Icon className="w-5 h-5 text-teal-700 mb-3" aria-hidden="true" />
                  <span className="block text-sm font-semibold text-slate-900">
                    {info.title}
                  </span>
                  <span className="block text-xs text-slate-600 mt-1 leading-relaxed">
                    {info.text}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------- 2B. Landing Page Showcase: Propuesta de valor + Actividad reciente ---------- */

const PORTFOLIO_SHOWCASE = [
  {
    src: '/src/assets/images/portfolio_kitchen_mexico_1795369390945.jpg',
    alt: 'Cocina mexicana limpia con cubiertas brillantes y ordenadas',
    label: 'Cocinas y hogar',
  },
  {
    src: '/src/assets/images/portfolio_airbnb_bedroom_1795369391747.jpg',
    alt: 'Recámara de departamento Airbnb preparada con tendido hotelero',
    label: 'Rotación Airbnb',
  },
  {
    src: '/src/assets/images/portfolio_office_mexico_1795327024079.jpg',
    alt: 'Oficina moderna y sala de juntas limpia y desinfectada',
    label: 'Oficinas y locales',
  },
  {
    src: '/src/assets/images/portfolio_merida_courtyard_1795369391799.jpg',
    alt: 'Terraza y patio residencial limpio en Mérida',
    label: 'Casas y terrazas',
  },
];

export function LandingActivityShowcase({
  cleaners,
  reviews,
  onSelectCleaner,
  onSelectCity,
  onExploreDirectory,
}: {
  cleaners: CleanerListing[];
  reviews: ReviewRecord[];
  onSelectCleaner: (id: string) => void;
  onSelectCity: (city: CityMX) => void;
  onExploreDirectory: () => void;
}) {
  const recentActivity = useMemo(() => {
    const byId = new Map(cleaners.map((c) => [c.id, c]));
    return reviews
      .filter((r) => byId.has(r.cleanerId))
      .slice(0, 6)
      .map((r, idx) => {
        const cl = byId.get(r.cleanerId)!;
        const hours = Math.max(cl.minHours, 3 + (idx % 2));
        const totalMxn = hours * cl.hourlyRateMxn;
        const colonia = cl.colonias[idx % cl.colonias.length] ?? cl.city;
        return {
          id: r.id,
          cleaner: cl,
          authorName: r.authorName,
          serviceType: r.serviceType,
          colonia,
          hours,
          totalMxn,
          whenLabel: r.createdAtLabel,
          rating: r.rating,
        };
      });
  }, [cleaners, reviews]);

  const citySummary = useMemo(() => {
    return CITIES_MX.map((city) => {
      const list = cleaners.filter((c) => c.city === city);
      const coloniasSet = new Set<string>();
      list.forEach((c) => c.colonias.forEach((col) => coloniasSet.add(col)));
      const completed = list.reduce((sum, c) => sum + c.completedCount, 0);
      const avgRate = list.length
        ? Math.round(list.reduce((s, c) => s + c.hourlyRateMxn, 0) / list.length)
        : 0;
      return {
        city,
        prosCount: list.length,
        coloniasCount: coloniasSet.size,
        completedCount: completed,
        avgRate,
      };
    });
  }, [cleaners]);

  return (
    <section
      aria-labelledby="actividad-reciente-titulo"
      className="bg-slate-50 border-b border-slate-200 py-14 sm:py-16"
    >
      <div className={`${WRAP} space-y-12`}>
        {/* Two-column Landing Prop + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left: Landing narrative + portfolio proof */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <p className="text-xs font-mono font-medium text-teal-800 uppercase tracking-wider mb-2">
                Contratación directa sin intermediarios
              </p>
              <h2
                id="actividad-reciente-titulo"
                className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance"
              >
                Por qué cientos de hogares y anfitriones reservan cada semana en {SITE.name}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mt-3">
                Cada perfil muestra su tarifa real en pesos mexicanos, colonias de cobertura y comentarios ligados a reservaciones concluidas.
              </p>
            </div>

            <ul className="space-y-3 border-t border-slate-200 pt-5">
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="text-slate-900">Precio total antes de confirmar.</strong> Eliges horas y sabes exactamente cuánto pagarás en MXN al terminar el servicio.
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="text-slate-900">Cobertura real por colonia.</strong> Filtra directamente por tu zona (Roma Norte, Las Américas, Providencia, San Pedro, Angelópolis, Juriquilla o Montejo).
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="text-slate-900">Reseñas vinculadas a citas.</strong> Solo clientes con reserva confirmada o completada pueden calificar a cada profesional.
                </span>
              </li>
            </ul>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {PORTFOLIO_SHOWCASE.map((item) => (
                <figure
                  key={item.src}
                  className="relative rounded-xl overflow-hidden border border-slate-200 bg-white aspect-[4/3]"
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 via-slate-950/30 to-transparent px-3 py-2 text-xs font-medium text-white">
                    {item.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          {/* Right: Live Verified Platform Activity */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900">
                  Actividad reciente en la plataforma
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Servicios concluidos y reseñas recientes en México
                </p>
              </div>
              <button
                type="button"
                onClick={onExploreDirectory}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <span>Ver directorio</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            <ul className="divide-y divide-slate-100">
              {recentActivity.map((act) => (
                <li key={act.id}>
                  <button
                    type="button"
                    onClick={() => onSelectCleaner(act.cleaner.id)}
                    className="w-full py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={act.cleaner.photoUrl}
                        alt={act.cleaner.displayName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover bg-slate-100 shrink-0 border border-slate-200"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {act.serviceType} · {act.colonia}, {act.cleaner.city}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          Cliente {act.authorName} con{' '}
                          <span className="font-medium text-slate-700">
                            {act.cleaner.displayName}
                          </span>
                          {' · '}
                          {act.whenLabel}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-slate-900 tabular-nums">
                        ${act.totalMxn.toLocaleString('es-MX')} MXN
                      </p>
                      <p className="text-xs text-slate-500 inline-flex items-center justify-end gap-1 tabular-nums">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                        <span>{act.rating}.0</span>
                        <span>· {act.hours} h</span>
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
              <span>¿Necesitas ayuda para elegir profesional en tu colonia?</span>
              <a
                href={`https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent('Hola, busco recomendación de limpieza en LimpiaMX.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-teal-700 hover:text-teal-800 underline underline-offset-2 tabular-nums"
              >
                Escríbenos por WhatsApp ({SITE.whatsappDisplay})
              </a>
            </div>
          </div>
        </div>

        {/* 7-City Live Coverage Cards */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Actividad por ciudad y zona metropolitana
              </h3>
              <p className="text-sm text-slate-600 mt-0.5">
                Selecciona tu ciudad para ver disponibilidad por colonia y tarifas locales.
              </p>
            </div>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {citySummary.map((item) => (
              <li key={item.city}>
                <button
                  type="button"
                  onClick={() => onSelectCity(item.city)}
                  className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-teal-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 font-display font-semibold text-slate-900">
                      <MapPin className="w-4 h-4 text-teal-700" aria-hidden="true" />
                      {item.city}
                    </span>
                    <span className="text-xs font-mono text-teal-700 font-medium tabular-nums">
                      ${item.avgRate}/hr prom.
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 tabular-nums">
                    {item.prosCount} profesionales · {item.coloniasCount} colonias ·{' '}
                    {item.completedCount} servicios
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- 3. Confianza y seguridad ---------- */

const NOW_ICONS = [LogIn, BadgeCheck, KeyRound, MessageSquareText, ShieldCheck, LifeBuoy];

export function SafetySection({
  onNavigate,
}: {
  onNavigate: (s: ActiveSection) => void;
}) {
  return (
    <section
      id="confianza"
      aria-labelledby="confianza-titulo"
      className="bg-slate-50 border-b border-slate-200 py-14 sm:py-16"
    >
      <div className={WRAP}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div className="max-w-2xl">
            <h2
              id="confianza-titulo"
              className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2"
            >
              Cómo cuidamos cada contratación
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Dejar entrar a alguien a tu casa u oficina es una decisión seria.
              Esto es lo que ya hace la plataforma y lo que viene.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('seguridad')}
            className="self-start md:self-auto px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            Ver consejos de seguridad
          </button>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SAFETY_NOW.map((item, i) => {
            const Icon = NOW_ICONS[i];
            return (
              <li
                key={item.title}
                className="bg-white border border-slate-200 rounded-xl p-5"
              >
                <Icon className="w-5 h-5 text-teal-700 mb-3" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 border border-dashed border-slate-300 rounded-xl p-5 bg-white/60">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
            <Clock className="w-4 h-4 text-slate-500" aria-hidden="true" />
            En camino
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SAFETY_SOON.map((item) => (
              <li key={item.title} className="text-sm text-slate-600 leading-relaxed">
                <span className="font-medium text-slate-800">{item.title}. </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- 4. Reseñas recientes ---------- */

export function ReviewsSection({
  reviews,
  cleaners,
  onSelectCleaner,
}: {
  reviews: ReviewRecord[];
  cleaners: CleanerListing[];
  onSelectCleaner: (id: string) => void;
}) {
  const picks = useMemo(() => {
    const byId = new Map(cleaners.map((c) => [c.id, c]));
    return reviews
      .filter((r) => r.rating >= 4 && r.comment.trim().length >= 35 && byId.has(r.cleanerId))
      .slice(0, 6)
      .map((r) => ({ review: r, cleaner: byId.get(r.cleanerId)! }));
  }, [reviews, cleaners]);

  if (picks.length === 0) return null;

  return (
    <section
      aria-labelledby="resenas-titulo"
      className="bg-white border-b border-slate-200 py-14 sm:py-16"
    >
      <div className={WRAP}>
        <div className="max-w-2xl mb-8 sm:mb-10">
          <h2
            id="resenas-titulo"
            className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2"
          >
            Lo que dicen quienes contrataron
          </h2>
          <p className="text-base text-slate-600 leading-relaxed tabular-nums">
            {reviews.length} reseñas publicadas por clientes con una reserva confirmada o completada.
          </p>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {picks.map(({ review, cleaner }) => (
            <li
              key={review.id}
              className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <p
                  className="flex items-center gap-0.5"
                  role="img"
                  aria-label={`${review.rating} de 5 estrellas`}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </p>
                <span className="text-xs text-slate-500">{review.createdAtLabel}</span>
              </div>
              <blockquote className="text-sm text-slate-700 leading-relaxed flex-1">
                “{review.comment}”
              </blockquote>
              <p className="text-sm font-semibold text-slate-900 mt-4">
                {review.authorName}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {review.serviceType} · {cleaner.city} con{' '}
                <button
                  type="button"
                  onClick={() => onSelectCleaner(cleaner.id)}
                  className="text-teal-700 hover:text-teal-800 underline underline-offset-2 cursor-pointer font-medium"
                >
                  {cleaner.displayName}
                </button>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- 5. Planes ---------- */

export function PlansSection({
  onGoToPublish,
  onWaitlist,
  showHeading = true,
}: {
  onGoToPublish: () => void;
  onWaitlist: () => void;
  showHeading?: boolean;
}) {
  return (
    <section
      id="planes"
      aria-labelledby="planes-titulo"
      className="bg-slate-50 border-b border-slate-200 py-14 sm:py-16"
    >
      <div className={WRAP}>
        {showHeading && (
          <div className="max-w-2xl mb-8 sm:mb-10">
            <h2
              id="planes-titulo"
              className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2"
            >
              Gratis para empezar, con planes para crecer
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Contratar siempre es gratis. Quien ofrece servicios puede publicar sin
              costo y subir de plan cuando quiera más clientes.
            </p>
          </div>
        )}

        <ul className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {PLANS.map((plan) => (
            <li
              key={plan.id}
              className={`bg-white rounded-xl p-6 flex flex-col border ${
                plan.highlight
                  ? 'border-teal-700 ring-1 ring-teal-700'
                  : 'border-slate-200'
              }`}
            >
              <h3 className="font-display text-lg font-semibold text-slate-900">
                {plan.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{plan.audience}</p>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-bold text-slate-900">
                  {plan.price}
                </span>
                <span className="text-sm text-slate-500">{plan.period}</span>
              </p>
              <ul className="mt-5 space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex gap-2 text-sm text-slate-700 leading-relaxed"
                  >
                    <Check
                      className="w-4 h-4 text-teal-700 mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.cta === 'publish' ? (
                <button
                  type="button"
                  onClick={onGoToPublish}
                  className="mt-6 px-5 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors cursor-pointer"
                >
                  Publicar mi anuncio gratis
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onWaitlist}
                  className="mt-6 px-5 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-sm font-medium hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Pedir acceso anticipado
                </button>
              )}
            </li>
          ))}
        </ul>

        <p className="mt-5 text-xs text-slate-500 leading-relaxed">
          Los planes Destacado y Empresas son parte del modelo de negocio propuesto y
          todavía no se cobran.
        </p>

        <div className="mt-10">
          <h3 className="font-display text-lg font-semibold text-slate-900 mb-4">
            Otras formas en que LimpiaMX genera ingresos
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {REVENUE_IDEAS.map((idea) => (
              <li
                key={idea.title}
                className="border border-slate-200 bg-white rounded-xl p-4"
              >
                <p className="text-sm font-semibold text-slate-900 mb-1">
                  {idea.title}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">{idea.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- 6. Preguntas frecuentes ---------- */

export function FaqList({ limit }: { limit?: number }) {
  const items = limit ? FAQ_ITEMS.slice(0, limit) : FAQ_ITEMS;
  return (
    <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
      {items.map((item) => (
        <details key={item.q} className="group px-5 py-4">
          <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-sm sm:text-base font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 [&::-webkit-details-marker]:hidden">
            {item.q}
            <ChevronDown
              className="w-4 h-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-3xl">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}

export function FaqSection({
  onNavigate,
}: {
  onNavigate: (s: ActiveSection) => void;
}) {
  return (
    <section
      id="preguntas"
      aria-labelledby="faq-titulo"
      className="bg-white border-b border-slate-200 py-14 sm:py-16"
    >
      <div className={`${WRAP} grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12`}>
        <div className="lg:col-span-4">
          <h2
            id="faq-titulo"
            className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2"
          >
            Preguntas frecuentes
          </h2>
          <p className="text-base text-slate-600 leading-relaxed mb-5">
            Lo que más nos preguntan antes de la primera contratación.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('faq')}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-sm font-medium hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Ver todas las preguntas
          </button>
        </div>
        <div className="lg:col-span-8">
          <FaqList limit={6} />
        </div>
      </div>
    </section>
  );
}

/* ---------- 7. Llamado final para profesionales ---------- */

export function ProCtaBanner({
  onGoToPublish,
  onNavigate,
}: {
  onGoToPublish: () => void;
  onNavigate: (s: ActiveSection) => void;
}) {
  return (
    <section aria-labelledby="cta-pro-titulo" className="bg-teal-700 text-white">
      <div
        className={`${WRAP} py-12 sm:py-14 flex flex-col md:flex-row md:items-center justify-between gap-6`}
      >
        <div className="max-w-2xl">
          <h2
            id="cta-pro-titulo"
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-2"
          >
            ¿Ofreces servicios de limpieza? Anúnciate en {SITE.name}
          </h2>
          <p className="text-teal-50 leading-relaxed">
            Publica tu perfil gratis, elige tus colonias y tu tarifa por hora, y
            recibe solicitudes de clientes cerca de ti.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            type="button"
            onClick={onGoToPublish}
            className="px-5 py-2.5 rounded-lg bg-white text-teal-900 text-sm font-semibold hover:bg-teal-50 transition-colors cursor-pointer"
          >
            Publicar mi anuncio gratis
          </button>
          <button
            type="button"
            onClick={() => onNavigate('planes')}
            className="px-5 py-2.5 rounded-lg border border-teal-200 text-white text-sm font-medium hover:bg-teal-800 transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <BadgeCheck className="w-4 h-4" aria-hidden="true" />
            Ver planes
          </button>
        </div>
      </div>
    </section>
  );
}
