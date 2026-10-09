/* eslint-disable @typescript-eslint/no-require-imports -- Consolida evidencia real de T7 y rutas desde page.tsx, sin acceder a credenciales. */
const fs = require("node:fs");
const path = require("node:path");
const root = "DOC/Maquetas/3.2/bloque5";
const groups = [
  "acceso",
  "publico",
  "inicio-portada",
  "panel-contenido",
  "panel-operacion",
  "zoom-nativo",
  "novedad",
];
const records = groups.flatMap((group) => {
  const file = path.join(root, group, "manifest.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8")).records.map((r) => ({
    ...r,
    group,
    role: r.role || (r.route?.startsWith("/admin") ? "administrador" : "publico"),
    state: r.state || r.note || (r.scale ? `zoom nativo ${r.scale * 100} %` : r.name || "inicial"),
    capture: `${group}/${r.capture || r.file || r.name + ".png"}`,
    overflow: r.overflow ?? r.scrollWidth > r.width,
    blue: r.blue || r.blueStyles || [],
  }));
});
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
    );
}
const inventory = walk("src/app")
  .filter((file) => file.endsWith("page.tsx"))
  .map((file) => {
    const template =
      "/" +
      path
        .relative("src/app", path.dirname(file))
        .split(path.sep)
        .filter((part) => !part.startsWith("("))
        .join("/");
    const expression =
      "^" +
      template
        .replace(/\[id\]/g, template.startsWith("/admin/auditoria/") ? "[0-9]+" : "[a-f0-9-]{36}")
        .replace(/\[(slug|reporte)\]/g, "[^/]+") +
      "$";
    const regex = new RegExp(expression);
    const observed = records.filter((r) =>
      [r.requested, r.route].some((route) => route && regex.test(route.split("?")[0])),
    );
    return {
      template,
      source: file.replaceAll("\\", "/"),
      captures: observed.map((r) => r.capture),
      widths: [...new Set(observed.map((r) => r.width))].sort((a, b) => a - b),
      roles: [...new Set(observed.map((r) => r.role))],
      covered: observed.length > 0,
    };
  });
const suite = JSON.parse(
  fs.readFileSync(path.join(root, "pruebas/regresion-completa.json"), "utf8"),
);
const output = {
  build: suite.build,
  inventory,
  records,
  suite: {
    listed: suite.listed,
    summary: suite.summary,
    complete: suite.complete,
    missing: suite.missing,
    extra: suite.extra,
  },
  notes: [
    "Fotos/cartografía pueden contener azul. Zoom CSS es un ensayo adverso separado; zoom nativo verificado con DPR2 y CSS zoom1.",
    "La novedad publicada y las cuentas son fixtures locales eliminados. No son promociones aprobadas.",
    "Teclado virtual de teléfono físico y comprobación posterior a producción no certificados.",
  ],
};
fs.writeFileSync(path.join(root, "inventario.json"), JSON.stringify(output, null, 2) + "\n");
const safe = JSON.stringify(output).replaceAll("<", "\\u003c");
fs.writeFileSync(
  path.join(root, "index.html"),
  `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cierre del rediseño — Pimpo’s</title><style>body{margin:0;background:#f7f5f0;color:#28251f;font:16px/1.5 system-ui}main{max-width:1200px;margin:auto;padding:24px}h1,h2,a{color:#953e2c}label{display:inline-flex;gap:8px;align-items:center;margin:8px}select,input{font:inherit;padding:8px;border:1px solid #d9d4ca;border-radius:8px;max-width:85vw}.table{overflow:auto}table{border-collapse:collapse;width:100%}th,td{padding:10px;text-align:left;border-bottom:1px solid #d9d4ca;font-size:14px}figure{margin:24px 0;background:white;padding:16px;border:1px solid #d9d4ca;border-radius:12px}img{width:100%;height:auto;max-height:1100px;object-fit:contain;object-position:top}small{display:block}a:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #953e2c;outline-offset:3px}</style><main><h1>Cierre del rediseño</h1><p>Evidencia del build real. Dirección A/a6, conservando funcionalidades.</p><p id="summary"></p><p>605 pruebas aprobadas y 105 omisiones previstas. El primer intento tuvo una espera de red del mapa; repetición y conciliación final en <a href="pruebas/regresion-completa.json">el manifiesto</a>.</p><p>Zoom nativo 200 % sin desbordamientos ni incidencias axe. El teclado virtual de un teléfono físico queda pendiente.</p><p><a href="compartir.png">Tarjeta de WhatsApp/redes</a> · <a href="pdf/resultado/insumos.pdf">PDF de insumos</a> · <a href="pdf/resultado/clientes.pdf">PDF de clientes (8 páginas)</a> · <a href="inventario.json">Inventario completo</a></p><p>Las novedades mostradas son pruebas locales con una foto original del negocio; no son promociones aprobadas.</p><label>Ruta <input id="search" placeholder="Buscar una ruta"></label><label>Ancho <select id="width"><option value="">Todos</option>${[375, 390, 768, 1024, 1440, 712].map((w) => `<option>${w}</option>`).join("")}</select></label><label>Rol <select id="role"><option value="">Todos</option></select></label><div class="table"><table><thead><tr><th>Ruta</th><th>Rol</th><th>Ancho</th><th>Estado</th><th>Captura</th></tr></thead><tbody id="rows"></tbody></table></div><figure hidden id="preview"><figcaption></figcaption><a target="_blank" rel="noopener"><img alt="Captura de la pantalla seleccionada"></a></figure><details><summary>Rutas obtenidas del código</summary><ul id="inventory"></ul></details></main><script>const data=${safe};const rows=document.querySelector('#rows'),search=document.querySelector('#search'),width=document.querySelector('#width'),role=document.querySelector('#role');document.querySelector('#summary').textContent=data.inventory.length+' plantillas de página; '+data.records.length+' capturas registradas; build '+data.build;for(const value of [...new Set(data.records.map(r=>r.role))]){const option=document.createElement('option');option.textContent=value;role.append(option)}for(const r of data.inventory){const li=document.createElement('li');li.textContent=r.template+' — '+(r.covered?'capturada':'SIN CAPTURA');document.querySelector('#inventory').append(li)}function render(){rows.replaceChildren();data.records.filter(r=>(r.requested||r.route||'').includes(search.value)&&(!width.value||String(r.width)===width.value)&&(!role.value||r.role===role.value)).forEach(r=>{const tr=document.createElement('tr');for(const text of [r.requested||r.route,r.role,r.width,r.state]){const td=document.createElement('td');td.textContent=text;tr.append(td)}const td=document.createElement('td'),a=document.createElement('a');a.href=r.capture;a.textContent='Ver pantalla';a.onclick=e=>{e.preventDefault();const figure=document.querySelector('#preview');figure.hidden=false;figure.querySelector('figcaption').textContent=(r.requested||r.route)+' · '+r.width+' px · '+r.state;figure.querySelector('img').src=r.capture;figure.querySelector('a').href=r.capture;figure.scrollIntoView({behavior:'auto'})};td.append(a);tr.append(td);rows.append(tr)})}for(const input of [search,width,role])input.addEventListener('input',render);render();</script></html>`,
);
console.log(
  JSON.stringify({
    templates: inventory.length,
    captures: records.length,
    missing: inventory.filter((r) => !r.covered).map((r) => r.template),
  }),
);
