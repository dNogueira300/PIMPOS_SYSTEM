#!/usr/bin/env python3
"""Descarga Playfair Display, Plus Jakarta Sans y Dancing Script y las deja listas.

    pip install fonttools brotli
    python scripts/preparar-fuentes.py             # todas
    python scripts/preparar-fuentes.py dancing     # solo las nombradas

Nombrar las fuentes evita rehacer las demas: si Google Fonts publico otra
version de Playfair desde la ultima vez, volver a correrlo todo cambiaria un
archivo que nadie pidio tocar.

Dos salidas por fuente, porque las usan dos motores distintos:

- `src/estilos/fuentes/*-latin.woff2`: recortadas a latin. Las sirve
  `next/font/local`. Playfair y Jakarta van variables; Dancing Script, fijada
  en un solo peso (INSTANCIA_WEB), porque el sitio solo usa ese.
- `src/recursos/compartir/*.ttf`: estaticas, de un solo peso. `ImageResponse`
  (`next/og`) no acepta woff2 ni maneja bien las fuentes variables (ver la
  trampa en AGENTS.md), asi que la imagen para compartir necesita las suyas.
  Dancing Script no tiene: la imagen para compartir no la usa.

Las tres son OFL 1.1 y salen del repositorio oficial de Google Fonts: se
descargan UNA vez, aqui, y se versionan. El sitio nunca llama a Google en
tiempo de ejecucion — ni a fonts.googleapis.com ni a fonts.gstatic.com.

Existe como guion, y no como un par de archivos bajados a mano, para que el
recorte sea repetible: si hace falta otro caracter o otro peso, se cambia aqui
y se vuelve a correr.
"""

import subprocess
import sys
import urllib.request
from pathlib import Path

BASE = "https://raw.githubusercontent.com/google/fonts/main/ofl"

# nombre -> (url del TTF variable, carpeta de la licencia, peso de la instancia
# estatica para la imagen de compartir, o None si la imagen no la usa). Desde la
# direccion A la imagen para compartir usa solo Jakarta, asi que Playfair ya no
# genera la suya: `src/recursos/compartir/playfair-700.ttf` queda como estaba.
FUENTES = {
    "playfair": (f"{BASE}/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf", "playfairdisplay", None),
    "jakarta": (f"{BASE}/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf", "plusjakartasans", 500),
    "dancing": (f"{BASE}/dancingscript/DancingScript%5Bwght%5D.ttf", "dancingscript", None),
}

# Fuentes cuyo archivo web se fija en un solo peso en vez de ir variable, porque
# el sitio solo escribe ese. Las dos solo las baja el sitio publico, y medido
# con Lighthouse cada KB de fuente le cuesta a la portada: Playfair variable
# entera pesaba 49 KB y, con la caligrafia, le quitaba 8 puntos a la portada.
# - Playfair, en negrita (700): los titulos de la maqueta que eligio Dan.
# - Dancing Script, en seminegrita (600): 43 KB la variable, 26 la instancia.
INSTANCIA_WEB = {"playfair": 700, "dancing": 600}

# Caracteristicas OpenType que se conservan. "*" las deja todas; en las dos del
# sitio publico se quitan las que ningun texto usa (versalitas, fracciones,
# ordinales, superindices, alternativas): en Playfair son un tercio del archivo.
# Se quedan el interletraje y las ligaduras, las cifras alineadas (`lnum`, que
# piden los titulos) y, en la caligrafia, las formas de inicio, medio y final
# de palabra, que son las que enlazan las letras.
CARACTERISTICAS = {
    "playfair": "kern,liga,calt,locl,ccmp,mark,mkmk,lnum",
    "dancing": "kern,liga,calt,locl,ccmp,mark,mkmk,init,medi,fina",
}

# Latin basico y latin-1 (tildes, ñ, ¿, ¡, °), mas la tipografia que el sitio
# escribe de verdad: rayas, comillas curvas y angulares, punto medio, puntos
# suspensivos. Sin cirilico, griego ni vietnamita: son la mitad del peso y el
# sitio no los usa.
UNICODES = ",".join(
    [
        "U+0000-00FF",  # latin basico + latin-1 (incluye « » · ° ñ á é ...)
        "U+0131",  # i sin punto
        "U+0152-0153",  # OE oe
        "U+2013-2014",  # – —
        "U+2018-201E",  # ‘ ’ ‚ “ ” „
        "U+2022",  # •
        "U+2026",  # …
        "U+20AC",  # €
        "U+2122",  # ™
        "U+2192",  # → (enlaces "Ver el catalogo →")
    ]
)

