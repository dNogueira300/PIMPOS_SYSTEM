/* eslint-disable @typescript-eslint/no-require-imports -- Compara todas las mediciones conservadas, sin sustituir los umbrales del guion original. */
const fs = require("node:fs");
const path = require("node:path");
const out = "DOC/Maquetas/3.2/bloque5/lighthouse";
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
function samples(version, slug) {
  return fs
    .readdirSync(path.join(out, version))
    .filter((file) => new RegExp(`^${slug}-[0-9]+\\.json$`).test(file))
    .sort()
    .map((file) => {
      const lhr = JSON.parse(fs.readFileSync(path.join(out, version, file), "utf8"));
      return {
        file: `${version}/${file}`,
        scores: Object.fromEntries(
          Object.entries(lhr.categories).map(([key, category]) => [
            key,
            Math.round(category.score * 100),
          ]),
        ),
        lcp: lhr.audits["largest-contentful-paint"].numericValue,
        cls: lhr.audits["cumulative-layout-shift"].numericValue,
        bytes: lhr.audits["total-byte-weight"].numericValue,
        warnings: lhr.runWarnings,
      };
    });
}
const records = ["inicio", "productos", "contacto"].map((slug) => {
  const base = samples("base", slug),
    result = samples("resultado", slug);
  if (base.length !== 5 || result.length !== 5)
    throw Error(`Se necesitan5 mediciones de ambas versiones: ${slug}`);
  const summarize = (rows) => ({
    performance: median(rows.map((r) => r.scores.performance)),
    accessibility: median(rows.map((r) => r.scores.accessibility)),
    seo: median(rows.map((r) => r.scores.seo)),
    lcp: median(rows.map((r) => r.lcp)),
    cls: median(rows.map((r) => r.cls)),
    bytes: median(rows.map((r) => r.bytes)),
    range: [
      Math.min(...rows.map((r) => r.scores.performance)),
      Math.max(...rows.map((r) => r.scores.performance)),
    ],
  });
  const old = summarize(base),
    current = summarize(result);
  return {
    route: slug === "inicio" ? "/" : `/${slug}`,
    base: old,
    result: current,
    delta: current.performance - old.performance,
    relativePass: current.performance >= old.performance - 3,
    absolutePass: current.performance >= 90 && current.accessibility >= 95 && current.seo === 100,
    samples: { base, result },
  };
});
fs.writeFileSync(
  path.join(out, "comparacion.json"),
  JSON.stringify(
    {
      baseSha: "3113084",
      resultBase: "ea4ee37",
      method:
        "Mismo puerto3000, dependencias, Supabase local, máquina y sesión.5 mediciones móviles por ruta y versión, mediana y dispersión. Sin capturadores ni builds en paralelo.",
      records,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify(
    records.map(({ route, base, result, delta, relativePass, absolutePass }) => ({
      route,
      base,
      result,
      delta,
      relativePass,
      absolutePass,
    })),
    null,
    2,
  ),
);
if (records.some((r) => !r.relativePass)) process.exitCode = 1;
