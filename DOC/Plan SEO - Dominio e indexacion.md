# Plan SEO — Dominio, indexación y descubrimiento de Pimpo’s

> **Para ejecutar:** usar `superpowers:executing-plans`, tarea por tarea en esta sesión, con Dan operando su cuenta del negocio y las comprobaciones de cierre antes de avanzar. Los cambios de código tendrán revisión independiente antes de su PR. Este documento planifica; no acredita altas ni cambios productivos ya realizados.

**Objetivo:** facilitar que https://www.panaderiapimpos.com/ sea descubierto y comprendido por Google, búsqueda local, Bing y asistentes con búsqueda web, conservando toda funcionalidad.

**Arquitectura:** mantener Next.js y Supabase en el despliegue vigente de Vercel. Primero configurar propiedades y fichas externas; después mejorar metadatos y contenido usando las rutas, lecturas y campos existentes. Indexación, fichas verificadas y rendimiento observado se registran por separado.

**Stack:** Next 16.3.4, React 19.2.8, Node 24, pnpm 12.3.4, Vitest y Playwright existentes; Google Search Console, Perfil de Empresa, DNS activo y Bing Webmaster Tools. No añadir librerías SEO, servicios de IA ni etiquetas de analítica.

**Especificación:** Dan, 12/10/2026: pausar alojamiento alternativo, continuar en Vercel durante el semestre, usar el dominio ya operativo y avanzar en el orden de la auditoría, con guía paso a paso. Confirmó que Search Console y Perfil de Empresa no están configurados y que se usará **la cuenta del negocio**. El cambio de alojamiento se reconsiderará después si la dueña lo solicita. PR #95 se conserva intacto, abierto y en borrador.

## 1. Restricciones globales

- No cambiar funcionalidades, rutas, formularios, permisos, consultas, cálculos, autenticación, descargas ni auditoría.
- Dominio preferido: `https://www.panaderiapimpos.com`. No cambiar hosting, nameservers, registros de la web o correo para verificar Google.
- Cuenta del negocio como titular de las altas. Dan inicia sesión y conserva contraseñas y recuperación en su gestor; no escribirlas en chat, código, capturas compartidas ni Git.
- Añadir solo el TXT de verificación que Google emita; conservar otros TXT, A, AAAA, CNAME y MX. Un token externo se recibe del servicio, nunca se inventa en el plan.
- Los pasos de una cuenta se cierran con evidencia de su estado. Guardar una configuración, poder rastrear e indexar son resultados distintos.
- Contenido verdadero, confirmado por el negocio. No inventar ingredientes, alérgenos, precios, existencias, reseñas, sucursales o redes oficiales.
- Mantener logo configurable y fuentes/imágenes optimizadas. No añadir `aggregateRating`, `review`, `availability` o fechas de precio sin datos que lo acrediten.
- No introducir carrito, pagos, nuevas páginas de variantes, buscador global o cambios de navegación para SEO.
- No modificar migraciones/RLS ni escribir textos directamente por SQL en producción. Usar los campos y acciones del panel existente.
- Ninguna promesa de posición, plazo de indexación o cita por una IA. Search Console no es requisito de Google para incluir un sitio, pero permite diagnosticar y solicitar rastreo.
- Si el proyecto permanece en Hobby, su condición de uso personal no comercial sigue vigente. Este plan no cambia el plan contratado ni considera la duración del semestre una excepción a sus condiciones.

## 2. Base comprobada el 12/10/2026

