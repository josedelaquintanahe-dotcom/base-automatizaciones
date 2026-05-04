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

### D-018. La salida oficial de activacion de onboarding se centraliza en un dispatcher backend interno

Se adopta una capa explicita de dispatcher backend para la activacion de onboarding. `POST /api/clientes/backoffice/:cliente_id/activar-onboarding` mantiene su contrato actual, pero deja de construir el dispatch inline y delega en un servicio especializado que registra el evento estructurado `onboarding_activated` y resuelve un destino interno.

Motivo:
Permite separar persistencia de negocio, registro de eventos y salida hacia automatizaciones reales. Deja una base clara para conectar destinos futuros como webhooks de n8n, colas o workers sin romper `ClienteDetalle`, el frontend actual ni el endpoint ya validado.

### D-019. El dispatcher de onboarding puede publicar opcionalmente un webhook externo sin bloquear la activacion principal

Se adopta `ONBOARDING_DISPATCH_WEBHOOK_URL` como variable opcional de entorno para publicar el evento `onboarding_activated` hacia un webhook externo preparado para n8n. El envio se ejecuta desde el dispatcher backend, registra logs estructurados y, si falla, no rompe la respuesta principal de activacion.

Motivo:
Permite conectar una automatizacion real con minimo acoplamiento y sin degradar el flujo ya validado de backoffice. El backend conserva el control del contrato, el `correlation_id` y el fallback interno cuando el webhook no esta configurado o devuelve error.

### D-020. Los eventos de automatizacion se persisten en una tabla tecnica dedicada y con escritura best effort

Se adopta `automation_events` como tabla tecnica para registrar eventos emitidos por dispatchers backend, empezando por `onboarding_activated`. La persistencia se ejecuta al final del dispatcher con metadatos de envio reales (`dispatch_mode`, `dispatch_status`, `destination`, `error_message`) y se implementa como escritura best effort para no romper el endpoint principal si Supabase no esta configurado o la tabla todavia no existe.

Motivo:
Permite trazabilidad y auditoria persistente sin acoplar el flujo HTTP a la disponibilidad de la capa de datos. Deja una estructura reutilizable para futuros eventos de automatizacion sin limitarla a onboarding.

### D-021. El webhook de onboarding expone un contrato limpio, versionado y desacoplado del evento interno

Se adopta un payload saliente especifico para `onboarding_activated` hacia n8n, con `version` explicita y campos operativos estables. El backend no envia el objeto interno `event` tal cual al webhook, sino un contrato limpio orientado a integracion.

Motivo:
Reduce acoplamiento entre el modelo interno del backend y el workflow de n8n, facilita evolucionar el dispatcher sin romper consumidores externos y mantiene un contrato mas claro para integraciones reales.

### D-022. La primera accion real de n8n tras onboarding_activated sera persistir una ejecucion tecnica del workflow

Se adopta `ejecuciones_workflows` como tabla tecnica minima para registrar la recepcion y resultado de la primera automatizacion real disparada por `onboarding_activated`. El primer workflow de n8n debe insertar una fila al recibir el webhook, reutilizar `correlation_id` y actualizar su estado final a `completed` o `error`.

Motivo:
Es la accion de menor riesgo con efecto real verificable, cierra la trazabilidad extremo a extremo entre backend y n8n y no introduce todavia efectos externos mas delicados como emails, altas en terceros o manejo de credenciales.

## 2026-04-21

### D-023. La trazabilidad n8n de onboarding usara el nombre logico `onboarding_activated`

Se adopta `workflow_name = "onboarding_activated"` para la fila tecnica de `ejecuciones_workflows`, aunque el archivo documental del workflow conserve un nombre versionado para organizacion interna del repositorio.

Motivo:
El nombre logico debe coincidir con el evento operacional que ya viaja por el backend y por `automation_events`, mientras que la version del documento puede evolucionar sin romper consultas operativas por `correlation_id` o por workflow.

## 2026-04-27

### D-024. La configuracion publica y la invocacion a n8n deben alinearse con el backend real

Se adopta que `.env.example` refleje todas las variables que el backend lee realmente, incluyendo las opcionales de backoffice y dispatch hacia n8n, y que las llamadas HTTP a n8n se encapsulen en `src/backend/clients/n8n.client.js` en lugar de quedar repartidas en servicios.

