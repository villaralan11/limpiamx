# Plan de integración — de demo a producto real

Este documento explica **cómo llevar cada función nueva de LimpiaMX a producción**:
qué cambió en esta versión, qué parte es demostración y cuáles son los pasos concretos
para reemplazarla con un servicio real. Ordenado por impacto y dificultad.

> Contexto: React 19 + TypeScript + Vite + Firebase (Auth, Firestore, Storage) +
> Google Maps. Las reglas de Firestore validan esquemas con `hasOnly`, así que
> cualquier campo nuevo requiere actualizar `firestore.rules` (y
> `firebase-blueprint.json`) en el mismo deploy.

---

## 1. Link propio por profesional (#/profesional/\<id\>) — YA FUNCIONA EN DEMO

**Qué se hizo:** cada perfil tiene su URL (`#/profesional/cat_guadalupe`), se abre
desde tarjetas, radar, reseñas y páginas de ciudad, con botón "Compartir por
WhatsApp" (texto prellenado + link) y "Copiar link". El botón Atrás cierra el modal
y Adelante lo reabre.

**Para producción:**
1. URLs limpias: activa rewrites de Firebase Hosting (`firebase.json`):
   `"/profesional/*": "/index.html"` y convierte el router de hash a
   `history.pushState` (el parser `parseHashRoute()` ya está aislado, solo cambia
   la lectura de `window.location.hash` a `window.location.pathname`).
2. SEO: agrega etiquetas Open Graph dinámicas por perfil (un pequeño servidor
   Cloud Function `ssrProfileMeta` que inyecte nombre, foto y tarifa en el HTML)
   y un `sitemap.xml` con todas las URLs de perfiles.
3. Contenido compartido por WhatsApp: hoy el texto se arma en el cliente; para
   métricas, envuelve el link con un acortador propio (`yzt.mx/<id>`) que registre
   clics (Firestore + Cloud Function).

## 2. Cotizador de precio (#/cotizador) — YA FUNCIONA EN DEMO

**Qué se hizo:** m², recámaras, baños, tipo de servicio, frecuencia e insumos →
horas estimadas + rango de precio en MXN, con tarifas promedio reales por ciudad
calculadas desde el catálogo (`src/lib/pricing.ts`).

**Para producción:**
1. Guarda la lógica del modelo (`estimateHours`, factores por servicio) tal cual:
   ya es una función pura probada. Conviértela en Cloud Function si también la
   usará el panel de precios.
2. Calibra los factores con datos reales: después de 50 reservas completadas,
   compara horas estimadas vs. horas cobradas por perfil y ajusta los coeficientes
   (los factores viven en dos constantes, fácil de tunear).
3. Opcional: "Reservar con esta estimación" → crea la reserva con la duración
   estimada preseleccionada (hoy solo filtra por ciudad).

## 3. Páginas por ciudad (#/limpieza-en-guadalajara, etc.) — YA FUNCIONA EN DEMO

**Qué se hizo:** 7 páginas con texto editorial local, pros, colonias destacadas,
consejos, FAQ, precios promedio (calculados del catálogo en runtime) y perfiles
filtrados. Los textos viven en `src/data/cityPages.ts`.

**Para producción:**
1. Rutas limpias con rewrites (`/limpieza-en-guadalajara` → `/index.html`) y
   `<link rel="canonical">`.
2. Meta por página: title/description ya cambian por ruta; pasa también
   `og:image` con una foto representativa por ciudad.
3. Contenido: cuando una ciudad pase de ~15 perfiles activos, divide por zona
   (`/limpieza-en-guadalajara/zona-providencia`) reutilizando el mismo componente.
4. `robots.txt` ya existe; genera `sitemap.xml` en build con las 7 ciudades +
   perfiles activos (script de Node en `postbuild`).

## 4. Página 404 y estados vacíos — YA FUNCIONA EN DEMO

