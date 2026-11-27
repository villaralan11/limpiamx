# Entregables LimpiaMX

## Fundación visual y técnica

- [x] Construir desde cero una aplicación Next.js + React + TypeScript con una estructura mantenible; no reutilizar `App.tsx` monolítico ni hash-routing de la maqueta. Evidencia: App Router, rutas segmentadas, componentes reutilizables y `pnpm lint` correcto.
- [x] Implementar diseño mobile-first y responsive real para móvil, tablet y desktop. Evidencia: revisión visual en 375 px y desktop para home, explorar, cotizador, contacto y perfil.
- [x] Respetar la identidad visual y paleta de la maqueta, mejorándolas con un sistema consistente de color, tipografía, espaciado, radios, bordes y estados. Evidencia: tokens en `app/globals.css`, Bricolage Grotesque, DM Sans e IBM Plex Mono.
- [x] Usar animaciones suaves y transiciones sin exagerar, respetando `prefers-reduced-motion`. Evidencia: transiciones de tarjetas, botones y navegación con media query de reducción de movimiento.
- [x] Reutilizar las fotografías suministradas, optimizarlas y agregar texto alternativo descriptivo. Evidencia: assets en `public/images` y uso de `next/image` en páginas públicas.

## Sitio público

- [x] Crear inicio completo con hero, buscador, estadísticas, servicios, propuesta de confianza, profesionales destacados, cómo funciona, testimonios, CTA y footer.
- [x] Crear directorio explorable con filtros por ciudad, colonia, servicio, tarifa e insumos, incluyendo estados vacío y limpieza de filtros. Evidencia: `components/explorer-client.tsx` y `lib/utils.ts`.
- [x] Recuperar el mapa radar de la maqueta con vista Tarjetas/Mapa, radio de 3/5/10/20/50 km, búsqueda por colonia, marcadores por zona, selección de perfil, geolocalización con consentimiento y fallback visual sin cuota externa. Evidencia: `components/radar-map.tsx`; Google Maps/Places queda como proveedor opcional mediante `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- [x] Crear páginas públicas de profesionales con foto, servicios, zona, tarifa, reseñas, experiencia, disponibilidad y CTA de contacto/reserva.
- [x] Crear cotizador con m², recámaras, baños, servicio, frecuencia e insumos; validar campos y mostrar rango estimado en MXN.
- [x] Crear siete páginas locales para CDMX, Ecatepec, Guadalajara, Monterrey, Puebla, Querétaro y Mérida.
- [x] Crear blog indexable con índice y artículos individuales usando contenido realista de la maqueta, nunca lorem ipsum.
- [x] Crear páginas de planes, nosotros, seguridad, FAQ y contacto.
- [x] Crear términos, privacidad y página 404 real.

## Cuenta y confianza

- [x] Permitir inicio de sesión exclusivamente con Google/Gmail. Evidencia: `GoogleAuthProvider`, `firebase-applet-config.json` como respaldo público y `useAuthUser` para sesión persistente en cliente.
- [x] Crear perfil de cliente y profesional, onboarding y publicación de anuncio. Evidencia: `ProfilePanel` y `PublishPanel`, con datos guardados en Firestore cuando sus reglas están desplegadas.
- [x] Crear flujo inicial de reservas con estados claros y prevención visual de doble envío. Evidencia: `BookingsPanel`, estado `requested`, lista de solicitudes y reglas por propietario. Falta integrar confirmación entre ambas partes.
- [x] Añadir selector de próximos 14 días, estado visible y cancelación de solicitudes propias con actualización real de Firestore. Evidencia: `components/booking-panel.tsx` y `cancelBooking` en `lib/firebase.ts`.
- [ ] Crear reseñas ligadas a una reserva completada.
- [x] Preparar reportes de perfiles/reseñas con formulario validado y almacenamiento real en Firestore; quedan pendientes la bandeja y resolución administrativa.
- [x] Añadir acciones de emergencia en reservas: llamada 911, correo de apoyo y ubicación compartida solo tras consentimiento del navegador.
- [x] Persistir favoritos por usuario en Firestore y ofrecer la ruta privada `/cuenta/favoritos`; cada documento queda limitado a su propietario por reglas.
- [ ] Completar confirmación entre ambas partes, código de puerta, chat y notificaciones de reserva.
- [x] Dejar interfaces y rutas de backend preparadas para verificación de identidad, pagos, chat y notificaciones sin presentar simulaciones como funciones activas. Las integraciones no se muestran como activas sin credenciales, webhooks y reglas finales.

## SEO, accesibilidad y rendimiento

- [x] Usar URLs limpias con App Router y metadatos por ruta.
- [ ] Completar canonical y `og:url` por ruta cuando exista la URL temporal real; mientras tanto se omiten URLs absolutas para no publicar un origen inventado.
- [x] Implementar Open Graph, Twitter Cards, sitemap y robots; los recursos absolutos se completarán al configurar `NEXT_PUBLIC_SITE_URL`.
- [x] Crear `public/manus-routes.json` sincronizado con las rutas públicas y privadas relevantes.
- [x] Usar HTML semántico, labels, foco visible, navegación por teclado, contraste suficiente y mensajes accesibles.
- [x] Optimizar imágenes con `next/image`, lazy loading donde corresponde y dependencias mínimas.
- [x] Ejecutar diagnósticos TypeScript, lint y build de producción. Última evidencia: `pnpm lint` y `pnpm build` correctos; la única advertencia restante es `metadataBase` sin URL pública configurada.

## Entrega

- [x] Documentar instalación, variables de entorno, desarrollo, build, reglas Firestore y despliegue en `README.md`.
- [x] Mantener contacto provisional centralizado hasta recibir correo y WhatsApp definitivos.
- [x] Verificar que no existan TODO de producto, placeholders vacíos, lorem ipsum ni código resumido.
- [ ] Guardar el resultado en un checkpoint del proyecto administrado.

## Pendientes antes de producción pública

1. Sustituir `villaralan11@gmail.com` y `+52 56 6049 0358` por los datos definitivos.
2. Definir `NEXT_PUBLIC_SITE_URL` con la URL temporal real de Google AI Studio y agregarla a Authorized domains de Firebase.
3. Publicar `firestore.rules` y validar roles, moderación, reservas entre cliente y profesional, reseñas y reportes.
4. Revisar términos y privacidad con asesoría legal.
5. Guardar checkpoint y publicar únicamente después de confirmar los datos anteriores.
