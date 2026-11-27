import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Menu, X } from 'lucide-react';

export type ActiveSection =
  | 'explorar'
  | 'como-funciona'
  | 'anunciate'
  | 'mis-reservas'
  | 'mi-perfil'
  | 'base-datos'
  | 'planes'
  | 'nosotros'
  | 'seguridad'
  | 'faq'
  | 'contacto'
  | 'terminos'
  | 'privacidad'
  | 'blog'
  | 'cotizador'
  | 'limpieza-en-cdmx'
  | 'limpieza-en-ecatepec'
  | 'limpieza-en-guadalajara'
  | 'limpieza-en-monterrey'
  | 'limpieza-en-puebla'
  | 'limpieza-en-queretaro'
  | 'limpieza-en-merida'
  | 'notfound';

/** Secciones que son páginas informativas (sin sesión requerida). */
export const INFO_SECTIONS: ActiveSection[] = [
  'planes',
  'nosotros',
  'seguridad',
  'faq',
  'contacto',
  'terminos',
  'privacidad',
  'blog',
  'cotizador',
  'limpieza-en-cdmx',
  'limpieza-en-ecatepec',
  'limpieza-en-guadalajara',
  'limpieza-en-monterrey',
  'limpieza-en-puebla',
  'limpieza-en-queretaro',
  'limpieza-en-merida',
  'notfound',
];

interface HeaderProps {
  activeSection: ActiveSection;
  onNavigate: (section: ActiveSection) => void;
  user: User | null;
  profileFirstName?: string;
  isAdmin: boolean;
  onSignIn: () => void;
  authLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onNavigate,
  user,
  profileFirstName,
  isAdmin,
  onSignIn,
  authLoading,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActiveSection; label: string }[] = isAdmin
    ? [
        { id: 'explorar', label: 'Explorar' },
        { id: 'anunciate', label: 'Anúnciate' },
        { id: 'mis-reservas', label: 'Mis reservas' },
        { id: 'mi-perfil', label: 'Mi perfil' },
        { id: 'base-datos', label: 'Base de datos' },
      ]
    : [
        { id: 'explorar', label: 'Explorar' },
        { id: 'como-funciona', label: 'Cómo funciona' },
        { id: 'planes', label: 'Planes' },
        { id: 'anunciate', label: 'Anúnciate' },
        { id: 'mis-reservas', label: 'Mis reservas' },
      ];

  const handleNavClick = (id: ActiveSection) => {
    setMobileMenuOpen(false);
    onNavigate(id);
  };

  const firstName =
    profileFirstName || user?.displayName?.split(' ')[0] || 'Mi cuenta';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#/explorar"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('explorar');
          }}
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
        >
          LimpiaMX
        </a>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-6"
        >
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#/${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id);
                }}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 ${
                  isActive
                    ? 'text-teal-700 border-teal-700'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <button
              type="button"
              onClick={() => handleNavClick('mi-perfil')}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              {firstName}
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              disabled={authLoading}
              className="px-4 py-2 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 disabled:opacity-60 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              {authLoading ? 'Conectando...' : 'Iniciar sesión'}
            </button>
          )}

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeSection === item.id
                  ? 'bg-teal-50 text-teal-800'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
