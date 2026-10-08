/* eslint-disable @typescript-eslint/no-require-imports -- Guion de captura local ejecutado como CommonJS por Node. */
// Deterministic web encoding: preserve the supplied artwork and alpha; no generative redraw.
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next")] }));
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const source = path.resolve("DOC/Fotos y documentos Adjuntados Pimpos/Diseño/logo.png");
const out = path.resolve("DOC/Maquetas/comparacion-redisenio/assets");
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const input = fs.readFileSync(source),
    metadata = await sharp(input).metadata();
  const variants = [];
  for (const width of [256, 512, 768]) {
    const file = `logo-${width}.webp`;
    await sharp(input)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 94, alphaQuality: 100, effort: 6 })
      .toFile(path.join(out, file));
    const m = await sharp(path.join(out, file)).metadata(),
      bytes = fs.statSync(path.join(out, file)).size;
    variants.push({
      file,
      width: m.width,
      height: m.height,
      hasAlpha: m.hasAlpha,
      bytes,
      savingPercent: Number((100 * (1 - bytes / input.length)).toFixed(1)),
    });
  }
  const record = {
    source: "DOC/Fotos y documentos Adjuntados Pimpos/Diseño/logo.png",
    sourceSha256: createHash("sha256").update(input).digest("hex"),
    sourceBytes: input.length,
    sourceWidth: metadata.width,
    sourceHeight: metadata.height,
    originalModified: false,
    method: "Sharp resize + WebP quality 94, alphaQuality 100; artwork and transparency preserved",
    variants,
  };
  fs.writeFileSync(path.join(out, "logo-optimizacion.json"), JSON.stringify(record, null, 2));
  console.log(record);
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
