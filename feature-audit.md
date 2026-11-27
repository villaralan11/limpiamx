# Auditoría de funciones heredadas de la maqueta

Fuente principal: `/home/ubuntu/limpiamx-audit/src/App.tsx`, `/home/ubuntu/limpiamx-audit/src/components/WorkerRadarMap.tsx` y `/home/ubuntu/limpiamx-audit/PLAN_INTEGRACION.md`.

## Funciones que tenía la maqueta

- Directorio con vista de tarjetas y vista `Mapa Radar`.
- Filtros por servicio, ciudad, colonia, búsqueda libre, tarifa máxima e insumos.
- Selector inteligente de colonias con sugerencias, colonias populares y vista de cobertura en Google Maps.
- Geolocalización del usuario, búsqueda por dirección/zona, radios de 3, 5, 10, 20 y 50 km, cálculo de distancia y pins seleccionables.
- Perfil/modal de profesional, compartir por WhatsApp, copiar enlace y favoritos persistidos.
- Cotizador de m², recámaras, baños, servicio, frecuencia e insumos.
- Reserva con próximos 14 días, disponibilidad, reglas de cancelación y agenda profesional.
- Código de seguridad de puerta para una reserva.
- Chat por reserva y panel de notificaciones.
- Reporte de perfil/reseña y botón de emergencia con 911, correo y ubicación compartida.
- Verificación de identidad mediante INE y estado Verificado.
- Pagos simulados con desglose, comisión y estados retenido/liberado.
- Panel administrativo con usuarios, profesionales, reservas, reseñas, verificaciones, reportes, métricas y bitácora.
- PWA con shortcuts a cotizador, reservas y guías.

## Estado de la reconstrucción actual

Ya implementado: rutas limpias públicas, directorio con filtros por ciudad/servicio/tarifa/insumos, perfiles, WhatsApp, cotizador, blog, ciudades, contacto, Google Auth, perfil, publicación de anuncio, mapa radar responsive con geolocalización/fallback, favoritos persistidos por usuario en Firestore, solicitudes de reserva con próximos 14 días y cancelación propia, reportes validados y acciones de emergencia con consentimiento.

Pendiente de integrar: confirmación de reservas entre cliente y profesional, código de puerta, chat, notificaciones, bandeja de moderación, verificación INE, pagos reales, reseñas vinculadas, panel admin operativo y shortcuts PWA.

## Orden de implementación

1. Radar visual con dataset de coordenadas de ciudades/zonas, geolocalización opcional, radio y fallback sin API key.
2. Filtros completos de colonia y vista tarjetas/radar persistida en la URL.
3. Favoritos por usuario en Firestore.
4. Calendario de disponibilidad y estados de reserva.
5. Reportes, chat y notificaciones vinculados a una reserva.
6. Verificación y moderación; INE solo mediante Storage protegido y nunca en perfiles públicos.
7. Pagos mediante proveedor y backend seguro; no marcar pagos como activos sin webhook.
