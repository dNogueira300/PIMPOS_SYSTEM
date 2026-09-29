import { join } from "node:path";

import { Document, Font, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";

import { AVISO_SIN_COSTO, formatearSoles, textosDeLasFilas } from "./formato-reporte";
import type { Reporte } from "./reportes";

// Las mismas TTF estáticas que usa la imagen para compartir (F3): el PDF no
// admite woff2 variables, igual que `ImageResponse`. Ver su LICENCIA.md. Se
// leen en tiempo de ejecución: `outputFileTracingIncludes` (next.config.ts)
// las lleva con la función a Vercel.
const RECURSOS = join(process.cwd(), "src/recursos/compartir");
Font.register({ family: "Jakarta", src: join(RECURSOS, "jakarta-500.ttf") });
Font.register({ family: "Playfair", src: join(RECURSOS, "playfair-700.ttf") });
// Sin esto, react-pdf corta las palabras largas con guiones de su propio
// diccionario (inglés).
Font.registerHyphenationCallback((palabra) => [palabra]);

const AZUL = "#12306E";
const TINTA_SUAVE = "#5b5446";
const estilos = StyleSheet.create({
  pagina: { padding: 36, paddingBottom: 48, fontFamily: "Jakarta", fontSize: 10, color: "#1E1B14" },
  titulo: { fontFamily: "Playfair", fontSize: 18, color: AZUL },
  subtitulo: { marginTop: 4, marginBottom: 16, color: TINTA_SUAVE },
  fila: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#d9d2c3",
    paddingVertical: 4,
  },
  cabecera: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: AZUL,
    paddingBottom: 4,
    color: AZUL,
  },
  celda: { flex: 1, paddingRight: 6 },
  numero: { flex: 1, paddingRight: 6, textAlign: "right" },
  total: { marginTop: 12, textAlign: "right", fontSize: 12, color: AZUL },
  aviso: { marginTop: 6, fontSize: 8, color: TINTA_SUAVE },
  vacio: { marginTop: 12, color: TINTA_SUAVE },
  pie: { position: "absolute", bottom: 20, left: 36, right: 36, fontSize: 8, color: TINTA_SUAVE },
});

/**
 * Un reporte a PDF, con los mismos textos que la pantalla (`textosDeLasFilas`).
 * Más de cinco columnas (el kárdex) van en apaisado para que la tabla quepa.
 */
export async function reporteAPdf(reporte: Reporte): Promise<Buffer> {
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
        <Text style={estilos.titulo}>{reporte.titulo}</Text>
        <Text style={estilos.subtitulo}>Panadería Pimpo&apos;s · {reporte.subtitulo}</Text>
        {textos.length === 0 ? (
          <Text style={estilos.vacio}>No hay datos en ese periodo.</Text>
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
