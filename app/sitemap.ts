import type { MetadataRoute } from 'next';
import { cities, professionals, site } from '@/data/site';
import { posts } from '@/data/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!site.url) return [];
  const origin = site.url.replace(/\/$/, '');
  const staticRoutes = ['', '/explorar', '/cotizador', '/blog', '/planes', '/nosotros', '/seguridad', '/faq', '/contacto', '/terminos', '/privacidad'];
  return [...staticRoutes.map((path) => ({ url: `${origin}${path}`, lastModified: new Date(), changeFrequency: path === '' ? 'weekly' as const : 'monthly' as const, priority: path === '' ? .9 : .6 })), ...cities.map((city) => ({ url: `${origin}/ciudades/${city.slug}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: .7 })), ...professionals.map((professional) => ({ url: `${origin}/profesionales/${professional.id}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: .65 })), ...posts.map((post) => ({ url: `${origin}/blog/${post.slug}`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: .6 }))];
}
