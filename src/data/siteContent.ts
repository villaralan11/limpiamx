// Contenido editorial del sitio. Edita aquí textos, planes y datos de contacto.
import { ServiceCategory } from '../types/marketplace';

export const SITE = {
  name: 'LimpiaMX',
  contactEmail: 'villaralan11@gmail.com',
  // Número de WhatsApp de atención en formato internacional sin "+" (52 + 10 dígitos).
  whatsappNumber: '525660490358',
  whatsappDisplay: '+52 56 6049 0358',
  whatsappNote:
    'Atención directa por WhatsApp: +52 56 6049 0358 (respuesta de lunes a sábado).',
  emergencyNumber: '911',
  legalUpdated: '22 de noviembre de 2026',
  schoolNotice:
    'Plataforma de contratación directa en México. Las tarifas en MXN se acuerdan con total transparencia antes de cada visita.',
} as const;

export const SERVICE_INFO: Record<ServiceCategory, { title: string; text: string }> = {
  Hogar: {
    title: 'Limpieza de hogar',
    text: 'Mantenimiento semanal o quincenal de casas y departamentos.',
  },
  Profunda: {
    title: 'Limpieza profunda',
    text: 'Rincones, azulejos, electrodomésticos y áreas que no se tocan a diario.',
  },
  Oficina: {
    title: 'Oficinas y locales',
    text: 'Escritorios, sanitarios y áreas comunes, en horarios que no estorban.',
  },
  Airbnb: {
    title: 'Rotación de Airbnb',
    text: 'Limpieza y cambio de ropa de cama entre huéspedes.',
  },
  'Post-obra': {
    title: 'Limpieza post-obra',
    text: 'Polvo fino, residuos y pintura después de remodelar.',
  },
  Planchado: {
    title: 'Planchado y ropa',
    text: 'Planchado y acomodo de ropa a domicilio.',
  },
};

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: '¿Cuánto cuesta usar LimpiaMX?',
    a: 'Crear tu cuenta, publicar un anuncio y enviar solicitudes no tiene costo por ahora. El único pago es el que acuerdas con la persona que contratas, a la tarifa por hora que ella publicó.',
  },
  {
    q: '¿Cómo se paga el servicio?',
    a: 'Se paga directamente a quien realizó la limpieza, al terminar la jornada, por transferencia o en efectivo. LimpiaMX no te pide anticipos.',
  },
  {
    q: '¿Cómo funciona una reserva?',
    a: 'Eliges un perfil, indicas fecha, horario y tamaño del lugar, y envías la solicitud. Queda como pendiente hasta que el profesional la confirma. Después la marcan como completada. Puedes seguir cada paso en Mis reservas.',
  },
  {
    q: '¿Quién puede dejar reseñas?',
    a: 'Solo quien tiene una reserva confirmada o completada con ese profesional. Así las opiniones vienen de contrataciones reales.',
  },
  {
    q: '¿LimpiaMX verifica la identidad de los profesionales?',
    a: 'Sí. Los profesionales suben su INE por ambos lados desde Mi perfil y, al aprobarse la revisión, muestran la insignia "Verificado" en su tarjeta y su página pública. Los perfiles sin insignia siguen siendo válidos, pero te recomendamos preferir los verificados en tu primera contratación.',
  },
  {
    q: '¿Qué es el código de la puerta?',
    a: 'Al confirmar tu reserva, LimpiaMX genera un código de 6 dígitos que ves en Mis reservas. Compártelo con el profesional solo cuando llegue a tu puerta: le confirma que la visita corresponde a su reserva. En producción, el profesional también debe darte su código para verificar su identidad.',
  },
  {
    q: '¿Cómo funcionan los pagos dentro de la app?',
    a: 'El pago protegido (Reserva Protegida) se paga con Stripe, Conekta o Mercado Pago desde Mis reservas. La plataforma retiene el dinero y lo libera al profesional cuando marcas el servicio como completado. La comisión del 8% incluye la garantía de reposición por daños de hasta $2,500 MXN.',
  },
  {
    q: '¿Qué pasa si cancelo una reserva?',
    a: 'Más de 24 horas antes, la cancelación es gratuita. Con menos de 24 horas aplica un cargo del 50% de las horas acordadas. Si el profesional no llega en 30 minutos de tolerancia, puedes cancelar sin costo y reprogramar con prioridad.',
  },
  {
    q: '¿Cómo anuncio mis servicios?',
    a: 'Inicia sesión con Google, completa tu perfil y entra a Anúnciate. Eliges tus colonias, servicios, tarifa por hora y, si quieres, subes fotos de tu trabajo. Publicar es gratis.',
  },
  {
    q: '¿En qué ciudades funciona?',
    a: 'CDMX, Ecatepec, Guadalajara, Monterrey, Puebla, Querétaro y Mérida. Puedes buscar por colonia dentro de cada ciudad.',
  },
  {
    q: '¿Sirve para oficinas, locales y Airbnb?',
    a: 'Sí. Hay filtros para Oficina, Airbnb, Post-obra y Planchado, además de limpieza de hogar y limpieza profunda.',
  },
  {
    q: '¿Qué hago si tuve un problema con un servicio?',
    a: 'Escríbenos desde la página de Contacto con la fecha, el nombre del perfil y lo que pasó. Revisamos el caso y, si corresponde, suspendemos la cuenta.',
  },
  {
    q: '¿Cómo elimino mi cuenta o mis datos?',
    a: 'Escríbenos desde Contacto y pide acceso, corrección o eliminación de tus datos. Los pasos están en el Aviso de privacidad.',
  },
];

