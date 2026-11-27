import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Copy,
  CreditCard,
  Flag,
  KeyRound,
  Loader2,
  MessagesSquare,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import {
  BookingRecord,
  CleanerListing,
  formatMxn,
  ReviewRecord,
} from '../types/marketplace';
import { getDoorCodeInfo } from '../lib/bookingSecurity';
import {
  computeProtectedPayment,
  getBookingMessages,
  getPaymentForBooking,
  PAYMENT_PROVIDERS,
  PROTECTION_FEE_PCT,
  pushBookingMessage,
  releaseDemoPayment,
  REPLACEMENT_GUARANTEE_MXN,
  REPORT_REASONS,
  ReportReason,
  saveDemoPayment,
  submitReport,
  VerificationRecord,
} from '../lib/marketplaceExtras';

// ---------------------------------------------------------------------------
// Código de seguridad en la puerta
// ---------------------------------------------------------------------------

export const DoorCodeBox: React.FC<{
  bookingId: string;
  scheduledDate: string;
  role: 'client' | 'pro';
}> = ({ bookingId, scheduledDate, role }) => {
  const [copied, setCopied] = useState(false);
  const info = getDoorCodeInfo({ id: bookingId, scheduledDate });

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(info.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard bloqueado: el código sigue visible para copiar a mano.
    }
  };

  return (
    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-900">
          <KeyRound className="w-4 h-4 text-teal-700" />
          {role === 'client'
            ? 'Código de la puerta (comparte al llegar)'
            : 'Código de la puerta (pídelo al llegar)'}
        </p>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-800 hover:text-teal-900 cursor-pointer"
        >
          <Copy className="w-3 h-3" />
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <p className="font-mono text-2xl font-bold tracking-[0.3em] text-teal-900 tabular-nums">
        {info.code.slice(0, 3)} · {info.code.slice(3)}
      </p>
      <p className="text-[11px] text-teal-800/80 mt-1.5 leading-relaxed">
        {info.expiresLabel.charAt(0).toUpperCase() + info.expiresLabel.slice(1)}
        . {role === 'client'
          ? 'Dáselo al profesional solo cuando toque la puerta: confirma que la visita corresponde a esta reserva.'
          : 'Pídeselo al cliente antes de entrar: confirma que llegaste a la dirección correcta.'}
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Pago protegido dentro de la app (demo)
// ---------------------------------------------------------------------------

export const PaymentSheet: React.FC<{
  bookingId: string;
  totalMxn: number;
  durationHours: number;
  onPaid: () => void;
  onClose: () => void;
}> = ({ bookingId, totalMxn: bookingTotal, durationHours, onClose, onPaid }) => {
  const [provider, setProvider] = useState(PAYMENT_PROVIDERS[0].id);
  const [stage, setStage] = useState<'select' | 'processing' | 'done'>('select');
  const existing = getPaymentForBooking(bookingId);
  const { feeMxn, payoutMxn, totalMxn } = computeProtectedPayment(bookingTotal);

  const pay = () => {
    setStage('processing');
    saveDemoPayment(bookingId, provider, bookingTotal);
    setTimeout(() => {
      setStage('done');
      onPaid();
    }, 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pago protegido"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs overflow-y-auto p-4 flex items-center justify-center"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-teal-700" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Reserva Protegida
            </h2>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {existing && stage === 'select' && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-xs text-teal-900">
              Esta reserva ya tiene un pago retenido de{' '}
              <strong>{formatMxn(existing.amountMxn)}</strong> con{' '}
              {PAYMENT_PROVIDERS.find((p) => p.id === existing.provider)?.label}.
            </div>
          )}
          {stage === 'select' && (
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5 text-sm tabular-nums">
                <div className="flex justify-between text-slate-600">
                  <span>Servicio ({durationHours} hrs)</span>
                  <span>{formatMxn(bookingTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Comisión Reserva Protegida ({PROTECTION_FEE_PCT}%)</span>
                  <span>{formatMxn(feeMxn)}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total a pagar hoy</span>
                  <span>{formatMxn(totalMxn)} MXN</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Al profesional se le libera {formatMxn(payoutMxn)} cuando
                  confirmes el servicio completado.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">
                  Proveedor de pago
                </p>
                {PAYMENT_PROVIDERS.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-start gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                      provider === p.id
                        ? 'border-teal-600 bg-teal-50/70'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-provider"
                      checked={provider === p.id}
                      onChange={() => setProvider(p.id)}
                      className="mt-0.5 accent-teal-700"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        {p.label}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {p.note}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex items-start gap-2.5 bg-teal-50 border border-teal-200 rounded-lg p-3.5">
                <ShieldCheck className="w-4.5 h-4.5 text-teal-700 shrink-0 mt-0.5" />
                <p className="text-xs text-teal-900 leading-relaxed">
                  <strong>Garantía de reposición:</strong> si algo se daña
                  durante el servicio, reportas el caso con evidencia y LimpiaMX
                  repone hasta{' '}
                  <strong>{formatMxn(REPLACEMENT_GUARANTEE_MXN)} MXN</strong>. El
                  pago del profesional no se libera hasta que confirmes que el
                  servicio terminó bien.
                </p>
              </div>

              <button
                type="button"
                onClick={pay}
                className="w-full py-3 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors cursor-pointer"
              >
                Pagar {formatMxn(totalMxn)} con{' '}
                {PAYMENT_PROVIDERS.find((p) => p.id === provider)?.label}
              </button>
              <p className="text-[11px] text-slate-500 text-center">
                Demostración escolar: no se procesa ningún cargo real.
              </p>
            </>
          )}

          {stage === 'processing' && (
            <div className="py-10 text-center space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-teal-700 mx-auto" />
              <p className="text-sm font-medium text-slate-700">
                Procesando pago con{' '}
                {PAYMENT_PROVIDERS.find((p) => p.id === provider)?.label}...
              </p>
            </div>
          )}

          {stage === 'done' && (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-display text-lg font-semibold text-slate-900">
                Pago retenido con éxito
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {formatMxn(totalMxn)} quedaron retenidos para esta reserva. Al
                marcarla como completada, se liberan{' '}
                {formatMxn(payoutMxn)} al profesional.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 cursor-pointer"
              >
                Entendido
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Chat por reserva
// ---------------------------------------------------------------------------

export const BookingChat: React.FC<{
  booking: BookingRecord;
  cleaner?: CleanerListing | null;
  role: 'client' | 'pro';
  compact?: boolean;
}> = ({ booking, cleaner, role, compact = false }) => {
  const [messages, setMessages] = useState(() =>
    getBookingMessages(booking.id)
  );
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(!compact);

  const otherName =
    role === 'client'
      ? cleaner?.displayName ?? booking.cleanerName
      : booking.clientName;

  const send = () => {
    if (!draft.trim()) return;
    setMessages(pushBookingMessage(booking.id, role, draft));
    setDraft('');
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between gap-2 cursor-pointer"
      >
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800">
          <MessagesSquare className="w-4 h-4 text-teal-700" />
          Chat con {otherName}
        </span>
        <span className="text-[11px] text-slate-500">
          {messages.length > 0 ? `${messages.length} mensajes` : 'Sin mensajes'}
        </span>
      </button>
      {open && (
        <div className="p-4 space-y-3">
          <div className="max-h-48 overflow-y-auto space-y-2">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-3">
                Escribe el primer mensaje: acuerda acceso, mascotas o zonas
                prioritarias.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.author === role ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      m.author === role
                        ? 'bg-teal-700 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    {m.text}
                    {m.demo && (
                      <span className="block mt-1 text-[10px] opacity-70">
                        Respuesta de demostración
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  send();
                }
              }}
              maxLength={400}
              placeholder={`Mensaje para ${otherName}...`}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-teal-700"
            />
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim()}
              className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Reportar perfil o reseña
// ---------------------------------------------------------------------------

export const ReportDialog: React.FC<{
  targetType: 'cleaner' | 'review';
  targetId: string;
  targetLabel: string;
  onClose: () => void;
}> = ({ targetType, targetId, targetLabel, onClose }) => {
  const [reason, setReason] = useState<ReportReason>('perfil_falso');
  const [detail, setDetail] = useState('');
  const [sent, setSent] = useState(false);

  const submit = () => {
    submitReport(targetType, targetId, targetLabel, reason, detail);
    setSent(true);
    setTimeout(onClose, 2200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Reportar contenido"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs overflow-y-auto p-4 flex items-center justify-center"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Flag className="w-5 h-5 text-red-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              {sent
                ? 'Reporte enviado'
                : targetType === 'cleaner'
                  ? 'Reportar perfil'
                  : 'Reportar reseña'}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {sent ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Gracias por el aviso. El equipo de moderación revisará{' '}
                <strong>{targetLabel}</strong> y tomará acción si incumple las
                reglas.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
                Reportas:{' '}
                <span className="font-semibold text-slate-700">
                  {targetLabel}
                </span>
              </p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">Motivo</p>
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-center gap-3 border rounded-lg px-3.5 py-2.5 cursor-pointer text-sm transition-colors ${
                      reason === r.id
                        ? 'border-teal-600 bg-teal-50/70 text-teal-900 font-medium'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      checked={reason === r.id}
                      onChange={() => setReason(r.id)}
                      className="accent-teal-700"
                    />
                    {r.label}
                  </label>
                ))}
              </div>
              <textarea
                rows={3}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                maxLength={400}
                placeholder="Cuéntanos qué pasó (opcional, máx. 400 caracteres)"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-teal-700"
              />
              <button
                type="button"
                onClick={submit}
                className="w-full py-3 rounded-lg bg-red-700 text-white text-sm font-medium hover:bg-red-800 transition-colors cursor-pointer"
              >
                Enviar reporte al equipo de moderación
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Panel de verificación de identidad con INE (para profesionales)
// ---------------------------------------------------------------------------

export const IneVerificationPanel: React.FC<{
  uid: string;
  expectedName: string;
  record: VerificationRecord | null;
  onSubmit: (frontFile: File, backFile: File) => Promise<void>;
  onToast: (msg: string) => void;
}> = ({ expectedName, record, onSubmit, onToast }) => {
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState('');
  const [backPreview, setBackPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    return () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
      if (backPreview) URL.revokeObjectURL(backPreview);
    };
  }, [frontPreview, backPreview]);

  const status = record?.status ?? null;

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'front' | 'back'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      const msg = 'Usa una foto JPG, PNG o WebP legible de tu credencial INE.';
      setErrorMsg(msg);
      onToast(msg);
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      const msg = 'La imagen supera el máximo de 15 MB.';
      setErrorMsg(msg);
      onToast(msg);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (side === 'front') {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
      setFrontFile(file);
      setFrontPreview(previewUrl);
    } else {
      if (backPreview) URL.revokeObjectURL(backPreview);
      setBackFile(file);
      setBackPreview(previewUrl);
    }
  };

  const resetSelection = () => {
    if (frontPreview) URL.revokeObjectURL(frontPreview);
    if (backPreview) URL.revokeObjectURL(backPreview);
    setFrontFile(null);
    setBackFile(null);
    setFrontPreview('');
    setBackPreview('');
    setErrorMsg('');
  };

  const submit = async () => {
    if (!frontFile || !backFile || busy) return;
    setErrorMsg('');
    setBusy(true);
    try {
      await onSubmit(frontFile, backFile);
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo completar la validación de la INE.';
      setErrorMsg(msg);
      onToast(msg);
    } finally {
      setBusy(false);
    }
  };

  const checkItems = record?.checks
    ? [
        { label: 'Anverso INE válido', ok: record.checks.frontIneDetected },
        { label: 'Reverso INE válido', ok: record.checks.backIneDetected },
        { label: 'QR / código OCR IDMEX', ok: record.checks.mrzOrQrDetected },
        {
          label: 'CURP / Clave de elector',
          ok: record.checks.curpFormatValid || record.checks.claveElectorValid,
        },
        { label: 'Vigencia activa', ok: record.checks.vigenciaActive },
        { label: 'Coincidencia con tu nombre', ok: record.checks.nameMatchesProfile },
      ]
    : [];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-slate-900 inline-flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-teal-700" />
            Verificación de identidad (INE)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Validación automática documental para titular:{' '}
            <span className="font-semibold text-slate-700">{expectedName}</span>
          </p>
        </div>
        {status === 'verified' && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            INE Verificada {record?.confidenceScore ? `· ${record.confidenceScore}%` : ''}
          </span>
        )}
        {status === 'rejected' && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-800 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Requiere nuevas fotos
          </span>
        )}
        {status === 'in_review' && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Analizando INE...
          </span>
        )}
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">
        Sube una foto clara del anverso y reverso de tu credencial para votar INE.
        Nuestro verificador valida autenticidad visual, código OCR/QR, formato de CURP,
        vigencia y coincidencia con tu nombre. Al aprobarse, tu perfil obtiene la insignia
        pública de identidad verificada.
      </p>

      {status === 'verified' ? (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-3 text-sm text-teal-950">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">
                Identidad verificada con INE vigente
              </p>
              <p className="text-xs text-teal-900 leading-relaxed">
                {record?.summary ||
                  'Tu credencial superó la inspección documental y tu insignia ya se muestra en tu perfil público.'}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-teal-200/80 text-xs">
            <div>
              <dt className="text-teal-700">Folio de verificación</dt>
              <dd className="font-mono font-semibold text-teal-950">
                {record?.verificationId || 'INE-OK'}
              </dd>
            </div>
            <div>
              <dt className="text-teal-700">Vigencia detectada</dt>
              <dd className="font-semibold text-teal-950 tabular-nums">
                {record?.vigenciaYear ? `Hasta ${record.vigenciaYear}` : 'Vigente'}
              </dd>
            </div>
            <div>
              <dt className="text-teal-700">CURP enmascarada</dt>
              <dd className="font-mono font-semibold text-teal-950">
                {record?.maskedCurp || 'Validada'}
              </dd>
            </div>
          </dl>

          {checkItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs">
              {checkItems.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-teal-900">
                  {item.ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  )}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2.5 text-xs text-red-900">
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-950">
                    La validación no pudo aprobar estos documentos
                  </p>
                  {record?.summary && (
                    <p className="mt-0.5 text-red-800">{record.summary}</p>
                  )}
                </div>
              </div>
              {record?.rejectionReasons && record.rejectionReasons.length > 0 && (
                <ul className="list-disc pl-5 space-y-1 text-red-800">
                  {record.rejectionReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              )}
              {checkItems.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-red-200/70">
                  {checkItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      {item.ok ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      )}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['front', 'back'] as const).map((side) => {
              const file = side === 'front' ? frontFile : backFile;
              const preview = side === 'front' ? frontPreview : backPreview;
              return (
                <label
                  key={side}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[144px] ${
                    file
                      ? 'border-teal-600 bg-teal-50/50'
                      : 'border-slate-300 bg-slate-50 hover:border-teal-600'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => handleFile(e, side)}
                    disabled={busy}
                  />
                  {preview ? (
                    <img
                      src={preview}
                      alt={side === 'front' ? 'Vista previa INE anverso' : 'Vista previa INE reverso'}
                      className="w-full h-24 object-cover rounded-lg border border-slate-200 mb-2"
                    />
                  ) : (
                    <Upload className="w-5 h-5 mx-auto mb-1.5 text-teal-700" />
                  )}
                  <p className="text-xs font-semibold text-slate-800">
                    {side === 'front' ? 'INE — Anverso (frente)' : 'INE — Reverso (atrás)'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-full">
                    {file
                      ? `${file.name} (${Math.round(file.size / 1024)} KB)`
                      : 'Subir foto legible (JPG, PNG o WebP)'}
                  </p>
                </label>
              );
            })}
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed"
            >
              {errorMsg}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={submit}
              disabled={!frontFile || !backFile || busy}
              className="flex-1 min-w-[210px] py-2.5 px-4 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando INE en servidor...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verificar mi INE ahora</span>
                </>
              )}
            </button>

            {(frontFile || backFile) && !busy && (
              <button
                type="button"
                onClick={resetSelection}
                className="px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cambiar fotos</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Inspección segura: las fotografías se analizan al momento en el servidor para
            validar anverso/reverso, vigencia y estructura oficial, y nunca se guardan ni se
            publican en tu perfil.
          </p>
        </div>
      )}
    </div>
  );
};