| Comprobación                | Resultado y alcance                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| URLs declaradas             | 44: 8 rutas generales, 34 productos y 2 novedades; cantidad de referencia, puede cambiar con el panel                                      |
| Respuestas públicas         | Las 44 responden HTTP 200, una canónica coherente, un h1 y sin noindex público                                                             |
| Dominio raíz y HTTP         | Redirección 308 a HTTPS con www                                                                                                            |
| Robots/sitemap              | Sitio público permitido; admin/ingresar excluidos; sitemap con el dominio nuevo                                                            |
| Login                       | Metadatos noindex,nofollow; no es una URL para posicionar                                                                                  |
| Datos del negocio           | Bakery con dirección, coordenadas, teléfono y horarios; image usa el logo y no publica sameAs                                              |
| Productos                   | 34 bloques Product; sin description. Ficha representativa sin offers/review/aggregateRating                                                |
| Compartir                   | Imagen OpenGraph válida, HTTP 200, PNG, 1200×630, 85,641 bytes                                                                             |
| Bots                        | User-Agent simulado Googlebot/bingbot/OAI-SearchBot devuelve 200; no prueba acceso desde sus IP reales                                     |
| Dirección antigua de Vercel | Responde 200 y ya declara la canónica del dominio nuevo; la redirección es una mejora a evaluar, no un bloqueo confirmado                  |
| DNS autoritativo            | `nova.dns-parking.com` y `cosmos.dns-parking.com`; registrar el TXT donde se administra esa zona activa, no asumir que Vercel controla DNS |
| Herramientas externas       | Dan confirma Search Console y Perfil de Empresa sin configurar                                                                             |
| Estado de Google            | No se consultó su índice mediante Search Console; la búsqueda pública sin resultados no acredita desindexación                             |

Evidencia pública resumida en `DOC/Evidencias SEO/auditoria-dominio-2026-10-12.json`. Las descargas HTML de auditoría están fuera de Git; no incluyen acceso al panel. No se midieron Core Web Vitals de campo.

## 3. Cómo avanzaremos juntos

1. Yo indico el siguiente paso concreto y qué resultado esperamos.
2. Dan realiza el ingreso o la operación de su cuenta del negocio y comunica el estado visible. No pedir contraseñas, códigos de acceso ni capturas con datos de recuperación.
3. Yo compruebo lo que sea público por HTTP/DNS y contrasto el estado que muestre la herramienta.
4. Registramos fecha, resultado y siguiente paso en la tabla de seguimiento.
5. Si Google exige tiempo de propagación o una verificación de la ficha, dejamos esa comprobación abierta y seguimos solo con trabajo independiente. El tiempo transcurrido no acredita verificación.

El ingreso y las verificaciones personales las hace Dan. No crear cuentas, aceptar términos o conceder permisos de cuenta automáticamente a partir de este documento. Las operaciones externas se guían en el momento, mostrando valores concretos y comprobando el resultado. No enviar mensajes a clientes, proveedores o Google como parte de este plan.

## 4. Secuencia y cierre

| Etapa | Entrega                      | Criterio de cierre                                                                               | Estado                                                                           |
| ----- | ---------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| T1    | Search Console y sitemap     | Propiedad verificada, sitemap recibido y primeras inspecciones registradas                       | Propiedad verificada; sitemap correcto con 44 URLs según captura de Dan          |
| T2    | Perfil de Empresa / Maps     | Ficha correcta y verificada; si Google demora, registrar verificación en curso sin marcar cierre | Aplazada por Dan; ficha existente sin verificar                                  |
| T3    | SEO técnico                  | Vista previa comprobada, PR revisado y aplicación productiva verificada tras la fusión de Dan    | Integrada y comprobada en producción el 13/10/2026                               |
| T4    | Contenido y coherencia local | Lote inicial confirmado y publicado; seguimiento de los demás productos documentado              | Lote de cinco publicado y comprobado; 29 fichas y coherencia con Maps pendientes |
| T5    | Bing y acceso de bots        | Propiedad verificada, sitemap recibido y rastreo sin bloqueos comprobados al alcance disponible  | Después de T4 inicial                                                            |
| T6    | Medición                     | Línea base y primera revisión con datos disponibles; sin inventar ceros cuando no hay datos      | Después de T5                                                                    |

T1 y T2 no necesitan modificar código. T3 se divide en dos tareas técnicas como máximo por PR: T3a y T3b. Las esperas externas no impiden preparar textos o el PR técnico, pero no se da por cerrado el estado externo. No programar una automatización de seguimiento: las revisiones serán guiadas en este chat.

## T1. Search Console, dominio y sitemap

**Responsables:** Dan, cuenta del negocio y editor DNS; asistente, instrucciones y verificación pública.
**Archivos:** actualizar solo el seguimiento de este plan y `DOC/Avance del proyecto.md` cuando exista un resultado; no modificar app ni configuración Vercel.
**Entrada:** dominio vigente, sesión Google del negocio y TXT real emitido por Search Console.
**Salida:** propiedad de dominio verificada, sitemap y cuatro inspecciones iniciales documentadas.

