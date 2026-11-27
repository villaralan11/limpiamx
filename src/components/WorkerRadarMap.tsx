import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APIProviderContext,
  Circle,
  InfoWindow,
  Map as GoogleMap,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Award,
  Crosshair,
  Loader2,
  MapPin,
  Navigation,
  Radar,
  Search,
  Star,
  X,
} from 'lucide-react';
import {
  CITIES_MX,
  CITY_TO_DEFAULT_STATE,
  CityMX,
  CleanerListing,
  formatMxn,
} from '../types/marketplace';
import {
  computeDistanceKm,
  getCachedCoordinate,
  getMarkerSpreadOffset,
  GMP_ATTRIBUTION_IDS,
  isGmpUnavailable,
  reportGmpQuotaIfExceeded,
  resolvePlaceCoordinate,
  setCachedCoordinate,
  useAutocompleteSuggestions,
  useGmpUnavailable,
} from '../lib/mapsPlacesHelper';

interface WorkerRadarMapProps {
  cleaners: CleanerListing[];
  selectedCity: CityMX | 'Todas';
  onCityChange: (city: CityMX | 'Todas') => void;
  onSelectCleaner: (cleaner: CleanerListing) => void;
  onSwitchToGrid?: () => void;
}

interface PositionedCleaner {
  cleaner: CleanerListing;
  position: google.maps.LatLngLiteral;
  distanceKm: number;
  inRadius: boolean;
}

const RADIUS_OPTIONS_KM = [3, 5, 10, 20, 50] as const;

function getZoomForRadiusKm(radiusKm: number): number {
  if (radiusKm <= 3) return 13;
  if (radiusKm <= 5) return 12;
  if (radiusKm <= 10) return 11;
  if (radiusKm <= 20) return 10;
  return 9;
}

const RadarViewportController: React.FC<{
  center: google.maps.LatLngLiteral | null;
  radiusKm: number;
  focusedPosition: google.maps.LatLngLiteral | null;
}> = ({ center, radiusKm, focusedPosition }) => {
  const map = useMap('worker-radar-map');

  useEffect(() => {
    if (!map || !center) return;
    map.panTo(center);
    map.setZoom(getZoomForRadiusKm(radiusKm));
  }, [map, center, radiusKm]);

  useEffect(() => {
    if (!map || !focusedPosition) return;
    map.panTo(focusedPosition);
  }, [map, focusedPosition]);

  return null;
};

