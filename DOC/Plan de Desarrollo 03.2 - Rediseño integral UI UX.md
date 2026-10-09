# Plan de Desarrollo 03.2 — Rediseño integral UI/UX

> **Para agentes:** usar `superpowers:executing-plans` para ejecutar por tareas. Se conserva el método del proyecto: implementación por el agente principal y revisión independiente de la rama antes de cada PR. Este documento no autoriza fusionar ni desplegar.

**Objetivo:** trasladar la maqueta A aprobada al login, panel y sitio público, conservando íntegramente las funcionalidades actuales.

**Arquitectura:** evolucionar los tokens semánticos, componentes y plantillas existentes. Reutilizar las consultas, acciones, validaciones y controles actuales; no reconstruir la aplicación desde las capturas. Los cambios globales de paleta alcanzarán todas las superficies desde la primera entrega; la composición de cada pantalla se completará en las entregas siguientes.

**Tecnologías:** Next.js 16.3.4, React 19.2.8, TypeScript 5.9.3, Tailwind CSS 4.3.3, Radix/shadcn, Lucide, Vitest y Playwright con axe. Node >=24, pnpm 12.3.4. Sin nuevas dependencias ni biblioteca de animación.

**Especificación:** `DOC/Analisis UI UX - Rediseno integral.md`, en especial §§10 y 12; decisiones finales de `AGENTS.md`; `DOC/Maquetas/comparacion-redisenio/LEEME.md` y capturas A de esa carpeta. Ante contradicciones con bocetos anteriores, prevalecen los ajustes aprobados hasta la revisión a6 del 07/10/2026.

