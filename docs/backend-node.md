# Backend Node.js

## Proposito

Este documento explica por que Node.js se adopta como backend principal del sistema y como encaja dentro de la arquitectura existente.

## Por que Node.js es backend principal

Node.js se selecciona como backend principal porque permite centralizar logica de negocio, integraciones, adaptadores y endpoints intermedios en una capa unica, reusable y mas mantenible que repartir esa responsabilidad entre workflows, serverless functions y servicios gestionados.

## Como interactua con Supabase

- consulta y actualiza datos persistidos,
- centraliza acceso a tablas, vistas o funciones,
- aplica reglas de negocio antes de persistir,
- evita que el frontend o n8n dependan directamente de privilegios amplios.

## Como interactua con n8n

- expone endpoints o servicios para que n8n consuma logica reusable,
- invoca workflows cuando el caso requiere orquestacion,
- desacopla reglas de negocio complejas de nodos n8n,
- normaliza inputs y outputs entre proceso y backend.

## Como interactua con Rendel.com

- prepara contexto acotado para agentes,
- valida y normaliza salidas del agente,
- controla invocaciones, tiempos y trazabilidad,
- reduce acoplamiento entre agentes y el resto del sistema.

## Como interactua con Vercel

- recibe trafico desde frontend o funciones serverless cuando convenga,
- sirve como backend persistente para operaciones no adecuadas a serverless,
- permite reutilizar logica sin duplicarla en funciones ligeras,
- mantiene el frontend desacoplado de servicios internos.

## Uso de Express como framework HTTP principal

Express se adopta como framework HTTP principal del backend Node.js para estructurar rutas, middlewares, controladores y manejo de errores con una base simple y ampliamente reutilizable.

Su papel esperado:

- exponer la API backend,
- centralizar middlewares comunes,
- delegar en controladores y servicios,
- mantener una superficie HTTP clara sin forzar decisiones prematuras de infraestructura.

Express no sustituye la arquitectura por capas; la organiza.

## Que tipo de logica vivira en Node.js

- logica de negocio reutilizable,
- integraciones externas,
- endpoints intermedios,
- adaptadores entre Supabase y n8n,
- control de agentes,
- validaciones compartidas,
- normalizacion de errores y respuestas,
- servicios y scripts backend estructurados.

## Que tipo de logica NO vivira en Node.js

- persistencia primaria de datos, que sigue en Supabase,
- orquestacion visual o secuencial propia de n8n,
- interfaces frontend propias de Vercel,
- razonamiento especializado propio de agentes en Rendel.com,
- secretos incrustados en codigo o configuraciones globales del sistema.

## Principio operativo

Node.js debe actuar como backend principal de aplicacion, no como reemplazo de Supabase, n8n, Rendel.com o Vercel. Su funcion es conectar esas capas con reglas de negocio y adaptacion controlada.
