import { auth } from './firebase';
import { saveVerificationToFirestore } from './marketplaceService';

const VERIFICATION_KEY = 'limpiamx_verification_v2';
const PAYMENTS_KEY = 'limpiamx_payments_v1';
const CHAT_KEY = 'limpiamx_chat_v1';
const NOTIFICATIONS_KEY = 'limpiamx_notifications_v1';
const REPORTS_KEY = 'limpiamx_reports_v1';

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Cuota llena o almacenamiento bloqueado: el flujo continúa sin persistir localmente.
  }
}

// ---------------------------------------------------------------------------
// Verificación de identidad (INE) — Herramienta real vía /api/ine/verify
// ---------------------------------------------------------------------------

export type VerificationStatus = 'verified' | 'in_review' | 'rejected';

export interface IneCheckBreakdown {
  frontIneDetected: boolean;
  backIneDetected: boolean;
  mrzOrQrDetected: boolean;
  curpFormatValid: boolean;
  claveElectorValid: boolean;
  vigenciaActive: boolean;
  nameMatchesProfile: boolean;
}

export interface VerificationRecord {
  status: VerificationStatus;
  method: 'INE_AI';
  frontName: string;
  backName: string;
  submittedAt: string;
  verifiedAt?: string;
  verificationId?: string;
  confidenceScore?: number;
  vigenciaYear?: number | null;
  maskedCurp?: string | null;
  checks?: IneCheckBreakdown;
  summary?: string;
  rejectionReasons?: string[];
}

type VerificationMap = Record<string, VerificationRecord>;

export function getVerification(uid: string): VerificationRecord | null {
  const map = readJson<VerificationMap>(VERIFICATION_KEY) ?? {};
  return map[uid] ?? null;
}

export function isIdentityVerified(uid: string): boolean {
  return getVerification(uid)?.status === 'verified';
}

export async function encodeIneImageForApi(file: File): Promise<string> {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    throw new Error('Formato no compatible. Sube una foto JPG, PNG o WebP de tu INE.');
  }
  if (file.size === 0 || file.size > 15 * 1024 * 1024) {
    throw new Error('La imagen debe pesar menos de 15 MB.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
      el.src = objectUrl;
    });

    const maxDim = 1400;
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
    const width = Math.max(1, Math.round(srcW * scale));
    const height = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo procesar la fotografía de la INE.');
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.86;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (dataUrl.length > 2_200_000 && quality > 0.5) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

interface IneVerifyApiPayload {
  verdict: 'verified' | 'rejected';
  verificationId: string;
  confidenceScore: number;
  vigenciaYear: number | null;
  maskedCurp: string | null;
  checks: IneCheckBreakdown;
  summary: string;
  rejectionReasons: string[];
  verifiedAt: string;
}

export async function submitIneVerification(params: {
  uid: string;
  frontFile: File;
  backFile: File;
  expectedName: string;
}): Promise<VerificationRecord> {
  const { uid, frontFile, backFile, expectedName } = params;
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    throw new Error('Debes mantener tu sesión activa para verificar tu INE.');
  }

  const [idToken, frontImageBase64, backImageBase64] = await Promise.all([
    currentUser.getIdToken(),
    encodeIneImageForApi(frontFile),
    encodeIneImageForApi(backFile),
  ]);

  const submittedAt = new Date().toISOString();
  const response = await fetch('/api/ine/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      frontImageBase64,
      backImageBase64,
      expectedName,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as Partial<IneVerifyApiPayload> & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      payload.error || 'No se pudo completar el análisis documental de la INE.'
    );
  }

  const record: VerificationRecord = {
    status: payload.verdict === 'verified' ? 'verified' : 'rejected',
    method: 'INE_AI',
    frontName: frontFile.name.slice(0, 120),
    backName: backFile.name.slice(0, 120),
    submittedAt,
    verifiedAt: payload.verifiedAt || new Date().toISOString(),
    verificationId: payload.verificationId,
    confidenceScore: payload.confidenceScore ?? 0,
    vigenciaYear: payload.vigenciaYear ?? null,
    maskedCurp: payload.maskedCurp ?? null,
    checks: payload.checks,
    summary: payload.summary,
    rejectionReasons: payload.rejectionReasons ?? [],
  };

  const map = readJson<VerificationMap>(VERIFICATION_KEY) ?? {};
  map[uid] = record;
  writeJson(VERIFICATION_KEY, map);

  // Persiste resumen no sensible en Firestore para reflejar la insignia en toda la app
  await saveVerificationToFirestore({
    uid,
    status: record.status === 'verified' ? 'verified' : 'rejected',
    method: 'INE_AI',
    verificationId: record.verificationId || `ine_${Date.now()}`,
    confidenceScore: record.confidenceScore ?? 0,
    vigenciaYear: record.vigenciaYear ?? 0,
    maskedCurp: record.maskedCurp ?? '',
    summary: record.summary ?? '',
    verifiedAt: record.verifiedAt ?? submittedAt,
  }).catch(() => undefined);

  return record;
}

