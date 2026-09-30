# Insumos — cómo se usa y cómo se empieza

Manual corto para el negocio (F5, cerrada el 30/09/2026). Las pantallas están en el panel, en
**Insumos**; desde el celular, en la barra de abajo.

## El primer día: cargar lo que ya hay

El sistema empieza con los 22 insumos de la ficha y **sin existencias**. Antes de registrar compras
o consumos hay que decirle cuánto hay hoy. Lo hace alguien de la administración:

1. Entrar como administrador y abrir **Insumos → Conteo**.
2. En «Por qué se cuenta», escribir **Inventario inicial**.
3. Contar el almacén y escribir, en cada insumo, cuánto hay **en su unidad** (kg, litros, unidades,
   rollos) en «Contado de …». Un insumo que no se cuenta se deja en blanco.
4. Si se sabe cuánto costó, escribir el precio en «Precio por kg (S/), si sobra» (o por litro, por
   unidad…): con eso la valorización del almacén sale bien desde el primer día. Si no se sabe, se
   deja en blanco y los reportes lo marcan con «\*» —costo sin registrar— hasta la primera compra.
5. En los que vencen (manteca, levadura, huevo, mantequilla y frutas confitadas), escribir en
   «Vence (si sobra)» la fecha de vencimiento de lo que hay.
6. Guardar. **Existencias** enseña ya las cantidades.

## Cada día

| Qué pasa                              | Quién          | Dónde                                           |
| ------------------------------------- | -------------- | ----------------------------------------------- |
| Llega una compra                      | Ingeniero      | Insumos → Registrar ingreso                     |
| Se usa algo para producir o se retira | Ingeniero      | Insumos → Registrar consumo (una vez al día)    |
| Algo se pierde, vence o se devuelve   | Ingeniero pide | Insumos → Pedir baja                            |
|                                       | Administrador  | Inicio → «… baja espera tu aprobación»          |
| Algo se registró mal                  | Administrador  | Ficha del insumo → Anular                       |
| Se cuenta el almacén                  | Administrador  | Insumos → Conteo                                |
| Ver cuánto hay y cuánto vale          | Todos          | Insumos → Reportes (con Excel y PDF para bajar) |

Una baja **no descuenta nada** hasta que la administración la aprueba. En los insumos que vencen se
puede elegir **de qué lote** sale («De qué lote»); si no se elige, sale del que vence primero. Un
consumo que pide más de lo que hay no se guarda: el sistema dice cuánto queda.

El kárdex de cada insumo va en el **orden en que se registró** cada cosa, con la fecha y hora que se
escribió al lado: si alguien registra tarde algo que pasó antes, esa fila sale donde se registró,
y el saldo de cada fila es el que había de verdad en ese momento.

## Si algo se registró mal

- **Un ingreso con la cantidad o el precio mal escrito:** en la ficha del insumo, **Anular** ese
  ingreso y **volver a registrarlo** bien. No se corrige con un conteo: el conteo lo contaría como
  «Faltó al contar» en el reporte de mermas.
- **Antes de contar el almacén**, aprobar o rechazar las bajas pendientes y registrar el consumo del
  día: si no, lo perdido se descuenta dos veces o el consumo cuenta como faltante.

## Si un número no cuadra

El saldo se puede reconstruir desde los movimientos: `select app.recalcular_saldos();` en el editor
SQL de Supabase (solo quien mantiene el sistema). Rehace el saldo de cada insumo y de cada lote.
Si después sigue sin cuadrar con lo que hay en el almacén, la respuesta es un **conteo**, no tocar la
base: el conteo deja un ajuste con quién y por qué.

## Encender el correo

Hoy el correo está **apagado a propósito**: sin dominio verificado, Resend solo entrega a la cuenta
dueña. Cuando haya dominio verificado en Resend, añadir en Vercel (Production):

- `RESEND_API_KEY`
- `CORREO_ALERTAS`: los correos que reciben los avisos, separados por coma
- `CORREO_REMITENTE`: una dirección del dominio, por ejemplo `Pimpo's <avisos@panaderiapimpos.com>`

y volver a desplegar. También hace falta `CRON_SECRET` (una cadena aleatoria, solo Production), que
**todavía no está puesto** (30/09/2026). Antes de encenderlo conviene que el resumen lleve un
enlace al panel y que el aviso al momento diga qué insumo o qué promoción es: están anotados al
final del plan de F5. El resumen llega cada mañana
entre las 07:00 y las 07:59 (Iquitos), y hay un aviso al momento cuando alguien pide una baja o
manda una promoción a revisión. El primer resumen, después de semanas apagado, trae un solo aviso
por insumo (el más reciente), no uno por cada día.

## Una cuenta con movimientos no se elimina

El kárdex guarda quién registró cada cosa. A alguien que ya registró movimientos se le
**desactiva** desde Usuarios; eliminarlo lo impide la base.
