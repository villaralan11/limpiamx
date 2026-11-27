'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, CalendarDays, LogOut, UserRound } from 'lucide-react';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { signOutGoogle } from '@/lib/firebase';
import { useAuthUser } from '@/components/use-auth-user';

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export function AccountGate({ title, description, area, children }: { title: string; description: string; area: string; children?: ReactNode }) {
  const { user, loading } = useAuthUser();

  if (loading) {
    return <section className="section"><div className="shell" style={{ maxWidth: 760 }}><div className="form-card account-loading" aria-live="polite"><span className="service-icon"><UserRound size={23} /></span><p>Comprobando tu sesión…</p></div></div></section>;
  }

  if (user) {
    return <section className="section"><div className="shell" style={{ maxWidth: 960 }}>
      <div className="account-topline">
        <div><span className="eyebrow">{area}</span><h1 className="display-md" style={{ margin: '18px 0 10px' }}>{title}</h1><p className="lede" style={{ margin: 0, maxWidth: 650 }}>{description}</p></div>
        <div className="account-user"><span className="avatar">{initials(user.displayName || user.email || 'LM')}</span><span><strong>{user.displayName || 'Cuenta LimpiaMX'}</strong><small>{user.email}</small></span><button className="btn btn-ghost btn-small" type="button" onClick={() => void signOutGoogle()}><LogOut size={14} /> Salir</button></div>
      </div>
      {children || <div className="form-card" style={{ marginTop: 28 }}><h2 className="display-md" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Tu espacio está listo.</h2><p className="lede">Elige si quieres consultar reservas, completar tu perfil o publicar tus servicios.</p></div>}
    </div></section>;
  }

  return <section className="section"><div className="shell" style={{ maxWidth: 760 }}><Link href="/" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><ArrowLeft size={15} /> Volver al inicio</Link><div className="form-card" style={{ marginTop: 28, textAlign: 'center', padding: '58px 28px' }}><span className="service-icon" style={{ margin: '0 auto 22px' }}><UserRound size={23} /></span><span className="eyebrow" style={{ justifyContent: 'center' }}>{area}</span><h1 className="display-md" style={{ margin: '18px auto 14px' }}>{title}</h1><p className="lede" style={{ maxWidth: 540, margin: '0 auto 28px' }}>{description}</p><GoogleSignInButton /><p className="form-note" style={{ maxWidth: 450, margin: '16px auto 0' }}>Usamos Google/Gmail para mantener una cuenta sencilla y segura. No agregamos contraseñas propias.</p></div><div className="city-strip" style={{ marginTop: 16 }}><Link href="/cuenta/reservas" className="city-card"><CalendarDays size={18} color="var(--teal-700)" /><strong style={{ fontSize: 21, marginTop: 18 }}>Mis reservas</strong><span>Consulta tus solicitudes y próximas visitas.</span></Link><Link href="/cuenta/perfil" className="city-card"><BadgeCheck size={18} color="var(--teal-700)" /><strong style={{ fontSize: 21, marginTop: 18 }}>Mi perfil</strong><span>Completa tus datos y preferencias.</span></Link></div></div></section>;
}