- [ ] Abrir https://search.google.com/search-console/welcome con la cuenta del negocio.
- [ ] Comprobar la cuenta seleccionada antes de continuar. Si aparece otra, cambiarla personalmente; el asistente no necesita conocer su correo completo.
- [ ] En **Dominio**, escribir exactamente `panaderiapimpos.com`, sin protocolo, www ni barra; elegir Continuar.
- [ ] Copiar el TXT que Google muestre completo. Comunicar que se llegó a esa pantalla; todavía no cerrar la verificación.
- [ ] Abrir el panel que administra los nameservers activos. Si es Hostinger para un dominio sin hosting: Dominios → panaderiapimpos.com → DNS / Nameservers. Confirmar primero que la zona corresponde a los NS consultados.
- [ ] Guardar una copia privada de la lista DNS vigente antes de la operación; no publicarla en el repositorio.
- [ ] Añadir un registro **TXT**, nombre **@**, valor exacto de Google, TTL predeterminado del proveedor. No sustituir TXT existentes ni activar Reset DNS Records. Registrar solo tipo/nombre y que fue añadido; no conservar el token en Git.
- [ ] Consultar DNS y comprobar que el TXT de Google ya es visible. Este comando lista valores públicos; revisar la salida sin incorporarla íntegra a Git:

```powershell
Resolve-DnsName panaderiapimpos.com -Type TXT
```

- [ ] Después de añadir el TXT, comparar los registros vigentes con la copia anterior: NS, web y MX deben permanecer iguales. Comprobar que la portada sigue respondiendo 200; no enviar correo de prueba a terceros.
- [ ] Volver a Search Console y elegir Verificar. Si todavía no lo encuentra, comprobar valor y zona; esperar propagación y repetir la verificación, sin duplicar registros. El mensaje **propiedad verificada** es la evidencia de cierre de esta parte.
- [ ] En Sitemaps, enviar `https://www.panaderiapimpos.com/sitemap.xml`. Registrar el estado real: enviado no equivale a procesado correctamente.
- [ ] Inspeccionar portada, `/productos`, `/productos/frances-chico` y `/contacto`. Ejecutar la prueba publicada y registrar rastreabilidad, canónica detectada y estado de indexación.
- [ ] Solicitar indexación de esas páginas una vez que la inspección no muestre un bloqueo. No repetir solicitudes para intentar acelerar el proceso.
- [ ] Mantener el TXT de verificación. Marcar T1 cuando propiedad y sitemap estén comprobados y las inspecciones registradas; no exigir que todo Google ya haya indexado para cerrar la configuración.

**Estado al 13/10/2026:** Dan verificó la propiedad y realizó las cuatro solicitudes iniciales.
El TXT publicado se comprobó sin guardar su valor en Git. Tras el error de lectura
anterior, la nueva captura muestra **Correcto y 44 páginas descubiertas**. Google muestra
resultados de portada y contacto; no se da por indexado el resto. El XML público responde
HTTP 200 y es válido. No repetir solicitudes ni dar por indexadas las páginas por su envío.

## T2. Perfil de Empresa y Google Maps

**Responsables:** Dan y dueña, datos y verificación; asistente, revisión de coherencia.
**Archivos:** seguimiento de este plan; el contenido público del negocio solo después de confirmarlo.
**Entrada:** cuenta del negocio, identidad comercial y datos actuales de web/negocio.
**Salida:** una ficha legítima identificada por su URL, con titularidad y estado de verificación registrados.

- [ ] Buscar Pimpo’s y la dirección en Google Maps antes de crear una ficha. Si ya existe, iniciar su reclamación; si la gestiona otra persona, seguir el procedimiento de Google en lugar de crear un duplicado.
- [ ] Abrir https://www.google.com/business/ con la cuenta del negocio. Dan completa los pasos externos y confirma cualquier requisito del servicio.
- [ ] Usar **Panadería Pimpo’s** como nombre real, sin añadir palabras clave al nombre comercial para posicionar.
- [ ] Seleccionar categoría principal **Panadería** si describe el negocio; las categorías adicionales solo si corresponden y Google las ofrece.
- [ ] Confirmar con la dueña dirección, punto del mapa, teléfono, turnos de atención y cobertura del delivery. La web hoy muestra Calle Elías Aguirre 1321, Belén, Iquitos; es base de comparación, no sustituto de esa confirmación.
- [ ] Introducir la web `https://www.panaderiapimpos.com/` y los datos confirmados. Si hay discrepancias con el sitio, anotarlas para T4 y corregirlas por el panel existente cuando el negocio las confirme.
- [ ] Añadir fotos reales actuales de fachada, interior y productos; el negocio confirma que son aptas para publicar. No crear sedes adicionales por una afiliación mencionada en la portada.
- [ ] Realizar el método de verificación que Google ofrezca. No prometer llamada/SMS: Google puede exigir otro método, vídeo o revisión. Esa parte la realiza Dan/dueña.
- [ ] Registrar URL de la ficha y estado: solicitada, en revisión o verificada. No marcar verificada sin el mensaje correspondiente.
- [ ] Comprobar nombre, dirección, teléfono y horarios contra el sitio. Solicitud de reseñas auténticas es una tarea del negocio; no automatizar contactos ni ofrecer recompensas a cambio de una valoración.

