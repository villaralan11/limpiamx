import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  AdminRecord,
  AuditActionType,
  AuditLogRecord,
  AuditTargetType,
  BookingRecord,
  BookingStatus,
  CleanerListing,
  ContactPreference,
  PropertySize,
  ReviewRecord,
  ServiceCategory,
  SUPER_ADMIN_EMAIL,
  UserProfile,
  UserRole,
  VALIDATION_LIMITS,
} from '../types/marketplace';
import { auth, db, handleFirestoreError, isGoogleAccount, OperationType } from './firebase';

function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_\-]/g, '');
}

function toDateOrNull(val: unknown): Date | null {
  if (val instanceof Timestamp) return val.toDate();
  return null;
}

function formatRelativeSpanish(date: Date | null): string {
  if (!date) return 'Reciente';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 2) return 'Justo ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days} d`;
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

// ---------------------------------------------------------------------------
// User Profiles (/users/{uid})
// ---------------------------------------------------------------------------
function mapUserProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    email: String(data.email ?? ''),
    displayName: String(data.displayName ?? ''),
    firstName: String(data.firstName ?? ''),
    lastName: String(data.lastName ?? ''),
    photoURL: String(data.photoURL ?? ''),
    phone: String(data.phone ?? ''),
    role: data.role === 'professional' ? 'professional' : 'client',
    country: String(data.country ?? 'México'),
    state: String(data.state ?? ''),
    city: String(data.city ?? ''),
    neighborhood: String(data.neighborhood ?? ''),
    postalCode: String(data.postalCode ?? ''),
    description: String(data.description ?? ''),
    contactPreference:
      data.contactPreference === 'Llamada' || data.contactPreference === 'Correo'
        ? data.contactPreference
        : 'WhatsApp',
    profileCompleted: Boolean(data.profileCompleted),
    googleLinked: data.googleLinked !== false,
    suspended: Boolean(data.suspended),
    createdAt: toDateOrNull(data.createdAt),
    updatedAt: toDateOrNull(data.updatedAt),
  };
}

