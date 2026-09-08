# Decisión pendiente: la tipografía

Las tres imágenes `TIPOGRAFIA *.png` de esta carpeta son **la misma portada real**, cambiando solo
la letra. No son muestras de texto: es la aplicación funcionando, que es como el plan
(`03 - Frontend`, §3.2) pide validarla.

El círculo oscuro de abajo a la izquierda es el indicador de Next en desarrollo. No forma parte del
diseño y no aparece en producción.

---

## Las dos opciones

### A — Fraunces + Inter

Fraunces tiene mucho contraste entre el trazo grueso y el fino, con remates que se notan. Se lee
**hecha a mano**, con carácter propio. Inter, debajo, es neutral y limpia: deja hablar al titular.

### B — Bitter + Source Sans 3

Bitter es una _slab_: el trazo es mucho más parejo y los remates son rectangulares. Se lee **sólida
y estable**, más de letrero impreso que de artesanía. Source Sans 3 es algo más cálida que Inter en
el texto corrido.

### C — La pila del sistema

Es lo que hay hoy. Va solo como referencia, para ver de dónde partimos. No es una opción: cambia
según el dispositivo de cada visitante, así que la marca no se vería igual para todos.

---

## Recomendación: A

Por dos razones concretas, no por gusto:

1. La ficha 2.6 marca **tradicional / artesanal**, expresamente frente a «moderno o minimalista».
   El contraste de trazo de Fraunces es justo lo que distingue una letra artesanal de una
   industrial. Bitter, al ser más pareja, tira más hacia lo neutro.
2. El logo ya es fuerte: bebé chef y degradado arcoíris. Fraunces le hace compañía; Bitter, más
   sobria, lo deja solo y la página se siente algo más fría.

**B no es una mala opción.** Si Organda prefiere algo que se lea más serio y menos decorativo, es
perfectamente defendible.

---

## Cómo decidirlo con la propietaria

Enséñale las imágenes tal cual, sin decirle cuál recomendamos. La pregunta útil no es «¿cuál te
gusta más?», sino la que ella misma dio en la ficha 2.5:

> **¿Cuál se parece más a entrar a tu tienda?**

Conviene enseñarle también la versión de móvil: la ficha 5.8 dice que el móvil es prioritario, y es
donde la mayoría de sus clientes va a ver el sitio.

---

## Qué pasa después

Cambiar la elección son **dos líneas** en `src/estilos/globals.css`
(`--pimpos-fuente-titulo` y `--pimpos-fuente-texto`). Las fuentes se cargan con `next/font/local`
desde archivos del propio proyecto, nunca desde Google: así no se envía la IP de cada visitante a un
tercero y la página carga antes.

Esta decisión **no bloquea nada**. El sitio funciona hoy con la pila del sistema, y se puede cambiar
en cualquier momento antes del despliegue público de la Fase 3.
