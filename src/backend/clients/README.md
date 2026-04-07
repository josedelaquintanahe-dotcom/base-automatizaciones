# Clients

## Proposito

Esta carpeta agrupa clientes y adaptadores para servicios externos o gestionados utilizados por el backend.

## Cliente base de Supabase

Archivo:

- `supabase.client.js`

## Responsabilidad

- leer configuracion de entorno relacionada con Supabase,
- validar si las variables necesarias existen,
- exponer un cliente real encapsulado con el SDK oficial,
- evitar que controladores o servicios lean variables de entorno directamente.

## Variables utilizadas

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Cliente base de n8n

Archivo:

- `n8n.client.js`

Variables utilizadas:

- `N8N_WEBHOOK_BASE_URL`

Responsabilidad:

- leer configuracion base de webhooks o entrada a n8n,
- validar si la URL base existe,
- preparar una futura capa de invocacion de workflows sin ejecutarla todavia.

## Cliente base de Rendel

Archivo:

- `rendel.client.js`

Variables utilizadas:

- `RENDEL_API_KEY`

Responsabilidad:

- leer configuracion de autenticacion para Rendel.com,
- validar si la clave existe,
- preparar una futura capa de invocacion de agentes sin ejecutarla todavia.

## Estado actual

El cliente actual usa el SDK oficial de Supabase, pero de forma controlada:

- lee variables desde entorno,
- permite crear cliente con clave anon o service role,
- no ejecuta consultas de negocio por si mismo,
- no usa credenciales reales,
- mantiene la integracion encapsulada dentro de `clients/`.

Los clientes de `n8n` y `Rendel` quedan preparados de forma estructural:

- leen variables de entorno,
- validan configuracion minima,
- exponen placeholders de diagnostico,
- no abren conexiones ni ejecutan llamadas externas todavia.

## Uso recomendado

Los servicios o repositorios que necesiten Supabase deben depender de este cliente, en lugar de acceder al entorno directamente.

Patron recomendado:

- `createSupabaseClient()` para acceso controlado al SDK,
- `checkSupabaseConnectivity()` para verificacion tecnica real contra Supabase,
- `validateSupabaseClientConfig()` para validaciones previas,
- `createSupabaseClientPlaceholder()` para diagnostico de configuracion sin operar contra Supabase.
- `validateN8nClientConfig()` y `createN8nClientPlaceholder()` para n8n.
- `validateRendelClientConfig()` y `createRendelClientPlaceholder()` para Rendel.

## Regla arquitectonica

Toda integracion futura con Supabase debe mantenerse encapsulada en esta capa de clientes o adaptadores para preservar modularidad y facilitar pruebas.

La misma regla aplica para n8n y Rendel: cualquier llamada real futura debe mantenerse dentro de `clients/`.
