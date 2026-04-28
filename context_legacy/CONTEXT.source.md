# CONTEXT.md — Contexto del Proyecto Base Automatizaciones

## 1. Descripción general del proyecto

Este repositorio corresponde al proyecto **Base Automatizaciones**, cuyo objetivo es construir una base técnica y operativa para crear, gestionar, vender y mantener automatizaciones empresariales.

El proyecto busca servir como sistema reutilizable para distintos clientes y casos de uso, no como una solución cerrada para un único cliente.

La finalidad principal es poder crear automatizaciones profesionales para empresas que actualmente tienen procesos manuales, repetitivos, poco conectados o difíciles de controlar.

El sistema debe poder incluir:

- Frontend para gestionar clientes, automatizaciones, ventas, estados y operaciones.
- Backend para exponer APIs, conectar servicios y centralizar lógica de negocio.
- Base de datos en Supabase.
- Workflows en n8n.
- Integraciones con herramientas externas.
- Documentación técnica y comercial.
- Control de versiones mediante Git y GitHub.
- Metodología interna para crear, revisar, corregir, securizar y desplegar automatizaciones.

## 2. Objetivo de negocio

El objetivo empresarial del proyecto es crear una base que permita vender servicios de automatización a empresas.

El proyecto debe permitir:

1. Identificar procesos manuales en empresas.
2. Diseñar automatizaciones viables.
3. Construir workflows en n8n.
4. Conectar sistemas externos mediante APIs, webhooks o integraciones.
5. Registrar datos en una base centralizada.
6. Ofrecer trazabilidad, control de errores y documentación.
7. Reutilizar componentes técnicos entre clientes.
8. Preparar propuestas comerciales para captar leads.
9. Mantener un sistema escalable para futuros clientes.

Este proyecto no debe depender de un cliente concreto. Debe estar preparado para adaptarse a distintos sectores, como:

- Retail.
- Servicios profesionales.
- Clínicas.
- Despachos.
- Academias.
- E-commerce.
- Inmobiliarias.
- Empresas con procesos administrativos repetitivos.
- Negocios que usen Excel, ERP, CRM, correo, formularios o TPV de forma desconectada.

## 3. Problema general que resuelve

Muchas empresas siguen gestionando información crítica de forma manual o semimanual:

- Datos apuntados en papel.
- Información copiada manualmente a Excel.
- Ventas o pedidos sin sincronización automática.
- Leads comerciales sin seguimiento.
- Facturación desconectada.
- Stock no actualizado.
- Errores humanos por duplicidad de datos.
- Falta de trazabilidad.
- Procesos que consumen varias horas a la semana.
- Dependencia de personas concretas para tareas repetitivas.

El proyecto busca transformar esos procesos en sistemas automatizados, medibles y mantenibles.

## 4. Alcance funcional esperado

El sistema base debe poder soportar, de forma progresiva, los siguientes módulos:

### 4.1 Gestión de clientes

Funcionalidades previstas:

- Crear clientes.
- Consultar clientes.
- Editar clientes.
- Evitar duplicados.
- Buscar clientes.
- Ver detalle de cliente.
- Asociar automatizaciones a clientes.
- Guardar información comercial y técnica relevante.

El sistema debe controlar errores como:

- Cliente duplicado.
- Datos obligatorios incompletos.
- Formatos inválidos.
- Errores de conexión con base de datos.

### 4.2 Gestión de automatizaciones

Funcionalidades previstas:

- Crear automatizaciones asociadas a clientes.
- Definir estado de cada automatización.
- Documentar objetivo, inputs, outputs y herramientas conectadas.
- Guardar enlaces o referencias a workflows n8n.
- Registrar errores, incidencias y mejoras.
- Clasificar automatizaciones por tipo, cliente, prioridad o estado.

Estados posibles:

- Idea.
- En análisis.
- En desarrollo.
- En pruebas.
- Activa.
- Pausada.
- Fallando.
- Cerrada.

### 4.3 Registro de ventas o eventos empresariales

