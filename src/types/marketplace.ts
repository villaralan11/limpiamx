export type CityMX =
  | 'CDMX'
  | 'Ecatepec'
  | 'Guadalajara'
  | 'Monterrey'
  | 'Puebla'
  | 'Querétaro'
  | 'Mérida';

export type ServiceCategory =
  | 'Hogar'
  | 'Profunda'
  | 'Oficina'
  | 'Airbnb'
  | 'Post-obra'
  | 'Planchado';

export type PropertySize =
  | 'Departamento (1-2 rec.)'
  | 'Casa (3+ rec.)'
  | 'Oficina / Local';

export type UserRole = 'client' | 'professional';

export type ContactPreference = 'WhatsApp' | 'Llamada' | 'Correo';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export const SUPER_ADMIN_EMAIL = 'villaralan11@gmail.com';

export interface AdminRecord {
  email: string;
  addedBy: string;
  note: string;
  createdAt?: Date | null;
}

export type AuditActionType =
  | 'promote_admin'
  | 'revoke_admin'
  | 'suspend_user'
  | 'reactivate_user'
  | 'change_user_role'
  | 'delete_user'
  | 'change_cleaner_status'
  | 'delete_cleaner'
  | 'change_booking_status'
  | 'delete_booking'
  | 'delete_review'
  | 'export_csv'
  | 'seed_demo_data';

export type AuditTargetType =
  | 'admin'
  | 'user'
  | 'cleaner'
  | 'booking'
  | 'review'
  | 'export';

export interface AuditLogRecord {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: AuditActionType;
  targetType: AuditTargetType;
  targetId: string;
  targetLabel: string;
  summary: string;
  createdAt?: Date | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
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
  googleLinked: boolean;
  suspended?: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface CleanerListing {
  id: string;
  ownerId: string;
  listingSource: 'catalog' | 'community';
  isDemo?: boolean;
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
  status: 'active' | 'paused' | 'suspended';
  profileCompleted: boolean;
  identityVerified?: boolean;
  ratingAvg: number;
  reviewsCount: number;
  completedCount: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface BookingRecord {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  cleanerId: string;
  cleanerName: string;
  cleanerOwnerId: string;
  listingSource: 'catalog' | 'community';
  city: string;
  coloniaAddress: string;
  serviceType: ServiceCategory;
  propertySize: PropertySize;
  scheduledDate: string;
  scheduledTime: string;
  durationHours: number;
  hourlyRateMxn: number;
  totalMxn: number;
  notes: string;
  status: BookingStatus;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface ReviewRecord {
  id: string;
  cleanerId: string;
  bookingId: string;
  authorId: string;
  authorName: string;
  rating: number;
  serviceType: ServiceCategory;
  comment: string;
  createdAtLabel: string;
}

export const CITIES_MX: CityMX[] = [
  'CDMX',
  'Ecatepec',
  'Guadalajara',
  'Monterrey',
  'Puebla',
  'Querétaro',
  'Mérida',
];

export const STATES_MX: string[] = [
  'Ciudad de México',
  'Estado de México',
  'Jalisco',
  'Nuevo León',
  'Puebla',
  'Querétaro',
  'Yucatán',
  'Guanajuato',
  'Quintana Roo',
  'Baja California',
  'Coahuila',
  'Veracruz',
];

export const CITY_TO_DEFAULT_STATE: Record<string, string> = {
  CDMX: 'Ciudad de México',
  Ecatepec: 'Estado de México',
  Guadalajara: 'Jalisco',
  Monterrey: 'Nuevo León',
  Puebla: 'Puebla',
  Querétaro: 'Querétaro',
  Mérida: 'Yucatán',
};

/**
 * Slug público de cada ciudad para las páginas SEO (#/limpieza-en-guadalajara).
 */
export const CITY_SLUGS: Record<CityMX, string> = {
  CDMX: 'limpieza-en-cdmx',
  Ecatepec: 'limpieza-en-ecatepec',
  Guadalajara: 'limpieza-en-guadalajara',
  Monterrey: 'limpieza-en-monterrey',
  Puebla: 'limpieza-en-puebla',
  Querétaro: 'limpieza-en-queretaro',
  Mérida: 'limpieza-en-merida',
};

export function cityFromSlug(slug: string): CityMX | null {
  const normalized = slug.trim().toLowerCase();
  const found = (Object.keys(CITY_SLUGS) as CityMX[]).find(
    (c) => CITY_SLUGS[c] === normalized
  );
  return found ?? null;
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  'Hogar',
  'Profunda',
  'Oficina',
  'Airbnb',
  'Post-obra',
  'Planchado',
];

export const PROPERTY_SIZES: PropertySize[] = [
  'Departamento (1-2 rec.)',
  'Casa (3+ rec.)',
  'Oficina / Local',
];

export const CONTACT_PREFERENCES: ContactPreference[] = [
  'WhatsApp',
  'Llamada',
  'Correo',
];

export const HERO_IMAGE_URL =
  '/src/assets/images/hero_mexican_living_room_1795321033270.jpg';

export const PORTRAIT_PRESETS: { label: string; url: string }[] = [
  {
    label: 'Retrato cocina residencial',
    url: '/src/assets/images/cleaner_portrait_lupe_1795321033640.jpg',
  },
  {
    label: 'Retrato equipo ecológico',
    url: '/src/assets/images/cleaner_portrait_carlos_1795321034337.jpg',
  },
  {
    label: 'Retrato blancos y Airbnb',
    url: '/src/assets/images/cleaner_portrait_marisol_1795321034368.jpg',
  },
  {
    label: 'Retrato limpieza profunda',
    url: '/src/assets/images/cleaner_portrait_roberto_1795321033559.jpg',
  },
  {
    label: 'Retrato hogar tradicional',
    url: '/src/assets/images/cleaner_portrait_elena_1795321033675.jpg',
  },
];

// Synchronized verbatim with firebase-blueprint.json & firestore.rules
export const VALIDATION_LIMITS = {
  firstName: { min: 1, max: 60 },
  lastName: { min: 1, max: 80 },
  displayName: { min: 2, max: 80 },
  businessNameMax: 80,
  headline: { min: 5, max: 120 },
  bio: { min: 15, max: 600 },
  descriptionMax: 600,
  coloniaMaxCount: 8,
  coloniaMaxLength: 60,
  hourlyRate: { min: 120, max: 1500 },
  fixedRateMax: 20000,
  minHours: { min: 2, max: 8 },
  yearsExperience: { min: 0, max: 50 },
  availability: { min: 3, max: 80 },
  photoUrlMax: 45000,
  phoneRegex: /^[0-9+\-\s()]{7,20}$/,
  postalCodeRegex: /^[0-9]{4,6}$/,
  coloniaAddress: { min: 4, max: 180 },
  notesMax: 400,
  reviewComment: { min: 10, max: 500 },
};

export function formatMxn(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function splitGoogleDisplayName(fullName: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  const clean = (fullName || '').trim().replace(/\s+/g, ' ');
  if (!clean) return { firstName: '', lastName: '' };
  const parts = clean.split(' ');
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}
