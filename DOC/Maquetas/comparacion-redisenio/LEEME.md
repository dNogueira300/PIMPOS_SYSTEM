# Comparación del rediseño — Pimpo’s

Fecha: 07/10/2026. Estado: **A elegida por Dan y ajustada; pendiente de implementación**.

## Revisión A — logo y eliminación del azul

Dan eligió A y pidió usar `DOC/Fotos y documentos Adjuntados Pimpos/Diseño/logo.png` en todas las
superficies. Se prepararon WebP de 256, 512 y 768 px (18 356, 43 978 y 72 284 bytes), con canal
alfa y reducción de peso de 98.6 %, 96.6 % y 94.4 %. El original de 1 292 753 bytes permanece
intacto; su SHA-256 y el método constan en `assets/logo-optimizacion.json`. La optimización es
determinista, con Sharp, sin generación ni reinterpretación del dibujo.

Las veinte vistas actuales A usan este logo en login, lateral, cabecera móvil, cabecera pública
y pie público. En el login se apoya en un fondo claro **circular**, tanto en escritorio como en
móvil, según el ajuste posterior pedido por Dan, para mantener la lectura.
Los botones azules venían de `--cta-fondo` y otros tokens que seguían apuntando a los primitivos
anteriores. Se corrigieron también hover, foco, selección, iconos, gráficos y sombras heredadas.

Verificación actual: **20 capturas, paridad de controles en todas y 212 barridos de estilos
visibles sin valores azules detectados**, en estados normales y con hover/foco por familia de
control. Se inspeccionan color, fondo, bordes, contorno, decoración de texto, fill y stroke. Es
una comprobación de estilos renderizados, no una prueba de todos los estados de la aplicación.
Las fotografías y la ilustración mantienen sus colores reales; no son colores de interfaz.

La galería abre A ajustada y permite compararla con la base actual o A anterior. Las capturas
anteriores se conservan como historia y pueden incluir el logo/color descartados. Los bocetos
generados iniciales ya no se muestran como propuesta vigente. La galería pasó sus 60 combinaciones
(100 imágenes), sin errores JavaScript ni desbordamiento móvil. Ningún cambio se aplicó a `src`.

Los apartados comparativos A/B siguientes documentan la exploración inicial; esta revisión y la
elección de A tienen precedencia sobre sus decisiones y cifras históricas.

### Ajuste de contraste en la portada móvil

A pedido de Dan, únicamente sobre el bloque terracota de la portada móvil: WhatsApp usa fondo
verde claro `#E7F2DF`, texto/icono verde oscuro `#234735` y hover `#D3E8C5`. El indicador abierto
usa verde claro `#B9E39F` y 10 px. Contrastes calculados: texto del botón 8.97:1 (hover 7.96:1),
botón frente al terracota 6.05:1 e indicador 4.84:1. No se cambia el cálculo del horario ni el enlace
de WhatsApp. El resto del diseño mantiene sus estilos.
Se comprobó también el estado cerrado; la captura final de portada usa las 09:00 de Lima del
07/10/2026 como hora simulada del navegador para mostrar el indicador abierto. Esa simulación
solo corresponde al capturador de maquetas, no al reloj ni al horario de la aplicación.

Abrir `index.html` directamente en el navegador, o ejecutar desde la raíz del repositorio:

```powershell
node scripts/servir-maquetas-redisenio.cjs
```

Galería: <http://127.0.0.1:4177>. Funciona sin Next ni Supabase; solo sirve los archivos de esta carpeta.

## Decisiones recibidas

### Prueba de tapiz y retirada del horno

Dan aprobó retirar la ilustración decorativa del horno en portada. Se conserva el titular
dependiente del horario y su explicación, en una composición compacta de una columna.
La prueba solicitada de tapiz usa un SVG propio de panes, barras, croissants y panes de molde,
con escalas y giros diferentes, trazo marrón al 11 % sobre el fondo cálido. Se aplica al fondo del
contenido público; fotografías, botones y superficies sólidas conservan su fondo legible.
El patrón es decorativo y no incorpora contenido al árbol de accesibilidad.

La galería permite «Fondo liso frente a tapiz» en portada y catálogo, en ambos tamaños. En ambas
variantes se retiró el horno, para comparar únicamente el patrón. **Tapiz aprobado por Dan, con opacidad reducida del 16 % al 11 %**;
no se modificaron panel, login, funcionalidad ni código de producción.

- Eliminar el velo blanco del carrusel. Las propuestas separan texto y fotografía: el contraste
  depende de un fondo sólido, no de blanquear la imagen. Se mantienen todas las diapositivas,
  enlaces, controles, pausa, teclado y reducción de movimiento en el contrato de implementación.
