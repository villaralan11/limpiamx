export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  sections: { heading: string; paragraphs: string[] }[];
};

export const posts: BlogPost[] = [
  {
    slug: 'cuanto-cuesta-limpieza-profunda-cdmx',
    title: '¿Cuánto cuesta una limpieza profunda en CDMX?',
    excerpt: 'Una guía práctica para calcular horas, alcance y precio antes de pedir cotizaciones.',
    category: 'Precios', date: '18 de noviembre de 2026', readTime: '6 min', image: '/images/portfolio_kitchen_mexico_1795369390945.jpg',
    sections: [
      { heading: 'El precio depende más del alcance que del nombre', paragraphs: ['Una limpieza profunda no significa lo mismo para todas las personas. Para una casa puede incluir azulejos, horno, refrigerador y cristales; para un departamento quizá el foco está en cocina, baños y ventanas.', 'Antes de comparar tarifas, escribe qué quieres que cambie al terminar. Esa lista ayuda a que dos profesionales coticen el mismo trabajo.'] },
      { heading: 'Cómo estimar las horas', paragraphs: ['Como referencia, un departamento de 60 a 80 m² suele necesitar entre 3 y 5 horas cuando no hay acumulación importante. Una casa con varios baños, mascotas o meses sin limpieza profunda puede requerir una jornada mayor.', 'El número de recámaras orienta, pero cocina y baños suelen pesar más en el tiempo total.'] },
      { heading: 'Qué preguntar antes de confirmar', paragraphs: ['Confirma si la tarifa incluye productos, si existe un mínimo de horas, qué tareas quedan fuera y cómo se paga. Una conversación clara antes de la visita evita sorpresas para ambas partes.'] },
    ],
  },
  {
    slug: 'checklist-antes-de-contratar-limpieza',
    title: 'Checklist antes de contratar a una persona de limpieza',
    excerpt: 'Seis cosas sencillas que te ayudan a comparar perfiles y preparar tu espacio.',
    category: 'Confianza', date: '11 de noviembre de 2026', readTime: '5 min', image: '/images/hero_mexican_living_room_1795321033270.jpg',
    sections: [
      { heading: '1. Define qué necesitas', paragraphs: ['¿Buscas mantenimiento semanal, una limpieza profunda, planchado o la rotación de un Airbnb? La respuesta te ayudará a filtrar perfiles con experiencia específica.'] },
      { heading: '2. Compara contexto, no solo precio', paragraphs: ['Revisa zonas de servicio, años de experiencia, reseñas y si lleva sus propios insumos. Una tarifa menor no siempre representa el mismo alcance.'] },
      { heading: '3. Deja los detalles por escrito', paragraphs: ['Fecha, horario, número de horas, tareas incluidas, productos y forma de pago. Tenerlo en un mensaje reduce malentendidos y deja una referencia para próximas visitas.'] },
      { heading: '4. Prepara tu hogar', paragraphs: ['Guarda documentos, joyas y efectivo. Avisa a una persona de confianza la fecha y el nombre del perfil que recibirá en casa.'] },
    ],
  },
  {
    slug: 'limpieza-para-airbnb-entre-huespedes',
    title: 'Cómo organizar la limpieza de un Airbnb entre huéspedes',
    excerpt: 'Una rutina de rotación que cuida tiempos, blancos y la experiencia de llegada.',
    category: 'Airbnb', date: '04 de noviembre de 2026', readTime: '7 min', image: '/images/portfolio_airbnb_bedroom_1795369391747.jpg',
    sections: [
      { heading: 'La limpieza empieza con una lista', paragraphs: ['Un checklist por habitación evita que el cambio de huéspedes dependa de la memoria. Incluye blancos, cocina, baños, consumibles, daños visibles y fotografías de salida.'] },
      { heading: 'Calcula el tiempo real', paragraphs: ['No cuentes solo la limpieza: suma traslado dentro del inmueble, lavado o acomodo de blancos, reposición y revisión final. Si el margen entre reservas es corto, acuerda una ventana realista.'] },
      { heading: 'La entrega debe ser repetible', paragraphs: ['La mejor rotación no es la que corre una vez; es la que puede repetirse con la misma calidad. Busca un perfil que entienda tus prioridades y documenta lo que funciona.'] },
    ],
  },
];

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}
