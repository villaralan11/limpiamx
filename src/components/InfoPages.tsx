import React, { useState } from 'react';
import { Check, ChevronRight, Clock } from 'lucide-react';
import { CITIES_MX } from '../types/marketplace';
import {
  FAQ_ITEMS,
  SAFETY_NOW,
  SAFETY_SOON,
  SAFETY_TIPS,
  SITE,
} from '../data/siteContent';
import type { ActiveSection } from './Header';
import { FaqList, PlansSection } from './HomeSections';

interface NavProps {
  onNavigate: (s: ActiveSection) => void;
}

/* ---------- Estructura común de página interior ---------- */

function PageShell({
  title,
  subtitle,
  crumb,
  onNavigate,
  updated,
  children,
}: NavProps & {
  title: string;
  subtitle?: string;
  crumb: string;
  updated?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
          <nav aria-label="Ruta de navegación" className="mb-5">
            <ol className="flex items-center gap-1.5 text-xs text-slate-500">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('explorar')}
                  className="hover:text-teal-700 underline-offset-2 hover:underline cursor-pointer"
                >
                  Inicio
                </button>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="w-3.5 h-3.5" />
              </li>
              <li aria-current="page" className="font-medium text-slate-700">
                {crumb}
              </li>
            </ol>
          </nav>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight max-w-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
          {updated && (
            <p className="mt-3 text-xs text-slate-500">
              Última actualización: {SITE.legalUpdated}
            </p>
          )}
        </div>
      </section>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {children}
      </div>
    </>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xl font-semibold text-slate-900 mt-9 mb-3 first:mt-0">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 max-w-3xl">
      {children}
    </p>
  );
}

