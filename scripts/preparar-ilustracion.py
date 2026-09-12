#!/usr/bin/env python3
"""Deja la ilustracion del horno lista para el sitio: sin fondo y optimizada.

    python scripts/preparar-ilustracion.py

El original lo entrego el cliente y vive fuera de git, en la carpeta de fotos
(`DOC/Fotos y documentos Adjuntados Pimpos/Diseño/`), como las demas: son 2.5 MB
de PNG que no cambian. Lo que SI entra al repositorio es el resultado, porque el
sitio lo necesita en cada build y en el CI.

Este guion existe para que el recorte sea repetible y no un archivo que alguien
saco de un editor sin dejar rastro. Si el cliente manda otra version del dibujo,
se vuelve a correr.
"""

import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ORIGEN = "DOC/Fotos y documentos Adjuntados Pimpos/Diseño/horno_con_sol.png"
DESTINO = "public/marca/horno-amanecer.webp"

# El crema del papel, muestreado en las cuatro esquinas del original.
COLOR_PAPEL = (242, 230, 209)
# Margen para el grano: el papel no es un color plano, varia unos 20 niveles.
TOLERANCIA = 30
# Tinta por debajo de esta densidad local es una mota, no dibujo. Ver abajo.
DENSIDAD_MINIMA = 26
# Suficiente para 450 px a densidad 2 y 300 px a densidad 3, que es como se ve.
ANCHO_FINAL = 900
CALIDAD, CALIDAD_ALFA = 74, 60


def main() -> int:
    if not os.path.exists(ORIGEN):
        print(f"No esta el original: {ORIGEN}", file=sys.stderr)
        print("Vive en la carpeta de fotos del cliente, fuera de git.", file=sys.stderr)
        return 1

    im = Image.open(ORIGEN).convert("RGB")

    # Relleno por inundacion desde el borde, NO una clave de color.
    #
    # El crema del fondo y el de la argamasa entre los ladrillos del horno son el
    # mismo color: separarlos por color es imposible. Lo que los distingue es la
    # topologia — uno toca el borde de la imagen y el otro esta encerrado dentro
    # del dibujo. El marco de 1 px garantiza que un solo relleno desde (0, 0)
    # alcance todo el fondo, tambien si el dibujo llega a tocar algun borde.
    marco = Image.new("RGB", (im.width + 2, im.height + 2), COLOR_PAPEL)
    marco.paste(im, (1, 1))
    marcado = (255, 0, 255)  # magenta puro: no aparece en el dibujo
    ImageDraw.floodfill(marco, (0, 0), marcado, thresh=TOLERANCIA)

    pixeles = np.asarray(marco, dtype=np.uint8)
    fondo = (
        (pixeles[:, :, 0] == marcado[0])
        & (pixeles[:, :, 1] == marcado[1])
        & (pixeles[:, :, 2] == marcado[2])
    )[1:-1, 1:-1]
    mascara = np.where(fondo, 0, 255).astype(np.uint8)
    print(f"fondo retirado: {fondo.mean() * 100:.1f}% de la imagen")

    # El grano del papel deja motas que el relleno no alcanza: puntos de uno o
    # dos pixeles mas oscuros que la tolerancia, sueltos en mitad de la nada.
    # Sobre el crema del sitio no se notan; sobre un fondo oscuro se ven como
    # polvo. Se distinguen del dibujo por la DENSIDAD de tinta alrededor, no por
    # su tamano: una linea fina del grabado tiene vecinas, una mota no. Con
    # morfologia habria que elegir entre dejar motas o adelgazar el trazo.
    densidad = np.asarray(
        Image.fromarray(mascara, "L").filter(ImageFilter.GaussianBlur(5)), dtype=np.uint8
    )
    motas = (mascara > 0) & (densidad < DENSIDAD_MINIMA)
    print(f"motas de grano retiradas: {motas.sum()} px ({motas.sum() / mascara.size * 100:.3f}%)")
    mascara[motas] = 0

    # Medio pixel de suavizado: el relleno deja el borde escalonado, y el
    # contorno del dibujo ya trae su propio antialias.
    alfa = Image.fromarray(mascara, "L").filter(ImageFilter.GaussianBlur(0.6))

    # Aplanar el grano que queda debajo de lo transparente: no se ve, pero WebP
    # lo codifica igual y se paga en bytes.
    canales = np.asarray(im, dtype=np.uint8).copy()
    canales[np.asarray(alfa, dtype=np.uint8) == 0] = COLOR_PAPEL

    salida = Image.fromarray(canales, "RGB").convert("RGBA")
    salida.putalpha(alfa)

    # El original trae margen de sobra, y ese margen se paga en pixeles servidos.
    salida = salida.crop(salida.getbbox())
    if salida.width > ANCHO_FINAL:
        alto = round(salida.height * ANCHO_FINAL / salida.width)
        salida = salida.resize((ANCHO_FINAL, alto), Image.LANCZOS)

    salida.save(DESTINO, format="WEBP", quality=CALIDAD, method=6, alpha_quality=CALIDAD_ALFA)
    print(
        f"{DESTINO}: {salida.width}x{salida.height} · "
        f"{os.path.getsize(DESTINO) / 1024:.0f} KB "
        f"(original {os.path.getsize(ORIGEN) / 1024 / 1024:.1f} MB)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
