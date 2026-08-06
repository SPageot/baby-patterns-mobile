/** Bump when Terms or Privacy content changes materially. Keep mobile and web copies identical. */
export const LEGAL_POLICY_VERSION = '2026-07-09'

export const LEGAL_LAST_UPDATED = 'July 9, 2026'

export const LEGAL_LAST_UPDATED_ES = '9 de julio de 2026'

/** Public support and privacy contact for Terms, Privacy Policy, and app store listings. */
export const SUPPORT_EMAIL = 'admin@baby-pattern.com'

export function supportEmailMailto(): string {
  return `mailto:${SUPPORT_EMAIL}`
}

export function splitAroundSupportEmail(text: string): { before: string; after: string } | null {
  const idx = text.indexOf(SUPPORT_EMAIL)
  if (idx === -1) return null
  return {
    before: text.slice(0, idx),
    after: text.slice(idx + SUPPORT_EMAIL.length),
  }
}

export type LegalSection = {
  title: string
  paragraphs: string[]
  bullets?: string[]
}

function isSpanishLocale(locale: string): boolean {
  return locale.trim().toLowerCase().startsWith('es')
}

export function getTermsOfUse(locale: string): LegalSection[] {
  return isSpanishLocale(locale) ? TERMS_OF_USE_ES : TERMS_OF_USE
}

export function getPrivacyPolicy(locale: string): LegalSection[] {
  return isSpanishLocale(locale) ? PRIVACY_POLICY_ES : PRIVACY_POLICY
}

export function getLegalLastUpdated(locale: string): string {
  return isSpanishLocale(locale) ? LEGAL_LAST_UPDATED_ES : LEGAL_LAST_UPDATED
}

/** True when a signed-in user must accept the current Terms and Privacy Policy. */
export function userNeedsLegalAcceptance(legalPolicyVersion: string | null | undefined): boolean {
  return legalPolicyVersion !== LEGAL_POLICY_VERSION
}

