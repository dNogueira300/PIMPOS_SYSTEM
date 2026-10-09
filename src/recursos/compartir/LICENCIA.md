# Recursos de la imagen para compartir

La imagen para compartir y los PDF descargables usan Jakarta y el logo aprobado.
Estos recursos se incluyen en las funciones del servidor; no se cargan como fuentes de la página.

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
se registraba en la tarjeta social anterior. El rediseño usa únicamente Jakarta; el recurso
Playfair se conserva como histórico. Plus Jakarta Sans no declara ninguno y conserva el
suyo. Detalle en `src/estilos/fuentes/LICENCIA.md`.

Se regeneran junto con las del sitio:

```bash
pip install fonttools brotli
python scripts/preparar-fuentes.py
```

## Imágenes

| Archivo       | Origen                                                                                                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isotipo.png` | Histórico: `DOC/Fotos y documentos Adjuntados Pimpos/_OPTIMIZADO/marca/isotipo-256.png`                                                                                                   |
| `logo.png`    | Logo aprobado `DOC/Fotos y documentos Adjuntados Pimpos/Diseño/logo.png`, a través del derivado `public/marca/logo-512.webp`; PNG con transparencia, 512 × 341 px, sin rediseñar la marca |

Son la marca del propio cliente, Panadería Pimpo's E.I.R.L.

**Límite de peso:** el paquete de la imagen no puede pasar de 500 KB con fuentes y logos incluidos.
La imagen actual utiliza 162.797 bytes de recursos (Jakarta y logo), por debajo de 500 KB.
El isotipo y Playfair se conservan como recursos históricos. Los PDF llevan el logo en cada página;
`outputFileTracingIncludes` asegura que también viaje en la descarga desplegada en Vercel.