El proyecto debe poder servir como base para automatizar registros de ventas, pedidos, formularios, leads o eventos operativos.

Datos habituales que pueden registrarse:

- Fecha y hora.
- Identificador de operación.
- Cliente.
- Producto o servicio.
- SKU o referencia.
- Cantidad.
- Precio unitario.
- Descuento.
- Método de pago.
- Canal de origen.
- Estado.
- Observaciones.

La estructura debe ser flexible para adaptarse a diferentes casos de uso.

### 4.4 Integraciones

El proyecto debe poder conectarse con herramientas externas como:

- n8n.
- Supabase.
- Excel.
- OneDrive.
- Google Sheets.
- Holded u otros ERP.
- CRMs.
- APIs externas.
- Formularios.
- Webhooks.
- Correo electrónico.
- Herramientas de facturación.
- Sistemas de inventario.

Las integraciones deben estar documentadas y separadas de la lógica principal cuando sea posible.

### 4.5 Control comercial y generación de leads

El proyecto también debe ayudar a vender automatizaciones.

Debe poder incluir documentación o módulos para:

- Definir nichos objetivo.
- Identificar procesos automatizables.
- Crear mensajes de prospección.
- Preparar emails comerciales.
- Diseñar guiones de llamada.
- Definir propuestas de valor.
- Documentar casos de uso por sector.
- Preparar ofertas comerciales.
- Hacer seguimiento de oportunidades.

## 5. Stack técnico previsto

Esta sección debe ser validada por Codex contra el repositorio real.

### 5.1 Entorno local

El entorno principal de trabajo es:

- Windows.
- PowerShell.
- Usuario Windows: `Manuel`.
- Carpeta base esperada: `C:\Users\Manuel\PROJECTS\automatizaciones-base`.

Los comandos entregados para este proyecto deben estar preparados para Windows PowerShell y usar rutas completas cuando sea razonable.

### 5.2 Control de versiones

El proyecto usa:

- Git.
- GitHub.

Regla importante:

- No se debe hacer commit por cada microcambio.
- Se debe hacer commit y push al cerrar bloques importantes.
- Ejemplos de bloques importantes:
  - Finalizar listado global de clientes.
  - Finalizar una automatización real.
  - Completar un módulo funcional.
  - Añadir sistema de agentes.
  - Cerrar una fase de frontend/backend.
  - Terminar una integración importante.

### 5.3 Backend

Pendiente de validar contra el repositorio.

El backend debería encargarse de:

- APIs.
- Lógica de negocio.
- Validaciones.
- Conexión con Supabase.
- Gestión de errores.
- Integraciones externas.
- Webhooks.
- Seguridad.
- Autenticación y autorización, si aplica.

### 5.4 Frontend

Pendiente de validar contra el repositorio.

El frontend debería encargarse de:

- Pantallas de clientes.
- Pantallas de automatizaciones.
- Formularios.
- Tablas.
- Estados de carga.
- Estados de error.
- Estados vacíos.
- Validaciones visuales.
- Experiencia de usuario clara.

Debe priorizarse una interfaz limpia, profesional y fácil de usar.

### 5.5 Base de datos

La base de datos prevista es:

- Supabase.

Supabase puede usarse para:

- Clientes.
- Automatizaciones.
- Ventas/eventos.
- Logs.
- Estados.
- Configuración.
- Usuarios, si aplica.
- Relación entre clientes y automatizaciones.

Cualquier cambio de esquema debe documentarse.

No deben ejecutarse cambios destructivos sin revisión previa.

### 5.6 Automatizaciones

El motor principal de automatizaciones previsto es:

- n8n.

n8n puede usarse para:

- Recibir webhooks.
- Conectar APIs externas.
- Transformar datos.
- Guardar información en Supabase.
- Sincronizar datos con Excel, OneDrive o Google Sheets.
- Enviar alertas.
- Registrar errores.
- Ejecutar procesos programados.
- Orquestar flujos comerciales u operativos.

Los workflows exportados deben guardarse, cuando sea posible, en:

```text
n8n/workflows/