## T3a. Identidad y metadatos locales

**Archivos:** modificar `src/app/(public)/page.tsx`, `src/lib/seo/datos-estructurados.ts`, su `.test.ts` y `e2e/seo.spec.ts`. Reutilizar `src/components/seo/datos-estructurados.tsx`, sin cambiar su escape contra XSS.
**Entrada:** `obtenerConfiguracion()`, galería ya leída por la portada, URL del sitio y logo configurado.
**Salida:** título local y Bakery enriquecido, sin cambiar contenido funcional ni lecturas.

- [ ] Leer la documentación local de Next sobre Metadata/JSON-LD y las guías oficiales de negocio local antes de implementar.
- [ ] Ampliar la prueba SEO existente para esperar el título de portada **Panadería Pimpo's en Iquitos | Pan fresco y delivery**. Confirmar que la prueba falla antes del cambio; no retirar los casos de canónica/privacidad existentes.
- [ ] Implementar solo el metadata de portada, evitando duplicación del nombre mediante `title.absolute`. El literal de apóstrofo que usamos en código es el actual ASCII:

```tsx
export const metadata: Metadata = {
  title: { absolute: "Panadería Pimpo's en Iquitos | Pan fresco y delivery" },
  alternates: { canonical: urlAbsoluta("/") },
};
```

- [ ] Extender `panaderiaSchema` con entrada opcional `urlFoto?: string`. Mantener `logo: urlLogo`; usar `image: urlFoto ?? urlLogo`. La portada ya calcula `fachada` desde la galería: pasar su imagen pública cuando exista, sin una nueva consulta. Si no hay foto, conservar logo como reserva; no inventar imágenes.
- [ ] Para `telephone` del schema, agregar prefijo +51 únicamente a un celular peruano de 9 dígitos que comience con 9; conservar un número internacional validado y no reinterpretar automáticamente teléfonos fijos o valores ambiguos. Teléfono visible, WhatsApp y campos de configuración no cambian.
- [ ] En la prueba unitaria existente, comprobar logo independiente de imagen, reserva sin foto y teléfono confirmado. Ejemplo dentro de `describe('panaderiaSchema')`, reutilizando `config` y `base` ya existentes:

```ts
it("separa la foto real del negocio de su logo", () => {
  const foto = "https://www.panaderiapimpos.com/fachada-confirmada.webp";
  const datos = panaderiaSchema({ config: config(), ...base, urlFoto: foto });
  expect(datos.logo).toBe(base.urlLogo);
  expect(datos.image).toBe(foto);
  expect(panaderiaSchema({ config: config(), ...base }).image).toBe(base.urlLogo);
});
```

La URL del ejemplo es una entrada sintética de unidad, no un archivo ni una foto que se vaya a publicar.

- [ ] Mantener `sameAs` derivado exclusivamente de redes oficiales confirmadas en campos existentes. La ausencia de redes no debe crear enlaces de reserva inventados.
- [ ] Ejecutar pruebas SEO/unidad, tipos y lint. Validar Bakery en Rich Results Test en la vista previa y comprobar canónicas, OG y privacidad. No modificar sitemap con fechas ficticias.
- [ ] Evaluar redirección de la dirección antigua solo después de comprobar enlaces, login y cron. Como ya declara la canónica nueva, no es condición para entregar T3a. Si se propone una regla, documentar patrón/status/preservación de ruta y probar GET, retorno de login y llamadas de cron antes de pedir su aplicación productiva.

