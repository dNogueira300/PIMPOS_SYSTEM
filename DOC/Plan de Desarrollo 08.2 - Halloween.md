# Plan de Desarrollo 08.2 — Halloween y el Día de la Canción Criolla

Diseño acordado con Dan el 20/11/2026. Son la tercera y la cuarta temáticas del plan 08 (que montó la
base y Navidad; el 08.1 añadió el Día de la Madre y los estilos por temática). Arriba va el diseño y
debajo el plan de tareas. Maquetas en `DOC/Maquetas/tematicas/halloween/` y
`DOC/Maquetas/tematicas/cancion-criolla/`.

---

## 1. Para qué

Que el sitio público **celebre el 31 de octubre**. En Perú ese día es Halloween y también el **Día de la
Canción Criolla**, y Dan quiere que **el negocio decida cuál celebra**: por eso son dos temáticas, cada
una con su diseño, para la misma fecha, y solo una puede estar encendida.

Las dos son **un saludo festivo, no una campaña de venta** (Dan: «que se sienta la fiesta, un saludo, y
los productos son opcionales, así como el Día de la Madre»). Nacen sin productos; si el negocio quiere
sacar algo de temporada, lo añade desde la pestaña Productos del panel.

Halloween 2026 ya pasó (hoy es 20/11/2026), así que las dos se dejan **listas para octubre de 2027**,
con fechas de fábrica que no se cruzan con Navidad (en producción, del 30/11 al 02/01).

**Para todas las edades.** Pimpo's es una panadería de barrio con clientes de todas las edades: el
Halloween de Pimpo's es simpático, no da miedo. Calabazas sonrientes, un esqueletito que saluda, una
arañita con ojitos y murciélagos lejanos. Nada de sangre, zombis, cuchillos, ojos sueltos ni sustos, y
los textos no hablan de «terror».

## 2. Objetivos, lo que no entra y lo que lo haría fracasar

**Objetivos**

- Una temática `halloween` con dos estilos: **«Noche de calabazas»** (puesto) y **«Calabaza sobre
  crema»** (alterno).
- Una temática `cancion-criolla` con dos estilos: **«Rojo y blanco»** (puesto) y **«Balcón limeño»**
  (alterno).
- **Las dos comparten fechas y el negocio elige una.** La base deja que Halloween y la Canción Criolla
  se crucen **solo entre ellas** y **solo si una de las dos está «Apagada»**. De fábrica, Halloween
  va «Según fechas» y la Canción Criolla «Apagada». Navidad y el Día de la Madre siguen exactamente
  igual que hoy.
- Las frases dicen bien los nombres: «Faltan 3 días para Halloween» (sin artículo), «Faltan 3 días para
  **el** Día de la Canción Criolla», «Mensajes **del** Día de la Canción Criolla».
- Mismo listón que Navidad y el Día de la Madre: axe en cero en las 11 páginas públicas con los cuatro
  estilos, contrastes AA medidos, nada se anima con «menos movimiento», ningún adorno al imprimir,
  ninguno recibe clics ni tapa la cabecera, sin desborde a 375 px ni a 1280 px, ningún control de
  menos de 44 px.

**No entra**

- Productos de temporada de fábrica.
- Cambiar cómo se enciende una temática, la caché o las reglas de cruces **de Navidad y el Día de la
  Madre**. Solo se añaden dos excepciones, y solo entre las alternativas (§6.1): pueden cruzarse si una
  está «Apagada», y la «Apagada» sigue apagada aunque le cambien las fechas.
- Una pantalla o un interruptor nuevo para «¿qué celebramos el 31?»: se elige con lo que ya existe,
  apagando una y dejando la otra «Según fechas».
- Otras temáticas (San Juan, Fiestas Patrias…).
- Que el negocio diseñe estilos o elija colores.

**Lo haría fracasar** (aunque funcione)

- Que Halloween asuste o parezca de terror: sangre, monstruos, sustos.
- Que el saludo parezca un anuncio: «encarga ya», urgencia o precios en primer plano.
- Que las dos temáticas puedan salir encendidas a la vez, o que el sitio quede sin ninguna cuando el
  negocio cree haber elegido una.
- Que el año siguiente el negocio no pueda poner las fechas nuevas de la que no celebra (§6.1, «el
  año siguiente»).
- Que algo de una temática se cuele en otra (la nieve, los banderines rosa, el festón, las luces).
- Que la base acepte un par temática-estilo sin CSS.
- Una portada más lenta o un sitio que se mueve para quien pidió menos movimiento.

## 3. Lo decidido

**Por Dan (20/11/2026), sobre las maquetas:**

- **Saludo festivo**; productos opcionales, como el Día de la Madre.
- **Halloween, estilo puesto «Noche de calabazas»** = la dirección B (sitio de noche, morado casi
  negro, con naranja) **más la arañita de A y el esqueletito de C**.
- **Halloween, estilo alterno «Calabaza sobre crema»** = la dirección A (el crema de siempre con
  naranja calabaza) **con los banderines de papel de C**.
- **La palabra «Halloween» del título va en el naranja de A (`#c2560f`) en los dos estilos.**
- **El Día de la Canción Criolla tiene temática propia**, para que el negocio elija cuál celebra.
- **Las dos comparten fechas y el negocio elige una** (camino 1): solo una puede estar encendida.
- **La regla vale solo entre esas dos** (camino 1): Navidad y el Día de la Madre no cambian.
- **Entre esas dos, la «Apagada» sigue apagada aunque le cambien las fechas** (salida a, tras la
  revisión del diseño): hoy cambiar las fechas devuelve cualquier temática a «Según fechas», lo que
  haría chocar a la que no se celebra con la que sí. Navidad y el Día de la Madre no cambian.
- **Canción Criolla, estilo puesto «Rojo y blanco»** = la dirección A; **estilo alterno «Balcón
  limeño»** = la dirección C. **Los dos con el cajón y la guitarra colgando.**
- Aceptó sin cambios mis propuestas de fechas, textos y tono para Halloween (§4).

