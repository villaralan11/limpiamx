import React from 'react';
import { CITIES_MX, CITY_SLUGS, CityMX } from '../types/marketplace';
import { SITE } from '../data/siteContent';
import { ActiveSection } from './Header';

interface FooterProps {
  onSelectCity: (city: CityMX) => void;
  onNavigate: (section: ActiveSection) => void;
}

const LINK =
  'text-left text-slate-300 hover:text-white transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500';

export const Footer: React.FC<FooterProps> = ({ onSelectCity, onNavigate }) => {
  const columns: {
    title: string;
    links: { label: string; section: ActiveSection }[];
  }[] = [
    {
      title: 'Plataforma',
      links: [
        { label: 'Explorar personal de limpieza', section: 'explorar' },
        { label: 'Cómo funciona', section: 'como-funciona' },
        { label: 'Anunciar mis servicios', section: 'anunciate' },
        { label: 'Mis reservas', section: 'mis-reservas' },
        { label: 'Planes y precios', section: 'planes' },
      ],
    },
    {
      title: 'Empresa',
      links: [
        { label: 'Sobre nosotros', section: 'nosotros' },
        { label: 'Confianza y seguridad', section: 'seguridad' },
        { label: 'Preguntas frecuentes', section: 'faq' },
        { label: 'Contacto', section: 'contacto' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Términos y condiciones', section: 'terminos' },
        { label: 'Aviso de privacidad', section: 'privacidad' },
      ],
    },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 pb-10 border-b border-slate-800">
          <div className="lg:col-span-4">
            <p className="font-display text-lg font-bold text-white mb-2">
              {SITE.name}
            </p>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Directorio y plataforma de contratación directa para servicios de
              limpieza residencial y comercial en México.
            </p>
            <div className="mt-4 space-y-1.5 text-sm">
              <p>
                <a
                  href={`mailto:${SITE.contactEmail}`}
                  className="text-slate-300 hover:text-white underline underline-offset-2"
                >
                  {SITE.contactEmail}
                </a>
              </p>
              <p>
                <a
                  href={`https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent('Hola, vengo de LimpiaMX.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white underline underline-offset-2 tabular-nums"
                >
                  WhatsApp: {SITE.whatsappDisplay}
                </a>
              </p>
            </div>
          </div>

          <nav
            aria-label="Pie de página"
            className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-8"
          >
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold text-white mb-3">{col.title}</p>
                <ul className="space-y-2 text-sm">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <button
                        type="button"
                        onClick={() => onNavigate(l.section)}
                        className={LINK}
                      >
                        {l.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="lg:col-span-3">
            <p className="text-sm font-semibold text-white mb-3">
              Ciudades con cobertura
            </p>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {CITIES_MX.map((city) => (
                <li key={city}>
                  <button
                    type="button"
                    onClick={() => onNavigate(CITY_SLUGS[city] as ActiveSection)}
                    className={LINK}
                    title={`Ver la página de limpieza en ${city}`}
                  >
                    Limpieza en {city}
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-sm font-semibold text-white mb-3 mt-6">
              Herramientas
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('cotizador')}
                  className={LINK}
                >
                  Cotizador de precio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('blog')}
                  className={LINK}
                >
                  Guías y precios
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('seguridad')}
                  className={LINK}
                >
                  Verificación y código de puerta
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Todos los precios en pesos
            mexicanos (MXN).
          </p>
          <p className="max-w-xl lg:text-right">{SITE.schoolNotice}</p>
        </div>
      </div>
    </footer>
  );
};
