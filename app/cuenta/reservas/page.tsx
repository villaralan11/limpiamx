import type { Metadata } from 'next';
import { AccountGate } from '@/components/account-gate';
import { BookingPanel } from '@/components/booking-panel';
import { SafetyActions } from '@/components/safety-actions';

export const metadata: Metadata = { title: 'Mis reservas', robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ profesional?: string }> }) {
  const params = await searchParams;
  return <AccountGate area="Área personal" title="Tus reservas, en un solo lugar." description="Consulta solicitudes, fechas y conversaciones con una trazabilidad clara."><BookingPanel defaultProfessional={params.profesional ?? ''} /><SafetyActions /></AccountGate>;
}
