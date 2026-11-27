import React, { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  CalendarClock,
  Check,
  Copy,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  User as UserIcon,
  X,
} from 'lucide-react';
import {
  BookingRecord,
  BookingStatus,
  CleanerListing,
  formatMxn,
  ReviewRecord,
  SUPER_ADMIN_EMAIL,
  UserProfile,
} from '../types/marketplace';
import { WhatsAppIcon } from './SharedUI';

interface AdminProfileDetailModalProps {
  userProfile: UserProfile | null;
  focusedCleaner: CleanerListing | null;
  allCleaners: CleanerListing[];
  allBookings: BookingRecord[];
  allReviews: ReviewRecord[];
  delegatedAdminEmails: Set<string>;
  onClose: () => void;
}

const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const CLEANER_STATUS_LABEL: Record<CleanerListing['status'], string> = {
  active: 'Activo',
  paused: 'Pausado',
  suspended: 'Suspendido',
};

function formatDateTimeEs(date?: Date | null): string {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
    return 'Sin registro';
  }
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getWhatsAppHref(phone: string, name: string): string | null {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 10) return null;
  const last10 = digits.slice(-10);
  const msg = encodeURIComponent(
    `Hola ${name}, te contactamos desde la administración de LimpiaMX.`
  );
  return `https://wa.me/52${last10}?text=${msg}`;
}

