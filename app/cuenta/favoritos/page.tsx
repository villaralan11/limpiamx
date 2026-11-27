import type { Metadata } from 'next';
import { AccountGate } from '@/components/account-gate';
import { FavoritesPanel } from '@/components/favorites-panel';

export const metadata: Metadata = { title: 'Mis favoritos' };

export default function FavoritesPage() {
  return <AccountGate area="Tu cuenta" title="Perfiles que quieres volver a ver." description="Guarda opciones, compáralas con calma y abre una conversación cuando el momento sea el correcto." ><FavoritesPanel /></AccountGate>;
}
