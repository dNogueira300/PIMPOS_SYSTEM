# Login móvil ondulado — 08/10/2026

Adaptación de `referencia.png`, adjuntada por Dan: cabecera terracota con formas orgánicas
tenues, logo circular original y separación ondulada sobre fondo crema. Conserva Jakarta,
«Panadería Pimpo's», «Panel de gestión», Correo, Contraseña y Entrar. No incorpora los controles
de registro ni recuperación de la referencia; no cambia el comportamiento del acceso.

Capturas del build de producción local, con movimiento reducido. Antes de medir y capturar se
espera el formulario visible, las fuentes listas y el logo decodificado. No se inyecta CSS del diseño;
solo `zoom-css-200-390.png` aplica `body.style.zoom = '2'` para simular aumento del contenido.

| Captura                | Comprobación                                |
| ---------------------- | ------------------------------------------- |
| `login-375-667.png`    | Móvil pequeño, login completo               |
| `login-390-844.png`    | Móvil habitual                              |
| `login-390-500.png`    | Altura reducida, desplazamiento vertical    |
| `login-768-900.png`    | Paso a composición de dos columnas          |
| `login-1440-1000.png`  | Escritorio                                  |
| `error-375.png`        | Validación existente del formulario vacío   |
| `inactividad-390.png`  | Mensaje existente de cierre por inactividad |
| `zoom-css-200-390.png` | Aumento CSS al 200 %                        |

`manifest.json` registra tamaños, imagen cargada, círculo, geometría de subtítulo/onda, controles
y axe sin reglas desactivadas. Las ocho vistas tienen controles visibles, cero violaciones de axe,
cero desbordamiento horizontal y ningún solapamiento entre el subtítulo y la onda.

La comparación con `../login-1440.png` registra 12596 píxeles distintos de 1440000 (0.875 %):
se conserva la composición de escritorio, sin afirmar igualdad píxel a píxel. La onda y las formas
solo aparecen por debajo de 768 px. El contenedor del logo conserva lados iguales y radio circular.

Los campos y acciones son los existentes. No se crean usuarios ni se modifica la configuración para
estas capturas; el estado de error utiliza validación local y el de inactividad un parámetro de ruta.
Las pruebas funcionales reutilizan usuarios temporales locales con limpieza al terminar.
No es una prueba de teclado físico ni de zoom nativo; esas revisiones siguen pendientes en el PR.
Las capturas móviles anteriores en la carpeta padre son históricas y quedan sustituidas por estas.
