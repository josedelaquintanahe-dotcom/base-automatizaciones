# Arquitectura del sistema

## Vision general

Esta base define una arquitectura modular para automatizaciones empresariales donde cada dominio tecnico tiene una responsabilidad clara, desacoplada y reutilizable. La arquitectura actual se apoya en seis bloques:

- Supabase como capa de datos y servicios gestionados,
- Node.js como backend principal de aplicacion,
- n8n como motor de orquestacion,
- Rendel.com como capa de agentes,
- Vercel como despliegue serverless y frontend,
- Codex como mantenimiento estructural del repositorio.

El objetivo no es solo organizar un proyecto concreto, sino establecer un patron repetible para futuros sistemas de automatizacion.

## Estado actual de implementacion

La arquitectura esta definida y la base backend Express ya existe a nivel local con:

- arranque del servidor,
- rutas operativas minimas,
- validacion de entorno,
- logging estructurado basico,
- clientes base para Supabase, n8n y Rendel,
- estructura por capas `routes`, `controllers`, `services`, `repositories`, `clients`, `middlewares` y `config`.

Todavia no estan implementadas:

- consultas de negocio reales contra Supabase,
- llamadas reales a n8n,
- invocaciones reales a Rendel.com,
- despliegue productivo del backend persistente,
- integraciones funcionales de extremo a extremo.

## Separacion modular por dominios

### 1. Datos y servicios gestionados: Supabase

Supabase es la capa de persistencia y servicios gestionados del sistema.

Responsabilidades:

- almacenar datos operativos y de negocio,
- centralizar estados, historicos y trazabilidad,
- ofrecer autenticacion y control de acceso cuando sea necesario,
- exponer capacidades de base de datos y servicios gestionados al backend.

Principio:
Supabase debe actuar como fuente de verdad del sistema, pero no como capa principal de logica de aplicacion.

### 2. Backend principal: Node.js

Node.js es la capa backend principal del sistema.

Responsabilidades:

- implementar logica de negocio reutilizable,
- exponer endpoints intermedios y adaptadores de integracion,
- conectar Supabase con n8n de forma controlada,
- coordinar invocaciones a Rendel.com cuando la logica lo requiera,
- encapsular clientes, servicios, repositorios y controladores,
- alojar scripts backend estructurados y reutilizables.

Principio:
Node.js concentra la logica de aplicacion, integraciones externas y adaptadores entre plataformas, evitando que esa logica quede dispersa entre Vercel, n8n o la base de datos.

### 3. Orquestacion de workflows: n8n

n8n es la capa de coordinacion de procesos automatizados.

Responsabilidades:

- recibir eventos, cron jobs, webhooks o disparadores manuales,
- encadenar acciones entre Node.js, Supabase, APIs externas y Rendel.com,
- aplicar reglas deterministas, validaciones, transformaciones y reintentos,
- registrar resultados o errores relevantes de vuelta en Supabase.

Principio:
n8n debe contener logica de proceso y secuencia, no convertirse en backend general de aplicacion.

### 4. Agentes automatizados: Rendel.com

Rendel.com es la capa de agentes especializados.

Responsabilidades:

- ejecutar tareas orientadas a contexto, analisis o toma de decisiones asistida,
- consumir instrucciones y datos preparados por Node.js o n8n,
- devolver resultados estructurados que puedan ser auditados e integrados,
- complementar a n8n y Node.js cuando un proceso determinista no sea suficiente.

Principio:
Los agentes deben trabajar sobre contexto controlado y devolver salidas delimitadas. La persistencia final del estado debe seguir en Supabase y la coordinacion global debe quedar fuera del agente.

### 5. Despliegue serverless y frontend: Vercel

Vercel es la capa de exposicion y despliegue.

Responsabilidades:

- servir frontend, paneles internos o interfaces de operacion,
- alojar funciones serverless ligeras cuando convenga,
- conectar usuarios, operadores o sistemas externos con la plataforma,
- delegar en Node.js o n8n cuando el caso requiera backend o orquestacion.

Principio:
Vercel debe ser puerta de entrada y capa de experiencia, no sustituto del backend principal de aplicacion.

### 6. Repositorio local estructural: Codex

Codex representa la capa de mantenimiento estructural del repositorio.

Responsabilidades:

- preservar la organizacion modular del proyecto,
- mantener documentacion, plantillas y convenciones,
- ayudar a introducir cambios sin romper coherencia tecnica,
- registrar decisiones y supuestos de arquitectura.

Principio:
Codex no ejecuta la arquitectura de negocio; mantiene la calidad estructural del sistema y su capacidad de evolucion.

## Flujo de datos esperado

### Flujo base

