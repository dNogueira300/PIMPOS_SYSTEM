/* eslint-disable @typescript-eslint/no-require-imports -- Proceso Node CommonJS aislado del transformador JSX de Playwright. */
// Playwright convierte JSX a objetos propios de su navegador de componentes.
// Este proceso aislado usa el runtime React real para comprobar el HTML del
// componente con props extremas, sin añadir dependencias ni tocar la base.
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const archivo = path.resolve("src/components/publico/carrusel-portada.tsx");
const { outputText } = ts.transpileModule(fs.readFileSync(archivo, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
    target: ts.ScriptTarget.ES2020,
  },
});
const modulo = new Module(archivo, module);
modulo.filename = archivo;
modulo.paths = Module._nodeModulePaths(path.dirname(archivo));
modulo._compile(outputText, archivo);
const slides = JSON.parse(fs.readFileSync(0, "utf8"));
process.stdout.write(
  renderToStaticMarkup(React.createElement(modulo.exports.CarruselPortada, { slides })),
);
