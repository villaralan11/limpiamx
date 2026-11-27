import { useCallback, useEffect, useRef, useState } from 'react';
import {
  APILoadingStatus,
  useApiLoadingStatus,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';

export const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() ||
  '';

export const GMP_ATTRIBUTION_IDS: string[] = ['gmp_mcp_codeassist_v1_aistudio'];

const COORD_STORAGE_KEY = 'limpiamx_gmp_coord_cache_v1';

// Plain object dictionaries (never shadow global Map in React Google Maps modules)
const memoryCoordCache: Record<string, google.maps.LatLngLiteral> = {};
const inflightCoordRequests: Record<
  string,
  Promise<google.maps.LatLngLiteral | null>
> = {};
let storageHydrated = false;
let gmpUnavailableFlag = false;

export function isGmpUnavailable(): boolean {
  return (
    gmpUnavailableFlag ||
    (typeof window !== 'undefined' &&
      Boolean((window as unknown as { __gmpUnavailable?: boolean }).__gmpUnavailable))
  );
}

export function markGmpUnavailable(): void {
  if (gmpUnavailableFlag) return;
  gmpUnavailableFlag = true;
  if (typeof window !== 'undefined') {
    (window as unknown as { __gmpUnavailable?: boolean }).__gmpUnavailable = true;
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
}

export function useGmpUnavailable(): boolean {
  const apiStatus = useApiLoadingStatus();
  const [unavailable, setUnavailable] = useState<boolean>(() => isGmpUnavailable());

  useEffect(() => {
    if (isGmpUnavailable()) {
      setUnavailable(true);
    }
    const onQuotaOrAuth = () => setUnavailable(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaOrAuth);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', onQuotaOrAuth);
    };
  }, []);

  useEffect(() => {
    if (
      apiStatus === APILoadingStatus.AUTH_FAILURE ||
      apiStatus === APILoadingStatus.FAILED
    ) {
      markGmpUnavailable();
      setUnavailable(true);
    }
  }, [apiStatus]);

  return unavailable;
}

function hydrateCoordCache(): void {
  if (storageHydrated || typeof window === 'undefined') return;
  storageHydrated = true;
  try {
    const raw = window.sessionStorage.getItem(COORD_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, google.maps.LatLngLiteral>;
    for (const [key, val] of Object.entries(parsed)) {
      if (
        val &&
        typeof val.lat === 'number' &&
        typeof val.lng === 'number' &&
        Number.isFinite(val.lat) &&
        Number.isFinite(val.lng)
      ) {
        memoryCoordCache[key] = val;
      }
    }
  } catch {
    // Ignore storage parse errors
  }
}

function persistCoordToSession(
  key: string,
  coords: google.maps.LatLngLiteral
): void {
  memoryCoordCache[key] = coords;
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(
      COORD_STORAGE_KEY,
      JSON.stringify(memoryCoordCache)
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function getCachedCoordinate(
  query: string
): google.maps.LatLngLiteral | null {
  hydrateCoordCache();
  const key = query.trim().toLowerCase();
  return memoryCoordCache[key] ?? null;
}

export function setCachedCoordinate(
  query: string,
  coords: google.maps.LatLngLiteral
): void {
  hydrateCoordCache();
  const key = query.trim().toLowerCase();
  persistCoordToSession(key, coords);
}

/**
 * Tier 2 Quota Defense: inspects Places / Maps SDK errors and notifies
 * the top-level App banner if quota is exhausted.
 */
export function reportGmpQuotaIfExceeded(err: unknown): boolean {
  const raw =
    typeof err === 'object' && err !== null
      ? JSON.stringify(err) +
        ' ' +
        String((err as { message?: string }).message ?? '') +
        ' ' +
        String((err as { code?: string }).code ?? '') +
        ' ' +
        String((err as { status?: string | number }).status ?? '')
      : String(err ?? '');

  const upper = raw.toUpperCase();
  const hitQuotaOrAuth =
    upper.includes('RESOURCE_EXHAUSTED') ||
    upper.includes('OVER_QUERY_LIMIT') ||
    upper.includes('OVERQUOTAMAPERROR') ||
    upper.includes('QUOTA_EXCEEDED') ||
    upper.includes('REFERER_NOT_ALLOWED') ||
    upper.includes('REFERERNOTALLOWED') ||
    upper.includes('API_NOT_ACTIVATED') ||
    upper.includes('APINOTACTIVATED') ||
    upper.includes('INVALID_KEY') ||
    upper.includes('INVALIDKEY') ||
    upper.includes('PERMISSION_DENIED') ||
    upper.includes('429');

  if (hitQuotaOrAuth) {
    markGmpUnavailable();
  }
  return hitQuotaOrAuth;
}

/**
 * Resolves a Mexican city/colonia query via Google Places API (New) Place.searchByText
 * with sessionStorage deduplication to avoid redundant requests.
 */
export async function resolvePlaceCoordinate(
  placesLib: google.maps.PlacesLibrary | null,
  query: string
): Promise<google.maps.LatLngLiteral | null> {
  const cleanQuery = query.trim();
  if (!cleanQuery || !placesLib) return null;

  const cacheKey = cleanQuery.toLowerCase();
  hydrateCoordCache();
  if (memoryCoordCache[cacheKey]) {
    return memoryCoordCache[cacheKey];
  }
  if (isGmpUnavailable()) {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(inflightCoordRequests, cacheKey)) {
    return inflightCoordRequests[cacheKey];
  }

  const requestPromise = (async (): Promise<google.maps.LatLngLiteral | null> => {
    try {
      const { places } = await placesLib.Place.searchByText({
        textQuery: cleanQuery,
        fields: ['location', 'displayName'],
        region: 'mx',
        language: 'es',
        maxResultCount: 1,
      });

      const first = places?.[0];
      const loc = first?.location;
      if (!loc) return null;

      const coords: google.maps.LatLngLiteral = {
        lat: loc.lat(),
        lng: loc.lng(),
      };
      persistCoordToSession(cacheKey, coords);
      return coords;
    } catch (err) {
      reportGmpQuotaIfExceeded(err);
      return null;
    } finally {
      delete inflightCoordRequests[cacheKey];
    }
  })();

  inflightCoordRequests[cacheKey] = requestPromise;
  return requestPromise;
}

export type UseAutocompleteSuggestionsReturn = {
  suggestions: google.maps.places.AutocompleteSuggestion[];
  isLoading: boolean;
  resetSession: () => void;
};

/**
 * Modern Places API (New) programmatic autocomplete hook using
 * AutocompleteSuggestion.fetchAutocompleteSuggestions + AutocompleteSessionToken.
 */
export function useAutocompleteSuggestions(
  inputString: string,
  options: {
    cityContext?: string;
    enabled?: boolean;
    minLength?: number;
  } = {}
): UseAutocompleteSuggestionsReturn {
  const { cityContext = '', enabled = true, minLength = 2 } = options;
  const placesLib = useMapsLibrary('places');

  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const resetSession = useCallback(() => {
    sessionTokenRef.current = null;
    setSuggestions([]);
  }, []);

  useEffect(() => {
    if (!placesLib || !enabled || isGmpUnavailable()) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const trimmed = inputString.trim();
    if (trimmed.length < minLength) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new AutocompleteSessionToken();
      }

      const scopedQuery =
        cityContext && !trimmed.toLowerCase().includes(cityContext.toLowerCase())
          ? `${trimmed}, ${cityContext}`
          : trimmed;

      setIsLoading(true);
      try {
        const res = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: scopedQuery,
          includedRegionCodes: ['mx'],
          language: 'es',
          region: 'mx',
          sessionToken: sessionTokenRef.current,
        });
        if (!cancelled) {
          setSuggestions(res.suggestions ?? []);
        }
      } catch (err) {
        reportGmpQuotaIfExceeded(err);
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 320);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [placesLib, inputString, cityContext, enabled, minLength]);

  return {
    suggestions,
    isLoading,
    resetSession,
  };
}

/**
 * Computes distance in kilometers using google.maps.geometry.spherical
 * with a clean fallback when the geometry library is still loading.
 */
export function computeDistanceKm(
  geometryLib: google.maps.GeometryLibrary | null,
  from: google.maps.LatLngLiteral,
  to: google.maps.LatLngLiteral
): number {
  if (geometryLib?.spherical?.computeDistanceBetween) {
    return geometryLib.spherical.computeDistanceBetween(from, to) / 1000;
  }

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) *
      Math.cos(toRad(to.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Deterministic tiny offset (~250m max) applied solely to separate markers
 * that resolve to the exact same colonia/city centroid on the map canvas.
 */
export function getMarkerSpreadOffset(
  seedId: string,
  duplicateIndex: number
): { latOffset: number; lngOffset: number } {
  if (duplicateIndex === 0) return { latOffset: 0, lngOffset: 0 };
  let hash = 0;
  for (let i = 0; i < seedId.length; i++) {
    hash = (hash * 31 + seedId.charCodeAt(i)) % 360;
  }
  const angleRad = ((hash + duplicateIndex * 75) * Math.PI) / 180;
  const radiusDeg = 0.0028 * Math.min(duplicateIndex, 4);
  return {
    latOffset: Math.sin(angleRad) * radiusDeg,
    lngOffset: Math.cos(angleRad) * radiusDeg,
  };
}
