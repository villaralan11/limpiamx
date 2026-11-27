import React, { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Database,
  Heart,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import {
  BookingRecord,
  CITIES_MX,
  CITY_TO_DEFAULT_STATE,
  CleanerListing,
  CONTACT_PREFERENCES,
  ContactPreference,
  formatMxn,
  PORTRAIT_PRESETS,
  ReviewRecord,
  SERVICE_CATEGORIES,
  ServiceCategory,
  STATES_MX,
  UserProfile,
  UserRole,
  VALIDATION_LIMITS,
} from '../types/marketplace';
import { isGoogleAccount, sendAccountVerificationEmail, uploadUserImageDetailed } from '../lib/firebase';
import {
  computeBlobSha256,
  computeImageUrlHash,
  extractHashTokenFromUrl,
  formatBytesShort,
  preprocessImageForUpload,
} from '../lib/imagePreprocess';
import {
  FirestoreVerificationSummary,
  saveUserProfile,
  upsertPrimaryProfessionalListing,
} from '../lib/marketplaceService';
import {
  getVerification,
  submitIneVerification,
  VerificationRecord,
  VerificationStatus,
} from '../lib/marketplaceExtras';
import { IneVerificationPanel } from './BookingModules';
import { VerifiedBadge } from './SharedUI';

interface ImageFingerprint {
  originalHash?: string;
  processedHash?: string;
  originalBytes?: number;
  compressedBytes?: number;
}

interface ProfileViewProps {
  user: User;
  profile: UserProfile;
  ownerListing: CleanerListing | null;
  clientBookings: BookingRecord[];
  favoriteCleaners: CleanerListing[];
  userReviews: ReviewRecord[];
  firestoreVerification?: FirestoreVerificationSummary | null;
  isAdmin?: boolean;
  onOpenAdminPanel?: () => void;
  onSelectCleaner: (cleaner: CleanerListing) => void;
  onProfileUpdated: (msg: string) => void;
  onVerificationChanged?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  profile,
  ownerListing,
  clientBookings,
  favoriteCleaners,
  userReviews,
  firestoreVerification,
  isAdmin,
  onOpenAdminPanel,
  onSelectCleaner,
  onProfileUpdated,
  onVerificationChanged,
}) => {
  const [editing, setEditing] = useState(false);
  const [verificationRecord, setVerificationRecord] =
    useState<VerificationRecord | null>(() => getVerification(user.uid));
  const [resendingEmail, setResendingEmail] = useState(false);

  const effectiveVerification: VerificationRecord | null =
    verificationRecord ??
    (firestoreVerification
      ? {
          status: firestoreVerification.status,
          method: 'INE_AI',
          frontName: 'INE anverso',
          backName: 'INE reverso',
          submittedAt: firestoreVerification.verifiedAt,
          verifiedAt: firestoreVerification.verifiedAt,
          verificationId: firestoreVerification.verificationId,
          confidenceScore: firestoreVerification.confidenceScore,
          vigenciaYear: firestoreVerification.vigenciaYear || null,
          maskedCurp: firestoreVerification.maskedCurp || null,
          summary: firestoreVerification.summary,
        }
      : null);
  const verificationStatus: VerificationStatus | null =
    effectiveVerification?.status ?? null;

  // Personal fields
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [phone, setPhone] = useState(profile.phone);
  const [photoURL, setPhotoURL] = useState(
    profile.photoURL || user.photoURL || PORTRAIT_PRESETS[0].url
  );
  const [state, setState] = useState(profile.state);
  const [city, setCity] = useState(profile.city);
  const [neighborhood, setNeighborhood] = useState(profile.neighborhood);
  const [postalCode, setPostalCode] = useState(profile.postalCode);
  const [description, setDescription] = useState(profile.description);
  const [contactPreference, setContactPreference] = useState<ContactPreference>(
    profile.contactPreference
  );
  const [role, setRole] = useState<UserRole>(profile.role);

  // Professional fields
  const [businessName, setBusinessName] = useState(ownerListing?.businessName || '');
  const [headline, setHeadline] = useState(ownerListing?.headline || '');
  const [proBio, setProBio] = useState(ownerListing?.bio || profile.description || '');
  const [services, setServices] = useState<ServiceCategory[]>(
    ownerListing?.services || ['Hogar']
  );
  const [hourlyRateMxn, setHourlyRateMxn] = useState(
    ownerListing?.hourlyRateMxn || 220
  );
  const [fixedServiceRateMxn, setFixedServiceRateMxn] = useState(
    ownerListing?.fixedServiceRateMxn || 0
  );
  const [minHours, setMinHours] = useState(ownerListing?.minHours || 3);
  const [yearsExperience, setYearsExperience] = useState(
    ownerListing?.yearsExperience || 2
  );
  const [coloniasText, setColoniasText] = useState(
    ownerListing?.colonias.join(', ') || profile.neighborhood
  );
  const [availability, setAvailability] = useState(
    ownerListing?.availability || 'Lun a Sáb · 08:30 a 18:00'
  );
  const [includesSupplies, setIncludesSupplies] = useState(
    ownerListing?.includesSupplies ?? true
  );
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>(
    ownerListing?.portfolioUrls || []
  );

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<{
    target: 'avatar' | 'portfolio';
    message: string;
  } | null>(null);
  const [optimizationNotice, setOptimizationNotice] = useState<{
    target: 'avatar' | 'portfolio';
    message: string;
  } | null>(null);

  const imageFingerprintsRef = useRef<Map<string, ImageFingerprint>>(new Map());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`limpiamx_img_hashes_${user.uid}`);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, ImageFingerprint>;
        for (const [url, fp] of Object.entries(parsed)) {
          imageFingerprintsRef.current.set(url, fp);
        }
      }
    } catch {
      // ignore storage access issues
    }
  }, [user.uid]);

  const persistFingerprint = (url: string, fp: ImageFingerprint) => {
    imageFingerprintsRef.current.set(url, fp);
    try {
      const obj: Record<string, ImageFingerprint> = {};
      for (const [k, v] of imageFingerprintsRef.current.entries()) {
        obj[k] = v;
      }
      localStorage.setItem(`limpiamx_img_hashes_${user.uid}`, JSON.stringify(obj));
    } catch {
      // ignore quota/storage issues
    }
  };

  useEffect(() => {
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setPhone(profile.phone);
    setPhotoURL(profile.photoURL || user.photoURL || PORTRAIT_PRESETS[0].url);
    setState(profile.state);
    setCity(profile.city);
    setNeighborhood(profile.neighborhood);
    setPostalCode(profile.postalCode);
    setDescription(profile.description);
    setContactPreference(profile.contactPreference);
    setRole(profile.role);
  }, [profile, user.photoURL]);

  useEffect(() => {
    if (ownerListing) {
      setBusinessName(ownerListing.businessName);
      setHeadline(ownerListing.headline);
      setProBio(ownerListing.bio);
      setServices(ownerListing.services);
      setHourlyRateMxn(ownerListing.hourlyRateMxn);
      setFixedServiceRateMxn(ownerListing.fixedServiceRateMxn);
      setMinHours(ownerListing.minHours);
      setYearsExperience(ownerListing.yearsExperience);
      setColoniasText(ownerListing.colonias.join(', '));
      setAvailability(ownerListing.availability);
      setIncludesSupplies(ownerListing.includesSupplies);
      setPortfolioUrls(ownerListing.portfolioUrls);
    }
  }, [ownerListing]);

  const findDuplicateTarget = async (
    rawHash: string,
    rawBytes: number,
    processedHash: string,
    processedBytes: number
  ): Promise<'avatar' | 'portfolio' | null> => {
    const processedPrefix = processedHash.slice(0, 16);
    const candidates: Array<{ url: string; source: 'avatar' | 'portfolio' }> = [];
    if (photoURL) candidates.push({ url: photoURL, source: 'avatar' });
    for (const pUrl of portfolioUrls) {
      if (pUrl) candidates.push({ url: pUrl, source: 'portfolio' });
    }

    for (const { url, source } of candidates) {
      const urlHashToken = extractHashTokenFromUrl(url);
      if (urlHashToken && urlHashToken === processedPrefix) {
        return source;
      }

      let fp = imageFingerprintsRef.current.get(url);
      if (!fp) {
        const fetchedHash = await computeImageUrlHash(url);
        if (fetchedHash) {
          fp = { processedHash: fetchedHash };
          persistFingerprint(url, fp);
        }
      }

      if (fp) {
        if (
          (fp.originalHash && fp.originalHash === rawHash) ||
          (fp.processedHash &&
            (fp.processedHash === processedHash || fp.processedHash === rawHash)) ||
          (fp.originalBytes === rawBytes && fp.compressedBytes === processedBytes)
        ) {
          return source;
        }
      }
    }

    return null;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMsg('');
    setDuplicateWarning(null);
    setOptimizationNotice(null);
    setUploadingPhoto(true);

    try {
      const rawHash = await computeBlobSha256(file);
      const processed = await preprocessImageForUpload(file, 'avatar');

      const duplicateSource = await findDuplicateTarget(
        rawHash,
        file.size,
        processed.processedHash,
        processed.compressedBytes
      );

      if (duplicateSource) {
        setDuplicateWarning({
          target: 'avatar',
          message:
            duplicateSource === 'avatar'
              ? 'Imagen duplicada: ya estás usando esta misma fotografía como foto de perfil. Selecciona otra distinta.'
              : 'Imagen duplicada: esta fotografía ya forma parte de tu galería de trabajos. Usa una imagen diferente para tu perfil.',
        });
        return;
      }

      const uploaded = await uploadUserImageDetailed(user.uid, processed, 'avatar');
      persistFingerprint(uploaded.url, {
        originalHash: uploaded.originalHash,
        processedHash: uploaded.processedHash,
        originalBytes: uploaded.originalBytes,
        compressedBytes: uploaded.compressedBytes,
      });
      setPhotoURL(uploaded.url);
      setOptimizationNotice({
        target: 'avatar',
        message: `Foto optimizada antes de subir: ${formatBytesShort(uploaded.originalBytes)} → ${formatBytesShort(uploaded.compressedBytes)} (${uploaded.width}×${uploaded.height}px)`,
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'No se pudo cargar la foto.'
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePortfolioUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || portfolioUrls.length >= 3) return;

    setErrorMsg('');
    setDuplicateWarning(null);
    setOptimizationNotice(null);
    setUploadingPortfolio(true);

    try {
      const rawHash = await computeBlobSha256(file);
      const processed = await preprocessImageForUpload(file, 'portfolio');

      const duplicateSource = await findDuplicateTarget(
        rawHash,
        file.size,
        processed.processedHash,
        processed.compressedBytes
      );

      if (duplicateSource) {
        setDuplicateWarning({
          target: 'portfolio',
          message:
            duplicateSource === 'portfolio'
              ? 'Imagen duplicada: este archivo ya fue agregado a tu galería de trabajos. Elige una foto diferente.'
              : 'Imagen duplicada: este archivo coincide con tu foto de perfil actual. Sube una fotografía distinta de tus trabajos.',
        });
        return;
      }

      const uploaded = await uploadUserImageDetailed(user.uid, processed, 'portfolio');
      persistFingerprint(uploaded.url, {
        originalHash: uploaded.originalHash,
        processedHash: uploaded.processedHash,
        originalBytes: uploaded.originalBytes,
        compressedBytes: uploaded.compressedBytes,
      });
      setPortfolioUrls((prev) => [...prev, uploaded.url].slice(0, 3));
      setOptimizationNotice({
        target: 'portfolio',
        message: `Foto agregada y comprimida: ${formatBytesShort(uploaded.originalBytes)} → ${formatBytesShort(uploaded.compressedBytes)} (${uploaded.width}×${uploaded.height}px)`,
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'No se pudo subir la imagen.'
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (firstName.trim().length < 1 || lastName.trim().length < 1) {
      setErrorMsg('Nombre y apellidos son obligatorios.');
      return;
    }
    if (phone.trim() && !VALIDATION_LIMITS.phoneRegex.test(phone.trim())) {
      setErrorMsg('Teléfono no válido (usa 10 dígitos, ej. 55 1234 5678).');
      return;
    }
    if (neighborhood.trim().length < 2) {
      setErrorMsg('Indica tu colonia.');
      return;
    }
    if (
      postalCode.trim() &&
      !VALIDATION_LIMITS.postalCodeRegex.test(postalCode.trim())
    ) {
      setErrorMsg('El código postal debe tener 5 dígitos.');
      return;
    }

    const parsedColonias = coloniasText
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length >= 2)
      .slice(0, 8);

    if (role === 'professional') {
      if (headline.trim().length < 5) {
        setErrorMsg('Escribe tu especialidad breve (mín. 5 caracteres).');
        return;
      }
      if ((proBio || description).trim().length < 15) {
        setErrorMsg('La descripción profesional debe tener al menos 15 caracteres.');
        return;
      }
      if (parsedColonias.length === 0) {
        setErrorMsg('Agrega al menos una colonia o zona de trabajo.');
        return;
      }
    }

    setSaving(true);
    try {
      await saveUserProfile(
        {
          firstName,
          lastName,
          photoURL,
          phone,
          role,
          country: profile.country || 'México',
          state,
          city,
          neighborhood,
          postalCode,
          description,
          contactPreference,
          profileCompleted: true,
        },
        true
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
          photoUrl: photoURL,
          portfolioUrls,
        });
      }

      setEditing(false);
      onProfileUpdated('Perfil actualizado correctamente.');
    } catch {
      setErrorMsg('No se pudieron guardar los cambios del perfil.');
    } finally {
      setSaving(false);
    }
  };

  const joinDateLabel = profile.createdAt
    ? profile.createdAt.toLocaleDateString('es-MX', {
        month: 'long',
        year: 'numeric',
      })
    : 'Miembro reciente';

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Top Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={profile.photoURL || PORTRAIT_PRESETS[0].url}
              alt={profile.displayName}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h1 className="font-display text-2xl font-bold text-slate-900">
                  {profile.firstName} {profile.lastName}
                </h1>
                <span className="text-xs font-medium text-teal-800">
                  · {profile.role === 'professional' ? 'Profesional' : 'Cliente'}
                </span>
                {verificationStatus === 'verified' && <VerifiedBadge />}
              </div>
              <p className="text-sm text-slate-600">
                Col. {profile.neighborhood}, {profile.city}, {profile.state}
              </p>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                <span>
                  {profile.googleLinked || isGoogleAccount(user)
                    ? 'Cuenta Google vinculada'
                    : 'Acceso con correo y contraseña'}
                </span>
                {!user.emailVerified && !isGoogleAccount(user) && (
                  <>
                    <span>·</span>
                    <button
                      type="button"
                      disabled={resendingEmail}
                      onClick={async () => {
                        setResendingEmail(true);
                        try {
                          await sendAccountVerificationEmail(user);
                          onProfileUpdated(
                            `Enviamos un correo de confirmación a ${user.email}.`
                          );
                        } catch {
                          onProfileUpdated(
                            'No se pudo reenviar el correo ahora. Intenta en unos minutos.'
                          );
                        } finally {
                          setResendingEmail(false);
                        }
                      }}
                      className="text-amber-700 font-medium hover:underline cursor-pointer"
                    >
                      {resendingEmail ? 'Enviando...' : 'Verificar correo'}
                    </button>
                  </>
                )}
                <span>·</span>
                <span>Perfil completo</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Desde {joinDateLabel}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start">
            {isAdmin && onOpenAdminPanel && (
              <button
                type="button"
                onClick={onOpenAdminPanel}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 text-white text-xs sm:text-sm font-medium hover:bg-teal-800 transition-colors cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>Base de datos</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditing((prev) => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs sm:text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              {editing ? 'Cerrar editor' : 'Editar mi perfil'}
            </button>
          </div>
        </div>

        {!editing && profile.description && (
          <p className="mt-6 pt-5 border-t border-slate-100 text-sm text-slate-700 leading-relaxed">
            {profile.description}
          </p>
        )}
      </div>

      {/* Edit Profile Form */}
      {editing && (
        <form
          onSubmit={handleSave}
          className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
        >
          <h2 className="font-display text-xl font-bold text-slate-900">
            Editar información de Mi perfil
          </h2>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <img
                src={photoURL}
                alt="Foto actual"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border border-slate-200"
              />
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 hover:bg-slate-100 cursor-pointer">
                    <Camera className="w-3.5 h-3.5 text-teal-700" />
                    <span>
                      {uploadingPhoto ? 'Optimizando y subiendo...' : 'Cambiar foto'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarUpload}
                      disabled={uploadingPhoto}
                      className="sr-only"
                    />
                  </label>
                  {user.photoURL && (
                    <button
                      type="button"
                      onClick={() => {
                        setDuplicateWarning(null);
                        setPhotoURL(user.photoURL || '');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer"
                    >
                      Usar foto de Google
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Se redimensiona y comprime automáticamente antes de guardarse (máx. 512px · WebP/JPG).
                </p>
              </div>
            </div>

            {duplicateWarning?.target === 'avatar' && (
              <div
                role="alert"
                className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-950">
                      Archivo duplicado no permitido
                    </p>
                    <p className="text-amber-900 mt-0.5">{duplicateWarning.message}</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Cerrar advertencia"
                  onClick={() => setDuplicateWarning(null)}
                  className="text-amber-700 hover:text-amber-950 cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {optimizationNotice?.target === 'avatar' && (
              <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  {optimizationNotice.message}
                </span>
                <button
                  type="button"
                  aria-label="Cerrar aviso"
                  onClick={() => setOptimizationNotice(null)}
                  className="text-teal-700 hover:text-teal-950 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="mp-first"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Nombre *
              </label>
              <input
                id="mp-first"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="mp-last"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Apellidos *
              </label>
              <input
                id="mp-last"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="mp-email"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Correo vinculado
              </label>
              <input
                id="mp-email"
                type="email"
                disabled
                value={profile.email}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-100 text-sm text-slate-500"
              />
            </div>
            <div>
              <label
                htmlFor="mp-phone"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Teléfono
              </label>
              <input
                id="mp-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="55 1234 5678"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="mp-city"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Ciudad
              </label>
              <select
                id="mp-city"
                value={city}
                onChange={(e) => {
                  const val = e.target.value;
                  setCity(val);
                  if (CITY_TO_DEFAULT_STATE[val]) setState(CITY_TO_DEFAULT_STATE[val]);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
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
                htmlFor="mp-state"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Estado
              </label>
              <select
                id="mp-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
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
                htmlFor="mp-neigh"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Colonia *
              </label>
              <input
                id="mp-neigh"
                type="text"
                required
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="mp-cp"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                C.P. (opcional)
              </label>
              <input
                id="mp-cp"
                type="text"
                maxLength={5}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="mp-pref"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Preferencia de contacto
              </label>
              <select
                id="mp-pref"
                value={contactPreference}
                onChange={(e) =>
                  setContactPreference(e.target.value as ContactPreference)
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
              >
                {CONTACT_PREFERENCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="mp-role"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Tipo de cuenta
              </label>
              <select
                id="mp-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
              >
                <option value="client">Cliente</option>
                <option value="professional">Profesional de limpieza</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="mp-desc"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Descripción personal
            </label>
            <textarea
              id="mp-desc"
              rows={3}
              maxLength={600}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>

          {role === 'professional' && (
            <div className="pt-5 border-t border-slate-200 space-y-4">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Información profesional publicada
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nombre comercial (opcional)
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Especialidad breve *
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Descripción de servicios *
                </label>
                <textarea
                  rows={3}
                  value={proBio}
                  onChange={(e) => setProBio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Precio/hr MXN
                  </label>
                  <input
                    type="number"
                    min={120}
                    max={1500}
                    value={hourlyRateMxn}
                    onChange={(e) => setHourlyRateMxn(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Precio/servicio
                  </label>
                  <input
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mín. horas
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={8}
                    value={minHours}
                    onChange={(e) => setMinHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Años exp.
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Zonas de trabajo (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={coloniasText}
                    onChange={(e) => setColoniasText(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Disponibilidad
                  </label>
                  <input
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
                <span>Incluyo productos e insumos propios</span>
              </label>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="block text-xs font-medium text-slate-700">
                    Galería de trabajos (máx. 3)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Compresión automática (máx. 1280px) · sin duplicados
                  </span>
                </div>
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
                        onClick={() => {
                          setDuplicateWarning(null);
                          setPortfolioUrls((prev) =>
                            prev.filter((_, i) => i !== idx)
                          );
                        }}
                        className="absolute top-1 right-1 p-1 rounded bg-slate-900/75 text-white cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {portfolioUrls.length < 3 && (
                    <label className="w-24 h-18 rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center text-xs text-slate-500 hover:border-teal-700 hover:text-teal-700 cursor-pointer text-center px-1">
                      <Plus className="w-4 h-4 mb-1" />
                      <span>{uploadingPortfolio ? 'Subiendo...' : 'Agregar'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePortfolioUpload}
                        disabled={uploadingPortfolio}
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>

                {duplicateWarning?.target === 'portfolio' && (
                  <div
                    role="alert"
                    className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-950">
                          Fotografía ya existente
                        </p>
                        <p className="text-amber-900 mt-0.5">
                          {duplicateWarning.message}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Cerrar advertencia"
                      onClick={() => setDuplicateWarning(null)}
                      className="text-amber-700 hover:text-amber-950 cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {optimizationNotice?.target === 'portfolio' && (
                  <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Check className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      {optimizationNotice.message}
                    </span>
                    <button
                      type="button"
                      aria-label="Cerrar aviso"
                      onClick={() => setOptimizationNotice(null)}
                      className="text-teal-700 hover:text-teal-950 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {errorMsg && (
            <p className="text-sm font-medium text-red-700">{errorMsg}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'Guardando cambios...' : 'Guardar perfil'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Role-Specific Summary Sections */}
      {profile.role === 'professional' && ownerListing && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider mb-1">
                Tu perfil público de profesional
              </p>
              <h2 className="font-display text-xl font-bold text-slate-900">
                {ownerListing.businessName || ownerListing.displayName}
              </h2>
            </div>
            <div className="text-right tabular-nums">
              <p className="text-xl font-bold text-slate-900">
                {formatMxn(ownerListing.hourlyRateMxn)} / hr
              </p>
              <p className="text-xs text-slate-500">
                {ownerListing.ratingAvg.toFixed(1)} ★ · {ownerListing.reviewsCount} reseñas · {ownerListing.completedCount} completados
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            {ownerListing.bio}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-3 border-t border-slate-100">
            <div className="flex items-start gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <span>Zonas: {ownerListing.colonias.join(', ')}</span>
            </div>
            <div className="flex items-start gap-2 text-slate-700">
              <Briefcase className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <span>
                Servicios: {ownerListing.services.join(', ')} ({ownerListing.yearsExperience} años exp.)
              </span>
            </div>
          </div>

          {ownerListing.portfolioUrls.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Galería de trabajos
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ownerListing.portfolioUrls.map((url, idx) => (
                  <img
                    key={`${url}-${idx}`}
                    src={url}
                    alt={`Trabajo realizado ${idx + 1}`}
                    className="w-full aspect-[4/3] object-cover rounded-lg border border-slate-200"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verificación de identidad con INE */}
      <IneVerificationPanel
        uid={user.uid}
        expectedName={`${profile.firstName} ${profile.lastName}`.trim() || profile.displayName}
        record={effectiveVerification}
        onSubmit={async (frontFile, backFile) => {
          const expectedName =
            `${profile.firstName} ${profile.lastName}`.trim() || profile.displayName;
          const result = await submitIneVerification({
            uid: user.uid,
            frontFile,
            backFile,
            expectedName,
          });
          setVerificationRecord(result);
          onVerificationChanged?.();
          onProfileUpdated(
            result.status === 'verified'
              ? '¡Identidad INE verificada! Tu insignia "Verificado" ya está activa.'
              : 'Los documentos no aprobaron la verificación automática. Revisa las observaciones e intenta con fotos más claras.'
          );
        }}
        onToast={onProfileUpdated}
      />

      {/* Client Activity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm mb-3">
            <CheckCircle2 className="w-4 h-4 text-teal-700" />
            <span>Servicios contratados ({clientBookings.length})</span>
          </div>
          {clientBookings.length === 0 ? (
            <p className="text-xs text-slate-500">
              Aún no registras contrataciones.
            </p>
          ) : (
            <ul className="space-y-2.5 text-xs">
              {clientBookings.slice(0, 4).map((bk) => (
                <li
                  key={bk.id}
                  className="pb-2 border-b border-slate-100 last:border-b-0 last:pb-0"
                >
                  <p className="font-medium text-slate-900">{bk.cleanerName}</p>
                  <p className="text-slate-500 tabular-nums">
                    {bk.serviceType} · {bk.scheduledDate} · {formatMxn(bk.totalMxn)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm mb-3">
            <Heart className="w-4 h-4 text-teal-700" />
            <span>Favoritos ({favoriteCleaners.length})</span>
          </div>
          {favoriteCleaners.length === 0 ? (
            <p className="text-xs text-slate-500">
              Guarda profesionales desde el catálogo.
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {favoriteCleaners.slice(0, 4).map((cl) => (
                <li key={cl.id}>
                  <button
                    type="button"
                    onClick={() => onSelectCleaner(cl)}
                    className="text-left font-medium text-teal-800 hover:underline cursor-pointer"
                  >
                    {cl.displayName} · {cl.city}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm mb-3">
            <Star className="w-4 h-4 text-amber-500" />
            <span>Reseñas publicadas ({userReviews.length})</span>
          </div>
          {userReviews.length === 0 ? (
            <p className="text-xs text-slate-500">
              Puedes calificar servicios confirmados o completados.
            </p>
          ) : (
            <ul className="space-y-2.5 text-xs">
              {userReviews.slice(0, 3).map((rv) => (
                <li
                  key={rv.id}
                  className="pb-2 border-b border-slate-100 last:border-b-0 last:pb-0"
                >
                  <p className="font-medium text-slate-900 tabular-nums">
                    {rv.rating}.0 ★ · {rv.serviceType}
                  </p>
                  <p className="text-slate-600 line-clamp-2">{rv.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};
