# Inicio del panel como dashboard — propuesta

Fecha: 08/10/2026. Solicitud de Dan después de fusionar PR #91. **Pendiente de revisión visual;
no implementada en el producto.** Rama de preparación: `feat/rediseno-portada-dashboard`, desde
main `429a25d`.

Abrir `index.html` directamente, o iniciar `node scripts/servir-maquetas-panel.cjs` desde la raíz
del repositorio (puerto 4178 libre). La galería del bloque 2 ya levantada también sirve esta carpeta:
<http://127.0.0.1:4178/3.2/dashboard-inicio/index.html>. Seleccionar tamaño y «Actual y propuesta».
`propuesta.html` muestra únicamente la nueva composición; los enlaces y botones representan los
controles existentes y no ejecutan acciones. No conecta con Supabase ni necesita una sesión.

## Información conservada

Los tres avisos, seis destinos de secciones y cinco frases de actividad proceden de la captura
`../bloque2/t3/inicio-administrador-1440.png`, no de datos del negocio en producción. Se conservan
su texto, orden y cantidades: 5 datos por confirmar, 20 insumos bajo mínimo y 1 con algo por vencer.
Las frases largas del historial se mantienen para comprobar la distribución con contenido real
del fixture. La maqueta es exclusivamente del rol administrador; el código final conservará
`seccionesPara`, los permisos y las condiciones actuales de avisos/actividad para los demás roles.

Se destaca la cantidad dentro de cada aviso y se organizan accesos e historial en dos columnas
en escritorio. En móvil se apilan las secciones. Las descripciones breves de los accesos explican
los módulos actuales; no prometen funciones nuevas. Identidad A: Jakarta, crema, terracota y radios
de 6 px. Logo original optimizado ya aprobado; iconos renderizados desde Lucide instalado. La
fuente local es una copia del mismo archivo Jakarta de la aplicación, exclusivamente para servir
esta maqueta estática. Su licencia permanece en `src/estilos/fuentes/`.

No hay métricas nuevas, gráficos, totales comerciales, botones de registro adicionales, filtros
ni un cambio de navegación. Las filas de auditoría simuladas no son registros navegables.

## Comparación y límites

A 390 y 1440 px, el lado actual usa las capturas del mismo estado local del bloque 2. A 375,
768 y 1024 px se muestra la captura de referencia más cercana, expresamente identificada como
aproximación; la propuesta sí se renderiza al ancho elegido. Las imágenes completas de móvil
incluyen la barra fija en la posición del viewport inicial; en la maqueta navegable permanece al
pie de la pantalla mientras se baja. Las capturas de la propuesta y
`verificacion.json` registran la revisión estática a los cinco anchos.

Una maqueta revisada con axe y controles visibles no prueba sesiones, permisos, auditoría,
consultas o flujos. Las pruebas del código final y la revisión independiente se ejecutarán en
T4.1 + T5 antes de abrir PR 3. El teclado físico y el zoom nativo siguen sin evidencia nueva.

## Alcance de la próxima entrega

El plan incorpora T4.1 junto con T5 en PR 3. T6 pasa a PR 4 y T7 a PR 5 para mantener como máximo
dos tareas por PR. Se preserva la numeración histórica de T5–T7. No se abre otro PR ni se publica
esta preparación antes de revisar la composición nueva.