export function isUserProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return (
    profile.profileCompleted === true &&
    profile.firstName.trim().length >= VALIDATION_LIMITS.firstName.min &&
    profile.lastName.trim().length >= VALIDATION_LIMITS.lastName.min &&
    profile.state.trim().length >= 2 &&
    profile.city.trim().length >= 2 &&
    profile.neighborhood.trim().length >= 2 &&
    (profile.role === 'client' || profile.role === 'professional')
  );
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return mapUserProfile(uid, snap.data() as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void
): () => void {
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(mapUserProfile(uid, snap.data() as Record<string, unknown>));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export interface SaveUserProfileInput {
  firstName: string;
  lastName: string;
  photoURL: string;
  phone: string;
  role: UserRole;
  country: string;
  state: string;
  city: string;
  neighborhood: string;
  postalCode: string;
  description: string;
  contactPreference: ContactPreference;
  profileCompleted: boolean;
}

export async function saveUserProfile(
  input: SaveUserProfileInput,
  existsInDb: boolean
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('Debes iniciar sesión para guardar tu perfil.');
  }

  const firstName = input.firstName.trim().slice(0, VALIDATION_LIMITS.firstName.max);
  const lastName = input.lastName.trim().slice(0, VALIDATION_LIMITS.lastName.max);
  const displayName = `${firstName} ${lastName}`.trim().slice(0, 120);
  const phone = input.phone.trim().slice(0, 20);
  const postalCode = input.postalCode.trim().slice(0, 10);
  const photoURL = input.photoURL.trim().slice(0, VALIDATION_LIMITS.photoUrlMax);
  const path = `users/${user.uid}`;

  const commonFields = {
    displayName: displayName || user.displayName || 'Usuario LimpiaMX',
    firstName,
    lastName,
    photoURL,
    phone,
    role: input.role,
    country: input.country.trim().slice(0, 60) || 'México',
    state: input.state.trim().slice(0, 80),
    city: input.city.trim().slice(0, 80),
    neighborhood: input.neighborhood.trim().slice(0, 80),
    postalCode,
    description: input.description.trim().slice(0, VALIDATION_LIMITS.descriptionMax),
    contactPreference: input.contactPreference,
    profileCompleted: input.profileCompleted,
    updatedAt: serverTimestamp(),
  };

  try {
    if (existsInDb) {
      await updateDoc(doc(db, 'users', user.uid), commonFields);
    } else {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        googleLinked: isGoogleAccount(user),
        ...commonFields,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existsInDb ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

// ---------------------------------------------------------------------------
// Cleaner / Professional Listings (/cleaners/{cleanerId})
// ---------------------------------------------------------------------------
function mapCleanerDoc(id: string, data: Record<string, unknown>): CleanerListing {
  return {
    id,
    ownerId: String(data.ownerId ?? ''),
    listingSource: 'community',
    isDemo: false,
    displayName: String(data.displayName ?? ''),
    businessName: String(data.businessName ?? ''),
    headline: String(data.headline ?? ''),
    bio: String(data.bio ?? ''),
    state: String(data.state ?? ''),
    city: String(data.city ?? 'CDMX'),
    colonias: Array.isArray(data.colonias) ? data.colonias.map(String) : [],
    services: Array.isArray(data.services)
      ? (data.services as ServiceCategory[])
      : ['Hogar'],
    hourlyRateMxn: Number(data.hourlyRateMxn ?? 200),
    fixedServiceRateMxn: Number(data.fixedServiceRateMxn ?? 0),
    minHours: Number(data.minHours ?? 3),
    yearsExperience: Number(data.yearsExperience ?? 1),
    includesSupplies: Boolean(data.includesSupplies),
    availability: String(data.availability ?? ''),
    photoUrl: String(data.photoUrl ?? ''),
    portfolioUrls: Array.isArray(data.portfolioUrls)
      ? data.portfolioUrls.map(String)
      : [],
    status:
      data.status === 'suspended'
        ? 'suspended'
        : data.status === 'paused'
        ? 'paused'
        : 'active',
    profileCompleted: data.profileCompleted !== false,
    identityVerified: data.identityVerified === true,
    ratingAvg: Number(data.ratingAvg ?? 5),
    reviewsCount: Number(data.reviewsCount ?? 0),
    completedCount: Number(data.completedCount ?? 0),
    createdAt: toDateOrNull(data.createdAt),
    updatedAt: toDateOrNull(data.updatedAt),
  };
}

export function subscribeActiveCleaners(
  onData: (items: CleanerListing[]) => void
): () => void {
  const q = query(collection(db, 'cleaners'), where('status', '==', 'active'));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) =>
          mapCleanerDoc(d.id, d.data() as Record<string, unknown>)
        )
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'cleaners');
    }
  );
}

export function subscribeOwnerCleaners(
  ownerId: string,
  onData: (items: CleanerListing[]) => void
): () => void {
  const q = query(collection(db, 'cleaners'), where('ownerId', '==', ownerId));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) =>
          mapCleanerDoc(d.id, d.data() as Record<string, unknown>)
        )
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'cleaners');
    }
  );
}

export interface CleanerFormInput {
  displayName: string;
  businessName: string;
  headline: string;
  bio: string;
  state: string;
  city: string;
  colonias: string[];
  services: ServiceCategory[];
  hourlyRateMxn: number;
  fixedServiceRateMxn: number;
  minHours: number;
  yearsExperience: number;
  includesSupplies: boolean;
  availability: string;
  photoUrl: string;
  portfolioUrls: string[];
}

