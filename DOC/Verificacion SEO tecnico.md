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

La vista previa remota se comprobará después de abrir el PR; no está acreditada por este registro.
La comprobación de Google sobre el dominio definitivo debe repetirse tras la integración.

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
