'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Check, ClipboardList, LoaderCircle, Save, Send, UserRound } from 'lucide-react';
import { cities } from '@/data/site';
import { loadBookings, loadProfile, saveBooking, saveListing, saveProfile, type BookingRecord, type ListingRecord, type ProfileRecord } from '@/lib/firebase';
import { useAuthUser } from '@/components/use-auth-user';

const services = ['Casa y departamento', 'Limpieza profunda', 'Oficina y local', 'Rotación de Airbnb', 'Post-obra', 'Planchado y ropa'];

function FormStatus({ message, error = false }: { message: string; error?: boolean }) {
  if (!message) return null;
  return <p className={error ? 'field-error' : 'success-box'} role={error ? 'alert' : 'status'} style={error ? undefined : { marginTop: 16 }}>{message}</p>;
}

export function ProfilePanel() {
  const { user } = useAuthUser();
  const [form, setForm] = useState<ProfileRecord>({ displayName: '', email: '', phone: '', city: '', role: 'cliente' });
  const [status, setStatus] = useState('');
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({ ...current, displayName: user.displayName || '', email: user.email || '' }));
    void loadProfile(user.uid).then((saved) => saved && setForm((current) => ({ ...current, ...saved }))).catch(() => undefined);
  }, [user]);

  function update(field: keyof ProfileRecord, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setStatus(''); setError(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || form.displayName.trim().length < 2 || !form.city) { setStatus('Completa tu nombre y ciudad para continuar.'); setError(true); return; }
    setSaving(true); setStatus(''); setError(false);
    try { await saveProfile(user.uid, form); setStatus('Perfil guardado.'); }
    catch { setStatus('No pudimos guardar todavía. Revisa las reglas de Firestore o inténtalo de nuevo.'); setError(true); }
    finally { setSaving(false); }
  }

  return <div className="form-card account-panel"><div className="panel-heading"><span className="service-icon"><UserRound size={21} /></span><div><h2>Tu perfil</h2><p>Unos datos claros ayudan a que cada conversación empiece mejor.</p></div></div><form onSubmit={submit} noValidate><div className="form-grid"><div className="field"><label htmlFor="profile-name">Nombre visible</label><input id="profile-name" value={form.displayName} onChange={(event) => update('displayName', event.target.value)} autoComplete="name" required /></div><div className="field"><label htmlFor="profile-email">Correo de Google</label><input id="profile-email" value={form.email} readOnly aria-describedby="profile-email-note" /><span className="form-note" id="profile-email-note">Lo proporciona Google y no se puede editar aquí.</span></div><div className="field"><label htmlFor="profile-phone">WhatsApp (opcional)</label><input id="profile-phone" value={form.phone} onChange={(event) => update('phone', event.target.value)} autoComplete="tel" placeholder="55 0000 0000" /></div><div className="field"><label htmlFor="profile-city">Ciudad principal</label><select id="profile-city" value={form.city} onChange={(event) => update('city', event.target.value)} required><option value="">Selecciona una ciudad</option>{cities.map((city) => <option key={city.slug} value={city.fullName}>{city.fullName}</option>)}</select></div><div className="field full"><label htmlFor="profile-role">¿Cómo usarás LimpiaMX?</label><select id="profile-role" value={form.role} onChange={(event) => update('role', event.target.value as ProfileRecord['role'])}><option value="cliente">Quiero contratar limpieza</option><option value="profesional">Quiero ofrecer mis servicios</option></select></div></div><FormStatus message={status} error={error} /><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />} Guardar perfil</button></form></div>;
}

export function PublishPanel() {
  const { user } = useAuthUser();
  const [form, setForm] = useState<ListingRecord>({ title: '', service: services[0], city: '', rate: 220, zones: '', availability: '', description: '' });
  const [status, setStatus] = useState('');
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  function update(field: keyof ListingRecord, value: string | number) {
    setForm((current) => ({ ...current, [field]: value })); setStatus(''); setError(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || form.title.trim().length < 6 || !form.city || form.rate < 80 || form.zones.trim().length < 3 || form.description.trim().length < 30) { setStatus('Completa el título, ciudad, tarifa, zonas y una descripción de al menos 30 caracteres.'); setError(true); return; }
    setSaving(true); setStatus(''); setError(false);
    try { await saveListing(user.uid, form); setStatus('Tu servicio quedó guardado como publicado.'); setForm({ title: '', service: services[0], city: form.city, rate: form.rate, zones: '', availability: '', description: '' }); }
    catch { setStatus('No pudimos publicar todavía. Revisa las reglas de Firestore o inténtalo de nuevo.'); setError(true); }
    finally { setSaving(false); }
  }

  return <div className="form-card account-panel"><div className="panel-heading"><span className="service-icon"><ClipboardList size={21} /></span><div><h2>Publica tu servicio</h2><p>Presenta tu forma de trabajar con una tarifa y zonas que se entiendan.</p></div></div><form onSubmit={submit} noValidate><div className="form-grid"><div className="field full"><label htmlFor="listing-title">Título del anuncio</label><input id="listing-title" value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Limpieza detallada para casas y departamentos" required /></div><div className="field"><label htmlFor="listing-service">Servicio principal</label><select id="listing-service" value={form.service} onChange={(event) => update('service', event.target.value)}>{services.map((service) => <option key={service}>{service}</option>)}</select></div><div className="field"><label htmlFor="listing-city">Ciudad</label><select id="listing-city" value={form.city} onChange={(event) => update('city', event.target.value)} required><option value="">Selecciona una ciudad</option>{cities.map((city) => <option key={city.slug} value={city.fullName}>{city.fullName}</option>)}</select></div><div className="field"><label htmlFor="listing-rate">Tarifa por hora (MXN)</label><input id="listing-rate" type="number" min="80" step="5" value={form.rate} onChange={(event) => update('rate', Number(event.target.value))} required /></div><div className="field"><label htmlFor="listing-availability">Disponibilidad</label><input id="listing-availability" value={form.availability} onChange={(event) => update('availability', event.target.value)} placeholder="Lun a sáb · 08:00 a 18:00" required /></div><div className="field full"><label htmlFor="listing-zones">Colonias o zonas</label><input id="listing-zones" value={form.zones} onChange={(event) => update('zones', event.target.value)} placeholder="Roma, Condesa, Del Valle" required /></div><div className="field full"><label htmlFor="listing-description">Cómo trabajas</label><textarea id="listing-description" value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Cuéntale a las personas qué cuidas, qué productos llevas y qué tipo de espacios atiendes." required /></div></div><FormStatus message={status} error={error} /><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />} Guardar anuncio</button></form></div>;
}