- Empezar el panel desde el login. Usar el **logo original**, también en la barra lateral y en
  la cabecera móvil. No redibujar ni sustituir la identidad por texto solamente.
- Libertad para cambiar composición, tipografía, paleta y reglas estéticas anteriores.
- **Ninguna funcionalidad nueva, retirada o alterada.** Las maquetas no cambian `src`, migraciones,
  rutas, acciones, permisos, validaciones, consultas, cálculos ni datos de negocio.

## Qué contienen los archivos

| Carpeta / archivo        | Contenido                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `evidencia/`             | 28 capturas autenticadas/base, sin estilos de propuesta; registro de rutas, roles, tamaños e imágenes. |
| `pantallas/`             | 60 capturas: 10 pantallas × 2 tamaños × Actual/A/B.                                                    |
| `conceptos/`             | 4 bocetos generados de portada y login. Dirección artística, no especificación funcional.              |
| `propuestas.css`         | Estilos exploratorios inyectados temporalmente en el navegador. No importados por la aplicación.       |
| `comparacion.json`       | 40 registros A/B: paridad de controles, ancho, logo, velo e imágenes.                                  |
| `limpieza-maquetas.json` | Eliminación del usuario temporal de la última captura.                                                 |

Pantallas A/B: login, portada, catálogo, inicio del panel, insumos, registrar ingreso,
nuevo cliente, Historial, Configuración y nuevo producto. Escritorio: 1440 × 1000; móvil:
390 × 844. Las imágenes guardan la página completa. Al no ser una página interactiva, la barra
fija queda en la posición de la primera vista dentro de la captura larga.

## Hallazgos autenticados

1. **Identidad ausente:** login solo con texto, lateral con «Pimpo’s · Panel» y sin marca en el
   encabezado móvil. Se confirma con las capturas, además del código revisado anteriormente.
2. **Configuración móvil:** las seis pestañas se comprimen y sus rótulos se tocan. Las propuestas
   las distribuyen en dos filas de tres, conservando orden, selección y contenido. La adaptación
   transversal también se muestra en los formularios de cliente y producto.
3. **Inicio administrativo:** avisos, atajos y actividad tienen pesos visuales similares. A prueba
   accesos planos; B conserva su separación con superficies sobrias. Los avisos y registros siguen
   siendo los mismos. No se añaden indicadores o gráficos sin fuente de datos existente.
4. **Insumos móvil:** las tarjetas muestran valores secundarios sin los encabezados presentes en
   escritorio. Queda pendiente diseñar su rotulación al definir los componentes; las propuestas
   actuales conservan literalmente la información y las acciones.
5. **Formularios:** la tipografía, los contornos y los radios pueden unificarse sin cambiar campos.
   Se mantiene la barra de Guardar/Cancelar y la navegación inferior; su convivencia debe probarse
   con teclado virtual durante implementación, no inferirse de una captura de página completa.
6. **Roles:** se comprobó el ingreso real con administración, ingeniería y reparto. Sus menús y
   páginas accesibles son diferentes. Esto no sustituye la suite de permisos ni verifica cada ruta.

## Direcciones comparables

| Decisión                  | A · Cálida y directa                               | B · Azul de marca                                                |
| ------------------------- | -------------------------------------------------- | ---------------------------------------------------------------- |
| Primario                  | Terracota `#953E2C`                                | Azul `#12306E`                                                   |
| Fondo                     | Cálido `#F7F5F0`                                   | Neutro `#F4F6F8`                                                 |
| Texto                     | `#28251F`                                          | `#19283C`                                                        |
| Tipografía de esta prueba | Plus Jakarta Sans en títulos y texto               | Plus Jakarta Sans en panel; Playfair Display en títulos públicos |
| Login escritorio          | Composición dividida con marca a la izquierda      | Tarjeta centrada con logo                                        |
| Panel                     | Lateral claro, selección terracota; accesos planos | Lateral azul, selección clara; accesos separados                 |
| Carrusel                  | Texto a la izquierda y fotografía a la derecha     | Fotografía a la izquierda y texto a la derecha                   |

Se reutilizan las fuentes locales disponibles para aislar la comparación de estructura y color.
No se ha cerrado la elección tipográfica definitiva. La libertad de reemplazarlas sigue vigente.
Los bocetos generados contienen interpretaciones y fotografías que **no deben convertirse en
datos del catálogo ni reemplazar fotos del negocio**. Las capturas deterministas son la referencia
de campos y acciones.

