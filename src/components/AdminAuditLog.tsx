import React, { useMemo, useState } from 'react';
import {
  Ban,
  Briefcase,
  CalendarClock,
  Download,
  History,
  ShieldOff,
  ShieldPlus,
  Trash2,
  UserCheck,
  UserCog,
} from 'lucide-react';
import {
  AuditActionType,
  AuditLogRecord,
  AuditTargetType,
} from '../types/marketplace';

interface AdminAuditLogProps {
  logs: AuditLogRecord[];
  compact?: boolean;
  onViewAll?: () => void;
}

const ACTION_META: Record<
  AuditActionType,
  { label: string; colorClass: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  promote_admin: {
    label: 'Promoción a admin',
    colorClass: 'text-teal-700 bg-teal-50',
    Icon: ShieldPlus,
  },
  revoke_admin: {
    label: 'Revocación de admin',
    colorClass: 'text-red-700 bg-red-50',
    Icon: ShieldOff,
  },
  suspend_user: {
    label: 'Suspensión de usuario',
    colorClass: 'text-amber-700 bg-amber-50',
    Icon: Ban,
  },
  reactivate_user: {
    label: 'Reactivación de usuario',
    colorClass: 'text-teal-700 bg-teal-50',
    Icon: UserCheck,
  },
  change_user_role: {
    label: 'Cambio de rol',
    colorClass: 'text-slate-700 bg-slate-100',
    Icon: UserCog,
  },
  delete_user: {
    label: 'Usuario eliminado',
    colorClass: 'text-red-700 bg-red-50',
    Icon: Trash2,
  },
  change_cleaner_status: {
    label: 'Estado de anuncio',
    colorClass: 'text-slate-700 bg-slate-100',
    Icon: Briefcase,
  },
  delete_cleaner: {
    label: 'Anuncio eliminado',
    colorClass: 'text-red-700 bg-red-50',
    Icon: Trash2,
  },
  change_booking_status: {
    label: 'Estado de reserva',
    colorClass: 'text-slate-700 bg-slate-100',
    Icon: CalendarClock,
  },
  delete_booking: {
    label: 'Reserva eliminada',
    colorClass: 'text-red-700 bg-red-50',
    Icon: Trash2,
  },
  delete_review: {
    label: 'Reseña eliminada',
    colorClass: 'text-red-700 bg-red-50',
    Icon: Trash2,
  },
  export_csv: {
    label: 'Respaldo CSV',
    colorClass: 'text-teal-700 bg-teal-50',
    Icon: Download,
  },
  seed_demo_data: {
    label: 'Datos de ejemplo',
    colorClass: 'text-teal-700 bg-teal-50',
    Icon: Briefcase,
  },
};

function formatAuditDate(date?: Date | null): string {
  if (!date) return 'Reciente';
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const AdminAuditLog: React.FC<AdminAuditLogProps> = ({
  logs,
  compact = false,
  onViewAll,
}) => {
  const [targetFilter, setTargetFilter] = useState<AuditTargetType | 'all'>('all');

  const visibleLogs = useMemo(() => {
    const filtered =
      targetFilter === 'all'
        ? logs
        : logs.filter((entry) => entry.targetType === targetFilter);
    return compact ? filtered.slice(0, 5) : filtered;
  }, [logs, targetFilter, compact]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <History className="w-4 h-4 text-teal-700 shrink-0" />
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              {compact
                ? 'Últimas acciones de administradores'
                : 'Log de auditoría administrativa'}
            </h2>
            <p className="text-xs text-slate-500">
              Registro inmutable en Firestore de cambios y moderación realizados en este panel.
            </p>
          </div>
        </div>

        {compact && onViewAll && logs.length > 0 && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-medium text-teal-700 hover:text-teal-800 self-start sm:self-center cursor-pointer tabular-nums"
          >
            Ver historial completo ({logs.length})
          </button>
        )}

        {!compact && (
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'admin', label: 'Admins' },
                { id: 'user', label: 'Usuarios' },
                { id: 'cleaner', label: 'Anuncios' },
                { id: 'booking', label: 'Reservas' },
                { id: 'review', label: 'Reseñas' },
                { id: 'export', label: 'Respaldos' },
              ] as { id: AuditTargetType | 'all'; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTargetFilter(opt.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  targetFilter === opt.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {visibleLogs.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          {logs.length === 0
            ? 'Todavía no hay acciones registradas. Cada cambio que realices en Usuarios, Anuncios, Contrataciones, Reseñas o Administradores quedará guardado aquí.'
            : 'No hay eventos de auditoría en esta categoría.'}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visibleLogs.map((entry) => {
            const meta = ACTION_META[entry.action] ?? ACTION_META.suspend_user;
            const Icon = meta.Icon;
            return (
              <li
                key={entry.id}
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/70"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${meta.colorClass}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium text-slate-900 leading-snug">
                      {entry.summary}
                    </p>
                    <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-medium text-slate-700">{meta.label}</span>
                      <span>·</span>
                      <span className="font-mono">{entry.actorEmail}</span>
                      <span>·</span>
                      <span>Objetivo: {entry.targetLabel}</span>
                    </p>
                  </div>
                </div>

                <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap shrink-0 sm:text-right pl-11 sm:pl-0">
                  {formatAuditDate(entry.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