export function BookingsPanel({ defaultProfessional = '' }: { defaultProfessional?: string }) {
  const { user } = useAuthUser();
  const [form, setForm] = useState<BookingRecord>({ professionalName: defaultProfessional, service: services[0], date: '', hours: 3, notes: '' });
  const [bookings, setBookings] = useState<Array<BookingRecord & { id: string; status: string }>>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) void loadBookings(user.uid).then(setBookings).catch(() => undefined); }, [user]);
  useEffect(() => { if (defaultProfessional) setForm((current) => ({ ...current, professionalName: defaultProfessional })); }, [defaultProfessional]);

  function update(field: keyof BookingRecord, value: string | number) { setForm((current) => ({ ...current, [field]: value })); setStatus(''); setError(false); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || form.professionalName.trim().length < 2 || !form.date || form.hours < 1 || form.notes.trim().length < 10) { setStatus('Indica a persona, fecha, horas y un mensaje de al menos 10 caracteres.'); setError(true); return; }
    setSaving(true); setStatus(''); setError(false);
    try { await saveBooking(user.uid, form); setStatus('Solicitud guardada. Confirma los detalles directamente con la persona profesional.'); setBookings((current) => [{ ...form, id: `local-${Date.now()}`, status: 'requested' }, ...current]); setForm((current) => ({ ...current, notes: '', date: '' })); }
    catch { setStatus('No pudimos guardar la solicitud. Revisa las reglas de Firestore o inténtalo de nuevo.'); setError(true); }
    finally { setSaving(false); }
  }

  return <div className="account-panel-stack"><div className="form-card account-panel"><div className="panel-heading"><span className="service-icon"><CalendarDays size={21} /></span><div><h2>Solicita una reserva</h2><p>Deja claros fecha, duración y alcance antes de abrir la conversación.</p></div></div><form onSubmit={submit} noValidate><div className="form-grid"><div className="field"><label htmlFor="booking-professional">Profesional</label><input id="booking-professional" value={form.professionalName} onChange={(event) => update('professionalName', event.target.value)} placeholder="Nombre del perfil" required /></div><div className="field"><label htmlFor="booking-service">Tipo de servicio</label><select id="booking-service" value={form.service} onChange={(event) => update('service', event.target.value)}>{services.map((service) => <option key={service}>{service}</option>)}</select></div><div className="field"><label htmlFor="booking-date">Fecha tentativa</label><input id="booking-date" type="date" value={form.date} onChange={(event) => update('date', event.target.value)} required /></div><div className="field"><label htmlFor="booking-hours">Horas estimadas</label><input id="booking-hours" type="number" min="1" max="12" step="1" value={form.hours} onChange={(event) => update('hours', Number(event.target.value))} required /></div><div className="field full"><label htmlFor="booking-notes">Qué necesitas</label><textarea id="booking-notes" value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Cuéntanos sobre el espacio, tareas prioritarias, productos o mascotas." required /></div></div><FormStatus message={status} error={error} /><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />} Guardar solicitud</button></form></div><div className="form-card account-panel"><div className="panel-heading"><span className="service-icon"><Check size={21} /></span><div><h2>Solicitudes recientes</h2><p>El estado inicial es “solicitada” hasta que ambas partes confirmen.</p></div></div>{bookings.length ? <div className="account-list">{bookings.map((booking) => <article key={booking.id} className="account-list-item"><div><strong>{booking.professionalName}</strong><span>{booking.service} · {booking.date} · {booking.hours} h</span><small>{booking.notes}</small></div><em>{booking.status === 'requested' ? 'Solicitada' : booking.status}</em></article>)}</div> : <p className="empty-state">Todavía no tienes solicitudes. Cuando encuentres un perfil, puedes iniciar aquí la conversación.</p>}</div></div>;
}
