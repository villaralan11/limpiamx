export const site = {
  name: 'LimpiaMX',
  tagline: 'Personas de confianza para espacios que importan.',
  description:
    'Encuentra profesionales de limpieza en México con perfiles claros, tarifas transparentes y atención directa por WhatsApp.',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'villaralan11@gmail.com',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '525660490358',
  whatsappDisplay: process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY ?? '+52 56 6049 0358',
  provisionalContact: true,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? '',
} as const;

export const navigation = [
  { href: '/explorar', label: 'Explorar' },
  { href: '/cotizador', label: 'Cotizador' },
  { href: '/blog', label: 'Guías' },
  { href: '/planes', label: 'Para profesionales' },
] as const;

export const services = [
  { id: 'hogar', title: 'Casa y departamento', description: 'Mantenimiento semanal o quincenal para vivir más ligero.', icon: 'home' },
  { id: 'profunda', title: 'Limpieza profunda', description: 'Cocina, baños, cristales y esos rincones que esperan su momento.', icon: 'sparkles' },
  { id: 'oficina', title: 'Oficina y local', description: 'Espacios de trabajo impecables sin interrumpir tu operación.', icon: 'briefcase' },
  { id: 'airbnb', title: 'Rotación de Airbnb', description: 'Cambio de blancos y puesta a punto entre huéspedes.', icon: 'key' },
  { id: 'post-obra', title: 'Post-obra', description: 'Polvo fino, residuos y acabados después de remodelar.', icon: 'construction' },
  { id: 'planchado', title: 'Planchado y ropa', description: 'Orden, cuidado y tiempo de vuelta para tus prendas.', icon: 'shirt' },
] as const;

export const cities = [
  { slug: 'cdmx', name: 'CDMX', fullName: 'Ciudad de México', description: 'Roma, Condesa, Del Valle, Coyoacán y más.', accent: 'pink' },
  { slug: 'ecatepec', name: 'Ecatepec', fullName: 'Ecatepec de Morelos', description: 'Las Américas, San Cristóbal y Jardines de Morelos.', accent: 'amber' },
  { slug: 'guadalajara', name: 'Guadalajara', fullName: 'Guadalajara', description: 'Providencia, Americana, Chapalita y alrededores.', accent: 'blue' },
  { slug: 'monterrey', name: 'Monterrey', fullName: 'Monterrey', description: 'Cumbres, San Pedro, Contry y zona metropolitana.', accent: 'mint' },
  { slug: 'puebla', name: 'Puebla', fullName: 'Puebla', description: 'Angelópolis, La Paz, Cholula y más.', accent: 'lavender' },
  { slug: 'queretaro', name: 'Querétaro', fullName: 'Santiago de Querétaro', description: 'Juriquilla, Centro, Milenio y El Refugio.', accent: 'sand' },
  { slug: 'merida', name: 'Mérida', fullName: 'Mérida', description: 'Altabrisa, García Ginerés, Norte y Centro.', accent: 'peach' },
] as const;

export type ServiceId = (typeof services)[number]['id'];
export type CitySlug = (typeof cities)[number]['slug'];

export type Professional = {
  id: string;
  name: string;
  business: string;
  city: string;
  citySlug: CitySlug;
  zones: string[];
  services: string[];
  rate: number;
  experience: number;
  rating: number;
  reviews: number;
  completed: number;
  photo: string;
  portfolio?: string;
  headline: string;
  bio: string;
  availability: string;
  supplies: boolean;
  verified: boolean;
  featured?: boolean;
};

