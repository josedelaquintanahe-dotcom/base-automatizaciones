# Backend Node.js

## Proposito

Esta carpeta define la base estructural del backend principal del sistema en Node.js.

## Rol del backend Node.js

Node.js actua como capa backend intermedia entre Supabase, n8n, Rendel.com y Vercel. Su funcion es centralizar logica de negocio, integraciones externas, endpoints intermedios, adaptadores y servicios reutilizables.

## Responsabilidades

- exponer rutas y controladores backend,
- encapsular logica de negocio en servicios,
- centralizar acceso a datos y persistencia mediante repositorios,
- aislar clientes de integracion con Supabase, n8n, Rendel.com u otros servicios,
- normalizar entradas, salidas, errores y trazabilidad.

## Flujo de datos esperado

1. Vercel o un sistema externo envia una solicitud al backend.
2. Las rutas delegan en controladores.
3. Los controladores validan y llaman a servicios.
4. Los servicios ejecutan logica de negocio y coordinan repositorios o clientes.
5. Los repositorios interactuan con persistencia.
6. Los clientes integran plataformas externas o internas.
7. El backend devuelve una respuesta estructurada y trazable.

## Convencion modular del backend

### `app/`

Entrypoints y ensamblado de la aplicacion Express.

### `controllers/`

Entrada HTTP o de transporte. Deben ser delgados y sin logica de negocio compleja.

### `services/`

Logica de negocio reutilizable y coordinacion entre capas.

### `repositories/`

Acceso a persistencia y lectura o escritura estructurada.

### `routes/`

Definicion de rutas, versionado y agrupacion por dominio.

### `clients/`

Clientes y adaptadores para Supabase, n8n, Rendel.com y otros servicios.

### `middlewares/`

Middlewares transversales para seguridad, validacion, trazabilidad y manejo comun de peticiones.

### `config/`

Configuracion del servidor, carga de entorno y convenciones operativas del backend.

## Principios

- controladores pequenos,
- servicios reutilizables,
- acceso a datos aislado,
- integraciones desacopladas,
- middlewares centralizados,
- cambios conservadores y trazables.

## Estado actual

Estructura documental base creada. Todavia no contiene implementacion real ni dependencias instaladas.
