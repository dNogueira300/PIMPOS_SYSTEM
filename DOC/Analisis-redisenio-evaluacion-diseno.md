# Evaluación A — Diseño independiente del rediseño

**Fecha:** 06/10/2026. **Evaluador:** `/root/cerrar_evaluacion_diseno`. **Método:** evaluación de diseño aislada; sin acceso a los resultados del detector ni al informe de evidencia técnica. La síntesis con la evaluación B corresponde al agente principal.

## Alcance y certeza

Revisión de las capturas actuales de producción proporcionadas por la evaluación visual anterior: `Maquetas/rediseno-2026-10-06/review-public-mobile-first.png` y `Maquetas/rediseno-2026-10-06/review-public-products-first.png` a 390 × 844, y `Maquetas/rediseno-2026-10-06/review-public-home.png` a 1440 px de ancho. Se cotejaron componentes públicos y código del panel. La sesión anterior realizó la captura en navegador; esta continuación no repitió esa operación. Las posiciones aportadas por esa captura sitúan el título de destacados de la portada móvil aproximadamente en y=1127 y el primer producto del catálogo en y=726.

El panel **no se inspeccionó con sesión autenticada**. Sus hallazgos son de estructura y presentación deducibles del código; no certifican su aspecto renderizado, tiempos, comportamiento con teclado, contraste ni éxito de los flujos. Tampoco se ejecutaron pruebas de usuario. Las capturas públicas no permiten aprobar estados de error, cambios de filtro o el funcionamiento de WhatsApp. No se usaron las cifras históricas de accesibilidad como prueba actual.

Se leyó `AGENTS.md`, su apartado Diseño, `PRODUCT.md`, el avance del proyecto y la referencia `impeccable/critique.md`. No existe `DESIGN.md` en la raíz consultada. El avance mantiene algunos datos antiguos —tipografías y estado de F7—; para esta revisión prevalecen el código y la información más reciente de `AGENTS.md`.

**Contrato:** el usuario autoriza sustituir restricciones estéticas anteriores, incluidas las que descartaban el minimalismo o una presentación más sofisticada. Eso libera la forma, no permite inventar hechos del negocio. Ninguna recomendación autoriza cambiar funciones, rutas, permisos, controles, validaciones, persistencia de borradores, aprobación, carrusel ni sus comportamientos actuales por dispositivo. No se modificó código de producto.

## Veredicto de especificidad

La identidad existe: azul reconocible, nombre, fachada auténtica, precios pequeños a la vista, horario de madrugada y reparto propio. Sin embargo, buena parte de la composición —tarjetas redondeadas, sellos, titulares serif, bloques crema, beneficios en tres columnas y valores en cuatro cajas— podría pertenecer a muchas panaderías. Los hechos de Pimpo’s singularizan más la página que su sistema gráfico.

La mayor oportunidad es convertir el pan, el precio y el ritmo de la tienda en la estructura de la experiencia. El escaparate público necesita una composición más propia y una llegada más rápida al producto. El panel necesita lectura operativa: prioridad, estado y siguiente acción. Compartir identidad entre ambos no obliga a darles la misma densidad, tipografía de títulos o tratamiento de botones.

Chola, Atelier y Kalatanta son referencias autorizadas para explorar la futura dirección. Esta evaluación no inspeccionó sus páginas y no atribuye características concretas a ninguna. No sería riguroso presentar aquí un comparativo visual de ellas. El futuro estudio puede extraer composición, fotografía y tipografía sin trasladar sus productos, precios, relatos ni modelo de compra.

## Lo que funciona

1. **La compra tiene dos puertas claras.** La portada móvil muestra «Pedir por WhatsApp» y «Ver los precios», acompañadas del estado de apertura. Las filas del catálogo relacionan nombre, fotografía y precio sin obligar a abrir cada ficha. Véanse las dos capturas móviles; `src/components/publico/portada-movil.tsx` y `src/app/(public)/productos/page.tsx`.
2. **Existe contenido capaz de sostener una identidad propia.** La fachada, las 4:00 a. m., la historia desde 2004 y las condiciones explícitas del delivery ofrecen material concreto. El bloque azul de reparto es uno de los momentos más jerarquizados de la portada de escritorio: agrupa tarifa, mínimo, horario y pago.
3. **El panel ya protege trabajo y orientación.** Por código hay controles de 44 px, navegación inferior por rol, «Guardar/Cancelar» persistentes, copia local recuperable, errores junto al campo y cambio a la pestaña con error. Esto es valor de UX existente, no deuda que deba reconstruirse. Fuentes: `campo.tsx`, `barra-guardar.tsx`, `formulario-panel.tsx`, `pestanas-formulario.tsx` y `navegacion.ts` dentro de sus carpetas de panel.