export const professionals: Professional[] = [
  {
    id: 'guadalupe-hernandez', name: 'Guadalupe Hernández', business: 'Limpieza Lupe', city: 'CDMX', citySlug: 'cdmx',
    zones: ['Roma Norte', 'Condesa', 'Del Valle', 'Narvarte'], services: ['Hogar', 'Profunda', 'Planchado'], rate: 240,
    experience: 7, rating: 4.9, reviews: 32, completed: 142, photo: '/images/cleaner_portrait_lupe_1795321033640.jpg', portfolio: '/images/portfolio_kitchen_mexico_1795369390945.jpg',
    headline: 'Cuidado detallado para casas que se sienten vividas', bio: 'Me enfoco en cocinas, baños, cristales y muebles de madera o mármol. Trabajo con productos biodegradables seguros para mascotas.', availability: 'Lun a sáb · 08:30 a 18:00', supplies: true, verified: true, featured: true,
  },
  {
    id: 'carlos-mendoza', name: 'Carlos Mendoza', business: 'EcoLimpieza Polanco', city: 'CDMX', citySlug: 'cdmx',
    zones: ['Polanco', 'Anzures', 'Lomas', 'Cuauhtémoc'], services: ['Oficina', 'Profunda', 'Hogar'], rate: 260,
    experience: 5, rating: 4.8, reviews: 28, completed: 131, photo: '/images/cleaner_portrait_carlos_1795321034337.jpg', portfolio: '/images/portfolio_office_mexico_1795327024079.jpg',
    headline: 'Oficinas tranquilas y hogares con productos responsables', bio: 'Atiendo despachos, consultorios y departamentos con paños diferenciados por zona y líquidos hipoalergénicos.', availability: 'Lun a vie · 07:30 a 19:00', supplies: true, verified: true, featured: true,
  },
  {
    id: 'fernanda-alcantara', name: 'Fernanda Alcántara', business: 'Coyoacán Limpio', city: 'CDMX', citySlug: 'cdmx',
    zones: ['Coyoacán', 'San Ángel', 'Pedregal', 'Del Valle'], services: ['Hogar', 'Planchado', 'Profunda'], rate: 230,
    experience: 8, rating: 4.9, reviews: 24, completed: 137, photo: '/images/portrait_fernanda_cdmx_1795369318455.jpg',
    headline: 'Mantenimiento constante para que tu casa respire', bio: 'Especialista en pisos de barro, madera natural, canceles y organización de recámaras en el sur de la ciudad.', availability: 'Lun a sáb · 09:00 a 17:30', supplies: true, verified: true, featured: true,
  },
  {
    id: 'rodrigo-salgado', name: 'Rodrigo Salgado', business: 'Poniente Pro Clean', city: 'CDMX', citySlug: 'cdmx',
    zones: ['Santa Fe', 'Interlomas', 'Juárez', 'Cuauhtémoc'], services: ['Airbnb', 'Oficina', 'Post-obra'], rate: 270,
    experience: 4, rating: 4.8, reviews: 19, completed: 124, photo: '/images/portrait_rodrigo_cdmx_1795369318676.jpg', portfolio: '/images/portfolio_airbnb_bedroom_1795369391747.jpg',
    headline: 'Puesta a punto para estancias cortas y oficinas', bio: 'Rotación rápida, ventanales panorámicos y mantenimiento de oficinas corporativas con checklist por visita.', availability: 'Lun a dom · 08:00 a 19:00', supplies: true, verified: true,
  },
  {
    id: 'paola-jimenez', name: 'Paola Jiménez', business: 'Hogar Brillante Ecatepec', city: 'Ecatepec', citySlug: 'ecatepec',
    zones: ['Las Américas', 'Jardines de Morelos', 'San Cristóbal'], services: ['Hogar', 'Profunda', 'Planchado'], rate: 185,
    experience: 6, rating: 4.9, reviews: 26, completed: 129, photo: '/images/portrait_paola_ecatepec_1795327024115.jpg',
    headline: 'Limpieza residencial con insumos propios', bio: 'Atiendo casas y departamentos con desinfección de cocina, baños y pisos. Soy puntual y cuidadosa con los objetos de cada familia.', availability: 'Lun a sáb · 08:00 a 18:00', supplies: true, verified: true,
  },
  {
    id: 'hector-ramirez', name: 'Héctor Ramírez', business: 'Pulcritud Azteca', city: 'Ecatepec', citySlug: 'ecatepec',
    zones: ['Ciudad Azteca', 'Aragón', 'Río de Luz'], services: ['Oficina', 'Profunda', 'Hogar'], rate: 195,
    experience: 5, rating: 4.8, reviews: 21, completed: 122, photo: '/images/portrait_hector_ecatepec_1795369317983.jpg',
    headline: 'Consultorios, despachos y hogares sin pendientes', bio: 'Servicio puntual cerca de Línea B y Av. Central, con especialidad en sanitización de consultorios y cocinas integrales.', availability: 'Lun a sáb · 07:30 a 18:30', supplies: true, verified: true,
  },
  {
    id: 'diego-santamaria', name: 'Diego Santamaría', business: 'Casa Clara GDL', city: 'Guadalajara', citySlug: 'guadalajara',
    zones: ['Providencia', 'Americana', 'Chapalita'], services: ['Hogar', 'Profunda', 'Airbnb'], rate: 220,
    experience: 6, rating: 4.9, reviews: 31, completed: 118, photo: '/images/portrait_diego_guadalajara_1795327023701.jpg',
    headline: 'Espacios frescos y listos para volver a disfrutarlos', bio: 'Me especializo en departamentos, casas y rotaciones de Airbnb en las zonas de mayor movimiento de Guadalajara.', availability: 'Lun a dom · 08:00 a 19:00', supplies: true, verified: true, featured: true,
  },
  {
    id: 'lucia-garcia', name: 'Lucía García', business: 'Orden & Luz', city: 'Guadalajara', citySlug: 'guadalajara',
    zones: ['Centro', 'Americana', 'Lafayette'], services: ['Hogar', 'Planchado'], rate: 205,
    experience: 9, rating: 4.9, reviews: 37, completed: 164, photo: '/images/portrait_lucia_guadalajara_1795327023747.jpg',
    headline: 'Orden amable y atención a los detalles pequeños', bio: 'Limpieza de mantenimiento, ropa y organización ligera para familias que buscan continuidad.', availability: 'Mar a sáb · 09:00 a 17:00', supplies: false, verified: true,
  },
  {
    id: 'arturo-rosales', name: 'Arturo Rosales', business: 'Norte Limpio', city: 'Monterrey', citySlug: 'monterrey',
    zones: ['Cumbres', 'San Pedro', 'Contry'], services: ['Oficina', 'Post-obra', 'Profunda'], rate: 280,
    experience: 7, rating: 4.8, reviews: 18, completed: 96, photo: '/images/portrait_arturo_monterrey_1795327023723.jpg', portfolio: '/images/portfolio_office_mexico_1795327024079.jpg',
    headline: 'Post-obra y oficinas con método de principio a fin', bio: 'Trabajo con checklist, protección de superficies y equipo propio para acabados después de remodelar.', availability: 'Lun a vie · 07:00 a 18:00', supplies: true, verified: true,
  },
  {
    id: 'brenda-morales', name: 'Brenda Morales', business: 'Brillo Norte', city: 'Monterrey', citySlug: 'monterrey',
    zones: ['San Jerónimo', 'Mitras', 'Obispado'], services: ['Hogar', 'Profunda', 'Planchado'], rate: 245,
    experience: 8, rating: 4.9, reviews: 29, completed: 151, photo: '/images/portrait_brenda_monterrey_1795369318972.jpg',
    headline: 'Una rutina de limpieza que sí se sostiene', bio: 'Me gusta trabajar con familias de forma recurrente, entendiendo cómo usan cada espacio y qué necesitan cuidar.', availability: 'Lun a sáb · 08:30 a 17:30', supplies: true, verified: true, featured: true,
  },
  {
    id: 'daniel-cervantes', name: 'Daniel Cervantes', business: 'Patio Abierto', city: 'Puebla', citySlug: 'puebla',
    zones: ['La Paz', 'Angelópolis', 'Cholula'], services: ['Hogar', 'Airbnb', 'Profunda'], rate: 210,
    experience: 5, rating: 4.8, reviews: 16, completed: 84, photo: '/images/portrait_daniel_puebla_1795369318330.jpg', portfolio: '/images/portfolio_airbnb_bedroom_1795369391747.jpg',
    headline: 'Casas, departamentos y estancias listas para recibir', bio: 'Apoyo a familias y anfitriones con limpieza detallada, blancos y revisión visual antes de entregar.', availability: 'Lun a dom · 08:00 a 18:00', supplies: true, verified: true,
  },
  {
    id: 'monica-sada', name: 'Mónica Sada', business: 'Mónica en casa', city: 'Querétaro', citySlug: 'queretaro',
    zones: ['Juriquilla', 'Milenio', 'El Refugio'], services: ['Hogar', 'Profunda', 'Planchado'], rate: 215,
    experience: 7, rating: 4.9, reviews: 22, completed: 112, photo: '/images/portrait_monica_queretaro_1795327023437.jpg',
    headline: 'Limpieza cuidadosa para casas con ritmo familiar', bio: 'Trabajo con horarios claros, insumos seguros y atención especial a cocinas, baños y ropa.', availability: 'Lun a sáb · 08:00 a 17:00', supplies: true, verified: true,
  },
  {
    id: 'karla-mendez', name: 'Karla Méndez', business: 'Casa Viva Mérida', city: 'Mérida', citySlug: 'merida',
    zones: ['Altabrisa', 'García Ginerés', 'Centro'], services: ['Hogar', 'Airbnb', 'Profunda'], rate: 225,
    experience: 8, rating: 4.9, reviews: 27, completed: 138, photo: '/images/portrait_karla_merida_1795369318509.jpg', portfolio: '/images/portfolio_merida_courtyard_1795369391799.jpg',
    headline: 'Calma, orden y frescura para casas del sureste', bio: 'Conozco los cuidados que necesitan las casas de Mérida: ventilación, patios, polvo y rotación de estancias.', availability: 'Lun a dom · 08:00 a 18:00', supplies: true, verified: true, featured: true,
  },
];