function sanitizeCleanerInput(input: CleanerFormInput) {
  const displayName = input.displayName.trim().slice(0, VALIDATION_LIMITS.displayName.max);
  const businessName = input.businessName.trim().slice(0, VALIDATION_LIMITS.businessNameMax);
  const headline = input.headline.trim().slice(0, VALIDATION_LIMITS.headline.max);
  const bio = input.bio.trim().slice(0, VALIDATION_LIMITS.bio.max);
  const state = input.state.trim().slice(0, 80);
  const city = input.city.trim().slice(0, 80);
  const colonias = input.colonias
    .map((c) => c.trim().slice(0, VALIDATION_LIMITS.coloniaMaxLength))
    .filter((c) => c.length >= 2)
    .slice(0, VALIDATION_LIMITS.coloniaMaxCount);
  const availability = input.availability.trim().slice(0, VALIDATION_LIMITS.availability.max);
  const photoUrl = input.photoUrl.trim().slice(0, VALIDATION_LIMITS.photoUrlMax);
  const portfolioUrls = input.portfolioUrls
    .map((u) => u.trim().slice(0, VALIDATION_LIMITS.photoUrlMax))
    .filter((u) => u.length >= 5)
    .slice(0, 4);
  const hourlyRateMxn = Math.min(
    VALIDATION_LIMITS.hourlyRate.max,
    Math.max(VALIDATION_LIMITS.hourlyRate.min, Math.round(input.hourlyRateMxn))
  );
  const fixedServiceRateMxn = Math.min(
    VALIDATION_LIMITS.fixedRateMax,
    Math.max(0, Math.round(input.fixedServiceRateMxn || 0))
  );
  const minHours = Math.min(
    VALIDATION_LIMITS.minHours.max,
    Math.max(VALIDATION_LIMITS.minHours.min, Math.round(input.minHours))
  );
  const yearsExperience = Math.min(
    VALIDATION_LIMITS.yearsExperience.max,
    Math.max(VALIDATION_LIMITS.yearsExperience.min, Math.round(input.yearsExperience))
  );

  return {
    displayName,
    businessName,
    headline,
    bio,
    state,
    city,
    colonias,
    services: input.services.slice(0, 6),
    hourlyRateMxn,
    fixedServiceRateMxn,
    minHours,
    yearsExperience,
    includesSupplies: Boolean(input.includesSupplies),
    availability,
    photoUrl,
    portfolioUrls,
  };
}

