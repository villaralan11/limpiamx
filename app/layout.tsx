import type { Metadata } from 'next';
import './globals.css';
import { MessageCircle } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { site } from '@/data/site';

export const metadata: Metadata = {
  metadataBase: site.url ? new URL(site.url) : undefined,
  title: { default: 'LimpiaMX — Personas de confianza para espacios que importan', template: '%s — LimpiaMX' },
  description: site.description,
  applicationName: site.name,
  generator: 'Next.js',
  keywords: ['limpieza en México', 'personal de limpieza', 'limpieza de hogar', 'limpieza CDMX', 'limpieza Airbnb'],
  openGraph: { type: 'website', locale: 'es_MX', siteName: site.name, title: 'LimpiaMX — Personas de confianza para espacios que importan', description: site.description, images: ['/images/hero_mexican_living_room_1795321033270.jpg'] },
  twitter: { card: 'summary_large_image', title: 'LimpiaMX — Limpieza de confianza en México', description: site.description, images: ['/images/hero_mexican_living_room_1795321033270.jpg'] },
  icons: { icon: '/favicon.svg', apple: '/icons/apple-touch-icon.png' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <a className="floating-whatsapp" href={`https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent('Hola, quiero información sobre LimpiaMX.')}`} target="_blank" rel="noreferrer" aria-label="Escribir por WhatsApp a LimpiaMX">
          <MessageCircle size={18} aria-hidden="true" /><span>WhatsApp</span>
        </a>
      </body>
    </html>
  );
}
