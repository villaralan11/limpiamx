import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { APIProvider } from '@vis.gl/react-google-maps';
import { LayoutGrid, MapPin, Radar, Search, SlidersHorizontal, X } from 'lucide-react';
import { CATALOG_CLEANERS, CATALOG_REVIEWS } from './data/catalog';
import { auth, signOutUser } from './lib/firebase';
import {
  GOOGLE_MAPS_API_KEY,
  isGmpUnavailable,
  markGmpUnavailable,
} from './lib/mapsPlacesHelper';
import { isIdentityVerified, recordNotification } from './lib/marketplaceExtras';
import {
  checkIsAdminUser,
  FirestoreVerificationSummary,
  isUserProfileComplete,
  loadFavoriteCleanerIds,
  recordAdminAuditLog,
  saveFavoriteCleanerIds,
  subscribeActiveCleaners,
  subscribeAdminAuditLogs,
  subscribeAllAdmins,
  subscribeAllBookingsAdmin,
  subscribeAllCleanersAdmin,
  subscribeAllUsersAdmin,
  subscribeClientBookings,
  subscribeOwnerCleaners,
  subscribeReceivedBookings,
  subscribeReviews,
  subscribeUserProfile,
  subscribeVerifications,
} from './lib/marketplaceService';
import { seedDemoMarketplaceToFirestore } from './lib/seedDemoService';
import {
  AdminRecord,
  AuditLogRecord,
  BookingRecord,
  CITIES_MX,
  CITY_SLUGS,
  CityMX,
  CleanerListing,
  ReviewRecord,
  SERVICE_CATEGORIES,
  ServiceCategory,
  SUPER_ADMIN_EMAIL,
  UserProfile,
} from './types/marketplace';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ActiveSection, Header, INFO_SECTIONS } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { HeroSection } from './components/HeroSection';
import { CleanerCard } from './components/CleanerCard';
import { CleanerDetailModal } from './components/CleanerDetailModal';
import { HowItWorksSection } from './components/HowItWorksSection';
import { Footer } from './components/Footer';
import { EmptyState } from './components/SharedUI';
import {
  FaqSection,
  LandingActivityShowcase,
  ProCtaBanner,
  PlansSection,
  ReviewsSection,
  SafetySection,
  ServiceTiles,
  StatsStrip,
} from './components/HomeSections';
import {
  AboutPage,
  ContactPage,
  FaqPage,
  PlansPage,
  PrivacyPage,
  SafetyPage,
  TermsPage,
} from './components/InfoPages';
import { CookieBanner } from './components/CookieBanner';
import { CityPage } from './components/CityPage';
import { QuoteCalculator } from './components/QuoteCalculator';
import { BlogArticlePage, BlogIndexPage } from './components/BlogPages';
import { NotFoundPage } from './components/NotFoundPage';
import { FloatingActions } from './components/FloatingActions';
import { computeCityRateStats } from './lib/pricing';
import { getBlogPost } from './data/blogPosts';

const SECTION_IDS: ActiveSection[] = [
  'explorar',
  'anunciate',
  'mis-reservas',
  'mi-perfil',
  'base-datos',
  ...INFO_SECTIONS,
];

const SECTION_TITLES: Record<ActiveSection, string> = {
  explorar: 'LimpiaMX — Personal de limpieza de confianza en México',
  'como-funciona': 'Cómo funciona — LimpiaMX',
  anunciate: 'Anuncia tus servicios — LimpiaMX',
  'mis-reservas': 'Mis reservas — LimpiaMX',
  'mi-perfil': 'Mi perfil — LimpiaMX',
  'base-datos': 'Administración — LimpiaMX',
  planes: 'Planes y precios — LimpiaMX',
  nosotros: 'Sobre nosotros — LimpiaMX',
  seguridad: 'Confianza y seguridad — LimpiaMX',
  faq: 'Preguntas frecuentes — LimpiaMX',
  contacto: 'Contacto — LimpiaMX',
  terminos: 'Términos y condiciones — LimpiaMX',
  privacidad: 'Aviso de privacidad — LimpiaMX',
  blog: 'Guías de limpieza — LimpiaMX',
  cotizador: 'Cotizador de limpieza — LimpiaMX',
  'limpieza-en-cdmx': 'Limpieza en CDMX — Precios y perfiles | LimpiaMX',
  'limpieza-en-ecatepec': 'Limpieza en Ecatepec — Precios y perfiles | LimpiaMX',
  'limpieza-en-guadalajara': 'Limpieza en Guadalajara — Precios y perfiles | LimpiaMX',
  'limpieza-en-monterrey': 'Limpieza en Monterrey — Precios y perfiles | LimpiaMX',
  'limpieza-en-puebla': 'Limpieza en Puebla — Precios y perfiles | LimpiaMX',
  'limpieza-en-queretaro': 'Limpieza en Querétaro — Precios y perfiles | LimpiaMX',
  'limpieza-en-merida': 'Limpieza en Mérida — Precios y perfiles | LimpiaMX',
  notfound: 'Página no encontrada — LimpiaMX',
};

const CITY_SECTION_TO_CITY = Object.fromEntries(
  (Object.entries(CITY_SLUGS) as [CityMX, string][]).map(([city, slug]) => [
    slug,
    city,
  ])
) as Record<string, CityMX>;

type HashRoute =
  | { kind: 'home' }
  | { kind: 'section'; section: ActiveSection }
  | { kind: 'profile'; cleanerId: string }
  | { kind: 'blog-post'; slug: string };

