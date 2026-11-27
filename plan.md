# Plan de implementación — LimpiaMX

## Producto

LimpiaMX será un marketplace editorial y confiable para descubrir, comparar y contactar profesionales de limpieza en México. La maqueta entregada funciona como referencia de contenido y dirección visual, pero no se reutiliza como base arquitectónica.

## Decisiones confirmadas

- La experiencia de inicio de sesión será exclusivamente con Google/Gmail.
- El contacto primario será por WhatsApp y correo Gmail.
- El despliegue inicial usará una URL temporal del entorno de Google AI Studio; el origen público se dejará configurable para conectar un dominio propio después.
- Se conservarán las fotografías, textos y datos conceptuales útiles de la maqueta, pero se eliminarán dependencias de hash-routing y demostraciones engañosamente presentadas como producción.

## Stack y ejecución

- Next.js con App Router y TypeScript.
- Tailwind CSS para tokens y composición responsive.
- Firebase Auth con Google como único proveedor; Firestore y Storage quedan encapsulados para conectar datos reales.
- Route Handlers de Next.js para formularios, reportes y operaciones que no deben ejecutarse directamente desde el cliente.
- Zod y React Hook Form para validación.
- Motion solo para transiciones cortas y respetuosas con `prefers-reduced-motion`.
- Lucide React para iconografía.
- Node 22 + pnpm fijado en el proyecto.

## Fases

### Fase 1 — Fundación y dirección visual

Crear el shell de Next.js, el sistema de diseño, tipografía, navegación, layout responsive, SEO base y la página pública principal. Reutilizar las fotografías de la maqueta optimizadas y declarar `manus-routes.json`.

### Fase 2 — Directorio y conversión

Construir explorar, filtros, tarjetas de profesionales, perfiles públicos, páginas por ciudad, cotizador y estados vacíos/error. Cada página pública tendrá contenido inicial indexable y metadatos propios.

### Fase 3 — Cuenta y operación

Agregar autenticación Google, onboarding de cliente/profesional, publicación de anuncio, panel de reservas, reseñas y contacto validado. Las acciones protegidas tendrán estados de carga, error y éxito.

### Fase 4 — Confianza y administración

Agregar reportes, verificación preparada para INE, panel administrativo segmentado y reglas de acceso. Pagos, chat y notificaciones quedan preparados mediante interfaces claras, sin fingir que están activos sin credenciales y webhooks reales.

### Fase 5 — Validación y entrega

Ejecutar diagnósticos, lint, build, revisión responsive, revisión de rutas y comprobación SEO. Configurar comandos de desarrollo y producción, documentar variables de entorno y dejar listo el despliegue en Vercel o entorno compatible.

## Diseño

### Movimiento

Editorial cálido y minimalismo tecnológico inspirado en Apple, aplicado a un servicio cotidiano mexicano.

### Principios

1. La confianza debe entenderse en menos de diez segundos.
2. La fotografía tiene más peso que la decoración.
3. Cada pantalla debe tener una acción principal evidente.
4. La interfaz debe sentirse calmada, no como un panel saturado.

### Filosofía de color

El teal profundo hereda la identidad de la maqueta y comunica limpieza, calma y seguridad. El marfil y la arena evitan la frialdad clínica; el lima suave señala disponibilidad, verificación y éxito. El carbón sustituye al negro absoluto para conservar una sensación editorial.

### Tipografía

- Titulares: Bricolage Grotesque, con pesos 500–700.
- Interfaz y texto: DM Sans, con tamaños generosos y alto interlineado.
- Números y datos: IBM Plex Mono cuando sea útil para precios, códigos y estados.

### Layout

Composiciones asimétricas controladas: hero dividido entre mensaje y fotografía, secciones de ancho completo alternadas con bloques estrechos, tarjetas de perfil con ritmo editorial y CTA anclados al contexto.

### Elementos distintivos

- Marco de fotografía con esquinas suaves y pequeñas etiquetas mono.
- Líneas y puntos de ruta que evocan colonia, ciudad y cercanía.
- Chips de confianza con iconos simples, no badges genéricos.

### Voz

Clara, humana y directa. No promete perfección ni usa lenguaje corporativo vacío.

Ejemplos:

- “Encuentra a alguien que cuide tu espacio como tú.”
- “Precios claros, perfiles reales y una reserva que puedes entender.”

### Esencia

LimpiaMX conecta hogares, oficinas y profesionales de limpieza con claridad, contexto local y confianza verificable.

Personalidad: cercana, meticulosa, transparente.

## Contacto provisional

Mientras el usuario confirma sus datos finales, el correo y WhatsApp heredados de la maqueta se mantienen únicamente en `data/site.ts`, sin dispersarlos por componentes. Deben sustituirse antes de publicar.

## Estructura

```text
app/
├── (marketing)/
│   ├── page.tsx
│   ├── nosotros/page.tsx
│   ├── seguridad/page.tsx
│   ├── planes/page.tsx
│   ├── faq/page.tsx
│   ├── contacto/page.tsx
│   ├── blog/page.tsx
│   ├── blog/[slug]/page.tsx
│   ├── ciudades/[slug]/page.tsx
│   ├── profesionales/[id]/page.tsx
│   └── cotizador/page.tsx
├── explorar/page.tsx
├── cuenta/{reservas,perfil,publicar}/page.tsx
├── admin/page.tsx
├── api/{contact,reports,bookings,payments,ine}/...
├── layout.tsx
├── globals.css
├── sitemap.ts
├── robots.ts
└── not-found.tsx
components/
├── layout/
├── navigation/
├── home/
├── directory/
├── professionals/
├── bookings/
├── quote/
├── forms/
├── account/
├── admin/
└── ui/
data/
lib/
types/
public/
```