## T3b. Datos del producto y precios reales

**Archivos:** crear `src/lib/seo/producto.ts` y `src/lib/seo/producto.test.ts`; modificar el bloque JSON-LD de `src/app/(public)/productos/[slug]/page.tsx` y ampliar `e2e/seo.spec.ts`. No modificar catálogo, precios, presentaciones, rutas o mensajes de pedido.
**Entrada:** `ProductoPublico` actual de `src/lib/datos/catalogo.ts`, URL canónica ya calculada.
**Salida:** helper `productoSchema(producto: ProductoPublico, urlProducto: string)` consumido por el componente existente.

- [ ] Crear pruebas del helper: descripción real conservada; precio nulo omitido; única presentación con precio decimal conservado; varias presentaciones sin hacer pasar un mínimo por una oferta de todas; ausencia de marca/valoraciones/stock inventados. Ejecutar y conservar el fallo inicial por módulo inexistente.
- [ ] Extraer a `productoSchema` el objeto actual (context, tipo, id, url, name y campos opcionales de description/image/category). No traducir o inventar las descripciones ausentes.
- [ ] Añadir `offers` **solo cuando haya una única presentación con precio vigente, numérico, finito y no negativo**. El precio sale de esa presentación, sin redondearlo ni convertir null en cero. Publicar `@type: Offer`, `price`, `priceCurrency: PEN`, nombre de presentación y URL canónica de la ficha.
- [ ] Para varias presentaciones, mantener el bloque Product descriptivo hasta que exista una estrategia de variantes validada compatible con las rutas actuales. No usar AggregateOffer para representar variantes, ni crear rutas nuevas dentro de este plan. Registrar qué fichas quedan sin elegibilidad para precio enriquecido; no decir que todos los productos pasan Rich Results Test.
- [ ] Integrar el helper con `<DatosEstructurados datos={productoSchema(producto, urlAbsoluta(`/productos/${producto.slug}`))} />`. Mantener la serialización segura existente.
- [ ] Comprobar al menos estas entradas en unidad, creando `producto` mediante un factory tipado completo para `ProductoPublico` (id/nombre/slug, campos nulos, destacado false, variantes y presentaciones correspondientes):

```ts
it("no publica un precio cuando la presentación no lo tiene", () => {
  const producto = crearProductoDePrueba({
    presentaciones: [{ id: "unidad", nombre: "Unidad", precio: null, unidad: "unidad" }],
  });
  const datos = productoSchema(producto, "https://www.panaderiapimpos.com/productos/prueba");
  expect(datos).not.toHaveProperty("offers");
});

it("mantiene 0.10 PEN de la única presentación sin inventar disponibilidad", () => {
  const producto = crearProductoDePrueba({
    presentaciones: [{ id: "unidad", nombre: "Unidad", precio: 0.1, unidad: "unidad" }],
  });
  const datos = productoSchema(producto, "https://www.panaderiapimpos.com/productos/prueba");
  expect(datos).toHaveProperty("offers.price", 0.1);
  expect(datos).toHaveProperty("offers.priceCurrency", "PEN");
  expect(datos).not.toHaveProperty("offers.availability");
});
```

Factory de pruebas a definir en el mismo archivo, sin dependencias ni fixtures de producción:

```ts
function crearProductoDePrueba(parcial: Partial<ProductoPublico> = {}): ProductoPublico {
  return {
    id: "prueba",
    nombre: "Producto de prueba",
    slug: "prueba",
    descripcion: null,
    destacado: false,
    categoriaNombre: null,
    categoriaSlug: null,
    precioDesde: null,
    precioHasta: null,
    variantes: 0,
    varianteNombre: null,
    varianteUnidad: null,
    imagen: null,
    imagenAlt: null,
    presentaciones: [],
    ...parcial,
  };
}
```

- [ ] Ampliar E2E para cotejar el precio del schema con la presentación del caso de pruebas, además de mantener la comprobación de que no hay brand, aggregateRating, review o availability inventados. Usar datos locales; no editar precios del negocio para hacer pasar la prueba.
- [ ] Validar una ficha apta y otra de varias presentaciones en vista previa y Rich Results Test. Una Product descriptiva puede ser válida en schema.org sin cumplir los requisitos de resultado enriquecido de Google; registrar esa distinción.

**Comprobación y entrega de T3a/T3b:**