Motivo:
Reduce deriva entre documentacion y runtime, facilita preparar entornos locales o productivos sin omisiones y deja una capa reutilizable para auditar, probar y evolucionar integraciones con n8n sin duplicar logica HTTP.

### D-025. Se incorpora una base minima de lint por paquete sin acoplar frontend y backend

Se adopta una configuracion minima de ESLint independiente para `src/backend` y `src/frontend`, con scripts propios por paquete y comandos documentados desde la raiz, sin forzar por ahora un workspace unico en la raiz del repositorio.

Motivo:
Permite verificar calidad estatica de forma inmediata con bajo riesgo de refactor estructural, mantiene la separacion actual del repositorio y deja margen para consolidar tooling mas adelante si el proyecto lo necesita.

### D-026. El sistema operativo de agentes de Codex se consolida sobre Markdown versionado

Se adopta `CONTEXT.md`, `AGENTS.md`, `.codex/skills/` y `.codex/playbooks/` como capa documental operativa del sistema de agentes de Codex en este repositorio. Los archivos existentes deben conservarse, ordenarse y completarse sin sustituir la logica del producto, y los documentos base de `docs/` deben reflejar tanto el estado detectado como la arquitectura prevista.

Motivo:
Permite convertir instrucciones dispersas en un sistema coherente de trabajo, reusable y auditable para futuros agentes, sin mezclar la operativa de Codex con cambios de backend, frontend o workflows productivos.

## 2026-04-28

### D-027. La documentacion canonica de arquitectura, seguridad y despliegue debe basarse en hechos verificados del repo

Se adopta que `docs/ARCHITECTURE.md`, `docs/SECURITY.md` y `docs/DEPLOYMENT.md` describan solo estructura, variables, comandos y proveedores comprobables desde el repositorio o desde validaciones ya realizadas. Cuando exista una opcion futura no confirmada, debe marcarse como `Pendiente de validar` y no como estado operativo actual.

Motivo:
Evita deriva entre la documentacion canonica y el estado real del proyecto, reduce ambiguedad para futuros agentes y mantiene una separacion clara entre arquitectura detectada, arquitectura prevista y operacion todavia no confirmada.

### D-028. Tras la primera validacion del sistema de agentes, el foco documental pasa de consolidacion a sincronizacion operativa

Se adopta que, una vez verificados `CONTEXT.md`, `AGENTS.md`, `docs/PROJECT_STATUS.md`, `docs/ROADMAP.md` y la base de `.codex/`, la documentacion canonica deje de describir el sistema de agentes como solo "iniciado" o "pendiente de consolidar" y pase a tratarlo como una capa ya estructurada, sujeta a sincronizacion y validacion continua.

Motivo:
Evita contradicciones entre el contexto principal y los documentos de estado, y deja claro que el siguiente trabajo seguro ya no es crear la base del sistema, sino mantenerla alineada con la evolucion real del repositorio.

### D-029. Los documentos historicos en espanol se conservan, pero deben marcar su vigencia y alinearse con la capa canonica

Se adopta que archivos como `docs/arquitectura.md`, `docs/seguridad.md`, `docs/plan.md`, `docs/modelo-seguridad.md` y `docs/entornos.md` se mantengan como contexto historico y complementario, pero incorporen notas de vigencia y ajustes de estado cuando la capa canonica (`CONTEXT.md`, `docs/PROJECT_STATUS.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DEPLOYMENT.md`) ya refleje mejor la realidad actual del repositorio.

Motivo:
Permite conservar informacion util previa sin dejar contradicciones activas sobre integraciones reales, despliegue confirmado o papel actual de componentes todavia pendientes de validar como Rendel.com o Vercel productivo.

### D-030. La carpeta `docs/` tendra un indice explicito para distinguir capa canonica, historica y de apoyo

Se adopta `docs/README.md` como mapa de lectura de la documentacion del proyecto. Este indice debe indicar prioridad de lectura, documentos canonicos, documentos historicos/complementarios y duplicidades controladas.

Motivo:
Reduce ambiguedad para futuros agentes y mantenedores, evita que cada revision tenga que reinterpretar manualmente que documento manda sobre otro y permite conservar el historico sin bloquear la operativa diaria.

### D-031. La entrada al repositorio debe repetir el mismo orden operativo de lectura para agentes nuevos

