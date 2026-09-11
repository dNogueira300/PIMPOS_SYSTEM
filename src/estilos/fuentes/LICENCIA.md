# Licencias de las tipografías

Las dos fuentes de este directorio están bajo la **SIL Open Font License 1.1**, que permite
usarlas, empaquetarlas y redistribuirlas con el proyecto. La licencia exige conservar este aviso.

| Archivo                | Familia  | Autoría                                                                         |
| ---------------------- | -------- | ------------------------------------------------------------------------------- |
| `fraunces-latin.woff2` | Fraunces | Copyright 2020 The Fraunces Project Authors — github.com/undercasetype/Fraunces |
| `inter-latin.woff2`    | Inter    | Copyright 2016 The Inter Project Authors — github.com/rsms/inter                |

Texto completo de la licencia: <https://openfontlicense.org>

## Qué archivos son exactamente

Ambos son **fuentes variables** con el subconjunto **latin** (`U+0000-00FF` y compañía), que cubre
todo el español: tildes, `ñ`, `ü`, `¿` y `¡`. No se incluyen los subconjuntos `latin-ext`,
`cyrillic` ni `vietnamese` porque este sitio no los necesita y cada uno añadiría peso a la primera
carga.

Al ser variables, un solo archivo cubre todos los grosores del rango declarado (300–700), en lugar
de un archivo por peso. Entre las dos suman unos 115 KB.

## Por qué están aquí y no se cargan desde Google

Requisito del plan (`03 - Frontend`, §3.2): servirlas desde el propio proyecto evita enviar la IP
de cada visitante a un tercero, y ahorra la conexión extra a `fonts.gstatic.com`, que retrasa el
primer render. Iquitos tiene conectividad móvil variable y el móvil es prioritario (R6).

## Cómo actualizarlas

Se descargaron del API de Google Fonts pidiendo el subconjunto latin de la variable:

```bash
# Ver las URL (hace falta un User-Agent moderno para que devuelva woff2)
curl -A "Mozilla/5.0 ... Chrome/120.0 ..." \
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&display=swap"
```

De la respuesta se toma la URL del bloque cuyo `unicode-range` empieza por `U+0000-00FF`.
