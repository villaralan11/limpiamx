import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  CalendarCheck2,
  MapPin,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import {
  BookingRecord,
  CITIES_MX,
  CleanerListing,
  formatMxn,
  UserProfile,
} from '../types/marketplace';

interface AdminAnalyticsChartsProps {
  users: UserProfile[];
  cleaners: CleanerListing[];
  bookings: BookingRecord[];
}

type MonthWindow = 6 | 12;
type SignupSeriesMode = 'mensual' | 'acumulado';
type CityMetricMode = 'comparativo' | 'reservas';

interface MonthlyBookingPoint {
  monthKey: string;
  label: string;
  completadas: number;
  enProceso: number;
  canceladas: number;
  total: number;
  ingresosCompletadosMxn: number;
}

interface MonthlySignupPoint {
  monthKey: string;
  label: string;
  clientes: number;
  profesionales: number;
  total: number;
}

interface CityDistributionPoint {
  city: string;
  reservas: number;
  completadas: number;
  profesionales: number;
  usuarios: number;
  color: string;
}

const CITY_COLORS = [
  '#0f766e',
  '#0f172a',
  '#0284c7',
  '#d97706',
  '#059669',
  '#475569',
  '#0d9488',
  '#64748b',
];

function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatMonthLabel(date: Date): string {
  const raw = date.toLocaleDateString('es-MX', {
    month: 'short',
    year: '2-digit',
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1).replace('.', '');
}

function parseBookingDate(booking: BookingRecord): Date | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(booking.scheduledDate)) {
    const [y, m, d] = booking.scheduledDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  if (booking.createdAt) {
    return new Date(booking.createdAt);
  }
  if (booking.updatedAt) {
    return new Date(booking.updatedAt);
  }
  return null;
}

interface MonthlyBookingTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: MonthlyBookingPoint }>;
  label?: string;
}

const MonthlyBookingTooltip: React.FC<MonthlyBookingTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 shadow-sm text-xs space-y-1.5">
      <p className="font-semibold text-slate-900">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 text-slate-700">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-xs bg-teal-700 inline-block" />
            Completadas
          </span>
          <span className="font-semibold tabular-nums text-teal-800">
            {point.completadas}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-700">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-xs bg-slate-900 inline-block" />
            Pendientes / Confirmadas
          </span>
          <span className="font-semibold tabular-nums text-slate-900">
            {point.enProceso}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-xs bg-slate-300 inline-block" />
            Canceladas
          </span>
          <span className="font-semibold tabular-nums text-slate-700">
            {point.canceladas}
          </span>
        </div>
        <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-4 font-semibold text-slate-900">
          <span>Total del mes</span>
          <span className="tabular-nums">{point.total}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-600">
          <span>Volumen completado</span>
          <span className="font-semibold tabular-nums text-teal-800">
            {formatMxn(point.ingresosCompletadosMxn)}
          </span>
        </div>
      </div>
    </div>
  );
};

interface MonthlySignupTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: MonthlySignupPoint }>;
  label?: string;
  mode: SignupSeriesMode;
}

const MonthlySignupTooltip: React.FC<MonthlySignupTooltipProps> = ({
  active,
  payload,
  label,
  mode,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 shadow-sm text-xs space-y-1.5">
      <p className="font-semibold text-slate-900">
        {label} · {mode === 'mensual' ? 'Altas del mes' : 'Acumulado'}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 text-slate-700">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-xs bg-teal-700 inline-block" />
            Usuarios (clientes)
          </span>
          <span className="font-semibold tabular-nums text-slate-900">
            {point.clientes}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-700">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-xs bg-slate-900 inline-block" />
            Profesionales
          </span>
          <span className="font-semibold tabular-nums text-slate-900">
            {point.profesionales}
          </span>
        </div>
        <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-4 font-semibold text-slate-900">
          <span>Total</span>
          <span className="tabular-nums">{point.total}</span>
        </div>
      </div>
    </div>
  );
};

interface CityTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: CityDistributionPoint }>;
}

