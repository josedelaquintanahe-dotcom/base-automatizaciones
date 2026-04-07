# Entornos

## Proposito

Este documento define la separacion esperada entre entorno local, staging y produccion para reducir riesgos tempranos, facilitar validacion progresiva y mantener trazabilidad operativa.

## Principios base

- cada entorno debe tener configuracion propia,
- no se deben reutilizar credenciales entre entornos,
- staging debe parecerse a produccion sin compartir datos sensibles innecesariamente,
- produccion debe ser el entorno mas restringido y auditado,
- el entorno local debe servir para desarrollo y validacion segura sin dependencias reales obligatorias.

## Entorno local

Objetivo:
desarrollo, documentacion, pruebas controladas y validacion inicial de estructura.

Caracteristicas:

- configuracion en maquina local del desarrollador,
- datos simulados, anonimizados o de prueba,
- posibilidad de usar servicios locales o endpoints mock,
- cambios frecuentes y reversibles.

## Entorno staging

Objetivo:
validar integraciones y comportamiento preproductivo con controles mas realistas.

Caracteristicas:

- configuracion separada de local y produccion,
- variables y credenciales propias,
- datos de prueba o copias controladas,
- validacion de flujos end-to-end antes de publicar.

## Entorno produccion

Objetivo:
ejecucion real del sistema con maxima estabilidad, control y trazabilidad.

Caracteristicas:

- credenciales y configuraciones exclusivas,
- acceso restringido,
- auditoria reforzada,
- cambios controlados y minimizados.

## Diferencias por plataforma

## Supabase local vs remoto

### Supabase local

Uso:
desarrollo de esquema, pruebas locales y validacion temprana.

Ventajas:

- control total del entorno,
- menor riesgo sobre datos reales,
- facilidad para iterar cambios.

Riesgos a controlar:

- divergencia respecto al entorno remoto,
- configuraciones locales incompletas,
- falsa sensacion de seguridad si no se validan permisos reales.

### Supabase remoto

Uso:
staging o produccion con acceso centralizado y persistencia compartida.

Ventajas:

- entorno mas cercano a operacion real,
- validacion de permisos y politicas,
- trazabilidad multiusuario.

Riesgos a controlar:

- errores de permisos,
- exposicion accidental de datos,
- uso incorrecto de claves privilegiadas.

## n8n local vs cloud

### n8n local

Uso:
diseno de workflows, pruebas controladas y desarrollo iterativo.

Ventajas:

- mayor velocidad de prueba,
- menor riesgo sobre procesos reales,
- facilidad para ajustar triggers y logs.

Riesgos a controlar:

- diferencias con configuracion cloud,
- webhooks no representativos,
- falta de validacion real de permisos o conectividad.

### n8n cloud

Uso:
staging o produccion con disponibilidad gestionada.

Ventajas:

- entorno mas estable y cercano a ejecucion final,
- mejor validacion de despliegue real,
- puntos de entrada consistentes para integraciones.

Riesgos a controlar:

- triggers expuestos sin suficiente validacion,
- credenciales demasiado amplias,
- workflows activos antes de estar auditados.

## Vercel preview vs production

### Preview

Uso:
validacion de cambios antes de publicarlos.

Ventajas:

- pruebas aisladas por cambio,
- verificacion rapida de frontend y funciones,
- menor riesgo para usuarios reales.

Riesgos a controlar:

- uso accidental de variables de produccion,
- endpoints no protegidos,
- confundir preview con entorno estable.

### Production

Uso:
despliegue publico o interno operativo definitivo.

Ventajas:

- punto de acceso estable,
- configuracion final del sistema,
- integracion con operacion real.

Riesgos a controlar:

- cambios sin checklist previa,
- exposicion de variables o funciones sensibles,
- falta de trazabilidad en errores.

## Rendel entorno desarrollo vs produccion

### Desarrollo

Uso:
pruebas de agentes, prompts, estructura de entradas y salidas.

Ventajas:

- iteracion controlada,
- menor impacto operativo,
- posibilidad de validar limites del agente.

Riesgos a controlar:

- salidas no normalizadas,
- agentes sin restricciones claras,
- uso de contexto no minimizado.

### Produccion

Uso:
ejecucion de agentes dentro de procesos reales.

Ventajas:

- soporte a casos de negocio reales,
- integracion auditada con workflows y backend.

Riesgos a controlar:

- exceso de privilegios,
- trazabilidad insuficiente,
- dependencia excesiva del agente para decisiones criticas.

## Reglas de separacion entre entornos

- un entorno no debe compartir secretos con otro,
- los webhooks y endpoints deben tener URLs separadas por entorno,
- las claves de alto privilegio deben limitarse a serverless o backend,
- staging debe validar integraciones antes de cualquier despliegue a produccion,
- toda incidencia relevante debe poder rastrearse por entorno y `correlation_id`.

## Estado actual

Base documental definida para separar local, staging y produccion antes de iniciar integraciones reales.
