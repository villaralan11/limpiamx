import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APIProviderContext,
  Circle,
  Map as GoogleMap,
  Pin,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Eye, EyeOff, Loader2, MapPin, Plus, Search, X } from 'lucide-react';
import { filterCityColonias, getPopularColoniasForCity } from '../data/coloniasMx';
import {
  getCachedCoordinate,
  GMP_ATTRIBUTION_IDS,
  isGmpUnavailable,
  reportGmpQuotaIfExceeded,
  resolvePlaceCoordinate,
  setCachedCoordinate,
  useAutocompleteSuggestions,
  useGmpUnavailable,
} from '../lib/mapsPlacesHelper';
import { VALIDATION_LIMITS } from '../types/marketplace';

interface ColoniaSmartSelectorProps {
  city: string;
  selectedColonias: string[];
  onChange: (nextColonias: string[]) => void;
  maxCount?: number;
  allowMapPreview?: boolean;
  defaultShowMap?: boolean;
  inputId?: string;
}

interface ResolvedColoniaPin {
  name: string;
  position: google.maps.LatLngLiteral;
}

/**
 * Adjusts the preview map viewport to fit the selected colonia coordinates.
 */
const PreviewBoundsUpdater: React.FC<{
  center: google.maps.LatLngLiteral | null;
  pins: ResolvedColoniaPin[];
}> = ({ center, pins }) => {
  const map = useMap('colonia-preview-map');
  const coreLib = useMapsLibrary('core');

  useEffect(() => {
    if (!map) return;
    if (pins.length === 1) {
      map.panTo(pins[0].position);
      map.setZoom(13);
      return;
    }
    if (pins.length > 1 && coreLib?.LatLngBounds) {
      const bounds = new coreLib.LatLngBounds();
      for (const pin of pins) {
        bounds.extend(pin.position);
      }
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      return;
    }
    if (center) {
      map.panTo(center);
      map.setZoom(11);
    }
  }, [map, coreLib, center, pins]);

  return null;
};

/**
 * CORREGIDO (error de ubicación): limpia el nombre de la colonia para geocodificar.
 * Nombres como "La Florida (Ciudad Azteca)" o "Tec / Tecnológico" fallaban o
 * resolvían en el lugar equivocado al buscarlos tal cual en Google Places.
 */
function toGeocodeName(colonia: string): string {
  const withoutParens = colonia.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  return withoutParens.replace(/\s*\/\s*/g, ', ').trim();
}

/**
 * Interactive Google Maps sub-panel (only mounted inside APIProvider context)
 */