export const TERMS_OF_USE: LegalSection[] = [
  {
    title: '1. Agreement',
    paragraphs: [
      'These Terms of Use ("Terms") govern your access to and use of Baby Pattern (the "Service"), including our website, mobile apps, and related APIs.',
      'By creating an account or using the Service, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the Service.',
    ],
  },
  {
    title: '2. Who may use the Service',
    paragraphs: [
      'The Service is intended for parents, guardians, and caregivers who are at least 18 years old (or the age of majority where you live).',
      'You represent that you have legal authority to enter information about any child profile you create, and that you will not allow minors to create accounts without appropriate parental consent.',
    ],
  },
  {
    title: '3. Not medical advice',
    paragraphs: [
      'Baby Pattern helps you log and review daily baby care and development information, including diapers, feeding, sleep, naps, potty training, growth measurements, milestones, sickness and injury events, and pediatrician visits (such as hospital, provider name, recommendations, and immunizations).',
      'Reports, charts, weekly summaries, PDF exports, community posts, reviews, and other analysis features are for general informational purposes only. They are designed to help you organize caregiver-entered data and share summaries with your pediatrician or care team when you choose.',
      'The Service does not provide medical advice, diagnosis, or treatment and is not a substitute for professional care. Always consult a qualified pediatrician or healthcare provider about your child\'s health.',
      'Do not delay or disregard medical advice because of something you read, export, or log in the Service.',
    ],
  },
  {
    title: '4. Your account and content',
    paragraphs: [
      'You are responsible for maintaining the confidentiality of your login credentials and for activity under your account.',
      'You may post in Parents Corner, submit product reviews, share challenges and solutions on the Solution Board, upload profile images, log tracking data, export PDF reports, and share tracking access with family members you invite. You retain ownership of content you submit, but grant us a limited license to host, display, process, and transmit it solely to operate the Service (including notifications and email summaries you enable).',
    ],
    bullets: [
      'Do not upload unlawful, harmful, or misleading content.',
      'Do not harass other users or impersonate others.',
      'Do not attempt to access another user\'s data without authorization.',
      'Do not scrape, reverse engineer, or disrupt the Service.',
    ],
  },
  {
    title: '5. Community content and moderation',
    paragraphs: [
      'Some features let users share content with others, including Parents Corner posts and comments, product reviews, and Solution Board notes. Community content reflects the views of the person who posted it, not Baby Pattern.',
      'If you see content that violates these Terms, use the in-app report option on that post, comment, review, or note. You can also block another user to stop seeing their posts, comments, reviews, and Solution Board notes in your feed. Blocking is private — the other person is not notified.',
      'When you submit a report, we store the content type, content identifier, reason you select (such as spam, harassment, inappropriate content, or other), and any optional details you provide. Reports help us identify abuse and improve safety.',
      'We review reports and may remove content, restrict features, or suspend or terminate accounts that violate these Terms or that we reasonably believe pose a safety risk. We aim to review reports within a reasonable time, but we do not guarantee immediate removal.',
      `For urgent safety concerns, email ${SUPPORT_EMAIL} with a link or description of the content and your username.`,
    ],
  },
  {
    title: '6. Family sharing',
    paragraphs: [
      'When you add family members or friends, you choose who can view and log data for your babies, including health and pediatrician visit information. You are responsible for only inviting people you trust and for removing access when appropriate.',
    ],
  },
  {
    title: '7. Subscriptions and billing',
    paragraphs: [
      'Baby Pattern offers free and Pro plans. Pro may include extended history, family sharing alerts, PDF export, weekly email summaries, and other features described on our pricing page.',
      'Paid subscriptions are processed by Stripe or another payment provider we designate. Billing terms, renewals, and cancellations are shown at checkout and in your account settings. Payment card details are handled by the payment provider, not stored directly by us.',
    ],
  },
  {
    title: '8. Availability and changes',
    paragraphs: [
      'We may modify, suspend, or discontinue features at any time. We may update these Terms from time to time. If changes are material, we will provide reasonable notice (for example, by posting an updated effective date and, where appropriate, asking you to accept the revised Terms). Continued use after changes take effect constitutes acceptance.',
    ],
  },
  {
    title: '9. Disclaimer and limitation of liability',
    paragraphs: [
      'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
      'TO THE MAXIMUM EXTENT PERMITTED BY LAW, BABY PATTERN AND ITS OPERATORS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, PROFITS, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.',
    ],
  },
  {
    title: '10. Termination',
    paragraphs: [
      'You may stop using the Service at any time and may delete your account through available account features where supported.',
      'We may suspend or terminate access if you violate these Terms or if necessary to protect the Service or other users.',
    ],
  },
  {
    title: '11. Contact',
    paragraphs: [
      `For questions about these Terms, account access, billing, or technical support, email us at ${SUPPORT_EMAIL}. We aim to respond within a few business days.`,
    ],
  },
]