**Mis llamadas, para que Dan las revise al leer:**

- En «Noche de calabazas», el esqueletito ocupa el sitio de la calaverita (dos cráneos se repetían).
- En «Calabaza sobre crema», los banderines sustituyen a las calabacitas colgantes (ya llevan calabazas
  recortadas), y alternan negro y naranja para no pesar sobre el crema.
- En «Rojo y blanco», el cordel queda con dos notas, para no amontonar con el cajón y la guitarra.
- Los datos de partida de la Canción Criolla (§4), que Dan aún no ha visto en tabla.
- El nombre de la Canción Criolla entero va en caligrafía en el título («Feliz _Día de la Canción
  Criolla_»), porque así funciona hoy `SeccionTemporada` con cualquier temática; la maqueta solo
  enseñaba «Canción Criolla». Cambiarlo sería tocar un componente.
- Sin emojis en los textos de fábrica (cada celular los dibuja distinto): las calabazas de la cinta y
  las notas son adornos del CSS.

**Las maquetas:** en cada carpeta, `direcciones-propuestas.html` (las tres de partida),
`estilos-aprobados.html` y `estilos-aprobados.jpg` (los dos estilos elegidos). En las maquetas los
adornos son SVG sueltos que se mueven libremente; en el sitio van en los huecos que ya existen (§6.3).

## 4. Las temáticas, con sus datos de partida

Los pone la migración, sin autoría ni auditoría (trampa de 0024), como 0049.

**Halloween**

| Campo            | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| `slug`           | `halloween`                                                                       |
| `nombre`         | `Halloween`                                                                       |
| `inicio` / `fin` | `2027-10-25` / `2027-11-01`                                                       |
| `fecha_evento`   | `2027-10-31` (domingo)                                                            |
| `encendido`      | `fechas`                                                                          |
| `estilo`         | `calabaza-noche`                                                                  |
| `texto_aviso`    | «Feliz Halloween: dulce o truco en Pimpo's»                                       |
| `mensajes_cinta` | «Dulce o truco», «Pan calientito para los disfrazados», «Delivery a todo Iquitos» |
| `titulo`         | «Feliz Halloween»                                                                 |
| `entradilla`     | «Dulce o truco: aquí siempre hay pan calientito para los pequeños disfrazados.»   |
| Productos        | ninguno                                                                           |

**Día de la Canción Criolla** (_llamada mía_ en textos)

| Campo            | Valor                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `slug`           | `cancion-criolla`                                                                               |
| `nombre`         | `Día de la Canción Criolla`                                                                     |
| `inicio` / `fin` | `2027-10-25` / `2027-11-01` (las mismas que Halloween: son alternativas)                        |
| `fecha_evento`   | `2027-10-31`                                                                                    |
| `encendido`      | `apagada` (la base pone `encendido_desde` = el día de la migración y `encendido_hasta` = `fin`) |
| `estilo`         | `rojo-blanco`                                                                                   |
| `texto_aviso`    | «Feliz Día de la Canción Criolla: pan calientito y buena música»                                |
| `mensajes_cinta` | «Feliz día criollo», «Pan para la jarana», «Delivery a todo Iquitos»                            |
| `titulo`         | «Feliz Día de la Canción Criolla»                                                               |
| `entradilla`     | «Un valsecito, un cajón y pan calientito: así se celebra en casa.»                              |
| Productos        | ninguno                                                                                         |

Sin productos, la sección de temporada sale mientras haya cuenta regresiva y desaparece sola después,
como ya hace `SeccionTemporada`.

## 5. Cómo se construye: los enfoques

**Cómo conviven las dos temáticas del 31 de octubre** (hoy la base rechaza todo cruce de fechas,
aunque una esté «Apagada»; ver 0047, `app.tematicas_reglas`):

1. **Las dos con sus fechas reales, y el negocio elige apagando una — elegido por Dan.** Exige que la
   base acepte el cruce cuando una de las dos está «Apagada».
2. Sin tocar la regla, moviendo fechas: la Canción Criolla nace con otras fechas y, para celebrarla, se
   mueven primero las de Halloween. Dos pasos fáciles de equivocar y un panel que solo dice «se
   cruzan». Descartado.
3. Repartir la semana (Halloween del 24 al 30, la Canción Criolla el 31 y el 1): se celebrarían las dos,
   pero el negocio no elige, que es lo que pidió Dan. Descartado.

**Qué regla acepta ese cruce:**

1. **Solo entre temáticas alternativas — elegido por Dan.** La base sabe que `halloween` y
   `cancion-criolla` son alternativas (la misma lista que `disenos.ts`). Solo entre ellas se perdona el
   cruce, y solo si una está «Apagada». Navidad y el Día de la Madre se comportan como hoy, y su manual
   no cambia.
2. Cualquier temática «Apagada» deja de contar para los cruces. Más simple, pero cambia lo que ya
   existe: apagando Navidad se podría poner el Día de la Madre en diciembre, lo contrario de lo que dice
   el manual. Descartado.
3. Un interruptor de «¿qué celebrar el 31?» dentro de una sola temática: un campo y una pantalla nuevos.
   Descartado.

**Los estilos** siguen el enfoque del plan 08.1, sin discusión nueva: cada temática con sus pares
válidos en la base (`tematicas_estilo_de_su_tematica`) y en `disenos.ts`.

## 6. Diseño

### 6.1 Base (migración 0050)

- `tematicas_slug_conocido`: admite además `'halloween'` y `'cancion-criolla'` (drop + add, con el
  mismo nombre).
- `tematicas_estilo_de_su_tematica`: se reemplaza (drop + add, mismo nombre) con los pares
  `halloween` → `calabaza-noche`, `calabaza-crema`; `cancion-criolla` → `rojo-blanco`, `balcon`; más
  los cuatro de antes. Los valores no se repiten entre temáticas (el Historial usa una tabla plana).