## Cinco prioridades

### 1. [P1] El catálogo móvil demora demasiado en enseñar pan y precio

**Evidencia:** en la portada de 390 × 844 la fotografía de fachada ocupa aproximadamente 294 px; siguen identidad, estado, dos botones y la franja de beneficios. Los destacados empiezan después del primer viewport. En `/productos`, el primer precio aparece hacia y=726: encabezado, introducción, separación vertical, siete categorías, recuento y título consumen casi toda la pantalla. `encabezado-seccion.tsx:28` utiliza `py-12`, `productos/page.tsx:42` añade otro `py-12` y `:112` separa las categorías con `mt-10`.

**Impacto:** el visitante que viene a saber qué hay y cuánto cuesta debe desplazarse incluso después de haber elegido «Ver los precios». Hay una salida funcional y visible, por lo que no es un bloqueo; sí contradice la prioridad móvil del producto.

**Recomendación de presentación:** recomponer el primer viewport con menor altura de foto y separación, una introducción más compacta y un grupo de filtros menos alto. Mantener las siete opciones visibles o claramente localizables, los mismos enlaces y su estado activo; no convertirlos en un flujo nuevo ni quitar categorías. Criterio de revisión propuesto: a 375 × 812 se ve al menos un producto con precio completo en `/productos`, sin reducir controles por debajo de 44 px. En la portada, acercar visualmente los productos sin eliminar identidad, horario ni botones.

**Herramientas sugeridas:** `impeccable layout`, `adapt`, `typeset`.

### 2. [P2] La portada enseña mejor la fachada que el producto y repite un repertorio de plantilla

**Evidencia:** la imagen dominante del inicio es una puerta metálica cerrada. La marca se repite en cabecera, rótulo de la foto y gran título móvil. En escritorio se suceden tarjetas blancas, sellos, bloque de reparto, historia con cuatro tarjetas y otro bloque blanco de ubicación; la fotografía comercial queda subordinada a muchas cajas. Véanse `review-public-home.png`, `portada-movil.tsx` y `tarjeta-producto.tsx`.

**Impacto:** se reconoce el local, pero la primera impresión aporta poco apetito y el mensaje genérico «Pan fresco, tradición de siempre» diferencia menos que los hechos y productos reales. La foto cerrada no demuestra que el negocio esté cerrado; el estado «Cerrado ahora» sí depende del horario. Deben tratarse como señales distintas.

**Recomendación de presentación:** trabajar una dirección fotográfica y una composición con contraste real entre producto, historia e información práctica. Explorar recortes más útiles de los activos existentes y un uso más selectivo de cajas y sellos. No sustituir fotos por escenas inventadas del negocio. Si se necesitan fotos nuevas, declararlas como dependencia. Conservar slides y controles del carrusel de escritorio, su pausa y accesibilidad; conservar la variante estática móvil vigente.

**Herramientas sugeridas:** `impeccable shape`, `bolder`, `typeset`.

### 3. [P2] La misma acción de WhatsApp cambia de lenguaje visual

**Evidencia:** el CTA móvil y el bloque de reparto son verdes; las tarjetas de producto de escritorio usan azul para «Pedir por WhatsApp». `tarjeta-producto.tsx:66` emplea `boton-cta`, mientras `portada-movil.tsx` emplea `boton-whatsapp`. El catálogo añade el enlace de WhatsApp en dorado y subrayado.

**Impacto:** el usuario necesita leer de nuevo acciones con el mismo destino; el color no ayuda de forma consistente a reconocerlas. No es un error funcional ni obliga a conservar la antigua regla cromática.

**Recomendación de presentación:** definir en el nuevo sistema una jerarquía consistente para pedido, navegación y enlace contextual. Elegir conscientemente si WhatsApp mantiene un color propio y aplicarlo según esa regla. Conservar textos de acción, destino, mensaje contextual y nombre accesible por producto.

**Herramientas sugeridas:** `impeccable colorize`, `clarify`, `document` al finalizar la implementación.

### 4. [P2, provisional] El panel necesita distinguir mejor navegación, filtros y tareas

**Evidencia de código:** `/admin/clientes` acumula crear, zonas, revisar, búsqueda, zona/estado, lista/mapa y descargas antes de las filas. Hay varios usos del mismo botón de contorno. En móvil, las secciones de «Más» no aplican el tratamiento activo que sí reciben las visibles: `barra-inferior.tsx:57` y `:82`, frente a `:46–48`. Configuración presenta seis pestañas en columnas iguales (`formulario-configuracion.tsx:77` y `pestanas-formulario.tsx:47`); su encaje a 375 px requiere verificación, no puede afirmarse un desbordamiento.