# Playfair Display declara "Playfair Display" como Reserved Font Name en su
# OFL, y la licencia (seccion 3) prohibe que una VERSION MODIFICADA lleve ese
# nombre. Recortar a latin y fijar un peso son modificaciones, asi que las
# derivadas se renombran por dentro. Dancing Script declara lo mismo («Dancing
# Script»). Plus Jakarta Sans no declara ninguno. Fraunces e Inter tampoco lo
# declaraban: por eso en F1 no hizo falta.
# El nombre CSS que usa el sitio lo pone `next/font`, no esta tabla.
RENOMBRAR = {
    "playfair": ("Playfair Display", "Playfair Pimpos"),
    "dancing": ("Dancing Script", "Dancing Pimpos"),
}

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / ".fuentes-origen"
WEB = RAIZ / "src/estilos/fuentes"
OG = RAIZ / "src/recursos/compartir"


def ejecutar(*argumentos: str) -> None:
    subprocess.run([sys.executable, "-m", *argumentos], check=True)


# Registros de la tabla `name` que se dejan tal cual: el aviso de copyright (0),
# la marca (7) y la licencia (13, 14). La OFL obliga a CONSERVAR el aviso de
# copyright, y el nombre reservado solo afecta a como se llama la fuente, no a
# quien la hizo. Hasta noviembre de 2026 el guion los reescribia tambien, y
# `playfair-latin.woff2` lleva todavia «The Playfair Pimpos Project Authors».
SIN_RENOMBRAR = {0, 7, 13, 14}


def renombrar(archivo: Path, viejo: str, nuevo: str) -> None:
    """Quita el Reserved Font Name de los nombres de una derivada."""
    from fontTools.ttLib import TTFont

    fuente = TTFont(archivo)
    sin_espacios = (viejo.replace(" ", ""), nuevo.replace(" ", ""))
    for registro in fuente["name"].names:
        if registro.nameID in SIN_RENOMBRAR:
            continue
        texto = registro.toUnicode()
        cambiado = texto.replace(viejo, nuevo).replace(*sin_espacios)
        if cambiado != texto:
            registro.string = cambiado
    fuente.save(archivo)

    quedan = [
        r.toUnicode()
        for r in TTFont(archivo)["name"].names
        if r.nameID not in SIN_RENOMBRAR and viejo.replace(" ", "") in r.toUnicode().replace(" ", "")
    ]
    if quedan:
        raise SystemExit(f"{archivo.name} sigue llevando el nombre reservado: {quedan}")


def descargar(url: str, destino: Path) -> None:
    if destino.exists():
        return
    print(f"  descargando {destino.name}...")
    urllib.request.urlretrieve(url, destino)


def main(nombres: list[str]) -> int:
    desconocidas = [n for n in nombres if n not in FUENTES]
    if desconocidas:
        raise SystemExit(f"No conozco {desconocidas}; las fuentes son {list(FUENTES)}")
    ORIGEN.mkdir(exist_ok=True)

    for nombre in nombres or list(FUENTES):
        url, carpeta, peso_og = FUENTES[nombre]
        print(f"{nombre}:")
        variable = ORIGEN / f"{nombre}.ttf"
        descargar(url, variable)
        descargar(f"{BASE}/{carpeta}/OFL.txt", ORIGEN / f"{nombre}-OFL.txt")

        # 1. Para el sitio: recortada, en woff2. Variable, salvo que se fije un
        #    solo peso en INSTANCIA_WEB.
        origen_web = variable
        if nombre in INSTANCIA_WEB:
            peso = INSTANCIA_WEB[nombre]
            origen_web = ORIGEN / f"{nombre}-{peso}-web.ttf"
            ejecutar("fontTools.varLib.instancer", str(variable), f"wght={peso}", "-o", str(origen_web))
        web = WEB / f"{nombre}-latin.woff2"
        ejecutar(
            "fontTools.subset",
            str(origen_web),
            f"--unicodes={UNICODES}",
            "--flavor=woff2",
            f"--layout-features={CARACTERISTICAS.get(nombre, '*')}",
            f"--output-file={web}",
        )
        if nombre in RENOMBRAR:
            renombrar(web, *RENOMBRAR[nombre])
        resumen = f"  {web.name}: {web.stat().st_size / 1024:.0f} KB"

        # 2. Para la imagen de compartir: un solo peso, estatica, en ttf.
        if peso_og is not None:
            estatica = ORIGEN / f"{nombre}-{peso_og}-completa.ttf"
            ejecutar("fontTools.varLib.instancer", str(variable), f"wght={peso_og}", "-o", str(estatica))
            og = OG / f"{nombre}-{peso_og}.ttf"
            ejecutar("fontTools.subset", str(estatica), f"--unicodes={UNICODES}", f"--output-file={og}")
            if nombre in RENOMBRAR:
                renombrar(og, *RENOMBRAR[nombre])
            resumen += f" · {og.name}: {og.stat().st_size / 1024:.0f} KB"

        print(resumen)

    # Lo que puede llegar a bajar el sitio publico: todas las del directorio,
    # no solo las de esta pasada.
    total_web = sum(f.stat().st_size for f in WEB.glob("*-latin.woff2"))
    print(f"\nwoff2 del sitio: {total_web / 1024:.0f} KB en total (techo de la prueba: 140 KB)")
    print(f"Avisos de licencia OFL descargados en {ORIGEN.name}/: van a LICENCIA.md de cada carpeta.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
