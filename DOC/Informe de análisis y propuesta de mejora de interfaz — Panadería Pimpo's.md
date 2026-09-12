# Informe de Análisis y Propuesta de Mejora de Interfaz

## Panadería Pimpo's

**Sitio analizado:** Panadería Pimpo's  
**URL:** https://pimpos-system-iota.vercel.app/

---

> ## Respuesta al informe (12/09/2026)
>
> Este documento lo recibió Dan de fuera del equipo. Lo que sigue es el veredicto
> punto por punto y qué se hizo con cada cosa. **El informe acierta en el
> diagnóstico de fondo** —el sitio informa bien y transmite poco— y su mejor idea,
> la §19 (ilustraciones), está implementada. Pero varias propuestas concretas
> desharían decisiones que este proyecto ya midió, y esas se rechazan **con el
> motivo y la fecha**, no por gusto.
>
> ### Lo que se hizo
>
> | §   | Propuesta                                                           | Qué se hizo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
> | --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
> | 19  | Ilustraciones; «un horno con el sol detrás» para las 4 de la mañana | ✅ **Hecho.** Dan encargó el dibujo (linograbado, horno con sol y palmeras de Iquitos, en los colores de la marca). Se le quitó el fondo de papel y se optimizó de 2.4 MB a 130 KB (`scripts/preparar-ilustracion.py`). Vive en un bloque nuevo de la portada y en el estado vacío de novedades                                                                                                                                                                                                                          |
> | 20  | Bloque «DESDE LAS 4:00 A. M.»                                       | ✅ **Hecho**, y el dato es real: el horario cargado abre a las 04:00. La hora **se lee de la configuración**, no se escribe, para que no contradiga a la tabla de horarios si el negocio cambia el turno desde el panel                                                                                                                                                                                                                                                                                                  |
> | 4   | Hero con dos acciones                                               | ✅ **Hecho en el celular**, que era donde faltaba: solo ofrecía «Pedir por WhatsApp». Quien viene a mirar precios no tenía puerta. Ahora hay «Ver los precios» de línea junto al botón dorado                                                                                                                                                                                                                                                                                                                            |
> | 14  | Estado vacío de novedades                                           | ✅ **Hecho.** Ya tenía salida, pero era un recuadro de borde punteado — el gesto universal de «aquí falta algo», cuando no falta nada. Ahora es una página con el dibujo, un texto que explica y un botón de verdad                                                                                                                                                                                                                                                                                                      |
> | 10  | «22 años» como elemento visual                                      | ⚠️ **Se hizo lo que importaba, que no era lo visual.** Al ir a tocarlo salió que «22 años» y «Veintidós años» estaban **escritos a mano** en la portada y en la descripción de nosotros para Google. No fallan: el 1 de enero de 2027 pasan a mentir los cuatro a la vez, sin que nada avise. Ahora el año de apertura vive en la base (migración 0024) y la cuenta se calcula. La **línea temporal con hitos se rechaza**: exige fechas que el negocio no ha dado, y este proyecto no publica lo que no puede verificar |
>
> ### Lo que se rechaza, y por qué
>
> | §   | Propuesta                                         | Motivo                                                                                                                                                                                                                                                                                   |
> | --- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | 6   | Tarjetas de producto con foto y botón «+ AGREGAR» | **Contradice una decisión medida del 11/09.** 32 de los 34 productos no tienen foto, y la rejilla de tarjetas los mostraba como 32 croissants de relleno idénticos; por eso existe la pizarra de precios. Y «+ AGREGAR» implica un carrito que este sitio no tiene: se pide por WhatsApp |
> | 12  | Barra fija inferior en móvil                      | **Contradice el arreglo del 12/09.** El botón flotante ya se estaba comiendo la línea que el cliente leía; una barra fija se la come siempre y ocupa ~56 px permanentes de una pantalla de 667                                                                                           |
> | 13  | Simplificar la navegación a cinco entradas        | El menú se **amplió** a propósito tras la crítica del 11/09. Esconder Novedades, Preguntas y Contacto quita del alcance directo contenido que el negocio publica y que el SEO usa                                                                                                        |
> | 16  | Paleta nueva                                      | Los colores actuales salen del logo y de las fotos reales, y su contraste **está medido por prueba automática**. El dorado propuesto (`#D69B55`) no llega a AA ni como icono, y el azul propuesto no es el institucional de la marca                                                     |
> | 17  | Playfair Display / DM Serif + Inter/Manrope       | El sitio **ya es serif + sans** (Fraunces + Inter), servido desde el propio proyecto, y a Dan le gusta como está. Cambiarlo sería rehacer la tipografía para llegar al mismo sitio                                                                                                       |
> | 5   | Galería en collage con overlay al pasar el cursor | El _hover_ no existe en un teléfono, que es la pantalla prioritaria (R6). El collage asimétrico podría valer, pero es rediseñar una sección que funciona                                                                                                                                 |
> | 11  | Delivery «¿Se te antojó?»                         | Ya existe el bloque con sus condiciones. El cambio sería solo de copy, y «Te lo llevamos a tu casa» es más directo y más de esta marca                                                                                                                                                   |
> | 18  | Texturas de papel                                 | Una textura a pantalla completa cuesta peso en la página que más se abre con 4G irregular. La ilustración ya aporta ese grano donde se ve                                                                                                                                                |
>
> ### Lo que el informe pide y ya estaba hecho
>
> Las §7, §8 y §9 (microinteracciones, aparición al hacer scroll, escalonado de
> rejillas, no pasarse con la animación) están implementadas desde F3 **con CSS
> nativo guiado por el scroll**, sin librería: `motion` habría pesado más que todo
> el código de la aplicación junto. La §15 coincide con la dirección ya declarada.
>
> Detalle completo, con medidas: `DOC/Avance del proyecto.md`.

