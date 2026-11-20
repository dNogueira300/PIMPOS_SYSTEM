# Caligrafía de acento — comparación del 19/11/2026

Dan pidió sumar una fuente caligráfica corrida a Playfair Display y Plus Jakarta Sans. Esta carpeta
es lo que se le enseñó para elegir. **Eligió Dancing Script, con Playfair de vuelta en los
títulos** del sitio público.

- `1-portada-movil.png`: la portada a 390 px, hoy y con cada candidata en el eslogan.
- `2-sello-y-titular.png`: «Horneando en Iquitos» y «Te lo llevamos a tu casa», en escritorio.
- `3-muestrario.png`: frases con tildes, ñ, ü, ¿ y ¡ en tres tamaños, sobre crema y terracota; peso
  y licencia de cada una. Great Vibes, descartada, para comparar.
- `4-titulos-y-reglas.png`: títulos en Playfair frente a Jakarta, y dónde va y dónde no la
  caligrafía.
- `index.html` compone las hojas con las capturas de `capturas/`. Toma Playfair, Jakarta y Dancing
  de `src/estilos/fuentes/`. Kaushan, Cookie y Great Vibes **no se versionan**: las copias recortadas
  de Kaushan y Cookie llevarían su nombre reservado, que la OFL no deja redistribuir, así que al
  abrir el HTML esas filas salen con la letra de reserva. Las hojas PNG son el registro fiel.

**Qué son y qué no son.** Las capturas son el sitio de producción del 19/11/2026 (el rediseño A,
`f0ebe84`) con las fuentes **inyectadas por Playwright** en el navegador, no un build de esta rama:
sirven para elegir la letra, no prueban la implementación. Las candidatas se recortaron con
`scripts/preparar-fuentes.py` y sus pesos son los de la variable entera; la Dancing Script que entró
en el sitio va fijada en seminegrita y pesa 26 KB, no 43.

Candidatas: Dancing Script (pluma, la más legible), Kaushan Script (pincel) y Cookie (letrero
retro). Las tres son OFL y declaran un nombre reservado.
