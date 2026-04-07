# Repositories

## Proposito

Esta carpeta define la capa de acceso a datos del backend.

## Regla arquitectonica

Toda interaccion con Supabase debe pasar por `repositories/`.

Esto implica:

- los `controllers/` no deben consultar Supabase directamente,
- los `services/` no deben construir clientes ni leer entorno para acceso a datos,
- los `clients/` encapsulan el SDK y la configuracion,
- los `repositories/` encapsulan operaciones de lectura y escritura.

## Responsabilidad de la capa repository

- consumir clientes tecnicos ya preparados,
- exponer operaciones de acceso a datos con nombres claros,
- aislar detalles de persistencia del resto del backend,
- facilitar pruebas futuras y cambios de implementacion.

## Alcance actual

En esta fase la capa repository ya permite una primera verificacion tecnica controlada.

- no contiene logica de negocio,
- usa el cliente de Supabase encapsulado en `clients/`,
- prioriza `anon key` por defecto,
- aplica fallback estructurado si Supabase no esta configurado o si la verificacion tecnica falla.

## Comportamiento del repository de sistema

Archivo:

- `system.repository.js`

Funcion disponible:

- `getSystemStatus()`

Comportamiento:

- intenta una verificacion tecnica minima contra `auth/v1/settings`,
- usa `anon key` por defecto,
- si Supabase no esta configurado, devuelve estado estructurado sin lanzar consulta,
- si Supabase no responde o devuelve error HTTP, devuelve fallback controlado.