const WorkerRadarMapInner: React.FC<WorkerRadarMapProps> = ({
  cleaners,
  selectedCity,
  onCityChange,
  onSelectCleaner,
  onSwitchToGrid,
}) => {
  const placesLib = useMapsLibrary('places');
  const geometryLib = useMapsLibrary('geometry');
  const mapsUnavailable = useGmpUnavailable();

  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [radarCenter, setRadarCenter] =
    useState<google.maps.LatLngLiteral | null>(() => {
      const targetCity =
        selectedCity === 'Todas' ? 'CDMX' : selectedCity;
      const defaultState = CITY_TO_DEFAULT_STATE[targetCity] || '';
      const query = defaultState
        ? `${targetCity}, ${defaultState}, México`
        : `${targetCity}, México`;
      return (
        getCachedCoordinate(query) ??
        getCachedCoordinate(`${targetCity}, México`)
      );
    });
  const [resolvingCenter, setResolvingCenter] = useState<boolean>(
    () => !radarCenter && !isGmpUnavailable()
  );
  const [centerLabel, setCenterLabel] = useState<string>(() =>
    selectedCity === 'Todas'
      ? 'Ciudad de México'
      : selectedCity === 'Ecatepec'
        ? 'Ecatepec, Edo. Méx.'
        : selectedCity
  );
  const [usingGps, setUsingGps] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Address / zone search box
  const [zoneInput, setZoneInput] = useState('');
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const {
    suggestions,
    isLoading: suggestionsLoading,
    resetSession,
  } = useAutocompleteSuggestions(zoneInput, {
    cityContext: selectedCity === 'Todas' ? '' : selectedCity,
    enabled: zoneDropdownOpen,
    minLength: 2,
  });

  // Resolved cleaner coordinates keyed by cleaner.id
  const [cleanerCoords, setCleanerCoords] = useState<
    Record<string, google.maps.LatLngLiteral>
  >({});
  const [resolvingWorkers, setResolvingWorkers] = useState(false);

  // Active pin / InfoWindow state (object map, never global Map)
  const [activeCleanerId, setActiveCleanerId] = useState<string | null>(null);
  const markerRefs = useRef<
    Record<string, google.maps.marker.AdvancedMarkerElement | null>
  >({});

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target as Node)
      ) {
        setZoneDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  // CORREGIDO (error de ubicación): si cambia la ciudad desde el filtro principal
  // o desde una página de ciudad, el radar deja de estar "anclado" al GPS/zona
  // elegida antes y vuelve a centrarse en la ciudad seleccionada.
  useEffect(() => {
    setUsingGps(false);
    setZoneInput('');
    setZoneDropdownOpen(false);
    setGeoError('');
    setActiveCleanerId(null);
  }, [selectedCity]);

  // Resolve initial / selectedCity center when not explicitly locked on user GPS
  useEffect(() => {
    if (mapsUnavailable || isGmpUnavailable()) {
      setResolvingCenter(false);
      return;
    }
    if (!placesLib || usingGps) return;
    const cityToResolve = selectedCity === 'Todas' ? 'CDMX' : selectedCity;
    const defaultState = CITY_TO_DEFAULT_STATE[cityToResolve] || '';
    const query = defaultState
      ? `${cityToResolve}, ${defaultState}, México`
      : `${cityToResolve}, México`;
    let cancelled = false;
    setResolvingCenter(true);

    void resolvePlaceCoordinate(placesLib, query)
      .then((coords) => {
        if (!cancelled && coords) {
          setRadarCenter(coords);
          setCenterLabel(
            cityToResolve === 'CDMX'
              ? 'Ciudad de México'
              : cityToResolve === 'Ecatepec'
                ? 'Ecatepec, Edo. Méx.'
                : cityToResolve
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setResolvingCenter(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [placesLib, selectedCity, usingGps, mapsUnavailable]);

  // Resolve coordinates for each visible cleaner (using sessionStorage cache)
  useEffect(() => {
    if (!placesLib || mapsUnavailable || isGmpUnavailable()) {
      setResolvingWorkers(false);
      return;
    }
    let cancelled = false;
    setResolvingWorkers(true);

    const resolveWorkers = async () => {
      const nextMap: Record<string, google.maps.LatLngLiteral> = {};
      const queryCount: Record<string, number> = {};
      // Caché local de intentos (incluye misses) para no repetir consultas fallidas
      const attemptCache: Record<string, google.maps.LatLngLiteral | null> = {};
      // Límite de geocodificaciones de colonias sin caché en vista nacional para cuidar la cuota diaria
      let uncachedColoniaLookups = 0;
      const MAX_UNCACHED_COLONIA_LOOKUPS = selectedCity === 'Todas' ? 12 : 25;

      const lookupCachedOrFetch = async (
        query: string,
        allowNetworkFetch: boolean
      ): Promise<google.maps.LatLngLiteral | null> => {
        const normalized = query.trim().toLowerCase();
        if (Object.prototype.hasOwnProperty.call(attemptCache, normalized)) {
          return attemptCache[normalized];
        }
        const cached = getCachedCoordinate(query);
        if (cached) {
          attemptCache[normalized] = cached;
          return cached;
        }
        if (!allowNetworkFetch || cancelled || isGmpUnavailable()) {
          return null;
        }
        const result = await resolvePlaceCoordinate(placesLib, query);
        attemptCache[normalized] = result;
        return result;
      };

      for (const cl of cleaners) {
        if (cancelled || isGmpUnavailable()) break;

        const primaryColonia = cl.colonias[0]?.trim() || '';
        const stateHint =
          cl.state?.trim() || CITY_TO_DEFAULT_STATE[cl.city] || '';
        const locationSuffix = stateHint
          ? `${cl.city}, ${stateHint}, México`
          : `${cl.city}, México`;
        // Limpia paréntesis y diagonales: sin esto, colonias como
        // "La Florida (Ciudad Azteca)" se geocodifican mal o no se encuentran.
        const geocodeName = primaryColonia
          ? primaryColonia
              .replace(/\s*\([^)]*\)\s*/g, ' ')
              .replace(/\s*\/\s*/g, ', ')
              .trim()
          : '';
        const primaryQuery = geocodeName
          ? `${geocodeName}, ${locationSuffix}`
          : locationSuffix;

        let coords: google.maps.LatLngLiteral | null = null;
        if (geocodeName) {
          const alreadyCached = Boolean(getCachedCoordinate(primaryQuery));
          const canQueryColonia =
            alreadyCached || uncachedColoniaLookups < MAX_UNCACHED_COLONIA_LOOKUPS;
          if (!alreadyCached && canQueryColonia) {
            uncachedColoniaLookups += 1;
          }
          coords = await lookupCachedOrFetch(primaryQuery, canQueryColonia);
        }

        if (!coords && !cancelled && !isGmpUnavailable()) {
          coords = await lookupCachedOrFetch(locationSuffix, true);
        }

        if (coords) {
          const baseKey = `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`;
          const dupIndex = queryCount[baseKey] ?? 0;
          queryCount[baseKey] = dupIndex + 1;
          const offset = getMarkerSpreadOffset(cl.id, dupIndex);
          nextMap[cl.id] = {
            lat: coords.lat + offset.latOffset,
            lng: coords.lng + offset.lngOffset,
          };
        }
      }

      if (!cancelled) {
        setCleanerCoords(nextMap);
        setResolvingWorkers(false);
      }
    };

    void resolveWorkers();
    return () => {
      cancelled = true;
    };
  }, [placesLib, cleaners, selectedCity, mapsUnavailable]);

  const handleDetectLocation = () => {
    setGeoError('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError(
        'Tu navegador no permite geolocalización. Busca tu colonia arriba.'
      );
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: google.maps.LatLngLiteral = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUsingGps(true);
        setRadarCenter(coords);
        setCenterLabel('Tu ubicación actual (GPS)');
        setActiveCleanerId(null);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(
            'Permiso de ubicación denegado. Puedes escribir tu colonia o elegir una ciudad.'
          );
        } else {
          setGeoError(
            'No pudimos obtener tu ubicación GPS exacta. Intenta buscar tu colonia.'
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSelectZoneSuggestion = async (
    suggestion: google.maps.places.AutocompleteSuggestion
  ) => {
    const prediction = suggestion.placePrediction;
    if (!prediction || !placesLib) return;

    try {
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ['location', 'displayName', 'formattedAddress'],
      });
      const loc = place.location;
      if (loc) {
        const coords = { lat: loc.lat(), lng: loc.lng() };
        const label =
          place.displayName ||
          prediction.mainText?.text ||
          prediction.text?.text ||
          'Zona seleccionada';
        // Guarda en caché con el mismo formato de consulta que usa el inicio
        // del radar para que al regresar a esta zona se reutilice.
        const stateSuffix = CITY_TO_DEFAULT_STATE[
          selectedCity === 'Todas' ? 'CDMX' : selectedCity
        ];
        const queryKey = `${selectedCity === 'Todas' ? label : `${label}, ${selectedCity}${stateSuffix ? `, ${stateSuffix}` : ''}`}, México`;
        setCachedCoordinate(queryKey, coords);
        setUsingGps(true);
        setRadarCenter(coords);
        setCenterLabel(label);
        setZoneInput(label);
        setZoneDropdownOpen(false);
        setGeoError('');
        setActiveCleanerId(null);
      }
      resetSession();
    } catch (err) {
      reportGmpQuotaIfExceeded(err);
    }
  };

  const positionedCleaners = useMemo<PositionedCleaner[]>(() => {
    if (!radarCenter) return [];
    const list: PositionedCleaner[] = [];
    for (const cl of cleaners) {
      const pos = cleanerCoords[cl.id];
      if (!pos) continue;
      const distanceKm = computeDistanceKm(geometryLib, radarCenter, pos);
      list.push({
        cleaner: cl,
        position: pos,
        distanceKm,
        inRadius: distanceKm <= radiusKm,
      });
    }
    return list.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [cleaners, cleanerCoords, radarCenter, radiusKm, geometryLib]);

  const inRadiusCleaners = useMemo(
    () => positionedCleaners.filter((item) => item.inRadius),
    [positionedCleaners]
  );

  const outsideRadiusCleaners = useMemo(
    () => positionedCleaners.filter((item) => !item.inRadius),
    [positionedCleaners]
  );

  const activePositioned = useMemo(
    () =>
      positionedCleaners.find((item) => item.cleaner.id === activeCleanerId) ??
      null,
    [positionedCleaners, activeCleanerId]
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Radar Control Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                Radar de profesionales cercanos
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Centro actual: <span className="font-medium text-slate-900">{centerLabel}</span> · Radio de{' '}
                <span className="font-medium text-teal-800 tabular-nums">{radiusKm} km</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={geoLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 text-white text-xs sm:text-sm font-medium hover:bg-teal-800 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {geoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Crosshair className="w-4 h-4" />
              )}
              <span>Usar mi ubicación GPS</span>
            </button>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
              <span className="text-[11px] font-medium text-slate-500 pl-2 pr-1">
                Radio:
              </span>
              {RADIUS_OPTIONS_KM.map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => setRadiusKm(km)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                    radiusKm === km
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Specific Address / Colonia + City Quick Jump */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div ref={searchBoxRef} className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={zoneInput}
              onFocus={() => setZoneDropdownOpen(true)}
              onChange={(e) => {
                setZoneInput(e.target.value);
                setZoneDropdownOpen(true);
              }}
              placeholder="Centrar radar en una colonia, dirección o punto de referencia..."
              className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-700"
            />
            {zoneInput && (
              <button
                type="button"
                aria-label="Limpiar búsqueda de zona"
                onClick={() => {
                  setZoneInput('');
                  resetSession();
                }}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {zoneDropdownOpen && zoneInput.trim().length >= 2 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-64 overflow-y-auto">
                <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Resultados de Google Maps</span>
                  {suggestionsLoading && (
                    <Loader2 className="w-3 h-3 animate-spin text-teal-700" />
                  )}
                </div>
                {suggestions.length === 0 && !suggestionsLoading ? (
                  <p className="px-3.5 py-3 text-xs text-slate-500">
                    No encontramos esa ubicación en México. Intenta con otra colonia o ciudad.
                  </p>
                ) : (
                  suggestions.slice(0, 5).map((suggestion, idx) => (
                    <button
                      key={`${suggestion.placePrediction?.placeId ?? idx}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        void handleSelectZoneSuggestion(suggestion);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-teal-50/70 flex items-center gap-2.5 border-t border-slate-100 first:border-t-0 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {suggestion.placePrediction?.mainText?.text ||
                            suggestion.placePrediction?.text?.text}
                        </p>
                        {suggestion.placePrediction?.secondaryText?.text && (
                          <p className="text-[11px] text-slate-500 truncate">
                            {suggestion.placePrediction.secondaryText.text}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-4">
            <label htmlFor="radar-city-jump" className="sr-only">
              Centrar en ciudad
            </label>
            <select
              id="radar-city-jump"
              value={selectedCity}
              onChange={(e) => {
                setUsingGps(false);
                setZoneInput('');
                setActiveCleanerId(null);
                onCityChange(e.target.value as CityMX | 'Todas');
              }}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 cursor-pointer focus:outline-none focus:border-teal-700"
            >
              <option value="Todas">Todas las ciudades (Centro CDMX)</option>
              {CITIES_MX.map((city) => (
                <option key={city} value={city}>
                  Centrar en {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {geoError && (
          <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {geoError}
          </p>
        )}
      </div>

      {/* Main Radar Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Map Column */}
        <div className="lg:col-span-7 relative w-full h-[420px] sm:h-[480px] lg:h-[540px] bg-slate-100">
          {mapsUnavailable || (!radarCenter && !resolvingCenter) ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 sm:p-8 text-center space-y-3 bg-slate-50">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <h4 className="font-display text-base sm:text-lg font-semibold text-slate-900">
                El mapa interactivo de Google Maps no está disponible ahora
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed">
                Puede deberse a un límite temporal de cuota o permisos de la clave de Google Maps en este dominio. Puedes seguir explorando todos los perfiles en la lista de al lado o en vista de tarjetas.
              </p>
              {onSwitchToGrid && (
                <button
                  type="button"
                  onClick={onSwitchToGrid}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs sm:text-sm font-medium hover:bg-teal-700 transition-colors cursor-pointer"
                >
                  Cambiar a vista de tarjetas
                </button>
              )}
            </div>
          ) : !radarCenter ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-sm text-slate-600 p-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-teal-700 mb-2" />
              <p>Iniciando radar de Google Maps...</p>
            </div>
          ) : (
            <GoogleMap
              id="worker-radar-map"
              mapId="DEMO_MAP_ID"
              defaultCenter={radarCenter}
              defaultZoom={getZoomForRadiusKm(radiusKm)}
              gestureHandling="greedy"
              streetViewControl={false}
              mapTypeControl={false}
              internalUsageAttributionIds={GMP_ATTRIBUTION_IDS}
              className="w-full h-full"
              onClick={() => setActiveCleanerId(null)}
            >
              <RadarViewportController
                center={radarCenter}
                radiusKm={radiusKm}
                focusedPosition={activePositioned?.position ?? null}
              />

              {/* Outer & Inner Radar Rings */}
              <Circle
                center={radarCenter}
                radius={radiusKm * 1000}
                strokeColor="#0f766e"
                strokeOpacity={0.85}
                strokeWeight={2}
                fillColor="#14b8a6"
                fillOpacity={0.09}
                clickable={false}
              />
              <Circle
                center={radarCenter}
                radius={(radiusKm * 1000) / 2}
                strokeColor="#0f766e"
                strokeOpacity={0.45}
                strokeWeight={1}
                fillColor="#14b8a6"
                fillOpacity={0.06}
                clickable={false}
              />

              {/* Radar Origin Marker */}
              <AdvancedMarker
                position={radarCenter}
                title={centerLabel}
                zIndex={30}
              >
                <div className="flex flex-col items-center -translate-y-1">
                  <div className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-semibold shadow-sm mb-1 whitespace-nowrap">
                    Centro radar
                  </div>
                  <div className="w-5 h-5 rounded-full bg-teal-600 border-2 border-white shadow-md flex items-center justify-center">
                    <Navigation className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
              </AdvancedMarker>

              {/* Worker AdvancedMarkers */}
              {positionedCleaners.map((item) => {
                const isSelected = activeCleanerId === item.cleaner.id;
                return (
                  <AdvancedMarker
                    key={item.cleaner.id}
                    ref={(el) => {
                      markerRefs.current[item.cleaner.id] = el;
                    }}
                    position={item.position}
                    title={`${item.cleaner.businessName || item.cleaner.displayName} · ${formatMxn(item.cleaner.hourlyRateMxn)}/hr`}
                    zIndex={isSelected ? 40 : item.inRadius ? 20 : 10}
                    onClick={() => setActiveCleanerId(item.cleaner.id)}
                  >
                    <div
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold tabular-nums shadow-md transition-transform cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-amber-500 border-amber-700 text-slate-950 scale-110'
                          : item.inRadius
                          ? 'bg-teal-700 border-white text-white hover:scale-105'
                          : 'bg-white border-slate-300 text-slate-700 hover:scale-105'
                      }`}
                    >
                      {formatMxn(item.cleaner.hourlyRateMxn)}/hr
                    </div>
                  </AdvancedMarker>
                );
              })}

              {/* Anchored InfoWindow for Selected Worker */}
              {activePositioned && markerRefs.current[activePositioned.cleaner.id] && (
                <InfoWindow
                  anchor={markerRefs.current[activePositioned.cleaner.id]}
                  maxWidth={270}
                  onCloseClick={() => setActiveCleanerId(null)}
                >
                  <div className="p-1 space-y-2 text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={activePositioned.cleaner.photoUrl}
                        alt={activePositioned.cleaner.displayName}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">
                          {activePositioned.cleaner.businessName ||
                            activePositioned.cleaner.displayName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {activePositioned.cleaner.city} ·{' '}
                          {activePositioned.cleaner.colonias.slice(0, 2).join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-700 tabular-nums">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {activePositioned.cleaner.ratingAvg.toFixed(1)}
                      </span>
                      <span className="font-medium text-teal-800">
                        a {activePositioned.distanceKm.toFixed(1)} km
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatMxn(activePositioned.cleaner.hourlyRateMxn)}/hr
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectCleaner(activePositioned.cleaner)}
                      className="w-full py-2 px-3 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-teal-700 transition-colors cursor-pointer"
                    >
                      Ver perfil y contratar
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>

        {/* Nearby Workers Sidebar */}
        <aside className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col max-h-[540px]">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-800 tabular-nums">
              {mapsUnavailable || (!radarCenter && !resolvingCenter)
                ? `${cleaners.length} ${cleaners.length === 1 ? 'profesional disponible' : 'profesionales disponibles'}`
                : `${inRadiusCleaners.length} ${inRadiusCleaners.length === 1 ? 'profesional dentro del radar' : 'profesionales dentro del radar'}`}
            </span>
            {resolvingWorkers && !mapsUnavailable && (
              <span className="inline-flex items-center gap-1 text-[11px] text-teal-700">
                <Loader2 className="w-3 h-3 animate-spin" />
                Calculando distancias...
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {mapsUnavailable || (!radarCenter && !resolvingCenter) ? (
              cleaners.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm font-medium text-slate-800">
                    No hay perfiles que coincidan con tus filtros actuales.
                  </p>
                </div>
              ) : (
                cleaners.map((cleaner) => (
                  <div
                    key={cleaner.id}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={cleaner.photoUrl}
                        alt={cleaner.displayName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-display text-sm font-semibold text-slate-900 truncate">
                          {cleaner.businessName || cleaner.displayName}
                        </h4>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {cleaner.city} · {cleaner.colonias.slice(0, 2).join(', ')}
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-2.5">
                          <div className="flex items-center gap-2 text-xs text-slate-600 tabular-nums">
                            <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              {cleaner.ratingAvg.toFixed(1)}
                            </span>
                            <span>·</span>
                            <span className="font-semibold text-slate-900">
                              {formatMxn(cleaner.hourlyRateMxn)}/hr
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onSelectCleaner(cleaner)}
                            className="px-2.5 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-teal-700 cursor-pointer"
                          >
                            Ver perfil
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : inRadiusCleaners.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <p className="text-sm font-medium text-slate-800">
                  No hay trabajadores dentro de {radiusKm} km desde este punto.
                </p>
                <p className="text-xs text-slate-500">
                  Prueba ampliar el radio del radar o seleccionar otra ciudad.
                </p>
                {radiusKm < 20 && (
                  <button
                    type="button"
                    onClick={() => setRadiusKm(20)}
                    className="px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 cursor-pointer"
                  >
                    Ampliar radar a 20 km
                  </button>
                )}
              </div>
            ) : (
              inRadiusCleaners.map(({ cleaner, distanceKm }) => {
                const isSelected = activeCleanerId === cleaner.id;
                return (
                  <div
                    key={cleaner.id}
                    className={`p-4 transition-colors ${
                      isSelected ? 'bg-teal-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={cleaner.photoUrl}
                        alt={cleaner.displayName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-display text-sm font-semibold text-slate-900 truncate">
                            {cleaner.businessName || cleaner.displayName}
                          </h4>
                          <span className="text-xs font-semibold text-teal-800 tabular-nums shrink-0">
                            {distanceKm.toFixed(1)} km
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {cleaner.city} · {cleaner.colonias.slice(0, 2).join(', ')}
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-2.5">
                          <div className="flex items-center gap-2 text-xs text-slate-600 tabular-nums">
                            <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              {cleaner.ratingAvg.toFixed(1)}
                            </span>
                            <span>·</span>
                            <span className="font-semibold text-slate-900">
                              {formatMxn(cleaner.hourlyRateMxn)}/hr
                            </span>
                            {cleaner.ratingAvg >= 4.8 && cleaner.reviewsCount >= 2 && (
                              <Award className="w-3.5 h-3.5 text-teal-700" />
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActiveCleanerId(cleaner.id)}
                              className="px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-white cursor-pointer"
                            >
                              Ubicar
                            </button>
                            <button
                              type="button"
                              onClick={() => onSelectCleaner(cleaner)}
                              className="px-2.5 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-teal-700 cursor-pointer"
                            >
                              Ver perfil
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {outsideRadiusCleaners.length > 0 && (
              <div className="bg-slate-50/70">
                <div className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-t border-slate-200">
                  En otras ciudades / fuera de {radiusKm} km ({outsideRadiusCleaners.length})
                </div>
                {outsideRadiusCleaners.slice(0, 6).map(({ cleaner, distanceKm }) => (
                  <div
                    key={cleaner.id}
                    className="px-4 py-3 flex items-center justify-between gap-3 border-t border-slate-100"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {cleaner.businessName || cleaner.displayName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate tabular-nums">
                        {cleaner.city} ({cleaner.colonias[0] || 'Zona general'}) ·{' '}
                        {Math.round(distanceKm)} km
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveCleanerId(cleaner.id)}
                        className="px-2 py-1 rounded border border-slate-200 bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Ver pin
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectCleaner(cleaner)}
                        className="px-2 py-1 rounded bg-slate-900 text-white text-[11px] font-medium hover:bg-teal-700 cursor-pointer"
                      >
                        Perfil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export const WorkerRadarMap: React.FC<WorkerRadarMapProps> = (props) => {
  const apiContext = useContext(APIProviderContext);

  if (!apiContext) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
        <Radar className="w-8 h-8 text-slate-400 mx-auto" />
        <h3 className="font-display text-lg font-semibold text-slate-900">
          Mapa radar no configurado
        </h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Configura una clave válida de Google Maps Platform para activar el mapa radar interactivo en tiempo real.
        </p>
        {props.onSwitchToGrid && (
          <button
            type="button"
            onClick={props.onSwitchToGrid}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-teal-700 cursor-pointer"
          >
            Volver a vista de tarjetas
          </button>
        )}
      </div>
    );
  }

  return <WorkerRadarMapInner {...props} />;
};