---

## 1. Introducción

El presente informe tiene como objetivo realizar un análisis de la interfaz, experiencia de usuario, diseño visual, animaciones y presentación general del sitio web de **Panadería Pimpo's**.

El análisis se centra principalmente en el aspecto visual y la experiencia que percibe el usuario, considerando que el sitio actualmente cumple una función informativa y comercial, pero posee un amplio margen de mejora para alcanzar una presentación más moderna, atractiva y alineada con una marca de panadería artesanal.

La propuesta no busca únicamente agregar más elementos o animaciones, sino construir una experiencia digital que transmita la identidad, tradición y personalidad de Pimpo's.

---

# 2. Evaluación general

| Área                  | Nivel actual |  Potencial |
| --------------------- | -----------: | ---------: |
| Identidad visual      |       ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Jerarquía visual      |       ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| UX / navegación       |     ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Catálogo de productos |       ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Animaciones           |         ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Sensación de marca    |       ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Conversión a pedido   |     ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Diseño móvil          |       ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Sensación premium     |         ⭐⭐ | ⭐⭐⭐⭐⭐ |

### Evaluación general

La web cuenta con una base funcional y una estructura clara. Sin embargo, actualmente se percibe principalmente como una **web informativa para una panadería**, cuando podría evolucionar hacia una **experiencia digital de marca**.

El principal objetivo del rediseño debería ser pasar de:

> "Esta es una panadería y aquí está su información."

a:

> "Esta es Pimpo's, quiero conocerla y quiero probar sus productos."

---

# 3. Principales oportunidades de mejora

## 3.1. Fortalecer la personalidad de la marca

El sitio cuenta con contenido que puede ser aprovechado para construir una identidad mucho más fuerte.

Algunos conceptos presentes en la comunicación son:

- Pan fresco.
- Tradición.
- Más de 20 años de historia.
- Producción desde tempranas horas de la mañana.
- Negocio familiar.
- Presencia en el barrio.
- Productos hechos diariamente.

Estos elementos deberían tener un papel mucho más importante en el diseño.

Actualmente el contenido comunica información, pero el diseño podría transmitir mucho más la **historia, tradición y carácter artesanal de Pimpo's**.

### Recomendación

Construir una identidad visual basada en:

- Panadería artesanal.
- Tradición.
- Cercanía.
- Negocio familiar.
- Iquitos.
- Productos frescos.
- Experiencia local.

---

# 4. Hero principal

El Hero es uno de los elementos que más puede mejorar.

Actualmente presenta principalmente el nombre de la panadería, una frase y acciones relacionadas con WhatsApp.

La estructura funciona, pero podría tener mucho mayor impacto visual.

## Propuesta

Utilizar una fotografía protagonista de:

- Pan recién horneado.
- Horno.
- Panadería.
- Productos recién preparados.

Sobre la imagen podría aparecer:

**PAN RECIÉN HORNEADO**

### Pan fresco, hecho hoy.

Y dos acciones principales:

`VER MENÚ`

`PEDIR POR WHATSAPP`

