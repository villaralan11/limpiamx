import type { Metadata } from 'next';
import { Mail, MessageCircle, ShieldCheck } from 'lucide-react';
import { ContactForm } from '@/components/contact-form';
import { site } from '@/data/site';

export const metadata: Metadata = { title: 'Contacto', description: 'Habla con el equipo de LimpiaMX por correo o WhatsApp.' };

export default function ContactPage() { return <><section className="page-hero"><div className="shell"><span className="eyebrow">Estamos para orientarte</span><h1>Cuéntanos qué necesitas.</h1><p>Si buscas ayuda para tu espacio, quieres ofrecer servicios o necesitas reportar algo, escríbenos con contexto y te respondemos.</p></div></section><section className="section"><div className="shell content-grid"><ContactForm /><aside className="aside-card"><MessageCircle size={27} color="var(--teal-700)" /><h3>Respuesta directa</h3><p>Para una conversación rápida puedes escribirnos por WhatsApp. Para temas de cuenta, privacidad o reportes, usa el correo.</p><div className="footer-links" style={{ marginTop: 18 }}><a href={`https://wa.me/${site.whatsappNumber}`} target="_blank" rel="noreferrer">WhatsApp · {site.whatsappDisplay}</a><a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></div><div style={{ display: 'flex', gap: 8, marginTop: 28, color: 'var(--ink-soft)', fontSize: 12, lineHeight: 1.45 }}><ShieldCheck size={18} color="var(--teal-700)" /> Solo usamos la información para atender tu solicitud.</div></aside></div></section></>; }
