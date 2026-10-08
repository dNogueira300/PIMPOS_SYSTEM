# Rediseño: evidencia técnica independiente (Assessment B)

Fecha: 06/10/2026. Alcance: análisis de presentación del sitio público y del panel. Sin cambios de producto, datos, permisos, validaciones ni funcionalidades. Este documento separa lo observado en código de lo que requeriría comprobación visual o con usuarios.

## Método y límites

- Detector ejecutado desde la raíz de `PIMPOS_SYSTEM`: `C:/Users/DANIEL/.agents/skills/impeccable/scripts/impeccable.cmd detect --json src`.
- Resultado íntegro: `[]`. Código de salida **0**. **0 hallazgos, 0 reglas disparadas, 0 ubicaciones informadas, 0 falsos positivos que clasificar**.
- El árbol contiene 168 archivos TSX; no supera el umbral de 500 archivos escaneables que obliga a reducir el alcance.
- No se debe interpretar el resultado como aprobación estética, prueba de usabilidad ni auditoría WCAG. El detector identifica patrones concretos; no evalúa por sí solo si el diseño satisface a Dan o representa a Pimpo's.
- Se intentó abrir una pestaña nueva con la automatización nativa (`cua.createBrowserTab`, sitio publicado). La inicialización agotó el tiempo y reinició el kernel. No hubo DOM fiable, captura ni consola de navegador disponibles en esta evaluación.
- No se levantó un servidor de overlays. No se inyectó el detector en una página y no existe overlay que afirmar como visible. La API disponible además describe evaluación de solo lectura, insuficiente para la inyección mutable exigida por el procedimiento.
- Las observaciones siguientes son evidencia del código actual, no hallazgos del detector. No se ejecutaron pruebas de aplicación: esta tarea no cambia implementación. Las cifras de pruebas y rendimiento de `AGENTS.md` son historial del proyecto, no mediciones nuevas.

## Estructura que explica por qué un cambio de color aislado sería insuficiente

