import {
  collection,
  getDocs,
  Timestamp,
  writeBatch,
  doc,
} from 'firebase/firestore';
import { CATALOG_CLEANERS, CATALOG_REVIEWS } from '../data/catalog';
import { CityMX, PropertySize } from '../types/marketplace';
import { db } from './firebase';

interface DemoClientSeed {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: CityMX;
  state: string;
  neighborhood: string;
  postalCode: string;
  daysAgo: number;
}

const DEMO_CLIENTS: DemoClientSeed[] = [
  // CDMX (7)
  {
    uid: 'demo_cli_1',
    firstName: 'Valeria',
    lastName: 'Paredes',
    email: 'valeria.paredes.demo@limpiamx.mx',
    phone: '+52 55 4120 8801',
    city: 'CDMX',
    state: 'Ciudad de México',
    neighborhood: 'Roma Norte',
    postalCode: '06700',
    daysAgo: 158,
  },
  {
    uid: 'demo_cli_2',
    firstName: 'Diego',
    lastName: 'Santamaría',
    email: 'diego.santamaria.demo@limpiamx.mx',
    phone: '+52 55 3891 4412',
    city: 'CDMX',
    state: 'Ciudad de México',
    neighborhood: 'Polanco',
    postalCode: '11560',
    daysAgo: 132,
  },
  {
    uid: 'demo_cli_15',
    firstName: 'Paulina',
    lastName: 'Serrano',
    email: 'paulina.serrano.demo@limpiamx.mx',
    phone: '+52 55 5104 2219',
    city: 'CDMX',
    state: 'Ciudad de México',
    neighborhood: 'Coyoacán Centro',
    postalCode: '04000',
    daysAgo: 94,
  },
  {
    uid: 'demo_cli_16',
    firstName: 'Santiago',
    lastName: 'Villalobos',
    email: 'santiago.villalobos.demo@limpiamx.mx',
    phone: '+52 55 6288 3340',
    city: 'CDMX',
    state: 'Ciudad de México',
    neighborhood: 'Santa Fe',
    postalCode: '01219',
    daysAgo: 68,
  },
  {
    uid: 'demo_cli_17',
    firstName: 'Camila',
    lastName: 'Aguirre',
    email: 'camila.aguirre.demo@limpiamx.mx',
    phone: '+52 55 4890 1127',
    city: 'CDMX',
    state: 'Ciudad de México',
    neighborhood: 'Condesa',
    postalCode: '06140',
    daysAgo: 39,
  },
  {
    uid: 'demo_cli_18',
    firstName: 'Tomás',
    lastName: 'Elizalde',
    email: 'tomas.elizalde.demo@limpiamx.mx',
    phone: '+52 55 7391 0458',
    city: 'CDMX',
    state: 'Ciudad de México',
    neighborhood: 'Anzures',
    postalCode: '11590',
    daysAgo: 17,
  },
  {
    uid: 'demo_cli_19',
    firstName: 'Renata',
    lastName: 'Chávez',
    email: 'renata.chavez.demo@limpiamx.mx',
    phone: '+52 55 2948 7761',
    city: 'CDMX',
    state: 'Ciudad de México',
    neighborhood: 'Del Valle',
    postalCode: '03100',
    daysAgo: 6,
  },

  // Ecatepec (7)
  {
    uid: 'demo_cli_3',
    firstName: 'Brenda',
    lastName: 'Morales',
    email: 'brenda.morales.demo@limpiamx.mx',
    phone: '+52 55 7710 2309',
    city: 'Ecatepec',
    state: 'Estado de México',
    neighborhood: 'Las Américas',
    postalCode: '55076',
    daysAgo: 146,
  },
  {
    uid: 'demo_cli_4',
    firstName: 'Óscar',
    lastName: 'Delgado',
    email: 'oscar.delgado.demo@limpiamx.mx',
    phone: '+52 55 6201 9140',
    city: 'Ecatepec',
    state: 'Estado de México',
    neighborhood: 'Ciudad Azteca',
    postalCode: '55120',
    daysAgo: 112,
  },
  {
    uid: 'demo_cli_20',
    firstName: 'Karina',
    lastName: 'Bautista',
    email: 'karina.bautista.demo@limpiamx.mx',
    phone: '+52 55 8140 5592',
    city: 'Ecatepec',
    state: 'Estado de México',
    neighborhood: 'Jardines de Morelos',
    postalCode: '55070',
    daysAgo: 81,
  },
  {
    uid: 'demo_cli_21',
    firstName: 'Julio César',
    lastName: 'Nava',
    email: 'julio.nava.demo@limpiamx.mx',
    phone: '+52 55 3918 6024',
    city: 'Ecatepec',
    state: 'Estado de México',
    neighborhood: 'Valle de Aragón 3ra Sección',
    postalCode: '55280',
    daysAgo: 54,
  },
  {
    uid: 'demo_cli_22',
    firstName: 'Marisol',
    lastName: 'Téllez',
    email: 'marisol.tellez.demo@limpiamx.mx',
    phone: '+52 55 5810 4429',
    city: 'Ecatepec',
    state: 'Estado de México',
    neighborhood: 'Villa de las Flores',
    postalCode: '55710',
    daysAgo: 29,
  },
  {
    uid: 'demo_cli_39',
    firstName: 'Daniela',
    lastName: 'Pineda',
    email: 'daniela.pineda.demo@limpiamx.mx',
    phone: '+52 55 4490 3182',
    city: 'Ecatepec',
    state: 'Estado de México',
    neighborhood: 'San Cristóbal Centro',
    postalCode: '55000',
    daysAgo: 12,
  },
  {
    uid: 'demo_cli_40',
    firstName: 'Gustavo',
    lastName: 'Rojas',
    email: 'gustavo.rojas.demo@limpiamx.mx',
    phone: '+52 55 7019 8834',
    city: 'Ecatepec',
    state: 'Estado de México',
    neighborhood: 'Santa Clara Coatitla',
    postalCode: '55540',
    daysAgo: 3,
  },

  // Guadalajara (7)
  {
    uid: 'demo_cli_5',
    firstName: 'Alejandra',
    lastName: 'Ochoa',
    email: 'alejandra.ochoa.demo@limpiamx.mx',
    phone: '+52 33 3412 5510',
    city: 'Guadalajara',
    state: 'Jalisco',
    neighborhood: 'Americana',
    postalCode: '44160',
    daysAgo: 165,
  },
  {
    uid: 'demo_cli_6',
    firstName: 'Héctor',
    lastName: 'Navarro',
    email: 'hector.navarro.demo@limpiamx.mx',
    phone: '+52 33 1902 7731',
    city: 'Guadalajara',
    state: 'Jalisco',
    neighborhood: 'Providencia',
    postalCode: '44630',
    daysAgo: 124,
  },
  {
    uid: 'demo_cli_23',
    firstName: 'Andrés',
    lastName: 'Castellanos',
    email: 'andres.castellanos.demo@limpiamx.mx',
    phone: '+52 33 3611 9042',
    city: 'Guadalajara',
    state: 'Jalisco',
    neighborhood: 'Chapalita',
    postalCode: '44500',
    daysAgo: 88,
  },
  {
    uid: 'demo_cli_24',
    firstName: 'Daniela',
    lastName: 'Orozco',
    email: 'daniela.orozco.demo@limpiamx.mx',
    phone: '+52 33 3845 1290',
    city: 'Guadalajara',
    state: 'Jalisco',
    neighborhood: 'Puerta de Hierro',
    postalCode: '45116',
    daysAgo: 61,
  },
  {
    uid: 'demo_cli_25',
    firstName: 'Esteban',
    lastName: 'Saldaña',
    email: 'esteban.saldana.demo@limpiamx.mx',
    phone: '+52 33 1420 6733',
    city: 'Guadalajara',
    state: 'Jalisco',
    neighborhood: 'Lafayette',
    postalCode: '44150',
    daysAgo: 35,
  },
  {
    uid: 'demo_cli_41',
    firstName: 'Sofía',
    lastName: 'Partida',
    email: 'sofia.partida.demo@limpiamx.mx',
    phone: '+52 33 2019 4815',
    city: 'Guadalajara',
    state: 'Jalisco',
    neighborhood: 'Andares',
    postalCode: '45116',
    daysAgo: 15,
  },
  {
    uid: 'demo_cli_42',
    firstName: 'Mariana',
    lastName: 'Villasenor',
    email: 'mariana.villasenor.demo@limpiamx.mx',
    phone: '+52 33 1765 9204',
    city: 'Guadalajara',
    state: 'Jalisco',
    neighborhood: 'Zapopan Centro',
    postalCode: '45100',
    daysAgo: 4,
  },

  // Monterrey (7)
  {
    uid: 'demo_cli_7',
    firstName: 'Lucía',
    lastName: 'Garza',
    email: 'lucia.garza.demo@limpiamx.mx',
    phone: '+52 81 8340 1122',
    city: 'Monterrey',
    state: 'Nuevo León',
    neighborhood: 'San Pedro Garza García',
    postalCode: '66220',
    daysAgo: 152,
  },
  {
    uid: 'demo_cli_8',
    firstName: 'Ernesto',
    lastName: 'Cavazos',
    email: 'ernesto.cavazos.demo@limpiamx.mx',
    phone: '+52 81 2049 6618',
    city: 'Monterrey',
    state: 'Nuevo León',
    neighborhood: 'Contry',
    postalCode: '64860',
    daysAgo: 118,
  },
  {
    uid: 'demo_cli_26',
    firstName: 'Mónica',
    lastName: 'Sada',
    email: 'monica.sada.demo@limpiamx.mx',
    phone: '+52 81 8401 3392',
    city: 'Monterrey',
    state: 'Nuevo León',
    neighborhood: 'Contry',
    postalCode: '64860',
    daysAgo: 76,
  },
  {
    uid: 'demo_cli_27',
    firstName: 'Luis Fernando',
    lastName: 'Cantú',
    email: 'luis.cantu.demo@limpiamx.mx',
    phone: '+52 81 1938 7740',
    city: 'Monterrey',
    state: 'Nuevo León',
    neighborhood: 'Obispado',
    postalCode: '64060',
    daysAgo: 48,
  },
  {
    uid: 'demo_cli_28',
    firstName: 'Giselle',
    lastName: 'Montemayor',
    email: 'giselle.montemayor.demo@limpiamx.mx',
    phone: '+52 81 2310 5584',
    city: 'Monterrey',
    state: 'Nuevo León',
    neighborhood: 'Cumbres',
    postalCode: '64610',
    daysAgo: 23,
  },
  {
    uid: 'demo_cli_43',
    firstName: 'Mauricio',
    lastName: 'Zambrano',
    email: 'mauricio.zambrano.demo@limpiamx.mx',
    phone: '+52 81 1590 2231',
    city: 'Monterrey',
    state: 'Nuevo León',
    neighborhood: 'Valle Oriente',
    postalCode: '66269',
    daysAgo: 9,
  },
  {
    uid: 'demo_cli_44',
    firstName: 'Adriana',
    lastName: 'Tamez',
    email: 'adriana.tamez.demo@limpiamx.mx',
    phone: '+52 81 8041 9912',
    city: 'Monterrey',
    state: 'Nuevo León',
    neighborhood: 'San Jerónimo',
    postalCode: '64640',
    daysAgo: 2,
  },

  // Puebla (7)
  {
    uid: 'demo_cli_9',
    firstName: 'Patricia',
    lastName: 'Lozano',
    email: 'patricia.lozano.demo@limpiamx.mx',
    phone: '+52 22 2481 3020',
    city: 'Puebla',
    state: 'Puebla',
    neighborhood: 'Angelópolis',
    postalCode: '72190',
    daysAgo: 141,
  },
  {
    uid: 'demo_cli_10',
    firstName: 'Gabriel',
    lastName: 'Ortega',
    email: 'gabriel.ortega.demo@limpiamx.mx',
    phone: '+52 22 2190 4577',
    city: 'Puebla',
    state: 'Puebla',
    neighborhood: 'La Paz',
    postalCode: '72160',
    daysAgo: 103,
  },
  {
    uid: 'demo_cli_29',
    firstName: 'Sebastián',
    lastName: 'Quiroz',
    email: 'sebastian.quiroz.demo@limpiamx.mx',
    phone: '+52 22 2308 1195',
    city: 'Puebla',
    state: 'Puebla',
    neighborhood: 'Lomas de Angelópolis',
    postalCode: '72830',
    daysAgo: 71,
  },
  {
    uid: 'demo_cli_30',
    firstName: 'Regina',
    lastName: 'Morales',
    email: 'regina.morales.demo@limpiamx.mx',
    phone: '+52 22 2691 4408',
    city: 'Puebla',
    state: 'Puebla',
    neighborhood: 'Las Ánimas',
    postalCode: '72400',
    daysAgo: 44,
  },
  {
    uid: 'demo_cli_31',
    firstName: 'Armando',
    lastName: 'Trueba',
    email: 'armando.trueba.demo@limpiamx.mx',
    phone: '+52 22 2514 8230',
    city: 'Puebla',
    state: 'Puebla',
    neighborhood: 'Centro Histórico Puebla',
    postalCode: '72000',
    daysAgo: 21,
  },
  {
    uid: 'demo_cli_45',
    firstName: 'Lorena',
    lastName: 'Cuéllar',
    email: 'lorena.cuellar.demo@limpiamx.mx',
    phone: '+52 22 2410 7391',
    city: 'Puebla',
    state: 'Puebla',
    neighborhood: 'Zavaleta',
    postalCode: '72150',
    daysAgo: 8,
  },
  {
    uid: 'demo_cli_46',
    firstName: 'Raúl',
    lastName: 'Méndez',
    email: 'raul.mendez.demo@limpiamx.mx',
    phone: '+52 22 2873 5502',
    city: 'Puebla',
    state: 'Puebla',
    neighborhood: 'San Andrés Cholula',
    postalCode: '72810',
    daysAgo: 1,
  },

  // Querétaro (7)
  {
    uid: 'demo_cli_11',
    firstName: 'Ximena',
    lastName: 'Rangel',
    email: 'ximena.rangel.demo@limpiamx.mx',
    phone: '+52 44 2380 9912',
    city: 'Querétaro',
    state: 'Querétaro',
    neighborhood: 'Juriquilla',
    postalCode: '76230',
    daysAgo: 150,
  },
  {
    uid: 'demo_cli_12',
    firstName: 'Fernando',
    lastName: 'Ibarra',
    email: 'fernando.ibarra.demo@limpiamx.mx',
    phone: '+52 44 2177 6543',
    city: 'Querétaro',
    state: 'Querétaro',
    neighborhood: 'Zibatá',
    postalCode: '76269',
    daysAgo: 109,
  },
  {
    uid: 'demo_cli_32',
    firstName: 'Fabiola',
    lastName: 'Montes',
    email: 'fabiola.montes.demo@limpiamx.mx',
    phone: '+52 44 2491 3022',
    city: 'Querétaro',
    state: 'Querétaro',
    neighborhood: 'Zibatá',
    postalCode: '76269',
    daysAgo: 64,
  },
  {
    uid: 'demo_cli_33',
    firstName: 'Claudia',
    lastName: 'Alcocer',
    email: 'claudia.alcocer.demo@limpiamx.mx',
    phone: '+52 44 2180 7741',
    city: 'Querétaro',
    state: 'Querétaro',
    neighborhood: 'Carretas',
    postalCode: '76050',
    daysAgo: 32,
  },
  {
    uid: 'demo_cli_34',
    firstName: 'Ricardo',
    lastName: 'Urquiza',
    email: 'ricardo.urquiza.demo@limpiamx.mx',
    phone: '+52 44 2512 9084',
    city: 'Querétaro',
    state: 'Querétaro',
    neighborhood: 'Milenio III',
    postalCode: '76060',
    daysAgo: 14,
  },
  {
    uid: 'demo_cli_38',
    firstName: 'Nicolás',
    lastName: 'Ibarra',
    email: 'nicolas.ibarra.demo@limpiamx.mx',
    phone: '+52 55 5912 4401',
    city: 'CDMX',
    state: 'Ciudad de México',
    neighborhood: 'Juárez',
    postalCode: '06600',
    daysAgo: 25,
  },
  {
    uid: 'demo_cli_47',
    firstName: 'Beatriz',
    lastName: 'Loyola',
    email: 'beatriz.loyola.demo@limpiamx.mx',
    phone: '+52 44 2289 1450',
    city: 'Querétaro',
    state: 'Querétaro',
    neighborhood: 'Álamos',
    postalCode: '76160',
    daysAgo: 5,
  },

  // Mérida (7)
  {
    uid: 'demo_cli_13',
    firstName: 'Mauricio',
    lastName: 'Cámara',
    email: 'mauricio.camara.demo@limpiamx.mx',
    phone: '+52 99 9240 1188',
    city: 'Mérida',
    state: 'Yucatán',
    neighborhood: 'Montejo / Paseo de Montejo',
    postalCode: '97000',
    daysAgo: 162,
  },
  {
    uid: 'demo_cli_14',
    firstName: 'Sofía',
    lastName: 'Peón',
    email: 'sofia.peon.demo@limpiamx.mx',
    phone: '+52 99 9415 3390',
    city: 'Mérida',
    state: 'Yucatán',
    neighborhood: 'Temozón Norte',
    postalCode: '97302',
    daysAgo: 115,
  },
  {
    uid: 'demo_cli_35',
    firstName: 'Jimena',
    lastName: 'Cetina',
    email: 'jimena.cetina.demo@limpiamx.mx',
    phone: '+52 99 9188 4502',
    city: 'Mérida',
    state: 'Yucatán',
    neighborhood: 'Altabrisa',
    postalCode: '97130',
    daysAgo: 84,
  },
  {
    uid: 'demo_cli_36',
    firstName: 'Emilio',
    lastName: 'Sosa',
    email: 'emilio.sosa.demo@limpiamx.mx',
    phone: '+52 99 9310 7265',
    city: 'Mérida',
    state: 'Yucatán',
    neighborhood: 'Francisco de Montejo',
    postalCode: '97203',
    daysAgo: 51,
  },
  {
    uid: 'demo_cli_37',
    firstName: 'Ariadna',
    lastName: 'Bolio',
    email: 'ariadna.bolio.demo@limpiamx.mx',
    phone: '+52 99 9502 1844',
    city: 'Mérida',
    state: 'Yucatán',
    neighborhood: 'Itzimná',
    postalCode: '97100',
    daysAgo: 27,
  },
  {
    uid: 'demo_cli_48',
    firstName: 'Rodrigo',
    lastName: 'Ancona',
    email: 'rodrigo.ancona.demo@limpiamx.mx',
    phone: '+52 99 9277 6019',
    city: 'Mérida',
    state: 'Yucatán',
    neighborhood: 'Montebello',
    postalCode: '97113',
    daysAgo: 10,
  },
  {
    uid: 'demo_cli_49',
    firstName: 'Mariana',
    lastName: 'Gamboa',
    email: 'mariana.gamboa.demo@limpiamx.mx',
    phone: '+52 99 9411 8832',
    city: 'Mérida',
    state: 'Yucatán',
    neighborhood: 'García Ginerés',
    postalCode: '97070',
    daysAgo: 2,
  },
];