Ruta desconocida → página 404 con ilustración SVG propia (`NotFoundPage` + 
`EmptyState` en `SharedUI.tsx`, usado en catálogo, favoritos, reservas y panel pro).
Para producción no requiere nada extra; solo asegúrate de que el hosting no
redirija rutas desconocidas al inicio sin conservar la URL (con rewrites a
`/index.html` el router ya muestra el 404).

## 5. Blog / guías (#/blog, #/blog/\<slug\>) — YA FUNCIONA EN DEMO

Tres artículos con rangos de precio calculados del catálogo real (nunca quedan
obsoletos) en `src/data/blogPosts.ts`.

**Para producción:**
1. Si escribirás artículos con frecuencia, migra el contenido a Firestore
   (colección `posts`) o a archivos Markdown compilados en build. El componente
   `BlogArticlePage` ya recibe datos estructurados (bloques), así que el cambio
   de fuente es trivial.
2. Newsletter al terminar cada artículo: botón que guarda el correo en Firestore
   con reglas de creación única.

## 6. Botón flotante de WhatsApp — DEMO (configurar número)

`FloatingActions.tsx` usa `SITE.whatsappNumber` de `src/data/siteContent.ts`
(actualmente `5215512345678`, marcado como demo).

**Para producción:** cambia ese número por el de tu WhatsApp Business. Nivel
siguiente: API oficial de WhatsApp Business (Meta Cloud API, gratis el cambio de
plantilla hasta 1,000 conversaciones/mes aprox.) para avisos automáticos de
reserva — ver sección 9.

## 7. PWA instalable — YA FUNCIONA EN DEMO

`public/manifest.webmanifest` (iconos generados en `public/icons/`, shortcuts a
cotizador/reservas/guías) + `public/sw.js` (network-first para el shell,
cache-first para estáticos, sin tocar Firebase/Maps). Se registra solo en
producción (`main.tsx`).

**Para producción:** hosting con HTTPS (Firebase Hosting lo da). Agrega un banner
"Instalar app" que aparezca en el evento `beforeinstallprompt` (guárdalo en una
variable y muestra el botón en el header móvil).

## 8. Verificación de identidad con INE + insignia "Verificado" — DEMO

**Demo actual:** el profesional sube frente y reverso del INE en *Mi perfil*
(`IneVerificationPanel`); la revisión se simula (2.5 s) y se guarda en
`localStorage` (`limpiamx_verification_v1`). La insignia aparece en tarjetas,
modal, página de ciudad y perfil propio. Los perfiles demo/catálogo vienen
verificados por diseño (patch en `allCleaners` de `App.tsx`).

**Para producción (orden recomendado):**
1. **Esquema Firestore:** agrega a `cleaners` (y `users`) el campo
   `identityVerified: boolean`, `verificationStatus: 'none'|'pending'|'verified'|'rejected'`,
   `verificationFiles: [storagePath, storagePath]`. Actualiza `firestore.rules`
   (`hasOnly` + regla de escritura solo para el dueño y solo cuando
   `verificationStatus == 'pending'`; nadie puede escribir `verified` desde el
   cliente).
2. **Storage:** sube los INE a `verifications/{uid}/...` con regla
   `allow read: if request.auth.uid == uid || isAdmin()`. Opción más segura:
   Cloud Function con Vision OCR que borra el original tras validar.
3. **Moderación:** cola en el AdminPanel (ya existe el panel): lista de
   `verificationStatus == 'pending'` con vista de documentos y botones
   Aprobar/Rechazar que escriben vía admin (el panel ya tiene RBAC + audit log,
   usa `adminSetCleanerStatus` como patrón).
4. **Nivel siguiente:** validación automática de INE con un proveedor
   (BuenData, Idwall, Trulioo o el OCR de Cloud Vision + validación de CURP) y
   comparación de la foto del documento con una selfie (liveness) del
   profesional. Idwall/BuenData cuestan ~USD 1–3 por verificación.
5. **Antifraude:** guarda hash del documento (ya tienen hashing en
   `imagePreprocess.ts` — reutilízalo) para detectar el mismo INE en varias cuentas.

## 9. Código de seguridad en la puerta — YA FUNCIONA (determinista)