/** Lee la ruta completa desde la URL: secciones, perfil, artículo o 404. */
function parseHashRoute(): HashRoute {
  const raw = window.location.hash.replace(/^#\/?/, '').trim();
  if (!raw) return { kind: 'home' };
  if (raw.startsWith('profesional/')) {
    const cleanerId = raw.slice('profesional/'.length).trim();
    if (cleanerId) return { kind: 'profile', cleanerId };
    return { kind: 'section', section: 'notfound' };
  }
  if (raw.startsWith('blog/')) {
    const slug = raw.slice('blog/'.length).trim();
    if (getBlogPost(slug)) return { kind: 'blog-post', slug };
    return { kind: 'section', section: 'notfound' };
  }
  const found = SECTION_IDS.find((s) => s === raw);
  if (found) return { kind: 'section', section: found };
  return { kind: 'section', section: 'notfound' };
}

const PublishAdView = lazy(() =>
  import('./components/PublishAdView').then((m) => ({ default: m.PublishAdView }))
);
const DashboardView = lazy(() =>
  import('./components/DashboardView').then((m) => ({ default: m.DashboardView }))
);
const OnboardingWizard = lazy(() =>
  import('./components/OnboardingWizard').then((m) => ({ default: m.OnboardingWizard }))
);
const ProfileView = lazy(() =>
  import('./components/ProfileView').then((m) => ({ default: m.ProfileView }))
);
const AdminPanelView = lazy(() =>
  import('./components/AdminPanelView').then((m) => ({ default: m.AdminPanelView }))
);
const WorkerRadarMap = lazy(() =>
  import('./components/WorkerRadarMap').then((m) => ({ default: m.WorkerRadarMap }))
);

function ViewLoadingFallback({ label = 'Cargando vista...' }: { label?: string }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-14 text-center">
      <div className="bg-white border border-slate-200 rounded-xl p-8">
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
    </div>
  );
}

type SortOption = 'recommended' | 'price-asc' | 'price-desc' | 'experience';
type ExploreViewMode = 'grid' | 'radar';

