import { BookingRecord, CleanerListing, UserProfile } from '../types/marketplace';

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '""';
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `"${String(value)}"`;
  }
  let str = String(value).replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ');
  // Guard against spreadsheet formula injection (=, +, -, @, tab, CR), even after leading whitespace
  if (/^[=+\-@\t\r]/.test(str.trimStart())) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

function formatDateIso(date?: Date | null): string {
  if (!date) return '';
  return date.toISOString();
}

function getTodayFileStamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildCsvContent(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const bodyLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  // Prepend UTF-8 BOM so Spanish accents render properly in Excel
  return `\uFEFF${[headerLine, ...bodyLines].join('\r\n')}`;
}

export function triggerCsvDownload(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportUsersCsv(
  users: UserProfile[],
  filenamePrefix = 'limpiamx-usuarios'
): string {
  const headers = [
    'uid',
    'nombre',
    'apellidos',
    'nombre_completo',
    'correo',
    'telefono',
    'rol',
    'ciudad',
    'estado',
    'colonia',
    'codigo_postal',
    'preferencia_contacto',
    'perfil_completo',
    'suspendido',
    'fecha_registro',
  ];

  const rows = users.map((u) => [
    u.uid,
    u.firstName,
    u.lastName,
    u.displayName,
    u.email,
    u.phone,
    u.role === 'professional' ? 'Profesional' : 'Cliente',
    u.city,
    u.state,
    u.neighborhood,
    u.postalCode,
    u.contactPreference,
    u.profileCompleted ? 'Sí' : 'No',
    u.suspended ? 'Sí' : 'No',
    formatDateIso(u.createdAt),
  ]);

  const filename = `${filenamePrefix}-${getTodayFileStamp()}.csv`;
  triggerCsvDownload(filename, buildCsvContent(headers, rows));
  return filename;
}

export function exportCleanersCsv(
  cleaners: CleanerListing[],
  filenamePrefix = 'limpiamx-profesionales'
): string {
  const headers = [
    'id_anuncio',
    'uid_propietario',
    'nombre_profesional',
    'nombre_comercial',
    'especialidad',
    'ciudad',
    'estado',
    'colonias_cobertura',
    'servicios',
    'tarifa_hora_mxn',
    'tarifa_fija_mxn',
    'horas_minimas',
    'anos_experiencia',
    'incluye_insumos',
    'disponibilidad',
    'estado_anuncio',
    'calificacion_promedio',
    'resenas',
    'servicios_completados',
    'fecha_publicacion',
  ];

  const rows = cleaners.map((c) => [
    c.id,
    c.ownerId,
    c.displayName,
    c.businessName,
    c.headline,
    c.city,
    c.state,
    c.colonias.join(' | '),
    c.services.join(' | '),
    c.hourlyRateMxn,
    c.fixedServiceRateMxn,
    c.minHours,
    c.yearsExperience,
    c.includesSupplies ? 'Sí' : 'No',
    c.availability,
    c.status,
    c.ratingAvg,
    c.reviewsCount,
    c.completedCount,
    formatDateIso(c.createdAt),
  ]);

  const filename = `${filenamePrefix}-${getTodayFileStamp()}.csv`;
  triggerCsvDownload(filename, buildCsvContent(headers, rows));
  return filename;
}

export function exportBookingsCsv(
  bookings: BookingRecord[],
  filenamePrefix = 'limpiamx-contrataciones'
): string {
  const headers = [
    'folio_reserva',
    'uid_cliente',
    'cliente',
    'telefono_cliente',
    'id_profesional',
    'profesional',
    'origen_anuncio',
    'ciudad',
    'direccion_colonia',
    'tipo_servicio',
    'tamano_propiedad',
    'fecha_programada',
    'hora_programada',
    'duracion_horas',
    'tarifa_hora_mxn',
    'total_mxn',
    'estado',
    'notas',
    'fecha_solicitud',
  ];

  const rows = bookings.map((b) => [
    b.id,
    b.clientId,
    b.clientName,
    b.clientPhone,
    b.cleanerId,
    b.cleanerName,
    b.listingSource,
    b.city,
    b.coloniaAddress,
    b.serviceType,
    b.propertySize,
    b.scheduledDate,
    b.scheduledTime,
    b.durationHours,
    b.hourlyRateMxn,
    b.totalMxn,
    b.status,
    b.notes,
    formatDateIso(b.createdAt),
  ]);

  const filename = `${filenamePrefix}-${getTodayFileStamp()}.csv`;
  triggerCsvDownload(filename, buildCsvContent(headers, rows));
  return filename;
}
