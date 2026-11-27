import { CityMX, CITY_SLUGS } from '../types/marketplace';

// Contenido editorial de las páginas de ciudad (#/limpieza-en-<ciudad>).
// Los precios promedio NO se escriben aquí: se calculan en runtime desde el
// catálogo con computeCityRateStats() para que nunca se desincronicen.

export interface CityPageContent {
  city: CityMX;
  state: string;
  headline: string;
  intro: string[];
  ventajas: { title: string; text: string }[];
  consejos: string[];
  zonasDestacadas: string[];
  faq: { q: string; a: string }[];
}

export const CITY_PAGE_CONTENT: Record<CityMX, CityPageContent> = {
  CDMX: {
    city: 'CDMX',
    state: 'Ciudad de México',
    headline: 'Personal de limpieza en CDMX por colonia y con tarifa clara',
    intro: [
      'En la Ciudad de México la limpieza a domicilio se organiza por colonia: un departamento en Roma Norte, una casa en Pedregal y un estudio en Santa Fe no piden lo mismo ni en horas ni en productos. Por eso LimpiaMX organiza los perfiles por zona y por especialidad, con tarifa por hora en MXN visible desde la tarjeta.',
      'La mayoría de los departamentos de la capital son de 60 a 110 m² con dos recámaras y un baño, así que una limpieza de mantenimiento toma entre 3 y 5 horas. Para mudanzas, remodelaciones o limpieza profunda conviene agendar la mitad del día o la jornada completa.',
      'Todos los perfiles de esta página trabajan en colonias específicas del poniente, centro y sur, y varios ofrecen insumos incluidos, algo práctico en departamentos con bodega pequeña o edificios donde no hay lugar para guardar un carrito de limpieza.',
    ],
    ventajas: [
      {
        title: 'Cobertura por colonia, no solo por alcaldía',
        text: 'Los perfiles declaran hasta 8 colonias donde trabajan: Roma, Condesa, Del Valle, Narvarte, Polanco, Coyoacán, Santa Fe e Interlomas, entre otras.',
      },
      {
        title: 'Especialistas en departamentos y Airbnb',
        text: 'Hay profesionales enfocados en rotación de estancias cortas y lavado de blancos, útiles si administras departamentos de Airbnb en Roma o Juárez.',
      },
      {
        title: 'Horarios que respetan la vida del edificio',
        text: 'Puedes agendar entre semana en horario laboral o el sábado por la mañana, y acordar acceso con portero o con el código del edificio.',
      },
      {
        title: 'Tarifas visibles desde la tarjeta',
        text: 'En CDMX las tarifas del catálogo van de $230 a $270 por hora; ves el rango completo antes de enviar cualquier solicitud.',
      },
    ],
    consejos: [
      'Si vives en un edificio con reglamento de mudanzas o horarios de ascensor, escríbelo en las notas de la reserva.',
      'Para limpieza profunda, pide 6 horas o dos sesiones: los canceles y azulejos de cocinas capitalinas suelen acumular grasa de catering y humo.',
      'Si trabajas desde casa, agenda martes o miércoles: es el día con más disponibilidad en la mayoría de los perfiles.',
    ],
    zonasDestacadas: [
      'Roma Norte',
      'Condesa',
      'Del Valle',
      'Polanco',
      'Coyoacán Centro',
      'Santa Fe',
    ],
    faq: [
      {
        q: '¿Cuánto se cobra por hora de limpieza en CDMX?',
        a: 'En el catálogo de LimpiaMX los perfiles activos de CDMX cobran entre $230 y $270 MXN por hora, con un promedio de $250. La limpieza profunda y post-obra se cobran con recargo porque requieren más tiempo y productos especiales.',
      },
      {
        q: '¿El profesional lleva insumos?',
        a: 'La mayoría de los perfiles de CDMX trabajan con insumos incluidos. En cada tarjeta verás la leyenda "Incluye insumos"; si prefieres usar tus propios productos por alergias o mascotas, filtra o escríbelo en las notas.',
      },
    ],
  },
  Ecatepec: {
    city: 'Ecatepec',
    state: 'Estado de México',
    headline: 'Limpieza a domicilio en Ecatepec con tarifas accesibles',
    intro: [
      'Ecatepec es el municipio más poblado del Estado de México y su ritmo marca la zona norte del Valle de México. Aquí la limpieza a domicilio convive con horarios de fábrica, transporte público largo y casas en privada que piden cuidado con espacios compartidos.',
      'Los perfiles de Ecatepec en LimpiaMX atienden casas, departamentos en privada, locales y consultorios cerca de Ciudad Azteca, Jardines de Morelos, Villa de las Flores y San Cristóbal. Las tarifas van de $175 a $210 por hora, por debajo del promedio de la capital, con la misma calidad de reseñas.',
      'Si tu jornada sale tarde, busca perfiles con horario hasta las 18:30 o agenda para el sábado temprano. Varios profesionales ofrecen planchado y orden de clósets en la misma visita.',
    ],
    ventajas: [
      {
        title: 'Tarifas de las más accesibles del catálogo',
        text: 'De $175 a $210 por hora: mantener una casa semanalmente cuesta notablemente menos que en la CDMX, con profesionales de la misma zona.',
      },
      {
        title: 'Cerca del transporte y de las privadas',
        text: 'Los profesionales conocen las entradas de Jardines de Morelos, Valle de Aragón y Ciudad Azteca, y trabajan con horarios compatibles con la Línea B del Metro.',
      },
      {
        title: 'Consultorios y locales',
        text: 'Hay especialistas en sanitización de consultorios y locales cerca de Av. Central, útiles si atiendes pacientes o tienes un negocio de barrio.',
      },
      {
        title: 'Planchado y orden en la misma visita',
        text: 'Varias profesionales combinan limpieza de hogar con planchado de uniformes escolares y de trabajo, algo que ahorra media jornada cada semana.',
      },
    ],
    consejos: [
      'Si tu casa está en privada, avisa al profesional cómo avisar al caseta: se evita media hora de espera el primer día.',
      'Para limpiezas de 4 horas o más, acuerda pausa de comida: la mayoría incluye 30 minutos sin cobro.',
      'Guarda agua y luz de respaldo los días de lluvia intensa: en Ecatepec los cortes son frecuentes y afectan aspiradoras y planchas.',
    ],
    zonasDestacadas: [
      'Las Américas',
      'Jardines de Morelos',
      'Ciudad Azteca',
      'Villa de las Flores',
      'San Cristóbal Centro',
      'Valle de Aragón 3ra Sección',
    ],
    faq: [
      {
        q: '¿Atienden también Coacalco o Nezahualcóyotl?',
        a: 'Cada perfil declara hasta 8 colonias donde trabaja. Si tu colonia limita con Ecatepec, revisa las colonias de la tarjeta o envía la solicitud y pregúntalo por WhatsApp antes de confirmar.',
      },
      {
        q: '¿Se puede pagar el servicio en efectivo?',
        a: 'Sí. Hoy el pago se acuerda directo con el profesional al terminar la jornada, en efectivo o transferencia. La opción de pago protegido dentro de la app está disponible en Mis reservas.',
      },
    ],
  },
  Guadalajara: {
    city: 'Guadalajara',
    state: 'Jalisco',
    headline: 'Limpieza en Guadalajara y Zapopan, de Providencia a Chapalita',
    intro: [
      'En Guadalajara la demanda de limpieza se concentra en el corredor Providencia–Americana–Chapultepec, en Zapopan (Puerta de Hierro y Andares) y en el sur con Chapalita y Ciudad del Sol. Son zonas de oficinas, consultorios y departamentos que piden servicio constante y discreto.',
      'El catálogo de Guadalajara va de $220 a $255 por hora. Hay perfiles con enfoque en oficinas y estudios jurídicos, y otros en hogares tradicionales con pisos de madera y cristales grandes, típicos de las casas tapatías.',
      'Como la mancha urbana cruza Zapopan, Tlaquepaque y Tlajomulco, revisa las colonias declaradas por cada perfil: muchos incluyen Zapopan Centro o Tlaquepaque Centro dentro de su cobertura.',
    ],
    ventajas: [
      {
        title: 'Oficinas del corredor Chapultepec',
        text: 'Perfiles especializados en despachos y consultorios que atienden fuera de horario de oficina para no interrumpir la operación.',
      },
      {
        title: 'Casas tradicionales bien cuidadas',
        text: 'Experiencia declarada con pisos de madera, barro y cristales grandes, materiales comunes en las colonias clásicas de la ciudad.',
      },
      {
        title: 'Cobertura que cruza municipios',
        text: 'Varios perfiles incluyen colonias de Zapopan y Tlaquepaque, así no tienes que buscar otro proveedor si te mudas dentro de la zona metropolitana.',
      },
      {
        title: 'Rotación de Airbnb en Providencia',
        text: 'La ciudad es plaza fuerte de estancias cortas: hay profesionales con lavado y cambio de blancos entre huéspedes.',
      },
    ],
    consejos: [
      'En temporada de lluvias (junio a septiembre) agenda lavado de cristales para días secos: sale mejor y sin marcas de agua.',
      'Si tu oficina está en Chapultepec o Vallarta, pide limpieza después de las 19:00: evitas bloquear el acceso de clientes.',
      'Para casas con jardín, aclara si el barrido de áreas exteriores entra en la jornada o se cobra aparte.',
    ],
    zonasDestacadas: [
      'Providencia',
      'Americana',
      'Chapultepec',
      'Puerta de Hierro',
      'Chapalita',
      'Tlaquepaque Centro',
    ],
    faq: [
      {
        q: '¿Cobran igual en Zapopan que en Guadalajara centro?',
        a: 'Las tarifas declaradas del catálogo van de $220 a $255 por hora en toda la zona metropolitana. Lo que puede cambiar son las horas estimadas según el tamaño del inmueble, no la tarifa por municipio.',
      },
      {
        q: '¿Hay perfiles con insumos incluidos?',
        a: 'Sí. La mayoría del catálogo tapatío trabaja con insumos propios. Revisa la leyenda de cada tarjeta o el filtro "Con insumos incluidos".',
      },
    ],
  },
  Monterrey: {
    city: 'Monterrey',
    state: 'Nuevo León',
    headline: 'Limpieza en Monterrey, de San Pedro a Contry',
    intro: [
      'Monterrey combina departamentos corporativos en San Pedro Garza García con casas familiares en Cumbres, Contry y San Jerónimo. El catálogo local va de $235 a $280 por hora, el más alto del sitio, acompañado de perfiles con experiencia en post-obra: la ciudad crece y remodela constantemente.',
      'La limpieza post-obra es la especialidad más buscada del área metropolitana: polvo fino de marmol y granito, residuos de pintura y ventaneles nuevos. También hay demanda fuerte de rotación de Airbnb en Valle Oriente y Centro.',
      'Por el clima seco y el polvo del norte, las limpiezas de mantenimiento en Monterrey suelen incluir pisos y superficies cada semana; para oficinas, los sanitarios y áreas comunes son la prioridad declarada por los perfiles locales.',
    ],
    ventajas: [
      {
        title: 'Líderes en post-obra',
        text: 'Profesionales acostumbrados a entregar departamentos nuevos: polvo fino en marmol, pegamento de cinta y pintura en cristales.',
      },
      {
        title: 'Cobertura en San Pedro y Valle Oriente',
        text: 'Perfiles que atienden las torres corporativas y residenciales de mayor demanda sin recargos escondidos.',
      },
      {
        title: 'Horarios para jornadas largas',
        text: 'La cultura laboral regia abre huecos temprano (07:30) y tarde; varios perfiles atienden de 07:30 a 19:00.',
      },
      {
        title: 'Clima seco, rutina semanal',
        text: 'Los perfiles locales proponen planes semanales que controlan el polvo acumulado, con descuentos por frecuencia en el cotizador.',
      },
    ],
    consejos: [
      'Para post-obra, aparta el inmueble un día completo: el polvo fino de marmol exige dos pasadas y aspirado de ductos.',
      'En casas con mascotas, pide productos sin aromas agresivos: hay perfiles que trabajan con línea hipoalergénica.',
      'Si administras Airbnb en Valle Oriente, agenda la rotación el día del check-out y da ventana de 3 horas mínimo.',
    ],
    zonasDestacadas: [
      'San Pedro Garza García',
      'Valle Oriente',
      'Cumbres',
      'Contry',
      'San Jerónimo',
      'Centro Monterrey',
    ],
    faq: [
      {
        q: '¿Por qué las tarifas son más altas que en otras ciudades?',
        a: 'El costo de vida y la demanda de especialidades (post-obra, oficinas corporativas) empujan la tarifa de $235 a $280 por hora. Para mantenimiento simple puedes encontrar perfiles en la parte baja del rango.',
      },
      {
        q: '¿Atienden municipios como Santa Catarina o Guadalupe?',
        a: 'Cada perfil declara sus colonias. Algunos incluyen Santa Catarina Centro o puntos de Guadalupe; confírmalo en la tarjeta antes de enviar la solicitud.',
      },
    ],
  },
  Puebla: {
    city: 'Puebla',
    state: 'Puebla',
    headline: 'Limpieza en Puebla, de Angelópolis al Centro Histórico',
    intro: [
      'Puebla concentra su demanda en dos mundos: los condominios nuevos de Angelópolis y Lomas de Angelópolis, y las casas y locales del Centro Histórico con pisos de barro, talavera y madera que piden productos neutros.',
      'El catálogo poblano va de $195 a $225 por hora, con perfiles que combinan limpieza de hogar con planchado y atención de Airbnb en zonas de turismo, como el centro y Cholula limítrofe.',
      'Por la humedad y las lluvias de la región, el mantenimiento de canceles, azulejos y áreas de lavado es la solicitud más común; los profesionales locales suelen recomendar una profunda cada tres o cuatro meses.',
    ],
    ventajas: [
      {
        title: 'Angelópolis y condominios nuevos',
        text: 'Perfiles acostumbrados a los acabados de los desarrollos recientes: porcelanato, cristales templados y cocinas integrales.',
      },
      {
        title: 'Cuidado de acabados tradicionales',
        text: 'Experiencia con barro, talavera y madera del Centro Histórico, con productos neutros que no desgastan los pisos.',
      },
      {
        title: 'Tarifas accesibles y trato directo',
        text: 'De $195 a $225 por hora con jornadas típicas de 4 horas para casas de tres recámaras.',
      },
      {
        title: 'Apoyo para Airbnb de turismo',
        text: 'Rotación entre huéspedes con lavado de blancos, útil para departamentos del centro y San Andrés Cholula.',
      },
    ],
    consejos: [
      'En el Centro Histórico, aclara si el edificio tiene reglas de horario para servicio: muchas casonas limitan entradas después de las 18:00.',
      'Para profunda de cocina poblana, pide atención a azulejo y campana: la salsa y el comal dejan grasa resistente.',
      'Si vives en Angelópolis, el sábado por la mañana es el horario que más rápido se llena: agenda con 4 o 5 días de anticipación.',
    ],
    zonasDestacadas: [
      'Angelópolis',
      'Lomas de Angelópolis',
      'Zavaleta',
      'San Andrés Cholula',
      'Centro Histórico Puebla',
      'Las Ánimas',
    ],
    faq: [
      {
        q: '¿Atienden Cholula?',
        a: 'Sí: varios perfiles incluyen San Andrés y San Pedro Cholula dentro de sus colonias de cobertura. Revísalo en la tarjeta del perfil.',
      },
      {
        q: '¿Se puede contratar quincenal?',
        a: 'Sí. Al reservar puedes acordar la frecuencia con el profesional, y el cotizador de la app ya aplica descuento quincenal del 8% como referencia.',
      },
    ],
  },
  Querétaro: {
    city: 'Querétaro',
    state: 'Querétaro',
    headline: 'Limpieza en Querétaro, de Juriquilla a Zibatá',
    intro: [
      'Querétaro creció hacia el norte: Juriquilla, Zibatá, El Refugio y Milenio concentran casas y departamentos nuevos, muchas veces entregados en post-obra o rentados por temporada.',
      'El catálogo queretano va de $205 a $235 por hora, con perfiles que atienden tanto mantenimiento semanal como entregas de inmueble (post-obra ligera y mudanza), la especialidad más pedida por la rotación de renta local.',
      'Los centros de trabajo (aeronáutica, parques industriales) marcan horarios: la demanda se dispara los viernes y sábados, así que agendar entre semana te da mejores horarios y a veces mejores tarifas.',
    ],
    ventajas: [
      {
        title: 'Entregas de inmueble y mudanza',
        text: 'Perfiles con experiencia en limpiezas de entrega para renta: hornidas de horno, refrigerador, canceles y closets por dentro.',
      },
      {
        title: 'Cobertura en el corredor norte',
        text: 'Juriquilla, Zibatá, Milenio III y El Campanario dentro de las colonias declaradas por el catálogo.',
      },
      {
        title: 'Casas grandes a tarifa clara',
        text: 'Las casas de 3+ recámaras se cotizan por horas reales, sin paquetes inflados: ves el cálculo antes de reservar.',
      },
      {
        title: 'Rotación de Airbnb',
        text: 'Demanda turística del centro histórico y Bernal: hay perfiles con rotación de estancias cortas.',
      },
    ],
    consejos: [
      'Para entregas por mudanza, pide limpieza interior de closets y herrajes: es el detalle que más revisan las agencias de renta.',
      'En Zibatá y Juriquilla hay privadas con acceso controlado: comparte el proceso de acceso en las notas de la reserva.',
      'Programa profunda cada trimestre por el polvo de obra de los desarrollos vecinos: es la queja más común de la zona.',
    ],
    zonasDestacadas: [
      'Juriquilla',
      'Zibatá',
      'Milenio III',
      'El Campanario',
      'El Refugio',
      'Centro Sur',
    ],
    faq: [
      {
        q: '¿Hay recargo por ir a Juriquilla o Zibatá?',
        a: 'No en el catálogo: la tarifa por hora declarada cubre las colonias publicadas por el perfil. Revisa que tu colonia esté entre las cobertura antes de reservar.',
      },
      {
        q: '¿Qué servicios piden más los clientes queretanos?',
        a: 'Limpieza profunda de entrega (post-obra ligera y mudanza) y mantenimiento semanal de casas familiares, según los perfiles del catálogo.',
      },
    ],
  },
  Mérida: {
    city: 'Mérida',
    state: 'Yucatán',
    headline: 'Limpieza en Mérida, de Paseo de Montejo a Temozón Norte',
    intro: [
      'Mérida combina casas coloniales del centro con desarrollos nuevos en Temozón Norte y Altabrisa, además de una plaza de Airbnb fuerte por turismo y nómadas digitales.',
      'El catálogo meridano va de $195 a $230 por hora. Por el clima cálido y la humedad, el mantenimiento de pisos, baños y áreas de lavado (con ventilación constante) es la rutina más pedida, junto con el control de polvo en suspensión durante la temporada seca.',
      'Muchos clientes contratan limpieza quincenal para casas de una planta y semanal para Airbnb del centro. Los perfiles locales suelen combinar limpieza con planchado, algo práctico con el calor de la región.',
    ],
    ventajas: [
      {
        title: 'Casas coloniales bien tratadas',
        text: 'Cuidado de pisos de pasta y pasta española, techos altos y ventanas de madera típicas del centro histórico.',
      },
      {
        title: 'Fuerte para Airbnb',
        text: 'Rotación de estancias cortas con lavado de blancos para las plazas turísticas del centro y Paseo de Montejo.',
      },
      {
        title: 'Temozón y Altabrisa',
        text: 'Perfiles que cubren los desarrollos del norte con casas grandes y jardines.',
      },
      {
        title: 'Calor, rutina ligera',
        text: 'Los profesionales locales trabajan temprano para aprovechar la frescura: agendas desde las 08:00 con ventanas de 3 a 4 horas.',
      },
    ],
    consejos: [
      'En temporada seca (febrero a mayo), pide refuerzo de ventanas y mosquiteros: la temporada seca acumula polvo fino en pocos días.',
      'Para casas coloniales con patio, aclara si el barrido de hojas entra en la jornada o se pide como servicio aparte.',
      'Si rentas por temporada, agenda la limpieza el mismo día del check-out: la ocupación del centro se llena rápido.',
    ],
    zonasDestacadas: [
      'Montejo / Paseo de Montejo',
      'García Ginerés',
      'Altabrisa',
      'Temozón Norte',
      'Itzimná',
      'Centro Mérida',
    ],
    faq: [
      {
        q: '¿Se puede pagar en la app?',
        a: 'Sí: desde Mis reservas puedes usar el pago protegido con Stripe, Conekta o Mercado Pago, y el dinero se libera al profesional al terminar el servicio.',
      },
      {
        q: '¿Qué pasa con el planchado?',
        a: 'Varios perfiles incluyen planchado dentro de la jornada si lo eliges como servicio. Revisa las especialidades de cada tarjeta.',
      },
    ],
  },
};

export function getCityPageContent(city: CityMX): CityPageContent {
  return CITY_PAGE_CONTENT[city];
}

export function citySlugFor(city: CityMX): string {
  return CITY_SLUGS[city];
}
