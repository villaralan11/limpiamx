'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { navigation } from '@/data/site';
import { GoogleSignInButton } from '@/components/google-sign-in-button';

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="shell">
        <div className="header-inner">
          <Link href="/" className="logo" aria-label="LimpiaMX, inicio">
            <span className="logo-mark" aria-hidden="true">LM</span>
            <span className="logo-word">Limpia<span>MX</span></span>
          </Link>
          <nav className="nav-links" aria-label="Navegación principal">
            {navigation.map((item) => <Link key={item.href} href={item.href} className="nav-link">{item.label}</Link>)}
          </nav>
          <div className="header-actions">
            <Link href="/cuenta/reservas" className="btn btn-secondary btn-small">Mi cuenta</Link>
            <GoogleSignInButton compact />
            <button type="button" className="mobile-toggle" aria-expanded={open} aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setOpen((value) => !value)}>
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        <nav className={`mobile-menu ${open ? 'open' : ''}`} aria-label="Navegación móvil">
          {navigation.map((item) => <Link key={item.href} href={item.href} className="nav-link" onClick={() => setOpen(false)}>{item.label}</Link>)}
          <Link href="/cuenta/reservas" className="nav-link" onClick={() => setOpen(false)}>Mi cuenta</Link>
          <GoogleSignInButton />
        </nav>
      </div>
    </header>
  );
}
