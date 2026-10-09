import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  Document,
  Font,
  Image,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import {
  AVISO_SIN_COSTO,
  formatearSoles,
  type TablaExportable,
  textosDeLasFilas,
} from "./formato-reporte";

// Las mismas TTF estáticas que usa la imagen para compartir (F3): el PDF no
// admite woff2 variables, igual que `ImageResponse`. Ver su LICENCIA.md. Se
// leen en tiempo de ejecución: `outputFileTracingIncludes` (next.config.ts)
// las lleva con la función a Vercel.
const RECURSOS = join(process.cwd(), "src/recursos/compartir");
Font.register({ family: "Jakarta", src: join(RECURSOS, "jakarta-500.ttf") });
// Sin esto, react-pdf corta las palabras largas con guiones de su propio
// diccionario (inglés).
Font.registerHyphenationCallback((palabra) => [palabra]);

const TERRACOTA = "#953E2C";
const TINTA_SUAVE = "#59554E";
// Buffer evita que una ruta absoluta de Windows se interprete como una URL.
const LOGO = await readFile(join(RECURSOS, "logo.png"));
const estilos = StyleSheet.create({
  pagina: {
    padding: 36,
    paddingTop: 104,
    paddingBottom: 48,
    fontFamily: "Jakarta",
    fontSize: 10,
    color: "#28251F",
  },
  marca: {
    position: "absolute",
    top: 28,
    left: 36,
    right: 36,
    height: 60,
    borderBottomWidth: 0.5,
    borderBottomColor: "#D9D4CA",
    paddingBottom: 8,
  },
  logo: { width: 52, height: 52, objectFit: "contain" },
  titulo: { fontSize: 18, color: TERRACOTA },
  subtitulo: { marginTop: 4, marginBottom: 16, color: TINTA_SUAVE },
  fila: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#D9D4CA",
    paddingVertical: 4,
  },
  cabecera: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: TERRACOTA,
    paddingBottom: 4,
    color: TERRACOTA,
  },
  celda: { flex: 1, paddingRight: 6 },
  numero: { flex: 1, paddingRight: 6, textAlign: "right" },
  total: { marginTop: 12, textAlign: "right", fontSize: 12, color: TERRACOTA },
  aviso: { marginTop: 6, fontSize: 8, color: TINTA_SUAVE },
  vacio: { marginTop: 12, color: TINTA_SUAVE },
  pie: { position: "absolute", bottom: 20, left: 36, right: 36, fontSize: 8, color: TINTA_SUAVE },
});

/**
 * Un reporte a PDF, con los mismos textos que la pantalla (`textosDeLasFilas`).
 * Más de cinco columnas (el kárdex) van en apaisado para que la tabla quepa.
 */
export async function reporteAPdf(reporte: TablaExportable): Promise<Buffer> {
  const textos = textosDeLasFilas(reporte);
  const estiloDe = (i: number) =>
    reporte.columnas[i]?.tipo === "texto" ? estilos.celda : estilos.numero;

  const documento = (
    <Document title={reporte.titulo} author="Panadería Pimpo's" language="es">
      <Page
        size="A4"
        orientation={reporte.columnas.length > 5 ? "landscape" : "portrait"}
        style={estilos.pagina}
      >
        <View style={estilos.marca} fixed>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf no admite alt; el nombre de la panadería figura como texto en el subtítulo. */}
          <Image src={LOGO} style={estilos.logo} />
        </View>
        <Text style={estilos.titulo}>{reporte.titulo}</Text>
        <Text style={estilos.subtitulo}>Panadería Pimpo&apos;s · {reporte.subtitulo}</Text>
        {textos.length === 0 ? (
          <Text style={estilos.vacio}>{reporte.vacio ?? "No hay datos en ese periodo."}</Text>
        ) : (
          <>
            <View style={estilos.cabecera} fixed>
              {reporte.columnas.map((c, i) => (
                <Text key={c.clave} style={estiloDe(i)}>
                  {c.titulo}
                </Text>
              ))}
            </View>
            {textos.map((fila, i) => (
              <View key={i} style={estilos.fila} wrap={false}>
                {fila.map((texto, j) => (
                  <Text key={reporte.columnas[j]!.clave} style={estiloDe(j)}>
                    {texto}
                  </Text>
                ))}
              </View>
            ))}
            {reporte.total !== null ? (
              <Text style={estilos.total}>Total: {formatearSoles(reporte.total)}</Text>
            ) : null}
            {reporte.hayCostosDesconocidos ? (
              <Text style={estilos.aviso}>{AVISO_SIN_COSTO}</Text>
            ) : null}
          </>
        )}
        <Text
          style={estilos.pie}
          fixed
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />
      </Page>
    </Document>
  );
  return renderToBuffer(documento);
}