function Ul({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2 mb-4 max-w-3xl">
      {items.map((it, i) => (
        <li
          key={i}
          className="flex gap-2.5 text-sm sm:text-base text-slate-700 leading-relaxed"
        >
          <Check className="w-4 h-4 text-teal-700 mt-1 shrink-0" aria-hidden="true" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function TemplateNotice() {
  return (
    <div
      role="note"
      className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-4 py-3 text-sm leading-relaxed mb-8 max-w-3xl"
    >
      Este texto es un modelo para un proyecto escolar y no es asesoría legal. Antes de
      operar con usuarios reales, debe revisarlo una persona abogada.
    </div>
  );
}

function ActionRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mt-10 flex flex-wrap gap-3">{children}</div>;
}

const PRIMARY_BTN =
  'px-5 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors cursor-pointer';
const SECONDARY_BTN =
  'px-5 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-sm font-medium hover:bg-slate-100 transition-colors cursor-pointer';

/* ---------- Sobre nosotros ---------- */

export function AboutPage({ onNavigate }: NavProps) {
  return (
    <PageShell
      title="Un puente transparente entre hogares y quienes limpian"
      subtitle="LimpiaMX es un directorio para contratar y anunciar servicios de limpieza en México, con tarifas claras y sin intermediarios."
      crumb="Sobre nosotros"
      onNavigate={onNavigate}
    >
      <H2>Por qué existe</H2>
      <P>
        Hoy muchas personas contratan limpieza por recomendación, en grupos de redes
        sociales o con fotos que se pierden en un chat. Es difícil comparar tarifas,
        saber si alguien trabaja en tu colonia o confiar en una referencia. Y quien
        limpia depende de que su tarjeta de presentación llegue a las personas
        correctas.
      </P>
      <P>
        LimpiaMX junta todo en un solo lugar: perfiles con tarifa por hora en pesos,
        colonias de cobertura, fotos de trabajos y reseñas de quienes ya contrataron.
      </P>

      <H2>Cómo trabajamos</H2>
      <Ul
        items={[
          <>
            <strong>Tarifas visibles.</strong> Cada profesional pone su precio por hora
            y lo ves antes de enviar la solicitud.
          </>,
          <>
            <strong>Contratación directa.</strong> Acuerdas con la persona y le pagas a
            ella al terminar. No hay anticipos obligatorios.
          </>,
          <>
            <strong>Reseñas con reserva.</strong> Solo quien contrató puede opinar.
          </>,
          <>
            <strong>Publicar es gratis.</strong> Sin papeleo para empezar.
          </>,
        ]}
      />

      <H2>Dónde estamos</H2>
      <P>Tenemos perfiles en {CITIES_MX.join(', ')}.</P>

      <H2>Sobre este proyecto</H2>
      <P>{SITE.schoolNotice}</P>

      <ActionRow>
        <button type="button" className={PRIMARY_BTN} onClick={() => onNavigate('explorar')}>
          Explorar personal de limpieza
        </button>
        <button type="button" className={SECONDARY_BTN} onClick={() => onNavigate('contacto')}>
          Escríbenos
        </button>
      </ActionRow>
    </PageShell>
  );
}

/* ---------- Seguridad ---------- */

export function SafetyPage({ onNavigate }: NavProps) {
  return (
    <PageShell
      title="Confianza y seguridad"
      subtitle="Qué hace la plataforma, qué viene y qué puedes hacer tú para contratar con tranquilidad."
      crumb="Confianza y seguridad"
      onNavigate={onNavigate}
    >
      <div
        role="note"
        className="bg-red-50 border border-red-200 text-red-900 rounded-lg px-4 py-3 text-sm leading-relaxed mb-8 max-w-3xl"
      >
        Si estás en peligro, llama al <strong>911</strong>. LimpiaMX no sustituye a los
        servicios de emergencia.
      </div>

      <H2>Lo que hace hoy la plataforma</H2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {SAFETY_NOW.map((it) => (
          <li key={it.title} className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-slate-900 mb-1">{it.title}</p>
            <p className="text-sm text-slate-600 leading-relaxed">{it.text}</p>
          </li>
        ))}
      </ul>

      <H2>Lo que viene</H2>
      <ul className="space-y-3 mb-4 max-w-3xl">
        {SAFETY_SOON.map((it) => (
          <li key={it.title} className="flex gap-2.5 text-sm sm:text-base text-slate-700 leading-relaxed">
            <Clock className="w-4 h-4 text-slate-500 mt-1 shrink-0" aria-hidden="true" />
            <span>
              <strong>{it.title}.</strong> {it.text}
            </span>
          </li>
        ))}
      </ul>

      <H2>Consejos para quien contrata</H2>
      <Ul items={SAFETY_TIPS} />

      <H2>Consejos para quien ofrece el servicio</H2>
      <Ul
        items={[
          'Pide por escrito la dirección, el tamaño del lugar y las tareas antes de ir.',
          'Comparte con alguien de confianza dónde y a qué hora vas a trabajar.',
          'Confirma la tarifa total antes de empezar y cobra al terminar.',
          'Si el lugar o la situación no coincide con lo acordado, puedes cancelar y reportarlo.',
        ]}
      />

      <H2>Reportar un problema</H2>
      <P>
        Escríbenos desde Contacto con la fecha, el nombre del perfil y lo que pasó. El
        equipo revisa el caso y puede suspender cuentas que incumplan las reglas.
      </P>

      <ActionRow>
        <button type="button" className={PRIMARY_BTN} onClick={() => onNavigate('contacto')}>
          Reportar un problema
        </button>
        <button type="button" className={SECONDARY_BTN} onClick={() => onNavigate('faq')}>
          Preguntas frecuentes
        </button>
      </ActionRow>
    </PageShell>
  );
}

/* ---------- Planes ---------- */

export function PlansPage({
  onNavigate,
  onGoToPublish,
}: NavProps & { onGoToPublish: () => void }) {
  return (
    <>
      <PageShell
        title="Planes y precios"
        subtitle="Contratar siempre es gratis. Quien ofrece servicios puede publicar sin costo y subir de plan para llegar a más clientes."
        crumb="Planes"
        onNavigate={onNavigate}
      >
        <P>
          La tarifa por hora la define cada profesional. LimpiaMX no cobra comisión
          sobre ese pago mientras la contratación sea directa.
        </P>
      </PageShell>
      <PlansSection
        showHeading={false}
        onGoToPublish={onGoToPublish}
        onWaitlist={() => onNavigate('contacto')}
      />
    </>
  );
}

/* ---------- Preguntas frecuentes ---------- */

export function FaqPage({ onNavigate }: NavProps) {
  return (
    <PageShell
      title="Preguntas frecuentes"
      subtitle={`${FAQ_ITEMS.length} respuestas sobre reservas, pagos, reseñas y seguridad.`}
      crumb="Preguntas frecuentes"
      onNavigate={onNavigate}
    >
      <FaqList />
      <ActionRow>
        <button type="button" className={PRIMARY_BTN} onClick={() => onNavigate('contacto')}>
          ¿No encontraste tu respuesta? Escríbenos
        </button>
      </ActionRow>
    </PageShell>
  );
}

/* ---------- Contacto ---------- */

const TOPICS = [
  'Duda general',
  'Problema con un servicio',
  'Quiero anunciarme',
  'Acceso anticipado a planes',
  'Datos personales (acceso, corrección o eliminación)',
  'Empresas',
] as const;

export function ContactPage({ onNavigate }: NavProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>(TOPICS[0]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [opened, setOpened] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Escribe tu nombre.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      return setError('Escribe un correo válido para poder responderte.');
    if (message.trim().length < 10)
      return setError('Cuéntanos un poco más (mínimo 10 caracteres).');
    setError('');
    const subject = encodeURIComponent(`[${SITE.name}] ${topic}`);
    const body = encodeURIComponent(
      `${message.trim()}\n\n— ${name.trim()} (${email.trim()})`
    );
    window.location.href = `mailto:${SITE.contactEmail}?subject=${subject}&body=${body}`;
    setOpened(true);
  };

  const field =
    'w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-2 focus:outline-teal-700';

  return (
    <PageShell
      title="Contacto"
      subtitle="Cuéntanos qué necesitas. Respondemos en uno o dos días hábiles."
      crumb="Contacto"
      onNavigate={onNavigate}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-4 space-y-5 text-sm text-slate-700 leading-relaxed">
          <div>
            <p className="font-semibold text-slate-900 mb-0.5">WhatsApp directo</p>
            <a
              href={`https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent('Hola, me gustaría recibir información sobre LimpiaMX.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-700 hover:text-teal-800 underline underline-offset-2 font-medium tabular-nums"
            >
              {SITE.whatsappDisplay}
            </a>
          </div>
          <div>
            <p className="font-semibold text-slate-900 mb-0.5">Correo</p>
            <a
              href={`mailto:${SITE.contactEmail}`}
              className="text-teal-700 hover:text-teal-800 underline underline-offset-2"
            >
              {SITE.contactEmail}
            </a>
          </div>
          <div>
            <p className="font-semibold text-slate-900 mb-0.5">Cobertura</p>
            <p>{CITIES_MX.join(', ')}.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900 mb-0.5">Antes de escribir</p>
            <p>
              Quizá ya está en las{' '}
              <button
                type="button"
                onClick={() => onNavigate('faq')}
                className="text-teal-700 hover:text-teal-800 underline underline-offset-2 cursor-pointer"
              >
                preguntas frecuentes
              </button>
              .
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900 mb-0.5">Emergencias</p>
            <p>Si estás en peligro, llama al 911.</p>
          </div>
        </aside>

        <form
          onSubmit={submit}
          noValidate
          className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 sm:p-7 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ct-name" className="block text-sm font-medium text-slate-800 mb-1">
                Nombre
              </label>
              <input
                id="ct-name"
                className={field}
                value={name}
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="ct-email" className="block text-sm font-medium text-slate-800 mb-1">
                Correo
              </label>
              <input
                id="ct-email"
                type="email"
                className={field}
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="ct-topic" className="block text-sm font-medium text-slate-800 mb-1">
              Tema
            </label>
            <select
              id="ct-topic"
              className={field}
              value={topic}
              onChange={(e) => setTopic(e.target.value as (typeof TOPICS)[number])}
            >
              {TOPICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ct-msg" className="block text-sm font-medium text-slate-800 mb-1">
              Mensaje
            </label>
            <textarea
              id="ct-msg"
              rows={6}
              className={field}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Si es sobre un servicio, incluye la fecha y el nombre del perfil."
            />
          </div>
          {error && (
            <p role="alert" className="text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          {opened && (
            <p role="status" className="text-sm text-teal-800">
              Se abrió tu app de correo con el mensaje listo. Si no se abrió, escríbenos a{' '}
              {SITE.contactEmail}.
            </p>
          )}
          <button type="submit" className={PRIMARY_BTN}>
            Enviar con mi correo
          </button>
          <p className="text-xs text-slate-500">
            Este formulario prepara un correo en tu aplicación de correo. No guardamos tu
            mensaje en el sitio.
          </p>
        </form>
      </div>
    </PageShell>
  );
}

/* ---------- Términos y condiciones ---------- */

export function TermsPage({ onNavigate }: NavProps) {
  return (
    <PageShell
      title="Términos y condiciones"
      subtitle="Las reglas para usar LimpiaMX como cliente o como profesional."
      crumb="Términos y condiciones"
      onNavigate={onNavigate}
      updated
    >
      <TemplateNotice />

      <H2>1. Aceptación</H2>
      <P>
        Al crear una cuenta o usar {SITE.name} aceptas estos términos y el Aviso de
        privacidad. Si no estás de acuerdo, no uses la plataforma.
      </P>

      <H2>2. Qué es {SITE.name}</H2>
      <P>
        {SITE.name} es un directorio que permite a personas y empresas encontrar
        profesionales de limpieza y a estos publicar sus servicios. {SITE.name} no es
        empleador de los profesionales, no presta los servicios de limpieza y no es
        parte del acuerdo entre cliente y profesional.
      </P>

      <H2>3. Cuentas</H2>
      <Ul
        items={[
          'Necesitas iniciar sesión con Google o con tu correo electrónico y ser mayor de edad.',
          'La información de tu perfil debe ser verdadera y estar actualizada.',
          'Eres responsable de lo que ocurra desde tu cuenta.',
        ]}
      />

      <H2>4. Anuncios y tarifas</H2>
      <P>
        Cada profesional define su tarifa, sus colonias y los servicios que ofrece. Debe
        cumplir lo que publica. Los anuncios no pueden contener información falsa,
        fotos que no sean del propio trabajo ni contenido ofensivo.
      </P>

      <H2>5. Reservas y pagos</H2>
      <P>
        Una reserva es una solicitud que el profesional puede confirmar o no. El pago se
        acuerda y se realiza directamente entre cliente y profesional al terminar el
        servicio, por transferencia o en efectivo. {SITE.name} no recibe ni garantiza
        esos pagos.
      </P>

      <H2>6. Reseñas</H2>
      <P>
        Solo pueden reseñar quienes tengan una reserva confirmada o completada con ese
        profesional. Las reseñas deben describir una experiencia real. Podemos ocultar
        las que contengan insultos, datos personales o información falsa.
      </P>

      <H2>7. Conducta no permitida</H2>
      <Ul
        items={[
          'Suplantar a otra persona o publicar datos falsos.',
          'Acosar, discriminar o amenazar a otros usuarios.',
          'Pedir o hacer pagos fuera de lo acordado en la reserva con engaños.',
          'Intentar vulnerar la seguridad de la plataforma o extraer datos de otros usuarios.',
        ]}
      />

      <H2>8. Suspensión</H2>
      <P>
        Podemos ocultar anuncios o suspender cuentas que incumplan estos términos, con o
        sin aviso previo según la gravedad del caso.
      </P>

      <H2>9. Límites de responsabilidad</H2>
      <P>
        Hacemos lo posible por mantener la plataforma disponible y los datos correctos,
        pero se ofrece tal cual. En la medida que permita la ley, {SITE.name} no responde
        por daños, pérdidas o disputas derivados del servicio entre cliente y
        profesional. Te recomendamos seguir los consejos de la página de Confianza y
        seguridad.
      </P>

      <H2>10. Cambios</H2>
      <P>
        Podemos actualizar estos términos. La fecha de actualización aparece arriba. Si
        sigues usando la plataforma después de un cambio, lo aceptas.
      </P>

      <H2>11. Ley aplicable y contacto</H2>
      <P>
        Estos términos se rigen por las leyes de México. Para dudas, escribe a{' '}
        {SITE.contactEmail}.
      </P>
    </PageShell>
  );
}

/* ---------- Aviso de privacidad ---------- */

export function PrivacyPage({ onNavigate }: NavProps) {
  return (
    <PageShell
      title="Aviso de privacidad"
      subtitle="Qué datos recopilamos, para qué los usamos y cómo ejercer tus derechos."
      crumb="Aviso de privacidad"
      onNavigate={onNavigate}
      updated
    >
      <TemplateNotice />

      <H2>Responsable</H2>
      <P>
        El equipo de {SITE.name} es responsable del tratamiento de tus datos personales.
        Puedes contactarnos en {SITE.contactEmail}.
      </P>

      <H2>Datos que recopilamos</H2>
      <Ul
        items={[
          'De tu cuenta de acceso (Google o correo electrónico): nombre, correo y foto.',
          'Si verificas tu identidad con INE: validamos los datos de forma segura sin almacenar fotografías de tu credencial.',
          'De tu perfil: apellido, teléfono, estado, ciudad, colonia, código postal, descripción y tu preferencia de contacto.',
          'Si publicas un anuncio: tu presentación, colonias, servicios, tarifas y las fotos que subas.',
          'De tu actividad: reservas, reseñas y favoritos.',
          'Si usas el mapa radar con tu ubicación o escribes una dirección: esos datos se envían a Google Maps Platform para mostrar el mapa y las distancias.',
        ]}
      />

      <H2>Para qué los usamos</H2>
      <Ul
        items={[
          'Crear y mantener tu cuenta.',
          'Mostrar tu anuncio y conectar a clientes con profesionales.',
          'Gestionar reservas y reseñas.',
          'Moderar la plataforma y atender reportes.',
          'Mejorar el servicio.',
        ]}
      />
      <P>No vendemos tus datos ni los usamos para publicidad.</P>

      <H2>Qué se muestra a otras personas</H2>
      <P>
        Tu anuncio es público: nombre, ciudad, colonias, servicios, tarifas, fotos y
        reseñas. Tu teléfono y datos de contacto se comparten con la otra parte según tu
        preferencia de contacto y cuando existe una reserva.
      </P>

      <H2>Con quién los compartimos</H2>
      <P>
        Usamos Google (Firebase para inicio de sesión, base de datos y archivos, y
        Google Maps Platform para mapas) como proveedor. Sus servidores pueden estar
        fuera de México. Fuera de estos proveedores, solo compartimos datos si una
        autoridad competente lo exige.
      </P>

      <H2>Tus derechos</H2>
      <P>
        Puedes pedir acceso a tus datos, corregirlos, cancelarlos u oponerte a su uso
        (derechos ARCO). Escribe a {SITE.contactEmail} con tu nombre, el correo de tu
        cuenta y qué derecho quieres ejercer. Te respondemos en un plazo razonable.
      </P>

      <H2>Cookies y almacenamiento local</H2>
      <P>
        Usamos almacenamiento del navegador solo para mantener tu sesión, recordar
        preferencias y guardar temporalmente resultados de mapas para reducir consultas.
        No usamos cookies de publicidad ni herramientas de analítica de terceros.
      </P>

      <H2>Conservación</H2>
      <P>
        Guardamos tus datos mientras tengas una cuenta activa. Si pides eliminarla,
        borramos tu perfil y tus anuncios, salvo lo que debamos conservar por obligación
        legal.
      </P>

      <H2>Cambios a este aviso</H2>
      <P>
        Si cambiamos este aviso, actualizaremos la fecha de arriba y lo publicaremos en
        esta página.
      </P>
    </PageShell>
  );
}