- **La regla de cruces** (`app.tematicas_reglas`, `create or replace`, el resto de la función igual):
  - Dos temáticas **alternativas** (por ahora solo el par `halloween`–`cancion-criolla`, escrito en
    la función) pueden tener ventanas que se crucen **si una de las dos está apagada en vigor**
    (`encendido = 'apagada'` y hoy ≤ `encendido_hasta`). La fila nueva cuenta con los valores que ya
    calculó el propio trigger más arriba.
  - **Entre alternativas, la frase cambia**: «Las fechas se cruzan con «Halloween». Las dos son para la
    misma fiesta: deja una de las dos «Apagada».» (el nombre de la otra entre comillas, como hoy). Con
    cualquier otra temática, la frase de siempre.
  - Navidad y el Día de la Madre, y cualquier par que no sea alternativo: sin cambios.
  - **Cambiar las fechas de la «Apagada»** (decisión de Dan, salida a). Hoy el segundo `if` de la
    función devuelve a «Según fechas» toda fila a la que le cambian `inicio` o `fin` sin cambiar
    `encendido`, para que apagar una campaña no deje apagada también la siguiente. Entre alternativas
    eso es justo lo contrario de lo que se quiere: el negocio ajusta las fechas de la que no celebra,
    deja «Apagada» y la base la pasaría a «Según fechas», chocando con la otra (guardado rechazado) o,
    si las fechas nuevas aún no la cruzan, dejándola «Según fechas» sin que nadie lo pidiera (el choque
    sale después, al poner las fechas de la otra, y empuja a apagar la fiesta elegida). Por eso, **solo
    para una temática con alternativa** que está «Apagada» en vigor, cambiar las fechas **no** la
    devuelve a «Según fechas»: sigue «Apagada», `encendido_desde` no cambia y `encendido_hasta` pasa a
    ser el `fin` nuevo (lo que ya hace la función). Una alternativa «Encendida ya» a la que le cambian
    las fechas, y cualquier otra temática, siguen como hoy.
  - **El año siguiente** (lo que más puede morder): una «Apagada» caduca cuando pasa su fin, y
    `guardar_tematica` la devuelve antes a «Según fechas» (0047, el primer `update`). Si las dos
    siguen con las fechas de 2027, ese paso deja a las dos «Según fechas» en ventanas que se cruzan y
    **la base rechaza el guardado**, aunque el negocio esté poniendo las fechas de 2028 y eligiendo
    «Apagada». La regla tiene que dejar pasar ese caso. _Llamada mía:_ entre alternativas, dos
    ventanas que **ya terminaron las dos** (fin < hoy) no se cruzan, porque ninguna puede encenderse.
    Lo fija una prueba pgTAP que simula el año siguiente (ver §7).
- Las dos filas (§4), insertadas con los triggers de autoría y de auditoría apagados (como 0049).
  **Primero Halloween y después la Canción Criolla «Apagada»**: así la regla nueva ya acepta la
  segunda. El trigger de reglas **no** se apaga: que la propia migración pase por él es la primera
  prueba de que la excepción funciona.
- `guardar_tematica`, `tematica_activa_id`, las vistas y la RLS: sin cambios.
- Producción no carga semillas: las filas van en la migración. **Sola en su PR**, y se para hasta que
  Dan haga `supabase db push` desde `PIMPOS_SYSTEM` y fusione.

### 6.2 Código (sin cambios de base)

- **Catálogo** (`src/lib/tematicas/disenos.ts`): dos entradas nuevas.
  - `halloween`: artículo `""`; estilos `calabaza-noche` — «Noche de calabazas»: «Todo el sitio de
    noche, en morado casi negro, con naranja calabaza.»; `calabaza-crema` — «Calabaza sobre crema»: «El
    crema de siempre, con naranja calabaza y la barra de arriba casi negra.»
  - `cancion-criolla`: artículo `"el"`; estilos `rojo-blanco` — «Rojo y blanco»: «El crema de siempre,
    con el rojo de la bandera.»; `balcon` — «Balcón limeño»: «Crema con madera tallada y flores de
    buganvilla.»
  - **Alternativas**: el catálogo dice que `halloween` y `cancion-criolla` lo son entre sí (p. ej. un
    campo `alternativa` en cada entrada), la misma lista que la regla de la base. Lo usa el panel
    (abajo) y lo comprueba un Vitest (que es simétrico).
- `src/lib/tematicas/estilos.ts`: `ESTILOS` gana los cuatro valores nuevos (y su comentario deja de
  enumerar dos temáticas).
- **Panel** (`formulario-tematica.tsx`): la pestaña Estilo ya enseña solo los de cada temática. En la
  pestaña Cuándo de una temática con alternativa, **una línea de ayuda** bajo «Cómo se enciende»:
  «Halloween y el Día de la Canción Criolla son para la misma fiesta: solo una puede estar encendida.
  La otra déjala «Apagada»; seguirá apagada aunque le cambies las fechas.» (_llamada mía_: es un texto
  de ayuda, no una función nueva; ayuda a quien tiene nivel básico a no tropezar con el error). Si el
  panel tiene escrito en algún sitio que «al cambiar las fechas vuelve a Según fechas», en una temática
  con alternativa no se enseña o se matiza.
- **Historial** (`src/lib/auditoria/campos.ts`): las cuatro etiquetas nuevas.
- **Sitio** (`src/lib/datos/tematica.ts`): los slugs nuevos entran por el catálogo; los tipos se
  amplían solos.
- `RUTAS_DEL_PANEL` (`e2e/panel-accesibilidad.spec.ts`): las dos pantallas nuevas del panel.

### 6.3 Aspecto (`src/estilos/tematicas.css`)

Todo bajo `[data-tematica="halloween"]` o `[data-tematica="cancion-criolla"]`, con los tokens también
en `:root:has(...)` y dentro de `@media screen`, como las demás. **Ningún componente cambia de
clases ni de HTML.** A diferencia del Día de la Madre, **los adornos cambian con el estilo**, así que
sus reglas llevan también `[data-estilo]`.

**Los huecos que ya existen** (y que se reparten los adornos):