Se adopta que `README.md` y `docs/README.md` reflejen de forma explicita el mismo orden minimo de lectura definido en `AGENTS.md`: `CONTEXT.md`, `AGENTS.md`, `docs/PROJECT_STATUS.md`, `docs/ROADMAP.md` y despues la documentacion especifica del bloque a tocar.

Motivo:
Evita que un agente nuevo tenga que inferir el orden correcto entre varios documentos de entrada y reduce errores de contexto al iniciar revisiones documentales o tecnicas.

### D-032. La documentacion de apoyo de workflows y despliegue debe distinguir entre guia reutilizable y estado operativo confirmado

Se adopta que `workflows/README.md`, `deployment/README.md` y checklists asociados conserven su valor como guia reutilizable, pero incorporen notas de vigencia y situacion actual cuando el repositorio ya tenga backend, frontend, integracion real con Supabase o flujos activos documentados en n8n.

Motivo:
Evita que documentos de apoyo mas antiguos contradigan a la capa canonica de `docs/` y reduce ambiguedad sobre que partes son patron general y que partes reflejan el estado real ya verificado del proyecto.

### D-033. La documentacion comercial y backend de apoyo debe reflejar el backend real y separar agentes Codex de agentes externos

Se adopta que `docs/SALES_PLAYBOOK.md`, `docs/backend-node.md`, `docs/backend-patterns.md` y `agents/README.md` conserven su valor como guia, pero sin contradecir el estado real del backend actual ni mezclar el sistema de agentes de Codex con una futura capa de agentes externos como Rendel.com.

Motivo:
Evita mensajes tecnicos ya obsoletos, aclara el alcance actual del repositorio y reduce ambiguedad para futuros agentes o mantenedores al distinguir entre lo ya operativo y lo todavia pendiente de validar.

### D-034. El webhook de dispatch de onboarding en Render se fijara desde `render.yaml` con la ruta real activa de n8n

Se adopta declarar `ONBOARDING_DISPATCH_WEBHOOK_URL` en `render.yaml` con el valor absoluto del workflow activo `onboarding_activated` de n8n Cloud. Este valor no se trata como secreto y debe mantenerse versionado para evitar deriva entre la URL documentada, la URL configurada en despliegue y la ruta real que escucha el workflow.

Motivo:
La validacion operativa ha confirmado que el backend desplegado estaba enviando a una ruta con guion medio (`onboarding-activated`) mientras el workflow activo de n8n escucha en la ruta con guion bajo (`onboarding_activated`). Gestionar esta variable desde el blueprint reduce riesgo de deriva manual y permite reproducir el entorno correcto tras cada sync del despliegue.

### D-035. El flujo de onboarding requerira una verificacion operativa minima tras cambios de entorno o webhook

Se adopta como control operativo minimo que cualquier cambio en Render, en `render.yaml`, en el workflow `onboarding_activated` o en variables de entorno relacionadas con n8n vaya seguido de una verificacion real del flujo `backend -> automation_events -> n8n -> ejecuciones_workflows`, comprobando el mismo `correlation_id` en ambas tablas.

Motivo:
La incidencia resuelta el 28 de abril de 2026 no fue un fallo de logica de aplicacion sino una deriva de configuracion entre el backend desplegado y la ruta real del webhook activo en n8n. Sin una comprobacion operacional posterior al cambio, ese tipo de error puede permanecer oculto aunque el backend responda `200` y registre `automation_events`.

### D-036. El endurecimiento operativo de onboarding priorizara observabilidad y validacion de configuracion antes que reintentos automaticos

Se adopta reforzar el backend de onboarding con advertencias de configuracion, resumen seguro del estado del dispatch y logs de fallo con mas contexto, evitando por ahora reintentos automaticos del webhook.

Motivo:
En este flujo, un reintento ciego puede duplicar efectos en n8n si la primera llamada llego pero la respuesta se perdio. El problema detectado en produccion fue de configuracion, no de fiabilidad transitoria. Por eso conviene mejorar primero la observabilidad y la validacion de la URL real del webhook antes de introducir reintentos o semanticas de idempotencia mas complejas.

### D-037. La verificacion real de onboarding se versionara como script PowerShell reutilizable