export const TERMS_OF_USE_ES: LegalSection[] = [
  {
    title: '1. Acuerdo',
    paragraphs: [
      'Estos Términos de uso ("Términos") rigen su acceso y uso de Baby Pattern (el "Servicio"), incluido nuestro sitio web, aplicaciones móviles y API relacionadas.',
      'Al crear una cuenta o usar el Servicio, usted acepta estos Términos y nuestra Política de privacidad. Si no está de acuerdo, no use el Servicio.',
    ],
  },
  {
    title: '2. Quién puede usar el Servicio',
    paragraphs: [
      'El Servicio está destinado a padres, tutores y cuidadores que tengan al menos 18 años (o la mayoría de edad donde viva).',
      'Usted declara que tiene autoridad legal para ingresar información sobre cualquier perfil de niño que cree, y que no permitirá que menores creen cuentas sin el consentimiento parental adecuado.',
    ],
  },
  {
    title: '3. No es consejo médico',
    paragraphs: [
      'Baby Pattern le ayuda a registrar y revisar información diaria sobre el cuidado y el desarrollo del bebé, incluidos pañales, alimentación, sueño, siestas, entrenamiento para ir al baño, mediciones de crecimiento, hitos, eventos de enfermedad y lesiones, y visitas al pediatra (como hospital, nombre del proveedor, recomendaciones e inmunizaciones).',
      'Los informes, gráficos, resúmenes semanales, exportaciones en PDF, publicaciones de la comunidad, reseñas y otras funciones de análisis son solo con fines informativos generales. Están diseñados para ayudarle a organizar los datos ingresados por el cuidador y compartir resúmenes con su pediatra o equipo de atención cuando lo desee.',
      'El Servicio no proporciona consejo médico, diagnóstico ni tratamiento, y no sustituye la atención profesional. Consulte siempre a un pediatra o profesional de la salud calificado sobre la salud de su hijo.',
      'No retrase ni ignore el consejo médico debido a algo que lea, exporte o registre en el Servicio.',
    ],
  },
  {
    title: '4. Su cuenta y contenido',
    paragraphs: [
      'Usted es responsable de mantener la confidencialidad de sus credenciales de inicio de sesión y de la actividad bajo su cuenta.',
      'Puede publicar en Parents Corner, enviar reseñas de productos, compartir desafíos y soluciones en el Solution Board, subir imágenes de perfil, registrar datos de seguimiento, exportar informes en PDF y compartir acceso de seguimiento con miembros de la familia a quienes invite. Usted conserva la propiedad del contenido que envía, pero nos otorga una licencia limitada para alojarlo, mostrarlo, procesarlo y transmitirlo únicamente para operar el Servicio (incluidas las notificaciones y los resúmenes por correo electrónico que active).',
    ],
    bullets: [
      'No suba contenido ilegal, dañino o engañoso.',
      'No acose a otros usuarios ni se haga pasar por otras personas.',
      'No intente acceder a los datos de otro usuario sin autorización.',
      'No realice scraping, ingeniería inversa ni interrumpa el Servicio.',
    ],
  },
  {
    title: '5. Contenido de la comunidad y moderación',
    paragraphs: [
      'Algunas funciones permiten a los usuarios compartir contenido con otros, incluidas publicaciones y comentarios de Parents Corner, reseñas de productos y notas del Solution Board. El contenido de la comunidad refleja las opiniones de la persona que lo publicó, no de Baby Pattern.',
      'Si ve contenido que viola estos Términos, use la opción de denuncia en la aplicación en esa publicación, comentario, reseña o nota. También puede bloquear a otro usuario para dejar de ver sus publicaciones, comentarios, reseñas y notas del Solution Board en su feed. El bloqueo es privado: la otra persona no recibe notificación.',
      'Cuando envía una denuncia, almacenamos el tipo de contenido, el identificador del contenido, el motivo que selecciona (como spam, acoso, contenido inapropiado u otro) y cualquier detalle opcional que proporcione. Las denuncias nos ayudan a identificar abusos y mejorar la seguridad.',
      'Revisamos las denuncias y podemos eliminar contenido, restringir funciones, o suspender o cancelar cuentas que violen estos Términos o que razonablemente creamos que representan un riesgo de seguridad. Procuramos revisar las denuncias en un plazo razonable, pero no garantizamos la eliminación inmediata.',
      `Para inquietudes urgentes de seguridad, envíe un correo a ${SUPPORT_EMAIL} con un enlace o descripción del contenido y su nombre de usuario.`,
    ],
  },
  {
    title: '6. Compartir en familia',
    paragraphs: [
      'Cuando agrega miembros de la familia o amigos, usted elige quién puede ver y registrar datos de sus bebés, incluida la información de salud y de visitas al pediatra. Usted es responsable de invitar solo a personas de su confianza y de quitar el acceso cuando corresponda.',
    ],
  },
  {
    title: '7. Suscripciones y facturación',
    paragraphs: [
      'Baby Pattern ofrece planes gratuitos y Pro. Pro puede incluir historial ampliado, alertas de compartir en familia, exportación en PDF, resúmenes semanales por correo electrónico y otras funciones descritas en nuestra página de precios.',
      'Las suscripciones de pago son procesadas por Stripe u otro proveedor de pago que designemos. Los términos de facturación, renovaciones y cancelaciones se muestran al pagar y en la configuración de su cuenta. Los datos de la tarjeta de pago los maneja el proveedor de pago; nosotros no los almacenamos directamente.',
    ],
  },
  {
    title: '8. Disponibilidad y cambios',
    paragraphs: [
      'Podemos modificar, suspender o discontinuar funciones en cualquier momento. Podemos actualizar estos Términos de vez en cuando. Si los cambios son materiales, proporcionaremos un aviso razonable (por ejemplo, publicando una fecha de vigencia actualizada y, cuando corresponda, pidiéndole que acepte los Términos revisados). El uso continuado después de que los cambios surtan efecto constituye aceptación.',
    ],
  },
  {
    title: '9. Descargo de responsabilidad y limitación de responsabilidad',
    paragraphs: [
      'EL SERVICIO SE PROPORCIONA "TAL CUAL" Y "SEGÚN DISPONIBILIDAD" SIN GARANTÍAS DE NINGÚN TIPO, YA SEAN EXPRESAS O IMPLÍCITAS, INCLUIDAS LAS GARANTÍAS IMPLÍCITAS DE COMERCIABILIDAD, IDONEIDAD PARA UN FIN PARTICULAR Y NO INFRACCIÓN.',
      'EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY, BABY PATTERN Y SUS OPERADORES NO SERÁN RESPONSABLES POR DAÑOS INDIRECTOS, INCIDENTALES, ESPECIALES, CONSECUENTES O PUNITIVOS, NI POR PÉRDIDA DE DATOS, BENEFICIOS O FONDO DE COMERCIO, DERIVADOS DEL USO DEL SERVICIO.',
    ],
  },
  {
    title: '10. Terminación',
    paragraphs: [
      'Puede dejar de usar el Servicio en cualquier momento y puede eliminar su cuenta mediante las funciones de cuenta disponibles cuando estén admitidas.',
      'Podemos suspender o terminar el acceso si usted viola estos Términos o si es necesario para proteger el Servicio u otros usuarios.',
    ],
  },
  {
    title: '11. Contacto',
    paragraphs: [
      `Para preguntas sobre estos Términos, acceso a la cuenta, facturación o soporte técnico, envíenos un correo a ${SUPPORT_EMAIL}. Procuramos responder en unos pocos días hábiles.`,
    ],
  },
]