**Impacto:** las tareas frecuentes compiten visualmente con las de mantenimiento, y la ubicación actual queda menos señalada dentro de «Más». No hay evidencia de que alguna ruta sea inaccesible.

**Recomendación de presentación:** diferenciar mediante escala, alineación y agrupación visual la acción principal, herramientas secundarias, filtros y selección de vista. Mantener todos los controles, orden de trabajo, rutas, permisos y parámetros. Hacer visible el estado activo de las rutas existentes en «Más». Resolver el espacio de las seis pestañas sin ocultar campos, desmontar paneles ni sustituir el flujo. Validar con sesión real antes de cerrar un diseño.

**Herramientas sugeridas:** `impeccable layout`, `adapt`, `clarify`.

### 5. [P2, provisional] Las filas móviles del panel pierden parte de su contexto al comprimirse

**Evidencia de código:** `lista-adaptable.tsx:107–108` imprime los valores secundarios sin sus títulos, aunque la tabla de escritorio sí tiene encabezados. Nombre, zona y dirección pueden entenderse; otras combinaciones de estado, cantidad o fechas requieren inspección por módulo. Los controles laterales consumen espacio junto al texto; el componente ya ofrece `accionesDebajo` para casos amplios y `wrap-anywhere`. La ficha móvil de clientes combina además editar/corregir y acciones de contacto.

**Impacto:** la persona puede tener que inferir qué representa cada valor y leer nombres partidos en muchas líneas. El código previene parte del problema de encaje, por lo que no debe describirse como una rotura visual demostrada.

**Recomendación de presentación:** conservar todos los datos y acciones; dar a cada campo importante una posición y jerarquía reconocible y, donde haga falta, una etiqueta corta visible. Probar nombres y direcciones largas, cantidades y estados en 375 px, con botones de 44 px. El reparto necesita reconocer persona, dirección y contacto de un vistazo; el almacén necesita reconocer cantidad, unidad y aviso.

**Herramientas sugeridas:** `impeccable adapt`, `typeset`, `clarify`.

## Heurísticas de Nielsen — puntuación provisional

Escala de calidad: **0 ausente o gravemente fallido; 1 débil; 2 suficiente con fricción; 3 sólido; 4 excelente verificado**. No es la escala de severidad P0–P3. «n/a» se utiliza aquí también para aquello sin evidencia suficiente; no equivale a aprobado ni necesariamente a inaplicable. Las puntuaciones del panel describen únicamente su estructura en código.

| Heurística                            |         Público |           Panel | Evidencia o límite                                                                                                                                              |
| ------------------------------------- | --------------: | --------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Visibilidad del estado             |               3 |               2 | Apertura y recuento públicos. Panel: guardando, borrador, carga y avisos; inicio utiliza `Suspense fallback={null}` y no se verificó cómo se percibe la espera. |
| 2. Correspondencia con el mundo real  |               3 |               3 | Pan, precios, reparto y vocabulario directo. Panel usa «Hay», «Para revisar», «Guardar» y tareas del negocio.                                                   |
| 3. Control y libertad                 |               3 |               3 | Público ofrece catálogo y pedido; filtros son enlaces. Panel mantiene volver/cancelar y recuperación de borrador. No se probaron las transiciones.              |
| 4. Consistencia y estándares          |               2 |               2 | WhatsApp cambia de tratamiento. Panel comparte componentes, pero «Más» pierde marca activa y se uniforman acciones de distinta prioridad.                       |
| 5. Prevención de errores              |             n/a |               3 | Público: no se probaron decisiones ni estados relevantes. Panel: validación, pendientes y permisos visibles en código; no se validó ejecución.                  |
| 6. Reconocer antes que recordar       |               3 |               2 | Catálogo legible. Panel: valores sin encabezados en tarjetas móviles y varios iconos de acción.                                                                 |
| 7. Flexibilidad y eficiencia          |               2 |               3 | Catálogo consume casi una pantalla antes de productos. Panel: búsqueda en vivo, filtros, lista/mapa y atajos por rol existentes.                                |
| 8. Diseño estético y jerarquía        |               2 |               2 | Portada coherente pero genérica y alta en móvil. Panel: posible competencia de herramientas, pendiente de inspección visual.                                    |
| 9. Reconocer y recuperarse de errores |             n/a |               3 | Público no probado. Panel: errores por campo, pestaña con error y preservación de escritura en código.                                                          |
| 10. Ayuda y documentación             |             n/a |               2 | FAQ pública no inspeccionada. Panel: ayudas contextuales en campos y descripciones, manual completo no evaluado.                                                |
| **Total parcial**                     | **18/28 (64%)** | **25/40 (63%)** | Base utilizable con oportunidades relevantes. No son notas de accesibilidad ni aprobación integral del producto.                                                |

