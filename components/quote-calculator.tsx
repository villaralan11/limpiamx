'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, Calculator, Check } from 'lucide-react';
import Link from 'next/link';
import { cities } from '@/data/site';

export function QuoteCalculator() {
  const [squareMeters, setSquareMeters] = useState(70);
  const [rooms, setRooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [type, setType] = useState('Hogar');
  const [frequency, setFrequency] = useState('Una vez');
  const [supplies, setSupplies] = useState(true);
  const [city, setCity] = useState('CDMX');
  const estimate = useMemo(() => {
    const base = Math.max(2.5, squareMeters / 28 + rooms * .35 + bathrooms * .45);
    const multiplier = type === 'Profunda' ? 1.32 : type === 'Post-obra' ? 1.5 : type === 'Airbnb' ? .86 : type === 'Oficina' ? 1.1 : 1;
    const frequencyFactor = frequency === 'Semanal' ? .9 : frequency === 'Quincenal' ? .95 : 1;
    const hours = Math.max(3, Math.round(base * multiplier * 2) / 2);
    const cityFactor = city === 'CDMX' || city === 'Monterrey' ? 245 : city === 'Ecatepec' ? 185 : 220;
    const low = Math.round(hours * cityFactor * frequencyFactor / 10) * 10;
    const high = Math.round((hours + (type === 'Profunda' ? 1 : .75)) * (cityFactor + 35) * frequencyFactor + (supplies ? 0 : 0) / 10) * 10;
    return { hours, low, high };
  }, [squareMeters, rooms, bathrooms, type, frequency, supplies, city]);
  return <div className="quote-box" style={{ color: '#fff' }}><div><span className="eyebrow" style={{ color: 'var(--lime)' }}><Calculator size={14} /> Calculadora orientativa</span><h2>Empieza con un rango, no con una suposición.</h2><p>La estimación usa tamaño, habitaciones, baños, tipo de servicio y ciudad. No reemplaza la conversación con el profesional, pero te ayuda a llegar mejor preparado.</p><div style={{ display: 'grid', gap: 8, marginTop: 28, color: 'rgba(255,255,255,.72)', fontSize: 13 }}><span><Check size={15} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--lime)' }} />Sin registro para calcular</span><span><Check size={15} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--lime)' }} />Tarifas en pesos mexicanos</span><span><Check size={15} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--lime)' }} />Puedes ajustar cada dato</span></div></div><div className="form-card" style={{ color: 'var(--ink)' }}><div className="form-grid"><div className="field"><label htmlFor="m2">Metros cuadrados</label><input id="m2" type="number" min="15" max="1000" value={squareMeters} onChange={(event) => setSquareMeters(Number(event.target.value))} /></div><div className="field"><label htmlFor="rooms">Recámaras / espacios</label><input id="rooms" type="number" min="0" max="20" value={rooms} onChange={(event) => setRooms(Number(event.target.value))} /></div><div className="field"><label htmlFor="bathrooms">Baños</label><input id="bathrooms" type="number" min="1" max="15" value={bathrooms} onChange={(event) => setBathrooms(Number(event.target.value))} /></div><div className="field"><label htmlFor="city">Ciudad</label><select id="city" value={city} onChange={(event) => setCity(event.target.value)}>{cities.map((item) => <option value={item.name} key={item.slug}>{item.name}</option>)}</select></div><div className="field"><label htmlFor="type">Tipo de servicio</label><select id="type" value={type} onChange={(event) => setType(event.target.value)}><option>Hogar</option><option>Profunda</option><option>Oficina</option><option>Airbnb</option><option>Post-obra</option></select></div><div className="field"><label htmlFor="frequency">Frecuencia</label><select id="frequency" value={frequency} onChange={(event) => setFrequency(event.target.value)}><option>Una vez</option><option>Semanal</option><option>Quincenal</option></select></div><label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 9, color: 'var(--ink-soft)', fontSize: 13 }}><input type="checkbox" checked={supplies} onChange={(event) => setSupplies(event.target.checked)} /> Necesito que lleven sus propios insumos</label></div><div className="quote-result" style={{ marginTop: 24, background: 'var(--teal-950)' }}><span className="font-mono" style={{ color: 'rgba(255,255,255,.64)', fontSize: 11 }}>RANGO ESTIMADO</span><strong>${estimate.low.toLocaleString('es-MX')}–${estimate.high.toLocaleString('es-MX')}</strong><span style={{ color: 'rgba(255,255,255,.68)', fontSize: 13 }}>{estimate.hours} horas aproximadas · {city}</span></div><Link href="/explorar" className="btn btn-primary" style={{ width: '100%', marginTop: 14 }}>Comparar profesionales <ArrowUpRight size={16} /></Link></div></div>;
}