| Evidencia                                                                                                                                                                     | Consecuencia para el rediseño visual                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/layout.tsx` carga `globals.css` y las dos fuentes para todo el árbol.                                                                                                | Sitio público, login y panel comparten hoy el mismo punto de entrada visual.                                                                                                                                                          |
| `src/estilos/globals.css:105` define el primario azul; `:149` la fuente de títulos; `:668` aplica la fuente de títulos a todos los `h1`, `h2`, `h3`.                          | La decisión editorial del escaparate se hereda automáticamente en pantallas de trabajo. Conviene separar alcance semántico de tokens públicos y operativos antes de reemplazar la identidad.                                          |
| `src/components/panel/encabezado-panel.tsx:26` fuerza título serif azul; `barra-lateral.tsx` usa el primario en toda la superficie lateral y `font-heading` para la marca.    | El panel depende expresamente de la estética pública, además de heredarla. No basta cambiar una variable global si se quieren dos tratamientos con funciones distintas.                                                               |
| `globals.css:75` fija radio base de 16 px y deriva hasta 41,6 px; las clases de tarjetas y botones se definen allí.                                                           | El ritmo redondeado está estructuralmente extendido, no localizado en la portada. Radios y densidad deben definirse por superficie y función del componente.                                                                          |
| Se encontraron 80 líneas con `boton-cta` o `boton-linea` en componentes y páginas administrativas. `PestanasHistorial` representa navegación con esas mismas píldoras de CTA. | Los controles de operación, navegación y promoción comparten forma y peso. Se pueden diferenciar visualmente conservando exactamente sus destinos, acciones y comportamiento.                                                         |
| `CascaraPanel` fija columna lateral de 15 rem y `main` de `max-w-5xl` (`:17`, `:22`).                                                                                         | La composición del panel tiene anchura y densidad uniformes; requiere revisar distribución y espaciado en listas y formularios, manteniendo sus contenidos y campos.                                                                  |
| `Button` de shadcn conserva tamaños 24–36 px (`src/components/ui/button.tsx:23–34`), mientras las clases propias miden 48 px y el panel añade controles de 44 px.             | Existen dos sistemas de tamaño. No prueba que actualmente haya objetivos táctiles incorrectos, porque los consumidores los corrigen o evitan. Sí obliga a normalizar las variantes de presentación y verificar cada uso al rediseñar. |

La arquitectura existente de primitivos → semánticos → componentes es aprovechable. La separación recomendada es de presentación: conservar los componentes de dominio, sus acciones y contratos, y dar a público/panel ámbitos visuales propios. No requiere cambiar stack, rutas ni base de datos.

## Panel: señales comprobables en el código

1. **Navegación ya diferenciada por dispositivo y rol.** `src/lib/panel/navegacion.ts` filtra secciones por autorización. El escritorio presenta hasta siete secciones; el móvil muestra cuatro destinos y Más. Hay que conservar el filtrado, destinos y acceso actual. El rediseño puede mejorar grupos visuales, estado activo, alineación y separación.
2. **Inicio como índice de módulos.** `src/app/(admin)/admin/page.tsx` muestra avisos, Tus secciones y Actividad reciente cuando existen. La prioridad se puede expresar con jerarquía, contraste, anchura y espacio; no hace falta inventar métricas, un tablero analítico, accesos nuevos ni acciones adicionales.
3. **Contenido como cuadrícula uniforme.** `src/app/(admin)/admin/contenido/page.tsx` presenta las ocho subsecciones con la misma clase de tarjeta. El código demuestra igualdad visual, no demuestra por sí solo una mala tasa de éxito. La revisión visual debe decidir si títulos, agrupación y ritmo permiten reconocer las tareas existentes.
4. **Lista móvil pierde el rótulo de cada columna secundaria.** `src/components/panel/lista-adaptable.tsx:106–108` imprime los valores de las celdas unidos por flex-wrap, sin `c.titulo`; escritorio sí muestra esos títulos. Conservar cada valor y vínculo, revisar su presentación con etiquetas o agrupación visual para reducir ambigüedad, sin alterar los datos ni la acción.
5. **Formularios tienen protecciones valiosas.** `FormularioPanel` conserva borradores, valida, informa por toast, mantiene contenido con error y expone estado pendiente. `PestanasFormulario` salta a la primera pestaña con error y usa `forceMount` para no perder campos. `BarraGuardar` conserva Guardar/Cancelar y evita la barra inferior móvil. Estas son funcionalidades: no reemplazarlas para simplificar la maqueta.
6. **Auditoría tiene cuatro vistas y frases comprensibles.** `PestanasHistorial` enlaza Cambios, Ingresos, Datos borrados y Descargas; son rutas, no paneles internos intercambiables. Se puede cambiar el estilo de navegación, preservando las rutas, `aria-current`, filtros, datos y lectura de historial.
7. **Cargas discretas.** Hay nueve apariciones de `Suspense fallback={null}` en páginas administrativas. Es señal para inspeccionar visualmente las esperas, no prueba automática de una pantalla en blanco: el resultado depende del layout y caché. Cualquier tratamiento visual debe conservar tiempos, peticiones y funcionamiento.

## Movimiento: inventario y límites para el nuevo lenguaje

- Revelado público por CSS, `animation-timeline: view()`, entrada vertical/lateral de 24 px y zoom de imagen desde 1,06. Fin al 70 % de entrada; rejillas al 80 %. Evidencia: `globals.css:396–425`, `:586–618`.
- Hay protección con `@supports`, `prefers-reduced-motion`, visibilidad por defecto e impresión. Conservar estas garantías.
- Hover de tarjetas: elevación de 3 px y 250 ms, condicionado a hover y preferencia de movimiento. Botones: transiciones cromáticas de 200 ms y pulsación de 100 ms. La respuesta a pulsación existe; no es necesario añadir animación ornamental para demostrar interactividad.
- Fotos de productos usan 500 ms de zoom al pasar el cursor; galería y novedades 700 ms. Es una diferencia objetiva que conviene someter al nuevo criterio de movimiento, no un defecto medido de rendimiento.
- `src/components/ui/sheet.tsx:59` usa 200 ms y `ease-in-out`; botones y pestañas de la biblioteca usan `transition-all`. Se recomienda definir duraciones, curvas y propiedades explícitas por interacción para evitar deriva visual, sin cambiar eventos, cierre, foco ni navegación.
- `CarruselPortada` tiene avance a los 6000 ms (`:11`, `:66`), pausa al hover y foco (`:79`, `:81`), y consulta reducción de movimiento y anchura al iniciar el efecto (`:58–64`). El carrusel y su comportamiento son funcionalidades actuales: con la restricción de Dan, conservarlos. Cambiar su composición, controles y transiciones está dentro del rediseño; quitarlo o alterar autoplay no lo está.
- Las fuentes ya son locales y variables (`src/estilos/fuentes.ts`); su carga evita dependencia de Google Fonts. Si cambian familias, preservar licencias, fallback y estrategia de carga. El peso de 79 KB es documentación del proyecto; no se volvió a medir aquí.

## Contratos visuales que deben seguir protegidos

El permiso para reemplazar tipografía, paleta, radios y reglas estéticas no elimina accesibilidad, funcionalidad ni verdad del negocio. La implementación futura debe retener:

- Texto en español, rutas, títulos comprensibles y datos reales; precios y formatos existentes.
- Objetivos táctiles de al menos 44 px, estados de foco, teclado, nombres accesibles, estados activos y contraste contrastado contra los nuevos fondos.
- Tablas y tarjetas móviles con toda la información y acciones actuales; pruebas con filas presentes, nombres largos y múltiples acciones.
- Borradores, pestañas, validaciones, confirmaciones, botones de guardar/cancelar, permisos por rol, conservación de filtros y páginas de historial.
- Imágenes reales, recorte apropiado y contenido visible sin soporte de animaciones o con reducción de movimiento.
- Suite funcional existente como contrato de regresión. Reescribir únicamente expectativas estrictamente visuales que el nuevo diseño sustituya; no debilitar pruebas de resultados o accesibilidad.
- Comparación de rendimiento en condiciones equivalentes. Las cifras históricas de Lighthouse no garantizan las del nuevo diseño.

## Orden técnico propuesto para el plan posterior

1. Inventariar pantallas y estados sin modificar rutas ni flujos; fijar capturas base de público y panel (móvil/escritorio y roles representativos).
2. Definir mundo visual nuevo para público y lenguaje operativo relacionado para panel. Elegir tipografía, color, radios, espaciado, densidad y movimiento con maquetas representativas.
3. Separar los ámbitos de tokens sin cambiar la lógica de dominio; establecer variantes visuales consistentes de controles, navegación, listas, formularios y estados.
4. Aplicar la dirección a componentes compartidos y después a páginas. Conservar la interfaz funcional de los componentes y todos los contratos mencionados.
5. Verificar rutas y estados en 375 px y escritorio, accesibilidad, interacciones existentes y rendimiento. El detector de hoy en cero no sustituye esas pruebas.

No se modificó código de producto, datos, configuración desplegada, reglas de acceso ni pruebas. No se ejecutó ninguna operación Supabase.