export const AdminProfileDetailModal: React.FC<AdminProfileDetailModalProps> = ({
  userProfile,
  focusedCleaner,
  allCleaners,
  allBookings,
  allReviews,
  delegatedAdminEmails,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const ownerCleaners = useMemo(() => {
    const map = new Map<string, CleanerListing>();
    if (focusedCleaner) map.set(focusedCleaner.id, focusedCleaner);
    if (userProfile) {
      for (const cl of allCleaners) {
        if (cl.ownerId === userProfile.uid) map.set(cl.id, cl);
      }
    }
    return Array.from(map.values());
  }, [focusedCleaner, userProfile, allCleaners]);

  const relatedBookings = useMemo(() => {
    const cleanerIds = new Set(ownerCleaners.map((c) => c.id));
    return allBookings
      .filter((bk) => {
        if (userProfile && (bk.clientId === userProfile.uid || bk.cleanerOwnerId === userProfile.uid)) {
          return true;
        }
        return cleanerIds.has(bk.cleanerId);
      })
      .slice(0, 12);
  }, [allBookings, userProfile, ownerCleaners]);

  const relatedReviews = useMemo(() => {
    const cleanerIds = new Set(ownerCleaners.map((c) => c.id));
    return allReviews
      .filter((rv) => {
        if (userProfile && rv.authorId === userProfile.uid) return true;
        return cleanerIds.has(rv.cleanerId);
      })
      .slice(0, 10);
  }, [allReviews, userProfile, ownerCleaners]);

  const metrics = useMemo(() => {
    let spentMxn = 0;
    let earnedMxn = 0;
    const cleanerIds = new Set(ownerCleaners.map((c) => c.id));
    for (const bk of allBookings) {
      if (bk.status === 'cancelled') continue;
      if (userProfile && bk.clientId === userProfile.uid) {
        spentMxn += bk.totalMxn;
      }
      if (
        (userProfile && bk.cleanerOwnerId === userProfile.uid) ||
        cleanerIds.has(bk.cleanerId)
      ) {
        earnedMxn += bk.totalMxn;
      }
    }
    return {
      totalBookings: relatedBookings.length,
      spentMxn,
      earnedMxn,
      totalReviews: relatedReviews.length,
    };
  }, [allBookings, ownerCleaners, relatedBookings.length, relatedReviews.length, userProfile]);

  if (!userProfile && !focusedCleaner) return null;

  const displayName =
    userProfile?.displayName ||
    focusedCleaner?.displayName ||
    `${userProfile?.firstName ?? ''} ${userProfile?.lastName ?? ''}`.trim() ||
    'Perfil sin nombre';

  const avatarUrl = userProfile?.photoURL || focusedCleaner?.photoUrl || '';
  const emailLower = userProfile?.email?.trim().toLowerCase() ?? '';
  const isSuperAdmin = emailLower === SUPER_ADMIN_EMAIL;
  const isDelegatedAdmin = emailLower ? delegatedAdminEmails.has(emailLower) : false;
  const waHref = userProfile?.phone ? getWhatsAppHref(userProfile.phone, displayName) : null;

  const handleCopy = async (label: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      window.setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // ignore clipboard restrictions
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-profile-detail-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs overflow-y-auto p-4 flex items-start sm:items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full object-cover border border-slate-700 shrink-0 bg-slate-800"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-teal-700 text-white flex items-center justify-center text-lg font-bold shrink-0">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-xs font-mono text-teal-300 uppercase tracking-wider">
                Expediente de base de datos · Firestore
              </p>
              <h2
                id="admin-profile-detail-title"
                className="font-display text-xl sm:text-2xl font-bold truncate"
              >
                {displayName}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>
                  {userProfile?.role === 'professional' || focusedCleaner
                    ? 'Cuenta Profesional'
                    : 'Cuenta Cliente'}
                </span>
                {isSuperAdmin && <span>· Super Admin</span>}
                {!isSuperAdmin && isDelegatedAdmin && <span>· Admin delegado</span>}
                {userProfile && (
                  <span>
                    ·{' '}
                    {userProfile.suspended
                      ? 'Suspendido'
                      : userProfile.profileCompleted
                        ? 'Perfil activo y completo'
                        : 'Registro incompleto'}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Cerrar detalle del perfil"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Metrics Strip */}
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div>
              <dt className="text-[11px] font-medium text-slate-500">Anuncios</dt>
              <dd className="font-display text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                {ownerCleaners.length}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium text-slate-500">Reservas ligadas</dt>
              <dd className="font-display text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                {metrics.totalBookings}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium text-slate-500">
                {ownerCleaners.length > 0 ? 'Volumen como pro' : 'Total contratado'}
              </dt>
              <dd className="font-display text-lg font-bold text-teal-700 tabular-nums mt-0.5">
                {formatMxn(
                  ownerCleaners.length > 0 && metrics.earnedMxn > 0
                    ? metrics.earnedMxn
                    : metrics.spentMxn
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium text-slate-500">Reseñas</dt>
              <dd className="font-display text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                {metrics.totalReviews}
              </dd>
            </div>
          </dl>

          {/* Personal Information Section */}
          {userProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  <UserIcon className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                  <span>Datos personales y contacto</span>
                </h3>

                <dl className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-slate-500">Nombre(s)</dt>
                    <dd className="font-medium text-slate-900 text-right">
                      {userProfile.firstName || '—'} {userProfile.lastName || ''}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-slate-500">Correo</dt>
                    <dd className="font-mono text-xs text-slate-900 text-right flex items-center gap-1.5 break-all">
                      <a
                        href={`mailto:${userProfile.email}`}
                        className="text-teal-700 hover:underline"
                      >
                        {userProfile.email}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy('email', userProfile.email)}
                        aria-label="Copiar correo"
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
                      >
                        {copiedField === 'email' ? (
                          <Check className="w-3.5 h-3.5 text-teal-700" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-slate-500">Teléfono</dt>
                    <dd className="font-medium text-slate-900 text-right tabular-nums flex items-center gap-2">
                      <span>{userProfile.phone || 'Sin teléfono'}</span>
                      {userProfile.phone && (
                        <button
                          type="button"
                          onClick={() => handleCopy('phone', userProfile.phone)}
                          aria-label="Copiar teléfono"
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {copiedField === 'phone' ? (
                            <Check className="w-3.5 h-3.5 text-teal-700" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-slate-500">Preferencia</dt>
                    <dd className="font-medium text-slate-900">
                      {userProfile.contactPreference || 'WhatsApp'}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-slate-500">UID Firestore</dt>
                    <dd className="font-mono text-[11px] text-slate-700 text-right flex items-center gap-1.5 break-all">
                      <span>{userProfile.uid}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy('uid', userProfile.uid)}
                        aria-label="Copiar UID"
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
                      >
                        {copiedField === 'uid' ? (
                          <Check className="w-3.5 h-3.5 text-teal-700" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </dd>
                  </div>
                </dl>

                {/* Quick contact actions */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                  <a
                    href={`mailto:${userProfile.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-800"
                  >
                    <Mail className="w-3.5 h-3.5 text-teal-700" />
                    <span>Enviar correo</span>
                  </a>
                  {userProfile.phone && (
                    <a
                      href={`tel:${userProfile.phone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-800"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-600" />
                      <span>Llamar</span>
                    </a>
                  )}
                  {waHref && (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:brightness-95 text-xs font-semibold text-white"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Address, Bio & Metadata */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  <MapPin className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                  <span>Ubicación, registro y descripción</span>
                </h3>

                <dl className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-slate-500">Ciudad / Estado</dt>
                    <dd className="font-medium text-slate-900 text-right">
                      {userProfile.city || '—'}
                      {userProfile.state ? `, ${userProfile.state}` : ''}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-slate-500">Colonia</dt>
                    <dd className="font-medium text-slate-900 text-right">
                      {userProfile.neighborhood || 'Sin colonia'}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-slate-500">Código postal</dt>
                    <dd className="font-mono text-xs text-slate-900 tabular-nums">
                      {userProfile.postalCode || '—'}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-slate-500">Alta en plataforma</dt>
                    <dd className="text-xs text-slate-700 tabular-nums text-right">
                      {formatDateTimeEs(userProfile.createdAt)}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-slate-500">Última actualización</dt>
                    <dd className="text-xs text-slate-700 tabular-nums text-right">
                      {formatDateTimeEs(userProfile.updatedAt)}
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <dt className="text-slate-500">Método de acceso</dt>
                    <dd className="text-xs font-medium text-slate-800 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                      <span>
                        {userProfile.googleLinked ? 'Google vinculada' : 'Correo y contraseña'}
                      </span>
                    </dd>
                  </div>
                </dl>

                {userProfile.description && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-medium text-slate-500 mb-1">
                      Nota / Biografía personal
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {userProfile.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
              Este anuncio no tiene documento personal enlazado en{' '}
              <span className="font-mono">/users/{focusedCleaner?.ownerId}</span>. Se muestra la ficha completa del anuncio publicado.
            </div>
          )}

          {/* Published Professional Listings */}
          {ownerCleaners.length > 0 && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Briefcase className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                <span>Información de servicio profesional ({ownerCleaners.length})</span>
              </h3>

              <div className="space-y-3">
                {ownerCleaners.map((cl) => (
                  <div
                    key={cl.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <p className="font-display font-semibold text-slate-900">
                          {cl.displayName}
                          {cl.businessName ? ` · ${cl.businessName}` : ''}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">{cl.headline}</p>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <p className="text-sm font-bold text-teal-700 tabular-nums">
                          {formatMxn(cl.hourlyRateMxn)}/hr
                          {cl.fixedServiceRateMxn > 0
                            ? ` · Paquete ${formatMxn(cl.fixedServiceRateMxn)}`
                            : ''}
                        </p>
                        <p className="text-[11px] text-slate-500 tabular-nums">
                          Estado: {CLEANER_STATUS_LABEL[cl.status]} · ID:{' '}
                          <span className="font-mono">{cl.id}</span>
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">{cl.bio}</p>

                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs pt-2 border-t border-slate-200/80">
                      <div>
                        <dt className="text-slate-500">Colonias que atiende</dt>
                        <dd className="font-medium text-slate-900 mt-0.5">
                          {cl.colonias.join(', ')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Categorías de servicio</dt>
                        <dd className="font-medium text-slate-900 mt-0.5">
                          {cl.services.join(' · ')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Experiencia e insumos</dt>
                        <dd className="font-medium text-slate-900 mt-0.5 tabular-nums">
                          {cl.yearsExperience} años · Mínimo {cl.minHours} hrs ·{' '}
                          {cl.includesSupplies ? 'Incluye insumos' : 'Sin insumos'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Disponibilidad y reputación</dt>
                        <dd className="font-medium text-slate-900 mt-0.5 tabular-nums">
                          {cl.availability} · ★ {cl.ratingAvg} ({cl.reviewsCount} reseñas ·{' '}
                          {cl.completedCount} servicios)
                        </dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Bookings & Reviews */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                <CalendarClock className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                <span>Historial de reservas ({relatedBookings.length})</span>
              </h3>

              {relatedBookings.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Sin reservas registradas en Firestore todavía.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 text-xs">
                  {relatedBookings.map((bk) => (
                    <li key={bk.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {bk.serviceType} · {bk.coloniaAddress}
                        </p>
                        <p className="text-slate-500 truncate">
                          {bk.clientName} → {bk.cleanerName}
                        </p>
                        <p className="text-[11px] text-slate-400 tabular-nums">
                          {bk.scheduledDate} · {bk.scheduledTime} ({bk.durationHours} h)
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-slate-900 tabular-nums">
                          {formatMxn(bk.totalMxn)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {BOOKING_STATUS_LABEL[bk.status]}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                <Star className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                <span>Reseñas relacionadas ({relatedReviews.length})</span>
              </h3>

              {relatedReviews.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Sin reseñas vinculadas en Firestore todavía.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 text-xs">
                  {relatedReviews.map((rv) => (
                    <li key={rv.id} className="py-2.5 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">{rv.authorName}</span>
                        <span className="text-amber-600 font-semibold tabular-nums">
                          {rv.rating}.0 ★ · {rv.serviceType}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{rv.comment}</p>
                      <p className="text-[11px] text-slate-400">{rv.createdAtLabel}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Solo lectura de administración · Datos sincronizados con Firestore
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-teal-700 transition-colors cursor-pointer"
          >
            Cerrar expediente
          </button>
        </div>
      </div>
    </div>
  );
};