export const PRIVACY_POLICY: LegalSection[] = [
  {
    title: '1. Overview',
    paragraphs: [
      'This Privacy Policy explains how Baby Pattern ("we," "us") collects, uses, and shares information when you use our Service.',
      'We designed Baby Pattern for parents and caregivers tracking daily baby care. Protecting your family\'s information matters to us.',
      `You can reach our support team at ${SUPPORT_EMAIL}.`,
    ],
  },
  {
    title: '2. Information we collect',
    paragraphs: ['We collect information you provide directly and information generated when you use the Service:'],
    bullets: [
      'Account information: username, email, password (stored hashed), phone, birthdate, full name, and location.',
      'Baby profiles: name, birthdate, locations, and optional measurements.',
      'Tracking logs: diaper, feeding, sleep, nap, potty, growth, milestone, sickness, injury, and pediatrician visit entries you or invited family members create (including dates, notes, symptoms, care details, hospital or clinic names, provider names, recommendations, and immunizations you enter).',
      'Reports and exports: aggregated charts, weekly summaries, and PDF reports generated from your logs when you view or download them.',
      'Community content: Parents Corner posts, comments, likes, product reviews, and Solution Board notes.',
      'Safety and moderation: content reports you submit (content type, content identifier, reason, and optional details) and a list of user accounts you choose to block.',
      'Profile media: avatar images you upload.',
      'Notifications: in-app notification history; optional browser or device push subscription endpoints when you turn alerts on; notification preferences.',
      'Email communications: account-related messages (such as welcome, password reset, and Pro trial reminders) and optional weekly summary emails when you enable them (Pro).',
      'Subscription and billing: plan status, billing interval, and subscription identifiers from our payment provider (such as Stripe customer and subscription IDs). We do not store full payment card numbers.',
      'Technical data: authentication tokens, basic request metadata, and security logs needed to operate and protect the API.',
    ],
  },
  {
    title: '3. How we use information',
    paragraphs: ['We use collected information to:'],
    bullets: [
      'Create and manage your account and baby profiles.',
      'Store, display, and analyze your tracking data, charts, reports, and weekly summaries.',
      'Enable family sharing and activity alerts you configure.',
      'Operate community features such as Parents Corner, reviews, and the Solution Board.',
      'Review content reports, enforce these Terms, and respond to abuse or safety concerns.',
      'Send service emails (such as password reset and account notices) and optional weekly summary emails you opt into.',
      'Deliver push or in-app notifications about mentions, likes, family activity, and tracking updates when enabled.',
      'Process subscriptions and Pro features through our payment provider.',
      'Maintain security, prevent abuse, and improve reliability.',
      'Comply with legal obligations.',
    ],
  },
  {
    title: '4. Health-related information',
    paragraphs: [
      'Sickness, injury, and pediatrician visit logs may contain sensitive health-related information that you choose to enter. We use this information only to provide the Service — for example, to display history, include it in reports you request, share it with family members you authorize, and summarize it in optional weekly emails.',
      'We do not use health-related logs for advertising and we do not sell them.',
    ],
  },
  {
    title: '5. How we share information',
    paragraphs: [
      'We do not sell your personal information.',
      'We share information only in these situations:',
    ],
    bullets: [
      'With people you invite: family members you add can access baby tracking data you authorize, including health and pediatrician visit logs.',
      'With service providers: hosting, email delivery, payment processing (such as Stripe), and infrastructure partners that process data on our behalf under contractual safeguards.',
      'For legal reasons: when required by law or to protect rights, safety, and security.',
      'With your direction: when you export PDF reports, copy weekly summaries, or otherwise choose to share information outside the Service.',
    ],
  },
  {
    title: '6. Cookies and local storage',
    paragraphs: [
      'The Service uses browser local storage to keep you signed in (access and refresh tokens), remember preferences such as theme settings, and support optional web push notifications on devices where you enable them.',
      'We do not use third-party advertising cookies in the current version of the Service.',
    ],
  },
  {
    title: '7. Data retention and deletion',
    paragraphs: [
      'We retain account and tracking data while your account is active so the Service can function.',
      'You may delete your account where that feature is available; we will delete or de-identify associated personal data within a reasonable period, except where retention is required by law or for legitimate security purposes.',
    ],
  },
  {
    title: '8. Security',
    paragraphs: [
      'We use industry-standard measures such as hashed passwords, authenticated API access, and encrypted connections (HTTPS) in production.',
      'No method of transmission or storage is completely secure; please use a strong, unique password and protect your device.',
    ],
  },
  {
    title: '9. Children\'s privacy',
    paragraphs: [
      'Baby Pattern is not directed to children under 13 to use on their own. Parents and guardians enter information about their children.',
      `If you believe a child has created an account without appropriate consent, contact us at ${SUPPORT_EMAIL} so we can take appropriate action.`,
    ],
  },
  {
    title: '10. Your choices and rights',
    paragraphs: [
      'Depending on where you live, you may have rights to access, correct, delete, or export personal information. You can update profile details in the app, manage notification and weekly email preferences in settings, and remove family sharing connections from your profile settings.',
      `To exercise privacy rights (access, correction, or deletion), email ${SUPPORT_EMAIL} from the address associated with your account.`,
    ],
  },
  {
    title: '11. International users',
    paragraphs: [
      'If you access the Service from outside the United States, your information may be processed in the United States or other countries where our service providers operate, which may have different data protection laws.',
    ],
  },
  {
    title: '12. Changes to this policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. We will post the revised policy with an updated "Last updated" date. Material changes may require renewed acceptance at signup or login.',
    ],
  },
  {
    title: '13. Contact',
    paragraphs: [
      `For privacy questions or data requests, email ${SUPPORT_EMAIL}.`,
    ],
  },
]