## Carga cognitiva

- **Decisiones con más de cuatro opciones:** siete categorías públicas; siete enlaces de navegación en escritorio, además de pedido; panel con hasta siete secciones según rol, ocho subsecciones de contenido y seis pestañas de configuración. Superar cuatro no es por sí solo un defecto: las categorías conocidas ayudan a reconocer. El problema está en jerarquía y espacio, no en el número aislado.
- **Agrupación:** el catálogo agrupa bien por categoría. El panel organiza campos por pestañas y ofrece búsqueda. La oportunidad es distinguir mejor los grupos de herramientas de clientes sin esconder funciones.
- **Memoria:** nombres y precios permanecen juntos en el catálogo. Las tarjetas móviles de panel pueden perder el encabezado que aclaraba un dato en escritorio.
- **Esfuerzo de lectura:** la repetición de identidad y la introducción amplia retrasan el contenido más útil en móvil. La repetición de «Pedir por WhatsApp» en varias tarjetas es justificable porque cada acción se refiere a un producto; no se recomienda retirarlas.
- **Estados y errores:** buenos mecanismos previstos en panel; experiencia real pendiente. No se puede afirmar que la interfaz carezca de borradores, feedback o ayudas.

## Recorrido emocional y personas

**Vecino que entra por primera vez (Jordan):** reconoce la panadería y encuentra el pedido; desciende el interés cuando la primera pantalla enseña una puerta cerrada y ningún pan con precio. La mayor oportunidad es acercar la oferta sin inventar urgencia ni stock.

**Persona con móvil y atención dividida (Casey):** los dos botones anchos son una fortaleza. El catálogo demanda desplazamiento antes de comparar. En reparto, es necesario comprobar que direcciones largas y cuatro acciones por fila no dificulten localizar al cliente; el código por sí solo no prueba ese fallo.

**Personal que trabaja repetidamente en el panel (Alex):** búsqueda, navegación por rol y acciones persistentes reducen trabajo. La similitud visual de muchas herramientas puede retrasar la elección. No se recomienda añadir atajos de teclado ni operaciones masivas: serían funcionalidad nueva fuera de este encargo.

**Accesibilidad (Sam, comprobación pendiente):** existen etiquetas, estados ARIA y tamaños previstos. Se debe verificar el recorrido con teclado, zoom y lector de pantalla en la futura composición. El mensaje «campos marcados en rojo» puede mejorarse visualmente con error textual claramente asociado, que ya existe en `Campo`; no debe concluirse que hoy dependa solo del color.

El pico positivo público es ver pan con precio y condiciones de entrega claras. El valle es el espacio previo a esa respuesta. El cierre aporta dirección y horario, aunque repite información en el pie. En el panel, el momento sensible es guardar o corregir: la recuperación de borrador y la señal de error son parte del valor que debe sobrevivir al rediseño.

## Observaciones menores y límites del próximo trabajo

En la captura larga aparece una superficie de imagen vacía en la historia. No se diagnostica imagen rota: puede ser captura, carga diferida o estado de animación. Verificar en viewport antes de abrir una incidencia. No asignar un P1 a un artefacto no confirmado.

La presencia de sombras y bordes tenues no implica falta de contraste; requiere medición. La serif no es un problema por sí misma: evaluar tamaño, peso y reconocimiento de cantidades. No usar esta crítica para eliminar la pizarra, el carrusel, mapas, filtros, testimonios, FAQ, formularios o mecanismos de aprobación.

El siguiente diseño debe compararse con las mismas rutas, datos y roles, incluyendo público sin foto, catálogo vacío, seis pestañas de configuración, formularios con errores y borrador, listas largas, nombres largos, carga, éxito, permisos y acciones destructivas. La matriz funcional debe permanecer idéntica. Esos escenarios son condiciones de conservación, no propuestas de nuevas funciones.

## Preguntas de dirección para la síntesis

1. ¿Qué debe identificar visualmente la primera pantalla: el pan que se compra, el local que ya conocen los vecinos o ambos dentro de una composición más compacta?
2. De las referencias autorizadas, ¿qué dirección concreta sostiene mejor los precios accesibles y la cercanía de Pimpo’s cuando se compare con activos reales?
3. ¿Puede el sistema compartir una firma de marca y permitir al panel una densidad y tipografía más operativas sin alterar ninguno de sus flujos?

Questions skipped: esta evaluación es una entrega interna al agente principal; el usuario ya pidió analizar antes de elaborar el plan y fijó que ninguna funcionalidad cambie. La síntesis debe evitar repetir preguntas cuyo alcance ya está resuelto.