Contrastes calculados para estos pares concretos (fórmula de luminancia sRGB):

| Par                      | A       | B       |
| ------------------------ | ------- | ------- |
| Texto / fondo            | 14.02:1 | 13.75:1 |
| Blanco / primario        | 6.99:1  | 12.55:1 |
| Texto secundario / fondo | 6.80:1  | 5.92:1  |

Son comprobaciones parciales, **no una certificación de accesibilidad** de toda la propuesta.
Persisten estilos heredados que se resolverán con tokens completos después de elegir dirección.

## Método, datos y límites

- Compilación local existente, revisión `3113084`; Supabase local en `127.0.0.1:54321`.
- Cuentas temporales con contraseña aleatoria, login mediante el formulario real y posterior
  eliminación en `finally`. No se almacenan contraseñas, cookies ni estados de sesión en artefactos.
  La auditoría local conserva las huellas de creación/eliminación; no se borró para limpiar capturas.
- No se guardaron productos, clientes, movimientos ni configuración. No se intervino producción.
- La evidencia autenticada inicial cubre administración (9 rutas), ingeniería (inicio/insumos),
  reparto (inicio/clientes) y login, en ambos tamaños.
- Las propuestas del panel usan administración. El sistema visual deberá extenderse a los tres
  roles conservando sus menús y permisos; no se presenta esa extensión como terminada.
- Se comparó la lista de campos (tipo, nombre, id y requerido), etiquetas, botones y enlaces
  antes/después de cada propuesta. **40/40 registros finales conservan esos controles.** No prueba
  todos los comportamientos, estados ni integraciones. No se ejecutó la regresión completa.
- Las propuestas no desbordan horizontalmente a 1440 y 390 px. El logo carga y es visible en
  todas las propuestas de acceso/panel. El velo está oculto en ambas propuestas públicas.
- La galería pasó 60 combinaciones de pantalla/tamaño/comparación: 120 imágenes decodificadas,
  cero errores JavaScript y sin desbordamiento de la galería a 390 px. Se verificaron el
  desplazamiento sincronizado y su interruptor (`verificacion-galeria.json`).
- Algunas imágenes de portada no estaban disponibles en la copia local. El capturador intercepta
  únicamente esas solicitudes con archivos reales de `DOC/Fotos y documentos Adjuntados Pimpos/
_OPTIMIZADO/lugar/`: `fachada1.webp` y `horno1.webp`. La sustitución se aplica también a la base
  Actual para comparar con la misma fotografía. Está registrada por captura. No se cambia la base
  de datos y no se atribuyen esas capturas a producción.
- La fachada con la puerta cerrada sigue siendo una limitación editorial. Se conserva aquí para
  evaluar el velo y la composición con el mismo material; la elección de una foto principal más
  favorable sigue abierta y debe usar imágenes reales.
- Los formularios muestran su primera pestaña. Falta extender maquetas a detalle/edición de
  cliente, mapa, detalle del producto, detalle del Historial, errores, vacíos y diálogos. No se
  declara completo el sistema de componentes ni cerrada la especificación ejecutable.

## Movimiento propuesto para el plan

Conservar el carrusel y sus condiciones de pausa, avance y accesibilidad. Transiciones discretas
de color/foco entre 120–160 ms; apertura de paneles o diálogos existentes entre 160–220 ms con
opacidad y desplazamientos cortos. Sin animación ornamental continua en tablas ni formularios.
Respetar `prefers-reduced-motion`; ningún texto o control debe depender de animarse para aparecer.
Estas son pautas pendientes de validación, no comportamiento implementado ni medido aquí.

## Orden del siguiente plan

1. Dirección cerrada: Dan eligió A y aprobó sus ajustes hasta a6, incluido el tapiz al 11 %.
2. Cerrar tokens, contraste completo, tipografía, logo y componentes; completar estados y pantallas
   complejas pendientes con el lenguaje elegido.
3. Implementar **login y cáscara del panel como primera entrega visual**, y después componentes
   compartidos del panel. Comparar administración, ingeniería y reparto.
4. Aplicar la dirección pública al carrusel sin velo, portada móvil, catálogo/detalle y resto del
   sitio. Conservar mensajes, precios, filtros y acciones existentes.
5. Regresión funcional por flujo, accesibilidad, móvil con teclado y rendimiento comparable.

El análisis integral sigue en `DOC/Analisis UI UX - Rediseno integral.md`. La dirección A está
aprobada por Dan; aún no está implementada ni desplegada. El plan de implementación está en
`DOC/Plan de Desarrollo 03.2 - Rediseño integral UI UX.md` (07/10/2026).
