import React, { useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  LogOut,
  Mail,
  PauseCircle,
  Pencil,
  PlayCircle,
  Trash2,
  UserCog,
  XCircle,
} from 'lucide-react';
import {
  BookingRecord,
  BookingStatus,
  CITIES_MX,
  CleanerListing,
  formatMxn,
  UserProfile,
} from '../types/marketplace';
import {
  deleteCleanerListing,
  toggleCleanerStatus,
  updateBookingStatus,
} from '../lib/marketplaceService';
import {
  buildBookingMailtoUrl,
  buildBookingWhatsAppUrl,
  getNotifications,
  getPaymentForBooking,
  getUnreadNotificationCount,
  markNotificationsRead,
  NotificationEvent,
} from '../lib/marketplaceExtras';
import { getFreeCancellationDeadline } from '../lib/bookingSecurity';
import { CleanerCard } from './CleanerCard';
import { BookingChat, DoorCodeBox, PaymentSheet } from './BookingModules';
import { EmptyState, WhatsAppIcon } from './SharedUI';

interface DashboardViewProps {
  user: User | null;
  userProfile: UserProfile | null;
  clientBookings: BookingRecord[];
  receivedBookings: BookingRecord[];
  ownerListings: CleanerListing[];
  favoriteCleaners: CleanerListing[];
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onEditListing: (listing: CleanerListing) => void;
  onGoToPublish: () => void;
  onGoToProfile: () => void;
  onGoToExplore: () => void;
  onSelectCleaner: (cleaner: CleanerListing) => void;
  onSelectCleanerById: (cleanerId: string) => void;
  onToggleFavorite: (cleanerId: string) => void;
}

type DashboardTab = 'bookings' | 'ads' | 'favorites';