```powershell
pnpm exec vitest run src/lib/seo/datos-estructurados.test.ts src/lib/seo/producto.test.ts
pnpm typecheck
pnpm lint
pnpm exec playwright test e2e/seo.spec.ts --project=escritorio
```

Los E2E se ejecutan sobre Supabase local según el harness existente; el CI del PR comprueba el resto. Dependencias del checkout actual están en junction: no instalar ni modificar a través de ella. Cambios técnicos irán en rama desde main, máximo dos tareas en un PR borrador. Revisión independiente, vista previa Vercel y paridad funcional antes de integración. Dan fusiona; tras ello comprobar metadatos reales del dominio. No llamar “desplegado” al resultado de una vista previa.

## T4. Descripciones y coherencia del negocio

**Responsables:** asistente prepara borradores; Dan/dueña confirman hechos y publicación por panel.
**Archivos:** crear `DOC/SEO - Contenido confirmado.md` al iniciar esta etapa; no cambiar campos del modelo ni tablas.
**Entrada:** productos públicos, precios/presentaciones existentes, hechos confirmados por el negocio y ficha de Maps.
**Salida:** un lote inicial de 5 productos confirmado y publicado; estado individual del resto.

- [ ] Listar productos vigentes y priorizar los 5 que el negocio considere más importantes. Usar slug/nombre real; la lista de 34 de la auditoría es referencia, no un catálogo inmutable.
- [ ] Preparar por producto: descripción breve útil, presentación/tamaño confirmado y cómo pedir. Separar cada afirmación comprobada de los datos que falta consultar al negocio; no publicar esos datos sin confirmar.
- [ ] Usar el documento con columnas: slug, texto propuesto, hechos confirmados, decisión de Dan/dueña, estado publicado y fecha. El vacío de un dato no se completa inventándolo.
- [ ] Revisar términos que una persona usaría, como panadería en Iquitos y delivery en Belén, solo donde encajen en el contenido real. No repetir palabras clave en todos los títulos ni ocultar texto para robots.
- [ ] Confirmar el lote de 5; publicar por las acciones actuales del panel. No cambiar precios, ingredientes o disponibilidad por implicación del texto.
- [ ] Leer la ficha publicada y su JSON-LD después de la invalidación habitual: descripción visible y description estructurada deben coincidir. Si la actualización no aparece, diagnosticar el mecanismo existente, no retirar caché para ocultar el problema.
- [ ] Completar redes oficiales en configuración cuando sus URLs estén confirmadas y enlazar el dominio desde perfiles que el negocio controle. Dan realiza cambios externos; no contactar personas ni abrir perfiles nuevos automáticamente.
- [ ] Revisar FAQ, contacto y horarios respecto de la ficha verificada. No prometer resultados enriquecidos de FAQ a una panadería.
- [ ] Registrar el resto de productos para lotes sucesivos. T4 inicial cierra con el lote comprobado y la lista del resto, sin afirmar que todas las fichas están completas.

## T5. Bing y descubrimiento en búsquedas con IA

**Responsables:** Dan, alta/verificación con cuenta del negocio; asistente, rastreo y comprobación.
**Archivos:** seguimiento y evidencia pública; `src/app/robots.ts`/firewall solo si se demuestra un bloqueo y en una tarea revisada separada.
**Entrada:** Search Console verificada, dominio canónico y sitemap vigente.
**Salida:** propiedad Bing verificada, sitemap registrado y estado de rastreo anotado.

- [ ] Abrir https://www.bing.com/webmasters/ con la cuenta del negocio y añadir el sitio.
- [ ] Preferir verificación directa si Dan no quiere conceder integración; importar Search Console es una alternativa que muestra permisos concretos en su pantalla. Dan decide y realiza esa autorización, no el asistente.
- [ ] Verificar el dominio mediante el método real ofrecido y enviar el sitemap; guardar resultado de recepción/procesamiento.
- [ ] Inspeccionar portada y ficha representativa y registrar canónica, acceso e indexación separadamente.
- [ ] Revisar robots público y reglas Vercel/WAF: el sitio público debe permitir rastreo; panel y login conservan privacidad. No quitar protecciones globales para lograr un 200 de bot.
- [ ] Mantener la regla universal actual cuando ya permite OAI-SearchBot; no agregar un grupo allow específico que pierda Disallow de admin/login. Un User-Agent simulado no certifica IP real: usar evidencia de inspección o logs disponibles para el alcance real.
- [ ] Distinguir OAI-SearchBot (búsqueda ChatGPT) de GPTBot (entrenamiento). La visibilidad buscada no exige habilitar entrenamiento. No cambiar esa política por defecto sin decisión del negocio.
- [ ] No añadir llms.txt como requisito ni instrucciones para manipular respuestas de modelos. Para AI Overviews/AI Mode Google utiliza fundamentos SEO habituales; el objetivo aquí es contenido accesible y verificable.
- [ ] Registrar citas o visitas observadas sin prometer que todos los chats conozcan el negocio. Un modelo sin búsqueda no se actualiza automáticamente por publicar la web.