| Hueco                                                                                                                   | Hoy lo usa                                    |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `header::before`, `header::after`                                                                                       | luces y cable / banderines                    |
| `.adornos-tematica` (en `Cabecera`): un `div` `__luces` y cinco `span` `__bola`, cada uno con su `::before` y `::after` | luces y bolas de Navidad; oculto en las demás |
| `::before` y `::after` de la envoltura `[data-tematica]`                                                                | nieve y copos / corazones                     |
| `.seccion-temporada::before`                                                                                            | borde nevado / festón                         |
| `.cinta-tematica li::before`                                                                                            | separadores ✦ / ♥                             |

Las bolas van numeradas con `nth-of-type`: no se añade ningún elemento (trampa de las temáticas).

**Tokens de partida**, de las maquetas aprobadas; el constructor los ajusta lo justo para que
`tematicas.test.ts` mida AA en cada par.

| Token / uso              | Noche de calabazas         | Calabaza sobre crema       | Rojo y blanco              | Balcón limeño              |
| ------------------------ | -------------------------- | -------------------------- | -------------------------- | -------------------------- |
| Fondo                    | `#1d1922`                  | el de siempre              | el de siempre              | `#fbf3e7`                  |
| Texto                    | `#f3ece0`                  | el de siempre              | el de siempre              | `#2c2118`                  |
| Tarjetas                 | `#2a2430`                  | las de siempre             | las de siempre             | `#ffffff`                  |
| Titulares (`--primary`)  | `#f6a04d`                  | `#9a3d0a`                  | `#a61b29`                  | `#5b3a22`                  |
| Botón (`--cta-*`)        | `#f08a2c` con `#1d1922`    | `#b54708` con blanco       | `#a61b29` con blanco       | `#5b3a22` con blanco       |
| Acento pequeño (sellos…) | `#f6a04d`                  | `#9a3d0a`                  | `#c0392b`                  | `#a8326a`                  |
| Caligrafía del título    | **`#c2560f`** (Dan)        | **`#c2560f`** (Dan)        | el acento                  | el acento                  |
| Barra de aviso           | `#f08a2c` con `#1d1922`    | `#2b2230` con `#f6a04d`    | `#a61b29` con blanco       | `#5b3a22` con `#fbe3c0`    |
| Franja y cinta           | `#2a2430` con `#f6a04d`    | `#fde3c4` con `#7a2e05`    | `#f8dcdc` con `#7d1420`    | `#f1dfc6` con `#5b3a22`    |
| Cuenta regresiva (sello) | `#2a2430`, borde `#5a4a36` | `#fff1e3`, borde `#f2c39a` | `#fdf0f0`, borde `#e7b3b7` | `#fff7ec`, borde `#d9c2a4` |
| WhatsApp                 | el verde de siempre        | el verde de siempre        | el verde de siempre        | el verde de siempre        |

**La caligrafía del título en `#c2560f`.** Ese naranja da unos 3.8:1 sobre la noche y 4.2:1 sobre el
crema: pasa el mínimo de **texto grande** (3:1) pero no el de texto normal (4.5:1). Por eso no puede ser
`--acento-texto`, que también pintan sellos y textos pequeños. Va con una regla propia, solo para
`.seccion-temporada .texto-caligrafico` de Halloween (unos 30 px, texto grande), y su par se mide en
`tematicas.test.ts` contra `AA.textoGrande` (3, de `src/lib/utilidades/contraste.ts`), con un
comentario que diga por qué. «Noche de calabazas» necesita
además lo que «Noche de Navidad» ya resolvió para un fondo oscuro (el mapa, el tapiz, el logo y el
precio): el constructor copia esas reglas para el estilo nuevo.

**Adornos de «Noche de calabazas»**

- **Telarañas** en las dos esquinas, bajo la cabecera: `header::before` (izquierda) y `header::after`
  (derecha, la misma baldosa en espejo). SVG en data URI, trazo claro con poca opacidad. Quietas.
- **Esqueletito que saluda**: una bola (el `span` es el hilo, el `::after` el esqueleto en SVG, el
  `::before` el brazo que saluda con su propia animación). Se mece como las bolas.
- **Calabaza sonriente**: otra bola, que se mece.
- **Arañita**: otra bola, que baja y sube despacio con `translate` (el hilo va más largo por arriba,
  tapado por la cabecera, para que no se vea cortado). Ojitos blancos, nada de colmillos.
- **Murciélagos**: dos o tres siluetas pequeñas en una capa de la envoltura (`::before`), que cruzan
  despacio de lado a lado con `translate` sobre una capa más ancha que la pantalla, como los copos. En
  morado apagado, sin brillo. Por debajo de la cabecera (z-20), sin clics.
- Las bolas sobrantes, `display: none` (o una segunda calabaza a 768 px o más: _del constructor_).

**Adornos de «Calabaza sobre crema»**

- **Banderines de papel**: cordel en `header::after` (máscara y el color de un token) y banderines en
  `header::before` (baldosa SVG repetida en horizontal), alternando negro y naranja, con calabazas y
  calaveritas recortadas. Quietos o con un vaivén vertical de 1–2 px, **sin girar la tira** (lección
  del Día de la Madre: a 1280 px los extremos subirían sobre la cabecera).
- **Telaraña** en la esquina derecha: el `div` `__luces` (que en Navidad son las luces), en SVG.
- **Arañita**: una bola, como en el otro estilo.

**Adornos de «Rojo y blanco»**

- **Cordel con notas**: cordel en `header::after`, notas ♪ ♫ en `header::before` (baldosa SVG).
- **Pañuelos de marinera**: dos bolas que se agitan (giro corto y un poco de `skew`).
- **Cajón** (izquierda) y **guitarra** (derecha): dos bolas que se mecen.
- **Notas que suben**: pocas, en los dos seudoelementos de la envoltura, como los corazones del Día de
  la Madre (máscara y color de token, `translate`).

**Adornos de «Balcón limeño»**

