# Verificación de rediseño 03.2 — Bloque 1

Fecha: 08/10/2026. Base: `3113084`. Rama: `feat/rediseno-acceso-panel`.
Checkout: `PIMPOS_REDISENO_BLOQUE1`. Alcance: T1 + T2 del plan 03.2.
Estado: implementación y verificación local terminadas; entrega y revisión de vista previa en curso.

## Resultado implementado

Tokens terracota y neutros cálidos, Jakarta local para texto y títulos, logo transparente optimizado
en acceso y panel, círculo del login en móvil y escritorio, lateral claro, cabecera móvil con marca,
listas y controles compartidos. Se conserva la marca administrable y el archivo de reserva.
No se modifican acciones, validaciones, consultas de negocio, permisos, cálculos, exportadores o migraciones.
La consulta existente de configuración se reutiliza para resolver el logo en el servidor.
La composición pública y los módulos específicos corresponden a T3–T6; el cierre integral, a T7.

Los tres WebP provienen del PNG aprobado, sin modificar el original. Tamaños: 18 356 / 43 978 /
72 284 bytes para 256 / 512 / 768 px. El mayor conserva la ruta `public/marca/logo.webp`.

## Comprobaciones

| Comprobación                  | Resultado                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| Vitest completo               | 492 pruebas aprobadas, 60 archivos                                                            |
| Paleta y contraste            | 45 pruebas aprobadas                                                                          |
| Build de producción           | Turbopack; compilación y tipos aprobados, 113 páginas estáticas                               |
| ESLint completo               | Aprobado sin advertencias, incluidos los guiones finales                                      |
| Prettier completo             | Aprobado, incluidos los documentos y manifiestos de evidencia                                 |
| E2E funcional + accesibilidad | 273 aprobadas / 21 omisiones previstas / 0 fallos; un trabajador, móvil y escritorio          |
| Capturas del build            | 28 pantallas + 11 estados a 390 / 1440 px, tres roles; imágenes cargadas y sin desbordamiento |
| Vista previa Vercel / CI      | Pendientes de abrir PR                                                                        |

Suites E2E: `identidad-panel`, `autenticacion`, `panel-sesiones`, `panel-inactividad`,
`panel-cascara`, `panel-configuracion`, `panel-editar`, `panel-busqueda`,
`panel-accesibilidad` y `accesibilidad`. La navegación y el logo se comprueban además a
375, 390, 768, 1024 y 1440 px. No se desactivan reglas de axe para acomodar el nuevo diseño.
La prueba de marca carga una imagen local temporal, comprueba panel/login y restaura la
configuración y el archivo al terminar. La comprobación de cabecera pública se completa en T5.

Evidencia en `Maquetas/3.2/bloque1/`, con manifiesto y limpieza de tres usuarios temporales.
Los once estados revisados no muestran azul en el barrido orientativo de estilos computados.
Login e inicio se compararon visualmente con A; también se inspeccionaron error, diálogo y guardado
pendiente. El aumento CSS al 200 % no genera scroll horizontal. En el viewport bajo, la barra
de guardado conserva su posición fija; la interacción con teclado real requiere revisión en dispositivo.

## Revisión independiente y correcciones

La revisión de la rama no encontró cambios en permisos, autenticación ni acciones de negocio.
Detectó contraste insuficiente (2.18:1) en el hover de la pestaña activa: corregido con texto blanco
explícito y texto de peligro en la pestaña con error. La prueba axe reprodujo el fallo y pasó tras
el ajuste. El barrido posterior encontró que la cabecera móvil quedaba fuera de los landmarks:
se sustituyó su `div` por `header`. El caso de `/admin` falló antes y pasó después de esa corrección.

Menor diferido: el test automático del círculo compara sus lados, pero no afirma el radio; utiliza
los tamaños por defecto de Playwright. Las capturas a 390/1440 registran también el radio
computado: lados iguales de 160 y 345.59375 px respectivamente, con `rounded-full`. El login
se revisó visualmente a ambos tamaños. Queda la revisión en un dispositivo con teclado físico y
zoom nativo del navegador.

## Decisiones de ejecución y límites

1. Se creó un worktree Git en la carpeta hermana porque la herramienta de la app no reconocía el
   repositorio desde la carpeta padre. Coste: checkout no registrado por la app; se usa su ruta explícita.
2. Se ejecutan únicamente T1/T2 y se detiene el trabajo al abrir su PR, conforme al primer bloque
   autorizado. Coste: el rediseño integral permanece pendiente.
3. El extractor de la skill no reconoce encabezados españoles T1/T2: se usaron los apartados completos
   del plan como brief. Coste: seguimiento manual de las casillas.
4. La revisión independiente se realizó con el modelo disponible gpt-6-astra. Coste: no utiliza el
   modelo opus citado por la guía histórica del proyecto.
5. El tema oscuro latente, variantes sin consumidores, módulos y composición pública se revisan
   en sus entregas; Lighthouse corresponde al cierre. Coste: esta evidencia no demuestra T3–T7.
6. La validación existente prohíbe guardar una ruta de logo vacía. Se retiró el nuevo caso que
   intentaba esa operación. Coste: una fila antigua vacía no queda ejercitada por un guardado de UI;
   el fallback está implementado sin alterar esa validación.
7. Se reutilizaron las dependencias instaladas mediante junction, tras atascarse la instalación local.
   Turbopack necesitó una raíz temporal que incluyera ese enlace; `next.config.ts` se restauró al
   terminar. Coste: condición local del checkout; no se incorpora una ruta de Windows al producto.
8. La selección de categoría antes de hidratar falló en el build alternativo webpack y pasó tanto en
   la base como en la rama con Turbopack, el compilador habitual. Se conservó la lógica de búsqueda.
   Coste: no se afirma equivalencia de comportamiento entre compiladores.

Los usuarios y archivos de prueba son locales y se eliminan al terminar, conservando la auditoría.
Sitrai permanece detenido por petición de Dan. No se reinició la base ni se cambiaron datos productivos.
No hay autorización para fusionar ni desplegar en producción.
