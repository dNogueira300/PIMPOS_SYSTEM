# SEO técnico — T3a y T3b

Fecha: 12/10/2026. Rama `feat/seo-tecnico`, base `2e7cfa8`.
Plan: `Plan SEO - Dominio e indexacion.md` (PR #96 documental, independiente).

## Alcance implementado

- Portada: título absoluto **Panadería Pimpo's en Iquitos | Pan fresco y delivery**.
- Bakery: foto pública ya leída por la portada; logo separado y reserva cuando no hay foto.
- Teléfono del schema: +51 solo para celular peruano inequívoco; contacto visible y WhatsApp conservados.
- Product: oferta de la única presentación con precio vigente finito y no negativo, en PEN.
  Se conservan cero y decimales, sin sustituir nulos por cero o el mínimo de varias presentaciones
  por una oferta única. Marca, reseñas, disponibilidad y vigencia no se inventan.
- Descripciones existentes y escape seguro de JSON-LD conservados.
- Cinco borradores en `SEO - Contenido confirmado.md`, sin aprobación/publicación todavía.

No cambian consultas, catálogo, campos, cálculos, rutas, autenticación, pedidos ni descargas.
La ampliación de la raíz de Turbopack solo vive en una copia ignorada de validación;
la configuración y las dependencias versionadas permanecen intactas.

## Evidencia comprobada

- RED unitario: Bakery falló por imagen/teléfono y Product por helper todavía inexistente.
- RED navegador sobre producción anterior, solo lectura: título anterior y ausencia de `offers`.
- GREEN unitario específico: **33/33**.
- Suite unitaria completa: **516/516**, **62 archivos**.
- Build Next **16.3.4/Turbopack** contra Supabase local: aprobado. La copia ignorada
  amplía `turbopack.root` para resolver las dependencias enlazadas; no se cambia la versión del proyecto.
- Generación de tipos y `tsc --noEmit`: aprobados; lint completo: aprobado.
- E2E SEO sobre el build local: **11/11**, incluida la ficha con múltiples presentaciones.
- Revisión independiente: sin Critical/Important; sin nuevas consultas ni cambios funcionales.
- [Rich Results Test del francés chico](https://search.google.com/test/rich-results/result?id=_hI8Dwb0wWJZ7eErn-5cvg):
  un fragmento de producto y una ficha de comerciante válidos. En fragmentos quedan tres
  advertencias opcionales: `review`, `aggregateRating` y `availability`. No se añaden sin datos reales.
  Se probó **código obtenido del build local**, no el acceso de Google a una URL desplegada.
- [Rich Results Test de Bakery y hamburguesa grande](https://search.google.com/test/rich-results/result?id=ANsK6wYaSjb6D3zZHpjsKA):
  empresa local y organización válidas; hamburguesa grande no elegible para fragmento de producto
  por ausencia de oferta/reseñas/valoración. Es el límite previsto para varias presentaciones;
  no un resultado aprobado para todos los productos. Código local de pruebas, no datos publicados por esta entrega.

## Integración y producción, 13/10/2026

Dan fusionó el plan en PR #96 (`ffd485b`) y la implementación en PR #97 (`40f2a8b`).
CI del commit técnico aprobó aplicación, pgTAP y Playwright completos; Vercel Ready.
La vista previa se revisó antes de integrar: título local, canónicas del dominio real,
oferta de 0.1 PEN y teléfono +51947874820, sin cambios en pedidos.

El dominio definitivo se comprobó después de la fusión: **44 URLs públicas HTTP 200**,
canónicas coherentes y sin `noindex` público; sitemap XML válido. Las **32 ofertas**
publicadas coinciden con el precio visible. Las dos hamburguesas con varias presentaciones
siguen sin oferta, según el alcance previsto. Login conserva `noindex, nofollow`.
Portada muestra el título local y Bakery con foto del negocio, logo independiente y +51.
Evidencia: `Evidencias SEO/despliegue-tecnico-2026-10-13.json`.

[Rich Results Test de marcado real de la vista previa](https://search.google.com/test/rich-results/result?id=TBEaqfdeEwa0gv1D9bR00A):
cuatro tipos válidos (fragmento de producto, ficha de comerciante, empresa local y organización),
con avisos no críticos. Es una prueba por código; no acredita indexación ni procesamiento
del sitemap de Search Console. La inspección en Google de las URLs productivas sigue como seguimiento externo.

## Límites y seguimiento

- Las fichas con varias presentaciones permanecen descriptivas y no adquieren elegibilidad
  para precio enriquecido. No se ha diseñado una estrategia de variantes ni rutas nuevas.
- Google Maps/verificación por video aplazada por Dan. El teléfono antiguo de esa ficha
  no se usa para cambiar el contacto publicado en la web.
- Search Console: propiedad verificada y solicitudes realizadas según Dan; no acredita indexación.
  El sitemap sigue pendiente por el error de lectura comunicado, aunque las pruebas públicas
  y la prueba en vivo aportada muestran acceso correcto. Estos cambios no se atribuyen a su solución.
- La aparición de resultados enriquecidos y la indexación se comprobarán después de integrar y desplegar.
- Menor de revisión aplazado: `e2e/seo.spec.ts` comprueba el precio visible en `main`, que incluye
  relacionados. La prueba podría restringirse al precio principal en una mejora posterior.

PR #95 de hosting continúa pausado e intacto. F7 de capacitación/manual/traspaso sigue separado.

## Contenido publicado, 13/10/2026

Tras la confirmación y aprobación de Dan, se guardaron cinco descripciones mediante el
panel existente: francés chico, bizcocho chico, ciabatta, pan molde y pan molde integral.
Lectura pública posterior: cinco HTTP 200; texto visible, descripción Product, meta y OG
coinciden con los textos aprobados. Los restantes campos Product, incluidas ofertas,
imágenes y categorías, son iguales a la auditoría previa. Los precios visibles coinciden
con los estructurados: 0.10, 0.10, 0.50, 6.00 y 7.00 PEN, respectivamente.

Evidencia: `Evidencias SEO/contenido-publicado-2026-10-13.json`.
Esta entrega solo registra publicación y seguimiento: no cambia código de aplicación y
no repite suites de código ya ejecutadas para PR #97. No se atribuye a estas comprobaciones
indexación de Google ni solución del error de lectura del sitemap.
