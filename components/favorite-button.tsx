'use client';

import { Heart, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { isFavorite, removeFavorite, saveFavorite, signInWithGoogle } from '@/lib/firebase';
import { useAuthUser } from '@/components/use-auth-user';

export function FavoriteButton({ professionalId, compact = false }: { professionalId: string; compact?: boolean }) {
  const { user } = useAuthUser();
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) { setActive(false); return; }
    void isFavorite(user.uid, professionalId).then(setActive).catch(() => undefined);
  }, [professionalId, user]);

  async function toggle() {
    setLoading(true); setMessage('');
    try {
      let currentUser = user;
      if (!currentUser) currentUser = (await signInWithGoogle()).user;
      if (active) { await removeFavorite(currentUser.uid, professionalId); setActive(false); setMessage('Quitado de favoritos'); }
      else { await saveFavorite(currentUser.uid, professionalId); setActive(true); setMessage('Guardado en favoritos'); }
    } catch { setMessage('No pudimos guardar el favorito'); }
    finally { setLoading(false); }
  }

  return <button type="button" className={`favorite-button ${active ? 'is-active' : ''} ${compact ? 'is-compact' : ''}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void toggle(); }} aria-label={active ? 'Quitar de favoritos' : 'Guardar en favoritos'} aria-pressed={active} title={message || (active ? 'Quitar de favoritos' : 'Guardar en favoritos')} disabled={loading}>{loading ? <LoaderCircle size={compact ? 16 : 18} className="animate-spin" /> : <Heart size={compact ? 16 : 18} fill={active ? 'currentColor' : 'none'} />} {!compact && <span>{active ? 'Guardado' : 'Guardar'}</span>}</button>;
}
