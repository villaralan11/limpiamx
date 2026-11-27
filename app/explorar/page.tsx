import type { Metadata } from 'next';
import { ExplorerClient } from '@/components/explorer-client';

export const metadata: Metadata = { title: 'Explorar profesionales de limpieza', description: 'Compara profesionales de limpieza por ciudad, colonia, servicio, tarifa y experiencia en LimpiaMX.' };

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string; ciudad?: string; servicio?: string }> }) {
  const params = await searchParams;
  return <><section className="page-hero"><div className="shell"><span className="eyebrow">Elige con contexto</span><h1>Un buen match empieza por los detalles.</h1><p>Compara perfiles, tarifas y zonas de servicio. Cuando encuentres a alguien que te haga sentido, abre su perfil y escríbele directamente.</p></div></section><section className="section"><div className="shell"><ExplorerClient initialQuery={params.q} initialCity={params.ciudad} initialService={params.servicio} /></div></section></>;
}