const ColoniaCoverageMapInner: React.FC<{
  city: string;
  selectedColonias: string[];
}> = ({ city, selectedColonias }) => {
  const placesLib = useMapsLibrary('places');
  const [cityCenter, setCityCenter] = useState<google.maps.LatLngLiteral | null>(
    () => getCachedCoordinate(`${city}, México`)
  );
  const [pins, setPins] = useState<ResolvedColoniaPin[]>([]);
  const [resolving, setResolving] = useState(false);
  // Clave estable: evita re-geocodificar en cada render si las colonias no cambian.
  const coloniasKey = selectedColonias.join('|');

  useEffect(() => {
    if (!placesLib || isGmpUnavailable()) {
      setResolving(false);
      return;
    }
    let cancelled = false;
    setResolving(true);
    const colonias = coloniasKey.split('|').filter(Boolean);

    const resolveAll = async () => {
      const resolvedCity = await resolvePlaceCoordinate(
        placesLib,
        `${city}, México`
      );
      if (!cancelled && resolvedCity) {
        setCityCenter(resolvedCity);
      }

      const nextPins: ResolvedColoniaPin[] = [];
      for (const col of colonias) {
        if (cancelled || isGmpUnavailable()) break;
        const geocodeName = toGeocodeName(col);
        const coords = await resolvePlaceCoordinate(
          placesLib,
          `${geocodeName}, ${city}, México`
        );
        if (coords) {
          nextPins.push({ name: col, position: coords });
        }
      }

      if (!cancelled) {
        setPins(nextPins);
        setResolving(false);
      }
    };

    void resolveAll();
    return () => {
      cancelled = true;
    };
  }, [placesLib, city, coloniasKey]);

  const initialCenter = pins[0]?.position ?? cityCenter;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
      <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 text-xs text-slate-600">
        <span className="font-medium text-slate-800">
          Visualización de cobertura en {city}
        </span>
        {resolving ? (
          <span className="inline-flex items-center gap-1.5 text-teal-700">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Ubicando zonas...
          </span>
        ) : (
          <span>
            {pins.length > 0
              ? `${pins.length} ${pins.length === 1 ? 'zona ubicada' : 'zonas ubicadas'} en mapa`
              : 'Agrega colonias para ver su radio de cobertura'}
          </span>
        )}
      </div>

      {/* Explicit CSS height prevents 0x0 map collapse (CF2) */}
      <div className="w-full h-64 relative">
        {!initialCenter ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin mr-2 text-teal-700" />
            Cargando mapa de {city}...
          </div>
        ) : (
          <GoogleMap
            id="colonia-preview-map"
            mapId="DEMO_MAP_ID"
            defaultCenter={initialCenter}
            defaultZoom={pins.length > 0 ? 12 : 11}
            gestureHandling="cooperative"
            disableDefaultUI={false}
            streetViewControl={false}
            mapTypeControl={false}
            internalUsageAttributionIds={GMP_ATTRIBUTION_IDS}
            className="w-full h-full"
          >
            <PreviewBoundsUpdater center={cityCenter} pins={pins} />
            {pins.map((pin) => (
              <React.Fragment key={pin.name}>
                <Circle
                  center={pin.position}
                  radius={1600}
                  strokeColor="#0f766e"
                  strokeOpacity={0.75}
                  strokeWeight={1.5}
                  fillColor="#14b8a6"
                  fillOpacity={0.14}
                />
                <AdvancedMarker
                  position={pin.position}
                  title={`${pin.name}, ${city}`}
                >
                  <Pin
                    background="#0f766e"
                    borderColor="#134e4a"
                    glyphColor="#ffffff"
                    scale={0.95}
                  />
                </AdvancedMarker>
              </React.Fragment>
            ))}
          </GoogleMap>
        )}
      </div>
    </div>
  );
};

/**
 * Autocomplete-powered inner search bar when APIProvider is mounted
 */
