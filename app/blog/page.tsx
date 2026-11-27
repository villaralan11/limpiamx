import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { posts } from '@/data/blog';

export const metadata: Metadata = { title: 'Guías de limpieza', description: 'Consejos sobre precios, confianza y organización para contratar limpieza en México.' };

export default function BlogPage() { return <><section className="page-hero"><div className="shell"><span className="eyebrow">Notas para vivir mejor</span><h1>Guías para elegir con calma.</h1><p>Precios, preparación, seguridad y rutinas para que la limpieza sea una decisión más sencilla.</p></div></section><section className="section"><div className="shell"><div className="blog-grid">{posts.map((post) => <article className="blog-card" key={post.slug}><Image src={post.image} alt="" width={1000} height={700} sizes="(max-width: 720px) 100vw, 33vw" /><div className="blog-card-body"><div className="meta"><span>{post.category}</span><span>·</span><span>{post.readTime}</span></div><h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2><p>{post.excerpt}</p><Link href={`/blog/${post.slug}`} className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 20 }}>Leer guía <ArrowUpRight size={14} /></Link></div></article>)}</div></div></section></>; }
