# Recursos de la imagen para compartir

Estos archivos los usa **solo** `src/app/opengraph-image.tsx`, la imagen que aparece al compartir un
enlace del sitio por WhatsApp o en redes. No se sirven a los visitantes.

## Por qué existen, si el sitio ya tiene sus fuentes y su logo

`ImageResponse` (el motor de `next/og`) **no acepta woff2**, que es el formato de las fuentes del
sitio: solo ttf, otf y woff. Tampoco maneja bien las fuentes variables. Y el logo en PNG solo
existía en `DOC/Fotos y documentos Adjuntados Pimpos/`, que está fuera de git: en el CI o en un
despliegue no existiría.

## Tipografías

| Archivo            | Familia  | Autoría                                                                         |
| ------------------ | -------- | ------------------------------------------------------------------------------- |
| `fraunces-600.ttf` | Fraunces | Copyright 2020 The Fraunces Project Authors — github.com/undercasetype/Fraunces |
| `inter-500.ttf`    | Inter    | Copyright 2016 The Inter Project Authors — github.com/rsms/inter                |

Ambas bajo la **SIL Open Font License 1.1** (<https://openfontlicense.org>), que permite
usarlas, modificarlas y redistribuirlas con el proyecto, y exige conservar este aviso.

Son **versiones modificadas** en el sentido de la licencia: salen de los mismos archivos que usa el
sitio (`src/estilos/fuentes/*.woff2`), convertidas a TTF y con los ejes fijados. La OFL prohíbe
publicar una versión modificada con un _Reserved Font Name_, y se comprobó que ninguna de las dos
declara uno — por eso conservan su nombre.

Se regeneran así, con `fonttools` y `brotli` (este último hace falta para leer el woff2):

```python
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

# Fraunces: ejes opsz (9–144) y wght (100–900). Tamaño óptico de titular.
f = instancer.instantiateVariableFont(
    TTFont("src/estilos/fuentes/fraunces-latin.woff2"), {"wght": 600, "opsz": 72}
)
f.flavor = None
f.save("src/recursos/compartir/fraunces-600.ttf")

# Inter: solo el eje wght (100–900).
f = instancer.instantiateVariableFont(TTFont("src/estilos/fuentes/inter-latin.woff2"), {"wght": 500})
f.flavor = None
f.save("src/recursos/compartir/inter-500.ttf")
```

## Imágenes

| Archivo       | Origen                                                                       |
| ------------- | ---------------------------------------------------------------------------- |
| `isotipo.png` | `DOC/Fotos y documentos Adjuntados Pimpos/_OPTIMIZADO/marca/isotipo-256.png` |

Son la marca del propio cliente, Panadería Pimpo's E.I.R.L.

**Límite de peso:** el paquete de la imagen no puede pasar de 500 KB con fuentes y logos incluidos.
Hoy son unos 125 KB. Antes de cambiar un archivo por uno más grande, sumar.
