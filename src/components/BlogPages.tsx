import React from 'react';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';
import { BLOG_POSTS, BlogPost, getBlogPost } from '../data/blogPosts';
import { ActiveSection } from './Header';

interface BlogIndexProps {
  onNavigate: (section: ActiveSection) => void;
  onOpenPost: (slug: string) => void;
}

export const BlogIndexPage: React.FC<BlogIndexProps> = ({
  onNavigate,
  onOpenPost,
}) => (
  <div className="bg-slate-50 min-h-full">
    <section className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-teal-700 text-white flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            Guías de limpieza
          </h1>
        </div>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          Precios reales del catálogo, listas de preparación y estándares de
          servicio. Escritas por el equipo de LimpiaMX con datos de los perfiles
          activos, sin recetas genéricas.
        </p>
      </div>
    </section>

    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-4">
        {BLOG_POSTS.map((post) => (
          <article
            key={post.slug}
            className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 hover:border-teal-300 hover:shadow-sm transition-all"
          >
            <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 font-semibold">
                {post.category}
              </span>
              <span className="text-slate-500 tabular-nums">
                {post.dateLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500 tabular-nums">
                <Clock className="w-3 h-3" />
                {post.readMinutes} min de lectura
              </span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-2 text-balance">
              {post.title}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4 max-w-3xl">
              {post.excerpt}
            </p>
            <button
              type="button"
              onClick={() => onOpenPost(post.slug)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
            >
              Leer la guía
              <ArrowRight className="w-4 h-4" />
            </button>
          </article>
        ))}
      </div>

      <div className="mt-10 bg-white border border-slate-200 rounded-xl p-6 text-center">
        <p className="text-sm text-slate-600 mb-3">
          ¿Listo para contratar? Cotiza tu limpieza y compara perfiles con
          tarifa clara por hora.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('cotizador')}
            className="px-5 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors cursor-pointer"
          >
            Abrir el cotizador
          </button>
          <button
            type="button"
            onClick={() => onNavigate('explorar')}
            className="px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Explorar profesionales
          </button>
        </div>
      </div>
    </div>
  </div>
);

interface BlogArticleProps {
  slug: string;
  onNavigate: (section: ActiveSection) => void;
  onOpenPost: (slug: string) => void;
}

export const BlogArticlePage: React.FC<BlogArticleProps> = ({
  slug,
  onNavigate,
  onOpenPost,
}) => {
  const post: BlogPost | null = getBlogPost(slug);
  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-slate-600 mb-4">
          No encontramos esa guía. Puede que se haya movido de lugar.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('blog')}
          className="px-5 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 cursor-pointer"
        >
          Ver todas las guías
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-full">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <nav aria-label="Ruta" className="text-xs text-slate-500 mb-5">
          <button
            type="button"
            onClick={() => onNavigate('blog')}
            className="hover:text-teal-700 cursor-pointer"
          >
            Guías
          </button>
          <span className="mx-1.5">/</span>
          <span className="text-slate-700">{post.category}</span>
        </nav>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3 text-balance">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-8 tabular-nums">
          <span>{post.dateLabel}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.readMinutes} min de lectura
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
          {post.blocks.map((block, idx) => {
            if (block.kind === 'h2') {
              return (
                <h2
                  key={idx}
                  className="font-display text-xl font-bold text-slate-900 pt-2"
                >
                  {block.text}
                </h2>
              );
            }
            if (block.kind === 'p') {
              return (
                <p
                  key={idx}
                  className="text-sm sm:text-base text-slate-700 leading-relaxed"
                >
                  {block.text}
                </p>
              );
            }
            if (block.kind === 'bullets') {
              return (
                <ul key={idx} className="space-y-2 pl-1">
                  {block.items?.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm sm:text-base text-slate-700 leading-relaxed"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-700 mt-2 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <ol key={idx} className="space-y-2.5">
                {block.items?.map((item, sIdx) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal-700 text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                      {sIdx + 1}
                    </span>
                    <span className="text-sm sm:text-base text-slate-700 leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ol>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate('blog')}
            className="text-sm font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
          >
            ← Todas las guías
          </button>
          <button
            type="button"
            onClick={() => onNavigate('cotizador')}
            className="px-5 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors cursor-pointer"
          >
            Cotizar mi limpieza
          </button>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-lg font-semibold text-slate-900 mb-3">
            Sigue leyendo
          </h2>
          <div className="space-y-3">
            {BLOG_POSTS.filter((p) => p.slug !== slug).map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => onOpenPost(p.slug)}
                className="w-full text-left bg-white border border-slate-200 rounded-xl px-5 py-4 hover:border-teal-300 transition-colors cursor-pointer"
              >
                <p className="text-sm font-semibold text-slate-900">{p.title}</p>
                <p className="text-xs text-slate-500 mt-1">{p.excerpt}</p>
              </button>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
};