**Demo actual:** cada reserva genera un código de 6 dígitos determinista
(`getDoorCode(folio, fecha)` en `lib/bookingSecurity.ts`) — cliente y profesional
ven el mismo código en Mis reservas sin guardar nada nuevo en Firestore.

**Para producción:**
1. Genera el código en el servidor al **confirmar** la reserva (Cloud Function
   `onBookingConfirmed`, campo `doorCode` cifrado con la clave del servidor; el
   cliente solo lo lee si es parte de la reserva).
2. Reglas: `doorCode` legible solo para `clientId` y `cleanerOwnerId`.
3. Diferenciador completo: el profesional también dice SU código al cliente
   ("verificación cruzada"): dos códigos, uno confirma la dirección (cliente → pro)
   y otro confirma la identidad del profesional (pro → cliente). Solo agrega un
   segundo campo y un panel de entrada de código con estado
   `arrivalConfirmed: boolean`.
4. El código vence: deriva del folio + fecha (ya lo hace) y muéstralo con
   cuenta regresiva el día del servicio.

## 10. Pagos dentro de la app (Stripe / Conekta / Mercado Pago) — DEMO

**Demo actual:** hoja de pago `PaymentSheet` con elección de proveedor, desglose
(comisión 8% "Reserva Protegida"), garantía de reposición hasta $2,500 MXN y
estados retenido/liberado en `localStorage` (`limpiamx_payments_v1`).

**Para producción — recomendación por orden de fricción:**
1. **Mercado Pago** (el más rápido para México): crea una *preference* desde un
   Cloud Function (`createPaymentPreference(bookingId)`) y redirige al
   checkout. El webhook `payment.updated` marca la reserva como `paid_held`.
2. **Conekta** si quieres OXXO Pay + SPEI nativos de primera mano.
3. **Stripe** si habrá clientes internacionales o pagos recurrentes (planes).

Flujo de dinero (escrow simplificado sin SERPA requerido para empezar):
- Cliente paga → PSP retiene → reserva pasa a `paid_held`.
- Cliente marca "completada" → Cloud Function `releasePayment` transfiere al
  profesional (payout con Connect de Stripe / transferencias de MP / Conekta
  payouts) → `paid_released`.
- Garantía de reposición: contrato claro + foto antes/después obligatoria para
  reservas protegidas; reclamo abre un caso en Firestore con deadline de 48 h.
- **Firestore:** colección `payments/{paymentId}` (bookingId, provider, amount,
  fee, status, webhookRef) con reglas de solo-lectura para clientes y escritura
  SOLO desde el Admin SDK (Cloud Functions). El campo `paidStatus` de la reserva
  también se escribe solo desde el servidor.
- Comisión: hoy 8% fija en `PROTECTION_FEE_PCT`; hazla configurable por ciudad
  o nivel del profesional (es una constante, moverla a un documento `config/`).

## 11. Chat por reserva + notificaciones — DEMO

**Demo actual:** chat por reserva guardado en `localStorage`
(`limpiamx_chat_v1`, con respuesta automática marcada como demo) y panel de
notificaciones en Mis reservas con eventos in-app (`limpiamx_notifications_v1`)
+ botones que abren WhatsApp/mailto prellenado con los datos de la reserva.

**Para producción:**
1. **Chat real:** subcolección `bookings/{id}/messages` (reglas: leer/escribir
   solo clientId o cleanerOwnerId; máximo 400 chars). UI ya construida — cambia
   `pushBookingMessage` por `addDoc` y `getBookingMessages` por `onSnapshot`.
2. **Notificaciones push:** Firebase Cloud Messaging. Cloud Function
   `onMessageCreate` → FCM al otro participante. El token se guarda en
   `users/{uid}/fcmTokens`. Para PWA, pide permiso tras la primera reserva.
3. **Correo automático:** Cloud Function `onBookingCreate` (trigger de Firestore)
   → Resend / SendGrid / EmailJS con plantilla: datos de la reserva + código de
   puerta + link a Mis reservas. Resend cuesta ~$0/mes hasta 3,000 correos/mes.