const GooglePlacesAutocompleteQuery: React.FC<{
  city: string;
  query: string;
  enabled: boolean;
  onSelectPlaceSuggestion: (name: string, coords?: google.maps.LatLngLiteral) => void;
}> = ({ city, query, enabled, onSelectPlaceSuggestion }) => {
  const placesLib = useMapsLibrary('places');
  const { suggestions, isLoading, resetSession } = useAutocompleteSuggestions(
    query,
    {
      cityContext: city,
      enabled,
      minLength: 2,
    }
  );
  const [selectingIdx, setSelectingIdx] = useState<number | null>(null);

  if (!enabled || query.trim().length < 2) return null;

  const handlePick = async (
    suggestion: google.maps.places.AutocompleteSuggestion,
    idx: number
  ) => {
    const prediction = suggestion.placePrediction;
    if (!prediction || !placesLib) return;

    setSelectingIdx(idx);
    try {
      const place = prediction.toPlace();
      await place.fetchFields({
        fields: ['location', 'displayName', 'formattedAddress'],
      });

      const rawLabel =
        place.displayName ||
        prediction.mainText?.text ||
        prediction.text?.text?.split(',')[0] ||
        '';
      const cleanName = rawLabel.trim().slice(0, VALIDATION_LIMITS.coloniaMaxLength);
      const loc = place.location;
      const coords = loc ? { lat: loc.lat(), lng: loc.lng() } : undefined;

      if (cleanName) {
        if (coords) {
          setCachedCoordinate(`${cleanName}, ${city}, México`, coords);
        }
        onSelectPlaceSuggestion(cleanName, coords);
      }
      resetSession();
    } catch (err) {
      reportGmpQuotaIfExceeded(err);
    } finally {
      setSelectingIdx(null);
    }
  };

  if (!isLoading && suggestions.length === 0) return null;

  return (
    <div className="border-t border-slate-100">
      <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
        <span>Sugerencias de Google Maps en {city}</span>
        {isLoading && <Loader2 className="w-3 h-3 animate-spin text-teal-700" />}
      </div>
      {suggestions.slice(0, 5).map((suggestion, idx) => {
        const mainText =
          suggestion.placePrediction?.mainText?.text ||
          suggestion.placePrediction?.text?.text ||
          '';
        const secondaryText =
          suggestion.placePrediction?.secondaryText?.text || '';
        return (
          <button
            key={`${mainText}-${idx}`}
            type="button"
            disabled={selectingIdx === idx}
            onMouseDown={(e) => {
              e.preventDefault();
              void handlePick(suggestion, idx);
            }}
            className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-teal-50/70 flex items-center justify-between gap-2 border-t border-slate-100 first:border-t-0 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="font-medium text-slate-900 truncate">{mainText}</p>
              {secondaryText && (
                <p className="text-[11px] text-slate-500 truncate">
                  {secondaryText}
                </p>
              )}
            </div>
            {selectingIdx === idx ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-700 shrink-0" />
            ) : (
              <Plus className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export const ColoniaSmartSelector: React.FC<ColoniaSmartSelectorProps> = ({
  city,
  selectedColonias,
  onChange,
  maxCount = VALIDATION_LIMITS.coloniaMaxCount,
  allowMapPreview = true,
  defaultShowMap = true,
  inputId = 'smart-colonia-search',
}) => {
  const apiContext = useContext(APIProviderContext);
  const mapsUnavailable = useGmpUnavailable();
  const hasMapsProvider = Boolean(apiContext) && !mapsUnavailable;

  const [query, setQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showMap, setShowMap] = useState(defaultShowMap);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const catalogMatches = useMemo(
    () => filterCityColonias(city, query, selectedColonias),
    [city, query, selectedColonias]
  );

  const quickPickColonias = useMemo(() => {
    const selectedLower = new Set(
      selectedColonias.map((c) => c.trim().toLowerCase())
    );
    return getPopularColoniasForCity(city)
      .filter((c) => !selectedLower.has(c.toLowerCase()))
      .slice(0, 6);
  }, [city, selectedColonias]);

  const addColonia = (rawName: string) => {
    const clean = rawName.trim().slice(0, VALIDATION_LIMITS.coloniaMaxLength);
    if (clean.length < 2) return;
    if (selectedColonias.length >= maxCount) return;
    const exists = selectedColonias.some(
      (c) => c.toLowerCase() === clean.toLowerCase()
    );
    if (exists) {
      setQuery('');
      setDropdownOpen(false);
      return;
    }
    onChange([...selectedColonias, clean]);
    setQuery('');
    setDropdownOpen(false);
  };

  const removeColonia = (coloniaToRemove: string) => {
    onChange(selectedColonias.filter((c) => c !== coloniaToRemove));
  };

  const canAddCustom =
    query.trim().length >= 2 &&
    selectedColonias.length < maxCount &&
    !selectedColonias.some(
      (c) => c.toLowerCase() === query.trim().toLowerCase()
    ) &&
    !catalogMatches.some(
      (c) => c.toLowerCase() === query.trim().toLowerCase()
    );

  const atLimit = selectedColonias.length >= maxCount;

  return (
    <div ref={containerRef} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-slate-700"
        >
          Colonias o zonas disponibles en {city} (máx. {maxCount}) *
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            {selectedColonias.length} / {maxCount} seleccionadas
          </span>
          {allowMapPreview && hasMapsProvider && (
            <button
              type="button"
              onClick={() => setShowMap((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-800 cursor-pointer"
            >
              {showMap ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Ocultar mapa</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Visualizar en mapa</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Smart Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
        <input
          id={inputId}
          type="text"
          value={query}
          disabled={atLimit}
          onFocus={() => setDropdownOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setDropdownOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (catalogMatches.length > 0 && query.trim().length > 0) {
                addColonia(catalogMatches[0]);
              } else if (canAddCustom) {
                addColonia(query);
              }
            } else if (e.key === 'Escape') {
              setDropdownOpen(false);
            }
          }}
          placeholder={
            atLimit
              ? `Límite de ${maxCount} zonas alcanzado`
              : `Buscar colonia, alcaldía o zona en ${city}...`
          }
          className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-700 disabled:bg-slate-50 disabled:text-slate-400"
        />
        {query && (
          <button
            type="button"
            aria-label="Limpiar búsqueda de colonia"
            onClick={() => setQuery('')}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Dropdown Results */}
        {dropdownOpen && !atLimit && (
          <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-72 overflow-y-auto">
            {catalogMatches.length > 0 && (
              <div>
                <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Zonas frecuentes en {city}
                </div>
                {catalogMatches.slice(0, 8).map((colonia) => (
                  <button
                    key={colonia}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addColonia(colonia);
                    }}
                    className="w-full text-left px-3.5 py-2 text-sm text-slate-800 hover:bg-teal-50/70 flex items-center justify-between gap-2 border-t border-slate-100 first:border-t-0 cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <span className="truncate">{colonia}</span>
                    </span>
                    <Plus className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {hasMapsProvider && (
              <GooglePlacesAutocompleteQuery
                city={city}
                query={query}
                enabled={dropdownOpen && !atLimit}
                onSelectPlaceSuggestion={(name) => addColonia(name)}
              />
            )}

            {canAddCustom && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addColonia(query);
                }}
                className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-teal-800 bg-teal-50/60 hover:bg-teal-100/70 flex items-center gap-2 border-t border-slate-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>Agregar &ldquo;{query.trim()}&rdquo; como zona en {city}</span>
              </button>
            )}

            {catalogMatches.length === 0 && !canAddCustom && query.trim().length < 2 && (
              <p className="px-3.5 py-3 text-xs text-slate-500">
                Escribe el nombre de una colonia en {city} para buscar o agregarla.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Selected Colonias List */}
      {selectedColonias.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedColonias.map((colonia) => (
            <span
              key={colonia}
              className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-xs font-medium text-teal-900"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span>{colonia}</span>
              <button
                type="button"
                aria-label={`Quitar ${colonia}`}
                onClick={() => removeColonia(colonia)}
                className="p-0.5 rounded hover:bg-teal-200/70 text-teal-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-amber-700">
          Selecciona al menos una colonia en {city} para que los clientes puedan encontrarte.
        </p>
      )}

      {/* Quick Suggestions for Active City */}
      {!atLimit && quickPickColonias.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-medium text-slate-500 mr-1">
            Sugeridas en {city}:
          </span>
          {quickPickColonias.map((colonia) => (
            <button
              key={colonia}
              type="button"
              onClick={() => addColonia(colonia)}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:border-teal-600 hover:bg-teal-50/60 text-xs text-slate-700 transition-colors cursor-pointer"
            >
              + {colonia}
            </button>
          ))}
        </div>
      )}

      {/* Live Map Visualization of Selected Service Zones */}
      {allowMapPreview && hasMapsProvider && showMap && (
        <ColoniaCoverageMapInner
          city={city}
          selectedColonias={selectedColonias}
        />
      )}
    </div>
  );
};
