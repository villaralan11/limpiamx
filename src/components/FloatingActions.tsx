import React, { useState } from 'react';
import { LifeBuoy, Phone, X } from 'lucide-react';
import { SITE, SAFETY_TIPS } from '../data/siteContent';
import { WhatsAppIcon } from './SharedUI';

interface FloatingActionsProps {
  hidden?: boolean;
  contextLabel?: string;
}

/**
 * Acciones flotantes: contacto rápido por WhatsApp + botón de emergencia (SOS).
 * Se oculta cuando hay un modal abierto para no competir en z-index.
 */
export const FloatingActions: React.FC<FloatingActionsProps> = ({
  hidden = false,
  contextLabel = 'el sitio',
}) => {
  const [sosOpen, setSosOpen] = useState(false);
  if (hidden) return null;

  const waNumber = SITE.whatsappNumber;
  const greeting = encodeURIComponent(
    'Hola, vengo del sitio de LimpiaMX y tengo una duda sobre '
  );

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2.5">
        <button
          type="button"
          aria-label="Abrir botón de emergencia"
          onClick={() => setSosOpen(true)}
          className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white border border-red-200 shadow-lg text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LifeBuoy className="w-4 h-4" />
          <span className="hidden sm:inline">Emergencia</span>
        </button>

        <a
          href={`https://wa.me/${waNumber}?text=${greeting}${encodeURIComponent(contextLabel)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Contactar por WhatsApp al ${SITE.whatsappDisplay}`}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-[#25D366] text-white shadow-lg hover:brightness-95 transition-all"
        >
          <WhatsAppIcon className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-semibold">
            WhatsApp
          </span>
        </a>
      </div>

      {sosOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Emergencia y seguridad"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs overflow-y-auto p-4 flex items-center justify-center"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-red-50">
              <div className="flex items-center gap-2.5">
                <LifeBuoy className="w-5 h-5 text-red-700" />
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Emergencia
                </h2>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setSosOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white/70 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <a
                href={`tel:${SITE.emergencyNumber}`}
                className="flex items-center gap-3 w-full bg-red-700 hover:bg-red-800 text-white rounded-lg px-4 py-3.5 transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span className="text-sm font-semibold">
                  Llamar al {SITE.emergencyNumber} (emergencias)
                </span>
              </a>
              <a
                href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent('Emergencia durante un servicio')}&body=${encodeURIComponent('Fecha, hora y descripción de lo ocurrido:')}`}
                className="flex items-center gap-3 w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 rounded-lg px-4 py-3.5 transition-colors"
              >
                <LifeBuoy className="w-5 h-5 text-teal-700" />
                <span className="text-sm font-semibold">
                  Avisar al equipo de LimpiaMX por correo
                </span>
              </a>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-800 mb-2">
                  Si el servicio se puso tenso:
                </p>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {SAFETY_TIPS.slice(3, 6).map((tip) => (
                    <li key={tip} className="flex items-start gap-1.5">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Para casos no urgentes usa el botón "Reportar" en la tarjeta del
                perfil o reseña; el equipo de moderación revisa cada caso.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