- **Celosía de balcón** bajo la cabecera: `header::before` (baldosa SVG repetida, madera oscura).
- **Cajón** y **guitarra** colgando bajo la celosía: dos bolas.
- **Buganvillas** que caen despacio: los seudoelementos de la envoltura, como la nieve, en magenta y
  rosa.

**Comunes a las dos temáticas**

- **Borde de la sección de temporada** (`.seccion-temporada::before`): Halloween, un borde de picos de
  papel recortado; la Canción Criolla, el zigzag de la celosía. Del color del fondo de la sección.
  Formas y tamaños, _del constructor_. Ni la nieve ni el festón se cuelan (ya van acotados a su
  temática).
- **Cinta**: Halloween separa con una calabacita (máscara SVG, `content: ""` y tamaño fijo); la
  Canción Criolla con ♪ (`content: "♪" / ""`). Decorativos, sin leerse en voz alta.
- Movimiento solo con `prefers-reduced-motion: no-preference`; todo quieto con `reduce`; al imprimir,
  ningún adorno (las reglas van al `@media print` existente) y los tokens solo en `@media screen`.
- La cabecera es `sticky`: nunca `position: relative`. Ningún adorno recibe clics ni sube sobre la
  cabecera. Sin desborde a 375 ni a 1280 px.

## 7. Pruebas

- **pgTAP** (`0050_halloween_cancion_criolla.test.sql`):
  - las dos filas con los datos de §4; la Canción Criolla «Apagada» con `encendido_hasta = fin`; sin
    productos; sin autoría ni filas de **alta** en la auditoría (la lección de 0049: filtrar por
    `public.tematicas` y `operacion = 'INSERT'`);
  - pares: `halloween` con `rosa`, `cancion-criolla` con `calabaza-noche`, `navidad` con `balcon` se
    rechazan (23514); los cuatro pares nuevos se aceptan;
  - **la regla**: con las dos «Según fechas» en ventanas que se cruzan, se rechaza con la frase de
    alternativas (contiene «Apagada»); con una «Apagada», se acepta; encender a mano una mientras la
    otra va «Según fechas» se rechaza; Navidad con fechas que pisan las de Halloween y la Canción
    Criolla «Apagada» **se sigue rechazando** con la frase de siempre (la excepción es solo entre
    alternativas); el Día de la Madre igual;
  - con Halloween en fechas alrededor de hoy y la Canción Criolla «Apagada», `tematica_activa_id()` es
    Halloween; al revés, la Canción Criolla; nunca las dos;
  - **cambiar las fechas de la «Apagada» en vigor**: con la Canción Criolla «Apagada» de fábrica y
    Halloween «Según fechas», guardar la Canción Criolla por `guardar_tematica` con otras fechas que
    cruzan las de Halloween y «Apagada» se acepta y sigue «Apagada», con `encendido_hasta` = el fin
    nuevo; con fechas de 2028 (que no cruzan), también sigue «Apagada»; y después poner a Halloween las
    mismas fechas de 2028 y «Según fechas» se acepta. Navidad «Apagada» a la que le cambian las fechas
    **sigue volviendo** a «Según fechas», como hoy;
  - **el año siguiente**: con las dos en fechas que ya pasaron (las de 2027, con «hoy» simulado en
    2028 moviendo las fechas al pasado), guardar la Canción Criolla con fechas nuevas y «Apagada» por
    `guardar_tematica` funciona; y después guardar Halloween con las mismas fechas nuevas y «Según
    fechas» también;
  - 0047, 0048 y 0049 siguen pasando: sus fixtures que apartan temáticas apartan también las dos
    nuevas (simular fechas de abril a octubre, cuando `hoy + 200` caería en octubre).
- **Vitest**: catálogo (slugs, estilos sin repetir, unión = `ESTILOS`, alternativas simétricas), estilos
  por temática (`opcionesDeEstilo`, `comoEstilo` con lo desconocido), nombres en frase («el Día de la
  Canción Criolla», «del Día de la Canción Criolla», «Halloween», «de Halloween»), cuenta regresiva con
  y sin artículo, validación por temática (un estilo de otra temática da la frase de Zod), etiquetas
  del Historial, y en `tematicas.test.ts` los contrastes de los cuatro estilos (más la caligrafía en
  `#c2560f` contra el umbral de texto grande).
- **E2E del panel** (`panel-tematicas.spec.ts`): cada temática nueva enseña solo sus dos estilos; la
  lista enseña las cuatro; la línea de ayuda de alternativas sale en Halloween y en la Canción Criolla
  y no en Navidad; poner la Canción Criolla «Según fechas» con Halloween también «Según fechas» da la
  frase de alternativas; apagando antes Halloween, se guarda; cambiar las fechas de la Canción Criolla
  «Apagada» la deja «Apagada».
- **Las ayudas de las E2E** (`e2e/ayudas/tematicas.ts`, _llamada mía_ tras la revisión): hoy
  `apartarLasDemas` lleva todas las demás temáticas a la **misma** ventana (hoy+400 a hoy+410) y al
  deshacer las devuelve todas a «Según fechas». Con cuatro temáticas, las apartadas chocarían entre sí
  y la Canción Criolla volvería a «Según fechas», chocando con Halloween: caerían ya en T1 las E2E de
  Navidad, del Día de la Madre y del panel. Cada temática apartada va a **su propia** ventana (sin
  cruzarse entre ellas) y al deshacer cada una recupera su `encendido` de antes, en un orden fijo:
  primero las que estaban «Apagada», después las demás.