**Estado:** bloques1/2 fusionados por Dan en PR90/91; dashboard y portada T4.1/T5 en PR92; páginas públicas y movimiento T6 en PR93, main `ea4ee37`. T7 implementada y verificada localmente desde esa base en `feat/cierre-rediseno-ui-ux`, checkout aislado `PIMPOS_REDISENO_BLOQUE1`, con las ampliaciones de PDF, novedades y SEO de Dan. Revisión independiente concluida e I1 corregido. [PR #94](https://github.com/dNogueira300/PIMPOS_SYSTEM/pull/94) borrador abierto para su revisión; resultados y límites en `DOC/Verificacion rediseño 03.2.md`. No se declara fusión ni cierre productivo.

## Restricciones globales

- **No se cambia ninguna funcionalidad.** Conservar rutas, parámetros URL, enlaces, acciones, campos, validaciones, permisos, consultas, cálculos, borradores, estados, descargas, sesión y auditoría.
- No añadir carrito, pagos, búsqueda global, acciones masivas, nuevos gráficos, notificaciones ni otro modelo de navegación.
- No cambiar esquema, migraciones, RLS, APIs, contratos de exportación ni datos del negocio. Las descargas conservan también su contenido y estructura.
- UI y mensajes en español. No sustituir datos dinámicos por textos o fotos de la maqueta. No importar su reloj congelado, usuarios temporales ni interceptores de imágenes.
- Logo derivado exclusivamente de `DOC/Fotos y documentos Adjuntados Pimpos/Diseño/logo.png`, original intacto. Conservar la capacidad existente de administrar la marca.
- Sin azul en estilos de interfaz: incluye selección, foco, hover, enlaces, gráficos, mensajes y diálogos. No recolorear fotografías reales ni cartografía ajena.
- Accesibilidad AA, teclado, foco visible, objetivos táctiles de 44 px, zoom al 200 %, movimiento reducido e impresión. Comprobar 375, 390, 768, 1024 y 1440 px.
- Primero login y estructura del panel; después sus módulos; finalmente sitio público y cierre transversal.
- No hacer cambios productivos de configuración durante las pruebas. Usuarios de prueba solo locales; eliminarlos al terminar y conservar la auditoría local.
- No mezclar con lo pendiente de F7: capacitación, manual, informe final y traspaso de credenciales.

## Focos de revisión

| Riesgo                                                                                   | Resultado esperado                                                                                                            | Tarea y comprobación                                                        |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Cambiar el logo desde Configuración o tener su ruta vacía                                | Todas las superficies muestran el logo configurado o el original optimizado de reserva, sin perder la administración de marca | T1; ampliar `e2e/panel-configuracion.spec.ts` y `e2e/autenticacion.spec.ts` |
| Abrir un diálogo montado fuera del contenedor del panel, enfocar o seleccionar controles | Paleta A también en portales, avisos y todos los estados; no reaparece azul                                                   | T2; `e2e/panel-accesibilidad.spec.ts`, revisión de estilos computados       |
| Formulario largo, teclado móvil, primera pestaña con error o borrador recuperado         | Guardar/cancelar y errores accesibles; mismos valores, foco y acción enviada                                                  | T2–T4; suites de edición, movimientos y registro de clientes                |
| Portada sin slides, con textos largos o con movimiento reducido                          | Mantiene condiciones de aparición, lectura, navegación, pausas y WhatsApp                                                     | T5; `portada`, `portada-movil`, `movimiento`, `abierto-ahora`               |
| Rol limitado y páginas de detalle que no aparecieron en las maquetas                     | Mismas autorizaciones y acciones; texto, tablas, mapa y auditoría siguen utilizables                                          | T3–T4 y T7; suites por rol, detalle de clientes, kárdex e historial         |

## Contrato visual aprobado

| Uso                                        | Valor o decisión                                                                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fondo / tinta / texto secundario           | `#F7F5F0` / `#28251F` / `#59554E`                                                                                                                                  |
| Fondo secundario / borde / borde de campos | `#EEEAE2` / `#D9D4CA` / `#837B70`                                                                                                                                  |
| Acción principal / hover / texto           | `#953E2C` / `#773020` / blanco                                                                                                                                     |
| Tipografía                                 | Plus Jakarta Sans local, también en títulos; conservar cifras legibles                                                                                             |
| Radios                                     | 5–6 px en controles y superficies, según A; el círculo del logo es una excepción explícita                                                                         |
| Logo del login                             | Contenedor claro circular, igual ancho y alto; 160 px móvil, hasta 350 px escritorio; imagen completa con `object-contain`                                         |
| Panel                                      | Lateral claro, selección terracota; títulos sans, jerarquía y densidad de A; mismas secciones y barra inferior/Más                                                 |
| Carrusel de escritorio                     | Foto sin velo blanco; texto sobre región terracota separada; referencia 44/56 % y 520 px de alto a 1440 px, adaptable al contenido                                 |
| Portada móvil                              | Foto 16:9 y texto sobre terracota; ninguna altura fija recorta contenido                                                                                           |
| WhatsApp sobre la portada móvil            | Fondo `#E7F2DF`, texto/icono `#234735`, hover `#D3E8C5`, foco blanco separado 4 px                                                                                 |
| Abierto ahora en esa portada               | Punto `#B9E39F`, 10 px; conservar cálculo y texto de estado                                                                                                        |
| Sección de madrugada                       | Quitar la ilustración del horno de la portada; conservar hora dinámica y descripción, composición compacta con bordes discretos                                    |
| Tapiz público                              | SVG aprobado, trazo `#95664B` a opacidad **0.11**, mosaico 680×600, tamaño móvil 510×450; solo fondos del contenido público                                        |
| Movimiento                                 | Colores/foco 120–160 ms y diálogos existentes 160–220 ms como límites de trabajo; validar en contexto, sin retrasar acciones ni cambiar temporización del carrusel |

El tapiz no se coloca en login, panel, cabecera, fotos ni bloques sólidos de llamada a la acción. No se aplica opacidad a un padre que contenga texto. No se cambia el SVG ni su intensidad para reinterpretar la dirección ya aprobada.

## Organización y revisión de entregas

| Entrega | Tareas    | Resultado verificable                                                           |
| ------- | --------- | ------------------------------------------------------------------------------- |
| PR 1    | T1 + T2   | Identidad, login y estructura del panel, con controles compartidos coherentes   |
| PR 2    | T3 + T4   | Módulos completos del panel, incluyendo detalles, formularios y permisos        |
| PR 3    | T4.1 + T5 | Inicio del panel como dashboard y estructura pública/portada con tapiz aprobado |
| PR 4    | T6        | Catálogo, detalles y páginas públicas restantes                                 |
| PR 5    | T7        | Regresión final, comparación visual, accesibilidad y rendimiento                |

Máximo dos tareas sin migración por PR. Cada tarea tiene su propia comprobación; cada PR, revisión independiente. Arreglar hallazgos importantes y parar al abrir el PR hasta la revisión/fusión de Dan. No preparar la siguiente entrega dejando archivos sin commit en la rama anterior. Commits convencionales en español, sin atribución de IA. No abrir un PR vacío solo para cumplir la tabla: la entrega de cierre incorpora evidencias, documentación y correcciones que resulten necesarias.

Antes de implementar, conservar todos los archivos de análisis/maquetas pendientes de versionado. No borrarlos, restablecerlos ni mezclarlos accidentalmente con otra tarea. Leer `AGENTS.md`, `DOC/Avance del proyecto.md` y los documentos locales de Next pertinentes. Usar una rama de trabajo conforme al proceso del repositorio.

## T1 — Identidad compartida y acceso

**Archivos:** modificar `src/estilos/globals.css`, `src/estilos/fuentes.ts`, `src/estilos/paleta.test.ts`, `src/app/(auth)/ingresar/page.tsx`, `src/app/(auth)/cambiar-clave/page.tsx` y sus `formulario.tsx`; crear `src/components/marca/logo-marca.tsx`; incorporar derivados bajo `public/marca/`. Actualizar `docs/marca.md` y `PRODUCT.md` con la implementación efectiva.

**Interfaz nueva:** componente de presentación sin consulta propia; el servidor obtiene la configuración mediante `obtenerConfiguracion()` y resuelve su ruta con `urlDeImagen("marca", config.logo_url)`. Así se comparte la fuente sin añadir un cliente de Supabase al navegador.

```tsx
type LogoMarcaProps = {
  src: string;
  alt: string;
  className?: string;
};
// Exportar LogoMarca(props: LogoMarcaProps); renderiza la imagen completa.
// Las proporciones y el contenedor circular pertenecen al lugar que lo usa.
```

- [x] Registrar commit base, ruta de evidencia y estado de Git. Capturar login/base del panel con los mismos tamaños y datos de A; no dar los PNG exploratorios por evidencia del build que se implementará.
- [x] Reutilizar los WebP 256/512/768 ya optimizados, verificando el manifiesto y transparencia. El archivo de reserva `public/marca/logo.webp` debe contener el derivado de 768 px para conservar la ruta existente. Añadir versiones menores para usos pequeños; no guardar de nuevo el PNG original en el bundle.
- [x] Conservar la resolución de `config.logo_url`; con valor vacío usar `/marca/logo.webp`. Si el entorno objetivo tiene otro logo almacenado, registrar ese dato y programar su sustitución mediante Configuración al publicar, usando el derivado aprobado. No ignorar permanentemente una carga posterior ni modificar la base para hacer pasar una captura.
- [x] Reemplazar primitivos y mapeos semánticos de colores en `globals.css`; todos los portales heredan del mismo `:root`. Mantener los nombres semánticos consumidos por componentes. Sustituir consumidores explícitos de azul por el token de su función; no cambiar únicamente el valor de un token llamado azul y dejar ese nombre engañoso.

```css
:root {
  --pimpos-accion-800: #953e2c;
  --pimpos-accion-900: #773020;
  --primary: var(--pimpos-accion-800);
  --primary-hover: var(--pimpos-accion-900);
  --primary-foreground: #ffffff;
  --ring: var(--pimpos-accion-800);
}
```

- [x] Usar Jakarta para ambos roles tipográficos. Revisar importaciones de `playfair` antes de retirar su exportación; conservar archivos/licencias que sigan teniendo consumidores. No modificar metadatos, URLs canónicas ni generación de imágenes sociales de forma incidental.
- [x] Implementar el login de A y su círculo; aplicar la misma identidad a cambiar clave. Mantener `Suspense`, `volver`, mensajes de sesión, campos, autocomplete y envío existentes. Ejemplo del contenedor, separado del formulario:

```tsx
<div className="mx-auto grid size-40 shrink-0 place-items-center rounded-full bg-white p-4 md:size-[min(24vw,350px)] md:p-8">
  <LogoMarca src={src} alt={alt} className="h-full w-full object-contain" />
</div>
```

- [x] Actualizar `paleta.test.ts` para medir pares reales de A con su helper `contraste`, incluidos campo/fondo y foco; quitar expectativas de la estética sustituida, sin reducir AA. Ejemplo de aserción adicional dentro del test que ya lee los primitivos:

```ts
expect(contraste("#FFFFFF", "#953E2C")).toBeGreaterThanOrEqual(4.5);
expect(contraste("#234735", "#E7F2DF")).toBeGreaterThanOrEqual(4.5);
```

- [ ] Parcial (panel/login verificados; cabecera pública en T5): ampliar `e2e/autenticacion.spec.ts`: el logo se decodifica y su contenedor tiene ancho/alto iguales a 390 y 1440; probar login inválido, retorno y cambio obligatorio con las pruebas ya presentes. En `panel-configuracion.spec.ts`, extender el caso de marca: subir una imagen temporal local, comprobar cabecera/login/panel y restaurarla al terminar. Esta última comprobación se completa con T2/T5.
- [x] Ejecutar `pnpm exec vitest run src/estilos/paleta.test.ts` y E2E `autenticacion.spec.ts panel-sesiones.spec.ts panel-inactividad.spec.ts`. Resultado esperado: éxito sin pérdida de retornos, cierre por inactividad ni cambio obligatorio. Registrar resultados y capturas; commit de T1.

## T2 — Estructura del panel y controles compartidos

**Archivos:** `src/app/(admin)/admin/layout.tsx`, `src/components/panel/{cascara-panel,barra-lateral,barra-inferior,encabezado-panel,formulario-panel,campo,pestanas-formulario,barra-guardar,lista-adaptable,etiqueta-estado}.tsx`; `src/components/ui/{button,input,textarea,tabs,sheet,alert-dialog,sonner}.tsx`. Modificar únicamente los que necesiten ajuste además de los tokens.

**Interfaces:** ampliar las props actuales de `CascaraPanel` con `logoSrc: string` y `logoAlt: string`, obtenidas en el layout de servidor; pasarlas a lateral/cabecera móvil. Mantener `rol`, `nombre`, `children` y la salida de `seccionesPara(rol)`. No cambiar interfaces de formularios, callbacks ni estados de carga.

- [x] Completar la evidencia visual pendiente de controles: input con error/deshabilitado, pestaña con error, diálogo abierto, aviso, tabla/lista vacía y guardado pendiente. Aplicar A a esos estados sin inventar acciones.
- [x] Integrar el logo en lateral y cabecera móvil y ajustar espaciado/jerarquía de A. Conservar `main#contenido`, nombres accesibles de navegación, enlaces por rol, Más, cierre de sesión y espacio inferior de seguridad.
- [x] Ajustar controles con clases semánticas; ejemplo de estados que deben quedar expresos en el botón, conservando variantes, `asChild` y tipos actuales:

```tsx
// Fragmento de clases de la variante principal existente:
"bg-primary text-primary-foreground hover:bg-[var(--primary-hover)] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
```

- [x] Revisar los portales Radix y Sonner abiertos, campos nativos, autofill y selección: conservar color semántico de peligro/éxito; los mensajes informativos usan neutro o terracota. No ocultar outline sin foco equivalente.
- [x] Ampliar `e2e/panel-cascara.spec.ts` usando los helpers actuales; la siguiente aserción protege el tamaño intermedio que no cubría la maqueta:

```ts
test("la navegación del panel cabe a 768 px", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  const usuario = await entrarComo(page, "administrador");
  try {
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.locator("main#contenido")).toBeVisible();
  } finally {
    await borrarUsuario(usuario.id);
  }
});
```

- [ ] Parcial (E2E y revisión independiente aprobados; PR #90 fusionado y login Vercel revisado; pendiente evidencia de teclado móvil físico y zoom nativo): ejecutar E2E `panel-cascara.spec.ts panel-accesibilidad.spec.ts panel-editar.spec.ts panel-busqueda.spec.ts`, un trabajador. Comprobar manualmente teclado móvil y zoom 200 % en un formulario largo, sin barra de guardado superpuesta al error. Commit de T2, revisión independiente y PR 1.

## T3 — Contenido, configuración, usuarios e historial

**Archivos:** páginas y formularios dentro de `src/app/(admin)/admin/contenido/`, `configuracion/`, `usuarios/`, `auditoria/` y `src/app/(admin)/admin/page.tsx`; componentes `vista-marca`, `subida-imagen`, `fotos-producto`, `editor-presentaciones`, `editor-horario`, `botones-orden`, `pestanas-historial`, `filtros-historial`, `lista-de-cambios`, `enlace-historial` en `src/components/panel/`.

**Interfaces:** consumir T1/T2; conservar props, modelos, nombres de campos y funciones servidor existentes. No editar `acciones.ts` ni `src/lib/auditoria/` para conseguir una presentación.

- [x] Inventariar todas las páginas de estas carpetas y registrar lista/alta/edición/detalle por entidad en la evidencia del PR. Cubrir categorías, productos, novedades, portada, galería, preguntas, guías y testimonios; también usuarios y configuración. Inventario conjunto de 58 páginas en `DOC/Maquetas/3.2/bloque2/INVENTARIO.md`.
- [x] Completar composiciones de detalle del historial, registro extenso de cambios, presentación de producto con varias unidades y formulario con validaciones en otra pestaña; tomar los datos de los fixtures existentes.
- [x] Aplicar A a cabeceras, grupos de campos, listas y detalles. Cambios de clases típicos, sin alterar el elemento ni su acción:

```tsx
// Titular de una página del panel:
className = "text-foreground text-[1.6875rem] leading-tight font-semibold md:text-[2rem]";
// Acción secundaria que ya existe:
className = "border-border text-foreground hover:bg-muted focus-visible:ring-ring";
```

- [x] Revisar especialmente los botones azules reportados: Historial, Configuración y Nuevo producto; extender a hover, foco, pestañas, filtros y diálogos. Conservar diferencias entre aprobar, devolver, borrar y guardar.
- [x] Ejecutar E2E `panel-contenido`, `panel-categorias`, `panel-productos`, `panel-novedades`, `panel-configuracion`, `panel-usuarios`, `panel-historial`, `panel-accesibilidad` (archivos `.spec.ts`), en tandas. No debilitar casos por rol, publicación, imágenes o descargas para acomodar el nuevo DOM.
- [x] Comparar capturas A de inicio/historial/configuración/producto-nuevo y añadir detalles/vacíos/errores. Commit de T3.

## T4 — Insumos, reportes y clientes

**Archivos:** páginas y formularios dentro de `src/app/(admin)/admin/insumos/` y `clientes/`; componentes `editor-lineas`, `editor-equivalencias`, `etiqueta-insumo`, `anular-movimiento`, `resolver-baja`, `selector-periodo`, `tabla-reporte`, `grafico-barras`, `selector-ubicacion`, `mapa-clientes`, `fotos-cliente`, `botones-contacto`, `boton-activo-cliente`, `borrar-datos-cliente`, `confirmar-borrado` en `src/components/panel/`.

**Interfaces:** mismos formularios, consultas y callbacks. Las series del gráfico conservan valores/etiquetas; solo cambian colores con contraste y leyenda inequívoca. No tocar FEFO, redondeos, lotes, cálculos, coordenadas, consentimiento, URLs firmadas ni exportadores.

- [x] Capturar y aplicar A a catálogo de insumos, ficha/kárdex, alta/edición, ingreso, consumo, conteo, bajas/aprobación, proveedores y cada reporte existente. Revisar varias líneas de movimiento y errores por cantidad.
- [x] Capturar y aplicar A a lista/mapa de clientes, alta, ficha, edición, corrección por repartidor, zonas y Para revisar. Conservar selector de ubicación, carga de fotos, advertencias de duplicados y permiso obligatorio.
- [x] Mantener tablas semánticas o la lista adaptable existente. Para desbordamiento de una tabla ancha, usar su contenedor local y conservar encabezados; no producir scroll horizontal de toda la página:

```tsx
<div className="max-w-full overflow-x-auto">
  {/* Conservar aquí la tabla existente, con su caption y encabezados. */}
</div>
```

- [x] Probar que el repartidor conserva exactamente sus campos de corrección y el administrador sus acciones; guardar, volver a abrir y comparar datos en las suites existentes. Verificar menú Más y todas las pestañas, no solo la primera del prototipo.
- [x] Ejecutar E2E `panel-insumos`, `panel-kardex`, `panel-movimientos`, `panel-bajas`, `panel-reportes`, `panel-exportar`, `insumos-concurrencia`, `panel-clientes`, `panel-clientes-registro`, `panel-clientes-administracion`, `panel-clientes-exportar`, `panel-accesibilidad` (archivos `.spec.ts`), por tandas de un trabajador.
- [ ] Comparar A de insumos/ingreso/cliente-nuevo y añadir mapa/ficha, diálogo de borrado, reporte y estados de error. Revisar manualmente teclado móvil al final del formulario. Commit de T4, revisión independiente y PR 2.

**Resultado local de T4:** 91 capturas sin incidencias; suites requeridas aprobadas. Revisión independiente sin Critical/Important, con M1 de corte de unidades a 768 px diferido a T7. La casilla final conserva pendiente el teclado móvil físico, el zoom nativo y la apertura/revisión del PR; ver `DOC/Verificacion rediseño 03.2 - Bloque 2.md`.

## T4.1 — Inicio administrativo como dashboard

**Solicitud de Dan, 08/10/2026, después de fusionar PR #91:** mejorar la composición del inicio del panel y hacerlo tipo dashboard dentro de la próxima entrega. Se conserva la identidad A y toda funcionalidad. La modificación de alcance divide el sitio público entre PR 3 y PR 4 para respetar el máximo de dos tareas por PR; el cierre pasa a PR 5.

**Archivos:** `src/app/(admin)/admin/page.tsx`; componente de presentación local de inicio si facilita la composición. No modificar `contarAvisos`, `ultimosCambios`, `resolverNombres`, `seccionesPara`, autenticación ni consultas para conseguir el diseño. No cambiar el aspecto de todas las listas de historial por una corrección exclusiva del inicio.

**Interfaces:** mismos `avisos`, `secciones`, `recientes`, `nombres`, sesión y `motivo`; mismos enlaces, parámetros, orden de avisos y límites de cinco cambios. Conservar `data-aviso`, `data-seccion`, `data-actividad-reciente`, `data-cambio`, nombres accesibles y condiciones por rol. Si se destacan las cantidades de los avisos, usar el texto existente sin añadir cuentas o cambiar su significado; si no admite separación segura, mostrarlo íntegro.

**Diseño propuesto:** «Para revisar» con cantidades destacadas y tarjetas enlazadas; «Tus secciones» con iconos existentes y ayudas de lectura; actividad reciente en una columna contigua en escritorio. En móvil, apilar avisos, secciones y actividad, con espacios de seguridad para la barra inferior. Radios de 6 px, Jakarta, crema y terracota; sin tapiz en el panel. La maqueta usa el mismo estado local del inicio administrativo capturado en el bloque 2, no datos inventados de ventas, producción o rendimiento.

- [x] Revisar con Dan la maqueta comparable `DOC/Maquetas/3.2/dashboard-inicio/index.html` antes de implementar la nueva composición. Aprobada expresamente con «perfecto, dale palante» el 08/10/2026.
- [x] Conservar capturas de la base `429a25d`; comprobar avisos presentes/ausentes, historial presente/ausente, `motivo=sin-acceso` y roles administrador, ingeniero y repartidor. No mostrar secciones ni actividad restringidas para llenar espacios del dashboard.
- [x] Aplicar el diseño a la presentación. Mantener el encabezado «Inicio», todos los destinos y textos de aviso, la actividad dinámica y «Ver todo el historial» bajo las mismas condiciones. No añadir métricas, gráficos, filtros, acciones ni consultas.
- [x] Ejecutar `panel-cascara.spec.ts`, `panel-historial.spec.ts`, `panel-accesibilidad.spec.ts` y las pruebas de avisos de `panel-insumos.spec.ts`, `panel-bajas.spec.ts`, `panel-novedades.spec.ts` y `panel-clientes-administracion.spec.ts` con un trabajador. Usar los casos existentes por rol; añadir una comprobación únicamente si queda un riesgo observable sin cobertura.
- [x] Capturar el build a 375/390/768/1024/1440, revisar contraste, teclado/foco, enlaces, texto largo, zoom y ausencia de azul/desbordamientos. Mantener pendiente explícito cualquier control físico no realizado. Typecheck/lint y commit propio de T4.1; revisión independiente conjunta con T5 antes de PR 3.

**Resultado local:** suites administrativas 233 aprobadas y 25 saltos previstos; públicas y Configuración final 120 aprobadas y 18 saltos previstos. Las comprobaciones locales y capturas se registran en la evidencia del bloque 3. Teclado móvil físico, zoom nativo y Vercel quedan pendientes explícitos; la revisión/fusión corresponde a Dan.

**Fuera del alcance:** ventas, ingresos, totales de clientes/productos, tendencias o gráficos nuevos; acciones directas nuevas de alta/registro; cambios de permisos o resumen de auditoría distinto del existente.

## T5 — Estructura pública y portada

**Archivos:** `src/components/publico/{cascara-publica,cabecera,pie,carrusel-portada,portada-movil,estado-ahora,barra-aviso,boton-whatsapp,enlace-whatsapp}.tsx`, `src/app/(public)/page.tsx`, `src/estilos/globals.css`; crear `public/marca/tapiz-panaderia.svg` copiando el aprobado.

**Interfaces:** mantener las props existentes del carrusel, estado y WhatsApp. Ampliar `Cabecera` con `logoSrc: string` procedente de `config.logo_url`; `Pie` ya recibe `config`. Usar `LogoMarca` de T1. No cambiar filtros de datos ni condiciones de aparición de secciones.

- [x] Aplicar la cabecera/pie de A y completar la prueba de actualización del logo de T1 en las tres superficies. Conservar menú móvil, enlaces, horarios/redes condicionales y margen del botón flotante.
- [x] Sustituir velo blanco y superposición de texto por la composición aprobada, preservando DOM interactivo del carrusel, temporización de 6 s, botones, pausas y reduced motion. No reemplazar el carrusel por una imagen fija en escritorio.
- [x] Aplicar el contraste aprobado al botón y al punto abierto solo en la portada móvil; conservar cálculo del horario, estado cerrado y URL/mensaje de WhatsApp.
- [x] Eliminar la ilustración de madrugada en `/` conservando `#titulo-madrugada`, hora calculada y descripción. No borrar el archivo de imagen si sigue usándose en el vacío de novedades; ese uso no fue objeto de la retirada aprobada.
- [x] Incorporar tapiz como fondo decorativo del contenido público, manteniendo opacos los bloques sólidos. Ejemplo de clase dedicada; la opacidad vive en el SVG:

```css
.tapiz-publico {
  background-image: url("/marca/tapiz-panaderia.svg");
  background-size: 680px 600px;
}
@media (width < 640px) {
  .tapiz-publico {
    background-size: 510px 450px;
  }
}
```

- [x] Sustituir únicamente el antiguo test del horno en `e2e/marca.spec.ts` por la decisión aprobada; mantener los tests de hora y años dinámicos:

```ts
test("la madrugada conserva su texto sin la ilustración retirada", async ({ page }) => {
  await abrirPortada(page);
  await expect(page.locator("#titulo-madrugada")).toBeVisible();
  await expect(page.locator('img[src*="horno-amanecer"]')).toHaveCount(0);
});
```

- [x] Ejecutar E2E `portada`, `portada-movil`, `marca`, `cabecera`, `abierto-ahora`, `flotante`, `movimiento`, `tactil`, `accesibilidad` (archivos `.spec.ts`). Extender casos existentes de slides vacíos y contenido largo si no cubren la composición nueva; no fijar el reloj de la aplicación.
- [x] Capturar página completa y viewport de madrugada a 390/1440, comparar con a6 y revisar 375/768/1024. El patrón no desaparece por fondos opacos accidentales ni compite con texto. Commit de T5.

## T6 — Catálogo, detalles y páginas públicas restantes

**Archivos:** páginas dentro de `src/app/(public)/productos/`, `novedades/`, `nosotros/`, `galeria/`, `ubicacion/`, `preguntas-frecuentes/`, `contacto/`; componentes públicos `tarjeta-producto`, `filtro-categorias`, `pizarra-precios`, `arma-tu-pedido`, `condiciones-pedido`, `encabezado-seccion`, `titulo-seccion`, `pagina-no-encontrada`, `mapa`; plantillas `error.tsx`, `loading.tsx` y `not-found.tsx` existentes bajo `src/app/`.

**Interfaces:** mismas props, búsqueda/categoría en URL, slugs, precios, unidades, presentaciones y mensajes de pedido. No editar funciones de consulta, saneamiento ni validaciones para el rediseño.

- [x] Completar la composición de detalle de producto con varias presentaciones, precios largos, sin foto y sin disponibilidad; seguir jerarquía y tarjetas de A, sin crear opciones de compra nuevas. Disponibilidad: conservar condiciones existentes; no hay campo de stock público.
- [x] Aplicar los estilos semánticos a las páginas restantes. Ejemplo de contenedor adaptable para el contenido existente:

```tsx
className = "mx-auto w-full max-w-(--container-contenido) px-4 py-10 sm:px-6 md:py-14";
```

- [x] Mantener mapa, contacto, guías, preguntas, testimonios y novedades condicionales. Dar el mismo tratamiento tipográfico a vacíos, error, carga y 404; preservar mensajes, enlaces de recuperación y límites de error.
- [x] Revisar que cabecera/pie/tapiz cubran la página entera sin uniones de estilos anteriores. Confirmar que imágenes mantienen proporciones, foco de recorte configurable y carga optimizada. Conservar títulos, descripciones, canónicas, sitemap y datos estructurados.
- [x] Ejecutar E2E `presentaciones`, `pedido`, `pizarra`, `presupuesto`, `secciones`, `testimonios`, `mapa`, `errores`, `seo`, `accesibilidad` (archivos `.spec.ts`). Mantener comprobaciones de precio, mensaje WhatsApp y query params.
- [ ] Comparar catálogo contra A y capturar detalle/estados a 390/1440; revisar tamaños intermedios y zoom. Commit de T6, revisión independiente y PR 4.

## T7 — Cierre y evidencia del sistema completo

**Ampliaciones de Dan, 09/10/2026, después de fusionar PR #93:** actualizar el estilo de
todos los PDF descargables e incluir el logo aprobado en cada página, conservando contenido,
cálculos, permisos y registro. La prohibición previa de tocar exportadores no limita este
ajuste explícito de presentación; Excel conserva su contrato. Hacer más visuales las novedades
del inicio mostrando la imagen completa, renovar la tarjeta OpenGraph para WhatsApp/redes con A
y optimizar SEO técnico para buscadores e IAs. Añadir canónicas y descripción estructurada con
datos existentes, sin modificar consultas ni inventar stock, valoraciones o afirmaciones comerciales.
No se garantiza una posición ni indexación; se verifica lo que el sitio publica a los rastreadores.

**Archivos:** crear `DOC/Verificacion rediseño 03.2.md` y `DOC/Maquetas/3.2/`; actualizar `AGENTS.md`, `PRODUCT.md`, `docs/marca.md`, `DOC/Avance del proyecto.md` y este plan. Correcciones en los componentes que fallen, con prueba funcional si hubo una regresión.

- [x] Enumerar todas las rutas desde las páginas actuales, no desde las diez maquetas. Registrar ruta, rol, tamaño, estado observado, captura y resultado. Cobertura obligatoria: público completo; login/cambiar clave; inicio; todos los CRUD de contenido; insumos y sus movimientos/reportes/proveedores; clientes/zonas/corrección/revisión; usuarios; configuración; auditoría principal, detalle, ingresos, descargas y borrados.
- [x] Revisar pantallas completas contra A a 390/1440; controles y desbordamiento a 375/768/1024. Incluir diálogos, menú Más, vacío, error, espera y deshabilitado. Registrar diferencias justificadas por contenido real, nunca atribuirlas a una aprobación inexistente.
- [x] Buscar residuos de paleta anterior y comprobar los estilos calculados de controles visibles, hover, focus y pseudoelementos. Ejemplo de inventario estático auxiliar, que no sustituye la inspección visual:

```powershell
rg -n 'blue-|sky-|cyan-|pimpos-azul|#12306[eE]|#0060[aA]8' src
```

- [x] Ejecutar `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` y `pnpm build`. Correr la suite E2E completa, dividida por archivos contra **el mismo build**, `--workers=1`; conciliar el listado de `pnpm exec playwright test --list` con todos los archivos ejecutados. Registrar totales, saltos explicados y fallos, sin reutilizar cifras históricas de F7 como resultados actuales.
- [x] Comprobar axe público/panel, navegación completa con teclado, foco tras cerrar diálogos, 200 % zoom, reduced motion e impresión. Las correcciones visuales no justifican bajar umbrales ni eliminar reglas de axe.
- [x] Medir Lighthouse de `/`, `/productos` y `/contacto` contra el commit base en la misma máquina, sesión y condiciones; seguir `scripts/medir-lighthouse.mjs` y los umbrales vigentes. Exigir diferencia mediana no peor de 3 puntos y analizar variabilidad antes de atribuirla al cambio. Revisar LCP/CLS, fuentes e imágenes; si falla, corregir antes del cierre.
- [x] Confirmar diff sin cambios funcionales ni de base. No exigir nuevas pruebas SQL para CSS; conservar el resultado del CI requerido por el repositorio. Cualquier alteración accidental de consulta, autorización o cálculo se revierte, no se convierte en alcance nuevo.
- [x] Concluir la revisión independiente, documentar evidencia y limitaciones, actualizar el estado de este plan y abrir PR 5. PR #94 borrador abierto, vista previa revisada; checks vigentes en el PR. Parar conforme al flujo del proyecto. El despliegue y comprobación posterior quedan sujetos al flujo habitual de publicación, no a que la maqueta esté aprobada.

## Protocolo de verificación por tarea

En cada tarea con código: ejecutar typecheck/lint y sus pruebas seleccionadas, además de comprobar la captura final. Si se añade una prueba por un fallo funcional, verla fallar primero y pasar tras la corrección. No crear pruebas que se limiten a repetir cada clase CSS: usar contraste, controles y resultados observables.

E2E usa `playwright.config.ts` y Supabase **local**, nunca las credenciales productivas. Levantar un solo build con el entorno allí definido, correos desactivados; conservarlo para todas las tandas de esa revisión. Verificar PID y puerto 3000 antes de empezar para evitar probar un build anterior. No parar contenedores de otros proyectos. Al terminar, limpiar usuarios temporales y cerrar solo servicios propios que ya no se necesiten. La galería estática en 4177 puede seguir disponible.

Ejemplo de tanda, con servidor correcto ya comprobado:

```powershell
pnpm exec playwright test e2e/panel-cascara.spec.ts e2e/panel-accesibilidad.spec.ts --workers=1
```

## Condición de cierre

Se da por implementado cuando todas las rutas y estados del inventario tienen revisión, las pruebas requeridas pasan, se conserva la funcionalidad, no quedan controles azules y las páginas completas corresponden a A con sus ajustes aprobados. La aprobación de a6 cierra la exploración estética; no constituye aprobación automática de código, regresión, fusión ni despliegue.