export interface PlanInfo {
  id: string;
  name: string;
  price: string;
  period: string;
  audience: string;
  features: string[];
  cta: 'publish' | 'waitlist';
  highlight?: boolean;
}

export const PLANS: PlanInfo[] = [
  {
    id: 'basico',
    name: 'Básico',
    price: 'Gratis',
    period: 'siempre',
    audience: 'Para quien ofrece limpieza por su cuenta',
    features: [
      'Perfil y anuncio con tus colonias y tarifa',
      'Recibir solicitudes de reserva',
      'Reseñas de clientes reales',
      'Galería de tu trabajo',
    ],
    cta: 'publish',
  },
  {
    id: 'destacado',
    name: 'Destacado',
    price: '$149',
    period: 'MXN al mes',
    audience: 'Para llegar a más clientes',
    features: [
      'Apareces primero en los resultados de tu ciudad',
      'Insignia Destacado en tu tarjeta',
      'Estadísticas de visitas a tu perfil',
      'Todo lo del plan Básico',
    ],
    cta: 'waitlist',
    highlight: true,
  },
  {
    id: 'empresas',
    name: 'Empresas',
    price: 'A la medida',
    period: 'cotización',
    audience: 'Para equipos de limpieza y administradores',
    features: [
      'Varios profesionales bajo una misma marca',
      'Panel de agenda y reservas del equipo',
      'Factura mensual',
      'Atención directa del equipo LimpiaMX',
    ],
    cta: 'waitlist',
  },
];

export const REVENUE_IDEAS: { title: string; text: string }[] = [
  {
    title: 'Planes para profesionales',
    text: 'Suscripción mensual por aparecer primero y recibir estadísticas.',
  },
  {
    title: 'Reserva protegida',
    text: 'Comisión opcional de 8% a 10% por pagar dentro de la app con garantía de reposición.',
  },
  {
    title: 'Limpieza recurrente',
    text: 'Suscripciones semanales o quincenales con descuento para el cliente.',
  },
  {
    title: 'Anuncios de marcas',
    text: 'Espacios patrocinados de productos de limpieza para quienes ya compran insumos.',
  },
];

export const SAFETY_NOW: { title: string; text: string }[] = [
  {
    title: 'Cuentas con Google',
    text: 'Para reservar, reseñar o publicar necesitas iniciar sesión. No hay cuentas anónimas.',
  },
  {
    title: 'Verificación de identidad con INE',
    text: 'Los profesionales suben su identificación oficial y muestran la insignia "Verificado" al aprobarse la revisión.',
  },
  {
    title: 'Código de seguridad en la puerta',
    text: 'Cada reserva genera un código de 6 dígitos que confirma en la puerta que la visita corresponde a tu reserva.',
  },
  {
    title: 'Reseñas ligadas a una reserva',
    text: 'Solo quien contrató a un profesional puede opinar sobre su trabajo.',
  },
  {
    title: 'Moderación y reportes',
    text: 'Cualquier perfil o reseña se puede reportar desde su tarjeta, y cada acción de administración queda registrada.',
  },
  {
    title: 'Botón de emergencia',
    text: 'Si algo se siente mal durante un servicio, el botón de emergencia te da acceso inmediato al 911 y al equipo de LimpiaMX.',
  },
];

export const SAFETY_SOON: { title: string; text: string }[] = [
  {
    title: 'Pago protegido con garantía de reposición',
    text: 'Hoy es una demostración local: en producción, Stripe/Conekta/Mercado Pago retendrán el pago y lo liberarán al terminar, con reposición de daños hasta $2,500 MXN.',
  },
  {
    title: 'Chat con notificaciones automáticas',
    text: 'El chat por reserva y los avisos por correo o WhatsApp serán enviados por el servidor con plantillas revisadas.',
  },
  {
    title: 'Agenda sincronizada de profesionales',
    text: 'El calendario de disponibilidad se conectará con las reservas confirmadas reales de cada profesional.',
  },
];

export const CANCELLATION_POLICY_SUMMARY =
  'Cancelación gratuita con más de 24 horas de anticipación · 50% de cargo con menos de 24 horas · Sin cargo si el profesional no llega (30 min de tolerancia) · Cargo de la primera hora si no se abre la puerta sin aviso.';

export const SAFETY_TIPS: string[] = [
  'Acuerda por escrito las tareas, el horario y la tarifa antes del día del servicio.',
  'Revisa las reseñas y los años de experiencia, y pide referencias si es tu primera vez.',
  'No entregues dinero por adelantado. Paga al terminar.',
  'Guarda joyas, documentos y efectivo antes de que llegue la persona.',
  'Avisa a alguien de confianza la fecha, la hora y el nombre del perfil que contrataste.',
  'Si algo no se siente bien, termina el servicio y repórtalo desde Contacto.',
];