const CityDistributionTooltip: React.FC<CityTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 shadow-sm text-xs space-y-1.5">
      <p className="font-semibold text-slate-900">{point.city}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4 text-slate-700">
          <span>Reservas totales</span>
          <span className="font-semibold tabular-nums text-slate-900">
            {point.reservas}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-700">
          <span>Completadas</span>
          <span className="font-semibold tabular-nums text-teal-800">
            {point.completadas}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-700">
          <span>Profesionales</span>
          <span className="font-semibold tabular-nums text-slate-900">
            {point.profesionales}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-700">
          <span>Usuarios registrados</span>
          <span className="font-semibold tabular-nums text-slate-900">
            {point.usuarios}
          </span>
        </div>
      </div>
    </div>
  );
};

export const AdminAnalyticsCharts: React.FC<AdminAnalyticsChartsProps> = ({
  users,
  cleaners,
  bookings,
}) => {
  const [monthWindow, setMonthWindow] = useState<MonthWindow>(6);
  const [signupMode, setSignupMode] = useState<SignupSeriesMode>('mensual');
  const [cityMetricMode, setCityMetricMode] =
    useState<CityMetricMode>('comparativo');

  // Lista ordenada de los últimos N meses calendario
  const monthBuckets = useMemo(() => {
    const now = new Date();
    const list: { key: string; label: string; start: Date }[] = [];
    for (let offset = monthWindow - 1; offset >= 0; offset -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      list.push({
        key: toMonthKey(d),
        label: formatMonthLabel(d),
        start: d,
      });
    }
    return list;
  }, [monthWindow]);

  // 1. Reservas mensuales (completadas, en proceso, canceladas e ingresos)
  const monthlyBookings = useMemo(() => {
    const bucketMap: Record<string, MonthlyBookingPoint> = {};
    for (const m of monthBuckets) {
      bucketMap[m.key] = {
        monthKey: m.key,
        label: m.label,
        completadas: 0,
        enProceso: 0,
        canceladas: 0,
        total: 0,
        ingresosCompletadosMxn: 0,
      };
    }

    let allCompletedCount = 0;
    let allCompletedRevenue = 0;
    let windowCompletedCount = 0;
    let windowTotalCount = 0;
    let windowCompletedRevenue = 0;

    for (const bk of bookings) {
      if (bk.status === 'completed') {
        allCompletedCount += 1;
        allCompletedRevenue += Number(bk.totalMxn || 0);
      }
      const d = parseBookingDate(bk);
      if (!d) continue;
      const key = toMonthKey(d);
      const bucket = bucketMap[key];
      if (!bucket) continue;

      bucket.total += 1;
      windowTotalCount += 1;
      if (bk.status === 'completed') {
        bucket.completadas += 1;
        bucket.ingresosCompletadosMxn += Number(bk.totalMxn || 0);
        windowCompletedCount += 1;
        windowCompletedRevenue += Number(bk.totalMxn || 0);
      } else if (bk.status === 'cancelled') {
        bucket.canceladas += 1;
      } else {
        bucket.enProceso += 1;
      }
    }

    const series = monthBuckets.map((m) => bucketMap[m.key]);
    const completionRate =
      bookings.length > 0
        ? Math.round((allCompletedCount / bookings.length) * 100)
        : 0;

    return {
      series,
      allCompletedCount,
      allCompletedRevenue,
      windowCompletedCount,
      windowTotalCount,
      windowCompletedRevenue,
      completionRate,
    };
  }, [bookings, monthBuckets]);

  // 2. Nuevas altas mensuales de usuarios (clientes) y profesionales
  const monthlySignups = useMemo(() => {
    const windowStart = monthBuckets[0]?.start ?? new Date();
    const monthlyClients: Record<string, number> = {};
    const monthlyPros: Record<string, number> = {};

    let baseClients = 0;
    let basePros = 0;
    let newClientsInWindow = 0;
    let newProsInWindow = 0;

    for (const u of users) {
      const isPro = u.role === 'professional';
      if (!u.createdAt) {
        if (isPro) basePros += 1;
        else baseClients += 1;
        continue;
      }
      const created = new Date(u.createdAt);
      const monthDate = new Date(created.getFullYear(), created.getMonth(), 1);
      if (monthDate < windowStart) {
        if (isPro) basePros += 1;
        else baseClients += 1;
        continue;
      }
      const key = toMonthKey(monthDate);
      if (isPro) {
        monthlyPros[key] = (monthlyPros[key] ?? 0) + 1;
        newProsInWindow += 1;
      } else {
        monthlyClients[key] = (monthlyClients[key] ?? 0) + 1;
        newClientsInWindow += 1;
      }
    }

    const monthlySeries: MonthlySignupPoint[] = [];
    const cumulativeSeries: MonthlySignupPoint[] = [];
    let runningClients = baseClients;
    let runningPros = basePros;

    for (const m of monthBuckets) {
      const c = monthlyClients[m.key] ?? 0;
      const p = monthlyPros[m.key] ?? 0;
      runningClients += c;
      runningPros += p;

      monthlySeries.push({
        monthKey: m.key,
        label: m.label,
        clientes: c,
        profesionales: p,
        total: c + p,
      });

      cumulativeSeries.push({
        monthKey: m.key,
        label: m.label,
        clientes: runningClients,
        profesionales: runningPros,
        total: runningClients + runningPros,
      });
    }

    const totalClients = users.filter((u) => u.role === 'client').length;
    const totalPros = users.filter((u) => u.role === 'professional').length;

    return {
      monthlySeries,
      cumulativeSeries,
      newClientsInWindow,
      newProsInWindow,
      newTotalInWindow: newClientsInWindow + newProsInWindow,
      totalClients,
      totalPros,
      rolePie: [
        { name: 'Clientes', value: totalClients, color: '#0f766e' },
        { name: 'Profesionales', value: totalPros, color: '#0f172a' },
      ],
    };
  }, [users, monthBuckets]);

  // 3. Distribución por ciudad (reservas, completadas, profesionales y usuarios)
  const cityDistribution = useMemo(() => {
    const cityMap: Record<string, CityDistributionPoint> = {};

    CITIES_MX.forEach((city, idx) => {
      cityMap[city] = {
        city,
        reservas: 0,
        completadas: 0,
        profesionales: 0,
        usuarios: 0,
        color: CITY_COLORS[idx % CITY_COLORS.length],
      };
    });

    const ensureCity = (rawCity: string): CityDistributionPoint => {
      const clean = rawCity.trim() || 'Otra';
      if (!cityMap[clean]) {
        cityMap[clean] = {
          city: clean,
          reservas: 0,
          completadas: 0,
          profesionales: 0,
          usuarios: 0,
          color: CITY_COLORS[Object.keys(cityMap).length % CITY_COLORS.length],
        };
      }
      return cityMap[clean];
    };

    for (const bk of bookings) {
      const entry = ensureCity(bk.city);
      entry.reservas += 1;
      if (bk.status === 'completed') {
        entry.completadas += 1;
      }
    }

    for (const cl of cleaners) {
      const entry = ensureCity(cl.city);
      entry.profesionales += 1;
    }

    for (const u of users) {
      if (!u.city) continue;
      const entry = ensureCity(u.city);
      entry.usuarios += 1;
    }

    const list = Object.values(cityMap).sort(
      (a, b) =>
        b.reservas - a.reservas ||
        b.profesionales - a.profesionales ||
        b.usuarios - a.usuarios
    );

    const activeCities = list.filter(
      (c) => c.reservas > 0 || c.profesionales > 0 || c.usuarios > 0
    ).length;

    const topCity = list[0] ?? null;
    const pieData = list.filter((c) => c.reservas > 0);

    return {
      list,
      pieData,
      activeCities,
      topCity,
    };
  }, [bookings, cleaners, users]);

  const activeSignupSeries =
    signupMode === 'mensual'
      ? monthlySignups.monthlySeries
      : monthlySignups.cumulativeSeries;

  return (
    <div className="space-y-6">
      {/* Encabezado y selector de ventana mensual */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
            Resumen gráfico mensual y cobertura por ciudad
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Evolución de reservas completadas, altas mensuales de usuarios y profesionales y distribución geográfica en LimpiaMX.
          </p>
        </div>

        <div
          role="group"
          aria-label="Periodo de análisis mensual"
          className="inline-flex rounded-lg bg-slate-100 p-1 self-start sm:self-auto shrink-0"
        >
          <button
            type="button"
            onClick={() => setMonthWindow(6)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              monthWindow === 6
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Últimos 6 meses
          </button>
          <button
            type="button"
            onClick={() => setMonthWindow(12)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              monthWindow === 12
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Últimos 12 meses
          </button>
        </div>
      </div>

      {/* KPIs del resumen mensual */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
            <span>Reservas completadas</span>
            <CalendarCheck2 className="w-4 h-4 text-teal-700" />
          </div>
          <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">
            {monthlyBookings.allCompletedCount}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {monthlyBookings.completionRate}% de tasa · {formatMxn(monthlyBookings.allCompletedRevenue)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
            <span>Altas ({monthWindow} meses)</span>
            <UserPlus className="w-4 h-4 text-teal-700" />
          </div>
          <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">
            {monthlySignups.newTotalInWindow}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {monthlySignups.newClientsInWindow} clientes · {monthlySignups.newProsInWindow} profesionales
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
            <span>Profesionales totales</span>
            <TrendingUp className="w-4 h-4 text-slate-700" />
          </div>
          <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">
            {monthlySignups.totalPros}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {cleaners.length} anuncios publicados
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
            <span>Ciudades con actividad</span>
            <MapPin className="w-4 h-4 text-teal-700" />
          </div>
          <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">
            {cityDistribution.activeCities}
          </p>
          <p className="text-xs text-slate-500 mt-1 truncate">
            {cityDistribution.topCity
              ? `Mayor demanda: ${cityDistribution.topCity.city}`
              : 'Sin registros por ciudad'}
          </p>
        </div>
      </div>

      {/* Gráfica 1: Resumen mensual de reservas */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4 text-teal-700 shrink-0" />
              <h3 className="font-display text-base font-bold text-slate-900">
                Reservas mensuales (últimos {monthWindow} meses)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Desglose mensual de servicios completados, pendientes/confirmados y cancelados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 tabular-nums">
            <span>
              <strong className="text-teal-800 font-semibold">
                {monthlyBookings.windowCompletedCount}
              </strong>{' '}
              completadas en el periodo
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="text-slate-900 font-semibold">
                {monthlyBookings.windowTotalCount}
              </strong>{' '}
              reservas totales
            </span>
          </div>
        </div>

        <div className="h-[260px] w-full min-w-0">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={monthlyBookings.series}
              margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<MonthlyBookingTooltip />} />
              <Legend
                iconType="square"
                iconSize={9}
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              />
              <Bar
                dataKey="completadas"
                name="Completadas"
                stackId="bookings"
                fill="#0f766e"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="enProceso"
                name="Pendientes / Confirmadas"
                stackId="bookings"
                fill="#0f172a"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="canceladas"
                name="Canceladas"
                stackId="bookings"
                fill="#cbd5e1"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfica 2 y 3: Altas mensuales de usuarios y profesionales + Balance de roles */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-700 shrink-0" />
                <h3 className="font-display text-base font-bold text-slate-900">
                  Nuevas altas mensuales: usuarios y profesionales
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                +{monthlySignups.newClientsInWindow} usuarios clientes · +
                {monthlySignups.newProsInWindow} profesionales en los últimos{' '}
                {monthWindow} meses
              </p>
            </div>

            <div className="inline-flex rounded-lg bg-slate-100 p-1 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setSignupMode('mensual')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  signupMode === 'mensual'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por mes
              </button>
              <button
                type="button"
                onClick={() => setSignupMode('acumulado')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  signupMode === 'acumulado'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Acumulado
              </button>
            </div>
          </div>

          <div className="h-[240px] w-full min-w-0">
            <ResponsiveContainer width="100%" height={240}>
              {signupMode === 'mensual' ? (
                <BarChart
                  data={activeSignupSeries}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<MonthlySignupTooltip mode={signupMode} />} />
                  <Legend
                    iconType="square"
                    iconSize={9}
                    wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }}
                  />
                  <Bar
                    dataKey="clientes"
                    name="Usuarios (clientes)"
                    fill="#0f766e"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="profesionales"
                    name="Profesionales"
                    fill="#0f172a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <AreaChart
                  data={activeSignupSeries}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="limpiaMonthlyClients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0.03} />
                    </linearGradient>
                    <linearGradient id="limpiaMonthlyPros" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<MonthlySignupTooltip mode={signupMode} />} />
                  <Legend
                    iconType="square"
                    iconSize={9}
                    wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="clientes"
                    name="Usuarios (clientes)"
                    stackId="users"
                    stroke="#0f766e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#limpiaMonthlyClients)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profesionales"
                    name="Profesionales"
                    stackId="users"
                    stroke="#0f172a"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#limpiaMonthlyPros)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución por tipo de cuenta */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-display text-base font-bold text-slate-900">
                Clientes vs Profesionales
              </h3>
              <BarChart3 className="w-4 h-4 text-teal-700 shrink-0" />
            </div>
            <p className="text-xs text-slate-500">
              Proporción acumulada entre {users.length} cuentas en la base de datos.
            </p>
          </div>

          {users.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-slate-500 text-center">
              Aún no hay usuarios registrados.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 items-center gap-4 pt-3">
              <div className="h-[210px] min-w-0 relative">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={monthlySignups.rolePie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {monthlySignups.rolePie.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [
                        `${Number(val ?? 0)} cuentas`,
                        String(name ?? ''),
                      ]}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-display text-xl font-bold text-slate-900 tabular-nums leading-none">
                    {users.length}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    cuentas
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-0.5">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                      <span className="w-2.5 h-2.5 rounded-xs bg-teal-700 inline-block" />
                      Clientes
                    </span>
                    <span className="tabular-nums font-semibold text-slate-900">
                      {users.length > 0
                        ? Math.round((monthlySignups.totalClients / users.length) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <p className="font-display text-xl font-bold text-slate-900 tabular-nums">
                    {monthlySignups.totalClients}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-0.5">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                      <span className="w-2.5 h-2.5 rounded-xs bg-slate-900 inline-block" />
                      Profesionales
                    </span>
                    <span className="tabular-nums font-semibold text-slate-900">
                      {users.length > 0
                        ? Math.round((monthlySignups.totalPros / users.length) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <p className="font-display text-xl font-bold text-slate-900 tabular-nums">
                    {monthlySignups.totalPros}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gráfica 4: Distribución por ciudad */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-700 shrink-0" />
              <h3 className="font-display text-base font-bold text-slate-900">
                Distribución por ciudad
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparativa por plaza entre reservas registradas, servicios completados, profesionales y usuarios.
            </p>
          </div>

          <div className="inline-flex rounded-lg bg-slate-100 p-1 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setCityMetricMode('comparativo')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                cityMetricMode === 'comparativo'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Comparativo
            </button>
            <button
              type="button"
              onClick={() => setCityMetricMode('reservas')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                cityMetricMode === 'reservas'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Solo reservas
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={cityDistribution.list}
                margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="city"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CityDistributionTooltip />} />
                <Legend
                  iconType="square"
                  iconSize={9}
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                />
                {cityMetricMode === 'comparativo' ? (
                  <>
                    <Bar
                      dataKey="reservas"
                      name="Reservas"
                      fill="#0f766e"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="completadas"
                      name="Completadas"
                      fill="#0284c7"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="profesionales"
                      name="Profesionales"
                      fill="#0f172a"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="usuarios"
                      name="Usuarios"
                      fill="#94a3b8"
                      radius={[4, 4, 0, 0]}
                    />
                  </>
                ) : (
                  <>
                    <Bar
                      dataKey="reservas"
                      name="Reservas totales"
                      fill="#0f766e"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="completadas"
                      name="Reservas completadas"
                      fill="#0f172a"
                      radius={[4, 4, 0, 0]}
                    />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Desglose tabular compacto por ciudad */}
          <div className="lg:col-span-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-2 font-semibold">Ciudad</th>
                  <th className="py-2 px-2 font-semibold text-right">Reservas</th>
                  <th className="py-2 px-2 font-semibold text-right">Compl.</th>
                  <th className="py-2 pl-2 font-semibold text-right">Pros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {cityDistribution.list.map((row) => (
                  <tr key={row.city} className="hover:bg-slate-50">
                    <td className="py-2 pr-2 font-medium text-slate-900">
                      {row.city}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-700">
                      {row.reservas}
                    </td>
                    <td className="py-2 px-2 text-right font-semibold text-teal-800">
                      {row.completadas}
                    </td>
                    <td className="py-2 pl-2 text-right text-slate-700">
                      {row.profesionales}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
