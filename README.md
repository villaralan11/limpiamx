# LimpiaMX

Marketplace para contratar y anunciar servicios de limpieza en México (CDMX, Ecatepec, Guadalajara, Monterrey, Puebla, Querétaro y Mérida).

Proyecto escolar con fines demostrativos. Parte del contenido (perfiles, reseñas y cifras) es de ejemplo.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Firebase (Auth, Firestore, Storage) · Google Maps Platform · Recharts

## Estructura del sitio

Navegación por hash (`#/planes`, `#/faq`…), así que cada página se puede compartir y funciona el botón Atrás.

| Ruta | Contenido |
|---|---|
| `#/explorar` (inicio) | Hero, cifras, servicios, catálogo, cómo funciona, seguridad, reseñas, planes, preguntas frecuentes y llamado para profesionales |
| `#/profesional/<id>` | Página pública de cada profesional (link compartible con botón "Compartir por WhatsApp") |
| `#/limpieza-en-<ciudad>` | Página local por ciudad: precios promedio reales, pros, colonias, consejos y FAQ (7 ciudades) |
| `#/cotizador` | Cotizador: m², recámaras y baños → horas y rango de precio con tarifas reales del catálogo |
| `#/blog` · `#/blog/<slug>` | Guías: precios de limpieza profunda en CDMX, checklist previo y rotación de Airbnb |
| `#/planes` | Planes y modelo de ingresos |
| `#/nosotros` | Sobre nosotros |
| `#/seguridad` | Confianza y seguridad (verificación INE, código de puerta, pagos) |
| `#/faq` | Preguntas frecuentes |
| `#/contacto` | Formulario de contacto (abre el correo del usuario) |
| `#/terminos` · `#/privacidad` | Páginas legales (modelo, requieren revisión de un abogado) |
| `#/anunciate` · `#/mis-reservas` · `#/mi-perfil` | Requieren sesión con Google |
| (cualquier otra ruta) | Página 404 con ilustración y accesos rápidos |

## Funciones de producto (nuevo en esta versión)

- **Verificación de identidad (INE):** el profesional sube su INE en *Mi perfil*; al aprobarse muestra la insignia "Verificado" en todas las vistas. Demo local (localStorage) — ver plan.
- **Código de seguridad en la puerta:** cada reserva genera un código de 6 dígitos determinista que cliente y profesional ven en Mis reservas.
- **Pago protegido en la app:** hoja de pago con Stripe/Conekta/Mercado Pago (simulada), comisión 8% y garantía de reposición hasta $2,500 MXN.
- **Chat y notificaciones por reserva:** chat por reserva + panel de actividad con avisos por WhatsApp/correo prellenados.
- **Calendario de disponibilidad:** próximos 14 días por profesional en el modal de reserva + agenda semanal en el panel pro.
- **Reportes y emergencia:** reportar perfil o reseña desde cualquier tarjeta y botón flotante de emergencia (911 + correo).
- **PWA instalable:** manifest + service worker + iconos (`public/icons`), solo en build de producción.
- **Botón flotante de WhatsApp** y **páginas 404/estados vacíos** con ilustraciones propias.

> El plan para pasar cada función a producción está en [PLAN_INTEGRACION.md](./PLAN_INTEGRACION.md).

## Editar contenido

Todo el texto editorial (FAQ, planes, consejos de seguridad, correo de contacto y número de WhatsApp) está en `src/data/siteContent.ts`.
Antes de publicar, cambia `SITE.contactEmail` y `SITE.whatsappNumber`.

## Correr en local

```bash
npm install --legacy-peer-deps
cp .env.example .env.local   # agrega VITE_GOOGLE_MAPS_API_KEY
npm run dev                  # http://localhost:3000
```

## Comandos

```bash
npm run lint    # revisión de tipos (tsc --noEmit)
npm run build   # build de producción en dist/
```
