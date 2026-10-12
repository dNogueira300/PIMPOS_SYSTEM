# Alternativas de alojamiento anual para Pimpo's

Consulta: 10/10/2026. Dan pide comparar alojamiento de pago antes de probar Netlify.
Presupuesto confirmado: **hasta S/300 al año para hosting y dominio**, también al renovar.
No se compró, contrató, creó cuenta ni desplegó nada. PR #95 sigue en borrador.
La evaluación negativa de Cloudflare se conserva separada.

## Comparación económica

Importes consultados en USD, sin impuestos, comisiones de tarjeta ni adicionales.
Conversión orientativa: USD 1 ≈ S/3.44, tipo medio de
[Xe consultado para esta comparación](https://www.xe.com/es-us/currencytables/?from=PEN).
El cambio aplicado por el banco puede ser distinto. No son cotizaciones vinculantes.

| Alternativa                              | Primer año             | Renovación anual consultada                                | Dominio y presupuesto                                                                                                  |
| ---------------------------------------- | ---------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Hostinger Business / Unlimited, 12 meses | US$59.88 ≈ S/206       | US$203.88 ≈ S/701, más dominio                             | Dominio elegible incluido el primer año. Renovación fuera del límite.                                                  |
| Hostinger Cloud Startup, 12 meses        | US$119.88 ≈ S/412      | US$311.88 ≈ S/1,073, más dominio                           | Fuera del límite desde el primer año.                                                                                  |
| Namecheap Stellar + `.com` en paquete    | US$33.06 ≈ S/114       | US$74.56 ≈ S/256                                           | Hosting 26.88 + dominio 5.98 + ICANN 0.20. Renovación: 55.88 + 18.48 + 0.20. SSL desde el segundo año por resolver.    |
| OVHcloud VPS-1 + dominio separado        | Desde US$64.94 ≈ S/223 | Proyección al precio actual; total final de Perú pendiente | VPS 54.48 por 12 meses + referencia de dominio Cloudflare 10.46. No incluye dominio gratuito ni mantenimiento técnico. |

Hostinger: [precios](https://www.hostinger.com/pricing/), selector **12 months** comprobado
en el navegador. Los anuncios de 3.99/mes corresponden a 48 meses, no a una compra anual.
Business aparece ahora como Unlimited en la página comercial; su documentación de soporte
conserva el nombre Business. Antes de contratar se debe identificar exactamente el plan
que incluye Node.js. El dominio [es gratis por un año](https://support.hostinger.com/es/articles/1583407-como-registrar-un-dominio-gratis-en-hostinger),
no durante todas las renovaciones; VPS no entra en esa promoción.

Namecheap: [paquete anual](https://www.namecheap.com/hosting/domain-and-hosting-bundle/),
[renovación de hosting vigente desde mayo de 2026](https://www.namecheap.com/support/knowledgebase/article.aspx/10780/22/shared-hosting-pricing-changes-may-2026/)
y [renovación de `.com`](https://www.namecheap.com/domains/registration/gtld/com/).
El `.com` está rebajado a 5.98, **no es gratis**; otras extensiones sí se incluyen.
No sustituir `panaderiapimpos.com` por una extensión menos adecuada solo por el regalo.
SSL incluido durante [el primer año](https://www.namecheap.com/support/knowledgebase/article.aspx/9927/2218/1year-free-cpanel-standard-ssl-certificate-offer/):
resolver renovación o certificado gratuito renovable antes de aprobar el presupuesto.
Stellar Plus renueva hosting a 85.44: con `.com` sería 104.12 ≈ S/358, fuera del límite.

OVHcloud: [VPS](https://www.ovhcloud.com/en/vps/) y
[configurador anual](https://www.ovhcloud.com/en/vps/configurator/?brick=VPS%2BModel%2B1&planCode=vps-2027-model1&pricing=upfront12&processor=+&storage=40__SSD__NVMe&vcore=2__vCore).
En navegador: VPS-1, 2 vCore, 4 GB RAM, 40 GB NVMe, Canadá Beauharnois disponible,
Ubuntu, sin adicionales; **54.48 sin impuestos por 12 meses**, 15 % de descuento.
La página indica renovación automática por el mismo plazo con el mismo descuento;
eso no garantiza que la tarifa base nunca cambie. Precio, moneda y elegibilidad para
facturar a Perú deben confirmarse en la oferta final, sin contratar todavía.
IPv4 y backup estándar incluidos. No sumar otra vez un backup premium opcional.
El dominio de 10.46 es la consulta previa de Cloudflare, no una reserva ni precio garantizado.

## Adecuación técnica

Hostinger [soporta Next.js y Node 24](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
en Business y Cloud. Esto cambia el descarte histórico del proyecto: es un candidato
técnico, aunque la renovación consultada no cumple S/300/año. No comprar Premium
basándose en iconos promocionales: la guía sitúa Node en Business y Cloud.

Namecheap [documenta Node 24](https://www.namecheap.com/support/knowledgebase/article.aspx/10047/2182/how-to-work-with-nodejs-app/)
en su selector de aplicaciones cPanel. No demuestra todavía Next 16.3.4, PPR,
Cache Components, streaming, recursos de PDF ni pnpm 12 en Pimpo's. Hay que verificar
la versión disponible en el servidor asignado, RAM/CPU, instalación y arranque,
caché persistente y descargas bajo carga antes de comprar o elegirlo. No se ejecutó
la aplicación allí. El plan básico también requiere resolver backups operativos.

Un VPS Linux permite instalar Node 24 y ejecutar el servidor estándar de Next;
[Next documenta soporte completo en despliegues Node](https://nextjs.org/docs/app/getting-started/deploying).
Es una inferencia favorable para evitar el adaptador Workers, no una certificación de
Pimpo's en OVH. Preserva Supabase como backend; no trasladar la base ni cambiar funciones.
El equipo debe encargarse de actualizaciones, HTTPS, despliegues, monitorización y
recuperación. El precio del VPS no remunera esa administración ni garantiza alta
disponibilidad de la aplicación. Medir latencia hacia Iquitos y Supabase antes de elegir región.

## Recomendación y siguiente comprobación

**Hostinger no cumple el presupuesto de renovación consultado.** Si hay una persona
responsable del mantenimiento técnico, priorizar la validación de **OVHcloud VPS-1**:
el precio anual de infraestructura y dominio parece entrar con margen y ofrece control
del runtime Node. Si se busca evitar administrar Linux, **Namecheap Stellar es el
candidato económico**, con más incertidumbre técnica y menos margen para adicionales.
Ninguno está aprobado como destino de producción en esta investigación.

Antes de contratar: confirmar oferta anual y renovación para Perú, `.com`, SSL, impuestos
y condiciones; demostrar el build y los flujos en Linux con código intacto y datos ficticios;
luego probar el proveedor real con permisos explícitos y presupuesto concreto. Los flujos
deben incluir login/roles/revocación, publicación e invalidación de caché, imágenes/OG,
cron y todas las descargas. Los casos no ejecutados no cuentan como cobertura.
No hacer una compra para poder afirmar compatibilidad ni asumir que el dominio gratuito
compensa una renovación fuera del presupuesto. Netlify queda pospuesto por instrucción de Dan.

Otras ofertas revisadas sin priorizar: IONOS VPS S+ anuncia 2/mes solo tres meses,
después 6/mes (hosting 72/año al renovar, más dominio e impuestos); Hetzner CX23
subió a 6.49/mes, con IPv4 aparte. No usar sus precios promocionales anteriores
como presupuesto anual vigente. Fuentes: [IONOS](https://www.ionos.com/servers/vps),
[Hetzner junio de 2026](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/)
y [IPv4](https://docs.hetzner.com/general/infrastructure-and-availability/ipv4-pricing/).
