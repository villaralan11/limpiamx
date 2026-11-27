import Link from 'next/link';
import { site } from '@/data/site';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-grid">
          <div>
            <Link href="/" className="logo" aria-label="LimpiaMX, inicio"><span className="logo-mark" aria-hidden="true">LM</span><span className="logo-word">Limpia<span>MX</span></span></Link>
            <p className="footer-copy">Una forma más clara de encontrar ayuda para tu casa, oficina o estancia en México.</p>
            <a className="btn btn-secondary btn-small" href={`https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent('Hola, quiero información sobre LimpiaMX.')}`} target="_blank" rel="noreferrer">Escribir por WhatsApp</a>
          </div>
          <div><h2 className="footer-title">Descubre</h2><div className="footer-links"><Link href="/explorar">Explorar profesionales</Link><Link href="/cotizador">Cotizar limpieza</Link><Link href="/blog">Guías</Link><Link href="/planes">Publicar servicio</Link></div></div>
          <div><h2 className="footer-title">LimpiaMX</h2><div className="footer-links"><Link href="/nosotros">Nosotros</Link><Link href="/seguridad">Seguridad</Link><Link href="/faq">Preguntas frecuentes</Link><Link href="/contacto">Contacto</Link></div></div>
          <div><h2 className="footer-title">Legal</h2><div className="footer-links"><Link href="/terminos">Términos</Link><Link href="/privacidad">Privacidad</Link><a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></div></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} LimpiaMX</span><span>Hecho para cuidar mejor lo cotidiano.</span></div>
      </div>
    </footer>
  );
}
