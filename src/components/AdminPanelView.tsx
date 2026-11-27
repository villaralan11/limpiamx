import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  BarChart3,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Database,
  Download,
  Eye,
  Filter,
  Layers,
  Search,
  ShieldCheck,
  ShieldOff,
  ShieldPlus,
  Star,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  AdminRecord,
  AuditLogRecord,
  BookingRecord,
  BookingStatus,
  CITIES_MX,
  CleanerListing,
  formatMxn,
  ReviewRecord,
  SUPER_ADMIN_EMAIL,
  UserProfile,
  UserRole,
} from '../types/marketplace';
import {
  addDelegatedAdmin,
  adminDeleteBooking,
  adminDeleteReview,
  adminDeleteUser,
  adminSetCleanerStatus,
  adminSetUserRole,
  adminSetUserSuspended,
  deleteCleanerListing,
  recordAdminAuditLog,
  removeDelegatedAdmin,
  updateBookingStatus,
} from '../lib/marketplaceService';
import { AdminAuditLog } from './AdminAuditLog';
import { AdminAnalyticsCharts } from './AdminAnalyticsCharts';
import { AdminProfileDetailModal } from './AdminProfileDetailModal';
import {
  exportBookingsCsv,
  exportCleanersCsv,
  exportUsersCsv,
} from '../lib/csvExport';
import { seedDemoMarketplaceToFirestore } from '../lib/seedDemoService';

type AdminTab =
  | 'analiticas'
  | 'usuarios'
  | 'anuncios'
  | 'contrataciones'
  | 'resenas'
  | 'admins'
  | 'auditoria';

type CriticalAction =
  | {
      type: 'promote-admin';
      email: string;
      displayName: string;
      note: string;
      clearForm?: boolean;
    }
  | {
      type: 'revoke-admin';
      email: string;
      displayName?: string;
    }
  | {
      type: 'suspend-user';
      user: UserProfile;
    }
  | {
      type: 'reactivate-user';
      user: UserProfile;
    }
  | {
      type: 'delete-user';
      user: UserProfile;
    }
  | {
      type: 'delete-cleaner';
      listing: CleanerListing;
    }
  | {
      type: 'delete-booking';
      booking: BookingRecord;
    }
  | {
      type: 'delete-review';
      review: ReviewRecord;
    };

interface AdminPanelViewProps {
  currentUserEmail: string;
  isSuperAdmin: boolean;
  users: UserProfile[];
  cleaners: CleanerListing[];
  bookings: BookingRecord[];
  reviews: ReviewRecord[];
  admins: AdminRecord[];
  auditLogs: AuditLogRecord[];
  onToast: (msg: string) => void;
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

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  currentUserEmail,
  isSuperAdmin,
  users,
  cleaners,
  bookings,
  reviews,
  admins,
  auditLogs,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('usuarios');
  const [queryText, setQueryText] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('Todas');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<
    'all' | 'active' | 'suspended' | 'incomplete'
  >('all');
  const [cleanerStatusFilter, setCleanerStatusFilter] = useState<
    'all' | CleanerListing['status']
  >('all');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [pendingAction, setPendingAction] = useState<CriticalAction | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [inspectedTarget, setInspectedTarget] = useState<{
    user: UserProfile | null;
    cleaner: CleanerListing | null;
  } | null>(null);

  // Add admin form state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminNote, setNewAdminNote] = useState('');
  const [adminFormError, setAdminFormError] = useState('');

  const openUserDetail = (targetUser: UserProfile) => {
    const linkedCleaner = cleaners.find((c) => c.ownerId === targetUser.uid) ?? null;
    setInspectedTarget({ user: targetUser, cleaner: linkedCleaner });
  };

  const openCleanerDetail = (targetCleaner: CleanerListing) => {
    const ownerUser = users.find((u) => u.uid === targetCleaner.ownerId) ?? null;
    setInspectedTarget({ user: ownerUser, cleaner: targetCleaner });
  };

  const openBookingClientDetail = (clientId: string) => {
    const foundUser = users.find((u) => u.uid === clientId) ?? null;
    if (!foundUser) {
      onToast('No se encontró el documento del cliente en /users.');
      return;
    }
    openUserDetail(foundUser);
  };

  const openBookingCleanerDetail = (cleanerId: string) => {
    const foundCleaner = cleaners.find((c) => c.id === cleanerId) ?? null;
    if (!foundCleaner) {
      onToast('No se encontró el anuncio del profesional en /cleaners.');
      return;
    }
    openCleanerDetail(foundCleaner);
  };

  const normalizedMe = currentUserEmail.trim().toLowerCase();
  const q = queryText.trim().toLowerCase();

  const delegatedAdminEmails = useMemo(
    () => new Set(admins.map((a) => a.email.trim().toLowerCase())),
    [admins]
  );

