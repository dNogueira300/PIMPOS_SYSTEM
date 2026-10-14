/* eslint-disable @typescript-eslint/no-require-imports -- Preparación local reproducible de archivos de marca. */
const fs = require("node:fs");
const path = require("node:path");
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next")] }));

// Conserva los píxeles del logo aprobado: el favicon usa solo su personaje,
// porque las letras del logo completo desaparecen a 16–24 px. No redibuja la marca.
const source = process.argv[2];
if (!source) throw new Error("Indica la ruta del logo.png original aprobado.");
const output = path.resolve("public/marca");

async function preparar() {
  const input = fs.readFileSync(source);
  const { width, height } = await sharp(input).metadata();
  if (width !== 1536 || height !== 1024) {
    throw new Error("El recorte corresponde al logo aprobado de 1536 × 1024 px.");
  }
  // Encuadre cuadrado del personaje: gorro y rostro, sin texto ni resplandor lateral.
  const personaje = await sharp(input)
    .extract({ left: 500, top: 104, width: 508, height: 508 })
    .composite([
      {
        input: Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="508" height="508"><rect width="508" height="508" rx="105" fill="white"/></svg>',
        ),
        blend: "dest-in",
      },
    ])
    .toBuffer();
  for (const [file, size] of [
    ["favicon.png", 96],
    ["apple-touch-icon.png", 180],
  ]) {
    const lado = Math.round(size * 0.88);
    const icono = await sharp(personaje).resize(lado, lado).toBuffer();
    await sharp({ create: { width: size, height: size, channels: 4, background: "#F8F4EB" } })
      .composite([{ input: icono, gravity: "centre" }])
      .png()
      .toFile(path.join(output, file));
  }
  // Compatibilidad con navegadores y rastreadores que conservan estas rutas.
  // ICO contiene el mismo PNG aprobado, sin redibujar ni cambiar sus píxeles.
  const png = fs.readFileSync(path.join(output, "favicon.png"));
  const ico = Buffer.alloc(22);
  ico.writeUInt16LE(1, 2); // ICONDIR: icono.
  ico.writeUInt16LE(1, 4); // Una imagen.
  ico[6] = 96;
  ico[7] = 96;
  ico.writeUInt16LE(1, 10); // Planos.
  ico.writeUInt16LE(32, 12); // RGBA.
  ico.writeUInt32LE(png.length, 14);
  ico.writeUInt32LE(22, 18);
  fs.writeFileSync(path.resolve("public/favicon.ico"), Buffer.concat([ico, png]));
  fs.writeFileSync(
    path.join(output, "favicon.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><image width="96" height="96" href="data:image/png;base64,${png.toString("base64")}"/></svg>\n`,
  );
  console.log("Favicon PNG/ICO/SVG y Apple preparados desde el logo aprobado.");
}

preparar().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
