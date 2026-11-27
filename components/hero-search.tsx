'use client';

import { MapPin, Search } from 'lucide-react';
import { useState } from 'react';
import { cities } from '@/data/site';
import { useRouter } from 'next/navigation';

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('Todas');
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (city !== 'Todas') params.set('ciudad', city);
    router.push(`/explorar${params.toString() ? `?${params}` : ''}`);
  }
  return <form className="search-panel" onSubmit={submit} aria-label="Buscar profesionales">
    <label className="search-field"><Search size={18} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="¿Qué necesitas limpiar?" aria-label="Buscar por nombre, zona o servicio" /></label>
    <label className="search-field"><MapPin size={18} aria-hidden="true" /><select value={city} onChange={(event) => setCity(event.target.value)} aria-label="Elegir ciudad"><option value="Todas">Toda la red</option>{cities.map((item) => <option value={item.name} key={item.slug}>{item.name}</option>)}</select></label>
    <button className="btn btn-primary" type="submit">Explorar</button>
  </form>;
}