Se adopta versionar una prueba operativa de onboarding en `scripts/verify-onboarding-flow.ps1`, compatible con Windows y parametrizada por `ClientId`, para validar de forma repetible el flujo `backend -> automation_events -> n8n -> ejecuciones_workflows` usando variables reales del entorno local sin exponer secretos en el repositorio.

Motivo:
La validacion manual ya ha demostrado valor, pero deja demasiado margen a errores operativos y pasos dispersos. Versionar el smoke test reduce friccion, mejora repetibilidad y permite revalidar despliegues o cambios de n8n con una sola comprobacion trazable.

### D-038. La comprobacion operativa desplegada se concentrara en un solo script ejecutable

Se adopta versionar un punto de entrada operativo unico en `scripts/run-onboarding-operational-check.ps1` para verificar `health`, `system/status` y el smoke test real de onboarding en la misma ejecucion, reutilizando el script de validacion ya existente.

Motivo:
La seguridad y la eficiencia operativa mejoran cuando la verificacion post-despliegue tiene una sola entrada reproducible. Esto reduce pasos manuales, evita olvidos al revisar `onboardingDispatch` y deja un flujo claro para revalidar Render, Supabase y n8n despues de cambios de entorno.

### D-039. El smoke test base de onboarding fallara antes si el preflight operativo ya detecta mala configuracion

Se adopta que `scripts/verify-onboarding-flow.ps1` consulte `GET /api/system/status` antes de activar onboarding y aborte si `onboardingDispatch` no aparece configurado o con `pathStatus = expected`.

Motivo:
Activar onboarding cuando el propio backend ya informa de una configuracion no valida introduce ruido operativo y puede generar efectos innecesarios. El preflight temprano reduce riesgo, acelera diagnostico y refuerza el principio de fallo seguro antes de disparar automatizaciones reales.

### D-040. Los workflows reales de n8n tendran exportacion JSON sanitaria versionada en el repo

Se adopta mantener en `n8n/workflows/` una exportacion JSON sanitaria del workflow real activo cuando el flujo ya sea operativo y relevante para soporte o auditoria. Esta exportacion no sustituye a la documentacion funcional de `workflows/`, pero sirve como artefacto tecnico versionado para reducir deriva entre la instancia cloud y el repositorio.

Motivo:
Una vez validado un workflow real en produccion, dejarlo solo en la UI de n8n Cloud crea un punto ciego operativo. Versionar una exportacion sanitaria mejora trazabilidad, revision tecnica y recuperabilidad sin exponer secretos ni depender solo de la instancia remota.

## 2026-04-29

### D-041. La siguiente fase funcional priorizara workflows de auditoria post-onboarding antes de efectos externos

Se adopta que los siguientes cinco workflows de n8n tras `onboarding_activated` pertenezcan a una secuencia de auditoria y verificacion operativa de bajo riesgo: `onboarding_trace_verified`, `onboarding_readiness_revalidated`, `onboarding_credentials_metadata_checked`, `onboarding_dispatch_health_checked` y `onboarding_sanitized_report_compiled`.

Motivo:
El proyecto ya ha validado la trazabilidad extrema a extrema y cuenta con smoke tests operativos. El siguiente paso con mejor relacion valor/riesgo es ampliar observabilidad y evidencia reutilizable sin tocar sistemas externos ni introducir efectos de negocio irreversibles.

### D-042. Los workflows de auditoria post-onboarding compartiran un contrato tecnico comun y resultado sanitario embebido

Se adopta que estos workflows reutilicen un contrato comun basado en `correlation_id`, `workflow_name`, `workflow_version`, `check_name`, `check_status`, `result_summary`, `next_action` y `sanitized_result`, evitando secretos, credenciales desencriptadas o mutaciones de negocio. Dado que la implementacion actual de `ejecuciones_workflows` no tiene columna `output_payload`, el resultado sanitario debe viajar en la respuesta del workflow y, si se persiste, hacerlo dentro de `input_payload`.

Motivo:
Un contrato comun simplifica validacion, documentacion, smoke tests y futura consolidacion en reportes tecnicos, a la vez que reduce el riesgo de deriva entre workflows parecidos y evita ampliar privilegios antes de tiempo.

### D-043. `onboarding_trace_verified` se implementara primero como blueprint SDK validado y borrador inactivo con trigger webhook interno

