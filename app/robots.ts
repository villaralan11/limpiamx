import type { MetadataRoute } from 'next';
import { site } from '@/data/site';

export default function robots(): MetadataRoute.Robots {
  if (!site.url) return { rules: [{ userAgent: '*', disallow: '/' }] };
  const origin = site.url.replace(/\/$/, '');
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/cuenta/', '/admin/', '/api/'] }], sitemap: `${origin}/sitemap.xml` };
}