- **E2E del sitio** (`tematica-halloween.spec.ts` y `tematica-cancion-criolla.spec.ts`, en el proyecto
  `tematicas`, añadidas a `PRUEBAS_DE_TEMATICAS`, con el cerrojo `tematicas` y `apartarLasDemas`),
  encendiendo **desde el panel**, con el modelo de `tematica-dia-de-la-madre.spec.ts`:
  - `data-tematica` y `data-estilo` con cada estilo; la barra dice el aviso; la región «Mensajes de
    Halloween» / «Mensajes del Día de la Canción Criolla»; la sección con su título y la cuenta
    regresiva («Faltan 3 días para Halloween», «… para el Día de la Canción Criolla»);
  - los adornos de cada estilo (los de §6.3) se animan con movimiento; con `reducedMotion: "reduce"`,
    nada animado; con `media: "print"`, ningún adorno visible; ninguno recibe clics; nada sobre la
    cabecera; sin desborde a 375 y 1280 px;
  - ningún adorno de otra temática (luces, bolas de Navidad, nieve, borde nevado, banderines rosa,
    corazones, festón);
  - axe en cero en las 11 rutas a 375 px y en escritorio, con los dos estilos; ningún control de menos
    de 44 px en la sección;
  - «Según fechas» con las fechas de fábrica → sin `data-tematica`.
- Las E2E existentes de Navidad, del Día de la Madre y del panel siguen pasando.

## 8. Lo que queda al constructor

- Los SVG (telarañas, esqueletito y su brazo, calabaza, arañita, murciélagos, banderines de papel,
  notas, pañuelos, cajón, guitarra, celosía, buganvillas, bordes de sección), sus tamaños y posiciones
  a 375 y 1280 px, y qué bola hace de qué.
- Los tokens finales que hagan pasar AA.
- Cómo se escribe en SQL el par de alternativas y la regla de «ya terminaron las dos», siempre que
  pasen las pruebas de §7.
- El nombre exacto del campo de alternativas en `disenos.ts`.
- Manual (`docs/tematicas.md`), `AGENTS.md` (tabla y cuenta de migraciones, temáticas, trampas) y
  capturas a 375 y 1280 px con los cuatro estilos.

---

# Plan de tareas

> **Para quien lo ejecute:** la sesión principal implementa (`superpowers:executing-plans`) y un
> subagente (opus) revisa la rama antes de cada PR; lo Importante se arregla con su prueba vista fallar
> primero. Los pasos van con casillas (`- [ ]`).

**Objetivo:** las temáticas `halloween` y `cancion-criolla`, con dos estilos cada una y sus adornos, que
comparten fechas y de las que solo una puede estar encendida.

**Arquitectura:** el catálogo del código (`src/lib/tematicas/disenos.ts`) dice qué temáticas tienen
diseño, sus estilos, su artículo y su alternativa; la base repite la misma lista (0050) como
restricción de pares y como excepción en la regla de cruces. El aspecto es CSS bajo `[data-tematica]`
y `[data-estilo]`, sin componentes nuevos.

**Stack:** Next 16, Postgres (Supabase) con pgTAP, Vitest, Playwright con axe.

**Spec:** la mitad de arriba de este documento.

## Restricciones de todo el plan

- Commits y PR **solo con Dan de autor**: nada de `Co-Authored-By: Claude`, `Claude-Session:` ni
  «Generated with Claude Code». Conventional Commits en español.
- **PR 1 = T1** (lleva la 0050), solo; se para hasta que Dan haga `supabase db push` desde
  `PIMPOS_SYSTEM` y fusione. **PR 2 = T2** (Halloween en el sitio). **PR 3 = T3** (la Canción Criolla
  en el sitio). Cada uno desde `main` actualizado. (T2 y T3 no llevan migración y podrían ir juntas;
  van separadas para que cada una tenga su revisión y sus capturas.)
- Los tokens de una temática van en `@media screen` y también en
  `:root:has([data-tematica=…][data-estilo=…])`.
- La cabecera es `sticky`: **nunca** `position: relative`. Ningún adorno recibe clics.
- Todo movimiento dentro de `prefers-reduced-motion: no-preference`; al imprimir, ningún adorno.
- Sin temática activa el HTML no cambia. Sin JavaScript para los adornos, sin librerías, sin imágenes
  pesadas (SVG en data URI).
- Textos en español y sin jerga. AA medido en `src/estilos/tematicas.test.ts`.
- E2E contra el build (`pnpm build` + `pnpm start`), liberando antes el puerto 3000; las de temáticas
  con `pnpm exec playwright test --project=tematicas --no-deps`.
- Una E2E enciende la temática **desde el panel**; el SQL solo prepara y limpia.
- Antes de cada PR del sitio, capturas a 375 y 1280 px con los dos estilos, enseñadas a Dan. Después,
  todas las temáticas locales en «Según fechas» (la Canción Criolla, en su «Apagada» de fábrica) con
  sus fechas y estilos de fábrica.

## Lo que más puede morder (y la prueba que lo fija)

1. **Cambiar las fechas de la «Apagada»** la devuelve a «Según fechas» y choca, ahora o al poner las
   fechas de la otra → T1, pgTAP «cambiar las fechas de la Apagada en vigor».
1. **El año siguiente**, la que no se celebra no se puede guardar con sus fechas nuevas → T1, pgTAP
   «el año siguiente».
1. **`apartarLasDemas` con cuatro temáticas** tumba las E2E existentes → T1, E2E de Navidad, del Día
   de la Madre y del panel en verde.
1. **Las dos encendidas a la vez** (por el panel o por la API) → T1, pgTAP de la regla.
1. **La excepción se escapa a Navidad o al Día de la Madre** → T1, pgTAP con Navidad pisando las fechas
   de Halloween.
1. **Pruebas viejas que fallan según el mes** (fixtures que apartan solo el Día de la Madre) → T1,
   simular fechas en la base local como se hizo en el 08.1.
1. **`#c2560f` usado en texto pequeño** → T2, `tematicas.test.ts` mide `--acento-texto` a 4.5 y la
   caligrafía aparte, y axe en las 11 páginas.
1. **Adornos de un estilo en el otro** (banderines en la noche, murciélagos en el crema) → T2/T3, E2E
   por estilo.

---

### Tarea 1: Las dos temáticas, sus estilos y la regla de alternativas (0050) — PR 1

**Archivos:**

- Crear: `supabase/migrations/0050_halloween_cancion_criolla.sql`,
  `supabase/tests/0050_halloween_cancion_criolla.test.sql`