Se adopta que el primer workflow de la secuencia, `onboarding_trace_verified`, quede materializado en el repositorio como blueprint SDK validado (`n8n/workflows/onboarding_trace_verified.workflow.ts`) y en n8n Cloud como borrador inactivo antes de cualquier activacion o encadenamiento con otros workflows. Para esta primera version, el trigger canonico sera un webhook `POST` interno y controlado con la ruta `onboarding_trace_verified`.

Motivo:
Este enfoque reduce riesgo operativo al separar tres estados distintos: definicion funcional, blueprint tecnico validado y workflow creado en n8n. Tambien evita introducir todavia dependencias de orquestacion entre workflows mientras se comprueba que el patron tecnico de lectura en `automation_events` y escritura en `ejecuciones_workflows` es estable.

### D-044. La validacion real de `onboarding_trace_verified` tendra script operativo propio antes de activarse

Se adopta preparar un script PowerShell reutilizable para invocar `onboarding_trace_verified` con un `correlation_id` ya conocido y verificar su persistencia tecnica en `ejecuciones_workflows` antes de activar el workflow en n8n Cloud.

Motivo:
El patron del proyecto ya ha demostrado que los scripts operativos reducen friccion, aceleran diagnostico y evitan comprobaciones manuales dispersas. Preparar este control antes de la activacion permite una salida mas segura cuando el workflow pase de borrador a ejecucion real.

### D-045. `onboarding_trace_verified` solo se publicara tras validar blueprint, borrador y prueba segura

Se adopta publicar `onboarding_trace_verified` en n8n Cloud solo cuando se cumplan estos cuatro controles previos: blueprint SDK validado, borrador creado, prueba segura con datos fijados y script operativo de validacion real disponible en el repositorio.

Motivo:
La publicacion de un workflow nuevo cambia el perimetro operativo de la instancia n8n. Exigir estos controles antes de activarlo mantiene el mismo nivel de rigor que ya se aplico al flujo `onboarding_activated` y reduce riesgo de activar endpoints incompletos o mal verificados.

### D-046. Los scripts de validacion de n8n resolveran de forma segura bases webhook y bases MCP

Se adopta que los scripts operativos que invoquen workflows de n8n acepten una `WorkflowWebhookUrl` explicita y, si componen la URL desde `N8N_WEBHOOK_BASE_URL`, sepan normalizar tambien bases mal orientadas a `mcp-server/http`.

Motivo:
La misma instancia de n8n puede exponer URLs distintas para MCP y para webhooks publicos. Si el script asume una sola forma de base, puede dar falsos fallos operativos aunque el workflow este bien publicado y accesible.

### D-047. `onboarding_readiness_revalidated` reutilizara `correlation_id` pero leera el payload origen desde `automation_events`

Se adopta que `onboarding_readiness_revalidated` mantenga un trigger webhook interno/controlado y reciba un payload minimo con `correlation_id`, `cliente_id` y `event_name`. La revalidacion de readiness se hara leyendo el `payload` del evento `onboarding_activated` en `automation_events`, en lugar de depender de que otro workflow le reenvie todo el contrato sanitario.

Motivo:
Este enfoque conserva la trazabilidad por `correlation_id`, evita duplicar payloads grandes entre workflows y hace que la validacion real siga siendo operable desde scripts sin introducir todavia una orquestacion `Execute Workflow` entre piezas nuevas.

### D-048. `onboarding_credentials_metadata_checked` validara el shape real de `operational_summary` emitido por backend

Se adopta que `onboarding_credentials_metadata_checked` lea `automation_events.payload.operational_summary` y use como contrato canonico las claves reales del backend: `credenciales.activas`, `credenciales.tipos_configurados` y `access.token_operativo_activo`.

Motivo:
La documentacion inicial simplificaba el payload como si `operational_summary` fuese plano. Implementar contra ese shape falso generaria checks inconsistentes. Alinear el workflow con el contrato real del backend evita deriva y mantiene la validacion de bajo riesgo, sin acceder a secretos ni recalcular estados desde tablas sensibles.

### D-049. `onboarding_dispatch_health_checked` usara un snapshot sanitario explicito de `/api/system/status`

Se adopta que `onboarding_dispatch_health_checked` reciba por webhook un `system_status_snapshot` sanitario y minimo, obtenido fuera del workflow desde el backend desplegado, en lugar de abrir una llamada HTTP nueva desde n8n al propio backend.

