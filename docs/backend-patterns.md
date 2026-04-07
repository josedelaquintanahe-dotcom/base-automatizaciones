# Patrones backend recomendados

## Proposito

Este documento define patrones backend recomendados para la futura implementacion en Node.js.

## Controller pattern

Responsabilidad:

- recibir la solicitud,
- validar lo minimo necesario,
- delegar en servicios,
- devolver respuesta estructurada.

Regla:
los controladores no deben contener logica de negocio compleja ni acceso directo desordenado a integraciones.

## Express routing layer

Responsabilidad:

- definir rutas por dominio,
- montar prefijos y versionado,
- aplicar middlewares de forma declarativa,
- delegar rapidamente en controladores.

Regla:
las rutas no deben convertirse en una segunda capa de negocio.

## Service layer

Responsabilidad:

- implementar logica de negocio,
- coordinar repositorios y clientes,
- aplicar reglas transversales,
- normalizar flujo de errores y resultados.

Regla:
la mayor parte de la logica reusable debe vivir aqui.

## Repository layer

Responsabilidad:

- encapsular acceso a persistencia,
- aislar consultas y escrituras,
- reducir acoplamiento con el proveedor de datos.

Regla:
el acceso a datos no debe quedar distribuido por controladores o servicios sin criterio.

## Integration clients

Responsabilidad:

- encapsular llamadas a Supabase, n8n, Rendel.com y otras APIs,
- normalizar timeouts, errores y formatos,
- mantener desacopladas las integraciones del resto del backend.

Regla:
cada cliente debe tener una responsabilidad concreta y una interfaz clara.

## Middlewares

Responsabilidad:

- aplicar validaciones comunes,
- centralizar trazabilidad y `correlation_id`,
- gestionar autenticacion cuando exista,
- estandarizar errores y comportamiento HTTP transversal.

Regla:
los middlewares deben resolver preocupaciones transversales, no reemplazar servicios ni controladores.

## Estructura Express recomendada

- `app/`
- `routes/`
- `controllers/`
- `services/`
- `repositories/`
- `clients/`
- `middlewares/`
- `config/`

## Carga de configuracion local

Patron recomendado:

- `.env.example` como contrato publico,
- `src/backend/.env.local` como archivo privado de desarrollo,
- carga automatica solo en `development`,
- validacion posterior en `config/server-config.js`.

## Beneficio estructural

Estos patrones permiten cambios pequenos, pruebas futuras mas simples, menor acoplamiento y una evolucion mas controlada del backend.

## Estado actual

La estructura del backend ya sigue estos patrones a nivel base, pero todavia en un alcance minimo y controlado.

Implementado:

- enrutado Express modular,
- controladores ligeros,
- servicios basicos,
- repositories de ejemplo,
- clients estructurales,
- middlewares para trazabilidad, errores y logging.

Pendiente:

- casos de uso reales,
- acceso a datos de negocio,
- integraciones externas activas,
- validacion avanzada de inputs por dominio.