export async function createCleanerListing(input: CleanerFormInput): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión para publicar tu anuncio.');

  const clean = sanitizeCleanerInput(input);
  const id = makeSafeId('cln');
  const path = `cleaners/${id}`;
  try {
    await setDoc(doc(db, 'cleaners', id), {
      ownerId: user.uid,
      ...clean,
      status: 'active',
      profileCompleted: true,
      ratingAvg: 5,
      reviewsCount: 0,
      completedCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCleanerListing(
  cleanerId: string,
  input: CleanerFormInput
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión para editar tu anuncio.');

  const clean = sanitizeCleanerInput(input);
  const path = `cleaners/${cleanerId}`;
  try {
    await updateDoc(doc(db, 'cleaners', cleanerId), {
      ...clean,
      profileCompleted: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function upsertPrimaryProfessionalListing(
  input: CleanerFormInput
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión.');

  const q = query(collection(db, 'cleaners'), where('ownerId', '==', user.uid));
  const existing = await getDocs(q);
  if (!existing.empty) {
    const firstId = existing.docs[0].id;
    await updateCleanerListing(firstId, input);
    return firstId;
  }
  return createCleanerListing(input);
}

export async function toggleCleanerStatus(
  cleanerId: string,
  nextStatus: 'active' | 'paused'
): Promise<void> {
  const path = `cleaners/${cleanerId}`;
  try {
    await updateDoc(doc(db, 'cleaners', cleanerId), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCleanerListing(cleanerId: string): Promise<void> {
  const path = `cleaners/${cleanerId}`;
  try {
    await deleteDoc(doc(db, 'cleaners', cleanerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------------------------
// Bookings (/bookings/{bookingId})
// ---------------------------------------------------------------------------
export interface CreateBookingInput {
  cleaner: CleanerListing;
  clientName: string;
  clientPhone: string;
  coloniaAddress: string;
  serviceType: ServiceCategory;
  propertySize: PropertySize;
  scheduledDate: string;
  scheduledTime: string;
  durationHours: number;
  notes: string;
}

export async function createBooking(input: CreateBookingInput): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión para solicitar una contratación.');

  const id = makeSafeId('res');
  const path = `bookings/${id}`;
  const durationHours = Math.min(10, Math.max(2, Math.round(input.durationHours)));
  const hourlyRateMxn = input.cleaner.hourlyRateMxn;
  const totalMxn = durationHours * hourlyRateMxn;

  try {
    await setDoc(doc(db, 'bookings', id), {
      clientId: user.uid,
      clientName: input.clientName.trim().slice(0, 80),
      clientPhone: input.clientPhone.trim().slice(0, 20),
      cleanerId: input.cleaner.id,
      cleanerName: input.cleaner.displayName.slice(0, 80),
      cleanerOwnerId: input.cleaner.ownerId,
      listingSource: input.cleaner.listingSource,
      city: input.cleaner.city,
      coloniaAddress: input.coloniaAddress.trim().slice(0, VALIDATION_LIMITS.coloniaAddress.max),
      serviceType: input.serviceType,
      propertySize: input.propertySize,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      durationHours,
      hourlyRateMxn,
      totalMxn,
      notes: input.notes.trim().slice(0, VALIDATION_LIMITS.notesMax),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

function mapBookingDoc(id: string, data: Record<string, unknown>): BookingRecord {
  return {
    id,
    clientId: String(data.clientId ?? ''),
    clientName: String(data.clientName ?? ''),
    clientPhone: String(data.clientPhone ?? ''),
    cleanerId: String(data.cleanerId ?? ''),
    cleanerName: String(data.cleanerName ?? ''),
    cleanerOwnerId: String(data.cleanerOwnerId ?? ''),
    listingSource: (data.listingSource as 'catalog' | 'community') ?? 'catalog',
    city: String(data.city ?? 'CDMX'),
    coloniaAddress: String(data.coloniaAddress ?? ''),
    serviceType: (data.serviceType as ServiceCategory) ?? 'Hogar',
    propertySize:
      (data.propertySize as PropertySize) ?? 'Departamento (1-2 rec.)',
    scheduledDate: String(data.scheduledDate ?? ''),
    scheduledTime: String(data.scheduledTime ?? ''),
    durationHours: Number(data.durationHours ?? 3),
    hourlyRateMxn: Number(data.hourlyRateMxn ?? 200),
    totalMxn: Number(data.totalMxn ?? 600),
    notes: String(data.notes ?? ''),
    status: (data.status as BookingStatus) ?? 'pending',
    createdAt: toDateOrNull(data.createdAt),
    updatedAt: toDateOrNull(data.updatedAt),
  };
}

export function subscribeClientBookings(
  clientId: string,
  onData: (items: BookingRecord[]) => void
): () => void {
  const q = query(collection(db, 'bookings'), where('clientId', '==', clientId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => mapBookingDoc(d.id, d.data() as Record<string, unknown>))
        .sort(
          (a, b) =>
            (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
        );
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    }
  );
}

export function subscribeReceivedBookings(
  cleanerOwnerId: string,
  onData: (items: BookingRecord[]) => void
): () => void {
  const q = query(
    collection(db, 'bookings'),
    where('cleanerOwnerId', '==', cleanerOwnerId)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => mapBookingDoc(d.id, d.data() as Record<string, unknown>))
        .sort(
          (a, b) =>
            (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
        );
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    }
  );
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  const path = `bookings/${bookingId}`;
  try {
    await updateDoc(doc(db, 'bookings', bookingId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------------------------------------------------------------------
// Reviews (/reviews/{reviewId}) — Strictly linked to valid Bookings
// ---------------------------------------------------------------------------
export function subscribeReviews(
  onData: (items: ReviewRecord[]) => void
): () => void {
  return onSnapshot(
    collection(db, 'reviews'),
    (snap) => {
      const items: ReviewRecord[] = snap.docs.map((d) => {
        const data = d.data();
        const created = toDateOrNull(data.createdAt);
        return {
          id: d.id,
          cleanerId: String(data.cleanerId ?? ''),
          bookingId: String(data.bookingId ?? ''),
          authorId: String(data.authorId ?? ''),
          authorName: String(data.authorName ?? ''),
          rating: Number(data.rating ?? 5),
          serviceType: (data.serviceType as ServiceCategory) ?? 'Hogar',
          comment: String(data.comment ?? ''),
          createdAtLabel: formatRelativeSpanish(created),
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
    }
  );
}

export async function createReview(params: {
  cleanerId: string;
  bookingId: string;
  authorName: string;
  rating: number;
  serviceType: ServiceCategory;
  comment: string;
}): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Inicia sesión para dejar una reseña.');

  const id = makeSafeId('rev');
  const path = `reviews/${id}`;
  try {
    await setDoc(doc(db, 'reviews', id), {
      cleanerId: params.cleanerId,
      bookingId: params.bookingId,
      authorId: user.uid,
      authorName: params.authorName.trim().slice(0, 80),
      rating: Math.min(5, Math.max(1, Math.round(params.rating))),
      serviceType: params.serviceType,
      comment: params.comment.trim().slice(0, VALIDATION_LIMITS.reviewComment.max),
      createdAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ---------------------------------------------------------------------------
// Private Favorites (/users/{uid}/private/preferences)
// ---------------------------------------------------------------------------
export async function loadFavoriteCleanerIds(userId: string): Promise<string[]> {
  const path = `users/${userId}/private/preferences`;
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'private', 'preferences'));
    if (!snap.exists()) return [];
    const data = snap.data();
    return Array.isArray(data.favoriteCleanerIds)
      ? data.favoriteCleanerIds.map(String)
      : [];
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveFavoriteCleanerIds(
  userId: string,
  favoriteIds: string[]
): Promise<void> {
  const path = `users/${userId}/private/preferences`;
  try {
    await setDoc(doc(db, 'users', userId, 'private', 'preferences'), {
      userId,
      favoriteCleanerIds: favoriteIds.slice(0, 30),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------------------------------------------------------------------
// Admin RBAC & Database Management Console Operations
// ---------------------------------------------------------------------------
export async function checkIsAdminUser(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === SUPER_ADMIN_EMAIL) return true;
  try {
    const snap = await getDoc(doc(db, 'admins', normalized));
    return snap.exists();
  } catch {
    return false;
  }
}

export function subscribeAllAdmins(
  onData: (admins: AdminRecord[]) => void
): () => void {
  return onSnapshot(
    collection(db, 'admins'),
    (snap) => {
      const items: AdminRecord[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          email: String(data.email ?? d.id),
          addedBy: String(data.addedBy ?? ''),
          note: String(data.note ?? ''),
          createdAt: toDateOrNull(data.createdAt),
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'admins');
    }
  );
}

export async function addDelegatedAdmin(
  emailInput: string,
  note: string
): Promise<void> {
  const current = auth.currentUser;
  if (!current || !current.email) {
    throw new Error('Sesión no válida.');
  }
  const email = emailInput.trim().toLowerCase();
  if (email === SUPER_ADMIN_EMAIL) {
    throw new Error('Ese correo ya es el Super Administrador principal.');
  }
  const path = `admins/${email}`;
  try {
    await setDoc(doc(db, 'admins', email), {
      email,
      addedBy: current.email.toLowerCase(),
      note: note.trim().slice(0, 120),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeDelegatedAdmin(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const path = `admins/${normalized}`;
  try {
    await deleteDoc(doc(db, 'admins', normalized));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeAllUsersAdmin(
  onData: (users: UserProfile[]) => void
): () => void {
  return onSnapshot(
    collection(db, 'users'),
    (snap) => {
      const items = snap.docs
        .map((d) => mapUserProfile(d.id, d.data() as Record<string, unknown>))
        .sort(
          (a, b) =>
            (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
        );
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  );
}

export function subscribeAllCleanersAdmin(
  onData: (items: CleanerListing[]) => void
): () => void {
  return onSnapshot(
    collection(db, 'cleaners'),
    (snap) => {
      const items = snap.docs
        .map((d) => mapCleanerDoc(d.id, d.data() as Record<string, unknown>))
        .sort(
          (a, b) =>
            (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
        );
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'cleaners');
    }
  );
}

export function subscribeAllBookingsAdmin(
  onData: (items: BookingRecord[]) => void
): () => void {
  return onSnapshot(
    collection(db, 'bookings'),
    (snap) => {
      const items = snap.docs
        .map((d) => mapBookingDoc(d.id, d.data() as Record<string, unknown>))
        .sort(
          (a, b) =>
            (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
        );
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    }
  );
}

export async function adminSetUserSuspended(
  uid: string,
  suspended: boolean
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      suspended,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adminSetUserRole(
  uid: string,
  role: UserRole
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      role,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adminDeleteUser(uid: string): Promise<void> {
  const path = `users/${uid}`;
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function adminSetCleanerStatus(
  cleanerId: string,
  status: 'active' | 'paused' | 'suspended'
): Promise<void> {
  const path = `cleaners/${cleanerId}`;
  try {
    await updateDoc(doc(db, 'cleaners', cleanerId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adminDeleteBooking(bookingId: string): Promise<void> {
  const path = `bookings/${bookingId}`;
  try {
    await deleteDoc(doc(db, 'bookings', bookingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function adminDeleteReview(reviewId: string): Promise<void> {
  const path = `reviews/${reviewId}`;
  try {
    await deleteDoc(doc(db, 'reviews', reviewId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------------------------
// Admin Audit Logs (/auditLogs/{logId})
// ---------------------------------------------------------------------------
export async function recordAdminAuditLog(params: {
  action: AuditActionType;
  targetType: AuditTargetType;
  targetId: string;
  targetLabel: string;
  summary: string;
}): Promise<void> {
  const current = auth.currentUser;
  if (!current || !current.email) return;

  const id = makeSafeId('aud');
  const path = `auditLogs/${id}`;
  const targetId = params.targetId.trim().slice(0, 160) || 'unknown';
  const targetLabel = params.targetLabel.trim().slice(0, 160) || 'Registro';
  const summary = params.summary.trim().slice(0, 260);
  if (summary.length < 4) return;

  try {
    await setDoc(doc(db, 'auditLogs', id), {
      actorUid: current.uid,
      actorEmail: current.email.trim().toLowerCase().slice(0, 160),
      action: params.action,
      targetType: params.targetType,
      targetId,
      targetLabel,
      summary,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeAdminAuditLogs(
  onData: (logs: AuditLogRecord[]) => void,
  maxItems = 50
): () => void {
  const q = query(
    collection(db, 'auditLogs'),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items: AuditLogRecord[] = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          actorUid: String(data.actorUid ?? ''),
          actorEmail: String(data.actorEmail ?? ''),
          action: (data.action as AuditActionType) ?? 'suspend_user',
          targetType: (data.targetType as AuditTargetType) ?? 'user',
          targetId: String(data.targetId ?? ''),
          targetLabel: String(data.targetLabel ?? ''),
          summary: String(data.summary ?? ''),
          createdAt: toDateOrNull(data.createdAt),
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'auditLogs');
    }
  );
}

// ---------------------------------------------------------------------------
// Verificaciones INE (/verifications/{userId}) — solo resumen no sensible
// ---------------------------------------------------------------------------
export interface FirestoreVerificationSummary {
  uid: string;
  status: 'verified' | 'rejected';
  method: 'INE_AI';
  verificationId: string;
  confidenceScore: number;
  vigenciaYear: number;
  maskedCurp: string;
  summary: string;
  verifiedAt: string;
}

export async function saveVerificationToFirestore(
  record: FirestoreVerificationSummary
): Promise<void> {
  const user = auth.currentUser;
  if (!user || user.uid !== record.uid) return;
  const path = `verifications/${record.uid}`;
  try {
    await setDoc(doc(db, 'verifications', record.uid), {
      uid: record.uid,
      status: record.status,
      method: 'INE_AI',
      verificationId: record.verificationId.slice(0, 64),
      confidenceScore: Math.max(0, Math.min(100, Math.round(record.confidenceScore))),
      vigenciaYear: Math.max(0, Math.min(2100, Math.round(record.vigenciaYear))),
      maskedCurp: record.maskedCurp.slice(0, 24),
      summary: record.summary.slice(0, 300),
      verifiedAt: record.verifiedAt.slice(0, 40),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeVerifications(
  onData: (map: Record<string, FirestoreVerificationSummary>) => void
): () => void {
  return onSnapshot(
    collection(db, 'verifications'),
    (snap) => {
      const result: Record<string, FirestoreVerificationSummary> = {};
      for (const d of snap.docs) {
        const data = d.data() as Record<string, unknown>;
        result[d.id] = {
          uid: String(data.uid ?? d.id),
          status: data.status === 'verified' ? 'verified' : 'rejected',
          method: 'INE_AI',
          verificationId: String(data.verificationId ?? ''),
          confidenceScore: Number(data.confidenceScore ?? 0),
          vigenciaYear: Number(data.vigenciaYear ?? 0),
          maskedCurp: String(data.maskedCurp ?? ''),
          summary: String(data.summary ?? ''),
          verifiedAt: String(data.verifiedAt ?? ''),
        };
      }
      onData(result);
    },
    () => {
      // Non-blocking fallback if rules or offline state prevent snapshot
    }
  );
}


