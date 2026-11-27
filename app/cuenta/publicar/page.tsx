import type { Metadata } from 'next';
import { AccountGate } from '@/components/account-gate';
import { PublishPanel } from '@/components/account-panels';

export const metadata: Metadata = { title: 'Publicar servicio', robots: { index: false } };

export default function Page() {
  return <AccountGate area="Para profesionales" title="Haz visible tu forma de trabajar." description="Publica tus zonas, servicios, tarifa y disponibilidad para que más personas te encuentren."><PublishPanel /></AccountGate>;
}