export const PRIVACY_POLICY_ES: LegalSection[] = [
  {
    title: '1. Descripción general',
    paragraphs: [
      'Esta Política de privacidad explica cómo Baby Pattern ("nosotros") recopila, usa y comparte información cuando usted usa nuestro Servicio.',
      'Diseñamos Baby Pattern para padres y cuidadores que hacen seguimiento del cuidado diario del bebé. Proteger la información de su familia es importante para nosotros.',
      `Puede comunicarse con nuestro equipo de soporte en ${SUPPORT_EMAIL}.`,
    ],
  },
  {
    title: '2. Información que recopilamos',
    paragraphs: ['Recopilamos información que usted proporciona directamente e información generada cuando usa el Servicio:'],
    bullets: [
      'Información de la cuenta: nombre de usuario, correo electrónico, contraseña (almacenada con hash), teléfono, fecha de nacimiento, nombre completo y ubicación.',
      'Perfiles de bebé: nombre, fecha de nacimiento, ubicaciones y mediciones opcionales.',
      'Registros de seguimiento: entradas de pañales, alimentación, sueño, siesta, baño, crecimiento, hitos, enfermedad, lesión y visitas al pediatra que usted o miembros de la familia invitados crean (incluidas fechas, notas, síntomas, detalles de cuidados, nombres de hospitales o clínicas, nombres de proveedores, recomendaciones e inmunizaciones que usted ingresa).',
      'Informes y exportaciones: gráficos agregados, resúmenes semanales e informes en PDF generados a partir de sus registros cuando los ve o descarga.',
      'Contenido de la comunidad: publicaciones, comentarios y me gusta de Parents Corner, reseñas de productos y notas del Solution Board.',
      'Seguridad y moderación: denuncias de contenido que usted envía (tipo de contenido, identificador del contenido, motivo y detalles opcionales) y una lista de cuentas de usuario que elige bloquear.',
      'Medios de perfil: imágenes de avatar que usted sube.',
      'Notificaciones: historial de notificaciones en la aplicación; endpoints opcionales de suscripción push del navegador o del dispositivo cuando activa las alertas; preferencias de notificación.',
      'Comunicaciones por correo electrónico: mensajes relacionados con la cuenta (como bienvenida, restablecimiento de contraseña y recordatorios de prueba Pro) y correos opcionales de resumen semanal cuando los activa (Pro).',
      'Suscripción y facturación: estado del plan, intervalo de facturación e identificadores de suscripción de nuestro proveedor de pago (como IDs de cliente y suscripción de Stripe). No almacenamos números completos de tarjetas de pago.',
      'Datos técnicos: tokens de autenticación, metadatos básicos de solicitud y registros de seguridad necesarios para operar y proteger la API.',
    ],
  },
  {
    title: '3. Cómo usamos la información',
    paragraphs: ['Usamos la información recopilada para:'],
    bullets: [
      'Crear y administrar su cuenta y perfiles de bebé.',
      'Almacenar, mostrar y analizar sus datos de seguimiento, gráficos, informes y resúmenes semanales.',
      'Habilitar el compartir en familia y las alertas de actividad que usted configure.',
      'Operar funciones de la comunidad como Parents Corner, reseñas y el Solution Board.',
      'Revisar denuncias de contenido, aplicar estos Términos y responder a abusos o inquietudes de seguridad.',
      'Enviar correos del servicio (como restablecimiento de contraseña y avisos de cuenta) y correos opcionales de resumen semanal a los que se suscriba.',
      'Entregar notificaciones push o en la aplicación sobre menciones, me gusta, actividad familiar y actualizaciones de seguimiento cuando estén habilitadas.',
      'Procesar suscripciones y funciones Pro a través de nuestro proveedor de pago.',
      'Mantener la seguridad, prevenir abusos y mejorar la fiabilidad.',
      'Cumplir con obligaciones legales.',
    ],
  },
  {
    title: '4. Información relacionada con la salud',
    paragraphs: [
      'Los registros de enfermedad, lesión y visitas al pediatra pueden contener información sensible relacionada con la salud que usted elige ingresar. Usamos esta información solo para proporcionar el Servicio; por ejemplo, para mostrar el historial, incluirla en informes que solicite, compartirla con miembros de la familia que autorice y resumirla en correos semanales opcionales.',
      'No usamos los registros relacionados con la salud para publicidad y no los vendemos.',
    ],
  },
  {
    title: '5. Cómo compartimos la información',
    paragraphs: [
      'No vendemos su información personal.',
      'Compartimos información solo en estas situaciones:',
    ],
    bullets: [
      'Con personas que usted invita: los miembros de la familia que agregue pueden acceder a los datos de seguimiento del bebé que autorice, incluidos los registros de salud y de visitas al pediatra.',
      'Con proveedores de servicios: alojamiento, entrega de correo electrónico, procesamiento de pagos (como Stripe) y socios de infraestructura que procesan datos en nuestro nombre bajo salvaguardas contractuales.',
      'Por motivos legales: cuando lo exija la ley o para proteger derechos, seguridad e integridad.',
      'Por su indicación: cuando exporta informes en PDF, copia resúmenes semanales o elige de otro modo compartir información fuera del Servicio.',
    ],
  },
  {
    title: '6. Cookies y almacenamiento local',
    paragraphs: [
      'El Servicio usa el almacenamiento local del navegador para mantenerlo conectado (tokens de acceso y actualización), recordar preferencias como la configuración del tema y admitir notificaciones push web opcionales en dispositivos donde las active.',
      'No usamos cookies de publicidad de terceros en la versión actual del Servicio.',
    ],
  },
  {
    title: '7. Conservación y eliminación de datos',
    paragraphs: [
      'Conservamos los datos de la cuenta y de seguimiento mientras su cuenta esté activa para que el Servicio pueda funcionar.',
      'Puede eliminar su cuenta cuando esa función esté disponible; eliminaremos o desidentificaremos los datos personales asociados en un plazo razonable, salvo cuando la conservación sea requerida por ley o por fines legítimos de seguridad.',
    ],
  },
  {
    title: '8. Seguridad',
    paragraphs: [
      'Usamos medidas estándar de la industria como contraseñas con hash, acceso autenticado a la API y conexiones cifradas (HTTPS) en producción.',
      'Ningún método de transmisión o almacenamiento es completamente seguro; use una contraseña fuerte y única y proteja su dispositivo.',
    ],
  },
  {
    title: '9. Privacidad de los menores',
    paragraphs: [
      'Baby Pattern no está dirigido a que menores de 13 años lo usen por sí mismos. Los padres y tutores ingresan información sobre sus hijos.',
      `Si cree que un menor ha creado una cuenta sin el consentimiento adecuado, contáctenos en ${SUPPORT_EMAIL} para que podamos tomar las medidas correspondientes.`,
    ],
  },
  {
    title: '10. Sus opciones y derechos',
    paragraphs: [
      'Según el lugar donde viva, puede tener derechos de acceso, corrección, eliminación o exportación de información personal. Puede actualizar los detalles del perfil en la aplicación, administrar las preferencias de notificación y de correo semanal en la configuración, y eliminar conexiones de compartir en familia desde la configuración de su perfil.',
      `Para ejercer derechos de privacidad (acceso, corrección o eliminación), envíe un correo a ${SUPPORT_EMAIL} desde la dirección asociada a su cuenta.`,
    ],
  },
  {
    title: '11. Usuarios internacionales',
    paragraphs: [
      'Si accede al Servicio desde fuera de los Estados Unidos, su información puede procesarse en los Estados Unidos u otros países donde operan nuestros proveedores de servicios, que pueden tener leyes de protección de datos diferentes.',
    ],
  },
  {
    title: '12. Cambios a esta política',
    paragraphs: [
      'Podemos actualizar esta Política de privacidad de vez en cuando. Publicaremos la política revisada con una fecha de "Última actualización" actualizada. Los cambios materiales pueden requerir una nueva aceptación al registrarse o iniciar sesión.',
    ],
  },
  {
    title: '13. Contacto',
    paragraphs: [
      `Para preguntas de privacidad o solicitudes de datos, envíe un correo a ${SUPPORT_EMAIL}.`,
    ],
  },
]
