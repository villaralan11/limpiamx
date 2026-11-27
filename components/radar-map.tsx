'use client';

import { Crosshair, MapPin, Navigation, Radar, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Professional } from '@/data/site';
import { normalizeText } from '@/lib/utils';

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  CDMX: { lat: 19.4326, lng: -99.1332 },
  Ecatepec: { lat: 19.6018, lng: -99.0507 },
  Guadalajara: { lat: 20.6736, lng: -103.344 },
  Monterrey: { lat: 25.6866, lng: -100.3161 },
  Puebla: { lat: 19.0414, lng: -98.2063 },
  Querétaro: { lat: 20.5888, lng: -100.3899 },
  Mérida: { lat: 20.9674, lng: -89.5926 },
};

const radiusOptions = [3, 5, 10, 20, 50];

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const earthRadius = 6371;
  const latDelta = ((b.lat - a.lat) * Math.PI) / 180;
  const lngDelta = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const value = Math.sin(latDelta / 2) ** 2 + Math.sin(lngDelta / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function professionalPoint(professional: Professional, index: number) {
  const center = CITY_CENTERS[professional.city] ?? CITY_CENTERS.CDMX;
  const zoneOffset = (professional.zones.length ? professional.zones.length : 1) * 0.003;
  const angle = ((index * 137.5) % 360) * (Math.PI / 180);
  return {
    lat: center.lat + Math.sin(angle) * zoneOffset,
    lng: center.lng + Math.cos(angle) * zoneOffset,
  };
}

function markerPosition(point: { lat: number; lng: number }, center: { lat: number; lng: number }) {
  const x = 50 + (point.lng - center.lng) * 240;
  const y = 50 - (point.lat - center.lat) * 240;
  return { left: `${Math.max(7, Math.min(93, x))}%`, top: `${Math.max(10, Math.min(90, y))}%` };
}

export function RadarMap({ professionals, city }: { professionals: Professional[]; city: string }) {
  const [radius, setRadius] = useState(10);
  const [zoneQuery, setZoneQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userCenter, setUserCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState('');

  const center = userCenter ?? CITY_CENTERS[city] ?? CITY_CENTERS.CDMX;
  const centerLabel = userCenter ? 'Tu ubicación actual' : city === 'Todas' ? 'CDMX y zona metropolitana' : city;
  const indexed = useMemo(() => professionals.map((professional, index) => ({ professional, point: professionalPoint(professional, index) })), [professionals]);
  const zoneMatches = useMemo(() => {
    const query = normalizeText(zoneQuery.trim());
    if (!query) return professionals;
    return professionals.filter((professional) => normalizeText(professional.zones.join(' ')).includes(query));
  }, [professionals, zoneQuery]);
  const visible = useMemo(() => {
    const allowed = new Set(zoneMatches.map((professional) => professional.id));
    return indexed.filter(({ professional, point }) => {
      if (!allowed.has(professional.id)) return false;
      if (!userCenter && city === 'Todas') return true;
      return distanceKm(center, point) <= radius;
    });
  }, [center, city, indexed, radius, userCenter, zoneMatches]);
  const selected = visible.find(({ professional }) => professional.id === selectedId)?.professional;

  function detectLocation() {
    setLocationStatus('Solicitando permiso…');
    if (!navigator.geolocation) {
      setLocationStatus('Tu navegador no permite geolocalización. Puedes buscar una colonia.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserCenter({ lat: coords.latitude, lng: coords.longitude });
        setLocationStatus('Centro actualizado con tu ubicación.');
      },
      () => setLocationStatus('No pudimos obtener tu ubicación. Puedes buscar una colonia o ciudad.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  return (
    <section className="radar-shell" aria-label="Mapa radar de profesionales">
      <div className="radar-toolbar">
        <div className="radar-heading">
          <span className="radar-icon"><Radar size={18} aria-hidden="true" /></span>
          <div><strong>Radar de profesionales cercanos</strong><span>{centerLabel} · radio de {radius} km</span></div>
        </div>
        <div className="radar-actions">
          <button className="btn btn-secondary btn-small" type="button" onClick={detectLocation}><Crosshair size={15} /> Usar mi ubicación</button>
          <label className="radar-radius">Radio
            <select value={radius} onChange={(event) => setRadius(Number(event.target.value))} aria-label="Radio de búsqueda">
              {radiusOptions.map((value) => <option value={value} key={value}>{value} km</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="radar-search-row">
        <Search size={16} aria-hidden="true" />
        <input value={zoneQuery} onChange={(event) => setZoneQuery(event.target.value)} placeholder="Centrar o filtrar por colonia: Roma, Providencia, Cumbres…" aria-label="Buscar por colonia" />
        {zoneQuery && <button type="button" className="radar-clear" onClick={() => setZoneQuery('')} aria-label="Limpiar colonia"><X size={15} /></button>}
        <span className="radar-availability">{visible.length} dentro del radar</span>
      </div>
      {locationStatus && <p className="radar-status" role="status"><Navigation size={14} /> {locationStatus}</p>}
      <div className="radar-map" role="img" aria-label={`Radar visual con ${visible.length} profesionales en ${centerLabel}`}>
        <div className="map-label map-label-one">Zonas de servicio</div>
        <div className="map-label map-label-two">Busca por colonia y ajusta el radio</div>
        <div className="radar-ring radar-ring-large" /><div className="radar-ring radar-ring-medium" /><div className="radar-ring radar-ring-small" />
        <div className="radar-crosshair" />
        <span className="radar-center" style={{ left: '50%', top: '50%' }}><Crosshair size={17} /></span>
        {visible.map(({ professional, point }) => {
          const position = markerPosition(point, center);
          return <button type="button" key={professional.id} className={`radar-marker ${selectedId === professional.id ? 'is-selected' : ''}`} style={position} onClick={() => setSelectedId(professional.id)} aria-label={`Ver a ${professional.name}`}><MapPin size={19} fill="currentColor" /><span>{professional.name.split(' ')[0]}</span></button>;
        })}
        {!visible.length && <div className="radar-empty"><MapPin size={22} /><strong>No hay perfiles en esta búsqueda</strong><span>Prueba otra colonia o aumenta el radio.</span></div>}
        {selected && <div className="radar-popover"><button type="button" className="radar-popover-close" onClick={() => setSelectedId(null)} aria-label="Cerrar detalle"><X size={15} /></button><span className="eyebrow">{selected.verified ? 'Verificado' : 'Perfil activo'}</span><strong>{selected.name}</strong><span>{selected.business} · ${selected.rate} MXN/h</span><small>{selected.zones.slice(0, 2).join(' · ')}</small><a className="btn btn-primary btn-small" href={`/profesionales/${selected.id}`}>Ver perfil</a></div>}
      </div>
      <div className="radar-footer"><span><MapPin size={14} /> Los puntos se muestran por zona de servicio; la dirección exacta se comparte solo al confirmar una reserva.</span><span className="radar-provider-note">Google Maps se puede activar con API key; este radar permanece disponible sin cuota externa.</span></div>
    </section>
  );
}
