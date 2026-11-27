import type { Metadata } from 'next';
import { AccountGate } from '@/components/account-gate';
import { ProfilePanel } from '@/components/account-panels';

export const metadata: Metadata = { title: 'Mi perfil', robots: { index: false } };

export default function Page() {
  return <AccountGate area="Tu perfil" title="Tu información también cuenta." description="Completa tus datos, elige cómo usar LimpiaMX y mantén tus conversaciones con contexto."><ProfilePanel /></AccountGate>;
}