4. **WhatsApp automático:** WhatsApp Business Cloud API (Meta): plantilla
   aprobada "nueva_reserva" con variables; envío desde la misma Cloud Function.
   Requiere número verificado y aprobar la plantilla (1–2 días).
5. Guarda todas las notificaciones enviadas en `notifications` para el historial
   (el panel del dashboard ya las muestra).

## 12. Calendario de disponibilidad y reglas de cancelación — DEMO

**Demo actual:**
- El modal de reserva muestra los próximos 14 días con estado disponible/ocupado
  (`getAvailabilityPreview`) derivado del texto de horario del anuncio + fechas
  ocupadas deterministas (`getDemoBookedDates`).
- Reglas de cancelación visibles en el modal, en el FAQ y al cancelar desde Mis
  reservas (confirm con deadline sin costo). Agenda semanal para el profesional
  en su panel.

**Para producción:**
1. Agrega a `cleaners` un campo `weeklyAvailability: number[]` (0–6) que el
   profesional edita en su panel (UI de toggles ya puedes reutilizar la de
   servicios). `parseAvailableWeekdays` pasa a leer ese campo.
2. Fechas ocupadas = reservas `confirmed` reales del profesional (query por
   `cleanerOwnerId`) + bloqueos manuales (colección `blockedDates`).
3. La confirmación de la reserva debe correr en transacción para evitar
   doble-booking (dos clientes a la misma hora): Cloud Function con
   `runTransaction`.
4. Cancelación con cargo: integra con los pagos (sección 10) — la penalización
   del 50% se cobra desde el pago retenido; sin pago, queda como deuda en la
   cuenta.

## 13. Reportar perfil/reseña + botón de emergencia — DEMO

**Demo actual:** botón de reporte en cada tarjeta, en el modal de perfil y en
cada reseña (`ReportDialog`, motivos fijos, guardado en `localStorage`), y botón
flotante de Emergencia con llamada al 911, correo al equipo y consejos.

**Para producción:**
1. Colección `reports/{id}` (targetType, targetId, reason, detail, reporterUid)
   — escritura permitida a cualquier usuario autenticado, lectura solo admins.
2. Cola de moderación en el AdminPanel con acciones: ocultar perfil
   (`status: 'suspended'` — ya existe), borrar reseña (ya existe
   `adminDeleteReview`), y registrar todo en `auditLogs` (ya existe).
3. Umbrales automáticos: 3 reportes en 7 días → el perfil pasa a `paused`
   automático (Cloud Function).
4. Emergencia: mantén el 911 directo; agrega botón dentro del chat de reserva el
   día del servicio ("Compartir ubicación en vivo" con `navigator.geolocation` +
   link de WhatsApp a un contacto de confianza).

---

## Orden de implementación sugerido (3 sprints escolares)

| Sprint | Qué | Por qué primero |
| --- | --- | --- |
| 1 | Verificación INE real (8) + reportes (13) + rutas limpias y sitemap (1, 3) | Confianza y SEO: lo que hace creíble el sitio ante usuarios y profesor |
| 2 | Pagos con Mercado Pago (10) + códigos de puerta server-side (9) + transacción anti doble-booking (12) | Es el diferenciador de negocio y el modelo de ingresos |
| 3 | Chat Firestore + FCM + correo/WhatsApp automáticos (11) + calibración del cotizador con datos reales (2) | Retención y experiencia "app de verdad" |

## Cosas que NO hay que olvidar antes de publicar

- Cambiar `SITE.contactEmail` y `SITE.whatsappNumber` en `src/data/siteContent.ts`.
- Revisar `terminos` y `privacidad` con un abogado (menciona la retención de
  pagos y el tratamiento del INE — dato personal sensible según la LFPDPPP).
- Los `demo_*` uids y los perfiles `cat_*` son datos ficticios: márcalos o
  elimínalos del catálogo real (filtro `isDemo` en `CATALOG_CLEANERS`).
- La cuota de Google Maps: el sitio ya degrada elegante sin API key y con cuota
  agotada; para producción activa facturación y restricciones por dominio en la
  clave.
