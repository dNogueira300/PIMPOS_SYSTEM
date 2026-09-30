# Clientes — cómo se usa

Manual corto para el negocio (F6, 30/09/2026). Las pantallas están en el panel, en **Clientes**;
desde el celular, en la barra de abajo. Guardan datos personales (Ley N.° 29733): por eso hay
cosas que el sistema no deja hacer aunque se pidan, y quedan dichas aquí.

## Quién hace qué

| Qué                                             | Administración | Ingeniero | Repartidor |
| ----------------------------------------------- | :------------: | :-------: | :--------: |
| Ver y buscar a todos los clientes, y su mapa    |       ✅       |    ✅     |     ✅     |
| Llamar, escribir por WhatsApp, ver cómo llegar  |       ✅       |    ✅     |     ✅     |
| Registrar un cliente nuevo                      |       ✅       |    ✅     |     —      |
| Editar sus datos                                |       ✅       |    ✅     |     —      |
| Corregir la referencia, el punto y añadir fotos |       ✅       |    ✅     |     ✅     |
| Quitar una foto                                 |       ✅       |    ✅     |     —      |
| Desactivar o reactivar                          |       ✅       |    ✅     |     —      |
| Zonas                                           |       ✅       |     —     |     —      |
| Borrar sus datos (cuando el cliente lo pide)    |       ✅       |     —     |     —      |
| Clientes para revisar (dos años sin cambios)    |       ✅       |     —     |     —      |
| Descargar la lista en Excel o PDF               |       ✅       |     —     |     —      |

## Registrar a un cliente

1. **Clientes → Nuevo cliente.**
2. Pestaña **Datos**: nombre y apellido, celular, dirección, referencia (cómo reconocer la casa:
   color del portón, qué hay al frente) y zona. Si el celular ya es de otro cliente, sale un aviso
   con enlace a su ficha; si es otra persona con el mismo número, se puede seguir.
3. Pestaña **Ubicación y fotos**: si se sabe dónde está la casa, tocarla en el mapa o pulsar **Usar
   mi ubicación** (estando en la puerta). Si no, se deja: basta la dirección.
4. Pestaña **Permiso**: **leerle al cliente, en voz alta, el texto que sale en pantalla** y marcar
   **Se lo leí y aceptó**. Sin esa casilla no se guarda nada. Es este (versión `v1-2026-10`):

   > Para llevarle sus pedidos, Panadería Pimpo's guardará su nombre, su celular, su dirección con
   > una referencia, la ubicación de su casa y hasta tres fotos de la fachada. Solo los ve el
   > personal de la panadería y no se comparten con nadie. Los guardamos mientras sea nuestro
   > cliente; si pasan dos años sin que su ficha se use, los revisamos para borrarlos. Puede pedir
   > en cualquier momento que los corrijamos o los borremos, llamando o escribiendo al
   > (el número de WhatsApp del negocio). ¿Está de acuerdo?

5. **Guardar.** La pantalla pasa sola a **Ubicación y fotos** para añadir hasta **tres fotos de la
   fachada** (con la cámara o desde la galería). Las fotos no se pueden subir antes de guardar: el
   sistema solo las acepta de un cliente que ya existe.

La ficha dice después qué versión del texto se leyó, cuándo y quién lo anotó.

## En la puerta (repartidor)

Cada cliente tiene tres botones: **Llamar**, **WhatsApp** (si el número es un celular) y **Cómo
llegar** (si tiene su casa marcada en el mapa; abre Google Maps con la ruta). La vista **Mapa** de
la lista enseña a los clientes de la zona elegida, y debajo dice cuántos no tienen punto.

Si la referencia estaba mal, el punto no coincide o falta la foto de la fachada: en su ficha,
**Corregir ubicación y fotos**. El nombre, el celular y la dirección los cambia un encargado.

## Zonas

**Clientes → Zonas** (administración): crear, renombrar, ordenar con las flechas y **Retirar** una
zona que ya no se usa. Una zona con clientes activos no se puede retirar: primero hay que pasarlos a
otra zona. Las zonas no se borran; una retirada se puede volver a **Activar**.

## Si un cliente pide que borren sus datos

**Desactivarlo no basta**: desactivar solo lo saca de la lista y del mapa, y sus datos siguen
guardados. Para borrarlos (administración):

1. Abrir su ficha y, al final, **Borrar sus datos**.
2. Escribir por qué (por ejemplo «Lo pidió por WhatsApp el 3/10»), **sin su nombre ni su número**:
   el motivo se guarda y no se borra.
3. Confirmar. **No se puede deshacer.**

Se borran su nombre, celular, dirección, referencia, observación, punto en el mapa y fotos, también
del historial de cambios del sistema. Queda solo la constancia: que se borraron, quién, cuándo y por
qué. Si vuelve a comprar, se le registra de nuevo, con su permiso.

Si al terminar la ficha dice que **quedan fotos** guardadas (pasa si falló la conexión justo en ese
momento), pulsar **Borrar las fotos que quedaron** hasta que desaparezca el aviso.

## Clientes para revisar

Nada se borra solo. Cuando la ficha de un cliente lleva **dos años sin cambios**, sale en el inicio
de la administración («… clientes llevan dos años sin cambios») y en **Clientes → Para revisar**.
Con cada uno:

- si sigue comprando: **Sigue siendo cliente** (renueva la fecha);
- si ya no compra: desactivarlo desde su ficha;
- si pidió que se borren sus datos: **Borrar sus datos**.

## Descargar la lista

**Clientes** (vista Lista) → **Descargar Excel** o **Descargar PDF** (administración). Descarga
todos los clientes de la zona y el estado elegidos —activos o desactivados—, **sin fotos ni
ubicación**. Cada descarga queda anotada: quién, cuándo, cuántos y de qué zona.

El archivo lleva datos personales: se guarda en un sitio con contraseña, no se reenvía por grupos
de WhatsApp y se borra cuando ya no hace falta.

## Si cambia el texto del permiso

No se cambia desde el panel: es un texto legal, y cada cliente guarda **la versión** que se le leyó.
Si el negocio necesita otro texto, se pide al encargado del sistema: se escribe una versión nueva
(`src/lib/clientes/permiso.ts`, con su prueba) y los permisos ya dados conservan la suya.
