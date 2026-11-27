# LimpiaMX

Reconstrucción desde cero del marketplace LimpiaMX a partir de una maqueta de referencia. La versión nueva usa Next.js App Router, TypeScript, Tailwind CSS, Firebase preparado para Google/Gmail y una dirección visual editorial inspirada en Apple.

## Requisitos

Node.js 22 o superior y pnpm 11.

## Instalación

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Variables de entorno

`NEXT_PUBLIC_SITE_URL` debe contener la URL pública cuando exista. Mientras se use una URL temporal de Google AI Studio puede dejarse vacía o actualizarse con la URL asignada.

`NEXT_PUBLIC_CONTACT_EMAIL` y `NEXT_PUBLIC_WHATSAPP_NUMBER` están centralizadas y usan valores provisionales heredados de la maqueta hasta recibir los definitivos.

El proyecto incluye `firebase-applet-config.json` como respaldo de la configuración web pública que venía en la maqueta. Las variables `NEXT_PUBLIC_FIREBASE_*`, si se definen, tienen prioridad y permiten cambiar de proyecto sin tocar código. Agrega el dominio de preview/despliegue a **Authorized domains** en Firebase Authentication. Solo se muestra el botón Google; no hay contraseñas propias.

Las áreas de cuenta escuchan la sesión Google y usan Firestore para perfiles, anuncios y solicitudes. Antes de producción, publica `firestore.rules` en el mismo proyecto desde Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

El explorador incluye una vista **Mapa radar** funcional aun sin API externa: muestra profesionales por zona, permite buscar colonia, ajustar el radio y solicitar la ubicación del navegador. La variable opcional `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` queda documentada para activar Google Maps/Places cuando el proyecto tenga cuota y restricciones configuradas.

## Comandos

```bash
pnpm dev       # desarrollo
pnpm lint      # TypeScript sin emitir
pnpm build     # build de producción
pnpm start     # servidor de producción
```

## Despliegue

En Vercel: importa el repositorio, selecciona Next.js, configura las variables de entorno y despliega. En Google AI Studio, usa el mismo proyecto generado, define las variables públicas en la configuración del entorno y conserva el puerto 3000. Cuando tengas la URL temporal real, actualiza `NEXT_PUBLIC_SITE_URL`, agrega ese origen a Firebase Authentication y vuelve a generar el sitemap.

## Próximos datos de producción

Antes de publicar hay que sustituir el correo y WhatsApp provisionales, revisar términos y privacidad con asesoría legal, configurar Firebase Auth/Firestore/Storage y conectar el proveedor de correo o mensajería que se usará para reservas y notificaciones.
