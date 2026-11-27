import type { Professional } from '@/data/site';

export function formatMxn(value: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);
}

export function initials(name: string) {
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function filterProfessionals(items: Professional[], query: string, city: string, service: string, maxRate = '', suppliesOnly = false) {
  const normalizedQuery = normalizeText(query.trim());
  return items.filter((item) => {
    const matchesCity = city === 'Todas' || item.city === city;
    const matchesService = service === 'Todos' || item.services.includes(service);
    const matchesRate = !maxRate || item.rate <= Number(maxRate);
    const matchesSupplies = !suppliesOnly || item.supplies;
    const haystack = normalizeText([item.name, item.business, item.city, ...item.zones, ...item.services].join(' '));
    return matchesCity && matchesService && matchesRate && matchesSupplies && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
}

export function absoluteUrl(pathname: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  return origin ? `${origin.replace(/\/$/, '')}${pathname}` : undefined;
}
