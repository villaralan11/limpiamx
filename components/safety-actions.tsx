'use client';

import { AlertTriangle, Crosshair, Mail, PhoneCall } from 'lucide-react';
import { useState } from 'react';
import { site, whatsappUrl } from '@/data/site';

export function SafetyActions() {
  const [status, setStatus] = useState('');

  function shareLocation() {
    if (!navigator.geolocation) { setStatus('Tu navegador no permite compartir ubicación.'); return; }
    setStatus('Solicitando ubicación…');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const location = `Necesito apoyo con una reserva de LimpiaMX. Mi ubicación aproximada: https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
      if (navigator.share) void navigator.share({ title: 'Ubicación de emergencia · LimpiaMX', text: location }).then(() => setStatus('Ubicación compartida.')).catch(() => setStatus('La ubicación no se compartió.'));
      else { window.open(whatsappUrl(location), '_blank', 'noopener,noreferrer'); setStatus('Abrimos WhatsApp con tu ubicación.'); }
    }, () => setStatus('No pudimos obtener la ubicación. Revisa el permiso del navegador.'), { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  }

  return <aside className="safety-actions" aria-label="Acciones de seguridad"><div className="safety-heading"><span className="service-icon"><AlertTriangle size={20} /></span><div><strong>¿Necesitas ayuda?</strong><p>En una emergencia inmediata llama al 911. Este canal no sustituye a los servicios de emergencia.</p></div></div><div className="safety-buttons"><a className="btn btn-secondary btn-small" href="tel:911"><PhoneCall size={15} /> Llamar 911</a><a className="btn btn-secondary btn-small" href={`mailto:${site.contactEmail}?subject=Ayuda%20con%20una%20reserva`}><Mail size={15} /> Escribir a LimpiaMX</a><button type="button" className="btn btn-primary btn-small" onClick={shareLocation}><Crosshair size={15} /> Compartir ubicación</button></div>{status && <p className="safety-status" role="status">{status}</p>}</aside>;
}
