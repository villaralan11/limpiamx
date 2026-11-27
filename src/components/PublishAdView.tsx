import React, { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { Award, CheckCircle2, Plus, Star, Trash2 } from 'lucide-react';
import {
  CITIES_MX,
  CITY_TO_DEFAULT_STATE,
  CleanerListing,
  formatMxn,
  PORTRAIT_PRESETS,
  SERVICE_CATEGORIES,
  ServiceCategory,
  STATES_MX,
  UserProfile,
  VALIDATION_LIMITS,
} from '../types/marketplace';
import { uploadUserImage } from '../lib/firebase';
import {
  createCleanerListing,
  saveUserProfile,
  updateCleanerListing,
} from '../lib/marketplaceService';
import { ColoniaSmartSelector } from './ColoniaSmartSelector';

interface PublishAdViewProps {
  user: User | null;
  userProfile: UserProfile | null;
  editingListing: CleanerListing | null;
  onSignIn: () => Promise<void>;
  onSaved: (isEdit: boolean) => void;
  onCancelEdit: () => void;
}

export const PublishAdView: React.FC<PublishAdViewProps> = ({
  user,
  userProfile,
  editingListing,
  onSignIn,
  onSaved,
  onCancelEdit,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [state, setState] = useState('Ciudad de México');
  const [city, setCity] = useState('CDMX');
  const [selectedColonias, setSelectedColonias] = useState<string[]>([
    'Roma Norte',
    'Condesa',
  ]);
  const [services, setServices] = useState<ServiceCategory[]>(['Hogar', 'Profunda']);
  const [hourlyRateMxn, setHourlyRateMxn] = useState(230);
  const [fixedServiceRateMxn, setFixedServiceRateMxn] = useState(0);
  const [minHours, setMinHours] = useState(3);
  const [yearsExperience, setYearsExperience] = useState(4);
  const [includesSupplies, setIncludesSupplies] = useState(true);
  const [availability, setAvailability] = useState('Lun a Sáb · 08:30 a 18:00');
  const [photoUrl, setPhotoUrl] = useState(PORTRAIT_PRESETS[0].url);
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const prefilledRef = useRef(false);

  useEffect(() => {
    if (editingListing) {
      setDisplayName(editingListing.displayName);
      setBusinessName(editingListing.businessName || '');
      setHeadline(editingListing.headline);
      setBio(editingListing.bio);
      setState(
        editingListing.state ||
          CITY_TO_DEFAULT_STATE[editingListing.city] ||
          'Ciudad de México'
      );
      setCity(editingListing.city);
      setSelectedColonias(editingListing.colonias || []);
      setServices(editingListing.services);
      setHourlyRateMxn(editingListing.hourlyRateMxn);
      setFixedServiceRateMxn(editingListing.fixedServiceRateMxn || 0);
      setMinHours(editingListing.minHours);
      setYearsExperience(editingListing.yearsExperience);
      setIncludesSupplies(editingListing.includesSupplies);
      setAvailability(editingListing.availability);
      setPhotoUrl(editingListing.photoUrl || PORTRAIT_PRESETS[0].url);
      setPortfolioUrls(editingListing.portfolioUrls || []);
      prefilledRef.current = true;
    } else if (userProfile && !prefilledRef.current) {
      setDisplayName(
        `${userProfile.firstName} ${userProfile.lastName}`.trim() ||
          user?.displayName ||
          ''
      );
      if (userProfile.state) setState(userProfile.state);
      if (userProfile.city) setCity(userProfile.city);
      if (userProfile.neighborhood) {
        const parsed = userProfile.neighborhood
          .split(',')
          .map((c) => c.trim())
          .filter((c) => c.length >= 2)
          .slice(0, VALIDATION_LIMITS.coloniaMaxCount);
        if (parsed.length > 0) setSelectedColonias(parsed);
      }
      if (userProfile.photoURL) setPhotoUrl(userProfile.photoURL);
      if (userProfile.description) setBio(userProfile.description);
      prefilledRef.current = true;
    }
  }, [editingListing, userProfile, user]);

  const toggleService = (srv: ServiceCategory) => {
    setServices((prev) =>
      prev.includes(srv)
        ? prev.length > 1
          ? prev.filter((s) => s !== srv)
          : prev
        : [...prev, srv]
    );
  };

  const handlePortfolioUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user || portfolioUrls.length >= 3) return;
    setErrorMsg('');
    try {
      const url = await uploadUserImage(user.uid, file, 'portfolio');
      setPortfolioUrls((prev) => [...prev, url].slice(0, 3));
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'No se pudo cargar la foto.'
      );
    }
  };

  const parsedColonias = selectedColonias
    .map((c) => c.trim())
    .filter((c) => c.length >= 2)
    .slice(0, VALIDATION_LIMITS.coloniaMaxCount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      await onSignIn();
      return;
    }

    if (displayName.trim().length < VALIDATION_LIMITS.displayName.min) {
      setErrorMsg('Escribe tu nombre completo o nombre profesional.');
      return;
    }
    if (headline.trim().length < VALIDATION_LIMITS.headline.min) {
      setErrorMsg('Escribe un título breve de al menos 5 caracteres.');
      return;
    }
    if (bio.trim().length < VALIDATION_LIMITS.bio.min) {
      setErrorMsg('Describe tu experiencia con al menos 15 caracteres.');
      return;
    }
    if (parsedColonias.length === 0) {
      setErrorMsg('Agrega al menos una colonia o zona de cobertura.');
      return;
    }

    setSaving(true);
    try {
      // Ensure user role reflects professional if they were client
      if (userProfile && userProfile.role !== 'professional') {
        await saveUserProfile(
          {
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            photoURL: userProfile.photoURL || photoUrl,
            phone: userProfile.phone,
            role: 'professional',
            country: userProfile.country,
            state: userProfile.state,
            city: userProfile.city,
            neighborhood: userProfile.neighborhood,
            postalCode: userProfile.postalCode,
            description: userProfile.description,
            contactPreference: userProfile.contactPreference,
            profileCompleted: true,
          },
          true
        );
      }

      const payload = {
        displayName,
        businessName,
        headline,
        bio,
        state,
        city,
        colonias: parsedColonias,
        services,
        hourlyRateMxn,
        fixedServiceRateMxn,
        minHours,
        yearsExperience,
        includesSupplies,
        availability,
        photoUrl,
        portfolioUrls,
      };

      if (editingListing) {
        await updateCleanerListing(editingListing.id, payload);
        onSaved(true);
      } else {
        await createCleanerListing(payload);
        onSaved(false);
      }
    } catch {
      setErrorMsg(
        'No se pudo guardar tu anuncio. Revisa que todos los campos cumplan el formato requerido.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mb-10">
        <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider mb-2">
          Para profesionales y equipos de limpieza
        </p>
        <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight mb-3">
          {editingListing
            ? 'Editar anuncio publicado'
            : 'Publica tu anuncio sin costo en LimpiaMX'}
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          Recibe solicitudes directas de clientes en tu ciudad, define tu propia
          tarifa por hora en MXN y conserva el 100% de tus ingresos. Sin
          trámites de documentos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="ad-name"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Nombre completo *
              </label>
              <input
                id="ad-name"
                type="text"
                required
                maxLength={VALIDATION_LIMITS.displayName.max}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ej. Ana Laura Martínez"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
              />
            </div>

            <div>
              <label
                htmlFor="ad-biz"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Nombre comercial (opcional)
              </label>
              <input
                id="ad-biz"
                type="text"
                maxLength={VALIDATION_LIMITS.businessNameMax}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej. Limpieza Integral Del Valle"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="ad-city"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Ciudad principal *
              </label>
              <select
                id="ad-city"
                value={city}
                onChange={(e) => {
                  const val = e.target.value;
                  setCity(val);
                  if (CITY_TO_DEFAULT_STATE[val]) setState(CITY_TO_DEFAULT_STATE[val]);
                }}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:border-teal-700"
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
                htmlFor="ad-state"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Estado *
              </label>
              <select
                id="ad-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:border-teal-700"
              >
                {STATES_MX.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="ad-headline"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Especialidad en una línea *
            </label>
            <input
              id="ad-headline"
              type="text"
              required
              maxLength={VALIDATION_LIMITS.headline.max}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Ej. Limpieza residencial profunda, cocina y desinfección de baños"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
            />
          </div>

          <ColoniaSmartSelector
            city={city}
            selectedColonias={selectedColonias}
            onChange={setSelectedColonias}
            allowMapPreview={true}
            defaultShowMap={true}
            inputId="ad-colonias"
          />

          <div>
            <span className="block text-xs font-medium text-slate-700 mb-2">
              Tipos de servicio que ofreces *
            </span>
            <div className="flex flex-wrap gap-2">
              {SERVICE_CATEGORIES.map((srv) => {
                const active = services.includes(srv);
                return (
                  <button
                    key={srv}
                    type="button"
                    onClick={() => toggleService(srv)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      active
                        ? 'bg-teal-700 border-teal-700 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {srv}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label
                htmlFor="ad-rate"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Tarifa/hr (MXN) *
              </label>
              <input
                id="ad-rate"
                type="number"
                min={VALIDATION_LIMITS.hourlyRate.min}
                max={VALIDATION_LIMITS.hourlyRate.max}
                step={10}
                value={hourlyRateMxn}
                onChange={(e) => setHourlyRateMxn(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 tabular-nums focus:outline-none focus:border-teal-700"
              />
            </div>

            <div>
              <label
                htmlFor="ad-fixed-rate"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Tarifa fija (opc.)
              </label>
              <input
                id="ad-fixed-rate"
                type="number"
                min={0}
                max={VALIDATION_LIMITS.fixedRateMax}
                step={50}
                value={fixedServiceRateMxn}
                onChange={(e) => setFixedServiceRateMxn(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 tabular-nums focus:outline-none focus:border-teal-700"
              />
            </div>

            <div>
              <label
                htmlFor="ad-min-hours"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Mínimo horas
              </label>
              <select
                id="ad-min-hours"
                value={minHours}
                onChange={(e) => setMinHours(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 bg-white tabular-nums"
              >
                {[2, 3, 4, 5, 6].map((h) => (
                  <option key={h} value={h}>
                    {h} hrs
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="ad-exp"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Años exp.
              </label>
              <input
                id="ad-exp"
                type="number"
                min={0}
                max={50}
                value={yearsExperience}
                onChange={(e) => setYearsExperience(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label
                htmlFor="ad-availability"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Días y horario habitual *
              </label>
              <input
                id="ad-availability"
                type="text"
                required
                maxLength={VALIDATION_LIMITS.availability.max}
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900"
              />
            </div>

            <div className="pt-5">
              <label className="inline-flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includesSupplies}
                  onChange={(e) => setIncludesSupplies(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                />
                <span>Llevo mis propios productos e insumos</span>
              </label>
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-700 mb-2">
              Fotografía de presentación
            </span>
            <div className="grid grid-cols-5 gap-2.5">
              {PORTRAIT_PRESETS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => setPhotoUrl(preset.url)}
                  title={preset.label}
                  className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    photoUrl === preset.url
                      ? 'border-teal-700 ring-2 ring-teal-700/20'
                      : 'border-slate-200 opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-700 mb-2">
              Galería de trabajos realizados (opcional, máx. 3)
            </span>
            <div className="flex flex-wrap gap-3">
              {portfolioUrls.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="relative w-24 h-18 rounded-lg overflow-hidden border border-slate-200"
                >
                  <img
                    src={url}
                    alt={`Trabajo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPortfolioUrls((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                    className="absolute top-1 right-1 p-1 rounded bg-slate-900/75 text-white cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {portfolioUrls.length < 3 && (
                <label className="w-24 h-18 rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center text-xs text-slate-500 hover:border-teal-700 hover:text-teal-700 cursor-pointer">
                  <Plus className="w-4 h-4 mb-1" />
                  <span>Agregar</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePortfolioUpload}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="ad-bio"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Cuéntales a los clientes sobre tu trabajo *
            </label>
            <textarea
              id="ad-bio"
              rows={4}
              required
              maxLength={VALIDATION_LIMITS.bio.max}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe qué áreas atiendes con mayor detalle, si tienes experiencia con mascotas, planchado, cuidado de pisos especiales, etc."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
            />
          </div>

          {errorMsg && (
            <p className="text-sm font-medium text-red-700">{errorMsg}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {user
                ? saving
                  ? 'Guardando anuncio...'
                  : editingListing
                  ? 'Guardar cambios'
                  : 'Publicar anuncio gratis'
                : 'Iniciar sesión para publicar'}
            </button>

            {editingListing && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-5 py-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>

        {/* Right Column: Live Marketplace Preview */}
        <aside className="lg:col-span-5 space-y-6">
          <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Vista previa de tu tarjeta
            </p>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={photoUrl}
                  alt="Vista previa"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5">
                <p className="text-xs font-medium text-slate-500 mb-1 truncate">
                  {city} ·{' '}
                  {parsedColonias.length > 0
                    ? parsedColonias.slice(0, 2).join(', ')
                    : 'Tus colonias'}
                </p>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h3 className="font-display text-base font-semibold text-slate-900 truncate">
                    {businessName.trim() || displayName.trim() || 'Tu nombre'}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-800 shrink-0">
                    <Award className="w-3.5 h-3.5 text-teal-700" />
                    <span>Perfil completo</span>
                  </span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                  {headline.trim() ||
                    'Tu especialidad en limpieza de hogar u oficina'}
                </p>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-4 tabular-nums">
                  <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    5.0
                  </span>
                  <span>·</span>
                  <span>{yearsExperience} años exp.</span>
                  <span>·</span>
                  <span>{includesSupplies ? 'Incluye insumos' : 'Sin insumos'}</span>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-base font-semibold text-slate-900 tabular-nums">
                      {formatMxn(hourlyRateMxn || 200)}
                    </span>
                    <span className="text-xs text-slate-500"> / hora</span>
                  </div>
                  <span className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium">
                    Ver perfil
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Consejos para recibir más contrataciones
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  En CDMX, Guadalajara y Monterrey las tarifas competitivas van
                  de $200 a $280 MXN/hr según insumos.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  Especifica colonias exactas para aparecer en las búsquedas de
                  vecinos cercanos.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  Nunca compartas datos bancarios por adelantado; cobra directo
                  al finalizar cada jornada.
                </span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
};
