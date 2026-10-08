# Inventario de páginas — bloque 2

Base: `c1f9582`, primer bloque fusionado. Incluye lista, alta, edición, detalle y reportes; no crea rutas.

| Ruta                                 | Tipo              | Archivo                                                      |
| ------------------------------------ | ----------------- | ------------------------------------------------------------ |
| `/admin/auditoria/borrados`          | Lista / sección   | `src/app/(admin)/admin/auditoria/borrados/page.tsx`          |
| `/admin/auditoria/descargas`         | Lista / sección   | `src/app/(admin)/admin/auditoria/descargas/page.tsx`         |
| `/admin/auditoria/ingresos`          | Lista / sección   | `src/app/(admin)/admin/auditoria/ingresos/page.tsx`          |
| `/admin/auditoria`                   | Lista / sección   | `src/app/(admin)/admin/auditoria/page.tsx`                   |
| `/admin/auditoria/[id]`              | Detalle / edición | `src/app/(admin)/admin/auditoria/[id]/page.tsx`              |
| `/admin/clientes/nuevo`              | Formulario        | `src/app/(admin)/admin/clientes/nuevo/page.tsx`              |
| `/admin/clientes`                    | Lista / sección   | `src/app/(admin)/admin/clientes/page.tsx`                    |
| `/admin/clientes/revisar`            | Lista / sección   | `src/app/(admin)/admin/clientes/revisar/page.tsx`            |
| `/admin/clientes/zonas/nueva`        | Formulario        | `src/app/(admin)/admin/clientes/zonas/nueva/page.tsx`        |
| `/admin/clientes/zonas`              | Lista / sección   | `src/app/(admin)/admin/clientes/zonas/page.tsx`              |
| `/admin/clientes/zonas/[id]`         | Detalle / edición | `src/app/(admin)/admin/clientes/zonas/[id]/page.tsx`         |
| `/admin/clientes/[id]/corregir`      | Corrección        | `src/app/(admin)/admin/clientes/[id]/corregir/page.tsx`      |
| `/admin/clientes/[id]/editar`        | Edición           | `src/app/(admin)/admin/clientes/[id]/editar/page.tsx`        |
| `/admin/clientes/[id]`               | Detalle / edición | `src/app/(admin)/admin/clientes/[id]/page.tsx`               |
| `/admin/configuracion`               | Configuración     | `src/app/(admin)/admin/configuracion/page.tsx`               |
| `/admin/contenido/categorias/nueva`  | Formulario        | `src/app/(admin)/admin/contenido/categorias/nueva/page.tsx`  |
| `/admin/contenido/categorias`        | Lista / sección   | `src/app/(admin)/admin/contenido/categorias/page.tsx`        |
| `/admin/contenido/categorias/[id]`   | Detalle / edición | `src/app/(admin)/admin/contenido/categorias/[id]/page.tsx`   |
| `/admin/contenido/galeria/nueva`     | Formulario        | `src/app/(admin)/admin/contenido/galeria/nueva/page.tsx`     |
| `/admin/contenido/galeria`           | Lista / sección   | `src/app/(admin)/admin/contenido/galeria/page.tsx`           |
| `/admin/contenido/galeria/[id]`      | Detalle / edición | `src/app/(admin)/admin/contenido/galeria/[id]/page.tsx`      |
| `/admin/contenido/guias/nueva`       | Formulario        | `src/app/(admin)/admin/contenido/guias/nueva/page.tsx`       |
| `/admin/contenido/guias`             | Lista / sección   | `src/app/(admin)/admin/contenido/guias/page.tsx`             |
| `/admin/contenido/guias/[id]`        | Detalle / edición | `src/app/(admin)/admin/contenido/guias/[id]/page.tsx`        |
| `/admin/contenido/novedades/nueva`   | Formulario        | `src/app/(admin)/admin/contenido/novedades/nueva/page.tsx`   |
| `/admin/contenido/novedades`         | Lista / sección   | `src/app/(admin)/admin/contenido/novedades/page.tsx`         |
| `/admin/contenido/novedades/[id]`    | Detalle / edición | `src/app/(admin)/admin/contenido/novedades/[id]/page.tsx`    |
| `/admin/contenido`                   | Lista / sección   | `src/app/(admin)/admin/contenido/page.tsx`                   |
| `/admin/contenido/portada/nueva`     | Formulario        | `src/app/(admin)/admin/contenido/portada/nueva/page.tsx`     |
| `/admin/contenido/portada`           | Lista / sección   | `src/app/(admin)/admin/contenido/portada/page.tsx`           |
| `/admin/contenido/portada/[id]`      | Detalle / edición | `src/app/(admin)/admin/contenido/portada/[id]/page.tsx`      |
| `/admin/contenido/preguntas/nueva`   | Formulario        | `src/app/(admin)/admin/contenido/preguntas/nueva/page.tsx`   |
| `/admin/contenido/preguntas`         | Lista / sección   | `src/app/(admin)/admin/contenido/preguntas/page.tsx`         |
| `/admin/contenido/preguntas/[id]`    | Detalle / edición | `src/app/(admin)/admin/contenido/preguntas/[id]/page.tsx`    |
| `/admin/contenido/productos/nuevo`   | Formulario        | `src/app/(admin)/admin/contenido/productos/nuevo/page.tsx`   |
| `/admin/contenido/productos`         | Lista / sección   | `src/app/(admin)/admin/contenido/productos/page.tsx`         |
| `/admin/contenido/productos/[id]`    | Detalle / edición | `src/app/(admin)/admin/contenido/productos/[id]/page.tsx`    |
| `/admin/contenido/testimonios/nueva` | Formulario        | `src/app/(admin)/admin/contenido/testimonios/nueva/page.tsx` |
| `/admin/contenido/testimonios`       | Lista / sección   | `src/app/(admin)/admin/contenido/testimonios/page.tsx`       |
| `/admin/contenido/testimonios/[id]`  | Detalle / edición | `src/app/(admin)/admin/contenido/testimonios/[id]/page.tsx`  |
| `/admin/insumos/bajas/nueva`         | Formulario        | `src/app/(admin)/admin/insumos/bajas/nueva/page.tsx`         |
| `/admin/insumos/bajas`               | Lista / sección   | `src/app/(admin)/admin/insumos/bajas/page.tsx`               |
| `/admin/insumos/consumo`             | Formulario        | `src/app/(admin)/admin/insumos/consumo/page.tsx`             |
| `/admin/insumos/conteo`              | Formulario        | `src/app/(admin)/admin/insumos/conteo/page.tsx`              |
| `/admin/insumos/ingreso`             | Formulario        | `src/app/(admin)/admin/insumos/ingreso/page.tsx`             |
| `/admin/insumos/nuevo`               | Formulario        | `src/app/(admin)/admin/insumos/nuevo/page.tsx`               |
| `/admin/insumos`                     | Lista / sección   | `src/app/(admin)/admin/insumos/page.tsx`                     |
| `/admin/insumos/proveedores/nuevo`   | Formulario        | `src/app/(admin)/admin/insumos/proveedores/nuevo/page.tsx`   |
| `/admin/insumos/proveedores`         | Lista / sección   | `src/app/(admin)/admin/insumos/proveedores/page.tsx`         |
| `/admin/insumos/proveedores/[id]`    | Detalle / edición | `src/app/(admin)/admin/insumos/proveedores/[id]/page.tsx`    |
| `/admin/insumos/reportes`            | Lista / sección   | `src/app/(admin)/admin/insumos/reportes/page.tsx`            |
| `/admin/insumos/reportes/[reporte]`  | Reporte           | `src/app/(admin)/admin/insumos/reportes/[reporte]/page.tsx`  |
| `/admin/insumos/[id]/editar`         | Edición           | `src/app/(admin)/admin/insumos/[id]/editar/page.tsx`         |
| `/admin/insumos/[id]`                | Detalle / edición | `src/app/(admin)/admin/insumos/[id]/page.tsx`                |
| `/admin`                             | Inicio            | `src/app/(admin)/admin/page.tsx`                             |
| `/admin/usuarios/nuevo`              | Formulario        | `src/app/(admin)/admin/usuarios/nuevo/page.tsx`              |
| `/admin/usuarios`                    | Lista / sección   | `src/app/(admin)/admin/usuarios/page.tsx`                    |
| `/admin/usuarios/[id]`               | Detalle / edición | `src/app/(admin)/admin/usuarios/[id]/page.tsx`               |

La evidencia autenticada se relaciona con este inventario en el manifiesto de capturas. Las rutas parametrizadas utilizan datos locales existentes o fixtures de las suites; jamás datos de producción.