- Modificar: `supabase/tests/0047_tematicas.test.sql`, `0048_estilo_tematica.test.sql`,
  `0049_dia_de_la_madre.test.sql` (fixtures que apartan temáticas, si hace falta),
  `src/lib/tematicas/disenos.ts` (+ test), `src/lib/tematicas/estilos.ts` (+ test),
  `src/lib/tematicas/nombre.test.ts`, `src/lib/tematicas/cuenta-regresiva.test.ts`,
  `src/lib/validaciones/tematica.test.ts`, `…/tematicas/[slug]/formulario-tematica.tsx`,
  `src/lib/auditoria/campos.ts`, `src/tipos/database.types.ts` (regenerado),
  `e2e/panel-tematicas.spec.ts`, `e2e/panel-accesibilidad.spec.ts` (`RUTAS_DEL_PANEL`),
  `e2e/ayudas/tematicas.ts` (`apartarLasDemas`), `AGENTS.md` (tabla de migraciones)

**Interfaces:**

- Produce (`disenos.ts`): entradas `halloween` (artículo `""`) y `cancion-criolla` (artículo `"el"`),
  con sus estilos (§6.2) y su alternativa; una ayuda `alternativaDe(slug): SlugConDiseno | null`.
- Produce (`estilos.ts`): `ESTILOS` con `calabaza-noche`, `calabaza-crema`, `rojo-blanco`, `balcon`.
- Produce (base): restricciones `tematicas_slug_conocido` y `tematicas_estilo_de_su_tematica`
  ampliadas; `app.tematicas_reglas` con la excepción de alternativas; filas `halloween` y
  `cancion-criolla`.

- [ ] **Paso 1: pgTAP que falla** — los casos de §7 (base).
- [ ] **Paso 2:** `supabase test db supabase/tests/0050_halloween_cancion_criolla.test.sql` → falla.
- [ ] **Paso 3: la migración.** Cabecera comentada como 0049. Restricciones (drop + add con el mismo
      nombre); `create or replace` de `app.tematicas_reglas` copiando la de 0047 entera y cambiando solo el
      segundo `if` (la «Apagada» de una alternativa no vuelve a «Según fechas» al cambiar las fechas), la
      consulta del cruce y su frase (§6.1); las dos filas, primero Halloween, con los triggers de autoría y
      auditoría apagados y vueltos a encender (el de reglas, encendido).
- [ ] **Paso 4: fixtures viejas.** Simular en la base local fechas de enero a octubre (como en el 08.1)
      y correr 0047–0049; donde apartan el Día de la Madre, apartar también las dos nuevas.
- [ ] **Paso 5:** `supabase db reset` (luego `bash supabase/seeds/imagenes/subir-imagenes.sh`) y
      `supabase test db` → **todas** pasan.
- [ ] **Paso 6:** `pnpm supabase:tipos`.
- [ ] **Paso 7: Vitest que falla** (§7, sin los contrastes, que son de T2/T3).
- [ ] **Paso 8:** `pnpm test` → fallan esas.
- [ ] **Paso 9: el código** (§6.2): catálogo con alternativas, `ESTILOS`, la línea de ayuda en la pestaña
      Cuándo (sale solo si `alternativaDe(slug)` existe), etiquetas del Historial.
- [ ] **Paso 10:** `pnpm typecheck`, `pnpm lint`, `pnpm test` → en verde.
- [ ] **Paso 11: E2E del panel** (§7), `apartarLasDemas` con una ventana por temática y su
      `encendido` de vuelta (§7), y las dos rutas nuevas en `RUTAS_DEL_PANEL`. Verlas fallar contra
      un build sin el paso 9; después, todas las E2E de temáticas y las del panel de temáticas en verde.
- [ ] **Paso 12:** `AGENTS.md`: fila `0050_halloween_cancion_criolla` y la cuenta de migraciones.
      Revisión de la rama por un subagente (opus) y arreglos. Commit
      `feat(tematicas): Halloween y el Día de la Canción Criolla, alternativas para el 31 de octubre (0050)`,
      PR 1 y **parar**.

### Tarea 2: Halloween en el sitio — PR 2

**Archivos:**

- Modificar: `src/estilos/tematicas.css`, `src/estilos/tematicas.test.ts`, `playwright.config.ts`
  (`PRUEBAS_DE_TEMATICAS`), `docs/tematicas.md`, `AGENTS.md`, este documento («Lo que resultó
  distinto»)
- Crear: `e2e/tematica-halloween.spec.ts`, capturas en `DOC/Maquetas/tematicas/halloween/implementada/`

- [ ] **Paso 1: Vitest que falla.** En `tematicas.test.ts`, los pares de «Noche de calabazas» y
      «Calabaza sobre crema» al nivel de los demás estilos, más la caligrafía `#c2560f` contra el umbral de
      texto grande, con su comentario. Falla (no están los bloques).
- [ ] **Paso 2: tokens** de §6.3 en `@media screen` y `:root:has(...)`, ajustados hasta que pase; y las
      reglas de fondo oscuro de «Noche de Navidad» copiadas para «Noche de calabazas».
- [ ] **Paso 3: E2E que falla** (§7, sitio), con el modelo de `tematica-dia-de-la-madre.spec.ts` y las
      ayudas de `e2e/ayudas/tematicas.ts`. Correr contra un build sin el CSS de adornos: falla.
- [ ] **Paso 4: adornos** de los dos estilos (§6.3), con su movimiento solo en `no-preference` y todo en
      el `@media print`.
- [ ] **Paso 5:** build y E2E de temáticas enteras → en verde. `pnpm typecheck`, `pnpm lint`,
      `pnpm test`.
- [ ] **Paso 6: capturas** a 375 y 1280 px con los dos estilos, encendiendo desde el panel; mirarlas y
      **enseñárselas a Dan** antes del PR. Después, las temáticas locales en su estado de fábrica.
