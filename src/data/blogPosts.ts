import { CityMX } from '../types/marketplace';
import { CATALOG_CLEANERS } from './catalog';
import { computeCityRateStats } from '../lib/pricing';

// Guías del blog. Los rangos de precio se derivan del catálogo real en runtime
// (computeCityRateStats) para que ningún número se quede obsoleto.

export interface BlogBlock {
  kind: 'p' | 'h2' | 'bullets' | 'steps';
  text?: string;
  items?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  dateLabel: string;
  readMinutes: number;
  category: 'Precios' | 'Guías' | 'Airbnb';
  blocks: BlogBlock[];
}

function cityRange(city: CityMX): string {
  const stats = computeCityRateStats(CATALOG_CLEANERS, city);
  return `$${stats.minRate} a $${stats.maxRate} MXN por hora (promedio $${stats.avgRate})`;
}

const rangeCDMX = cityRange('CDMX');
const rangeEcatepec = cityRange('Ecatepec');
const rangeMonterrey = cityRange('Monterrey');
const rangeGDL = cityRange('Guadalajara');

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'cuanto-cuesta-limpieza-profunda-cdmx',
    title: '¿Cuánto cuesta una limpieza profunda en CDMX? Guía 2026',
    excerpt:
      'Rangos reales por hora, cuántas horas pide cada tipo de inmueble y cómo saber si te están cobrando de más.',
    dateLabel: 'Noviembre 2026',
    readMinutes: 6,
    category: 'Precios',
    blocks: [
      {
        kind: 'p',
        text: `En el catálogo de LimpiaMX, los perfiles activos de CDMX cobran ${rangeCDMX}. La limpieza profunda no cambia la tarifa por hora: cambia el número de horas, porque se trabaja con más detalle y con productos específicos.`,
      },
      { kind: 'h2', text: 'Cuántas horas pide cada inmueble' },
      {
        kind: 'bullets',
        items: [
          'Departamento de 60–90 m², 2 recámaras, 1 baño: 5 a 6 horas de profunda.',
          'Departamento de 90–130 m², 3 recámaras, 2 baños: 6 a 8 horas, o dos sesiones.',
          'Casa de 3+ recámaras con jardín: 8 horas mínimo; los exteriores se acuerdan aparte.',
          'Post-obra o mudanza: jornada completa (hasta 12 horas) por el polvo fino y los residuos.',
        ],
      },
      {
        kind: 'p',
        text: `Como referencia, el mantenimiento semanal en la capital toma 3 a 4 horas en ese mismo departamento. La profunda casi siempre duplica el tiempo y, por tanto, el costo total, aunque la tarifa por hora sea la misma.`,
      },
      { kind: 'h2', text: 'Qué debe incluir una profunda bien hecha' },
      {
        kind: 'bullets',
        items: [
          'Cocina: desgrasado de campana, azulejos, interior de horno y refrigerador.',
          'Baños: canceles, azulejo de piso a pared, desincrustado de regadera y grifos.',
          'Cuartos: baseboards (rodapiés), interior de closets, ventanas y marcos.',
          'Toda la casa: aspirado con boquilla de esquinas y trapeado con producto según el piso.',
        ],
      },
      { kind: 'h2', text: 'Cómo saber si te están cobrando de más' },
      {
        kind: 'steps',
        items: [
          'Pide el cálculo por escrito: horas × tarifa por hora. Si solo te dan un "paquete", pregunta cuántas horas incluye.',
          'Compara la tarifa por hora con el rango de tu ciudad: en CDMX el techo razonable hoy es $270/hora; en perfiles con insumos especializados puede subir ligeramente.',
          'Pregunta qué no está incluido: exteriores, tapicería y alfombras suelen cotizarse aparte y es legítimo.',
          'Si el inmueble está en condiciones normales (sin obra ni abandono), desconfía de propuestas que dupliquen las horas del cuadro anterior.',
        ],
      },
      {
        kind: 'p',
        text: `Con el cotizador de LimpiaMX puedes ingresar metros cuadrados, recámaras y baños y ver el rango estimado antes de hablar con cualquier profesional. Usa esos números como punto de negociación, no como precio fijo: cada casa es distinta.`,
      },
      {
        kind: 'p',
        text: `¿Fuera de la capital? El mismo criterio aplica en otras plazas: en Ecatepec el rango es ${rangeEcatepec}, en Guadalajara ${rangeGDL} y en Monterrey ${rangeMonterrey}.`,
      },
    ],
  },
  {
    slug: 'checklist-antes-de-limpieza-domicilio',
    title: 'Checklist: cómo preparar tu casa antes de una limpieza a domicilio',
    excerpt:
      'Diez minutos de preparación que evitan malentendidos, protegen tus cosas y hacen que la jornada rinda más.',
    dateLabel: 'Noviembre 2026',
    readMinutes: 4,
    category: 'Guías',
    blocks: [
      {
        kind: 'p',
        text: 'Una buena limpieza empieza antes de que llegue el profesional. Estos son los pasos que reseñan los clientes más satisfechos del catálogo, ordenados del más importante al más fino.',
      },
      { kind: 'h2', text: 'La noche anterior' },
      {
        kind: 'bullets',
        items: [
          'Guarda dinero, documentos, joyas y medicinas en un lugar cerrado. No es desconfianza: es buena práctica en cualquier servicio a domicilio.',
          'Decide las zonas prioritarias y anótalas (ej. "cocina a fondo y baño principal"). Tenerlo por escrito evita discusiones.',
          'Si tienes mascotas, define dónde estarán: una habitación cerrada o con correa es más seguro para ellas y para quien limpia.',
        ],
      },
      { kind: 'h2', text: 'El día del servicio' },
      {
        kind: 'bullets',
        items: [
          'Despeja pisos y superficies: ropa en el piso, trastes sucios y juguetes hacen que el tiempo se vaya en ordenar, no en limpiar.',
          'Revisa que haya agua, luz y, si el profesional no trae insumos, que los productos estén accesibles y etiquetados.',
          'Comparte el código de la puerta o el proceso de acceso con anticipación. En LimpiaMX cada reserva genera un código que confirma que quien llegó es quien reservaste.',
          'Guarda el número del profesional y ten a la mano el folio de tu reserva por si necesitas reprogramar.',
        ],
      },
      { kind: 'h2', text: 'Al terminar: la revisión de 5 minutos' },
      {
        kind: 'steps',
        items: [
          'Recorre las zonas prioritarias con la lista en la mano antes de que el profesional se retire.',
          'Si algo quedó pendiente, dilo en el momento: casi todo se corrige en 10 minutos si se avisa temprano.',
          'Marca la reserva como completada en Mis reservas y deja tu reseña: las reseñas ligadas a reservas reales son lo que mantiene la calidad del catálogo.',
        ],
      },
      {
        kind: 'p',
        text: 'Con la app también puedes usar el chat de la reserva para dejar instrucciones que quedan por escrito, y el pago protegido si prefieres liberar el dinero hasta terminar la revisión.',
      },
    ],
  },
  {
    slug: 'rotacion-limpieza-airbnb-entre-huespedes',
    title: 'Airbnb: cómo planear la rotación de limpieza entre huéspedes',
    excerpt:
      'Ventanas de tiempo, blancos por juego y el orden correcto de tareas para que nunca canceles un check-in.',
    dateLabel: 'Noviembre 2026',
    readMinutes: 5,
    category: 'Airbnb',
    blocks: [
      {
        kind: 'p',
        text: `La rotación de estancias cortas es la especialidad más técnica del catálogo: hay una ventana fija entre check-out y check-in y todo tiene que quedar impecable dentro de ella. Estos son los estándares que usan los perfiles de Airbnb de la plataforma.`,
      },
      { kind: 'h2', text: 'La ventana de tiempo' },
      {
        kind: 'bullets',
        items: [
          'Departamento de 1 recámara: 2 a 3 horas de rotación.',
          'De 2 recámaras y 2 baños: 3 a 4 horas; considera lavandería externa si el huésped entra el mismo día.',
          'Casas o lofts con jardín: suma 1 hora para exteriores y terraza.',
        ],
      },
      {
        kind: 'p',
        text: `En plazas de alta rotación como CDMX (Roma, Juárez, Santa Fe) o Mérida (centro y Paseo de Montejo), los perfiles de Airbnb cobran entre ${rangeCDMX.replace('MXN por hora', 'MXN/hora')} con mínimo de 3 horas.`,
      },
      { kind: 'h2', text: 'El orden correcto de tareas' },
      {
        kind: 'steps',
        items: [
          'Recoger y revisar: busca objetos olvidados, daños y restos de comida. Reporta cualquier daño antes de limpiar.',
          'Blancos primero: desvestir, armar el kit de repuesto (2 juegos por cama: uno en uso, uno de respaldo) y arrancar la lavadora si la lavandería es interna.',
          'Limpieza de arriba hacia abajo: telarañas, superficies, espejos, baños y al final pisos.',
          'Cocina: trastes, electrodomésticos por fuera, basura a la salida. Revista café, sal y consumibles del huésped.',
          'Detalle final: doblar blancos según la guía del anfitrión, ambientar y tomar las fotos de respaldo.',
        ],
      },
      { kind: 'h2', text: 'Insumos y blancos: el inventario que evita emergencias' },
      {
        kind: 'bullets',
        items: [
          'Mínimo 3 juegos de sábanas y fundas por cama en rotación diaria.',
          'Toallas: 2 por huésped (baño y manos) más 1 de respaldo.',
          'Kit del limpiador siempre en el inmueble: multiusos, desgrasador, limpiador de vidrio, desinfectante de baño y microfibras por color.',
        ],
      },
      {
        kind: 'p',
        text: 'Con la app puedes repetir la reserva con el mismo profesional cada semana, y el chat por reserva sirve para pasarle la guía de doblado y los consumibles que reponer. Si un huésped deja el espacio en mal estado, la garantía de reposición del pago protegido cubre daños de hasta $2,500 MXN.',
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | null {
  return BLOG_POSTS.find((p) => p.slug === slug) ?? null;
}