// ---------------------------------------------------------------------------
// Pago protegido en la app (demo: Stripe / Conekta / Mercado Pago)
// ---------------------------------------------------------------------------

export const PROTECTION_FEE_PCT = 8; // comisión de Reserva Protegida
export const REPLACEMENT_GUARANTEE_MXN = 2500;

export interface PaymentProviderInfo {
  id: 'stripe' | 'conekta' | 'mercadopago';
  label: string;
  note: string;
}

export const PAYMENT_PROVIDERS: PaymentProviderInfo[] = [
  {
    id: 'stripe',
    label: 'Stripe',
    note: 'Tarjetas internacionales, 3D Secure y pagos en cuotas.',
  },
  {
    id: 'conekta',
    label: 'Conekta',
    note: 'Hecho para México: tarjetas nacionales, SPEI y OXXO Pay.',
  },
  {
    id: 'mercadopago',
    label: 'Mercado Pago',
    note: 'Saldo de Mercado Pago, tarjetas y pagos en OXXO.',
  },
];

export interface DemoPaymentRecord {
  bookingId: string;
  provider: PaymentProviderInfo['id'];
  amountMxn: number;
  feeMxn: number;
  payoutMxn: number;
  paidAt: string;
  status: 'held' | 'released';
  reference: string;
}

type PaymentMap = Record<string, DemoPaymentRecord>;

export function getPaymentForBooking(
  bookingId: string
): DemoPaymentRecord | null {
  const map = readJson<PaymentMap>(PAYMENTS_KEY) ?? {};
  return map[bookingId] ?? null;
}

export function computeProtectedPayment(amountMxn: number): {
  feeMxn: number;
  payoutMxn: number;
  totalMxn: number;
} {
  const totalMxn = Math.round(amountMxn);
  const feeMxn = Math.round((amountMxn * PROTECTION_FEE_PCT) / 100);
  return { feeMxn, payoutMxn: totalMxn - feeMxn, totalMxn };
}

/**
 * Registra el pago DEMO. En producción esto lo hace el webhook del PSP:
 * el cliente paga al proveedor, el webhook marca la reserva como pagada y el
 * dinero se retiene hasta liberarlo al terminar el servicio.
 */
export function saveDemoPayment(
  bookingId: string,
  provider: PaymentProviderInfo['id'],
  amountMxn: number
): DemoPaymentRecord {
  const { feeMxn, payoutMxn } = computeProtectedPayment(amountMxn);
  const record: DemoPaymentRecord = {
    bookingId,
    provider,
    amountMxn: Math.round(amountMxn),
    feeMxn,
    payoutMxn,
    paidAt: new Date().toISOString(),
    status: 'held',
    reference: `demo_${provider}_${Date.now().toString(36)}`,
  };
  const map = readJson<PaymentMap>(PAYMENTS_KEY) ?? {};
  map[bookingId] = record;
  writeJson(PAYMENTS_KEY, map);
  return record;
}

export function releaseDemoPayment(bookingId: string): void {
  const map = readJson<PaymentMap>(PAYMENTS_KEY) ?? {};
  const record = map[bookingId];
  if (record) {
    record.status = 'released';
    writeJson(PAYMENTS_KEY, map);
  }
}

// ---------------------------------------------------------------------------
// Chat por reserva (demo local; en producción: subcolección Firestore + FCM)
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  bookingId: string;
  author: 'client' | 'pro';
  text: string;
  at: string;
  demo?: boolean;
}

type ChatStore = Record<string, ChatMessage[]>;

const DEMO_PRO_REPLIES = [
  '¡Hola! Confirmado, llevo insumos y llego puntual al horario acordado.',
  'Perfecto, anotado. Si hay alguna zona prioritaria, dime y la atiendo primero.',
  'Listo, nos vemos el día de la visita. Recuerda compartirme el código de la puerta al llegar.',
];

export function getBookingMessages(bookingId: string): ChatMessage[] {
  const store = readJson<ChatStore>(CHAT_KEY) ?? {};
  return store[bookingId] ?? [];
}

export function pushBookingMessage(
  bookingId: string,
  author: 'client' | 'pro',
  text: string
): ChatMessage[] {
  const store = readJson<ChatStore>(CHAT_KEY) ?? {};
  const list = store[bookingId] ?? [];
  list.push({
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    bookingId,
    author,
    text: text.trim().slice(0, 400),
    at: new Date().toISOString(),
  });

  // Respuesta automática de demostración cuando escribe el cliente.
  if (author === 'client') {
    const reply =
      DEMO_PRO_REPLIES[
        Math.floor((Date.now() / 1000) % DEMO_PRO_REPLIES.length)
      ];
    list.push({
      id: `msg_${Date.now() + 1}_${Math.random().toString(36).slice(2, 6)}`,
      bookingId,
      author: 'pro',
      text: reply,
      at: new Date(Date.now() + 1500).toISOString(),
      demo: true,
    });
  }

  store[bookingId] = list.slice(-40);
  writeJson(CHAT_KEY, store);
  return store[bookingId];
}