export const stats = [
  { value: '7', label: 'ciudades para empezar' },
  { value: '4.9/5', label: 'calificación promedio' },
  { value: '100%', label: 'tarifas visibles' },
] as const;

export const faqs = [
  { question: '¿Cuánto cuesta contratar?', answer: 'Cada profesional publica su tarifa por hora y su mínimo de horas. Así puedes comparar antes de enviar una solicitud; el precio final se acuerda con claridad antes de la visita.' },
  { question: '¿Cómo se paga?', answer: 'Por ahora, el pago se acuerda directamente con la persona que realiza el servicio. No pedimos anticipos desde LimpiaMX.' },
  { question: '¿Los perfiles están verificados?', answer: 'Los perfiles con insignia Verificado completaron una revisión de identidad. La insignia es una ayuda para decidir; también recomendamos leer reseñas y confirmar detalles antes de reservar.' },
  { question: '¿En qué ciudades funciona?', answer: 'Comenzamos en CDMX, Ecatepec, Guadalajara, Monterrey, Puebla, Querétaro y Mérida, con búsqueda por colonia.' },
  { question: '¿Puedo ofrecer mis servicios?', answer: 'Sí. Inicia sesión con Google, completa tu perfil, elige tus zonas y publica tu anuncio. El plan básico no tiene costo.' },
  { question: '¿Qué pasa si tengo un problema?', answer: 'Puedes reportar un perfil o escribirnos desde Contacto con la fecha, nombre del profesional y una descripción clara de lo ocurrido.' },
] as const;

export const plans = [
  { name: 'Básico', price: 'Gratis', period: 'siempre', description: 'Para empezar a recibir solicitudes.', features: ['Perfil público y zonas de servicio', 'Tarifa y servicios visibles', 'Reseñas de clientes', 'Galería de trabajo'], featured: false },
  { name: 'Destacado', price: '$149', period: 'MXN / mes', description: 'Para aparecer primero en tu ciudad.', features: ['Mayor visibilidad en resultados', 'Insignia Destacado', 'Estadísticas de perfil', 'Todo lo del plan Básico'], featured: true },
  { name: 'Equipos', price: 'A la medida', period: 'cotización', description: 'Para administradores y equipos de limpieza.', features: ['Varios profesionales bajo una marca', 'Agenda compartida', 'Panel de reservas', 'Atención directa'], featured: false },
] as const;

export function getProfessional(id: string) {
  return professionals.find((professional) => professional.id === id);
}

export function getCity(slug: string) {
  return cities.find((city) => city.slug === slug);
}

export function whatsappUrl(message: string) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