Motivo:
Este enfoque mantiene bajo el riesgo, evita dependencias de red adicionales dentro del workflow y reutiliza el mismo snapshot sanitario que ya usan los scripts operativos del proyecto para validar `onboardingDispatch`.

### D-050. `onboarding_sanitized_report_compiled` consolidara desde `ejecuciones_workflows` y no desde memoria inter-workflow

Se adopta que `onboarding_sanitized_report_compiled` lea las filas tecnicas ya persistidas en `ejecuciones_workflows` para el mismo `correlation_id` y consolide sobre esa evidencia, en lugar de depender de que otros workflows le reenvien outputs completos en memoria.

Motivo:
La tabla tecnica ya es la fuente de trazabilidad del sistema. Consolidar desde ahi reduce acoplamiento entre workflows, simplifica la validacion real de la secuencia completa y mantiene el criterio de bajo riesgo y alta auditabilidad.

### D-051. `onboarding_activated` pasara a encadenar automaticamente la secuencia auditiva post-onboarding

Se adopta que el workflow real `onboarding_activated`, ya activado como webhook oficial del backend, deje de limitarse a registrar su propia recepcion tecnica y pase a disparar de forma automatica `onboarding_trace_verified`, `onboarding_readiness_revalidated`, `onboarding_credentials_metadata_checked`, `onboarding_dispatch_health_checked` y `onboarding_sanitized_report_compiled` para el mismo `correlation_id`.

Motivo:
Es la forma de mayor valor y menor riesgo para convertir la activacion de onboarding en la primera automatizacion real de negocio operativa del proyecto sin introducir credenciales nuevas ni depender de acciones externas irreversibles.

### D-052. La cadena automatica de auditoria no bloqueara la aceptacion principal del webhook de onboarding

Se adopta que `onboarding_activated` siga respondiendo `202` al backend cuando el payload principal sea valido y su fila tecnica inicial quede registrada, aunque alguno de los workflows auditivos posteriores falle. En ese caso, la propia fila tecnica de `onboarding_activated` debe quedar en `error` y la respuesta del webhook debe incluir un resumen sanitario del fallo de la cadena.

Motivo:
El backend ya trata este dispatch como una accion operativa best effort y no conviene degradar la activacion administrativa del cliente por una incidencia posterior de diagnostico. Mantener la aceptacion principal y reflejar el error en trazabilidad tecnica preserva continuidad operativa y facilita soporte por `correlation_id`.

### D-053. `automation_events` debe persistirse antes del webhook n8n cuando el propio workflow depende de esa trazabilidad

Se adopta que el backend registre la fila de `automation_events` antes de invocar el webhook real `onboarding_activated` cuando la cadena automatica de n8n dependa de leer ese mismo evento por `correlation_id`. Si el dispatch externo falla, el backend debe actualizar despues el estado de entrega persistido en lugar de diferir toda la insercion al final.

Motivo:
La cadena automatica descubrio una dependencia circular: `onboarding_activated` intentaba disparar workflows que leen `automation_events`, pero el backend solo escribia esa fila despues de recibir la respuesta de n8n. En ese orden, los workflows hijos nunca podian verla dentro del mismo request. Registrar primero y corregir despues el estado de entrega resuelve la carrera sin romper la trazabilidad operativa.

### D-054. La siguiente automatizacion funcional real sera un snapshot sanitario interno ejecutable por workflow estatico

Se adopta `automation_client_health_snapshot` como la siguiente automatizacion real de negocio de bajo riesgo. Su objetivo es generar un resumen sanitario y operativo reutilizable del cliente ya dado de alta y con onboarding validado, sin efectos externos irreversibles ni uso de credenciales desencriptadas.

Motivo:
Permite convertir la base actual en una automatizacion funcional reutilizable para clientes reales apoyandose en tablas y servicios ya existentes (`automatizaciones`, `ejecuciones`, `ejecuciones_workflows`) y sin introducir dependencias nuevas con terceros. Tambien sirve como patron seguro para futuras automatizaciones que si necesiten integraciones mas delicadas.

### D-055. La ejecucion backend de automatizaciones usara `n8n_workflow_id` real y payload sanitario por defecto

