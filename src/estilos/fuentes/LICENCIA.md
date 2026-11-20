# Licencias de las tipografías

Las tres fuentes de este directorio están bajo la **SIL Open Font License 1.1**, que permite usarlas,
modificarlas, empaquetarlas y redistribuirlas con el proyecto. La licencia exige conservar este
aviso.

| Archivo                | Familia original  | Autoría                                                                                       |
| ---------------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `playfair-latin.woff2` | Playfair Display  | Copyright 2017 The Playfair Display Project Authors — github.com/clauseggers/Playfair-Display |
| `jakarta-latin.woff2`  | Plus Jakarta Sans | Copyright 2020 The Plus Jakarta Sans Project Authors — github.com/tokotype/PlusJakartaSans    |
| `dancing-latin.woff2`  | Dancing Script    | Copyright 2016 The Dancing Script Project Authors — github.com/googlefonts/DancingScript      |

Texto completo de la licencia: <https://openfontlicense.org>

Quién usa cada una: Jakarta, todo el sitio (texto, y títulos del panel y del ingreso); Playfair, los
títulos del sitio público; Dancing Script, tres acentos caligráficos de la portada. Las dos últimas
solo se descargan en el sitio público (`src/estilos/fuentes-publicas.ts`).

## Por qué Playfair y Dancing Script llevan otro nombre por dentro

**Playfair Display declara «Playfair Display» como _Reserved Font Name_** en su licencia, y
**Dancing Script declara «Dancing Script»**. La OFL (sección 3) prohíbe que una **versión
modificada** lleve ese nombre, y los archivos de aquí lo son: están recortados al subconjunto
latino, y el de Dancing Script además fijado en un solo peso. Por eso sus nombres dicen «Playfair
Pimpos» y «Dancing Pimpos»; el trazo es el original, sin tocar.

El aviso de copyright de dentro del archivo **no** se renombra: la licencia obliga a conservarlo, y
el nombre reservado solo afecta a cómo se llama la fuente. Dancing Script lo conserva tal cual.
`playfair-latin.woff2` se preparó antes de corregir eso en el guion, y su aviso interno dice «The
Playfair Pimpos Project Authors»; el aviso correcto es el de la tabla de arriba. Se arregla la
próxima vez que se regenere Playfair.

Plus Jakarta Sans no declara ningún nombre reservado, así que conserva el suyo. Fraunces e Inter,
las anteriores, tampoco lo declaraban: por eso en F1 no hizo falta renombrar nada.

No afecta al sitio: el nombre de familia CSS lo pone `next/font` a partir de la variable exportada
(`playfair`, `jakarta`, `dancing`), no la tabla interna del archivo.

## Qué archivos son exactamente

Los tres están recortados al latín básico y latin-1 (`U+0000-00FF`), más la tipografía que el sitio
escribe de verdad: rayas, comillas curvas y angulares, punto medio, puntos suspensivos y la flecha
de los enlaces. Cubre todo el español —tildes, `ñ`, `ü`, `¿`, `¡`—. No se incluyen cirílico, griego
ni vietnamita: el sitio no los usa y serían la mitad del peso.

Playfair (400–900) y Jakarta (200–800) son **variables**: un archivo cubre todos los pesos. Dancing
Script va **fijada en seminegrita (600)**, el único peso que se escribe: 26 KB, frente a los 43 de la
variable entera. Las tres suman **105 KB**, y el sitio público las baja todas;
`e2e/presupuesto.spec.ts` falla si lo que se descarga pasa de 140 KB.

## Por qué están aquí y no se cargan desde Google

Requisito del plan (`03 - Frontend`, §3.2): servirlas desde el propio proyecto evita enviar la IP de
cada visitante a un tercero, y ahorra la conexión extra a `fonts.gstatic.com`, que retrasa el primer
render. Iquitos tiene conectividad móvil variable y el móvil es prioritario (R6).

## Cómo regenerarlas

```bash
pip install fonttools brotli
python scripts/preparar-fuentes.py            # las tres
python scripts/preparar-fuentes.py dancing    # solo la nombrada
```

El guion descarga los TTF variables originales del repositorio oficial de Google Fonts
(`github.com/google/fonts`, carpeta `ofl/`), los recorta, los convierte a woff2, renombra las
derivadas con nombre reservado y falla si ese nombre sigue en sus nombres. Los originales quedan en
`.fuentes-origen/`, fuera de git. Conviene nombrar solo la fuente que se quiere cambiar: si Google
publicó otra versión de las demás, regenerarlas cambiaría archivos que nadie pidió tocar.