- [ ] **Paso 7: documentación.** `docs/tematicas.md`: Halloween, sus estilos, y **cómo elegir entre
      Halloween y la Canción Criolla** (apagar una, dejar la otra «Según fechas»; cada año se ponen las
      fechas nuevas a las dos y la apagada sigue apagada; para cambiar de fiesta, primero se apaga la que
      estaba y después se pone la otra en «Según fechas»). `AGENTS.md`: temáticas (y una trampa si sale alguna). Este documento: «Lo
      que resultó distinto».
- [ ] **Paso 8:** revisión de la rama por un subagente (opus); arreglos con su prueba vista fallar.
      Commits `feat(tematicas): Halloween en el sitio, con sus dos estilos` y `docs(tematicas): …`; PR 2 y
      parar.

### Tarea 3: El Día de la Canción Criolla en el sitio — PR 3

Igual que la T2, con `e2e/tematica-cancion-criolla.spec.ts`, los pares de «Rojo y blanco» y «Balcón
limeño», sus adornos (§6.3), capturas en `DOC/Maquetas/tematicas/cancion-criolla/implementada/`
enseñadas a Dan, el manual (la Canción Criolla y sus estilos) y «Lo que resultó distinto». Commits
`feat(tematicas): el Día de la Canción Criolla en el sitio, con sus dos estilos` y `docs(tematicas): …`;
PR 3 y parar.

---

## Lo que resultó distinto

**T1 (20/11/2026, PR 1).**

- **La línea de ayuda de las alternativas** es una función pura (`avisoDeAlternativa`, en
  `src/lib/tematicas/nombre.ts`) con su Vitest, y el panel la recibe ya escrita; la frase «Si cambias
  las fechas, vuelve a «Según fechas»» no sale en la «Apagada» de una alternativa.
- **Las dos pruebas cortas del panel que usan el cerrojo `tematicas`** pasan a 300 s: con la prueba
  nueva, la del Día de la Madre agotaba su espera en la cola del cerrojo.
- **La revisión de la rama** encontró que las fixtures (pgTAP 0047–0050 y la E2E del panel) dependían
  de la «Apagada» de fábrica de la Canción Criolla, que caduca el 01/11/2027: desde el día siguiente,
  moverla por las reglas la pasaría a «según fechas» y chocaría con Halloween, y el CI quedaría en
  rojo solo. Y la semana de la campaña, `preparar` deja Halloween apagada y la E2E no veía la frase.
  Ahora las fixtures escriben el estado entero sin pasar por las reglas (trigger apagado, modo
  explícito; en la E2E, dentro de una transacción). Se vio fallar antes con los dos estados simulados.

**T1, después del PR.** La 0050 se aplicó en producción desde `PIMPOS_SYSTEM` (huella igual a la
local, las dos filas como deben) y el PR #112 se fusionó, por pedido de Dan.

**T2 (20/11/2026, PR 2).**

- **WhatsApp en «Noche de calabazas»** va en verde claro con letra verde oscura, como en «Noche de
  Navidad», y no «el verde de siempre» de la tabla del §6.3: el verde de siempre no se ve sobre la
  noche. Lo mide `tematicas.test.ts` (el botón contra el fondo, 3:1).
- **El borde de papel de la noche** es naranja a media opacidad: el morado de la tabla no se veía.
- **La arañita** sube y baja alargando su hilo (1 px de ancho), no con `translate`: así el hilo siempre
  empieza en el borde de la cabecera y nada sube sobre ella.
- **«Sobre la cabecera»** se mide contra el final del relleno (donde empieza `inset: 100%`), como con los
  banderines del Día de la Madre: los hilos empiezan sobre el borde de 1 px de la cabecera.
- **Verificación:** Vitest 659 (35 pares de contraste nuevos), E2E de temáticas 8/8 (axe en cero en las
  11 páginas con los dos estilos, a 375 px y en escritorio; vista fallar antes sin los adornos).
  Capturas en `DOC/Maquetas/tematicas/halloween/implementada/`.

**T2, después del PR.** La revisión de la rama encontró que el manual (y la ayuda del panel, de la T1)
prometían que la «Apagada» seguía al año siguiente; ya venció para entonces: ahora dicen que cada año
se vuelve a elegir. El PR #113 se fusionó, por pedido de Dan.

**T3 (20/11/2026, PR 3).**

- **Las notas del cordel de «Rojo y blanco»** son blancas con borde rojo, como los pañuelos, y no rojas:
  en escritorio el cordel cruza el bloque rojo del titular del carrusel y las notas rojas desaparecían
  (se vio en las capturas).
- **En «Balcón limeño»** lo que cuelga empieza debajo de la celosía (21 px más abajo), para no colgar
  de la madera.
- **El aviso de fábrica** («Feliz Día de la Canción Criolla: pan calientito y buena música») ocupa dos
  líneas a 375 px. No se cambia por migración: el negocio puede acortarlo desde el panel.
- **El manual** ya dice «Fecha de Halloween / del Día de la Canción Criolla» y que la caligrafía cae en
  el nombre de la fiesta (dos menores aplazados de la T2).
- **El acento de «Rojo y blanco»** se probó un rato con `#b8303a` y quedó en el `#c0392b` del plan. La
  revisión de la rama vio que ese rojo también pinta enlaces sobre el pie y los encabezados (`--muted`,
  4.53:1, justo por encima del mínimo) y que ningún par lo medía: ahora lo mide `tematicas.test.ts` en
  los dos estilos (se vio fallar con un rojo más claro). La E2E y las capturas se repitieron con el
  color final.
- **Sin comprobación de 44 px en la sección**: la de la T2 no podía fallar sin productos (menor aplazado
  de la T2), así que la E2E de la Canción Criolla no la copia.
- **Los pañuelos solo giran**, sin el `skew` del §6.3: con el giro ya se ve que se agitan.
- **Verificación:** Vitest 690 (31 pares de contraste nuevos), E2E de temáticas 9/9 (axe en cero en las
  11 páginas con los dos estilos, a 375 px y en escritorio; vista fallar antes sin los adornos).
  Capturas en `DOC/Maquetas/tematicas/cancion-criolla/implementada/`.
