'use client';

import { Heart, LoaderCircle, MapPin, Star } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { professionals } from '@/data/site';
import { loadFavorites } from '@/lib/firebase';
import { useAuthUser } from '@/components/use-auth-user';
import { FavoriteButton } from '@/components/favorite-button';

export function FavoritesPanel() {
  const { user } = useAuthUser();
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    void loadFavorites(user.uid).then(setIds).catch(() => setError('No pudimos cargar tus favoritos. Revisa las reglas de Firestore.')).finally(() => setLoading(false));
  }, [user]);

  const saved = professionals.filter((professional) => ids.includes(professional.id));
  if (loading) return <div className="form-card account-loading"><LoaderCircle size={22} className="animate-spin" /><p>Buscando tus perfiles guardados…</p></div>;
  if (error) return <div className="form-card"><p className="field-error" role="alert">{error}</p></div>;
  if (!saved.length) return <div className="form-card favorites-empty"><span className="service-icon"><Heart size={22} /></span><h2>Aún no guardas perfiles.</h2><p>Cuando encuentres a alguien que te haga sentido, toca el corazón. Tus perfiles quedarán aquí para volver a compararlos.</p><Link href="/explorar" className="btn btn-primary">Explorar profesionales</Link></div>;
  return <div className="favorites-list">{saved.map((professional) => <article className="favorite-row" key={professional.id}><img src={professional.photo} alt={`Retrato de ${professional.name}`} /><div className="favorite-row-copy"><div><span className="eyebrow">{professional.city}</span><h2><Link href={`/profesionales/${professional.id}`}>{professional.name}</Link></h2></div><p>{professional.headline}</p><div className="favorite-meta"><span><MapPin size={13} /> {professional.zones.slice(0, 2).join(' · ')}</span><span><Star size={13} fill="currentColor" /> {professional.rating} · ${professional.rate} MXN/h</span></div></div><FavoriteButton professionalId={professional.id} compact /></article>)}</div>;
}
