import React from 'react';
import { IllustrationNotFound } from './SharedUI';
import { ActiveSection } from './Header';

interface NotFoundPageProps {
  onNavigate: (section: ActiveSection) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => (
  <div className="min-h-full bg-slate-50 flex items-center justify-center px-4 py-16">
    <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-8 sm:p-10 text-center">
      <IllustrationNotFound />
      <p className="font-display text-5xl font-bold text-teal-800 mt-4 mb-1 tabular-nums">
        404
      </p>
      <h1 className="font-display text-xl font-bold text-slate-900 mb-2">
        Esta página no existe (o se mudó)
      </h1>
      <p className="text-sm text-slate-600 leading-relaxed mb-7">
        La dirección que abriste no coincide con ninguna página de LimpiaMX.
        Puedes volver al inicio para ver los perfiles disponibles, cotizar tu
        limpieza o leer nuestras guías.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate('explorar')}
          className="px-5 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors cursor-pointer"
        >
          Ir al inicio
        </button>
        <button
          type="button"
          onClick={() => onNavigate('cotizador')}
          className="px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Cotizar limpieza
        </button>
        <button
          type="button"
          onClick={() => onNavigate('blog')}
          className="px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Ver guías
        </button>
      </div>
    </div>
  </div>
);
