import { CityMX } from '../types/marketplace';

/**
 * Catálogo de referencia de colonias y zonas populares por ciudad en México
 * (únicamente nombres de texto para sugerencias rápidas; las coordenadas reales
 * se resuelven en tiempo de ejecución mediante Google Maps Platform).
 */
export const POPULAR_COLONIAS_BY_CITY: Record<CityMX, string[]> = {
  CDMX: [
    'Roma Norte',
    'Roma Sur',
    'Condesa',
    'Hipódromo Condesa',
    'Del Valle',
    'Narvarte',
    'Nápoles',
    'Polanco',
    'Anzures',
    'Lomas de Chapultepec',
    'Cuauhtémoc',
    'Juárez',
    'Coyoacán Centro',
    'San Ángel',
    'Santa Fe',
    'Interlomas',
    'Pedregal',
    'Escandón',
    'Portales',
    'Lindavista',
  ],
  Ecatepec: [
    'Las Américas',
    'Ciudad Azteca',
    'Jardines de Morelos',
    'San Cristóbal Centro',
    'Valle de Aragón 3ra Sección',
    'Santa Clara Coatitla',
    'La Florida (Ciudad Azteca)',
    'Villa de las Flores',
    'San Agustín',
    'Granjas Valle de Guadalupe',
    'Jardines de Santa Clara',
    'Tulpetlac',
    'Ejidos de San Cristóbal',
    'Río de Luz',
    'Xalostoc',
  ],
  Guadalajara: [
    'Providencia',
    'Americana',
    'Chapultepec',
    'Zapopan Centro',
    'Puerta de Hierro',
    'Chapalita',
    'Ladrón de Guevara',
    'Lafayette',
    'Arcos Vallarta',
    'Ciudad del Sol',
    'Jardines del Bosque',
    'Colinas de San Javier',
    'Valle Real',
    'Tlaquepaque Centro',
    'Andares',
  ],
  Monterrey: [
    'San Pedro Garza García',
    'Valle Oriente',
    'Del Valle (San Pedro)',
    'Cumbres',
    'Carretera Nacional',
    'Contry',
    'Obispado',
    'Centro Monterrey',
    'Mitras Centro',
    'San Jerónimo',
    'Tec / Tecnológico',
    'Anáhuac',
    'Linda Vista',
    'Santa Catarina Centro',
  ],
  Puebla: [
    'Angelópolis',
    'La Paz',
    'Zavaleta',
    'San Andrés Cholula',
    'San Pedro Cholula',
    'Lomas de Angelópolis',
    'Huexotitla',
    'El Mirador',
    'Las Ánimas',
    'Centro Histórico Puebla',
    'Jardines de San Manuel',
    'Estrella del Sur',
  ],
  Querétaro: [
    'Juriquilla',
    'Álamos',
    'Centro Sur',
    'Milenio III',
    'El Campanario',
    'Zibatá',
    'El Refugio',
    'Jardines de la Hacienda',
    'Cimatario',
    'Carretas',
    'Corregidora / El Pueblito',
    'Lomas del Marqués',
  ],
  Mérida: [
    'Montejo / Paseo de Montejo',
    'García Ginerés',
    'Montebello',
    'Altabrisa',
    'Temozón Norte',
    'Francisco de Montejo',
    'San Ramón Norte',
    'Itzimná',
    'Centro Mérida',
    'Cholul',
    'Santa Gertrudis Copó',
    'Las Américas',
  ],
};

export function getPopularColoniasForCity(city: string): string[] {
  return POPULAR_COLONIAS_BY_CITY[city as CityMX] ?? POPULAR_COLONIAS_BY_CITY.CDMX;
}

export function filterCityColonias(
  city: string,
  query: string,
  selected: string[]
): string[] {
  const catalog = getPopularColoniasForCity(city);
  const selectedLower = new Set(selected.map((s) => s.trim().toLowerCase()));
  const q = query.trim().toLowerCase();

  return catalog.filter((colonia) => {
    if (selectedLower.has(colonia.toLowerCase())) return false;
    if (!q) return true;
    return colonia.toLowerCase().includes(q);
  });
}
