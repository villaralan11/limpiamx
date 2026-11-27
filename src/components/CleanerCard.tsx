import React, { useEffect, useState } from 'react';
import { Award, Flag, Heart, Sparkles, Star } from 'lucide-react';
import { CleanerListing, formatMxn } from '../types/marketplace';
import { VerifiedBadge } from './SharedUI';
import { ReportDialog } from './BookingModules';

interface CleanerCardProps {
  cleaner: CleanerListing;
  isFavorite: boolean;
  onToggleFavorite: (cleanerId: string) => void;
  onSelect: (cleaner: CleanerListing) => void;
}

export const CleanerCard: React.FC<CleanerCardProps> = ({
  cleaner,
  isFavorite,
  onToggleFavorite,
  onSelect,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [cleaner.photoUrl]);

  const isTopRated = cleaner.ratingAvg >= 4.8 && cleaner.reviewsCount >= 2;
  const coloniasLabel = cleaner.colonias.slice(0, 2).join(', ');
  const extraColonias =
    cleaner.colonias.length > 2 ? ` +${cleaner.colonias.length - 2}` : '';

  return (
    <article className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* 4:3 Portrait Media Slot */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {!imgFailed && cleaner.photoUrl ? (
          <img
            src={cleaner.photoUrl}
            alt={`Retrato de ${cleaner.displayName}, especialista de limpieza en ${cleaner.city}`}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-teal-50 flex flex-col items-center justify-center p-6 text-center">
            <Sparkles className="w-8 h-8 text-teal-700 mb-2" />
            <span className="font-display text-base font-semibold text-slate-800">
              {cleaner.displayName}
            </span>
          </div>
        )}

        <button
          type="button"
          aria-label={
            isFavorite
              ? `Quitar a ${cleaner.displayName} de favoritos`
              : `Guardar a ${cleaner.displayName} en favoritos`
          }
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(cleaner.id);
          }}
          className="absolute top-3 right-3 w-10 h-10 rounded-lg bg-white/95 border border-slate-200 flex items-center justify-center text-slate-700 hover:text-teal-700 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          <Heart
            className={`w-4 h-4 ${
              isFavorite ? 'fill-teal-700 text-teal-700' : ''
            }`}
          />
        </button>
      </div>

      {/* Card Body: Uniform field order, zero pill spam */}
      <div className="p-5 flex-1 flex flex-col">
        <p className="text-xs font-medium text-slate-500 truncate mb-1">
          {cleaner.city} · {coloniasLabel}
          {extraColonias}
          {cleaner.isDemo ? ' · Demo' : ''}
        </p>

        <div className="flex items-center justify-between gap-2 mb-1.5">
          <h3 className="font-display text-base font-semibold text-slate-900 truncate">
            {cleaner.businessName || cleaner.displayName}
          </h3>
          {isTopRated ? (
            <span
              title="Excelente reputación basada en reseñas"
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-800 shrink-0"
            >
              <Award className="w-4 h-4 text-teal-700" />
              <span>Destacado</span>
            </span>
          ) : cleaner.profileCompleted ? (
            <span className="text-xs font-medium text-slate-500 shrink-0">
              Perfil completo
            </span>
          ) : null}
        </div>

        {cleaner.identityVerified && (
          <div className="mb-1.5">
            <VerifiedBadge />
          </div>
        )}

        <p className="text-sm text-slate-600 line-clamp-2 leading-snug mb-3">
          {cleaner.headline}
        </p>

        {/* Unboxed Metadata Line */}
        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-1.5 gap-y-1 mb-4 tabular-nums">
          <span className="inline-flex items-center gap-1 font-medium text-slate-800">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            {cleaner.ratingAvg.toFixed(1)}
          </span>
          <span>({cleaner.reviewsCount})</span>
          <span aria-hidden="true">·</span>
          <span>{cleaner.yearsExperience} años exp.</span>
          <span aria-hidden="true">·</span>
          <span>
            {cleaner.includesSupplies ? 'Incluye insumos' : 'Sin insumos'}
          </span>
        </div>

        {/* Baseline Price + CTA */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-base font-semibold text-slate-900 tabular-nums">
              {formatMxn(cleaner.hourlyRateMxn)}
            </span>
            <span className="text-xs text-slate-500"> / hora</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              aria-label={`Reportar el perfil de ${cleaner.displayName}`}
              title="Reportar este perfil"
              onClick={(e) => {
                e.stopPropagation();
                setReportOpen(true);
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onSelect(cleaner)}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-teal-700 transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Ver perfil
            </button>
          </div>
        </div>
      </div>

      {reportOpen && (
        <ReportDialog
          targetType="cleaner"
          targetId={cleaner.id}
          targetLabel={cleaner.businessName || cleaner.displayName}
          onClose={() => setReportOpen(false)}
        />
      )}
    </article>
  );
};
