import React, { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  Link2,
  MapPin,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import {
  BookingRecord,
  CleanerListing,
  formatMxn,
  PROPERTY_SIZES,
  PropertySize,
  ReviewRecord,
  ServiceCategory,
  UserProfile,
  VALIDATION_LIMITS,
} from '../types/marketplace';
import { createBooking, createReview } from '../lib/marketplaceService';
import {
  CANCELLATION_TIERS,
  getAvailabilityPreview,
  getFreeCancellationDeadline,
  isCleanerAvailableOn,
} from '../lib/bookingSecurity';
import { CANCELLATION_POLICY_SUMMARY } from '../data/siteContent';
import { DoorCodeBox, PaymentSheet, ReportDialog } from './BookingModules';
import { VerifiedBadge, WhatsAppIcon } from './SharedUI';

interface CleanerDetailModalProps {
  cleaner: CleanerListing | null;
  reviews: ReviewRecord[];
  user: User | null;
  userProfile: UserProfile | null;
  clientBookings: BookingRecord[];
  onClose: () => void;
  onSignIn: () => Promise<void>;
  onNeedOnboarding: () => void;
  onBookingCreated: (info: {
    bookingId: string;
    cleaner: CleanerListing;
    scheduledDate: string;
    scheduledTime: string;
    totalMxn: number;
  }) => void;
}

function getTomorrowIsoDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const CleanerDetailModal: React.FC<CleanerDetailModalProps> = ({
  cleaner,
  reviews,
  user,
  userProfile,
  clientBookings,
  onClose,
  onSignIn,
  onNeedOnboarding,
  onBookingCreated,
}) => {
  const [serviceType, setServiceType] = useState<ServiceCategory>('Hogar');
  const [propertySize, setPropertySize] = useState<PropertySize>(
    'Departamento (1-2 rec.)'
  );
  const [scheduledDate, setScheduledDate] = useState(getTomorrowIsoDate());
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [durationHours, setDurationHours] = useState(4);
  const [coloniaAddress, setColoniaAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdBookingId, setCreatedBookingId] = useState('');
  const [createdTotal, setCreatedTotal] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: 'cleaner' | 'review';
    id: string;
    label: string;
  } | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Review state (strictly tied to an existing confirmed/completed booking)
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSent, setReviewSent] = useState(false);

  useEffect(() => {
    if (cleaner) {
      setServiceType(cleaner.services[0] ?? 'Hogar');
      setDurationHours(Math.max(cleaner.minHours, 4));
      setColoniaAddress(
        cleaner.colonias[0] ? `Col. ${cleaner.colonias[0]}, ` : ''
      );
      setCreatedBookingId('');
      setErrorMsg('');
      setReviewSent(false);
      setReviewError('');
    }
  }, [cleaner]);

  useEffect(() => {
    if (userProfile) {
      const full = `${userProfile.firstName} ${userProfile.lastName}`.trim();
      if (full && !clientName) setClientName(full);
      if (userProfile.phone && !clientPhone) setClientPhone(userProfile.phone);
    } else if (user?.displayName && !clientName) {
      setClientName(user.displayName);
    }
  }, [userProfile, user, clientName, clientPhone]);

  const cleanerReviews = cleaner
    ? reviews.filter((r) => r.cleanerId === cleaner.id)
    : [];

  const eligibleBookingsForReview = cleaner
    ? clientBookings.filter(
        (b) =>
          b.cleanerId === cleaner.id &&
          (b.status === 'confirmed' || b.status === 'completed') &&
          !cleanerReviews.some((r) => r.bookingId === b.id)
      )
    : [];

  const firstEligibleBookingId = eligibleBookingsForReview[0]?.id ?? '';

  useEffect(() => {
    setSelectedBookingId(firstEligibleBookingId);
  }, [firstEligibleBookingId, cleaner?.id]);

  const profileUrl = useMemo(() => {
    if (!cleaner) return '';
    return `${window.location.origin}${window.location.pathname}#/profesional/${cleaner.id}`;
  }, [cleaner]);

  const availabilityDays = useMemo(
    () => (cleaner ? getAvailabilityPreview(cleaner, 14) : []),
    [cleaner]
  );

  const shareWhatsAppText = cleaner
    ? encodeURIComponent(
        `Mira el perfil de ${cleaner.businessName || cleaner.displayName} en LimpiaMX: limpieza ${cleaner.services[0]?.toLowerCase() ?? 'de hogar'} en ${cleaner.city} por ${formatMxn(cleaner.hourlyRateMxn)}/hora. ${profileUrl}`
      )
    : '';

  const copyShareLink = async () => {
    if (!profileUrl) return;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2200);
    } catch {
      // Clipboard no disponible: el link queda visible en el campo de texto.
    }
  };

  if (!cleaner) return null;

  const totalMxn = durationHours * cleaner.hourlyRateMxn;
  const isTopRated = cleaner.ratingAvg >= 4.8 && cleanerReviews.length >= 2;
  const freeCancelDeadline = getFreeCancellationDeadline(
    scheduledDate,
    scheduledTime
  );

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      await onSignIn();
      return;
    }

    if (!userProfile?.profileCompleted) {
      onClose();
      onNeedOnboarding();
      return;
    }

    if (clientName.trim().length < 2) {
      setErrorMsg('Ingresa tu nombre completo.');
      return;
    }
    if (!VALIDATION_LIMITS.phoneRegex.test(clientPhone.trim())) {
      setErrorMsg(
        'Ingresa un teléfono válido de 10 dígitos (ej. 55 1234 5678).'
      );
      return;
    }
    if (coloniaAddress.trim().length < VALIDATION_LIMITS.coloniaAddress.min) {
      setErrorMsg('Indica la colonia y referencia de ubicación.');
      return;
    }

    setSubmitting(true);
    try {
      const bookingId = await createBooking({
        cleaner,
        clientName,
        clientPhone,
        coloniaAddress,
        serviceType,
        propertySize,
        scheduledDate,
        scheduledTime,
        durationHours,
        notes,
      });
      setCreatedBookingId(bookingId);
      setCreatedTotal(durationHours * cleaner.hourlyRateMxn);
      onBookingCreated({
        bookingId,
        cleaner,
        scheduledDate,
        scheduledTime,
        totalMxn: durationHours * cleaner.hourlyRateMxn,
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? 'No pudimos guardar tu solicitud. Verifica tus datos e intenta de nuevo.'
          : 'Error al enviar solicitud.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');

    if (!user || !selectedBookingId) return;

    const targetBooking = eligibleBookingsForReview.find(
      (b) => b.id === selectedBookingId
    );
    if (!targetBooking) return;

    if (reviewComment.trim().length < VALIDATION_LIMITS.reviewComment.min) {
      setReviewError('Escribe al menos 10 caracteres en tu reseña.');
      return;
    }

    setReviewSubmitting(true);
    try {
      await createReview({
        cleanerId: cleaner.id,
        bookingId: targetBooking.id,
        authorName:
          `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() ||
          user.displayName ||
          'Cliente',
        rating: reviewRating,
        serviceType: targetBooking.serviceType,
        comment: reviewComment,
      });
      setReviewComment('');
      setReviewSent(true);
    } catch {
      setReviewError('No pudimos publicar tu reseña en este momento.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cleaner-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 flex items-start justify-center"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-5xl my-4 overflow-hidden shadow-xl">
        {/* Top Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-slate-500 truncate">
            {cleaner.city}
            {cleaner.state ? `, ${cleaner.state}` : ''} ·{' '}
            {cleaner.colonias.join(', ')}
            {cleaner.isDemo ? ' · Perfil de demostración' : ''}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              aria-label={`Reportar el perfil de ${cleaner.displayName}`}
              title="Reportar este perfil"
              onClick={() =>
                setReportTarget({
                  type: 'cleaner',
                  id: cleaner.id,
                  label: `perfil de ${cleaner.businessName || cleaner.displayName}`,
                })
              }
              className="p-2 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Flag className="w-4.5 h-4.5" />
            </button>
            <button
              type="button"
              aria-label="Cerrar perfil"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Share bar: link propio del perfil */}
        <div className="px-6 py-3 bg-teal-50/60 border-b border-teal-100 flex flex-col sm:flex-row sm:items-center gap-2.5">
          <span className="text-xs font-semibold text-teal-900 shrink-0">
            Link de este perfil:
          </span>
          <code className="flex-1 min-w-0 text-[11px] sm:text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 truncate font-mono">
            {profileUrl}
          </code>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://wa.me/?text=${shareWhatsAppText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-semibold hover:brightness-95 transition-all cursor-pointer"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              Compartir por WhatsApp
            </a>
            <button
              type="button"
              onClick={copyShareLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5" />
              {shareCopied ? '¡Copiado!' : 'Copiar link'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Professional Profile & Reviews */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-8 border-b lg:border-b-0 lg:border-r border-slate-200">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-full sm:w-44 aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                <img
                  src={cleaner.photoUrl}
                  alt={cleaner.displayName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h2
                  id="cleaner-modal-title"
                  className="font-display text-2xl font-bold text-slate-900 mb-0.5"
                >
                  {cleaner.businessName || cleaner.displayName}
                </h2>
                {cleaner.businessName && (
                  <p className="text-xs font-medium text-slate-500 mb-1.5">
                    Responsable: {cleaner.displayName}
                  </p>
                )}
                {cleaner.identityVerified && (
                  <div className="mb-2">
                    <VerifiedBadge />
                  </div>
                )}
                <p className="text-sm font-medium text-slate-700 mb-3">
                  {cleaner.headline}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 tabular-nums">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {cleaner.ratingAvg.toFixed(1)}
                  </span>
                  <span>({cleanerReviews.length} reseñas)</span>
                  <span>·</span>
                  <span>{cleaner.yearsExperience} años de experiencia</span>
                  <span>·</span>
                  <span>{cleaner.completedCount} servicios completados</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 mb-2">
                Acerca de su servicio
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {cleaner.bio}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Especialidades e insumos
                </h4>
                <ul className="space-y-1.5 text-sm text-slate-800">
                  {cleaner.services.map((srv) => (
                    <li key={srv} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>Limpieza {srv}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-slate-600 pt-1">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {cleaner.includesSupplies
                        ? 'Trae productos e insumos incluidos'
                        : 'Trabaja con los insumos del cliente'}
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Información de la cuenta
                </h4>
                <ul className="space-y-1.5 text-sm text-slate-800">
                  <li className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>
                      {cleaner.isDemo
                        ? 'Perfil de demostración'
                        : 'Cuenta verificada por acceso'}
                    </span>
                  </li>
                  {cleaner.profileCompleted && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>Perfil completo</span>
                    </li>
                  )}
                  {isTopRated && (
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Profesional destacado por reseñas</span>
                    </li>
                  )}
                  <li className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{cleaner.availability}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Optional Portfolio Gallery */}
            {cleaner.portfolioUrls && cleaner.portfolioUrls.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Galería de trabajos
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {cleaner.portfolioUrls.map((url, idx) => (
                    <img
                      key={`${url}-${idx}`}
                      src={url}
                      alt={`Trabajo de ${cleaner.displayName} ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full aspect-[4/3] object-cover rounded-lg border border-slate-200"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="pt-6 border-t border-slate-200 space-y-5">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Reseñas de clientes ({cleanerReviews.length})
              </h3>

              {cleanerReviews.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aún no hay reseñas publicadas para este perfil.
                </p>
              ) : (
                <div className="space-y-4">
                  {cleanerReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="pb-4 border-b border-slate-100 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-900">
                          {rev.authorName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 tabular-nums">
                            {rev.rating}.0 ★ · {rev.serviceType} ·{' '}
                            {rev.createdAtLabel}
                          </span>
                          <button
                            type="button"
                            aria-label={`Reportar la reseña de ${rev.authorName}`}
                            title="Reportar esta reseña"
                            onClick={() =>
                              setReportTarget({
                                type: 'review',
                                id: rev.id,
                                label: `reseña de ${rev.authorName} sobre ${cleaner.displayName}`,
                              })
                            }
                            className="p-1 rounded text-slate-300 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Booking-Linked Review Submission */}
              {eligibleBookingsForReview.length > 0 ? (
                <form
                  onSubmit={handleReviewSubmit}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
                >
                  <p className="text-xs font-semibold text-slate-700">
                    Califica tu contratación con {cleaner.displayName}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <select
                      aria-label="Contratación a calificar"
                      value={selectedBookingId}
                      onChange={(e) => setSelectedBookingId(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800"
                    >
                      {eligibleBookingsForReview.map((bk) => (
                        <option key={bk.id} value={bk.id}>
                          {bk.serviceType} · {bk.scheduledDate}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Calificación"
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800"
                    >
                      <option value={5}>5 estrellas</option>
                      <option value={4}>4 estrellas</option>
                      <option value={3}>3 estrellas</option>
                      <option value={2}>2 estrellas</option>
                      <option value={1}>1 estrella</option>
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    maxLength={VALIDATION_LIMITS.reviewComment.max}
                    placeholder="Comparte puntualidad, trato y calidad de limpieza..."
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-700"
                  />
                  {reviewError && (
                    <p className="text-xs text-red-700 font-medium">
                      {reviewError}
                    </p>
                  )}
                  {reviewSent && (
                    <p className="text-xs text-teal-800 font-medium">
                      Reseña publicada correctamente.
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {reviewSubmitting ? 'Publicando...' : 'Publicar reseña'}
                  </button>
                </form>
              ) : (
                <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                  Para evitar reseñas falsas, solo quienes tienen una
                  contratación confirmada o completada con este profesional
                  pueden publicar una opinión.
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Contiguous Hiring / Booking Module */}
          <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50/70">
            <div className="flex items-baseline justify-between gap-2 pb-5 mb-5 border-b border-slate-200">
              <div>
                <span className="font-display text-2xl font-bold text-slate-900 tabular-nums">
                  {formatMxn(cleaner.hourlyRateMxn)}
                </span>
                <span className="text-sm text-slate-600"> / hora</span>
                {cleaner.fixedServiceRateMxn > 0 && (
                  <p className="text-xs text-slate-500 tabular-nums mt-0.5">
                    Servicio estándar desde{' '}
                    {formatMxn(cleaner.fixedServiceRateMxn)} MXN
                  </p>
                )}
              </div>
              <span className="text-xs font-medium text-slate-500 tabular-nums">
                Mínimo {cleaner.minHours} horas
              </span>
            </div>

            {createdBookingId ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-slate-900">
                  Solicitud registrada
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Tu solicitud con <strong>{cleaner.displayName}</strong> quedó
                  guardada para el {scheduledDate} a las {scheduledTime} hrs.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1 tabular-nums">
                  <p className="text-slate-500">
                    Folio:{' '}
                    <span className="font-mono text-slate-900">
                      {createdBookingId}
                    </span>
                  </p>
                  <p className="text-slate-900 font-semibold">
                    Total estimado: {formatMxn(createdTotal || totalMxn)} (
                    {durationHours} hrs)
                  </p>
                </div>

                <DoorCodeBox
                  bookingId={createdBookingId}
                  scheduledDate={scheduledDate}
                  role="client"
                />

                <button
                  type="button"
                  onClick={() => setPaymentOpen(true)}
                  className="w-full py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors cursor-pointer"
                >
                  Pagar con Reserva Protegida (Stripe, Conekta o Mercado Pago)
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Ver en Mis reservas
                </button>
                <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                  Notificaciones: puedes avisar al profesional por WhatsApp o
                  correo desde la tarjeta de la reserva en Mis reservas.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="book-service"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Servicio
                    </label>
                    <select
                      id="book-service"
                      value={serviceType}
                      onChange={(e) =>
                        setServiceType(e.target.value as ServiceCategory)
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-900"
                    >
                      {cleaner.services.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="book-size"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Inmueble
                    </label>
                    <select
                      id="book-size"
                      value={propertySize}
                      onChange={(e) =>
                        setPropertySize(e.target.value as PropertySize)
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-900"
                    >
                      {PROPERTY_SIZES.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="book-date"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Fecha
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        id="book-date"
                        type="date"
                        required
                        min={getTomorrowIsoDate()}
                        value={scheduledDate}
                        onChange={(e) => {
                          const next = e.target.value;
                          if (next && !isCleanerAvailableOn(cleaner, next)) {
                            setErrorMsg(
                              'Ese día no está disponible para este profesional. Revisa el calendario o elige otra fecha.'
                            );
                            return;
                          }
                          setErrorMsg('');
                          setScheduledDate(next);
                        }}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="book-time"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Hora de llegada
                    </label>
                    <select
                      id="book-time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 tabular-nums"
                    >
                      {[
                        '08:00',
                        '09:00',
                        '10:00',
                        '11:00',
                        '12:00',
                        '14:00',
                        '15:00',
                      ].map((t) => (
                        <option key={t} value={t}>
                          {t} hrs
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Calendario de disponibilidad (próximos 14 días) */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <p className="text-xs font-semibold text-slate-800 mb-2 inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-700" />
                    Disponibilidad del profesional · {cleaner.availability}
                  </p>
                  <div className="grid grid-cols-7 gap-1.5">
                    {availabilityDays.map((day) => (
                      <button
                        key={day.dateIso}
                        type="button"
                        disabled={!day.available}
                        onClick={() => {
                          setErrorMsg('');
                          setScheduledDate(day.dateIso);
                        }}
                        title={
                          day.booked
                            ? 'Ya ocupado'
                            : day.available
                              ? 'Disponible'
                              : 'Fuera de su horario semanal'
                        }
                        className={`py-1.5 rounded-md text-[10px] leading-tight text-center tabular-nums transition-colors ${
                          scheduledDate === day.dateIso
                            ? 'bg-teal-700 text-white font-semibold'
                            : day.available
                              ? 'bg-white border border-slate-200 text-slate-700 hover:border-teal-600 cursor-pointer'
                              : 'bg-slate-100 border border-slate-100 text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        <span className="block capitalize">{day.weekdayLabel}</span>
                        <span className="block font-semibold">{day.dayLabel}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Los días grises están fuera de su horario o ya reservados. Las
                    fechas se ajustan al confirmar la solicitud.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="book-hours"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Duración estimada ({durationHours} horas)
                  </label>
                  <select
                    id="book-hours"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 tabular-nums"
                  >
                    {[2, 3, 4, 5, 6, 7, 8]
                      .filter((h) => h >= cleaner.minHours)
                      .map((h) => (
                        <option key={h} value={h}>
                          {h} horas · {formatMxn(h * cleaner.hourlyRateMxn)}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="book-address"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Colonia y referencia general ({cleaner.city})
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      id="book-address"
                      type="text"
                      required
                      maxLength={VALIDATION_LIMITS.coloniaAddress.max}
                      value={coloniaAddress}
                      onChange={(e) => setColoniaAddress(e.target.value)}
                      placeholder="Ej. Col. Roma Norte, cerca de Parque México"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="book-name"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Tu nombre
                    </label>
                    <input
                      id="book-name"
                      type="text"
                      required
                      maxLength={80}
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nombre completo"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="book-phone"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      WhatsApp / Teléfono
                    </label>
                    <input
                      id="book-phone"
                      type="tel"
                      required
                      maxLength={20}
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="55 1234 5678"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="book-notes"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Indicaciones adicionales (opcional)
                  </label>
                  <textarea
                    id="book-notes"
                    rows={2}
                    maxLength={VALIDATION_LIMITS.notesMax}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej. Hay un perro tranquilo, priorizar cocina y dos baños."
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-900"
                  />
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-sm tabular-nums">
                  <div className="flex justify-between text-slate-600">
                    <span>
                      {durationHours} hrs × {formatMxn(cleaner.hourlyRateMxn)}
                    </span>
                    <span>{formatMxn(totalMxn)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Comisión de plataforma</span>
                    <span className="text-teal-700 font-medium">$0 MXN</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between font-semibold text-slate-900">
                    <span>Total acordado directo</span>
                    <span>{formatMxn(totalMxn)} MXN</span>
                  </div>
                </div>

                {/* Reglas de cancelación */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-800 mb-2">
                    Reglas de cancelación
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-slate-600">
                    {CANCELLATION_TIERS.map((tier) => (
                      <li key={tier.window} className="flex items-start gap-1.5">
                        <span
                          className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                            tier.tone === 'ok'
                              ? 'bg-teal-600'
                              : tier.tone === 'warn'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                          }`}
                        />
                        <span>
                          <strong className="text-slate-800">
                            {tier.window}:
                          </strong>{' '}
                          {tier.charge}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {freeCancelDeadline && (
                    <p className="text-[11px] text-teal-800 font-medium mt-2.5">
                      Cancela sin costo hasta: {freeCancelDeadline}
                    </p>
                  )}
                </div>

                {errorMsg && (
                  <p className="text-xs font-medium text-red-700">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {user
                    ? userProfile?.profileCompleted
                      ? submitting
                        ? 'Enviando solicitud...'
                        : 'Solicitar contratación'
                      : 'Completar perfil para contratar'
                    : 'Iniciar sesión y enviar solicitud'}
                </button>
                <p className="text-xs text-slate-500 text-center">
                  El pago se realiza directamente al concluir el servicio por
                  transferencia o efectivo.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {paymentOpen && createdBookingId && (
        <PaymentSheet
          bookingId={createdBookingId}
          totalMxn={createdTotal || totalMxn}
          durationHours={durationHours}
          onClose={() => setPaymentOpen(false)}
          onPaid={() => undefined}
        />
      )}

      {reportTarget && (
        <ReportDialog
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          targetLabel={reportTarget.label}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
};