## T6. Medición y ajustes durante el semestre

**Responsables:** Dan y asistente en revisiones manuales de este chat.
**Archivos:** crear `DOC/SEO - Seguimiento de resultados.md` cuando haya datos; no añadir rastreadores nuevos a la aplicación.
**Entrada:** Search Console/Bing/ficha verificados y versiones desplegadas.
**Salida:** línea base y una revisión posterior con fechas y alcance reales.

- [ ] Registrar fecha de verificación, envío del sitemap y despliegue de cada mejora. Alinear ventanas antes de comparar.
- [ ] En la primera revisión, registrar URLs indexadas/excluidas y motivo; impresiones, clics y consultas de marca/locales. “Sin datos” no significa cero visitas.
- [ ] En Perfil de Empresa, registrar las métricas que Google ofrezca para esa cuenta: vistas, clics web, llamadas o indicaciones. No inventar conversiones que la herramienta no mida.
- [ ] Revisar manualmente aproximadamente a los 7, 14 y 28 días desde el alta, si hay datos. Son hitos orientativos, no una automatización ni promesa de indexación.
- [ ] Medir PageSpeed móvil y Core Web Vitals cuando exista muestra; distinguir laboratorio y datos de usuarios. No declarar rendimiento actual por la medición histórica del rediseño.
- [ ] Corregir errores concretos: bloqueo/noindex accidental, canónica equivocada, ficha duplicada, datos contradictorios, enlaces rotos o contenido insuficiente. Cambios de código requieren el ciclo de prueba/revisión y conservan funcionalidad.
- [ ] Actualizar el seguimiento con cambio, hipótesis y comparación de periodos equivalentes. Evitar atribuir una variación a SEO si cambió el periodo, campañas o catálogo.

## 5. Focos de revisión y evidencias

| Riesgo                                                                               | Comprobación propietaria                                                                     |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Verificar en DNS de un proveedor distinto o sobreescribir registros existentes       | T1: NS activos, registro añadido y mensaje de propiedad verificada; web y correo conservados |
| Ficha duplicada o cuenta que no quedará en el negocio                                | T2: búsqueda/reclamación, cuenta confirmada y estado real de verificación                    |
| Precio nulo/varias presentaciones convertidos en una oferta o marca/stock inventados | T3b: casos negativos de unidad, precio visible y schema cotejados, elegibilidad por ficha    |
| Copia confirmada no coincide con lo visible o no se actualiza al publicarla          | T4: lectura posterior, texto y JSON-LD iguales por la invalidación existente                 |
| Grupo de bot que abre privadas o falsa aprobación por User-Agent simulado            | T5: robots/noindex protegidos, separación de acceso e indexación e IP no certificada         |

La condición DNS se comprueba con operaciones públicas y estado del servicio, no mediante una prueba unitaria de valores fijos. Para código SEO se prueban comportamiento y casos negativos significativos; no duplicar tests para simples cambios de copy.

## 6. Registro de ejecución