También se pueden incluir pequeños datos de marca:

- 22 años de tradición.
- Iquitos.
- Horneado desde las 4:00 a. m.
- Delivery disponible.

### Objetivo

El Hero debería transmitir inmediatamente:

**"Aquí hay pan fresco y quiero probarlo."**

---

# 5. Fotografía como protagonista

La fotografía representa una de las mayores oportunidades de mejora.

Una panadería es un negocio altamente visual, por lo que las fotografías deberían tener un papel mucho más importante dentro de la interfaz.

Actualmente existe una galería con fotografías relacionadas con:

- El local.
- Interior.
- Horno.
- Atención.

La estructura es correcta, pero podría evolucionar hacia una presentación más editorial.

## Propuesta de galería

Utilizar una composición tipo collage:

```text
┌───────────────────────┐ ┌───────────┐
│                       │ │           │
│     FOTO GRANDE       │ │   FOTO    │
│                       │ │           │
│                       │ │           │
└───────────────────────┘ └───────────┘

┌───────────┐ ┌───────────────────────┐
│           │ │                       │
│   FOTO    │ │     FOTO GRANDE       │
│           │ │                       │
└───────────┘ └───────────────────────┘
```

### Interacciones recomendadas

Al pasar el cursor sobre una fotografía:

- Zoom suave.
- Overlay oscuro/transparente.
- Aparición de descripción.
- Icono para ampliar.
- Transición de aproximadamente 200–300 ms.

La animación debe ser sutil para mantener una apariencia profesional.

---

# 6. Catálogo de productos

El sitio dispone de una cantidad considerable de productos, organizados por categorías.

La estructura es funcional, pero existe una oportunidad importante para convertir el catálogo en una experiencia mucho más visual.

## Propuesta de tarjeta de producto

```text
┌─────────────────────────┐
│                         │
│        FOTO PAN         │
│                         │
├─────────────────────────┤
│ Pan francés chico       │
│                         │
│ S/ 0.10                 │
│                         │
│       + AGREGAR         │
└─────────────────────────┘
```

Las fotografías deberían tener mayor protagonismo.

## Categorías

Se recomienda utilizar filtros visuales:

```text
TODOS
CLÁSICOS
ESPECIALES
INTEGRALES
TOSTADOS
SNACKS
```

Estos filtros podrían tener una transición horizontal suave en dispositivos móviles.

---

# 7. Microinteracciones de productos

Las tarjetas pueden incorporar pequeñas interacciones.

Al pasar el cursor:

- Elevación de 4–6 px.
- Zoom ligero de la imagen.
- Sombra más pronunciada.
- Aparición del botón.
- Destacar el precio.

La transición podría durar aproximadamente:

```text
200–300 ms
```

La idea es generar una sensación de calidad sin sobrecargar la interfaz.

---

# 8. Animaciones y scroll

Actualmente existe bastante espacio para mejorar las animaciones.

Sin embargo, el objetivo no debería ser simplemente "agregar animaciones".

La prioridad debe ser conseguir una sensación de fluidez.

## Animaciones recomendadas

### Aparición de secciones

Cuando una sección entra en el viewport:

```text
opacity: 0 → 1
translateY: 20px → 0
```

### Imágenes

```text
scale(1.04) → scale(1)
```

### Cards

Aplicar un pequeño efecto escalonado:

```text
Card 1 → 0 ms
Card 2 → 80 ms
Card 3 → 160 ms
Card 4 → 240 ms
```

Esto genera una aparición progresiva.

---

# 9. Evitar exceso de animaciones

No se recomienda utilizar:

- Elementos girando.
- Textos rebotando.
- Animaciones permanentes.
- Demasiados efectos parallax.
- Botones pulsando constantemente.
- Animaciones simultáneas en toda la página.

El sitio debe sentirse:

> **Fluido y moderno**

y no:

> **Sobrecargado de animaciones.**

---

# 10. Sección "22 años"

La historia de Pimpo's es uno de los elementos con mayor potencial para construir identidad de marca.

En lugar de mostrar únicamente un texto informativo, podría convertirse en una sección visual.

Ejemplo:

```text
                 2004

        ───────────────────

                  22
                AÑOS

       haciendo pan en Iquitos

        ───────────────────

                 2026
```

También se puede implementar una pequeña línea temporal:

```text
2004 ───── 2008 ───── 2015 ───── 2020 ───── 2026
```

