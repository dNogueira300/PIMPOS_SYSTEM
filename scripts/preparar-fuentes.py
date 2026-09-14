#!/usr/bin/env python3
"""Descarga Playfair Display y Plus Jakarta Sans y las deja listas para el sitio.

    pip install fonttools brotli
    python scripts/preparar-fuentes.py

Dos salidas por fuente, porque las usan dos motores distintos:

- `src/estilos/fuentes/*-latin.woff2`: variables, recortadas a latin. Las sirve
  `next/font/local` a todo el sitio.
- `src/recursos/compartir/*.ttf`: estaticas, de un solo peso. `ImageResponse`
  (`next/og`) no acepta woff2 ni maneja bien las fuentes variables (ver la
  trampa en CLAUDE.md), asi que la imagen para compartir necesita las suyas.

Las dos son OFL 1.1 y salen del repositorio oficial de Google Fonts: se
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
# estatica para la imagen de compartir)
FUENTES = {
    "playfair": (f"{BASE}/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf", "playfairdisplay", 700),
    "jakarta": (f"{BASE}/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf", "plusjakartasans", 500),
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
# derivadas se renombran por dentro. Plus Jakarta Sans no declara ninguno.
# Fraunces e Inter tampoco lo declaraban: por eso en F1 no hizo falta.
# El nombre CSS que usa el sitio lo pone `next/font`, no esta tabla.
RENOMBRAR = {"playfair": ("Playfair Display", "Playfair Pimpos")}

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / ".fuentes-origen"
WEB = RAIZ / "src/estilos/fuentes"
OG = RAIZ / "src/recursos/compartir"


def ejecutar(*argumentos: str) -> None:
    subprocess.run([sys.executable, "-m", *argumentos], check=True)


def renombrar(archivo: Path, viejo: str, nuevo: str) -> None:
    """Quita el Reserved Font Name de la tabla `name` de una derivada."""
    from fontTools.ttLib import TTFont

    fuente = TTFont(archivo)
    sin_espacios = (viejo.replace(" ", ""), nuevo.replace(" ", ""))
    for registro in fuente["name"].names:
        texto = registro.toUnicode()
        cambiado = texto.replace(viejo, nuevo).replace(*sin_espacios)
        if cambiado != texto:
            registro.string = cambiado
    fuente.save(archivo)

    quedan = [r.toUnicode() for r in TTFont(archivo)["name"].names if viejo in r.toUnicode()]
    if quedan:
        raise SystemExit(f"{archivo.name} sigue llevando el nombre reservado: {quedan}")


def descargar(url: str, destino: Path) -> None:
    if destino.exists():
        return
    print(f"  descargando {destino.name}...")
    urllib.request.urlretrieve(url, destino)


def main() -> int:
    ORIGEN.mkdir(exist_ok=True)
    total_web = 0

    for nombre, (url, carpeta, peso_og) in FUENTES.items():
        print(f"{nombre}:")
        variable = ORIGEN / f"{nombre}.ttf"
        descargar(url, variable)
        descargar(f"{BASE}/{carpeta}/OFL.txt", ORIGEN / f"{nombre}-OFL.txt")

        # 1. Para el sitio: variable, recortada, en woff2.
        web = WEB / f"{nombre}-latin.woff2"
        ejecutar(
            "fontTools.subset",
            str(variable),
            f"--unicodes={UNICODES}",
            "--flavor=woff2",
            "--layout-features=*",
            f"--output-file={web}",
        )
        if nombre in RENOMBRAR:
            renombrar(web, *RENOMBRAR[nombre])
        total_web += web.stat().st_size

        # 2. Para la imagen de compartir: un solo peso, estatica, en ttf.
        estatica = ORIGEN / f"{nombre}-{peso_og}-completa.ttf"
        ejecutar("fontTools.varLib.instancer", str(variable), f"wght={peso_og}", "-o", str(estatica))
        og = OG / f"{nombre}-{peso_og}.ttf"
        ejecutar("fontTools.subset", str(estatica), f"--unicodes={UNICODES}", f"--output-file={og}")
        if nombre in RENOMBRAR:
            renombrar(og, *RENOMBRAR[nombre])

        print(f"  {web.name}: {web.stat().st_size / 1024:.0f} KB · {og.name}: {og.stat().st_size / 1024:.0f} KB")

    print(f"\nwoff2 del sitio: {total_web / 1024:.0f} KB en total (techo de la prueba: 140 KB)")
    print(f"Avisos de licencia OFL descargados en {ORIGEN.name}/: van a LICENCIA.md de cada carpeta.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