Se adopta que `ejecutarWorkflowService` invoque el webhook n8n usando el `n8n_workflow_id` persistido en `automatizaciones`, en lugar de construir rutas dinamicas derivadas del `cliente_id` y del identificador pedido por API. El payload saliente debe incluir `correlation_id`, metadatos de la automatizacion y un `client_snapshot` sanitario obtenido desde backend, pero no credenciales desencriptadas por defecto.

Motivo:
La estrategia anterior basada en rutas compuestas `cliente-<cliente_id>-<workflow_id>` no escala bien hacia workflows reales versionados ni deja un contrato estable entre backend y n8n. Usar `n8n_workflow_id` como destino canonico y un payload sanitario reduce riesgo, mejora trazabilidad y evita exponer secretos innecesarios en la primera automatizacion real ejecutable.

### D-056. El cliente backend de n8n normalizara bases webhook mal orientadas al endpoint MCP

Se adopta que `src/backend/clients/n8n.client.js` convierta automaticamente bases `N8N_WEBHOOK_BASE_URL` que apunten a `.../mcp-server/http` en la base publica `.../webhook` antes de componer rutas de automatizacion genericas.

Motivo:
La operativa real del proyecto ya demostro que la misma instancia n8n expone URL de MCP y URL de webhooks publicos. Para scripts ya se habia resuelto esta divergencia, pero la ejecucion backend de automatizaciones reales seguia dependiendo de una base que podia devolver 404 aun con el workflow bien publicado. Normalizar en el adaptador reduce deriva y evita fallos silenciosos en nuevas automatizaciones.

### D-057. `N8N_WEBHOOK_BASE_URL` tambien debe fijarse desde `render.yaml` para evitar deriva en automatizaciones genericas

Se adopta declarar `N8N_WEBHOOK_BASE_URL` en `render.yaml` con la base publica de webhooks de la instancia n8n Cloud (`https://quinttanaaa.app.n8n.cloud/webhook`), igual que ya se hizo con `ONBOARDING_DISPATCH_WEBHOOK_URL`.

Motivo:
La validacion remota de `automation_client_health_snapshot` ha confirmado que el backend desplegado seguia alcanzando una URL de n8n que devolvia `404 No workspace here`, mientras el workflow publicado respondia correctamente cuando se invocaba con la base publica adecuada. Fijar esta variable en el blueprint de Render reduce configuracion manual oculta y evita divergencias entre backend desplegado, scripts operativos y workflows reales.

### D-058. La siguiente automatizacion real de bajo riesgo sera un brief interno de siguientes pasos para el cliente

Se adopta `automation_client_next_actions_brief` como la siguiente automatizacion real de bajo riesgo despues de `automation_client_health_snapshot`. Su objetivo es transformar el `client_snapshot` sanitario ya emitido por backend en un brief priorizado y reutilizable para operadores, sin modificar tablas de negocio ni llamar a servicios externos.

Motivo:
Las alternativas mas obvias eran repetir un resumen sanitario muy parecido al snapshot ya existente o entrar prematuramente en automatizaciones con efectos externos. Un brief de siguientes pasos aporta valor operativo nuevo, reutiliza el mismo contrato seguro, no exige credenciales nuevas y sirve como puente entre la base tecnica ya validada y futuras automatizaciones de cliente mas sensibles.

### D-059. La siguiente pieza interna priorizara un handoff operativo para la primera ejecucion real del cliente

Se adopta `automation_client_first_run_handoff` como la siguiente automatizacion interna a preparar en repositorio. Su objetivo es transformar el `client_snapshot` sanitario y el contexto de ejecucion solicitado en un paquete operativo de primer arranque: checklist de preflight, criterio go/no-go, notas de rollback y foco recomendado para la siguiente automatizacion con efecto de negocio.

Motivo:
Despues de `automation_client_health_snapshot` y `automation_client_next_actions_brief`, el siguiente salto con mejor valor/riesgo no es otro resumen, sino una pieza que acerque la operativa a una ejecucion real controlada. Un handoff de primer arranque conserva el patron seguro, no exige credenciales nuevas y reduce improvisacion antes de la primera automatizacion con efectos externos.

### D-060. Los scripts de verificacion de automatizaciones reales deben usar `Invoke-WebRequest -UseBasicParsing` en Windows PowerShell