1. Un usuario, sistema externo o proceso interno inicia una accion desde Vercel, una integracion o un trigger directo.
2. La entrada llega a Node.js cuando se necesita logica de negocio, validacion, adaptacion o acceso controlado entre plataformas.
3. Node.js consulta o actualiza Supabase para recuperar contexto operativo y registrar estado.
4. Si el caso requiere orquestacion multietapa, Node.js invoca n8n o recibe la llamada desde n8n para continuar el proceso.
5. Si el caso necesita razonamiento o ejecucion orientada a agentes, Node.js o n8n envia a Rendel.com un contexto acotado.
6. Rendel.com devuelve una salida estructurada, que vuelve a Node.js o n8n.
7. Node.js y n8n persisten el resultado final, auditoria y estado en Supabase.
8. Vercel consulta Node.js, Supabase o funciones ligeras para mostrar el resultado al usuario o sistema consumidor.

### Direccion recomendada de las dependencias

- Vercel expone interfaces y rutas ligeras.
- Node.js centraliza logica de negocio e integraciones.
- n8n coordina el flujo entre sistemas.
- Rendel.com ejecuta tareas de agente bajo demanda.
- Supabase conserva el estado y la persistencia central.
- Codex documenta, ordena y mantiene el repositorio local.

### Reglas para el flujo de datos

- El estado de negocio debe persistirse en Supabase.
- La logica de aplicacion debe centralizarse preferentemente en Node.js.
- Los workflows de n8n deben considerarse transitivos y operativos, no backend general.
- Las salidas de agentes deben guardarse de forma estructurada antes de considerarse definitivas.
- El frontend en Vercel no debe depender de logica oculta en el cliente para mantener consistencia del sistema.
- Las credenciales privilegiadas deben quedar fuera del frontend y limitarse a backend o serverless controlado.
- Todo flujo relevante debe poder reconstruirse mediante `correlation_id`, registros tecnicos y estado persistido.

## Limites de confianza

- Supabase gestiona persistencia y control de acceso.
- Node.js ejecuta logica de aplicacion y adaptadores.
- n8n coordina procesos y no debe almacenar estado maestro.
- Rendel.com recibe solo el contexto necesario para la tarea asignada.
- Vercel expone interfaces y adaptadores ligeros.
- Codex mantiene la base documental y estructural del repositorio.

## Separacion por entornos

- local para desarrollo y validacion segura,
- staging para pruebas integradas preproductivas,
- produccion para operacion real con controles reforzados.

Cada capa debe usar configuracion, credenciales y endpoints propios por entorno.

## Patrones reutilizables para futuros proyectos

### Patron 1. Entrada por API backend

Uso:
Cuando una accion externa requiere validacion, logica o integracion controlada.

Secuencia recomendada:
Vercel o cliente externo -> Node.js -> Supabase o n8n -> respuesta o siguiente paso.

Ventaja:
Centraliza logica de negocio y desacopla frontend de servicios internos.

### Patron 2. Workflow con backend intermedio

Uso:
Cuando n8n necesita delegar reglas de negocio o adaptacion compleja.

Secuencia recomendada:
n8n -> Node.js -> Supabase o Rendel.com -> n8n -> Supabase.

Ventaja:
Evita que n8n acumule logica de aplicacion dificil de mantener.

### Patron 3. Workflow con agente

Uso:
Cuando una parte del proceso requiere clasificacion, interpretacion o generacion contextual.

Secuencia recomendada:
Node.js o n8n -> consulta contexto en Supabase -> invoca agente en Rendel.com -> normaliza salida -> guarda resultado en Supabase.

Ventaja:
Separa razonamiento orientado a agente de la orquestacion determinista.

### Patron 4. Estado centralizado

Uso:
Cuando multiples workflows, agentes o interfaces comparten una misma entidad de negocio.

Secuencia recomendada:
Todo cambio de estado definitivo se consolida en Supabase, aunque el proceso haya pasado por Node.js, n8n o Rendel.com.

Ventaja:
Evita divergencia entre sistemas y simplifica auditoria.

### Patron 5. Frontend desacoplado

Uso:
Cuando se necesita interfaz de operacion o panel interno.

Secuencia recomendada:
Vercel muestra datos y dispara acciones; la logica de proceso vive fuera del frontend, preferentemente en Node.js o n8n segun el caso.

Ventaja:
Facilita evolucion del frontend sin romper automatizaciones.

## Criterios arquitectonicos iniciales

- Separacion estricta entre datos, backend, procesos, agentes, exposicion y mantenimiento estructural.
- Supabase como fuente de verdad del sistema.
- Node.js como backend principal de aplicacion.
- n8n como capa de orquestacion y no como almacenamiento principal.
- Rendel.com como capa especializada para agentes y tareas no deterministas.
- Vercel como capa de exposicion y despliegue serverless.
- Codex como guardian de estructura, documentacion y consistencia del repositorio.
- Documentacion primero para facilitar reutilizacion entre proyectos.
- Diseno preparado para crecer sin acoplar configuraciones sensibles al codigo fuente.
- Compatibilidad con Windows como entorno operativo principal.
