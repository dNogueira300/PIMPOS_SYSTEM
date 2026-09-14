# Licencias de las tipografías

Las dos fuentes de este directorio están bajo la **SIL Open Font License 1.1**, que permite usarlas,
modificarlas, empaquetarlas y redistribuirlas con el proyecto. La licencia exige conservar este
aviso.

| Archivo                | Familia original  | Autoría                                                                                       |
| ---------------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `playfair-latin.woff2` | Playfair Display  | Copyright 2017 The Playfair Display Project Authors — github.com/clauseggers/Playfair-Display |
| `jakarta-latin.woff2`  | Plus Jakarta Sans | Copyright 2020 The Plus Jakarta Sans Project Authors — github.com/tokotype/PlusJakartaSans    |

Texto completo de la licencia: <https://openfontlicense.org>

## Por qué Playfair se llama «Playfair Pimpos» por dentro

**Playfair Display declara «Playfair Display» como _Reserved Font Name_** en su licencia, y la OFL
(sección 3) prohíbe que una **versión modificada** lleve ese nombre. Los dos archivos de aquí son
versiones modificadas: están recortados al subconjunto latino. Por eso la tabla `name` de
`playfair-latin.woff2` dice «Playfair Pimpos»; el trazo es el de Playfair Display, sin tocar.

Plus Jakarta Sans no declara ningún nombre reservado, así que conserva el suyo. Fraunces e Inter,
las anteriores, tampoco lo declaraban: por eso en F1 no hizo falta renombrar nada.

No afecta al sitio: el nombre de familia CSS lo pone `next/font` a partir de la variable exportada
en `src/estilos/fuentes.ts` (`playfair`, `jakarta`), no la tabla interna del archivo.

## Qué archivos son exactamente

Ambos son **fuentes variables** recortadas al latín básico y latin-1 (`U+0000-00FF`), más la
tipografía que el sitio escribe de verdad: rayas, comillas curvas y angulares, punto medio, puntos
suspensivos y la flecha de los enlaces. Cubre todo el español —tildes, `ñ`, `ü`, `¿`, `¡`—. No se
incluyen cirílico, griego ni vietnamita: el sitio no los usa y serían la mitad del peso.

Al ser variables, un solo archivo cubre todo el rango de pesos (Playfair 400–900, Jakarta 200–800).
Entre las dos suman **79 KB**. `e2e/presupuesto.spec.ts` falla si lo que se descarga pasa de 140 KB.

## Por qué están aquí y no se cargan desde Google

Requisito del plan (`03 - Frontend`, §3.2): servirlas desde el propio proyecto evita enviar la IP de
cada visitante a un tercero, y ahorra la conexión extra a `fonts.gstatic.com`, que retrasa el primer
render. Iquitos tiene conectividad móvil variable y el móvil es prioritario (R6).

## Cómo regenerarlas

```bash
pip install fonttools brotli
python scripts/preparar-fuentes.py
```

El guion descarga los TTF variables originales del repositorio oficial de Google Fonts
(`github.com/google/fonts`, carpeta `ofl/`), los recorta, los convierte a woff2, renombra la
derivada de Playfair y falla si el nombre reservado sigue dentro. Los originales quedan en
`.fuentes-origen/`, fuera de git.