const CITY_POSTAL_DEFAULT: Record<CityMX, string> = {
  CDMX: '06700',
  Ecatepec: '55076',
  Guadalajara: '44630',
  Monterrey: '66220',
  Puebla: '72190',
  Querétaro: '76230',
  Mérida: '97000',
};

const CITY_PHONE_LADA: Record<CityMX, string> = {
  CDMX: '55',
  Ecatepec: '55',
  Guadalajara: '33',
  Monterrey: '81',
  Puebla: '22',
  Querétaro: '44',
  Mérida: '99',
};

function makePastDate(daysAgo: number, hour = 11): Date {
  const now = Date.now();
  const d = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
  d.setHours(hour, 15, 0, 0);
  // Guarantee createdAt/updatedAt are strictly <= server request.time despite client clock drift
  const safeMax = now - 5 * 60 * 1000;
  if (d.getTime() > safeMax) {
    return new Date(safeMax - Math.floor(Math.random() * 60000));
  }
  return d;
}

function toYyyyMmDd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: parts[0] || 'Usuario', lastName: 'Demo' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

// Schedule pattern across the last 6 months + last 30 days so both monthly charts and 30-day trend charts show realistic demand
const COMPLETED_BOOKING_DAYS_AGO = [
  174, 169, 164, 159, 154, 151, 147, 143, 139, 135, 132, 128, 124, 121, 118,
  115, 111, 108, 104, 101, 97, 94, 91, 88, 84, 81, 78, 75, 72, 69, 66, 63, 60,
  57, 54, 51, 49, 46, 44, 41, 39, 37, 35, 33, 31, 29, 28, 27, 26, 25, 25, 24,
  23, 22, 21, 21, 20, 19, 18, 17, 17, 16, 15, 14, 14, 13, 12, 12, 11, 10, 10,
  9, 9, 8, 7, 7, 7, 6, 6, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0,
];