Cada punto podría mostrar un acontecimiento importante de la historia del negocio.

Esto aportaría un componente de **storytelling**.

---

# 11. Delivery

La información relacionada con delivery es importante porque representa una oportunidad directa de conversión.

Actualmente se muestran datos como:

- Precio del delivery.
- Pedido mínimo.
- Tiempo aproximado.
- Métodos de pago.

La información es correcta y útil, pero visualmente podría tener mayor impacto.

## Propuesta

Crear una sección:

### ¿Se te antojó?

**Nosotros te lo llevamos.**

Mostrar:

- 🛵 Delivery S/3.
- Pedido mínimo S/10.
- 30–45 minutos.
- Efectivo.
- Yape.
- Plin.

Y finalmente un CTA destacado:

**PEDIR AHORA**

---

# 12. WhatsApp como CTA principal

WhatsApp debería estar presente de forma estratégica, pero sin saturar la interfaz.

## Desktop

Utilizar un botón flotante:

```text
┌───────────────────┐
│ 💬 PEDIR AHORA    │
└───────────────────┘
```

## Mobile

Utilizar una barra fija inferior:

```text
┌─────────────────────────────────┐
│       💬 PEDIR POR WHATSAPP     │
└─────────────────────────────────┘
```

Esto puede mejorar significativamente la conversión en dispositivos móviles.

---

# 13. Navegación

La navegación actual contiene varias opciones.

Una alternativa sería simplificarla:

```text
PIMPO'S

Inicio
Menú
Nosotros
Galería
Ubicación

                         PEDIR
```

El objetivo sería reducir la carga visual y priorizar las secciones más importantes.

Las demás informaciones pueden integrarse dentro de las páginas principales.

---

# 14. Sección de novedades

La sección de novedades puede presentar un problema cuando no existen promociones activas.

Mostrar únicamente:

> "Ahora mismo no hay promociones vigentes"

produce una sensación de espacio vacío.

## Alternativa

Cuando no existan promociones:

### ✨ Lo nuevo de Pimpo's

**Hoy no tenemos promociones, pero sí pan recién horneado.**

`VER PRODUCTOS`

acompañado de una fotografía atractiva.

De esta manera, la sección sigue teniendo valor aunque no exista una promoción.

---

# 15. Identidad visual propuesta

Para Pimpo's se recomienda evitar una estética excesivamente tecnológica.

No sería recomendable basar el diseño en:

- Glassmorphism excesivo.
- Gradientes muy llamativos.
- Estética SaaS.
- Interfaces excesivamente corporativas.
- Tarjetas flotantes en todas las secciones.

## Dirección visual recomendada

### Bakery editorial + artesanal + moderno

La estética debería combinar:

- Tradición.
- Calidez.
- Modernidad.
- Cercanía.
- Calidad.

---

# 16. Paleta de colores sugerida

Una posible paleta:

| Color            | Uso                 |
| ---------------- | ------------------- |
| Crema `#F7F0E3`  | Fondos              |
| Pan `#D69B55`    | Detalles            |
| Marrón `#6B3E26` | Títulos / elementos |
| Azul `#174A68`   | Identidad principal |
| Rojo `#B94735`   | Acentos             |
| Negro `#1F1B18`  | Texto               |

El azul característico de Pimpo's debería convertirse en un elemento importante de la identidad visual.

---

# 17. Tipografía

Una combinación de serif + sans serif podría mejorar considerablemente la percepción visual.

## Titulares

Opciones:

- DM Serif Display.
- Playfair Display.

## Interfaz y textos

Opciones:

- Inter.
- Manrope.
- Plus Jakarta Sans.

La combinación:

```text
SERIF
+
SANS SERIF
```

ayudaría a transmitir una sensación editorial y artesanal.

---

# 18. Texturas

Se podrían incorporar texturas muy sutiles inspiradas en:

- Papel.
- Harina.
- Grano.
- Materiales naturales.
- Imperfecciones artesanales.

No deben ser demasiado visibles.

La textura debe percibirse como una sensación y no como un elemento decorativo dominante.

---

# 19. Ilustraciones

Se podrían incorporar pequeñas ilustraciones relacionadas con la identidad de la panadería:

- Pan.
- Horno.
- Sol.
- Flechas.
- Líneas dibujadas a mano.
- Estrellas.
- Elementos relacionados con el amanecer.

Por ejemplo, para representar:

> **Horneamos desde las 4:00 a. m.**

