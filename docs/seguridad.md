# Seguridad

## Proposito

Este documento complementa el modelo general de seguridad y se centra en la futura capa backend Node.js.

## Seguridad backend Node.js

Node.js actuara como backend principal de aplicacion, por lo que debe operar con controles conservadores y minimo privilegio.

## Gestion de variables de entorno

- cargar variables por entorno: local, staging y produccion,
- no hardcodear secretos en codigo fuente,
- mantener variables privilegiadas solo en backend o serverless controlado,
- documentar variables esperadas sin exponer valores reales.

## Uso minimo privilegio

- usar `SUPABASE_SERVICE_ROLE_KEY` solo cuando el caso lo requiera realmente,
- preferir accesos con privilegios limitados para operaciones comunes,
- no exponer credenciales backend al frontend,
- separar credenciales por entorno y por integracion.

## Estructura de logs backend

Todo backend Node.js futuro debera registrar como minimo:

- `correlation_id`
- origen de la solicitud
- controlador o servicio implicado
- estado de ejecucion
- resumen de error cuando aplique
- tiempo de inicio y fin

Regla:
no registrar secretos, tokens ni payloads sensibles completos sin necesidad operativa justificada.

## Seguridad en servidor Express

### Estructura de middlewares

- middleware de trazabilidad y `correlation_id`,
- middleware de validacion de inputs,
- middleware de manejo centralizado de errores,
- middleware de controles transversales cuando el sistema crezca.

### Gestion de errores

- normalizar errores tecnicos y funcionales,
- evitar fugas de detalles internos en respuestas publicas,
- registrar errores estructurados para soporte y auditoria,
- mantener respuestas consistentes por tipo de fallo.

### Validacion de inputs

- validar parametros, query y body antes de llegar a la logica de negocio,
- rechazar entradas mal formadas de forma temprana,
- evitar que controladores o servicios dependan de datos no normalizados.

### Logging estructurado

- registrar eventos HTTP relevantes con formato consistente,
- incluir `correlation_id`, ruta, metodo, estado y tiempos,
- no incluir secretos ni payloads sensibles completos,
- mantener separacion entre logs de aplicacion y logs de infraestructura.

## Separacion de entornos

- entorno local para desarrollo y validacion interna,
- entorno staging para pruebas integradas,
- entorno produccion para operacion real,
- variables, endpoints y credenciales separados por entorno.

## Relacion con otros documentos

- `docs/modelo-seguridad.md` define el marco general,
- este documento anade criterios especificos para backend Node.js.
