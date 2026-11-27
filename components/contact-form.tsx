'use client';

import { useState } from 'react';
import { ArrowUpRight, LoaderCircle, Mail } from 'lucide-react';
import { site, whatsappUrl } from '@/data/site';

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setLoading(true);
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim(); const email = String(form.get('email') ?? '').trim(); const message = String(form.get('message') ?? '').trim();
    if (name.length < 2 || !email.includes('@') || message.length < 15) { setError('Revisa tu nombre, correo y mensaje. Cuéntanos un poco más para poder ayudarte.'); setLoading(false); return; }
    const subject = `Contacto LimpiaMX · ${name}`;
    const body = `Nombre: ${name}\nCorreo: ${email}\n\n${message}`;
    window.location.href = `mailto:${site.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true); setLoading(false);
  }
  if (sent) return <div className="success-box"><strong>Tu correo está listo.</strong><br />Se abrió tu aplicación de Gmail o correo con la información. Si prefieres respuesta más rápida, escríbenos por WhatsApp.</div>;
  return <form className="form-card" onSubmit={submit} noValidate><div className="form-grid"><div className="field"><label htmlFor="name">Tu nombre</label><input id="name" name="name" autoComplete="name" required placeholder="Cómo te llamas" /></div><div className="field"><label htmlFor="email">Tu correo</label><input id="email" name="email" type="email" autoComplete="email" required placeholder="tu@correo.com" /></div><div className="field full"><label htmlFor="message">¿En qué podemos ayudarte?</label><textarea id="message" name="message" required placeholder="Cuéntanos si buscas limpieza, quieres ofrecer tus servicios o tuviste un problema…" /></div></div>{error && <p className="field-error" role="alert">{error}</p>}<p className="form-note">Responderemos desde <strong>{site.contactEmail}</strong>. No compartimos tus datos para publicidad.</p><div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? <LoaderCircle size={16} className="animate-spin" /> : <Mail size={16} />} Preparar correo</button><a className="btn btn-secondary" href={whatsappUrl('Hola, quiero información sobre LimpiaMX.')} target="_blank" rel="noreferrer">WhatsApp <ArrowUpRight size={15} /></a></div></form>;
}