podría utilizarse una ilustración de un horno con el sol apareciendo detrás.

Esto ayudaría a diferenciar la web de una plantilla genérica.

---

# 20. Estructura de Home propuesta

Una estructura recomendada sería:

```text
┌─────────────────────────────────────────┐
│ PIMPO'S       Menú Nosotros Galería     │
│                              PEDIR      │
├─────────────────────────────────────────┤
│                                         │
│         PAN RECIÉN HORNEADO              │
│                                         │
│         Pan fresco, hecho hoy.           │
│                                         │
│      [ VER MENÚ ] [ PEDIR AHORA ]       │
│                                         │
│             FOTO HERO                   │
├─────────────────────────────────────────┤
│                                         │
│       DESDE LAS 4:00 A. M.              │
│                                         │
│        Horneamos todos los días         │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│         LO QUE HORNEAMOS HOY             │
│                                         │
│       [ PAN ] [ PAN ] [ PAN ]            │
│                                         │
│              VER MENÚ →                 │
├─────────────────────────────────────────┤
│                                         │
│              22 AÑOS                    │
│         en el mismo barrio              │
│                                         │
│             [ HISTORIA ]                │
├─────────────────────────────────────────┤
│                                         │
│          DEL HORNO AL BARRIO            │
│                                         │
│            [ GALERÍA ]                  │
├─────────────────────────────────────────┤
│                                         │
│          ¿TE LO LLEVAMOS?               │
│                                         │
│                🛵                       │
│                                         │
│           [ PEDIR AHORA ]               │
├─────────────────────────────────────────┤
│                                         │
│           ENCUÉNTRANOS                 │
│                                         │
│                MAPA                     │
├─────────────────────────────────────────┤
│              PIMPO'S                    │
└─────────────────────────────────────────┘
```

---

# 21. Priorización de mejoras

No es necesario implementar todo al mismo tiempo.

Se recomienda dividir el trabajo en tres niveles.

## Nivel 1 — Pulido visual

Mantener la estructura actual y mejorar:

- Tipografía.
- Espaciado.
- Colores.
- Botones.
- Cards.
- Sombras.
- Hover.
- Responsive.
- Imágenes.
- Jerarquía visual.

### Resultado

La web se verá considerablemente más profesional sin modificar demasiado su estructura.

---

# 22. Nivel 2 — Rediseño

Modificar las principales secciones:

- Hero.
- Catálogo.
- Galería.
- Historia.
- Delivery.
- Navegación.
- Footer.

Agregar:

- Scroll reveal.
- Microinteracciones.
- Transiciones.
- Filtros animados.
- Lightbox.
- Sticky CTA.

### Resultado

La web comienza a sentirse como un sitio comercial profesional.

---

# 23. Nivel 3 — Experiencia de marca

Este debería ser el objetivo final.

Incorporar:

- Identidad visual propia.
- Fotografía como protagonista.
- Storytelling.
- Experiencia de pedido.
- Diseño mobile-first.
- Ilustraciones.
- Animaciones de scroll.
- Microinteracciones.
- Experiencia local de Iquitos.

El objetivo es dejar de construir simplemente:

> **"Una web sobre una panadería"**

y construir:

> **"La experiencia digital de Pimpo's."**

---

# 24. Conclusión

Panadería Pimpo's cuenta actualmente con una buena base funcional, información útil y contenido suficiente para construir una experiencia mucho más atractiva.

El principal potencial de mejora no está únicamente en agregar más funcionalidades, sino en trabajar la **dirección artística y experiencia de usuario**.

Los puntos de mayor prioridad serían:

1. Rediseñar el Hero.
2. Dar mayor protagonismo a las fotografías.
3. Mejorar visualmente el catálogo.
4. Crear una identidad visual artesanal y moderna.
5. Incorporar microinteracciones.
6. Implementar animaciones de scroll sutiles.
7. Convertir la historia de Pimpo's en storytelling.
8. Mejorar la sección de delivery.
9. Hacer de WhatsApp un CTA estratégico.
10. Optimizar especialmente la experiencia móvil.

La idea central del rediseño debería ser:

> **Menos apariencia de plantilla, más personalidad de Pimpo's.**

Y, sobre todo:

> **No agregar elementos simplemente porque "se ven modernos". Cada elemento visual, animación y sección debería ayudar a comunicar la historia, calidad y cercanía de la panadería, o facilitar que el usuario termine realizando un pedido.**
