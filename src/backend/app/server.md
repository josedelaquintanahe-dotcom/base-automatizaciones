# Servidor Express

## Proposito

Este archivo documenta la estructura futura del servidor Express principal del backend Node.js.

## Estructura del servidor Express

El servidor Express futuro debera organizarse como un ensamblado ligero de infraestructura HTTP, sin concentrar logica de negocio.

Bloques esperados:

1. carga de configuracion
2. inicializacion de la aplicacion Express
3. registro de middlewares base
4. montaje de rutas por dominio
5. manejo centralizado de errores
6. arranque del servidor o export del handler

## Entrypoint esperado

El entrypoint principal debera:

- leer configuracion de `config/`,
- inicializar Express,
- aplicar middlewares comunes,
- montar rutas desde `routes/`,
- delegar controladores y servicios a sus capas correspondientes,
- preparar health checks y observabilidad basica cuando se implemente.

## Responsabilidades del servidor

- exponer la aplicacion HTTP,
- registrar middlewares globales,
- montar el arbol de rutas,
- establecer la base para errores consistentes,
- mantener separacion entre infraestructura y logica de negocio.

## Regla arquitectonica

El servidor Express no debe contener logica de negocio compleja. Su responsabilidad es componer la aplicacion backend y delegar en capas modulares.