Se adopta que los scripts PowerShell de verificacion que invoquen endpoints backend usen `Invoke-WebRequest -UseBasicParsing` cuando deban ejecutarse en Windows PowerShell clasico.

Motivo:
La validacion real de `automation_client_first_run_handoff` detecto un falso fallo local en el provisionado por una limitacion del motor de Internet Explorer embebido en Windows PowerShell. El backend respondia correctamente, pero el script interpretaba la llamada como error. Forzar `-UseBasicParsing` evita ese falso negativo y mantiene compatibilidad real con el entorno Windows objetivo del proyecto.

### D-061. La primera automatizacion con efecto operativo controlado programara una ejecucion futura reversible

Se adopta `automation_client_controlled_run_stage` como la primera automatizacion con efecto operativo controlado. Su efecto real se limita a programar `automatizaciones.proxima_ejecucion` de una automatizacion objetivo ya existente y activa, usando un `requested_first_run_at` explicito, un `target_workflow_id` canonico y un `client_snapshot` sanitario.

Motivo:
Es el siguiente salto de valor mas razonable tras `automation_client_first_run_handoff`. Introduce un efecto operativo verificable y util sin depender de credenciales nuevas, sin ejecutar todavia la automatizacion objetivo y con rollback claro al restaurar el valor previo de `proxima_ejecucion`. Esto acerca el proyecto a ejecuciones reales con clientes sin asumir aun el riesgo de acciones externas irreversibles.

## 2026-05-04

### D-062. La primera automatizacion objetivo con efecto operativo real controlado sera la creacion reversible de un borrador de factura

Se adopta `automation_client_invoice_draft_create` como la primera automatizacion objetivo con efecto operativo real controlado. Su efecto real se limita a crear una fila `pendiente` en `facturas` para un mes futuro no usado, reutilizando el contexto sanitario de facturacion del cliente y sin llamar a servicios externos.

Motivo:
Es la primera pieza que ya genera un artefacto operativo de negocio util para cliente sin introducir credenciales nuevas ni efectos irreversibles. Aprovecha la base ya validada de `client_snapshot`, `ejecuciones`, `ejecuciones_workflows` y `automation_client_controlled_run_stage`, y mantiene un alcance razonablemente seguro porque el resultado sigue siendo un borrador interno.

### D-063. El rollback de la primera automatizacion objetivo cancelara el borrador creado en lugar de borrarlo

Se adopta que el rollback de `automation_client_invoice_draft_create` no elimine la fila creada en `facturas`, sino que la marque como `cancelada` usando el mismo workflow en `rollback_mode`.

Motivo:
Cancelar preserva trazabilidad de negocio y tecnica, evita borrar evidencia de pruebas operativas y mantiene un rollback claro y auditable por `correlation_id` sin introducir mutaciones destructivas sobre datos de facturacion.

### D-064. Los scripts de verificacion remota en Windows delegaran cuerpos JSON complejos a archivo temporal

Se adopta que los scripts PowerShell de verificacion que invoquen backend remoto a traves de `node.exe` y `scripts/http-json.mjs` pasen el cuerpo JSON mediante archivo temporal (`--body-file`) en lugar de depender del paso directo del JSON como argumento de linea de comandos.

Motivo:
La validacion remota de `automation_client_invoice_draft_create` y del puente con `automation_client_controlled_run_stage` detecto falsos fallos al enviar JSON desde PowerShell hacia Node por quoting y normalizacion de fechas. Delegar el cuerpo a archivo temporal hace la invocacion mas estable en Windows y evita errores operativos que no pertenecen al backend ni a n8n.

### D-065. `prompt.md` sera la guia operativa recurrente para continuidad por bloques

Se adopta `prompt.md` en la raiz del proyecto como guia recurrente de ejecucion por bloques logicos. Codex debe leerlo al inicio de cada sesion, identificar el estado real del proyecto y elegir desde ahi el prompt operativo correspondiente, manteniendo sincronizados `docs/PROJECT_STATUS.md` y `docs/ROADMAP.md`.

Motivo:
El proyecto ya tiene suficiente complejidad documental, tecnica y operativa como para necesitar una capa de continuidad explicita. Centralizar los prompts de trabajo reduce deriva entre sesiones, hace mas repetible el uso de skills y playbooks y acelera la continuidad hacia el objetivo final del negocio real de automatizaciones.
