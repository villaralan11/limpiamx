'use client';

import { CalendarDays, Check, Clock3, LoaderCircle, Send, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cancelBooking, loadBookings, saveBooking, type BookingRecord } from '@/lib/firebase';
import { useAuthUser } from '@/components/use-auth-user';

const services = ['Casa y departamento', 'Limpieza profunda', 'Oficina y local', 'Rotación de Airbnb', 'Post-obra', 'Planchado y ropa'];
type BookingItem = BookingRecord & { id: string; status: string };

function dateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
}

function upcomingDates() {
  const today = new Date();
  return Array.from({ length: 14 }, (_, index) => { const date = new Date(today); date.setDate(today.getDate() + index + 1); return dateValue(date); });
}

function statusLabel(status: string) {
  return ({ requested: 'Solicitada', confirmed: 'Confirmada', cancelled: 'Cancelada', completed: 'Completada' } as Record<string, string>)[status] ?? status;
}

export function BookingPanel({ defaultProfessional = '' }: { defaultProfessional?: string }) {
  const { user } = useAuthUser();
  const dates = useMemo(upcomingDates, []);
  const [form, setForm] = useState<BookingRecord>({ professionalName: defaultProfessional, service: services[0], date: dates[0], hours: 3, notes: '' });
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState('');

  useEffect(() => { if (user) void loadBookings(user.uid).then(setBookings).catch(() => setError(true)); }, [user]);
  useEffect(() => { if (defaultProfessional) setForm((current) => ({ ...current, professionalName: defaultProfessional })); }, [defaultProfessional]);

  function update(field: keyof BookingRecord, value: string | number) { setForm((current) => ({ ...current, [field]: value })); setStatus(''); setError(false); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || form.professionalName.trim().length < 2 || !form.date || form.hours < 1 || form.hours > 12 || form.notes.trim().length < 10) { setStatus('Indica la persona, fecha, horas y un mensaje de al menos 10 caracteres.'); setError(true); return; }
    setSaving(true); setStatus(''); setError(false);
    try { const id = await saveBooking(user.uid, form); setStatus('Solicitud enviada. La otra parte debe confirmar fecha y alcance.'); setBookings((current) => [{ ...form, id, status: 'requested' }, ...current]); setForm((current) => ({ ...current, notes: '', date: dates[0] })); }
    catch { setStatus('No pudimos guardar la solicitud. Revisa las reglas de Firestore o inténtalo de nuevo.'); setError(true); }
    finally { setSaving(false); }
  }

  async function handleCancel(booking: BookingItem) {
    if (!user || booking.status !== 'requested') return;
    setCancellingId(booking.id); setStatus(''); setError(false);
    try { await cancelBooking(user.uid, booking.id); setBookings((current) => current.map((item) => item.id === booking.id ? { ...item, status: 'cancelled' } : item)); }
    catch { setStatus('No pudimos cancelar esta solicitud. Inténtalo de nuevo.'); setError(true); }
    finally { setCancellingId(''); }
  }

  return <div className="account-panel-stack"><div className="form-card account-panel"><div className="panel-heading"><span className="service-icon"><CalendarDays size={21} /></span><div><h2>Solicita una reserva</h2><p>Elige una fecha tentativa dentro de los próximos 14 días. La disponibilidad final se confirma en la conversación.</p></div></div><form onSubmit={submit} noValidate><div className="form-grid"><div className="field"><label htmlFor="booking-professional-new">Profesional</label><input id="booking-professional-new" value={form.professionalName} onChange={(event) => update('professionalName', event.target.value)} placeholder="Nombre del perfil" required /></div><div className="field"><label htmlFor="booking-service-new">Tipo de servicio</label><select id="booking-service-new" value={form.service} onChange={(event) => update('service', event.target.value)}>{services.map((service) => <option key={service}>{service}</option>)}</select></div><div className="field full"><label>Fecha tentativa</label><div className="date-choice-grid" role="group" aria-label="Seleccionar fecha tentativa">{dates.map((date) => <button type="button" key={date} className={form.date === date ? 'date-choice is-active' : 'date-choice'} onClick={() => update('date', date)}><span>{dateLabel(date).split(' ')[0]}</span><strong>{dateLabel(date).split(' ').slice(1).join(' ')}</strong></button>)}</div></div><div className="field"><label htmlFor="booking-hours-new">Horas estimadas</label><div className="input-with-icon"><Clock3 size={15} /><input id="booking-hours-new" type="number" min="1" max="12" step="1" value={form.hours} onChange={(event) => update('hours', Number(event.target.value))} required /></div></div><div className="field"><label htmlFor="booking-date-new">Fecha seleccionada</label><input id="booking-date-new" value={form.date ? dateLabel(form.date) : ''} readOnly /></div><div className="field full"><label htmlFor="booking-notes-new">Qué necesitas</label><textarea id="booking-notes-new" value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Cuéntanos sobre el espacio, tareas prioritarias, productos o mascotas." required /></div></div>{status && <p className={error ? 'field-error' : 'success-box'} role={error ? 'alert' : 'status'}>{status}</p>}<button className="btn btn-primary" type="submit" disabled={saving}>{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />} Enviar solicitud</button></form></div><div className="form-card account-panel"><div className="panel-heading"><span className="service-icon"><Check size={21} /></span><div><h2>Solicitudes recientes</h2><p>Una solicitud no es un cobro. El estado cambia cuando la otra parte confirma.</p></div></div>{bookings.length ? <div className="account-list">{bookings.map((booking) => <article key={booking.id} className="account-list-item"><div><strong>{booking.professionalName}</strong><span>{booking.service} · {dateLabel(booking.date)} · {booking.hours} h</span><small>{booking.notes}</small></div><div className="booking-actions"><em className={`booking-status status-${booking.status}`}>{statusLabel(booking.status)}</em>{booking.status === 'requested' && <button type="button" className="btn btn-ghost btn-small" onClick={() => void handleCancel(booking)} disabled={cancellingId === booking.id}>{cancellingId === booking.id ? <LoaderCircle size={14} className="animate-spin" /> : <XCircle size={14} />} Cancelar</button>}</div></article>)}</div> : <p className="empty-state">Todavía no tienes solicitudes. Cuando encuentres un perfil, puedes iniciar aquí la conversación.</p>}</div></div>;
}
