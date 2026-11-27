import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getPost, posts } from '@/data/blog';

export function generateStaticParams() { return posts.map((post) => ({ slug: post.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const post = getPost((await params).slug); return post ? { title: post.title, description: post.excerpt, openGraph: { title: post.title, description: post.excerpt, images: [post.image], type: 'article' } } : { title: 'Guía no encontrada' }; }

export default async function BlogArticle({ params }: { params: Promise<{ slug: string }> }) { const post = getPost((await params).slug); if (!post) notFound(); return <><section className="section"><div className="shell article-layout"><Link href="/blog" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><ArrowLeft size={15} /> Todas las guías</Link><div style={{ marginTop: 48 }}><span className="article-kicker">{post.category} · {post.readTime} de lectura</span><h1>{post.title}</h1><p className="lede">{post.excerpt}</p><p className="article-meta">Publicado el {post.date}</p><div className="article-image"><Image src={post.image} alt="" width={1200} height={800} priority sizes="(max-width: 900px) 100vw, 810px" /></div><div className="prose">{post.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</div><div className="cta" style={{ marginTop: 70 }}><h2>¿Listo para dar el siguiente paso?</h2><p>Explora perfiles o calcula un rango antes de escribir.</p><div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}><Link href="/explorar" className="btn btn-lime">Explorar profesionales <ArrowUpRight size={16} /></Link><Link href="/cotizador" className="btn" style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }}>Abrir cotizador</Link></div></div></div></div></section></>; }
