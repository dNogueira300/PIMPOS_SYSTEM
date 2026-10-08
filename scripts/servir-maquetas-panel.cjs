/* eslint-disable @typescript-eslint/no-require-imports -- Servidor estático local para las maquetas de revisión. */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../DOC/Maquetas");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};
http
  .createServer((req, res) => {
    try {
      const url = new URL(req.url, "http://127.0.0.1");
      const relative =
        decodeURIComponent(url.pathname).replace(/^\/+/, "") || "3.2/dashboard-inicio/index.html";
      const file = path.resolve(root, relative);
      if (
        !file.startsWith(root + path.sep) ||
        !fs.existsSync(file) ||
        !fs.statSync(file).isFile()
      ) {
        res.writeHead(404);
        return res.end("No encontrado");
      }
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      fs.createReadStream(file)
        .on("error", () => res.destroy())
        .pipe(res);
    } catch {
      res.writeHead(400);
      res.end("Solicitud inválida");
    }
  })
  .listen(4178, "127.0.0.1", () =>
    console.log("Maquetas del panel: http://127.0.0.1:4178/3.2/dashboard-inicio/index.html"),
  );