// ---------------------------------------------------------------------------
// Notificaciones (in-app + plantillas de correo y WhatsApp)
// ---------------------------------------------------------------------------

export interface NotificationEvent {
  id: string;
  type: 'booking_created' | 'booking_confirmed' | 'booking_completed' | 'payment' | 'chat';
  bookingId: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
}

export function getNotifications(): NotificationEvent[] {
  return (
    readJson<NotificationEvent[]>(NOTIFICATIONS_KEY) ?? []
  ).sort((a, b) => b.at.localeCompare(a.at));
}

export function getUnreadNotificationCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

export function recordNotification(
  event: Omit<NotificationEvent, 'id' | 'at' | 'read'>
): NotificationEvent {
  const list = getNotifications();
  const full: NotificationEvent = {
    ...event,
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    read: false,
  };
  writeJson(NOTIFICATIONS_KEY, [full, ...list].slice(0, 40));
  return full;
}

export function markNotificationsRead(): void {
  const list = getNotifications().map((n) => ({ ...n, read: true }));
  writeJson(NOTIFICATIONS_KEY, list);
}

export interface BookingNotificationPayload {
  bookingId: string;
  cleanerName: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  durationHours: number;
  totalMxn: number;
  city: string;
  coloniaAddress: string;
  clientName: string;
  clientPhone: string;
}

export function buildBookingWhatsAppUrl(payload: BookingNotificationPayload): string {
  const text = [
    `Hola ${payload.cleanerName}, te escribo desde LimpiaMX.`,
    `Nueva solicitud de ${payload.serviceType}: ${payload.scheduledDate} a las ${payload.scheduledTime} hrs (${payload.durationHours} horas).`,
    `Zona: ${payload.coloniaAddress} (${payload.city}). Total acordado: ${payload.totalMxn} MXN.`,
    `Quedo pendiente de tu confirmación. — ${payload.clientName}`,
  ].join('\n');
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildBookingMailtoUrl(payload: BookingNotificationPayload, to?: string): string {
  const subject = `Nueva reserva LimpiaMX · ${payload.serviceType} · ${payload.scheduledDate}`;
  const body = [
    `Hola ${payload.cleanerName}:`,
    '',
    `Tienes una nueva solicitud de reserva en LimpiaMX.`,
    `- Servicio: ${payload.serviceType}`,
    `- Fecha y hora: ${payload.scheduledDate} a las ${payload.scheduledTime} hrs`,
    `- Duración: ${payload.durationHours} horas`,
    `- Zona: ${payload.coloniaAddress} (${payload.city})`,
    `- Total acordado: ${payload.totalMxn} MXN`,
    `- Cliente: ${payload.clientName} · ${payload.clientPhone}`,
    '',
    `Confirma o rechaza desde tu panel: ${window.location.origin}${window.location.pathname}#/mis-reservas`,
    '',
    '— Equipo LimpiaMX',
  ].join('\n');
  const mailbox = to ? to : '';
  return `mailto:${mailbox}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ---------------------------------------------------------------------------
// Reportes de perfiles y reseñas
// ---------------------------------------------------------------------------

export type ReportReason =
  | 'perfil_falso'
  | 'precio_incorrecto'
  | 'contenido_ofensivo'
  | 'solicitud_sospechosa'
  | 'otro';

export const REPORT_REASONS: { id: ReportReason; label: string }[] = [
  { id: 'perfil_falso', label: 'Parece un perfil falso o suplantado' },
  { id: 'precio_incorrecto', label: 'La tarifa o los datos no coinciden' },
  { id: 'contenido_ofensivo', label: 'Contenido ofensivo o discriminatorio' },
  { id: 'solicitud_sospechosa', label: 'Pide dinero por adelantado o datos raros' },
  { id: 'otro', label: 'Otro motivo' },
];

export interface ReportRecord {
  id: string;
  targetType: 'cleaner' | 'review';
  targetId: string;
  targetLabel: string;
  reason: ReportReason;
  detail: string;
  at: string;
}

export function submitReport(
  targetType: 'cleaner' | 'review',
  targetId: string,
  targetLabel: string,
  reason: ReportReason,
  detail: string
): ReportRecord {
  const record: ReportRecord = {
    id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    targetType,
    targetId,
    targetLabel: targetLabel.slice(0, 120),
    reason,
    detail: detail.trim().slice(0, 400),
    at: new Date().toISOString(),
  };
  const list = readJson<ReportRecord[]>(REPORTS_KEY) ?? [];
  writeJson(REPORTS_KEY, [record, ...list].slice(0, 60));
  return record;
}

export function getReports(): ReportRecord[] {
  return readJson<ReportRecord[]>(REPORTS_KEY) ?? [];
}
