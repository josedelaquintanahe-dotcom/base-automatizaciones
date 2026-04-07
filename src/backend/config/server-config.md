# Configuracion del servidor

## Proposito

Este archivo documenta las variables de configuracion esperadas para el futuro servidor Express.

## Variables necesarias futuras

- `PORT`
- `NODE_ENV`
- `BASE_API_PATH`

## Descripcion

### `PORT`

Puerto de escucha del backend en entorno local o persistente.

### `NODE_ENV`

Entorno de ejecucion del backend, por ejemplo `development`, `staging` o `production`.

### `BASE_API_PATH`

Prefijo base de las rutas HTTP del backend. Valor inicial recomendado:

`/api`

## Regla

Estas variables deben cargarse por entorno y nunca contener secretos incrustados en el repositorio.
