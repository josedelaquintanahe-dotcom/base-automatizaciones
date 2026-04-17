# Decisiones tecnicas

## 2026-04-07

### D-001. El repositorio funcionara como plantilla reutilizable

Se establece que este proyecto no representa un unico producto cerrado, sino una base estructural para futuros sistemas de automatizacion empresarial.

Motivo:
Permite reutilizar convenciones, documentacion y modulos entre proyectos.

### D-002. Separacion modular por dominios operativos

Se adoptan las carpetas `database`, `workflows`, `agents`, `deployment`, `integrations` y `config` como particion principal del repositorio.

Motivo:
Reduce acoplamiento, mejora localizacion de responsabilidades y facilita mantenimiento.

### D-003. Documentacion arquitectonica desde el inicio

Se crea `docs/arquitectura.md`, `docs/plan.md` y `docs/decisiones.md` antes de introducir implementacion especifica.

Motivo:
La base necesita trazabilidad y claridad estructural antes de crecer en codigo o automatizaciones reales.

### D-004. Compatibilidad completa con Windows

El repositorio prioriza compatibilidad con Windows en nombres, rutas y documentacion operativa.

Motivo:
El entorno principal del proyecto es Windows y la base debe poder ejecutarse y mantenerse sin friccion en ese sistema.

### D-005. Exclusion estricta de credenciales reales

Solo se permiten plantillas de variables de entorno y referencias documentales; las credenciales reales quedan fuera del repositorio.

Motivo:
Protege la seguridad del sistema y evita fugas de secretos en control de versiones.

### D-006. Codex como agente de mantenimiento estructural

Se define a Codex como agente responsable de preservar la consistencia documental y estructural del repositorio.

Motivo:
Centraliza la disciplina de mantenimiento y reduce deriva organizativa a medida que el sistema evolucione.

### D-007. Separacion formal de entornos local, staging y produccion

Se adopta una separacion explicita por entornos para Supabase, n8n, Rendel.com y Vercel antes de iniciar integraciones reales.

Motivo:
Reduce el riesgo de mezclar datos, credenciales o despliegues entre fases de desarrollo y operacion.

### D-008. Seguridad conservadora y trazabilidad obligatoria

Se establece como criterio que toda integracion futura debe apoyarse en minimo privilegio, variables por entorno y registros de eventos, workflows y agentes.

Motivo:
Permite una evolucion segura, auditable y preparada para diagnostico desde etapas tempranas.

### D-009. Node.js seleccionado como backend principal del sistema

Se adopta Node.js como backend principal de aplicacion para centralizar integraciones externas, logica de negocio, endpoints intermedios, adaptadores entre Supabase y n8n, control de agentes y servicios reutilizables.

Motivo:
Evita dispersar la logica de aplicacion entre serverless, workflows y servicios gestionados, mejora mantenibilidad y prepara una estructura backend modular para crecimiento controlado.

### D-010. Express seleccionado como framework HTTP del backend Node.js

Se adopta Express como framework HTTP principal para estructurar el backend Node.js mediante rutas, middlewares, controladores y manejo centralizado de errores.

Motivo:
Permite una base simple, modular y ampliamente conocida para organizar la capa HTTP sin introducir complejidad prematura ni romper la separacion por capas definida para el sistema.

### D-011. Carga local de variables mediante .env.local solo en desarrollo

Se adopta `src/backend/.env.local` como archivo privado de entorno para desarrollo local del backend, cargado automaticamente solo cuando el entorno es `development` o no esta definido.

Motivo:
Permite activar integraciones locales sin exponer secretos en el repositorio y mantiene una separacion clara entre configuracion local, staging y produccion.

### D-012. La verificacion de conectividad de Supabase no dependera de tablas de negocio

Se adopta que `GET /api/system/status` valide conectividad real contra un endpoint tecnico de Supabase accesible con `anon key`, sin depender de la existencia o permisos sobre tablas como `logs_eventos`.

Motivo:
Separar disponibilidad de infraestructura de permisos de datos evita falsos negativos y permite diagnosticar con precision si falta configuracion, si Supabase responde o si el problema esta en el modelo de datos o en RLS.

## 2026-04-15

### D-013. Los endpoints globales de backoffice tendran autenticacion separada de los tokens de cliente

Se adopta que los endpoints administrativos globales, como `GET /api/clientes`, no se expondran en publico ni reutilizaran `authMiddleware`, ya que ese middleware autentica tokens operativos asociados a un `cliente_id` concreto.

Motivo:
Mantiene el aislamiento entre clientes, evita que un token de cliente obtenga visibilidad global y separa claramente el acceso administrativo interno del acceso operativo de autoservicio.

### D-014. La proteccion minima de backoffice se resuelve con un bearer token dedicado en backend

Se adopta una proteccion minima y reversible basada en `Authorization: Bearer` con un secreto de entorno exclusivo del backend (`BACKOFFICE_API_TOKEN`) para los endpoints internos de backoffice mientras no exista un sistema formal de identidades administrativas.

Motivo:
Evita exponer el endpoint, no introduce complejidad prematura y permite operar el panel interno sin incrustar secretos en el repositorio ni mezclar credenciales de cliente con privilegios de administracion.

### D-015. El backend Node.js se preparara para despliegue persistente en Render sin alterar el flujo local

Se adopta una estructura de despliegue en Render basada en `render.yaml` en la raiz del repositorio, con `rootDir` apuntando a `src/backend`, manteniendo `src/backend/.env.local` solo para desarrollo local y usando variables de entorno separadas en Render para staging o produccion.

Motivo:
Permite desplegar el backend Express como servicio persistente sin mover carpetas ni romper el arranque local actual, y hace explicita la configuracion minima necesaria para un entorno gestionado.

## 2026-04-16

### D-016. El detalle operativo de cliente se expone como endpoint administrativo separado y preparado para automatizaciones

Se adopta que el detalle de cliente para operaciones internas no reutilice `GET /api/clientes/:cliente_id`, sino un endpoint administrativo especifico protegido con backoffice (`GET /api/clientes/backoffice/:cliente_id`) que devuelva contexto operativo agregado sin exponer secretos.

Motivo:
Permite mantener separado el autoservicio del cliente y el backoffice interno, y prepara un contrato estable para alimentar automatizaciones futuras de onboarding con estado, readiness y proximos pasos sin romper el flujo ya validado de alta y listado.

### D-017. La activacion de onboarding se ejecuta como accion administrativa controlada y desacoplada del dispatcher real

Se adopta una accion administrativa `POST /api/clientes/backoffice/:cliente_id/activar-onboarding` protegida con backoffice, que solo puede ejecutarse si `automation_readiness.ready` es verdadero y no existen requisitos bloqueantes. En esta fase la accion registra estado y trazabilidad, pero no dispara todavia una automatizacion real en n8n.

Motivo:
Permite a operaciones activar onboarding de forma segura desde el detalle de cliente, deja persistido un estado operativo reutilizable y prepara un punto de integracion limpio para conectar el dispatcher real mas adelante sin romper los contratos ya validados.

Nota de alineacion 2026-04-17:
La activacion no introduce un nuevo valor en `clientes.estado`. La tabla solo admite `activo` y `suspendido`, por lo que la accion mantiene `activo`, conserva `fecha_inicio` y devuelve el estado de activacion a traves del contrato de backoffice mientras no exista una persistencia dedicada para auditoria o dispatcher.
