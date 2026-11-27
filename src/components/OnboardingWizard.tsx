import React, { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Briefcase,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  MapPin,
  Plus,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import {
  CITIES_MX,
  CITY_TO_DEFAULT_STATE,
  CONTACT_PREFERENCES,
  ContactPreference,
  PORTRAIT_PRESETS,
  SERVICE_CATEGORIES,
  ServiceCategory,
  splitGoogleDisplayName,
  STATES_MX,
  UserProfile,
  UserRole,
  VALIDATION_LIMITS,
} from '../types/marketplace';
import { uploadUserImage } from '../lib/firebase';
import {
  saveUserProfile,
  upsertPrimaryProfessionalListing,
} from '../lib/marketplaceService';
import { ColoniaSmartSelector } from './ColoniaSmartSelector';

interface OnboardingWizardProps {
  user: User;
  existingProfile: UserProfile | null;
  onCompleted: (role: UserRole) => void;
  onSignOut: () => Promise<void>;
}

const STEPS = [
  { num: 1, label: 'Personal' },
  { num: 2, label: 'Ubicación' },
  { num: 3, label: 'Sobre ti' },
  { num: 4, label: 'Tipo de cuenta' },
  { num: 5, label: 'Confirmar' },
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  user,
  existingProfile,
  onCompleted,
  onSignOut,
}) => {
  const googleNames = splitGoogleDisplayName(user.displayName);

  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState(
    existingProfile?.firstName || googleNames.firstName
  );
  const [lastName, setLastName] = useState(
    existingProfile?.lastName || googleNames.lastName
  );
  const [photoURL, setPhotoURL] = useState(
    existingProfile?.photoURL || user.photoURL || PORTRAIT_PRESETS[0].url
  );
  const [phone, setPhone] = useState(existingProfile?.phone || '');

  // Paso 2: Ubicación
  const [country] = useState('México');
  const [state, setState] = useState(
    existingProfile?.state || 'Ciudad de México'
  );
  const [city, setCity] = useState(existingProfile?.city || 'CDMX');
  const [neighborhood, setNeighborhood] = useState(
    existingProfile?.neighborhood || ''
  );
  const [postalCode, setPostalCode] = useState(
    existingProfile?.postalCode || ''
  );

  // Paso 3: Sobre ti
  const [description, setDescription] = useState(
    existingProfile?.description || ''
  );
  const [contactPreference, setContactPreference] = useState<ContactPreference>(
    existingProfile?.contactPreference || 'WhatsApp'
  );

  // Paso 4: Tipo de cuenta + campos profesionales
  const [role, setRole] = useState<UserRole>(existingProfile?.role || 'client');
  const [businessName, setBusinessName] = useState('');
  const [headline, setHeadline] = useState('');
  const [proBio, setProBio] = useState('');
  const [yearsExperience, setYearsExperience] = useState(2);
  const [services, setServices] = useState<ServiceCategory[]>(['Hogar']);
  const [hourlyRateMxn, setHourlyRateMxn] = useState(220);
  const [fixedServiceRateMxn, setFixedServiceRateMxn] = useState(0);
  const [minHours, setMinHours] = useState(3);
  const [selectedColonias, setSelectedColonias] = useState<string[]>([]);
  const [availability, setAvailability] = useState('Lun a Sáb · 08:30 a 18:00');
  const [includesSupplies, setIncludesSupplies] = useState(true);
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stepError, setStepError] = useState('');

  const hydratedProfileUidRef = useRef<string | null>(null);

  // Sync defaults once per loaded profile UID so background snapshots don't overwrite user edits
  useEffect(() => {
    if (!existingProfile || hydratedProfileUidRef.current === existingProfile.uid) {
      return;
    }
    hydratedProfileUidRef.current = existingProfile.uid;

    if (existingProfile.firstName) setFirstName(existingProfile.firstName);
    if (existingProfile.lastName) setLastName(existingProfile.lastName);
    if (existingProfile.photoURL) setPhotoURL(existingProfile.photoURL);
    if (existingProfile.phone) setPhone(existingProfile.phone);
    if (existingProfile.state) setState(existingProfile.state);
    if (existingProfile.city) setCity(existingProfile.city);
    if (existingProfile.neighborhood) {
      setNeighborhood(existingProfile.neighborhood);
      setSelectedColonias((prev) =>
        prev.length === 0 ? [existingProfile.neighborhood.trim()] : prev
      );
    }
    if (existingProfile.postalCode) setPostalCode(existingProfile.postalCode);
    if (existingProfile.description) {
      setDescription(existingProfile.description);
      setProBio((prev) => prev || existingProfile.description);
    }
    if (existingProfile.contactPreference) {
      setContactPreference(existingProfile.contactPreference);
    }
    if (existingProfile.role) setRole(existingProfile.role);
  }, [existingProfile]);

  useEffect(() => {
    if (neighborhood.trim().length >= 2 && selectedColonias.length === 0) {
      setSelectedColonias([neighborhood.trim()]);
    }
  }, [neighborhood, selectedColonias.length]);

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    if (CITY_TO_DEFAULT_STATE[newCity]) {
      setState(CITY_TO_DEFAULT_STATE[newCity]);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStepError('');
    setUploadingPhoto(true);
    try {
      const url = await uploadUserImage(user.uid, file, 'avatar');
      setPhotoURL(url);
    } catch (err) {
      setStepError(
        err instanceof Error ? err.message : 'No se pudo cargar la fotografía.'
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePortfolioUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || portfolioUrls.length >= 3) return;
    setStepError('');
    setUploadingPortfolio(true);
    try {
      const url = await uploadUserImage(user.uid, file, 'portfolio');
      setPortfolioUrls((prev) => [...prev, url].slice(0, 3));
    } catch (err) {
      setStepError(
        err instanceof Error ? err.message : 'No se pudo cargar la imagen.'
      );
    } finally {
      setUploadingPortfolio(false);
    }
  };

  const toggleService = (srv: ServiceCategory) => {
    setServices((prev) =>
      prev.includes(srv)
        ? prev.length > 1
          ? prev.filter((s) => s !== srv)
          : prev
        : [...prev, srv]
    );
  };

  const parsedColonias = selectedColonias
    .map((c) => c.trim())
    .filter((c) => c.length >= 2)
    .slice(0, VALIDATION_LIMITS.coloniaMaxCount);

  const validateStep = (targetStep: number): boolean => {
    setStepError('');
    if (targetStep === 1) {
      if (firstName.trim().length < 1) {
        setStepError('Escribe tu nombre para continuar.');
        return false;
      }
      if (lastName.trim().length < 1) {
        setStepError('Escribe tus apellidos para continuar.');
        return false;
      }
      if (phone.trim() && !VALIDATION_LIMITS.phoneRegex.test(phone.trim())) {
        setStepError(
          'El teléfono debe tener entre 7 y 20 caracteres numéricos (ej. 55 1234 5678).'
        );
        return false;
      }
    }

    if (targetStep === 2) {
      if (state.trim().length < 2 || city.trim().length < 2) {
        setStepError('Selecciona tu estado y ciudad.');
        return false;
      }
      if (neighborhood.trim().length < 2) {
        setStepError('Indica tu colonia o alcaldía/municipio.');
        return false;
      }
      if (
        postalCode.trim() &&
        !VALIDATION_LIMITS.postalCodeRegex.test(postalCode.trim())
      ) {
        setStepError('El código postal en México debe tener 5 dígitos.');
        return false;
      }
    }

    if (targetStep === 4 && role === 'professional') {
      if (headline.trim().length < VALIDATION_LIMITS.headline.min) {
        setStepError(
          'Escribe una especialidad breve (mínimo 5 caracteres) para tu perfil profesional.'
        );
        return false;
      }
      const effectiveBio = (proBio || description).trim();
      if (effectiveBio.length < VALIDATION_LIMITS.bio.min) {
        setStepError(
          'Describe tu experiencia y servicios con al menos 15 caracteres.'
        );
        return false;
      }
      if (services.length === 0) {
        setStepError('Selecciona al menos un tipo de servicio.');
        return false;
      }
      if (
        hourlyRateMxn < VALIDATION_LIMITS.hourlyRate.min ||
        hourlyRateMxn > VALIDATION_LIMITS.hourlyRate.max
      ) {
        setStepError('La tarifa por hora debe estar entre $120 y $1,500 MXN.');
        return false;
      }
      if (parsedColonias.length === 0) {
        setStepError(
          'Indica al menos una colonia o zona donde prestas servicio.'
        );
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === 3 && role === 'professional' && !proBio && description) {
        setProBio(description);
      }
      setStep((s) => Math.min(5, s + 1));
    }
  };

  const handleComplete = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(4)) {
      return;
    }

    setSubmitting(true);
    setStepError('');
    try {
      const effectiveDesc =
        description.trim() || (role === 'professional' ? proBio.trim() : '');

      await saveUserProfile(
        {
          firstName,
          lastName,
          photoURL: photoURL || PORTRAIT_PRESETS[0].url,
          phone,
          role,
          country,
          state,
          city,
          neighborhood,
          postalCode,
          description: effectiveDesc,
          contactPreference,
          profileCompleted: true,
        },
        Boolean(existingProfile)
      );

      if (role === 'professional') {
        await upsertPrimaryProfessionalListing({
          displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
          businessName: businessName.trim(),
          headline: headline.trim(),
          bio: (proBio || description).trim(),
          state: state.trim(),
          city: city.trim(),
          colonias: parsedColonias,
          services,
          hourlyRateMxn,
          fixedServiceRateMxn,
          minHours,
          yearsExperience,
          includesSupplies,
          availability: availability.trim(),
          photoUrl: photoURL || PORTRAIT_PRESETS[0].url,
          portfolioUrls,
        });
      }

      onCompleted(role);
    } catch (err) {
      setStepError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un problema al guardar tu perfil.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const progressPercent = Math.round((step / STEPS.length) * 100);

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Progress Header */}
        <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between gap-4 mb-4">
            <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider tabular-nums">
              Paso {step} de {STEPS.length} · Configuración de cuenta
            </span>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cambiar de cuenta
            </button>
          </div>

          <div
            className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-4"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-teal-700 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-5 gap-2 text-center">
            {STEPS.map((s) => {
              const done = s.num < step;
              const current = s.num === step;
              return (
                <div
                  key={s.num}
                  className={`text-xs font-medium truncate ${
                    current
                      ? 'text-teal-800 font-semibold'
                      : done
                      ? 'text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  {s.num}. {s.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* PASO 1: INFORMACIÓN PERSONAL */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                  ¡Bienvenido a LimpiaMX!
                </h1>
                <p className="text-sm sm:text-base text-slate-600">
                  Antes de comenzar, cuéntanos un poco sobre ti para ofrecerte
                  una mejor experiencia.
                </p>
              </div>

              {/* Avatar Selection & Upload */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                  <img
                    src={photoURL || PORTRAIT_PRESETS[0].url}
                    alt="Vista previa de perfil"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2.5 flex-1">
                  <p className="text-xs font-semibold text-slate-700">
                    Fotografía de perfil
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 hover:bg-slate-100 cursor-pointer">
                      <Camera className="w-3.5 h-3.5 text-teal-700" />
                      <span>
                        {uploadingPhoto ? 'Subiendo...' : 'Subir foto propia'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAvatarUpload}
                        className="sr-only"
                      />
                    </label>
                    {user.photoURL && (
                      <button
                        type="button"
                        onClick={() => setPhotoURL(user.photoURL || '')}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        Usar foto de Google
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Formatos JPG, PNG o WebP (máx. 2 MB). Puedes cambiarla cuando quieras.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="ob-first"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Nombre *
                  </label>
                  <input
                    id="ob-first"
                    type="text"
                    required
                    maxLength={VALIDATION_LIMITS.firstName.max}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ej. Sofía"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ob-last"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Apellidos *
                  </label>
                  <input
                    id="ob-last"
                    type="text"
                    required
                    maxLength={VALIDATION_LIMITS.lastName.max}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ej. Ramírez López"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="ob-email"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Correo electrónico de acceso
                  </label>
                  <input
                    id="ob-email"
                    type="email"
                    readOnly
                    disabled
                    value={user.email || ''}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-100 text-sm text-slate-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Correo vinculado a tu sesión actual. No se modifica desde aquí.
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="ob-phone"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Teléfono de contacto (opcional)
                  </label>
                  <input
                    id="ob-phone"
                    type="tel"
                    maxLength={20}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. 55 1234 5678"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 tabular-nums focus:outline-none focus:border-teal-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: UBICACIÓN */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">
                  ¿Dónde te encuentras?
                </h2>
                <p className="text-sm text-slate-600">
                  Usamos tu zona general para mostrarte servicios cercanos. No
                  solicitamos domicilio exacto ni comprobantes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="ob-country"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    País
                  </label>
                  <input
                    id="ob-country"
                    type="text"
                    readOnly
                    value={country}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ob-city"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Ciudad o municipio *
                  </label>
                  <select
                    id="ob-city"
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900"
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
                    htmlFor="ob-state"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Estado *
                  </label>
                  <select
                    id="ob-state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900"
                  >
                    {STATES_MX.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="ob-postal"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Código postal (opcional)
                  </label>
                  <input
                    id="ob-postal"
                    type="text"
                    maxLength={5}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Ej. 06700"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="ob-neighborhood"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Colonia *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    id="ob-neighborhood"
                    type="text"
                    required
                    maxLength={80}
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Ej. Roma Norte, Providencia o San Pedro"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: SOBRE TI */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">
                  Cuéntanos un poco sobre ti
                </h2>
                <p className="text-sm text-slate-600">
                  Esta presentación ayuda a generar confianza con otros miembros
                  de la comunidad.
                </p>
              </div>

              <div>
                <label
                  htmlFor="ob-desc"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Descripción personal (opcional para clientes, recomendada para profesionales)
                </label>
                <textarea
                  id="ob-desc"
                  rows={4}
                  maxLength={VALIDATION_LIMITS.descriptionMax}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej. Busco apoyo quincenal para departamento pequeño con mascotas, o bien describe tu estilo de trabajo si ofreces limpieza."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-700 mb-2">
                  Preferencia de contacto para coordinar citas
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  {CONTACT_PREFERENCES.map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setContactPreference(pref)}
                      className={`py-2.5 px-3 rounded-lg border text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                        contactPreference === pref
                          ? 'bg-teal-700 border-teal-700 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PASO 4: TIPO DE CUENTA */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">
                  ¿Cómo usarás LimpiaMX?
                </h2>
                <p className="text-sm text-slate-600">
                  Elige tu rol principal. Podrás ajustarlo más adelante desde tu perfil.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`text-left p-5 rounded-xl border-2 transition-all cursor-pointer ${
                    role === 'client'
                      ? 'border-teal-700 bg-teal-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-3">
                    <Home className="w-5 h-5" />
                  </div>
                  <p className="font-display text-base font-bold text-slate-900 mb-1">
                    Cliente
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Quiero encontrar profesionales de limpieza y contratar servicios
                    para mi hogar o negocio.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('professional')}
                  className={`text-left p-5 rounded-xl border-2 transition-all cursor-pointer ${
                    role === 'professional'
                      ? 'border-teal-700 bg-teal-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-teal-700 text-white flex items-center justify-center mb-3">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <p className="font-display text-base font-bold text-slate-900 mb-1">
                    Profesional
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Ofrezco servicios de limpieza y quiero publicar mi perfil para
                    conseguir clientes.
                  </p>
                </button>
              </div>

              {/* Extra Fields Only for Professionals */}
              {role === 'professional' && (
                <div className="pt-4 border-t border-slate-200 space-y-5">
                  <p className="text-sm font-semibold text-slate-900">
                    Información de tu servicio profesional
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="ob-biz"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Nombre comercial (opcional)
                      </label>
                      <input
                        id="ob-biz"
                        type="text"
                        maxLength={80}
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Ej. Limpieza Integral Roma"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm text-slate-900"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="ob-headline"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Especialidad breve *
                      </label>
                      <input
                        id="ob-headline"
                        type="text"
                        maxLength={120}
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        placeholder="Ej. Limpieza profunda de hogar y cocinas"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="ob-pro-bio"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Descripción de servicios y experiencia *
                    </label>
                    <textarea
                      id="ob-pro-bio"
                      rows={3}
                      maxLength={600}
                      value={proBio}
                      onChange={(e) => setProBio(e.target.value)}
                      placeholder="Explica tu experiencia, qué áreas atiendes mejor y cómo trabajas."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm text-slate-900"
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-medium text-slate-700 mb-2">
                      Servicios que ofreces *
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {SERVICE_CATEGORIES.map((srv) => (
                        <button
                          key={srv}
                          type="button"
                          onClick={() => toggleService(srv)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                            services.includes(srv)
                              ? 'bg-teal-700 border-teal-700 text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          {srv}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label
                        htmlFor="ob-rate"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Precio/hora (MXN) *
                      </label>
                      <input
                        id="ob-rate"
                        type="number"
                        min={120}
                        max={1500}
                        value={hourlyRateMxn}
                        onChange={(e) => setHourlyRateMxn(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="ob-fixed"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Precio/servicio (opc.)
                      </label>
                      <input
                        id="ob-fixed"
                        type="number"
                        min={0}
                        max={20000}
                        value={fixedServiceRateMxn}
                        onChange={(e) =>
                          setFixedServiceRateMxn(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="ob-minhrs"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Mín. horas
                      </label>
                      <select
                        id="ob-minhrs"
                        value={minHours}
                        onChange={(e) => setMinHours(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm tabular-nums"
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
                        htmlFor="ob-years"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Años exp. *
                      </label>
                      <input
                        id="ob-years"
                        type="number"
                        min={0}
                        max={50}
                        value={yearsExperience}
                        onChange={(e) =>
                          setYearsExperience(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <ColoniaSmartSelector
                      city={city}
                      selectedColonias={selectedColonias}
                      onChange={setSelectedColonias}
                      allowMapPreview={true}
                      defaultShowMap={false}
                      inputId="ob-colonias"
                    />
                    <div>
                      <label
                        htmlFor="ob-avail"
                        className="block text-xs font-medium text-slate-700 mb-1"
                      >
                        Disponibilidad habitual *
                      </label>
                      <input
                        id="ob-avail"
                        type="text"
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includesSupplies}
                      onChange={(e) => setIncludesSupplies(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-700"
                    />
                    <span>Incluyo mis propios insumos de limpieza</span>
                  </label>

                  <div>
                    <span className="block text-xs font-medium text-slate-700 mb-2">
                      Fotografías de trabajos realizados (opcional, máx. 3)
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
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
                          <span>
                            {uploadingPortfolio ? 'Subiendo' : 'Agregar'}
                          </span>
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
                </div>
              )}
            </div>
          )}

          {/* PASO 5: CONFIRMACIÓN */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">
                  Confirma tu información
                </h2>
                <p className="text-sm text-slate-600">
                  Revisa tus datos antes de guardar tu perfil. Puedes regresar a
                  cualquier paso si deseas corregir algo.
                </p>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-4 flex items-center justify-between gap-4 bg-white">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={photoURL}
                      alt="Foto de perfil"
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {firstName} {lastName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {user.email} {phone ? `· ${phone}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-medium text-teal-700 hover:underline cursor-pointer"
                  >
                    Editar
                  </button>
                </div>

                <div className="p-4 flex items-center justify-between gap-4 bg-white">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Ubicación general
                    </p>
                    <p className="text-sm text-slate-900">
                      Col. {neighborhood}, {city}, {state}, {country}
                      {postalCode ? ` · CP ${postalCode}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs font-medium text-teal-700 hover:underline cursor-pointer"
                  >
                    Editar
                  </button>
                </div>

                <div className="p-4 flex items-center justify-between gap-4 bg-white">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Contacto y presentación
                    </p>
                    <p className="text-sm text-slate-900">
                      Preferencia: {contactPreference}
                    </p>
                    {description && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs font-medium text-teal-700 hover:underline cursor-pointer"
                  >
                    Editar
                  </button>
                </div>

                <div className="p-4 flex items-center justify-between gap-4 bg-white">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Tipo de cuenta
                    </p>
                    <p className="text-sm font-semibold text-slate-900 inline-flex items-center gap-1.5">
                      <UserIcon className="w-4 h-4 text-teal-700" />
                      {role === 'professional'
                        ? 'Profesional de limpieza (publicará perfil en catálogo)'
                        : 'Cliente (contratación de servicios)'}
                    </p>
                    {role === 'professional' && (
                      <p className="text-xs text-slate-600 mt-1 tabular-nums">
                        {headline} · ${hourlyRateMxn} MXN/hr ·{' '}
                        {parsedColonias.join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="text-xs font-medium text-teal-700 hover:underline cursor-pointer"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </div>
          )}

          {stepError && (
            <p className="text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              {stepError}
            </p>
          )}

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setStepError('');
                  setStep((s) => Math.max(1, s - 1));
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
            ) : (
              <span />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 cursor-pointer"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleComplete}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 disabled:opacity-60 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {submitting ? 'Guardando perfil...' : 'Completar mi perfil'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