export interface SeedResult {
  usersAdded: number;
  cleanersAdded: number;
  bookingsAdded: number;
  reviewsAdded: number;
  photosRefreshed: number;
}

export async function seedDemoMarketplaceToFirestore(): Promise<SeedResult> {
  const [usersSnap, cleanersSnap, bookingsSnap, reviewsSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'cleaners')),
    getDocs(collection(db, 'bookings')),
    getDocs(collection(db, 'reviews')),
  ]);

  const existingUserDocs = new Map(usersSnap.docs.map((d) => [d.id, d.data()]));
  const existingCleanerDocs = new Map(cleanersSnap.docs.map((d) => [d.id, d.data()]));
  const existingBookingIds = new Set(bookingsSnap.docs.map((d) => d.id));
  const existingReviewIds = new Set(reviewsSnap.docs.map((d) => d.id));

  let usersAdded = 0;
  let cleanersAdded = 0;
  let bookingsAdded = 0;
  let reviewsAdded = 0;
  let photosRefreshed = 0;

  const deleteRefs: Array<[string, string]> = [];
  const operations: Array<{
    refPath: [string, string];
    data: Record<string, unknown>;
    kind: 'user' | 'cleaner' | 'booking' | 'review' | 'refresh';
  }> = [];

  // 1. Seed 28 professional users & 28 cleaner listings across 7 cities spread over the last 6 months
  CATALOG_CLEANERS.forEach((cl, idx) => {
    const proUid = `demo_pro_${cl.id}`;
    const daysAgo = (idx * 6 + 3) % 175;
    const createdDate = makePastDate(daysAgo, 10 + (idx % 6));
    const createdTs = Timestamp.fromDate(createdDate);
    const { firstName, lastName } = splitName(cl.displayName);
    const emailSlug = cl.id.replace(/^cat_/, '').replace(/_/g, '.');
    const lada = CITY_PHONE_LADA[cl.city as CityMX] ?? '55';
    const phoneSuffix = String(4100 + idx * 73).padStart(4, '0');

    const existingUser = existingUserDocs.get(proUid);
    const userNeedsPhotoRefresh = Boolean(
      existingUser && existingUser.photoURL !== cl.photoUrl
    );

    if (!existingUser || userNeedsPhotoRefresh) {
      if (userNeedsPhotoRefresh) {
        deleteRefs.push(['users', proUid]);
      }
      const preservedCreatedAt =
        existingUser?.createdAt instanceof Timestamp
          ? existingUser.createdAt
          : createdTs;
      operations.push({
        kind: userNeedsPhotoRefresh ? 'refresh' : 'user',
        refPath: ['users', proUid],
        data: {
          uid: proUid,
          email: `${emailSlug}.pro@limpiamx.mx`,
          displayName: cl.displayName,
          firstName,
          lastName,
          photoURL: cl.photoUrl,
          phone: `+52 ${lada} 5${String(10 + idx).padStart(2, '0')} ${phoneSuffix}`,
          role: 'professional',
          country: 'México',
          state: cl.state,
          city: cl.city,
          neighborhood: cl.colonias[0] || 'Centro',
          postalCode: CITY_POSTAL_DEFAULT[cl.city as CityMX] ?? '06700',
          description: cl.bio.slice(0, 580),
          contactPreference: idx % 3 === 0 ? 'Llamada' : 'WhatsApp',
          profileCompleted: true,
          googleLinked: true,
          suspended: Boolean(existingUser?.suspended),
          createdAt: preservedCreatedAt,
          updatedAt: preservedCreatedAt,
        },
      });
    }

    const existingCleaner = existingCleanerDocs.get(cl.id);
    const existingPortfolio = Array.isArray(existingCleaner?.portfolioUrls)
      ? existingCleaner.portfolioUrls
      : [];
    const cleanerNeedsPhotoRefresh = Boolean(
      existingCleaner &&
        (existingCleaner.photoUrl !== cl.photoUrl ||
          JSON.stringify(existingPortfolio) !== JSON.stringify(cl.portfolioUrls))
    );

    if (!existingCleaner || cleanerNeedsPhotoRefresh) {
      if (cleanerNeedsPhotoRefresh) {
        deleteRefs.push(['cleaners', cl.id]);
      }
      const preservedCreatedAt =
        existingCleaner?.createdAt instanceof Timestamp
          ? existingCleaner.createdAt
          : createdTs;
      const preservedStatus =
        existingCleaner?.status === 'paused' ? 'paused' : 'active';
      operations.push({
        kind: cleanerNeedsPhotoRefresh ? 'refresh' : 'cleaner',
        refPath: ['cleaners', cl.id],
        data: {
          ownerId: proUid,
          displayName: cl.displayName,
          businessName: cl.businessName,
          headline: cl.headline,
          bio: cl.bio,
          state: cl.state,
          city: cl.city,
          colonias: cl.colonias,
          services: cl.services,
          hourlyRateMxn: cl.hourlyRateMxn,
          fixedServiceRateMxn: cl.fixedServiceRateMxn,
          minHours: cl.minHours,
          yearsExperience: cl.yearsExperience,
          includesSupplies: cl.includesSupplies,
          availability: cl.availability,
          photoUrl: cl.photoUrl,
          portfolioUrls: cl.portfolioUrls,
          status: preservedStatus,
          profileCompleted: true,
          ratingAvg: cl.ratingAvg,
          reviewsCount: cl.reviewsCount,
          completedCount: cl.completedCount,
          createdAt: preservedCreatedAt,
          updatedAt: preservedCreatedAt,
        },
      });
    }
  });

  // 2. Seed 49 client users across all 7 cities over the last 6 months
  for (const cli of DEMO_CLIENTS) {
    if (!existingUserDocs.has(cli.uid)) {
      const createdTs = Timestamp.fromDate(makePastDate(cli.daysAgo, 14));
      operations.push({
        kind: 'user',
        refPath: ['users', cli.uid],
        data: {
          uid: cli.uid,
          email: cli.email,
          displayName: `${cli.firstName} ${cli.lastName}`,
          firstName: cli.firstName,
          lastName: cli.lastName,
          photoURL: '',
          phone: cli.phone,
          role: 'client',
          country: 'México',
          state: cli.state,
          city: cli.city,
          neighborhood: cli.neighborhood,
          postalCode: cli.postalCode,
          description: `Cliente verificado en ${cli.neighborhood}, ${cli.city}.`,
          contactPreference: 'WhatsApp',
          profileCompleted: true,
          googleLinked: true,
          suspended: false,
          createdAt: createdTs,
          updatedAt: createdTs,
        },
      });
    }
  }

  // 3. Seed 120 realistic bookings across the last 6 months (96 completed, 14 confirmed, 6 pending, 4 cancelled)
  const propertySizes: PropertySize[] = [
    'Departamento (1-2 rec.)',
    'Casa (3+ rec.)',
    'Oficina / Local',
  ];
  const noteTemplates = [
    'Enfoque especial en cocina, canceles de baño y desinfección de pisos.',
    'Departamento ocupado con mascota amigable, por favor traer productos biodegradables.',
    'Limpieza general semanal con cambio de sábanas y organización de sala.',
    'Servicio programado antes de ingreso de huéspedes; llaves con vigilancia.',
    'Atención en áreas de trabajo, recepción, sanitarios y ventanales.',
  ];

  const totalBookings = 120;
  for (let i = 0; i < totalBookings; i += 1) {
    const bookingId = `demo_bk_${String(i + 1).padStart(2, '0')}`;
    if (existingBookingIds.has(bookingId)) continue;

    const linkedReview = CATALOG_REVIEWS[i];
    const cleaner = linkedReview
      ? CATALOG_CLEANERS.find((c) => c.id === linkedReview.cleanerId) ??
        CATALOG_CLEANERS[i % CATALOG_CLEANERS.length]
      : CATALOG_CLEANERS[i % CATALOG_CLEANERS.length];

    const matchingCityClients = DEMO_CLIENTS.filter((c) => c.city === cleaner.city);
    const client =
      (linkedReview
        ? DEMO_CLIENTS.find((c) => c.uid === linkedReview.authorId)
        : null) ??
      matchingCityClients[i % Math.max(1, matchingCityClients.length)] ??
      DEMO_CLIENTS[i % DEMO_CLIENTS.length];

    const completedCount = COMPLETED_BOOKING_DAYS_AGO.length; // 96
    const status =
      i < completedCount
        ? 'completed'
        : i < completedCount + 14
          ? 'confirmed'
          : i < completedCount + 20
            ? 'pending'
            : 'cancelled';

    const daysAgo =
      i < completedCount
        ? COMPLETED_BOOKING_DAYS_AGO[i]
        : (i - completedCount) % 7;
    const completedDate = makePastDate(daysAgo, 10 + (i % 7));
    const createdDate = makePastDate(Math.min(176, daysAgo + 2), 9);
    const durationHours = Math.max(cleaner.minHours, 3 + (i % 3));
    const totalMxn = durationHours * cleaner.hourlyRateMxn;
    const serviceType =
      linkedReview?.serviceType ?? cleaner.services[i % cleaner.services.length] ?? 'Hogar';
    const colonia = cleaner.colonias[i % cleaner.colonias.length] ?? 'Centro';

    operations.push({
      kind: 'booking',
      refPath: ['bookings', bookingId],
      data: {
        clientId: client.uid,
        clientName: linkedReview?.authorName ?? `${client.firstName} ${client.lastName}`,
        clientPhone: client.phone,
        cleanerId: cleaner.id,
        cleanerName: cleaner.displayName,
        cleanerOwnerId: `demo_pro_${cleaner.id}`,
        listingSource: 'community',
        city: cleaner.city,
        coloniaAddress: `Col. ${colonia}, ${cleaner.city}`,
        serviceType,
        propertySize: propertySizes[i % propertySizes.length],
        scheduledDate: toYyyyMmDd(completedDate),
        scheduledTime: `${String(8 + (i % 6)).padStart(2, '0')}:00`,
        durationHours,
        hourlyRateMxn: cleaner.hourlyRateMxn,
        totalMxn,
        notes: `${noteTemplates[i % noteTemplates.length]} (${colonia}, ${cleaner.city}).`,
        status,
        createdAt: Timestamp.fromDate(createdDate),
        updatedAt: Timestamp.fromDate(completedDate),
      },
    });
  }

  // 4. Seed 42 verified catalog reviews
  CATALOG_REVIEWS.forEach((rv, idx) => {
    if (existingReviewIds.has(rv.id)) return;
    const daysAgo = Math.min(72, idx * 2 + 1);
    operations.push({
      kind: 'review',
      refPath: ['reviews', rv.id],
      data: {
        cleanerId: rv.cleanerId,
        bookingId: rv.bookingId,
        authorId: rv.authorId,
        authorName: rv.authorName,
        rating: rv.rating,
        serviceType: rv.serviceType,
        comment: rv.comment,
        createdAt: Timestamp.fromDate(makePastDate(daysAgo, 16)),
      },
    });
  });

  // First delete stale demo docs that need unique photo updates
  const CHUNK_SIZE = 400;
  for (let i = 0; i < deleteRefs.length; i += CHUNK_SIZE) {
    const chunk = deleteRefs.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const [col, id] of chunk) {
      batch.delete(doc(db, col, id));
    }
    await batch.commit();
  }

  // Execute creates in chunks of 400 writes per batch (Firestore limit is 500)
  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const chunk = operations.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const op of chunk) {
      batch.set(doc(db, op.refPath[0], op.refPath[1]), op.data);
    }
    await batch.commit();
    for (const op of chunk) {
      if (op.kind === 'user') usersAdded += 1;
      else if (op.kind === 'cleaner') cleanersAdded += 1;
      else if (op.kind === 'booking') bookingsAdded += 1;
      else if (op.kind === 'review') reviewsAdded += 1;
      else if (op.kind === 'refresh') photosRefreshed += 1;
    }
  }

  return {
    usersAdded,
    cleanersAdded,
    bookingsAdded,
    reviewsAdded,
    photosRefreshed,
  };
}
