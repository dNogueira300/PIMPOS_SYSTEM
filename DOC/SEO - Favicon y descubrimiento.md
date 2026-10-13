# Favicon y descubrimiento — 13/10/2026

Dan confirma por captura que Search Console procesó el sitemap: Correcto, 44 páginas
descubiertas. Google muestra resultados de portada y contacto. No se infiere que todo el
catálogo esté indexado.

Antes del ajuste, el favicon enlazaba un SVG de 455 × 601, rectangular y de la identidad anterior.
Su pequeña representación en Google pierde legibilidad. Se prepara un PNG cuadrado de
96 × 96 con el personaje del logo aprobado, fondo crema y margen del 6 %. El texto
pequeño y el resplandor lateral quedan fuera del encuadre; no se redibuja el personaje.
También se actualiza Apple a 180 × 180. El original queda intacto. La regeneración usa:

```powershell
node scripts/preparar-favicon.cjs 'ruta/al/logo.png'
```

La configuración administrable del favicon conserva prioridad. En producción se usó
el campo existente del panel; la reserva local PNG y Apple se despliegan con el PR.
El favicon se publicó mediante el panel existente y se comprobó en la portada pública:
PNG 96 × 96, HTTP 200, 8,950 bytes, idéntico al archivo preparado. Solo se editó
`favicon_url`; las demás entradas del formulario se conservaron. Bakery y canónica
públicas también coinciden con la auditoría previa. La reserva PNG y Apple quedan
pendientes del despliegue del PR. Google deberá volver a rastrear portada/icono: la
publicación no certifica que ya cambió su apariencia en el resultado.

Dan aclara que probó ChatGPT **sin búsqueda web**. Esa respuesta no prueba un bloqueo ni
un problema de SEO. Repetir con búsqueda web: «Busca la web oficial de Panadería Pimpo’s
en Iquitos». Puede proporcionarse la URL para comprobar acceso directo; eso tampoco
equivale a descubrimiento espontáneo o recomendación.

Las pruebas HTTP con User-Agent simulado OAI-SearchBot, ChatGPT-User, Googlebot y bingbot
devuelven 200 en portada, nosotros y francés chico. Robots permite el público y excluye
admin/login según la regla de mayor longitud. No certifica acceso desde sus IP reales
ni que el servicio ya haya rastreado la web. La herramienta de búsqueda de esta sesión
no devolvió resultados por dominio y su apertura directa no estuvo disponible; no se
atribuye esa limitación a un bloqueo del proveedor. No se cambian robots, firewall,
entrenamiento de IA ni protecciones de autenticación.

Fuentes: [Google, favicon en resultados](https://developers.google.com/search/docs/appearance/favicon-in-search)
y [OpenAI, rastreadores](https://developers.openai.com/api/docs/bots).
Evidencia pública: `Evidencias SEO/favicon-bots-2026-10-13.json`.

Maps permanece aplazado. Bing se inicia después de este ajuste, conforme al pedido de Dan.

Validación local: ESLint de los archivos cambiados y 33 pruebas SEO aprobados.
El intento de `tsc --noEmit` sobre las dependencias compartidas falló en tipos de
Playwright/Vitest/Auth fuera del alcance del cambio. No se presenta como una prueba
aprobada. El intento de preparar dependencias aisladas tampoco finalizó; Corepack no
pudo resolver `registry.npmjs.org` (`ENOTFOUND`). No se cambiaron dependencias versionadas
ni se reparó el entorno compartido. CI deberá comprobar tipos antes de fusionar.