function normalizeFilterText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function MarketplaceContent() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Router: la URL manda. La sección activa y el slug del blog se derivan del hash.
  const initialRoute = useMemo(parseHashRoute, []);
  const [activeSection, setActiveSection] = useState<ActiveSection>(() => {
    if (initialRoute.kind === 'section') return initialRoute.section;
    if (initialRoute.kind === 'blog-post') return 'blog';
    return 'explorar';
  });
  const [blogSlug, setBlogSlug] = useState<string>(
    initialRoute.kind === 'blog-post' ? initialRoute.slug : ''
  );
  const [communityCleaners, setCommunityCleaners] = useState<CleanerListing[]>([]);
  const [ownerListings, setOwnerListings] = useState<CleanerListing[]>([]);
  const [clientBookings, setClientBookings] = useState<BookingRecord[]>([]);
  const [receivedBookings, setReceivedBookings] = useState<BookingRecord[]>([]);
  const [liveReviews, setLiveReviews] = useState<ReviewRecord[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Admin Console Collections (only subscribed when isAdmin && activeSection === 'base-datos')
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [adminCleaners, setAdminCleaners] = useState<CleanerListing[]>([]);
  const [adminBookings, setAdminBookings] = useState<BookingRecord[]>([]);
  const [adminRecords, setAdminRecords] = useState<AdminRecord[]>([]);
  const [adminAuditLogs, setAdminAuditLogs] = useState<AuditLogRecord[]>([]);

  // Filters
  const [selectedCity, setSelectedCity] = useState<CityMX | 'Todas'>('Todas');
  const [selectedColonia, setSelectedColonia] = useState<string>('Todas');
  const [coloniaQuery, setColoniaQuery] = useState('');
  const [selectedService, setSelectedService] = useState<
    ServiceCategory | 'Todos'
  >('Todos');
  const [suppliesOnly, setSuppliesOnly] = useState(false);
  const [maxRate, setMaxRate] = useState<number>(500);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [exploreViewMode, setExploreViewMode] =
    useState<ExploreViewMode>('grid');
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState<boolean>(() =>
    isGmpUnavailable()
  );

  // Modals / Edit State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string | null>(null);
  const [editingListing, setEditingListing] = useState<CleanerListing | null>(null);
  const [firestoreVerifications, setFirestoreVerifications] = useState<
    Record<string, FirestoreVerificationSummary>
  >({});
  const [verificationTick, setVerificationTick] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef<number | null>(null);

  // URL ↔ estado: al cambiar de sección por estado, refleja el hash y el título.
  // Nunca reescribe rutas hash especiales (#/profesional/... o #/blog/...).
  useEffect(() => {
    if (selectedCleanerId || blogSlug) return;
    document.title = SECTION_TITLES[activeSection];
    const current = window.location.hash.replace(/^#\/?/, '').trim();
    if (current.startsWith('profesional/') || current.startsWith('blog/')) {
      return;
    }
    if (current === activeSection) return;
    if (current === '' && activeSection === 'explorar') return;
    const url = `${window.location.pathname}${window.location.search}#/${activeSection}`;
    window.history.replaceState(null, '', url);
  }, [activeSection, selectedCleanerId, blogSlug]);

  // Aplica la ruta del hash al estado (navegación, atrás/adelante, link compartido).
  useEffect(() => {
    const applyHashRoute = () => {
      const route = parseHashRoute();
      if (route.kind === 'profile') {
        setSelectedCleanerId(route.cleanerId);
        document.title = 'Perfil profesional — LimpiaMX';
        return;
      }
      // Al salir de una ruta de perfil, el modal se cierra.
      setSelectedCleanerId(null);
      if (route.kind === 'blog-post') {
        setBlogSlug(route.slug);
        setActiveSection('blog');
        document.title = `${getBlogPost(route.slug)?.title ?? 'Guía'} — LimpiaMX`;
        return;
      }
      setBlogSlug('');
      if (route.kind === 'section') {
        setActiveSection(route.section);
        return;
      }
      setActiveSection('explorar');
    };

    applyHashRoute();
    const onUrlChange = () => applyHashRoute();
    window.addEventListener('popstate', onUrlChange);
    window.addEventListener('hashchange', onUrlChange);
    return () => {
      window.removeEventListener('popstate', onUrlChange);
      window.removeEventListener('hashchange', onUrlChange);
    };
  }, []);

  // Último hash de sección conocido, para restaurar al cerrar el perfil.
  const lastSectionHashRef = useRef<string>('#/explorar');
  useEffect(() => {
    if (!selectedCleanerId) {
      lastSectionHashRef.current = `#/${activeSection}`;
    }
  }, [activeSection, selectedCleanerId]);
  const profileOpenedByAppRef = useRef(false);

  const openCleanerProfile = (cleanerId: string) => {
    profileOpenedByAppRef.current = true;
    window.location.hash = `/profesional/${cleanerId}`;
  };

  const closeCleanerProfile = () => {
    if (profileOpenedByAppRef.current) {
      profileOpenedByAppRef.current = false;
      window.history.back();
      return;
    }
    // El perfil se abrió desde un enlace compartido: vuelve al inicio.
    window.location.hash = '/explorar';
  };

  useEffect(() => {
    if (isGmpUnavailable()) {
      setMapsQuotaExceeded(true);
    }
    const handleQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setProfileLoading(true);
      } else {
        setUserProfile(null);
        setProfileLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  // Public listeners: active community cleaners, public reviews & INE verification statuses
  useEffect(() => {
    const unsubCleaners = subscribeActiveCleaners(setCommunityCleaners);
    const unsubReviews = subscribeReviews(setLiveReviews);
    const unsubVerifications = subscribeVerifications(setFirestoreVerifications);
    return () => {
      unsubCleaners();
      unsubReviews();
      unsubVerifications();
    };
  }, []);

  // Authenticated listeners: userProfile, bookings, owner listings, favorites, admin role check
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setOwnerListings([]);
      setClientBookings([]);
      setReceivedBookings([]);
      setFavoriteIds([]);
      setAdminUsers([]);
      setAdminCleaners([]);
      setAdminBookings([]);
      setAdminRecords([]);
      setAdminAuditLogs([]);
      return;
    }

    let cancelled = false;
    if (user.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL) {
      setIsAdmin(true);
    } else {
      checkIsAdminUser(user.email).then((allowed) => {
        if (!cancelled) setIsAdmin(allowed);
      });
    }

    const unsubProfile = subscribeUserProfile(user.uid, (prof) => {
      setUserProfile(prof);
      setProfileLoading(false);
    });
    const unsubOwner = subscribeOwnerCleaners(user.uid, setOwnerListings);
    const unsubClientBookings = subscribeClientBookings(
      user.uid,
      setClientBookings
    );
    const unsubReceived = subscribeReceivedBookings(
      user.uid,
      setReceivedBookings
    );

    loadFavoriteCleanerIds(user.uid)
      .then(setFavoriteIds)
      .catch(() => {
        // handled inside service
      });

    return () => {
      cancelled = true;
      unsubProfile();
      unsubOwner();
      unsubClientBookings();
      unsubReceived();
    };
  }, [user]);

  // Admin-only listeners when viewing the Base de datos panel
  useEffect(() => {
    if (!isAdmin && activeSection === 'base-datos') {
      setActiveSection('explorar');
      return;
    }
    if (!user || !isAdmin || activeSection !== 'base-datos') {
      return;
    }

    const unsubAdmins = subscribeAllAdmins(setAdminRecords);
    const unsubAllUsers = subscribeAllUsersAdmin(setAdminUsers);
    const unsubAllCleaners = subscribeAllCleanersAdmin(setAdminCleaners);
    const unsubAllBookings = subscribeAllBookingsAdmin(setAdminBookings);
    const unsubAuditLogs = subscribeAdminAuditLogs(setAdminAuditLogs);

    return () => {
      unsubAdmins();
      unsubAllUsers();
      unsubAllCleaners();
      unsubAllBookings();
      unsubAuditLogs();
    };
  }, [user, isAdmin, activeSection]);

  // One-time idempotent demo seed into Firestore when verified admin logs in
  useEffect(() => {
    if (!user || !isAdmin) return;
    if (localStorage.getItem('limpiamx_demo_seeded_v4') === '1') return;

    let cancelled = false;
    seedDemoMarketplaceToFirestore()
      .then(async (res) => {
        if (cancelled) return;
        localStorage.setItem('limpiamx_demo_seeded_v4', '1');
        const total =
          res.usersAdded +
          res.cleanersAdded +
          res.bookingsAdded +
          res.reviewsAdded +
          res.photosRefreshed;
        if (total > 0) {
          try {
            await recordAdminAuditLog({
              action: 'seed_demo_data',
              targetType: 'cleaner',
              targetId: 'demo_seed_v4',
              targetLabel: `+${res.usersAdded} usuarios · +${res.bookingsAdded} reservas · +${res.reviewsAdded} reseñas`,
              summary: `Sincronización en Firestore (+${res.usersAdded} usuarios, +${res.cleanersAdded} anuncios, +${res.bookingsAdded} reservas, +${res.reviewsAdded} reseñas).`,
            });
          } catch {
            // non-fatal
          }
          showToast(
            `Base de datos sincronizada (+${res.usersAdded} usuarios, +${res.bookingsAdded} reservas y +${res.reviewsAdded} reseñas).`
          );
        }
      })
      .catch(() => {
        // Admin can also trigger manually from AdminPanelView
      });

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const dismissToast = () => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToastMessage('');
  };

  const showToast = (msg: string, durationMs = 4000) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage('');
      toastTimerRef.current = null;
    }, durationMs);
  };

  const handleSignIn = async () => {
    setAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOutUser();
    setActiveSection('explorar');
    showToast('Sesión cerrada.');
  };

  const isSuspendedUser = Boolean(user && userProfile?.suspended && !isAdmin);

  const needsOnboarding =
    Boolean(user) &&
    !profileLoading &&
    !isSuspendedUser &&
    !isUserProfileComplete(userProfile);

  const allReviews = useMemo(() => {
    const liveIds = new Set(liveReviews.map((r) => r.id));
    return [...liveReviews, ...CATALOG_REVIEWS.filter((r) => !liveIds.has(r.id))];
  }, [liveReviews]);

  const allCleaners = useMemo(() => {
    const liveIds = new Set(communityCleaners.map((c) => c.id));
    const merged = [
      ...communityCleaners,
      ...CATALOG_CLEANERS.filter((c) => !liveIds.has(c.id)),
    ];
    return merged.map((cl) => {
      const revs = allReviews.filter((r) => r.cleanerId === cl.id);
      const completed = clientBookings.filter(
        (b) => b.cleanerId === cl.id && b.status === 'completed'
      ).length;
      const isDemoProfile =
        cl.isDemo ||
        cl.listingSource === 'catalog' ||
        cl.ownerId === 'catalog' ||
        cl.ownerId.startsWith('demo_');
      return {
        ...cl,
        // Los perfiles de catálogo/demo vienen verificados por diseño; los
        // anuncios reales solo cuando el dueño completó la verificación INE.
        identityVerified:
          cl.identityVerified === true ||
          isDemoProfile ||
          firestoreVerifications[cl.ownerId]?.status === 'verified' ||
          isIdentityVerified(cl.ownerId),
        ratingAvg:
          revs.length > 0
            ? Number(
                (revs.reduce((sum, r) => sum + r.rating, 0) / revs.length).toFixed(
                  1
                )
              )
            : cl.ratingAvg,
        reviewsCount: revs.length > 0 ? revs.length : cl.reviewsCount,
        completedCount: Math.max(cl.completedCount, completed),
      };
    });
  }, [communityCleaners, allReviews, clientBookings, firestoreVerifications, verificationTick]);

  const availableColonias = useMemo(() => {
    const seen: Record<string, string> = {};
    for (const cl of allCleaners) {
      if (selectedCity !== 'Todas' && cl.city !== selectedCity) continue;
      for (const col of cl.colonias) {
        const clean = col.trim();
        if (!clean) continue;
        const key = normalizeFilterText(clean);
        if (!Object.prototype.hasOwnProperty.call(seen, key)) {
          seen[key] = clean;
        }
      }
    }
    return Object.values(seen).sort((a, b) => a.localeCompare(b, 'es-MX'));
  }, [allCleaners, selectedCity]);

  useEffect(() => {
    if (selectedColonia === 'Todas') return;
    const selectedKey = normalizeFilterText(selectedColonia);
    const existsInCity = availableColonias.some(
      (col) => normalizeFilterText(col) === selectedKey
    );
    if (!existsInCity) {
      setSelectedColonia('Todas');
    }
  }, [availableColonias, selectedColonia]);

  const filteredCleaners = useMemo(() => {
    const q = normalizeFilterText(searchQuery);
    const colQ = normalizeFilterText(coloniaQuery);
    const selectedColKey =
      selectedColonia !== 'Todas' ? normalizeFilterText(selectedColonia) : '';

    const list = allCleaners.filter((cl) => {
      if (selectedCity !== 'Todas' && cl.city !== selectedCity) return false;
      if (
        selectedColKey &&
        !cl.colonias.some((col) => normalizeFilterText(col) === selectedColKey)
      ) {
        return false;
      }
      if (
        colQ &&
        !cl.colonias.some((col) => normalizeFilterText(col).includes(colQ))
      ) {
        return false;
      }
      if (selectedService !== 'Todos' && !cl.services.includes(selectedService))
        return false;
      if (suppliesOnly && !cl.includesSupplies) return false;
      if (cl.hourlyRateMxn > maxRate) return false;
      if (q) {
        const hay = normalizeFilterText(
          [
            cl.displayName,
            cl.businessName,
            cl.headline,
            cl.city,
            ...cl.colonias,
            ...cl.services,
          ].join(' ')
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.hourlyRateMxn - b.hourlyRateMxn);
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => b.hourlyRateMxn - a.hourlyRateMxn);
    }
    if (sortBy === 'experience') {
      return [...list].sort((a, b) => b.yearsExperience - a.yearsExperience);
    }
    return list;
  }, [
    allCleaners,
    selectedCity,
    selectedColonia,
    coloniaQuery,
    selectedService,
    suppliesOnly,
    maxRate,
    searchQuery,
    sortBy,
  ]);

  const favoriteCleaners = useMemo(() => {
    return allCleaners.filter((c) => favoriteIds.includes(c.id));
  }, [allCleaners, favoriteIds]);

  const selectedCleaner = useMemo(() => {
    if (!selectedCleanerId) return null;
    return allCleaners.find((c) => c.id === selectedCleanerId) ?? null;
  }, [allCleaners, selectedCleanerId]);

  const userPublishedReviews = useMemo(() => {
    if (!user) return [];
    return liveReviews.filter((r) => r.authorId === user.uid);
  }, [liveReviews, user]);

  const handleToggleFavorite = async (cleanerId: string) => {
    if (!user) {
      await handleSignIn();
      return;
    }
    const next = favoriteIds.includes(cleanerId)
      ? favoriteIds.filter((id) => id !== cleanerId)
      : [...favoriteIds, cleanerId].slice(0, 30);
    setFavoriteIds(next);
    await saveFavoriteCleanerIds(user.uid, next);
  };

  const handleNavigate = (section: ActiveSection) => {
    if (section === 'como-funciona') {
      setActiveSection('explorar');
      setTimeout(() => {
        document
          .getElementById('como-funciona')
          ?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
      return;
    }
    if (section === 'base-datos' && !isAdmin) {
      return;
    }
    if (section !== 'anunciate') {
      setEditingListing(null);
    }
    // Navegación por hash: así el botón Atrás regresa a la sección anterior.
    const currentRaw = window.location.hash.replace(/^#\/?/, '').trim();
    if (currentRaw === section) {
      setActiveSection(section);
    } else {
      window.location.hash = `/${section}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHeroSearch = (city: CityMX | 'Todas', queryText: string) => {
    setSelectedCity(city);
    setSelectedColonia('Todas');
    setColoniaQuery('');
    setSearchQuery(queryText);
    setActiveSection('explorar');
    setTimeout(() => {
      document
        .getElementById('catalogo-limpieza')
        ?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const handleExploreCity = (city: CityMX) => {
    setSelectedCity(city);
    setSelectedColonia('Todas');
    setColoniaQuery('');
    setSearchQuery('');
  };

  const handleSelectService = (service: ServiceCategory) => {
    setSelectedService(service);
    setActiveSection('explorar');
    setTimeout(() => {
      document
        .getElementById('catalogo-limpieza')
        ?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const handleOpenBlogPost = (slug: string) => {
    window.location.hash = `/blog/${slug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isInfoSection = INFO_SECTIONS.includes(activeSection);

  const resetFilters = () => {
    setSelectedCity('Todas');
    setSelectedColonia('Todas');
    setColoniaQuery('');
    setSelectedService('Todos');
    setSuppliesOnly(false);
    setMaxRate(500);
    setSearchQuery('');
    setSortBy('recommended');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Se alcanzó la cuota de Google Maps Platform y el mapa puede fallar. Si eres
            el dueño de la app, revisa las{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              instrucciones del sitio para desarrolladores de Maps
            </a>{' '}
            para actualizar tu cuenta.
          </span>
        </div>
      )}
      <Header
        activeSection={activeSection}
        onNavigate={handleNavigate}
        user={user}
        profileFirstName={userProfile?.firstName}
        isAdmin={isAdmin}
        onSignIn={handleSignIn}
        authLoading={authLoading}
      />

      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-lg flex items-center gap-3"
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={dismissToast}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="flex-1">
        {/* Loading state while verifying user profile */}
        {!isInfoSection && user && profileLoading && (
          <div className="max-w-3xl mx-auto px-4 py-16 text-center">
            <div className="bg-white border border-slate-200 rounded-xl p-10">
              <p className="text-sm font-medium text-slate-600">
                Verificando tu perfil de LimpiaMX...
              </p>
            </div>
          </div>
        )}

        {/* Suspended account notice */}
        {!isInfoSection && isSuspendedUser && (
          <section className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="bg-white border border-red-200 rounded-xl p-8 sm:p-10 space-y-4">
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Cuenta suspendida temporalmente
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Un administrador de LimpiaMX suspendió temporalmente el acceso de{' '}
                <span className="font-mono text-slate-800">{user?.email}</span>. Si crees que es un
                error, comunícate con la administración.
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 cursor-pointer"
              >
                Cerrar sesión
              </button>
            </div>
          </section>
        )}

        {/* Automatic Onboarding Gate for New or Incomplete Users */}
        {!isInfoSection && user && needsOnboarding && (
          <Suspense fallback={<ViewLoadingFallback label="Cargando registro inicial..." />}>
            <OnboardingWizard
              user={user}
              existingProfile={userProfile}
              onCompleted={(completedRole) => {
                setActiveSection('mis-reservas');
                showToast(
                  completedRole === 'professional'
                    ? '¡Perfil completado y anuncio publicado en LimpiaMX!'
                    : '¡Perfil completado! Ya puedes contratar servicios.'
                );
              }}
              onSignOut={handleSignOut}
            />
          </Suspense>
        )}

        {/* Normal Authenticated / Public Views (gated from dashboard/profile until onboarding complete) */}
        {(isInfoSection ||
          (!needsOnboarding && !isSuspendedUser && !(user && profileLoading))) && (
          <>
            {activeSection === 'nosotros' && <AboutPage onNavigate={handleNavigate} />}
            {activeSection === 'seguridad' && <SafetyPage onNavigate={handleNavigate} />}
            {activeSection === 'faq' && <FaqPage onNavigate={handleNavigate} />}
            {activeSection === 'contacto' && <ContactPage onNavigate={handleNavigate} />}
            {activeSection === 'terminos' && <TermsPage onNavigate={handleNavigate} />}
            {activeSection === 'privacidad' && (
              <PrivacyPage onNavigate={handleNavigate} />
            )}
            {activeSection === 'planes' && (
              <PlansPage
                onNavigate={handleNavigate}
                onGoToPublish={() => handleNavigate('anunciate')}
              />
            )}

            {activeSection === 'cotizador' && (
              <QuoteCalculator
                cleaners={allCleaners}
                initialCity={selectedCity === 'Todas' ? 'CDMX' : selectedCity}
                onNavigate={handleNavigate}
                onExploreCity={handleExploreCity}
              />
            )}

            {activeSection === 'blog' &&
              (blogSlug ? (
                <BlogArticlePage
                  slug={blogSlug}
                  onNavigate={handleNavigate}
                  onOpenPost={handleOpenBlogPost}
                />
              ) : (
                <BlogIndexPage
                  onNavigate={handleNavigate}
                  onOpenPost={handleOpenBlogPost}
                />
              ))}

            {activeSection === 'notfound' && (
              <NotFoundPage onNavigate={handleNavigate} />
            )}

            {CITY_SECTION_TO_CITY[activeSection] && (
              <CityPage
                city={CITY_SECTION_TO_CITY[activeSection]}
                cleaners={allCleaners}
                rateStats={computeCityRateStats(
                  allCleaners,
                  CITY_SECTION_TO_CITY[activeSection]
                )}
                onSelectCleaner={(c) => openCleanerProfile(c.id)}
                onNavigate={handleNavigate}
                onExploreCity={handleExploreCity}
              />
            )}

            {activeSection === 'explorar' && (
              <>
                <HeroSection
                  selectedCity={selectedCity}
                  searchQuery={searchQuery}
                  totalCleaners={allCleaners.length}
                  totalReviews={allReviews.length}
                  totalCompleted={allCleaners.reduce(
                    (sum, c) => sum + c.completedCount,
                    0
                  )}
                  onSearchSubmit={handleHeroSearch}
                  onGoToPublish={() => handleNavigate('anunciate')}
                  onGoToQuote={() => handleNavigate('cotizador')}
                />

                <StatsStrip cleaners={allCleaners} reviews={allReviews} />
                <ServiceTiles onSelect={handleSelectService} />
                <LandingActivityShowcase
                  cleaners={allCleaners}
                  reviews={allReviews}
                  onSelectCleaner={(id) => openCleanerProfile(id)}
                  onSelectCity={(city) => {
                    handleExploreCity(city);
                    setTimeout(() => {
                      document
                        .getElementById('catalogo-limpieza')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }, 60);
                  }}
                  onExploreDirectory={() =>
                    document
                      .getElementById('catalogo-limpieza')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }
                />

                <section
                  id="catalogo-limpieza"
                  className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
                >
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                      <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        Personal de limpieza disponible
                      </h2>
                      <p className="text-sm sm:text-base text-slate-600 mt-1 tabular-nums">
                        {filteredCleaners.length}{' '}
                        {filteredCleaners.length === 1
                          ? 'profesional disponible'
                          : 'profesionales disponibles'}
                        {selectedColonia !== 'Todas'
                          ? ` en ${selectedColonia}`
                          : ''}
                        {selectedCity !== 'Todas'
                          ? selectedColonia !== 'Todas'
                            ? ` (${selectedCity})`
                            : ` en ${selectedCity}`
                          : selectedColonia === 'Todas'
                            ? ' en México'
                            : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div
                        className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-1"
                        role="group"
                        aria-label="Modo de visualización del catálogo"
                      >
                        <button
                          type="button"
                          onClick={() => setExploreViewMode('grid')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                            exploreViewMode === 'grid'
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span>Tarjetas</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setExploreViewMode('radar')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                            exploreViewMode === 'radar'
                              ? 'bg-teal-700 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Radar className="w-3.5 h-3.5" />
                          <span>Mapa Radar</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="sort-select"
                          className="text-xs font-medium text-slate-500"
                        >
                          Ordenar:
                        </label>
                        <select
                          id="sort-select"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as SortOption)}
                          className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 cursor-pointer"
                        >
                          <option value="recommended">Destacados</option>
                          <option value="price-asc">Menor tarifa por hora</option>
                          <option value="price-desc">Mayor tarifa por hora</option>
                          <option value="experience">
                            Más años de experiencia
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Filter Bar */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 mb-8 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedService('Todos')}
                          className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                            selectedService === 'Todos'
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                          }`}
                        >
                          Todos los servicios
                        </button>
                        {SERVICE_CATEGORIES.map((srv) => (
                          <button
                            key={srv}
                            type="button"
                            onClick={() => setSelectedService(srv)}
                            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                              selectedService === srv
                                ? 'bg-teal-700 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                            }`}
                          >
                            {srv}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
                          <label htmlFor="filter-city" className="sr-only">
                            Ciudad
                          </label>
                          <select
                            id="filter-city"
                            value={selectedCity}
                            onChange={(e) => {
                              setSelectedCity(e.target.value as CityMX | 'Todas');
                              setSelectedColonia('Todas');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 cursor-pointer"
                          >
                            <option value="Todas">Todas las ciudades</option>
                            {CITIES_MX.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
                          <label htmlFor="filter-colonia" className="sr-only">
                            Colonia
                          </label>
                          <select
                            id="filter-colonia"
                            value={selectedColonia}
                            onChange={(e) => setSelectedColonia(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 max-w-[210px] cursor-pointer"
                          >
                            <option value="Todas">
                              {selectedCity === 'Todas'
                                ? 'Todas las colonias'
                                : `Todas en ${selectedCity}`}
                            </option>
                            {availableColonias.map((colonia) => (
                              <option key={colonia} value={colonia}>
                                {colonia}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="relative flex items-center">
                          <Search
                            className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none"
                            aria-hidden="true"
                          />
                          <label htmlFor="filter-colonia-search" className="sr-only">
                            Buscar colonia
                          </label>
                          <input
                            id="filter-colonia-search"
                            type="text"
                            value={coloniaQuery}
                            onChange={(e) => setColoniaQuery(e.target.value)}
                            placeholder="Buscar colonia (ej. Roma, Polanco)..."
                            className="pl-8 pr-7 py-1.5 w-56 sm:w-64 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-700 focus:bg-white"
                          />
                          {coloniaQuery && (
                            <button
                              type="button"
                              aria-label="Limpiar búsqueda de colonia"
                              onClick={() => setColoniaQuery('')}
                              className="absolute right-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={suppliesOnly}
                            onChange={(e) => setSuppliesOnly(e.target.checked)}
                            className="w-4 h-4 rounded text-teal-700 border-slate-300"
                          />
                          <span>Con insumos incluidos</span>
                        </label>

                        <div className="flex items-center gap-2">
                          <label
                            htmlFor="max-rate"
                            className="text-xs font-medium text-slate-600 tabular-nums whitespace-nowrap"
                          >
                            Máx. ${maxRate} MXN/hr
                          </label>
                          <input
                            id="max-rate"
                            type="range"
                            min={180}
                            max={500}
                            step={20}
                            value={maxRate}
                            onChange={(e) => setMaxRate(Number(e.target.value))}
                            className="w-24 accent-teal-700 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {(selectedCity !== 'Todas' ||
                      selectedColonia !== 'Todas' ||
                      coloniaQuery.trim() !== '' ||
                      selectedService !== 'Todos' ||
                      suppliesOnly ||
                      maxRate < 500 ||
                      searchQuery.trim() !== '') && (
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          Filtros activos:{' '}
                          {[
                            selectedCity !== 'Todas' ? selectedCity : null,
                            selectedColonia !== 'Todas'
                              ? `Colonia: ${selectedColonia}`
                              : null,
                            coloniaQuery.trim()
                              ? `Colonia "${coloniaQuery.trim()}"`
                              : null,
                            selectedService !== 'Todos' ? selectedService : null,
                            suppliesOnly ? 'Con insumos' : null,
                            maxRate < 500 ? `Hasta $${maxRate}/hr` : null,
                            searchQuery.trim() ? `"${searchQuery.trim()}"` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="font-medium text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    )}
                  </div>

                  {exploreViewMode === 'radar' ? (
                    <Suspense fallback={<ViewLoadingFallback label="Cargando mapa radar..." />}>
                      <WorkerRadarMap
                        cleaners={filteredCleaners}
                        selectedCity={selectedCity}
                        onCityChange={setSelectedCity}
                        onSelectCleaner={(c) => openCleanerProfile(c.id)}
                        onSwitchToGrid={() => setExploreViewMode('grid')}
                      />
                    </Suspense>
                  ) : filteredCleaners.length === 0 ? (
                    <EmptyState
                      variant="search"
                      title="No encontramos perfiles con esos filtros"
                      body="Prueba ampliar tu tarifa máxima por hora, cambiar de ciudad o buscar en todas las colonias de tu zona. También puedes cotizar tu limpieza para ver precios de referencia."
                      action={
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="px-5 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors cursor-pointer"
                        >
                          Mostrar todos los perfiles
                        </button>
                      }
                      secondary={
                        <button
                          type="button"
                          onClick={() => handleNavigate('cotizador')}
                          className="px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Abrir cotizador
                        </button>
                      }
                    />
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-teal-50/70 border border-teal-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 text-xs sm:text-sm text-teal-950">
                          <Radar className="w-4 h-4 text-teal-700 shrink-0" />
                          <span>
                            ¿Quieres ver quién trabaja más cerca de tu colonia? Activa el mapa tipo radar con tu ubicación o dirección.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExploreViewMode('radar')}
                          className="px-3.5 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Abrir mapa radar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {filteredCleaners.map((cleaner) => (
                          <CleanerCard
                            key={cleaner.id}
                            cleaner={cleaner}
                            isFavorite={favoriteIds.includes(cleaner.id)}
                            onToggleFavorite={handleToggleFavorite}
                            onSelect={(c) => openCleanerProfile(c.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                <SafetySection onNavigate={handleNavigate} />
                <ReviewsSection
                  reviews={allReviews}
                  cleaners={allCleaners}
                  onSelectCleaner={(id) => openCleanerProfile(id)}
                />
                <PlansSection
                  onGoToPublish={() => handleNavigate('anunciate')}
                  onWaitlist={() => handleNavigate('contacto')}
                />
                <FaqSection onNavigate={handleNavigate} />
                <ProCtaBanner
                  onGoToPublish={() => handleNavigate('anunciate')}
                  onNavigate={handleNavigate}
                />
                <HowItWorksSection
                  isSignedIn={Boolean(user)}
                  onSignIn={handleSignIn}
                  onGoToProfile={() => handleNavigate('mi-perfil')}
                  onGoToExplore={() =>
                    document
                      .getElementById('catalogo-limpieza')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }
                  onGoToQuote={() => handleNavigate('cotizador')}
                  onGoToPublish={() => handleNavigate('anunciate')}
                />
              </>
            )}

            {activeSection === 'anunciate' && (
              <Suspense fallback={<ViewLoadingFallback label="Cargando editor de anuncios..." />}>
                <PublishAdView
                  user={user}
                  userProfile={userProfile}
                  editingListing={editingListing}
                  onSignIn={handleSignIn}
                  onSaved={(isEdit) => {
                    setEditingListing(null);
                    setActiveSection('mis-reservas');
                    showToast(
                      isEdit
                        ? 'Tu anuncio fue actualizado.'
                        : '¡Tu anuncio ya está publicado en LimpiaMX!'
                    );
                  }}
                  onCancelEdit={() => {
                    setEditingListing(null);
                    setActiveSection('mis-reservas');
                  }}
                />
              </Suspense>
            )}

            {activeSection === 'mis-reservas' && (
              <Suspense fallback={<ViewLoadingFallback label="Cargando tus reservas..." />}>
                <DashboardView
                  user={user}
                  userProfile={userProfile}
                  clientBookings={clientBookings}
                  receivedBookings={receivedBookings}
                  ownerListings={ownerListings}
                  favoriteCleaners={favoriteCleaners}
                  onSignIn={handleSignIn}
                  onSignOut={handleSignOut}
                  onEditListing={(listing) => {
                    setEditingListing(listing);
                    setActiveSection('anunciate');
                  }}
                  onGoToPublish={() => {
                    setEditingListing(null);
                    setActiveSection('anunciate');
                  }}
                  onGoToProfile={() => setActiveSection('mi-perfil')}
                  onGoToExplore={() => handleNavigate('explorar')}
                  onSelectCleaner={(c) => openCleanerProfile(c.id)}
                  onSelectCleanerById={(id) => openCleanerProfile(id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              </Suspense>
            )}

            {activeSection === 'mi-perfil' && (
              <>
                {!user || !userProfile ? (
                  <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
                    <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12">
                      <h2 className="font-display text-2xl font-bold text-slate-900 mb-3">
                        Mi perfil en LimpiaMX
                      </h2>
                      <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-md mx-auto">
                        Inicia sesión con Google o con tu correo electrónico y
                        contraseña para crear o editar tu perfil y verificar tu INE.
                      </p>
                      <button
                        type="button"
                        onClick={handleSignIn}
                        className="px-6 py-3 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors cursor-pointer"
                      >
                        Iniciar sesión o crear cuenta
                      </button>
                    </div>
                  </section>
                ) : (
                  <Suspense fallback={<ViewLoadingFallback label="Cargando tu perfil..." />}>
                    <ProfileView
                      user={user}
                      profile={userProfile}
                      ownerListing={ownerListings[0] ?? null}
                      clientBookings={clientBookings}
                      favoriteCleaners={favoriteCleaners}
                      userReviews={userPublishedReviews}
                      firestoreVerification={firestoreVerifications[user.uid] ?? null}
                      isAdmin={isAdmin}
                      onOpenAdminPanel={() => handleNavigate('base-datos')}
                      onSelectCleaner={(c) => openCleanerProfile(c.id)}
                      onProfileUpdated={(msg) => showToast(msg)}
                      onVerificationChanged={() => setVerificationTick((t) => t + 1)}
                    />
                  </Suspense>
                )}
              </>
            )}

            {activeSection === 'base-datos' && user && isAdmin && (
              <Suspense fallback={<ViewLoadingFallback label="Cargando panel de administración..." />}>
                <AdminPanelView
                  currentUserEmail={user.email ?? ''}
                  isSuperAdmin={
                    (user.email ?? '').trim().toLowerCase() === SUPER_ADMIN_EMAIL
                  }
                  users={adminUsers}
                  cleaners={adminCleaners}
                  bookings={adminBookings}
                  reviews={liveReviews}
                  admins={adminRecords}
                  auditLogs={adminAuditLogs}
                  onToast={showToast}
                />
              </Suspense>
            )}
          </>
        )}
      </main>

      <Footer
        onSelectCity={(city) => {
          setSelectedCity(city);
          setSelectedColonia('Todas');
          setColoniaQuery('');
          setSearchQuery('');
          handleNavigate('explorar');
          setTimeout(() => {
            document
              .getElementById('catalogo-limpieza')
              ?.scrollIntoView({ behavior: 'smooth' });
          }, 60);
        }}
        onNavigate={handleNavigate}
      />

      <CookieBanner onNavigate={handleNavigate} />

      <CleanerDetailModal
        cleaner={selectedCleaner}
        reviews={allReviews}
        user={user}
        userProfile={userProfile}
        clientBookings={clientBookings}
        onClose={closeCleanerProfile}
        onSignIn={handleSignIn}
        onNeedOnboarding={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onBookingCreated={(info) => {
          recordNotification({
            type: 'booking_created',
            bookingId: info.bookingId,
            title: 'Reserva solicitada',
            body: `${info.cleaner.displayName} · ${info.scheduledDate} ${info.scheduledTime} hrs`,
          });
          // Navega por hash (no history.back): back() reabriría el modal del perfil.
          profileOpenedByAppRef.current = false;
          window.location.hash = '/mis-reservas';
          showToast(
            'Solicitud guardada en Mis reservas. Ahí puedes activar el aviso por correo o WhatsApp.'
          );
        }}
      />

      <FloatingActions hidden={Boolean(selectedCleaner)} />

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={(method) => {
          showToast(
            method === 'email_register'
              ? '¡Cuenta creada! Completa tu registro para continuar.'
              : '¡Sesión iniciada correctamente!'
          );
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      {GOOGLE_MAPS_API_KEY ? (
        <APIProvider
          apiKey={GOOGLE_MAPS_API_KEY}
          language="es"
          region="MX"
          libraries={['places', 'marker', 'geometry']}
          onError={() => markGmpUnavailable()}
        >
          <MarketplaceContent />
        </APIProvider>
      ) : (
        <MarketplaceContent />
      )}
    </ErrorBoundary>
  );
}
