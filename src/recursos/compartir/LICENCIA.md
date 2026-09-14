# Recursos de la imagen para compartir

Estos archivos los usa **solo** `src/app/opengraph-image.tsx`, la imagen que aparece al compartir un
enlace del sitio por WhatsApp o en redes. No se sirven a los visitantes.

## Por qué existen, si el sitio ya tiene sus fuentes y su logo

`ImageResponse` (el motor de `next/og`) **no acepta woff2**, que es el formato de las fuentes del
sitio: solo ttf, otf y woff. Tampoco maneja bien las fuentes variables. Y el logo en PNG solo
existía en `DOC/Fotos y documentos Adjuntados Pimpos/`, que está fuera de git: en el CI o en un
despliegue no existiría.

## Tipografías

| Archivo            | Familia original  | Autoría                                                                                       |
| ------------------ | ----------------- | --------------------------------------------------------------------------------------------- |
| `playfair-700.ttf` | Playfair Display  | Copyright 2017 The Playfair Display Project Authors — github.com/clauseggers/Playfair-Display |
| `jakarta-500.ttf`  | Plus Jakarta Sans | Copyright 2020 The Plus Jakarta Sans Project Authors — github.com/tokotype/PlusJakartaSans    |

Ambas bajo la **SIL Open Font License 1.1** (<https://openfontlicense.org>), que permite usarlas,
modificarlas y redistribuirlas con el proyecto, y exige conservar este aviso.

Son **versiones modificadas** en el sentido de la licencia: salen del mismo TTF variable original
que las del sitio, con el peso fijado (Playfair a 700, Jakarta a 500) y recortadas a latín.

**Playfair Display declara «Playfair Display» como _Reserved Font Name_**, y la OFL prohíbe que una
versión modificada lo lleve: por eso `playfair-700.ttf` se llama «Playfair Pimpos» por dentro, y así
se registra en `src/app/opengraph-image.tsx`. Plus Jakarta Sans no declara ninguno y conserva el
suyo. Detalle en `src/estilos/fuentes/LICENCIA.md`.

Se regeneran junto con las del sitio:

```bash
pip install fonttools brotli
python scripts/preparar-fuentes.py
```

## Imágenes

| Archivo       | Origen                                                                       |
| ------------- | ---------------------------------------------------------------------------- |
| `isotipo.png` | `DOC/Fotos y documentos Adjuntados Pimpos/_OPTIMIZADO/marca/isotipo-256.png` |

Son la marca del propio cliente, Panadería Pimpo's E.I.R.L.

**Límite de peso:** el paquete de la imagen no puede pasar de 500 KB con fuentes y logos incluidos.
Hoy son unos 90 KB (las dos fuentes, 69 KB, más el isotipo). Antes de cambiar un archivo por uno más grande, sumar.
