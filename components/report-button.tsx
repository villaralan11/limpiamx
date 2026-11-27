'use client';

import { Flag, LoaderCircle, X } from 'lucide-react';
import { useState } from 'react';
import { signInWithGoogle, submitReport, type ReportRecord } from '@/lib/firebase';
import { useAuthUser } from '@/components/use-auth-user';

const reasons = ['Información incorrecta', 'Conducta inapropiada', 'Problema de seguridad', 'Otro'];

export function ReportButton({ targetId, targetName }: { targetId: string; targetName: string }) {
  const { user } = useAuthUser();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(reasons[0]);
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  function close() { if (!saving) { setOpen(false); setStatus(''); setError(false); } }
  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (details.trim().length < 15) { setStatus('Cuéntanos un poco más para que podamos revisar el caso.'); setError(true); return; }
    setSaving(true); setStatus(''); setError(false);
    try { const currentUser = user ?? (await signInWithGoogle()).user; const report: ReportRecord = { targetId, targetName, reason, details: details.trim() }; await submitReport(currentUser.uid, report); setStatus('Reporte recibido. Nuestro equipo revisará la información.'); setDetails(''); }
    catch { setStatus('No pudimos enviar el reporte. Inténtalo de nuevo.'); setError(true); }
    finally { setSaving(false); }
  }

  return <>
    <button type="button" className="report-link" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOpen(true); }}><Flag size={13} /> Reportar perfil</button>
    {open && <div className="report-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><div className="report-dialog" role="dialog" aria-modal="true" aria-labelledby={`report-title-${targetId}`}><button type="button" className="report-close" onClick={close} aria-label="Cerrar reporte"><X size={17} /></button><span className="eyebrow">Seguridad de la comunidad</span><h2 id={`report-title-${targetId}`}>Reportar a {targetName}</h2><p>Usa este canal para avisarnos de un problema concreto. Si existe peligro inmediato, llama al 911.</p><form onSubmit={send} noValidate><div className="field"><label htmlFor={`report-reason-${targetId}`}>Motivo</label><select id={`report-reason-${targetId}`} value={reason} onChange={(event) => setReason(event.target.value)}>{reasons.map((item) => <option key={item}>{item}</option>)}</select></div><div className="field"><label htmlFor={`report-details-${targetId}`}>Qué ocurrió</label><textarea id={`report-details-${targetId}`} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Incluye fecha, contexto y cualquier dato que nos ayude a investigar." minLength={15} required /></div>{status && <p className={error ? 'field-error' : 'success-box'} role={error ? 'alert' : 'status'}>{status}</p>}<div className="report-actions"><button type="button" className="btn btn-secondary" onClick={close}>Cerrar</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <LoaderCircle size={15} className="animate-spin" /> : <Flag size={15} />} Enviar reporte</button></div></form></div></div>}
  </>;
}
