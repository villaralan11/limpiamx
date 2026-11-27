import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import type { Professional } from '@/data/site';
import { formatMxn } from '@/lib/utils';
import { FavoriteButton } from '@/components/favorite-button';
import { ReportButton } from '@/components/report-button';

export function ProfessionalCard({ professional }: { professional: Professional }) {
  return (
    <article className="profile-card">
      <div className="profile-media">
        <Image src={professional.photo} alt={`Retrato de ${professional.name}`} width={720} height={720} sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw" />
        {professional.verified && <span className="profile-badge"><BadgeCheck size={14} /> Verificado</span>}
        <FavoriteButton professionalId={professional.id} compact />
      </div>
      <div className="profile-body">
        <div className="profile-topline"><h3><Link href={`/profesionales/${professional.id}`}>{professional.name}</Link></h3><span className="profile-rating"><Star size={12} fill="currentColor" /> {professional.rating}</span></div>
        <p className="profile-business">{professional.business || professional.city}</p>
        <p className="profile-headline">{professional.headline}</p>
        <div className="profile-details"><span className="chip"><MapPin size={12} /> {professional.city}</span>{professional.services.slice(0, 2).map((service) => <span className="chip" key={service}>{service}</span>)}</div>
        <div className="profile-footer"><div className="profile-rate"><strong>{formatMxn(professional.rate)}</strong><span>por hora · {professional.experience} años</span></div><Link className="btn btn-secondary btn-small" href={`/profesionales/${professional.id}`}>Ver perfil</Link></div>
        <ReportButton targetId={professional.id} targetName={professional.name} />
      </div>
    </article>
  );
}