  useEffect(() => {
    if (!pendingAction) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirmBusy) {
        setPendingAction(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pendingAction, confirmBusy]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (cityFilter !== 'Todas' && u.city !== cityFilter) return false;
      if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
      if (userStatusFilter === 'suspended' && !u.suspended) return false;
      if (userStatusFilter === 'active' && (u.suspended || !u.profileCompleted)) {
        return false;
      }
      if (userStatusFilter === 'incomplete' && (u.suspended || u.profileCompleted)) {
        return false;
      }
      if (q) {
        const hay = [
          u.displayName,
          u.email,
          u.city,
          u.state,
          u.neighborhood,
          u.phone,
          u.role,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [users, q, cityFilter, userRoleFilter, userStatusFilter]);

  const filteredCleaners = useMemo(() => {
    return cleaners.filter((c) => {
      if (cityFilter !== 'Todas' && c.city !== cityFilter) return false;
      if (cleanerStatusFilter !== 'all' && c.status !== cleanerStatusFilter) {
        return false;
      }
      if (q) {
        const hay = [
          c.displayName,
          c.businessName,
          c.city,
          c.headline,
          ...c.colonias,
          ...c.services,
          c.status,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [cleaners, q, cityFilter, cleanerStatusFilter]);

  const filteredActiveCleaners = useMemo(() => {
    return filteredCleaners.filter((c) => c.status === 'active');
  }, [filteredCleaners]);

  const filteredBookings = useMemo(() => {
    if (!q) return bookings;
    return bookings.filter((b) =>
      [
        b.id,
        b.clientName,
        b.clientPhone,
        b.cleanerName,
        b.city,
        b.coloniaAddress,
        b.serviceType,
        b.status,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [bookings, q]);

  const filteredReviews = useMemo(() => {
    if (!q) return reviews;
    return reviews.filter((r) =>
      [r.authorName, r.comment, r.serviceType, r.cleanerId, r.bookingId]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [reviews, q]);

  const requestPromoteUserToAdmin = (target: UserProfile) => {
    const emailLower = target.email.trim().toLowerCase();
    if (emailLower === SUPER_ADMIN_EMAIL || delegatedAdminEmails.has(emailLower)) {
      onToast('Este usuario ya cuenta con permisos de administrador.');
      return;
    }
    if (target.suspended) {
      onToast('Reactiva la cuenta antes de promoverla a administrador.');
      return;
    }
    setPendingAction({
      type: 'promote-admin',
      email: emailLower,
      displayName: target.displayName || `${target.firstName} ${target.lastName}`.trim(),
      note: 'Promovido desde gestión de usuarios',
    });
  };

  const requestToggleSuspendUser = (target: UserProfile) => {
    const emailLower = target.email.trim().toLowerCase();
    if (emailLower === SUPER_ADMIN_EMAIL || emailLower === normalizedMe) {
      onToast('No puedes suspender tu propia cuenta ni la del Super Administrador.');
      return;
    }
    setPendingAction(
      target.suspended
        ? { type: 'reactivate-user', user: target }
        : { type: 'suspend-user', user: target }
    );
  };

  const requestDeleteUser = (target: UserProfile) => {
    const emailLower = target.email.trim().toLowerCase();
    if (emailLower === SUPER_ADMIN_EMAIL || emailLower === normalizedMe) {
      onToast('No puedes eliminar la cuenta del Super Administrador ni tu sesión actual.');
      return;
    }
    setPendingAction({ type: 'delete-user', user: target });
  };

  const handleChangeUserRole = async (target: UserProfile, nextRole: UserRole) => {
    if (target.role === nextRole) return;
    const key = `role-${target.uid}`;
    setBusyKey(key);
    try {
      await adminSetUserRole(target.uid, nextRole);
      const roleLabel = nextRole === 'professional' ? 'Profesional' : 'Cliente';
      await recordAdminAuditLog({
        action: 'change_user_role',
        targetType: 'user',
        targetId: target.uid,
        targetLabel: target.displayName || target.email,
        summary: `Admin ${normalizedMe} cambió el rol de ${target.displayName} (${target.email}) a ${roleLabel}.`,
      });
      onToast(`Rol de ${target.displayName} actualizado a ${roleLabel}.`);
    } catch {
      onToast('No se pudo cambiar el rol del usuario.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleCleanerStatusChange = async (
    listing: CleanerListing,
    nextStatus: CleanerListing['status']
  ) => {
    if (listing.status === nextStatus) return;
    const key = `cln-status-${listing.id}`;
    setBusyKey(key);
    try {
      await adminSetCleanerStatus(listing.id, nextStatus);
      await recordAdminAuditLog({
        action: 'change_cleaner_status',
        targetType: 'cleaner',
        targetId: listing.id,
        targetLabel: listing.displayName,
        summary: `Admin ${normalizedMe} cambió el anuncio de ${listing.displayName} a ${CLEANER_STATUS_LABEL[nextStatus]}.`,
      });
      onToast(
        `Anuncio de ${listing.displayName} marcado como ${CLEANER_STATUS_LABEL[nextStatus]}.`
      );
    } catch {
      onToast('No se pudo actualizar el estado del anuncio.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleBookingStatusChange = async (
    booking: BookingRecord,
    nextStatus: BookingStatus
  ) => {
    if (booking.status === nextStatus) return;
    const key = `bk-status-${booking.id}`;
    setBusyKey(key);
    try {
      await updateBookingStatus(booking.id, nextStatus);
      await recordAdminAuditLog({
        action: 'change_booking_status',
        targetType: 'booking',
        targetId: booking.id,
        targetLabel: `${booking.clientName} → ${booking.cleanerName}`,
        summary: `Admin ${normalizedMe} actualizó la reserva ${booking.id} a ${BOOKING_STATUS_LABEL[nextStatus]}.`,
      });
      onToast(`Reserva ${booking.id} actualizada a ${BOOKING_STATUS_LABEL[nextStatus]}.`);
    } catch {
      onToast('No se pudo actualizar el estado de la contratación.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleAddAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFormError('');
    const emailClean = newAdminEmail.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailClean)) {
      setAdminFormError('Ingresa un correo electrónico válido (ej. colega@gmail.com).');
      return;
    }
    if (emailClean === SUPER_ADMIN_EMAIL) {
      setAdminFormError('Ese correo ya es el Super Administrador principal.');
      return;
    }
    if (delegatedAdminEmails.has(emailClean)) {
      setAdminFormError('Ese correo ya tiene permisos de administrador.');
      return;
    }

    const matchedUser = users.find((u) => u.email.trim().toLowerCase() === emailClean);
    setPendingAction({
      type: 'promote-admin',
      email: emailClean,
      displayName: matchedUser?.displayName || emailClean,
      note: newAdminNote.trim(),
      clearForm: true,
    });
  };

  const handleConfirmCriticalAction = async () => {
    if (!pendingAction) return;
    setConfirmBusy(true);
    try {
      switch (pendingAction.type) {
        case 'promote-admin': {
          await addDelegatedAdmin(pendingAction.email, pendingAction.note);
          await recordAdminAuditLog({
            action: 'promote_admin',
            targetType: 'admin',
            targetId: pendingAction.email,
            targetLabel: pendingAction.displayName || pendingAction.email,
            summary: `Admin ${normalizedMe} promovió a ${pendingAction.displayName} (${pendingAction.email}) como administrador.`,
          });
          if (pendingAction.clearForm) {
            setNewAdminEmail('');
            setNewAdminNote('');
          }
          onToast(`Permisos de administrador otorgados a ${pendingAction.email}.`);
          break;
        }
        case 'revoke-admin': {
          await removeDelegatedAdmin(pendingAction.email);
          await recordAdminAuditLog({
            action: 'revoke_admin',
            targetType: 'admin',
            targetId: pendingAction.email,
            targetLabel: pendingAction.displayName || pendingAction.email,
            summary: `Admin ${normalizedMe} revocó los permisos de administrador de ${pendingAction.email}.`,
          });
          onToast(`Acceso de administrador revocado para ${pendingAction.email}.`);
          break;
        }
        case 'suspend-user': {
          await adminSetUserSuspended(pendingAction.user.uid, true);
          await recordAdminAuditLog({
            action: 'suspend_user',
            targetType: 'user',
            targetId: pendingAction.user.uid,
            targetLabel: pendingAction.user.displayName || pendingAction.user.email,
            summary: `Admin ${normalizedMe} suspendió al usuario ${pendingAction.user.displayName} (${pendingAction.user.email}).`,
          });
          onToast(`Cuenta de ${pendingAction.user.displayName} suspendida.`);
          break;
        }
        case 'reactivate-user': {
          await adminSetUserSuspended(pendingAction.user.uid, false);
          await recordAdminAuditLog({
            action: 'reactivate_user',
            targetType: 'user',
            targetId: pendingAction.user.uid,
            targetLabel: pendingAction.user.displayName || pendingAction.user.email,
            summary: `Admin ${normalizedMe} reactivó al usuario ${pendingAction.user.displayName} (${pendingAction.user.email}).`,
          });
          onToast(`Cuenta de ${pendingAction.user.displayName} reactivada.`);
          break;
        }
        case 'delete-user': {
          await adminDeleteUser(pendingAction.user.uid);
          await recordAdminAuditLog({
            action: 'delete_user',
            targetType: 'user',
            targetId: pendingAction.user.uid,
            targetLabel: pendingAction.user.displayName || pendingAction.user.email,
            summary: `Admin ${normalizedMe} eliminó el perfil de ${pendingAction.user.displayName} (${pendingAction.user.email}).`,
          });
          onToast(`Perfil de ${pendingAction.user.displayName} eliminado de Firestore.`);
          break;
        }
        case 'delete-cleaner': {
          await deleteCleanerListing(pendingAction.listing.id);
          await recordAdminAuditLog({
            action: 'delete_cleaner',
            targetType: 'cleaner',
            targetId: pendingAction.listing.id,
            targetLabel: pendingAction.listing.displayName,
            summary: `Admin ${normalizedMe} eliminó el anuncio de ${pendingAction.listing.displayName} en ${pendingAction.listing.city}.`,
          });
          onToast(`Anuncio de ${pendingAction.listing.displayName} eliminado.`);
          break;
        }
        case 'delete-booking': {
          await adminDeleteBooking(pendingAction.booking.id);
          await recordAdminAuditLog({
            action: 'delete_booking',
            targetType: 'booking',
            targetId: pendingAction.booking.id,
            targetLabel: `${pendingAction.booking.clientName} → ${pendingAction.booking.cleanerName}`,
            summary: `Admin ${normalizedMe} eliminó la contratación ${pendingAction.booking.id}.`,
          });
          onToast(`Contratación ${pendingAction.booking.id} eliminada.`);
          break;
        }
        case 'delete-review': {
          await adminDeleteReview(pendingAction.review.id);
          await recordAdminAuditLog({
            action: 'delete_review',
            targetType: 'review',
            targetId: pendingAction.review.id,
            targetLabel: pendingAction.review.authorName,
            summary: `Admin ${normalizedMe} eliminó la reseña de ${pendingAction.review.authorName}.`,
          });
          onToast('Reseña eliminada de la base de datos.');
          break;
        }
      }
      setPendingAction(null);
    } catch (err) {
      onToast(
        err instanceof Error
          ? err.message
          : 'No se pudo completar la acción administrativa.'
      );
    } finally {
      setConfirmBusy(false);
    }
  };

  const getModalMeta = (action: CriticalAction) => {
    switch (action.type) {
      case 'promote-admin':
        return {
          title: 'Promover usuario a administrador',
          description: `¿Confirmas otorgar permisos de administrador a ${action.displayName} (${action.email})? Podrá ver y gestionar la base de datos de LimpiaMX.`,
          confirmLabel: 'Confirmar promoción',
          tone: 'teal' as const,
        };
      case 'revoke-admin':
        return {
          title: 'Revocar permisos de administrador',
          description: `¿Confirmas quitar el acceso de administrador a ${
            action.displayName ? `${action.displayName} (${action.email})` : action.email
          }? Conservará su cuenta normal de usuario.`,
          confirmLabel: 'Confirmar revocación',
          tone: 'red' as const,
        };
      case 'suspend-user':
        return {
          title: 'Suspender cuenta de usuario',
          description: `¿Confirmas suspender la cuenta de ${action.user.displayName} (${action.user.email})? No podrá contratar servicios, publicar anuncios ni editar su perfil hasta ser reactivada.`,
          confirmLabel: 'Confirmar suspensión',
          tone: 'amber' as const,
        };
      case 'reactivate-user':
        return {
          title: 'Reactivar cuenta de usuario',
          description: `¿Confirmas reactivar la cuenta de ${action.user.displayName} (${action.user.email})? Recuperará el acceso normal a LimpiaMX.`,
          confirmLabel: 'Confirmar reactivación',
          tone: 'teal' as const,
        };
      case 'delete-user':
        return {
          title: 'Eliminar perfil de usuario',
          description: `¿Confirmas eliminar permanentemente el perfil de ${action.user.displayName} (${action.user.email}) de Firestore? Esta acción no se puede deshacer.`,
          confirmLabel: 'Confirmar eliminación',
          tone: 'red' as const,
        };
      case 'delete-cleaner':
        return {
          title: 'Eliminar anuncio publicado',
          description: `¿Confirmas eliminar permanentemente el anuncio de ${action.listing.displayName} en ${action.listing.city}?`,
          confirmLabel: 'Confirmar eliminación',
          tone: 'red' as const,
        };
      case 'delete-booking':
        return {
          title: 'Eliminar contratación',
          description: `¿Confirmas eliminar la contratación ${action.booking.id} (${action.booking.clientName} → ${action.booking.cleanerName})?`,
          confirmLabel: 'Confirmar eliminación',
          tone: 'red' as const,
        };
      case 'delete-review':
        return {
          title: 'Eliminar reseña',
          description: `¿Confirmas eliminar la reseña publicada por ${action.review.authorName}?`,
          confirmLabel: 'Confirmar eliminación',
          tone: 'red' as const,
        };
    }
  };

  const handleExportDataset = async (
    kind:
      | 'users'
      | 'filtered-users'
      | 'cleaners'
      | 'active-cleaners'
      | 'bookings'
      | 'all'
  ) => {
    setBusyKey(`export-${kind}`);
    try {
      if (kind === 'users') {
        const file = exportUsersCsv(users);
        await recordAdminAuditLog({
          action: 'export_csv',
          targetType: 'export',
          targetId: 'users_csv',
          targetLabel: `${users.length} usuarios`,
          summary: `Admin ${normalizedMe} exportó respaldo CSV de usuarios (${users.length} registros).`,
        });
        onToast(`Respaldo descargado: ${file}`);
      } else if (kind === 'filtered-users') {
        if (filteredUsers.length === 0) {
          onToast('No hay usuarios que coincidan con los filtros actuales para exportar.');
          return;
        }
        const file = exportUsersCsv(filteredUsers, 'limpiamx-usuarios-filtrados');
        await recordAdminAuditLog({
          action: 'export_csv',
          targetType: 'export',
          targetId: 'filtered_users_csv',
          targetLabel: `${filteredUsers.length} usuarios filtrados`,
          summary: `Admin ${normalizedMe} descargó lista filtrada de usuarios en CSV (${filteredUsers.length} registros; ciudad=${cityFilter}, rol=${userRoleFilter}).`,
        });
        onToast(`CSV de usuarios filtrados descargado (${filteredUsers.length}): ${file}`);
      } else if (kind === 'cleaners') {
        const file = exportCleanersCsv(cleaners);
        await recordAdminAuditLog({
          action: 'export_csv',
          targetType: 'export',
          targetId: 'cleaners_csv',
          targetLabel: `${cleaners.length} profesionales`,
          summary: `Admin ${normalizedMe} exportó respaldo CSV de profesionales (${cleaners.length} registros).`,
        });
        onToast(`Respaldo descargado: ${file}`);
      } else if (kind === 'active-cleaners') {
        if (filteredActiveCleaners.length === 0) {
          onToast('No hay servicios activos que coincidan con los filtros actuales.');
          return;
        }
        const file = exportCleanersCsv(
          filteredActiveCleaners,
          'limpiamx-servicios-activos'
        );
        await recordAdminAuditLog({
          action: 'export_csv',
          targetType: 'export',
          targetId: 'active_cleaners_csv',
          targetLabel: `${filteredActiveCleaners.length} servicios activos`,
          summary: `Admin ${normalizedMe} descargó lista CSV de servicios activos (${filteredActiveCleaners.length} registros; ciudad=${cityFilter}).`,
        });
        onToast(
          `CSV de servicios activos descargado (${filteredActiveCleaners.length}): ${file}`
        );
      } else if (kind === 'bookings') {
        const file = exportBookingsCsv(bookings);
        await recordAdminAuditLog({
          action: 'export_csv',
          targetType: 'export',
          targetId: 'bookings_csv',
          targetLabel: `${bookings.length} contrataciones`,
          summary: `Admin ${normalizedMe} exportó respaldo CSV de contrataciones (${bookings.length} registros).`,
        });
        onToast(`Respaldo descargado: ${file}`);
      } else {
        exportUsersCsv(users);
        await new Promise((r) => setTimeout(r, 180));
        exportCleanersCsv(cleaners);
        await new Promise((r) => setTimeout(r, 180));
        exportBookingsCsv(bookings);
        await recordAdminAuditLog({
          action: 'export_csv',
          targetType: 'export',
          targetId: 'full_backup_csv',
          targetLabel: 'Respaldo completo (3 archivos)',
          summary: `Admin ${normalizedMe} exportó respaldo completo CSV (${users.length} usuarios, ${cleaners.length} profesionales, ${bookings.length} contrataciones).`,
        });
        onToast('Respaldo completo descargado (3 archivos CSV).');
      }
    } catch {
      onToast('No se pudo completar la exportación CSV.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleSeedDemoData = async () => {
    setSeedingDemo(true);
    try {
      const res = await seedDemoMarketplaceToFirestore();
      localStorage.setItem('limpiamx_demo_seeded_v4', '1');
      const totalChanges =
        res.usersAdded +
        res.cleanersAdded +
        res.bookingsAdded +
        res.reviewsAdded +
        res.photosRefreshed;
      if (totalChanges === 0) {
        onToast(
          'Los usuarios, reservas, reseñas y fotos de la plataforma ya están al día en Firestore.'
        );
      } else {
        await recordAdminAuditLog({
          action: 'seed_demo_data',
          targetType: 'cleaner',
          targetId: 'demo_seed_v4',
          targetLabel: `+${res.usersAdded} usuarios · +${res.bookingsAdded} reservas · +${res.reviewsAdded} reseñas`,
          summary: `Admin ${normalizedMe} sincronizó actividad en Firestore (+${res.usersAdded} usuarios, +${res.cleanersAdded} anuncios, +${res.bookingsAdded} reservas, +${res.reviewsAdded} reseñas).`,
        });
        onToast(
          `Sincronizado en Firestore: +${res.usersAdded} usuarios, +${res.bookingsAdded} reservas y +${res.reviewsAdded} reseñas.`
        );
      }
    } catch {
      onToast('No se pudieron cargar los registros en Firestore.');
    } finally {
      setSeedingDemo(false);
    }
  };

  const resetAdminFilters = () => {
    setQueryText('');
    setCityFilter('Todas');
    setUserRoleFilter('all');
    setUserStatusFilter('all');
    setCleanerStatusFilter('all');
  };

  const hasActiveFilters =
    queryText.trim() !== '' ||
    cityFilter !== 'Todas' ||
    userRoleFilter !== 'all' ||
    userStatusFilter !== 'all' ||
    cleanerStatusFilter !== 'all';

  const suspendedUsersCount = users.filter((u) => u.suspended).length;
  const activeCleanersCount = cleaners.filter((c) => c.status === 'active').length;
  const modalMeta = pendingAction ? getModalMeta(pendingAction) : null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
            <Database className="w-4 h-4" />
            <span>Panel exclusivo de administración · Firestore</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Base de datos LimpiaMX
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Sesión autorizada: <span className="font-mono text-white">{currentUserEmail}</span>
            {' · '}
            {isSuperAdmin ? 'Super Administrador' : 'Administrador delegado'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Acciones críticas protegidas con confirmación</span>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Usuarios registrados</span>
            <Users className="w-4 h-4 text-teal-700" />
          </div>
          <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">
            {users.length}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {suspendedUsersCount} suspendidos
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Anuncios en BD</span>
            <Briefcase className="w-4 h-4 text-teal-700" />
          </div>
          <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">
            {cleaners.length}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {activeCleanersCount} activos
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Contrataciones</span>
            <CalendarClock className="w-4 h-4 text-teal-700" />
          </div>
          <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">
            {bookings.length}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {bookings.filter((b) => b.status === 'pending').length} pendientes
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Reseñas / Admins</span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">
            {reviews.length} / {admins.length + 1}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            Reseñas reales y equipo admin
          </p>
        </div>
      </div>

      {/* External Backup & Filtered CSV Export + Demo Data Seeding */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-sm sm:text-base font-bold text-slate-900">
              Exportación CSV filtrada y respaldo externo
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Descarga listas filtradas de usuarios o servicios activos para análisis en Excel (UTF-8), o sincroniza los perfiles ejemplo por localidad en Firestore.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busyKey !== null || filteredUsers.length === 0}
              onClick={() => handleExportDataset('filtered-users')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-teal-200 bg-teal-50/60 hover:bg-teal-100 text-xs font-medium text-teal-900 disabled:opacity-50 cursor-pointer tabular-nums"
            >
              <Download className="w-3.5 h-3.5 text-teal-700" />
              <span>Usuarios filtrados ({filteredUsers.length})</span>
            </button>

            <button
              type="button"
              disabled={busyKey !== null || filteredActiveCleaners.length === 0}
              onClick={() => handleExportDataset('active-cleaners')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-teal-200 bg-teal-50/60 hover:bg-teal-100 text-xs font-medium text-teal-900 disabled:opacity-50 cursor-pointer tabular-nums"
            >
              <Download className="w-3.5 h-3.5 text-teal-700" />
              <span>Servicios activos ({filteredActiveCleaners.length})</span>
            </button>

            <button
              type="button"
              disabled={busyKey !== null}
              onClick={() => handleExportDataset('bookings')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-800 disabled:opacity-50 cursor-pointer tabular-nums"
            >
              <Download className="w-3.5 h-3.5 text-teal-700" />
              <span>Contrataciones ({bookings.length})</span>
            </button>

            <button
              type="button"
              disabled={busyKey !== null}
              onClick={() => handleExportDataset('all')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-teal-700 text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{busyKey === 'export-all' ? 'Exportando...' : 'Exportar todo (3 CSV)'}</span>
            </button>

            <button
              type="button"
              disabled={seedingDemo}
              onClick={handleSeedDemoData}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-medium text-slate-800 disabled:opacity-50 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-teal-700" />
              <span>
                {seedingDemo
                  ? 'Sincronizando BD...'
                  : 'Sincronizar usuarios y actividad (BD)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Granular Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'analiticas', label: 'Resumen gráfico' },
                { id: 'usuarios', label: `Usuarios (${users.length})` },
                { id: 'anuncios', label: `Anuncios (${cleaners.length})` },
                { id: 'contrataciones', label: `Contrataciones (${bookings.length})` },
                { id: 'resenas', label: `Reseñas (${reviews.length})` },
                { id: 'admins', label: `Administradores (${admins.length + 1})` },
                { id: 'auditoria', label: `Auditoría (${auditLogs.length})` },
              ] as { id: AdminTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                {tab.id === 'analiticas' && (
                  <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {activeTab !== 'analiticas' &&
            activeTab !== 'admins' &&
            activeTab !== 'auditoria' && (
              <div className="relative w-full lg:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Buscar por nombre, correo, ciudad..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400"
                />
              </div>
            )}
        </div>

        {(activeTab === 'usuarios' || activeTab === 'anuncios') && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                <Filter className="w-3.5 h-3.5 text-teal-700" />
                <span>Filtros:</span>
              </span>

              <select
                aria-label="Filtrar por ciudad"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 cursor-pointer"
              >
                <option value="Todas">Todas las ciudades</option>
                {CITIES_MX.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {activeTab === 'usuarios' && (
                <>
                  <select
                    aria-label="Filtrar por rol de usuario"
                    value={userRoleFilter}
                    onChange={(e) =>
                      setUserRoleFilter(e.target.value as 'all' | UserRole)
                    }
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 cursor-pointer"
                  >
                    <option value="all">Todos los roles</option>
                    <option value="client">Solo clientes</option>
                    <option value="professional">Solo profesionales</option>
                  </select>

                  <select
                    aria-label="Filtrar por estado de usuario"
                    value={userStatusFilter}
                    onChange={(e) =>
                      setUserStatusFilter(
                        e.target.value as
                          | 'all'
                          | 'active'
                          | 'suspended'
                          | 'incomplete'
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 cursor-pointer"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Activos</option>
                    <option value="suspended">Suspendidos</option>
                    <option value="incomplete">Registro incompleto</option>
                  </select>
                </>
              )}

              {activeTab === 'anuncios' && (
                <select
                  aria-label="Filtrar por estado de servicio"
                  value={cleanerStatusFilter}
                  onChange={(e) =>
                    setCleanerStatusFilter(
                      e.target.value as 'all' | CleanerListing['status']
                    )
                  }
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 cursor-pointer"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Solo activos</option>
                  <option value="paused">Pausados</option>
                  <option value="suspended">Suspendidos</option>
                </select>
              )}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAdminFilters}
                  className="text-xs font-medium text-teal-700 hover:text-teal-800 px-2 py-1 cursor-pointer"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {activeTab === 'usuarios' && (
              <button
                type="button"
                disabled={busyKey !== null || filteredUsers.length === 0}
                onClick={() => handleExportDataset('filtered-users')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer tabular-nums"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar CSV filtrado ({filteredUsers.length})</span>
              </button>
            )}

            {activeTab === 'anuncios' && (
              <button
                type="button"
                disabled={busyKey !== null || filteredActiveCleaners.length === 0}
                onClick={() => handleExportDataset('active-cleaners')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer tabular-nums"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  Descargar servicios activos CSV ({filteredActiveCleaners.length})
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* TAB: RESUMEN GRÁFICO (RECHARTS) */}
      {activeTab === 'analiticas' && (
        <AdminAnalyticsCharts
          users={users}
          cleaners={cleaners}
          bookings={bookings}
        />
      )}

      {/* TAB: USUARIOS */}
      {activeTab === 'usuarios' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No hay usuarios registrados que coincidan con tu búsqueda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Ubicación y teléfono</th>
                    <th className="py-3 px-4">Rol</th>
                    <th className="py-3 px-4">Estado y acceso</th>
                    <th className="py-3 px-4 text-right">Acciones críticas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredUsers.map((u) => {
                    const emailLower = u.email.trim().toLowerCase();
                    const isUserSuperAdmin = emailLower === SUPER_ADMIN_EMAIL;
                    const isUserDelegatedAdmin = delegatedAdminEmails.has(emailLower);
                    const isProtected = isUserSuperAdmin || emailLower === normalizedMe;

                    return (
                      <tr key={u.uid} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => openUserDetail(u)}
                            title="Ver datos personales y actividad de este usuario"
                            className="flex items-center gap-3 text-left group cursor-pointer w-full"
                          >
                            {u.photoURL ? (
                              <img
                                src={u.photoURL}
                                alt={u.displayName}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                                {(u.firstName || 'U').slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 group-hover:text-teal-700 group-hover:underline truncate">
                                {u.displayName || `${u.firstName} ${u.lastName}`}
                              </p>
                              <p className="text-xs text-slate-500 font-mono truncate">
                                {u.email}
                              </p>
                            </div>
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          <p>
                            {u.neighborhood ? `Col. ${u.neighborhood}, ` : ''}
                            {u.city || 'Sin ciudad'}
                          </p>
                          <p className="text-slate-400 tabular-nums">
                            {u.phone || 'Sin teléfono'}
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            aria-label={`Rol de ${u.displayName}`}
                            value={u.role}
                            disabled={busyKey === `role-${u.uid}`}
                            onChange={(e) =>
                              handleChangeUserRole(u, e.target.value as UserRole)
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 cursor-pointer"
                          >
                            <option value="client">Cliente</option>
                            <option value="professional">Profesional</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          <div className="space-y-0.5">
                            <p className="font-semibold">
                              {u.suspended ? (
                                <span className="text-red-700">Suspendido</span>
                              ) : u.profileCompleted ? (
                                <span className="text-teal-700">Activo</span>
                              ) : (
                                <span className="text-amber-700">Registro incompleto</span>
                              )}
                            </p>
                            {isUserSuperAdmin ? (
                              <p className="text-teal-800 font-medium">Super Admin</p>
                            ) : isUserDelegatedAdmin ? (
                              <p className="text-teal-700 font-medium">Administrador</p>
                            ) : (
                              <p className="text-slate-400">Usuario estándar</p>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openUserDetail(u)}
                              title="Ver datos personales, ubicación e historial"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 hover:border-teal-600 hover:text-teal-800 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-teal-700" />
                              <span>Ver info</span>
                            </button>

                            {!isUserSuperAdmin && !isUserDelegatedAdmin && (
                              <button
                                type="button"
                                disabled={Boolean(u.suspended)}
                                title={
                                  u.suspended
                                    ? 'Reactiva la cuenta antes de promoverla a administrador'
                                    : 'Promover a administrador'
                                }
                                onClick={() => requestPromoteUserToAdmin(u)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-teal-200 bg-teal-50/50 text-xs font-medium text-teal-800 hover:bg-teal-100 disabled:opacity-40 cursor-pointer"
                              >
                                <ShieldPlus className="w-3.5 h-3.5" />
                                <span>Hacer admin</span>
                              </button>
                            )}

                            {isUserDelegatedAdmin && isSuperAdmin && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPendingAction({
                                    type: 'revoke-admin',
                                    email: emailLower,
                                    displayName: u.displayName,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                              >
                                <ShieldOff className="w-3.5 h-3.5 text-slate-600" />
                                <span>Quitar admin</span>
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={isProtected}
                              onClick={() => requestToggleSuspendUser(u)}
                              title={
                                isProtected
                                  ? 'Cuenta protegida'
                                  : u.suspended
                                  ? 'Reactivar cuenta'
                                  : 'Suspender cuenta'
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                            >
                              {u.suspended ? (
                                <>
                                  <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                                  <span>Reactivar</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Suspender</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={isProtected}
                              onClick={() => requestDeleteUser(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-40 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Borrar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: ANUNCIOS */}
      {activeTab === 'anuncios' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <span>
              Administra los perfiles y servicios reales en{' '}
              <span className="font-mono text-slate-900">/cleaners</span> (incluyendo los 28 perfiles ejemplo distribuidos en 4 por cada una de las 7 localidades).
            </span>
            <button
              type="button"
              disabled={seedingDemo}
              onClick={handleSeedDemoData}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 font-medium text-slate-800 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              {seedingDemo ? 'Sincronizando...' : 'Sincronizar directorio y actividad'}
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {filteredCleaners.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Aún no hay anuncios publicados en Firestore que coincidan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Profesional / Negocio</th>
                      <th className="py-3 px-4">Ciudad y tarifa</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredCleaners.map((cl) => (
                      <tr key={cl.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => openCleanerDetail(cl)}
                            title="Ver datos personales y detalle completo del profesional"
                            className="flex items-center gap-3 text-left group cursor-pointer w-full"
                          >
                            <img
                              src={cl.photoUrl}
                              alt={cl.displayName}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 group-hover:text-teal-700 group-hover:underline truncate">
                                {cl.displayName}
                                {cl.businessName ? ` · ${cl.businessName}` : ''}
                              </p>
                              <p className="text-xs text-slate-500 truncate max-w-xs">
                                {cl.headline}
                              </p>
                            </div>
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-600 tabular-nums">
                          <p className="font-medium text-slate-900">
                            {cl.city} · {formatMxn(cl.hourlyRateMxn)}/hr
                          </p>
                          <p className="text-slate-400">
                            {cl.colonias.slice(0, 3).join(', ')}
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            aria-label={`Estado de anuncio de ${cl.displayName}`}
                            value={cl.status}
                            disabled={busyKey === `cln-status-${cl.id}`}
                            onChange={(e) =>
                              handleCleanerStatusChange(
                                cl,
                                e.target.value as CleanerListing['status']
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 cursor-pointer"
                          >
                            <option value="active">Activo (visible)</option>
                            <option value="paused">Pausado</option>
                            <option value="suspended">Suspendido</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openCleanerDetail(cl)}
                              title="Ver datos personales y ficha del anuncio"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 hover:border-teal-600 hover:text-teal-800 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-teal-700" />
                              <span>Ver info</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setPendingAction({ type: 'delete-cleaner', listing: cl })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Borrar anuncio</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: CONTRATACIONES */}
      {activeTab === 'contrataciones' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {filteredBookings.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No hay contrataciones registradas que coincidan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Folio</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Profesional y servicio</th>
                    <th className="py-3 px-4">Fecha y total</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Eliminar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredBookings.map((bk) => (
                    <tr key={bk.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        {bk.id}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <button
                          type="button"
                          onClick={() => openBookingClientDetail(bk.clientId)}
                          className="font-medium text-slate-900 hover:text-teal-700 hover:underline text-left cursor-pointer"
                        >
                          {bk.clientName}
                        </button>
                        <p className="text-slate-500 tabular-nums">{bk.clientPhone}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <button
                          type="button"
                          onClick={() => openBookingCleanerDetail(bk.cleanerId)}
                          className="font-medium text-slate-900 hover:text-teal-700 hover:underline text-left cursor-pointer"
                        >
                          {bk.cleanerName}
                        </button>
                        <p className="text-slate-500">
                          {bk.serviceType} · {bk.city}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs tabular-nums">
                        <p className="font-medium text-slate-900">
                          {formatMxn(bk.totalMxn)} ({bk.durationHours}h)
                        </p>
                        <p className="text-slate-500">
                          {bk.scheduledDate} · {bk.scheduledTime}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          aria-label={`Estado de contratación ${bk.id}`}
                          value={bk.status}
                          disabled={busyKey === `bk-status-${bk.id}`}
                          onChange={(e) =>
                            handleBookingStatusChange(
                              bk,
                              e.target.value as BookingStatus
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 cursor-pointer"
                        >
                          <option value="pending">Pendiente</option>
                          <option value="confirmed">Confirmada</option>
                          <option value="completed">Completada</option>
                          <option value="cancelled">Cancelada</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setPendingAction({ type: 'delete-booking', booking: bk })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Borrar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: RESEÑAS */}
      {activeTab === 'resenas' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {filteredReviews.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No hay reseñas publicadas en Firestore que coincidan.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredReviews.map((rv) => (
                <div
                  key={rv.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-900">
                        {rv.authorName}
                      </span>
                      <span className="text-amber-600 font-semibold tabular-nums">
                        {rv.rating}.0 ★
                      </span>
                      <span className="text-slate-500">{rv.serviceType}</span>
                      <span className="text-slate-400">· {rv.createdAtLabel}</span>
                    </div>
                    <p className="text-sm text-slate-700">{rv.comment}</p>
                    <p className="text-xs text-slate-400 font-mono">
                      Folio reserva: {rv.bookingId}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setPendingAction({ type: 'delete-review', review: rv })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Borrar reseña</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: ADMINISTRADORES */}
      {activeTab === 'admins' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Cuentas con acceso al panel
            </h2>

            <div className="border border-teal-200 bg-teal-50/50 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
                  Super Administrador (permanente)
                </p>
                <p className="font-mono text-sm font-semibold text-slate-900 mt-0.5">
                  {SUPER_ADMIN_EMAIL}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Protegido directamente en las reglas de Firestore; no se puede suspender ni borrar.
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0" />
            </div>

            {admins.length === 0 ? (
              <p className="text-sm text-slate-500 pt-2">
                No hay otros administradores delegados todavía. También puedes promover usuarios
                directamente desde la pestaña Usuarios.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {admins.map((adm) => (
                  <div
                    key={adm.email}
                    className="p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-mono text-sm font-medium text-slate-900">
                        {adm.email}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Agregado por {adm.addedBy}
                        {adm.note ? ` · ${adm.note}` : ''}
                      </p>
                    </div>

                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() =>
                          setPendingAction({
                            type: 'revoke-admin',
                            email: adm.email,
                          })
                        }
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        Quitar permiso
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 space-y-4 self-start">
            <div className="flex items-center gap-2 text-slate-900 font-display text-lg font-bold">
              <UserPlus className="w-5 h-5 text-teal-700" />
              <h2>Nombrar otro administrador</h2>
            </div>

            <form onSubmit={handleAddAdminSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Escribe el correo de Google de la persona a la que quieres darle acceso a este
                panel de Base de datos. En cuanto inicie sesión con Google verá la pestaña.
              </p>

              <div>
                <label
                  htmlFor="admin-email-input"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Correo Gmail *
                </label>
                <input
                  id="admin-email-input"
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="companero@gmail.com"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-note-input"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Nota o puesto (opcional)
                </label>
                <input
                  id="admin-note-input"
                  type="text"
                  maxLength={120}
                  value={newAdminNote}
                  onChange={(e) => setNewAdminNote(e.target.value)}
                  placeholder="Ej. Moderador de equipo escolar"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              {adminFormError && (
                <p className="text-xs font-medium text-red-700">{adminFormError}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors cursor-pointer"
              >
                Promover a administrador
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB: AUDITORÍA */}
      {activeTab === 'auditoria' && <AdminAuditLog logs={auditLogs} />}

      {/* Compact Recent Audit Log Preview visible across tabs */}
      {activeTab !== 'auditoria' && (
        <AdminAuditLog
          logs={auditLogs}
          compact
          onViewAll={() => setActiveTab('auditoria')}
        />
      )}

      {/* Critical Action Confirmation Dialog */}
      {pendingAction && modalMeta && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="critical-confirm-title"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    modalMeta.tone === 'red'
                      ? 'bg-red-50 text-red-700'
                      : modalMeta.tone === 'amber'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-teal-50 text-teal-700'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3
                  id="critical-confirm-title"
                  className="font-display text-lg font-bold text-slate-900"
                >
                  {modalMeta.title}
                </h3>
              </div>

              <button
                type="button"
                aria-label="Cerrar confirmación"
                disabled={confirmBusy}
                onClick={() => setPendingAction(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {modalMeta.description}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={confirmBusy}
                onClick={() => setPendingAction(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={confirmBusy}
                onClick={handleConfirmCriticalAction}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 cursor-pointer transition-colors ${
                  modalMeta.tone === 'red'
                    ? 'bg-red-700 hover:bg-red-800'
                    : modalMeta.tone === 'amber'
                    ? 'bg-amber-700 hover:bg-amber-800'
                    : 'bg-teal-700 hover:bg-teal-800'
                }`}
              >
                {confirmBusy ? 'Procesando...' : modalMeta.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User / Professional Personal Data & Database Inspector Modal */}
      {inspectedTarget && (
        <AdminProfileDetailModal
          userProfile={inspectedTarget.user}
          focusedCleaner={inspectedTarget.cleaner}
          allCleaners={cleaners}
          allBookings={bookings}
          allReviews={reviews}
          delegatedAdminEmails={delegatedAdminEmails}
          onClose={() => setInspectedTarget(null)}
        />
      )}
    </section>
  );
};
