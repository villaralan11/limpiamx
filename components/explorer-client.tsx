'use client';

import { Grid2x2, Map, Search, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cities, professionals, services } from '@/data/site';
import { filterProfessionals } from '@/lib/utils';
import { ProfessionalCard } from '@/components/professional-card';
import { RadarMap } from '@/components/radar-map';

type ExplorerProps = { initialQuery?: string; initialCity?: string; initialService?: string };

export function ExplorerClient({ initialQuery = '', initialCity = 'Todas', initialService = 'Todos' }: ExplorerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);
  const [service, setService] = useState(initialService);
  const [maxRate, setMaxRate] = useState('');
  const [suppliesOnly, setSuppliesOnly] = useState(false);
  const [view, setView] = useState<'cards' | 'map'>('cards');
  const serviceValues = { hogar: 'Hogar', profunda: 'Profunda', oficina: 'Oficina', airbnb: 'Airbnb', 'post-obra': 'Post-obra', planchado: 'Planchado' } as const;
  const results = useMemo(() => filterProfessionals(professionals, query, city, service === 'Todos' ? 'Todos' : service, maxRate, suppliesOnly), [query, city, service, maxRate, suppliesOnly]);
  function clear() { setQuery(''); setCity('Todas'); setService('Todos'); setMaxRate(''); setSuppliesOnly(false); }
  const hasFilters = Boolean(query || city !== 'Todas' || service !== 'Todos' || maxRate || suppliesOnly);
  return <div>
    <div className="filter-bar">
      <Search size={17} color="var(--teal-700)" aria-hidden="true" />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busca por nombre, colonia o tipo de servicio" aria-label="Buscar en el directorio" />
      <SlidersHorizontal size={17} color="var(--ink-soft)" aria-hidden="true" />
      <select value={city} onChange={(event) => setCity(event.target.value)} aria-label="Filtrar por ciudad"><option value="Todas">Todas las ciudades</option>{cities.map((item) => <option value={item.name} key={item.slug}>{item.name}</option>)}</select>
      <select value={service} onChange={(event) => setService(event.target.value)} aria-label="Filtrar por servicio"><option value="Todos">Todos los servicios</option>{services.map((item) => <option value={serviceValues[item.id]} key={item.id}>{item.title}</option>)}</select>
      <select value={maxRate} onChange={(event) => setMaxRate(event.target.value)} aria-label="Filtrar por tarifa máxima"><option value="">Cualquier tarifa</option><option value="200">Hasta $200/h</option><option value="240">Hasta $240/h</option><option value="280">Hasta $280/h</option></select>
      <label className="filter-check"><input type="checkbox" checked={suppliesOnly} onChange={(event) => setSuppliesOnly(event.target.checked)} /> Lleva insumos</label>
      {hasFilters && <button type="button" className="btn btn-ghost btn-small" onClick={clear}>Limpiar <X size={15} /></button>}
    </div>
    <div className="result-toolbar">
      <div className="result-meta"><span><strong style={{ color: 'var(--ink)' }}>{results.length}</strong> profesionales encontrados</span><span>Tarifas desde {results.length ? `$${Math.min(...results.map((item) => item.rate))} MXN/h` : '—'}</span></div>
      <div className="view-toggle" role="group" aria-label="Cambiar vista"><button type="button" className={view === 'cards' ? 'is-active' : ''} onClick={() => setView('cards')}><Grid2x2 size={15} /> Tarjetas</button><button type="button" className={view === 'map' ? 'is-active' : ''} onClick={() => setView('map')}><Map size={15} /> Mapa radar</button></div>
    </div>
    {view === 'map' ? <RadarMap professionals={results} city={city} /> : results.length ? <div className="card-grid">{results.map((professional) => <ProfessionalCard key={professional.id} professional={professional} />)}</div> : <div className="form-card" style={{ textAlign: 'center', padding: '60px 24px' }}><h2 className="font-display" style={{ fontSize: 32, margin: 0 }}>No encontramos ese perfil todavía.</h2><p className="lede" style={{ margin: '14px auto 24px', maxWidth: 490 }}>Prueba otra ciudad, zona o servicio. También puedes escribirnos y te ayudamos a encontrar una opción.</p><button type="button" className="btn btn-primary" onClick={clear}>Ver todos los perfiles</button></div>}
  </div>;
}