| Fecha      | Etapa    | Acción y comprobación                                                                                                      | Estado real                                                                                                | Próximo paso                                                 |
| ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 12/10/2026 | Base     | Auditoría de 44 URLs/robots/sitemap/OG y NS públicos                                                                       | Base técnica comprobada; altas no realizadas                                                               | T1, cuenta del negocio                                       |
| 12/10/2026 | Decisión | Dan confirma cuenta del negocio y guía en el orden propuesto                                                               | Plan preparado; migración pausada                                                                          | Abrir Search Console y obtener TXT                           |
| 12/10/2026 | T1       | Dan verifica la propiedad mediante TXT en Hostinger y realiza cuatro solicitudes de indexación                             | Propiedad verificada; indexación no confirmada                                                             | Comprobar procesamiento del sitemap en Search Console        |
| 12/10/2026 | T1       | Sitemap enviado; un reenvío conserva error; prueba en vivo de Google disponible                                            | Lectura del sitemap pendiente, sin causa exacta acreditada                                                 | Mantener seguimiento sin repetir envíos                      |
| 12/10/2026 | T2       | Ficha existente; reclamar solicita verificación, teléfono inaccesible, video disponible                                    | Dan aplaza Maps; ficha sin verificar                                                                       | Retomar cuando Dan lo indique                                |
| 13/10/2026 | T3       | Dan fusiona PR #96 y #97; main `40f2a8b`; revisión pública de 44 URLs                                                      | Título local, Bakery y 32 ofertas reales desplegados; dos fichas múltiples descriptivas                    | T4, publicación del lote aprobado                            |
| 13/10/2026 | T4       | Dan confirma elaboración propia y textura suave/esponjosa de los cinco productos; aprueba los textos                       | Textos aprobados antes de su publicación                                                                   | Publicación y comprobación registradas en la siguiente fila  |
| 13/10/2026 | T4       | Cinco descripciones guardadas por el panel; texto visible, meta/OG y Product comparados con los aprobados                  | Lote inicial publicado; precios, imágenes, categorías y ofertas conservados; 29 fichas registradas         | T5: verificar Bing con la cuenta del negocio                 |
| 13/10/2026 | T1       | Dan aporta captura de Search Console: sitemap Correcto, 44 páginas descubiertas                                            | Lectura confirmada; no equivale a 44 páginas indexadas                                                     | Seguimiento de cobertura                                     |
| 13/10/2026 | Revisión | Captura de Google muestra portada y contacto; favicon antiguo rectangular. Dan confirma que probó ChatGPT sin búsqueda web | Dos resultados visibles; acceso HTTP de bots simulado permitido, sin garantía de descubrimiento en ChatGPT | Corregir favicon antes de Bing                               |
| 13/10/2026 | Favicon  | PNG 96 × 96 del logo aprobado publicado mediante el panel; HTTP 200, bytes idénticos y Bakery/canónica conservados         | Favicon corregido en producción; caché de Google no comprobada                                             | Fusionar reserva local y Apple; comprobar tras nuevo rastreo |

Se añadirán filas al completar acciones, manteniendo los intentos fallidos y sus motivos. No marcar la primera línea como indexación confirmada. Nunca subir secretos o datos de recuperación como evidencia.

Evidencia del despliegue: `Evidencias SEO/despliegue-tecnico-2026-10-13.json`.
Evidencia del lote: `Evidencias SEO/contenido-publicado-2026-10-13.json`.
El lote inicial de T4 está publicado y comprobado; el catálogo restante y la coherencia
con Maps permanecen pendientes. Se puede avanzar a T5 sin dar por completados esos puntos.

## 7. Fuentes oficiales consultadas el 12/10/2026

- [Google: verificación de propiedad](https://support.google.com/webmasters/answer/9008080?hl=es).
- [Hostinger: TXT](https://www.hostinger.com/support/1583664-how-to-manage-txt-records-at-hostinger/) y [editor DNS](https://www.hostinger.com/support/how-to-use-hostingers-dns-zone-editor/). Nombres de menús sujetos a la pantalla actual; confirmar proveedor antes de operar.
- [Google: negocio local](https://support.google.com/business/answer/7091?hl=es) y [datos LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business).
- [Google: resultados de producto](https://developers.google.com/search/docs/appearance/structured-data/product-snippet), incluida restricción de AggregateOffer para variantes.
- [Google: solicitud de rastreo](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=es), sin garantía de inclusión ni posición.
- [Google: AI features](https://developers.google.com/search/docs/appearance/ai-features) y [OpenAI: Crawlers](https://developers.openai.com/api/docs/bots).
- [Bing: añadir/verificar](https://www2.bing.com/webmasters/help/add-and-verify-site-12184f8b).
- [Vercel: Hobby](https://vercel.com/docs/plans/hobby).
- Guías locales Next 16.3.4 leídas: `node_modules/next/dist/docs/01-app/02-guides/json-ld.md` y `01-app/03-api-reference/04-functions/generate-metadata.md`.