function StatusLabel({ status }: { status: BookingStatus }) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
          <Clock className="w-3.5 h-3.5" />
          Pendiente
        </span>
      );
    case 'confirmed':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Confirmada
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
          Completada
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-800 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
          <XCircle className="w-3.5 h-3.5" />
          Cancelada
        </span>
      );
  }
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  userProfile,
  clientBookings,
  receivedBookings,
  ownerListings,
  favoriteCleaners,
  onSignIn,
  onSignOut,
  onEditListing,
  onGoToPublish,
  onGoToProfile,
  onGoToExplore,
  onSelectCleaner,
  onSelectCleanerById,
  onToggleFavorite,
}) => {
  const [tab, setTab] = useState<DashboardTab>(
    userProfile?.role === 'professional' ? 'ads' : 'bookings'
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmCancelBookingId, setConfirmCancelBookingId] = useState<string | null>(null);
  const [paymentBookingId, setPaymentBookingId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationEvent[]>(() =>
    getNotifications()
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  const refreshNotifications = () => setNotifications(getNotifications());

  if (!user) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12">
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-3">
            Accede a tus reservas y anuncios
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-md mx-auto">
            Inicia sesión con Google o con tu correo y contraseña para revisar el
            estado de tus contrataciones, administrar tu anuncio o ver tus favoritos.
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="px-6 py-3 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors cursor-pointer"
          >
            Iniciar sesión o crear cuenta
          </button>
        </div>
      </section>
    );
  }

  const handleStatusChange = async (booking: BookingRecord, next: BookingStatus) => {
    if (next === 'cancelled' && confirmCancelBookingId !== booking.id) {
      setConfirmCancelBookingId(booking.id);
      return;
    }
    setConfirmCancelBookingId(null);
    setBusyId(booking.id);
    try {
      await updateBookingStatus(booking.id, next);
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleListing = async (listing: CleanerListing) => {
    setBusyId(listing.id);
    try {
      await toggleCleanerStatus(
        listing.id,
        listing.status === 'active' ? 'paused' : 'active'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    setBusyId(listingId);
    try {
      await deleteCleanerListing(listingId);
    } finally {
      setBusyId(null);
    }
  };

  const fullName = userProfile
    ? `${userProfile.firstName} ${userProfile.lastName}`.trim()
    : user.displayName || 'Usuario';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Hola, {fullName}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {user.email} · Rol:{' '}
            {userProfile?.role === 'professional' ? 'Profesional' : 'Cliente'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start">
          <button
            type="button"
            onClick={onGoToProfile}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <UserCog className="w-4 h-4 text-teal-700" />
            Mi perfil
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Segmented Tabs */}
      <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg mb-8">
        <button
          type="button"
          onClick={() => setTab('bookings')}
          className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
            tab === 'bookings'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Mis contrataciones ({clientBookings.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('ads')}
          className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
            tab === 'ads'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Panel profesional ({ownerListings.length} / {receivedBookings.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('favorites')}
          className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
            tab === 'favorites'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Guardados ({favoriteCleaners.length})
        </button>
      </div>

      {tab === 'bookings' && (
        <div className="space-y-4">
          {/* Notificaciones de actividad */}
          {notifications.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Bell className="w-4 h-4 text-teal-700" />
                  Actividad reciente
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-teal-700 text-white text-[10px] font-bold tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                </p>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationsRead();
                      refreshNotifications();
                    }}
                    className="text-xs font-medium text-teal-700 hover:text-teal-800 cursor-pointer"
                  >
                    Marcar todo como leído
                  </button>
                )}
              </div>
              <ul className="space-y-1.5">
                {notifications.slice(0, 4).map((n) => (
                  <li
                    key={n.id}
                    className={`text-xs flex items-start gap-2 rounded-lg px-3 py-2 ${
                      n.read
                        ? 'text-slate-500 bg-slate-50'
                        : 'text-slate-800 bg-teal-50/70 border border-teal-100'
                    }`}
                  >
                    <span className="font-semibold shrink-0">{n.title}:</span>
                    <span className="min-w-0 truncate">{n.body}</span>
                    <span className="ml-auto shrink-0 text-[10px] text-slate-400 tabular-nums">
                      {new Date(n.at).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {clientBookings.length === 0 ? (
            <EmptyState
              variant="calendar"
              title="Aún no has solicitado ningún servicio"
              body="Explora el catálogo de profesionales en tu ciudad, cotiza tu limpieza y agenda tu primera visita. Todo se sigue desde aquí."
              action={
                <button
                  type="button"
                  onClick={onGoToExplore}
                  className="px-5 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 cursor-pointer"
                >
                  Explorar profesionales
                </button>
              }
            />
          ) : (
            <div className="space-y-4">
              {clientBookings.map((bk) => {
                const payment = getPaymentForBooking(bk.id);
                return (
                  <div
                    key={bk.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-display text-lg font-semibold text-slate-900">
                            {bk.cleanerName}
                          </h3>
                          <StatusLabel status={bk.status} />
                          {payment && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Pago protegido ({payment.status === 'released' ? 'liberado' : 'retenido'})
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">
                          {bk.serviceType} · {bk.propertySize} · {bk.city} (
                          {bk.coloniaAddress})
                        </p>
                        <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2 tabular-nums">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {bk.scheduledDate} a las {bk.scheduledTime} hrs
                          </span>
                          <span>·</span>
                          <span>{bk.durationHours} horas</span>
                          <span>·</span>
                          <span className="font-mono">Folio: {bk.id}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                        <div className="text-left lg:text-right mr-2">
                          <p className="text-lg font-bold text-slate-900 tabular-nums">
                            {formatMxn(bk.totalMxn)} MXN
                          </p>
                          <p className="text-xs text-slate-500 tabular-nums">
                            {formatMxn(bk.hourlyRateMxn)} / hr
                          </p>
                        </div>

                        {(bk.status === 'pending' ||
                          bk.status === 'confirmed') && (
                          <button
                            type="button"
                            onClick={() => setPaymentBookingId(bk.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors cursor-pointer"
                          >
                            {payment ? 'Ver pago' : 'Pagar en la app'}
                          </button>
                        )}

                        {(bk.status === 'pending' ||
                          bk.status === 'confirmed') && (
                          <a
                            href={buildBookingWhatsAppUrl({
                              bookingId: bk.id,
                              cleanerName: bk.cleanerName,
                              serviceType: bk.serviceType,
                              scheduledDate: bk.scheduledDate,
                              scheduledTime: bk.scheduledTime,
                              durationHours: bk.durationHours,
                              totalMxn: bk.totalMxn,
                              city: bk.city,
                              coloniaAddress: bk.coloniaAddress,
                              clientName: bk.clientName,
                              clientPhone: bk.clientPhone,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#25D366] text-white text-xs font-medium hover:brightness-95 transition-all"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                            Avisar por WhatsApp
                          </a>
                        )}

                        {(bk.status === 'pending' ||
                          bk.status === 'confirmed') && (
                          <a
                            href={buildBookingMailtoUrl({
                              bookingId: bk.id,
                              cleanerName: bk.cleanerName,
                              serviceType: bk.serviceType,
                              scheduledDate: bk.scheduledDate,
                              scheduledTime: bk.scheduledTime,
                              durationHours: bk.durationHours,
                              totalMxn: bk.totalMxn,
                              city: bk.city,
                              coloniaAddress: bk.coloniaAddress,
                              clientName: bk.clientName,
                              clientPhone: bk.clientPhone,
                            })}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Correo
                          </a>
                        )}

                        {(bk.status === 'confirmed' ||
                          bk.status === 'completed') && (
                          <button
                            type="button"
                            onClick={() => onSelectCleanerById(bk.cleanerId)}
                            className="px-3.5 py-2 rounded-lg border border-teal-700 text-teal-800 text-xs font-medium hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            Calificar servicio
                          </button>
                        )}

                        {(bk.status === 'confirmed' ||
                          (bk.listingSource === 'catalog' &&
                            bk.status === 'pending')) && (
                          <button
                            type="button"
                            disabled={busyId === bk.id}
                            onClick={() => handleStatusChange(bk, 'completed')}
                            className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-teal-700 disabled:opacity-60 transition-colors cursor-pointer"
                          >
                            Marcar completada
                          </button>
                        )}

                        {(bk.status === 'pending' || bk.status === 'confirmed') && (
                          <button
                            type="button"
                            disabled={busyId === bk.id}
                            onClick={() => handleStatusChange(bk, 'cancelled')}
                            className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100 disabled:opacity-60 transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>

                    {confirmCancelBookingId === bk.id && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <p className="text-xs text-amber-950 leading-relaxed">
                          <span className="font-semibold">¿Confirmar cancelación?</span>{' '}
                          Gratis con más de 24 h de anticipación
                          {getFreeCancellationDeadline(bk.scheduledDate, bk.scheduledTime)
                            ? ` (sin costo hasta ${getFreeCancellationDeadline(bk.scheduledDate, bk.scheduledTime)})`
                            : ''}
                          ; con menos de 24 h aplica 50% del total y sin aviso 1 hora de cargo.
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setConfirmCancelBookingId(null)}
                            className="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            Mantener reserva
                          </button>
                          <button
                            type="button"
                            disabled={busyId === bk.id}
                            onClick={() => handleStatusChange(bk, 'cancelled')}
                            className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700 cursor-pointer"
                          >
                            Confirmar cancelación
                          </button>
                        </div>
                      </div>
                    )}

                    {(bk.status === 'confirmed' || bk.status === 'completed') && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <DoorCodeBox bookingId={bk.id} scheduledDate={bk.scheduledDate} role="client" />
                        <BookingChat booking={bk} role="client" />
                      </div>
                    )}

                    {bk.status === 'pending' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <BookingChat booking={bk} role="client" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'ads' && (
        <div className="space-y-10">
          {/* Agenda de la semana (reservas confirmadas como profesional) */}
          {receivedBookings.filter((bk) => bk.status === 'confirmed').length >
            0 && (
            <div>
              <h3 className="font-display text-lg font-semibold text-slate-900 mb-3">
                Agenda de la semana
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {(() => {
                  const confirmed = receivedBookings.filter(
                    (bk) => bk.status === 'confirmed'
                  );
                  const days: {
                    label: string;
                    dateIso: string;
                    items: BookingRecord[];
                  }[] = [];
                  const today = new Date();
                  for (let offset = 0; offset < 7; offset++) {
                    const d = new Date(today);
                    d.setDate(today.getDate() + offset);
                    const dateIso = d.toLocaleDateString('sv-SE');
                    days.push({
                      label: d.toLocaleDateString('es-MX', {
                        weekday: 'short',
                        day: 'numeric',
                      }),
                      dateIso,
                      items: confirmed.filter(
                        (bk) => bk.scheduledDate === dateIso
                      ),
                    });
                  }
                  return days.map((day) => (
                    <div
                      key={day.dateIso}
                      className={`rounded-xl border p-3 min-h-[92px] ${
                        day.items.length > 0
                          ? 'bg-teal-50/70 border-teal-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <p className="text-[11px] font-semibold text-slate-600 capitalize">
                        {day.label}
                      </p>
                      {day.items.length === 0 ? (
                        <p className="text-[11px] text-slate-400 mt-2">Libre</p>
                      ) : (
                        day.items.map((bk) => (
                          <p
                            key={bk.id}
                            className="text-[11px] font-semibold text-teal-900 mt-2 tabular-nums"
                          >
                            {bk.scheduledTime} · {bk.clientName}
                            <span className="block font-normal text-teal-800/80">
                              {bk.coloniaAddress.slice(0, 28)}
                            </span>
                          </p>
                        ))
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="font-display text-lg font-semibold text-slate-900">
                Tus anuncios publicados
              </h3>
              <button
                type="button"
                onClick={onGoToPublish}
                className="px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors cursor-pointer"
              >
                Crear nuevo anuncio
              </button>
            </div>

            {ownerListings.length === 0 ? (
              <EmptyState
                variant="search"
                title="Todavía no tienes anuncios publicados"
                body="Publica tu perfil con colonias, tarifa por hora y fotos. Aparecerás en el catálogo de tu ciudad y en su página local."
                action={
                  <button
                    type="button"
                    onClick={onGoToPublish}
                    className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-teal-700 cursor-pointer"
                  >
                    Publicar mi primer anuncio
                  </button>
                }
              />
            ) : (
              <div className="space-y-4">
                {ownerListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={listing.photoUrl}
                        alt={listing.displayName}
                        referrerPolicy="no-referrer"
                        className="w-20 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-display font-semibold text-slate-900">
                            {listing.businessName || listing.displayName}
                          </h4>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded border ${
                              listing.status === 'active'
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {listing.status === 'active' ? 'Activo' : 'Pausado'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                          {listing.city} · {formatMxn(listing.hourlyRateMxn)}/hr ·{' '}
                          {listing.colonias.slice(0, 3).join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEditListing(listing)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={busyId === listing.id}
                        onClick={() => handleToggleListing(listing)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        {listing.status === 'active' ? (
                          <>
                            <PauseCircle className="w-3.5 h-3.5" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-3.5 h-3.5" />
                            Activar
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === listing.id}
                        onClick={() => handleDeleteListing(listing.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900 mb-4">
              Solicitudes recibidas de clientes
            </h3>
            {receivedBookings.length === 0 ? (
              <EmptyState
                variant="calendar"
                title="Sin solicitudes por ahora"
                body="Cuando un cliente solicite tu servicio aparecerá aquí con su teléfono, colonia, horario y el código de la puerta para verificar la visita."
              />
            ) : (
              <div className="space-y-4">
                {receivedBookings.map((bk) => (
                  <div
                    key={bk.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-display font-semibold text-slate-900">
                            Cliente: {bk.clientName} ({bk.clientPhone})
                          </h4>
                          <StatusLabel status={bk.status} />
                        </div>
                        <p className="text-sm text-slate-600">
                          {bk.serviceType} · {bk.propertySize} · {bk.coloniaAddress}
                        </p>
                        <p className="text-xs text-slate-500 tabular-nums">
                          {bk.scheduledDate} · {bk.scheduledTime} hrs ·{' '}
                          {bk.durationHours} hrs ({formatMxn(bk.totalMxn)} MXN)
                        </p>
                        {bk.notes && (
                          <p className="text-xs text-slate-600 pt-1">
                            Nota: {bk.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`https://wa.me/52${bk.clientPhone.replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(`Hola ${bk.clientName}, soy ${bk.cleanerName} de LimpiaMX sobre tu reserva del ${bk.scheduledDate}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#25D366] text-white text-xs font-medium hover:brightness-95 transition-all"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                        <a
                          href={`tel:${bk.clientPhone.replace(/[^0-9+]/g, '')}`}
                          className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100 cursor-pointer"
                        >
                          Llamar
                        </a>
                        {bk.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              disabled={busyId === bk.id}
                              onClick={() =>
                                handleStatusChange(bk, 'confirmed')
                              }
                              className="px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 cursor-pointer"
                            >
                              Aceptar solicitud
                            </button>
                            <button
                              type="button"
                              disabled={busyId === bk.id}
                              onClick={() =>
                                handleStatusChange(bk, 'cancelled')
                              }
                              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100 cursor-pointer"
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                        {bk.status === 'confirmed' && (
                          <button
                            type="button"
                            disabled={busyId === bk.id}
                            onClick={() => handleStatusChange(bk, 'completed')}
                            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-teal-700 cursor-pointer"
                          >
                            Marcar completada
                          </button>
                        )}
                      </div>
                    </div>

                    {confirmCancelBookingId === bk.id && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <p className="text-xs text-amber-950 leading-relaxed">
                          <span className="font-semibold">¿Confirmar rechazo/cancelación?</span>{' '}
                          Se notificará que esta solicitud quedó cancelada.
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setConfirmCancelBookingId(null)}
                            className="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            Volver
                          </button>
                          <button
                            type="button"
                            disabled={busyId === bk.id}
                            onClick={() => handleStatusChange(bk, 'cancelled')}
                            className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700 cursor-pointer"
                          >
                            Confirmar rechazo
                          </button>
                        </div>
                      </div>
                    )}

                    {(bk.status === 'confirmed' || bk.status === 'completed') && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <DoorCodeBox bookingId={bk.id} scheduledDate={bk.scheduledDate} role="pro" />
                        <BookingChat booking={bk} role="pro" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'favorites' && (
        <div>
          {favoriteCleaners.length === 0 ? (
            <EmptyState
              variant="favorites"
              title="Aún no tienes profesionales guardados"
              body="Pulsa el corazón en cualquier tarjeta para guardar tus perfiles favoritos y compararlos aquí antes de decidirte."
              action={
                <button
                  type="button"
                  onClick={onGoToExplore}
                  className="px-5 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 cursor-pointer"
                >
                  Explorar profesionales
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteCleaners.map((cl) => (
                <CleanerCard
                  key={cl.id}
                  cleaner={cl}
                  isFavorite={true}
                  onToggleFavorite={onToggleFavorite}
                  onSelect={onSelectCleaner}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {paymentBookingId && (
        <PaymentSheet
          bookingId={paymentBookingId}
          totalMxn={
            clientBookings.find((bk) => bk.id === paymentBookingId)?.totalMxn ??
            0
          }
          durationHours={
            clientBookings.find((bk) => bk.id === paymentBookingId)
              ?.durationHours ?? 3
          }
          onClose={() => setPaymentBookingId(null)}
          onPaid={refreshNotifications}
        />
      )}
    </section>
  );
};
