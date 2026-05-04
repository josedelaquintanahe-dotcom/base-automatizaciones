# AGENTS.md — Reglas operativas del proyecto

## 1. Propósito

Este archivo define cómo debe trabajar Codex dentro de `base-automatizaciones`.

Objetivos:
- ejecución ordenada y autónoma,
- uso correcto del sistema de agentes,
- seguridad y control de riesgos,
- coherencia entre tareas,
- uso obligatorio de `prompt.md` como motor de ejecución.

---

## 2. Flujo operativo obligatorio

### REGLA PRINCIPAL (CRÍTICA)

Codex NO debe ejecutar tareas directamente.

Siempre debe seguir este flujo:

1. Leer AGENTS.md
2. Leer CONTEXT.md
3. Leer prompt.md
4. Leer docs/PROJECT_STATUS.md (si existe)
5. Leer docs/ROADMAP.md (si existe)
6. Determinar el estado actual del proyecto
7. Seleccionar el bloque lógico en prompt.md
8. Ejecutar el prompt de ese bloque

---

## 3. Uso obligatorio de prompt.md

`prompt.md` es la fuente principal de ejecución del proyecto.

Reglas:
- Antes de cualquier tarea → leer `prompt.md`
- No improvisar tareas fuera de los bloques
- No ejecutar acciones sin mapearlas a un bloque
- Seguir siempre el playbook indicado en el bloque

Si no existe bloque adecuado:
1. Detectarlo
2. Proponer nuevo bloque
3. Generar prompt
4. Esperar confirmación si implica riesgo

---

## 4. Sistema de agentes

Arquitectura:

Orchestrator → coordina  
Playbooks → definen el flujo  
Skills → ejecutan tareas

### 4.1 Orchestrator

Debe:
- interpretar el objetivo
- seleccionar subagentes necesarios
- coordinar ejecución
- consolidar resultados
- definir siguiente paso

No debe:
- ejecutar todo directamente
- activar todos los agentes innecesariamente
- hacer push automáticamente

### 4.2 Activación de agentes

Activar SOLO los necesarios.

Ejemplos:

Diagnóstico → project-state-auditor  
Planificación → roadmap-planner  
Construcción → feature-builder  
Revisión → code-reviewer + qa-verifier  
Seguridad → security-auditor  
Corrección → fixer  
Documentación → documentation-writer  
Git → git-operator

---

## 5. Uso de playbooks

Antes de ejecutar una tarea:

1. Identificar el playbook adecuado en `.codex/playbooks/`
2. Seguir sus fases
3. Usar los agentes definidos en el playbook

Ejemplos:

- crear funcionalidad → build-feature.md  
- diagnóstico → project-diagnosis-and-next-prompt.md  
- corrección → review-and-fix.md  
- despliegue → deployment-prep.md  

---

## 6. Reglas de ejecución

### 6.1 Autonomía

Codex puede actuar sin preguntar si:
- el objetivo está claro
- no hay riesgo crítico
- no hay cambios destructivos
- no afecta producción

Debe parar si:
- hay riesgo de borrar datos
- hay cambios en producción
- hay decisiones críticas de arquitectura
- hay credenciales implicadas
- hay ambigüedad relevante

---

### 6.2 Prohibiciones

Codex NO debe:
- modificar `.env` con valores reales
- exponer API keys o tokens
- hacer push automáticamente
- ejecutar cambios destructivos sin confirmación
- borrar archivos importantes
- modificar producción sin permiso
- inventar información técnica
- saltarse `prompt.md`

---

## 7. Reglas de seguridad

Siempre verificar:
- secretos en archivos
- tokens
- credenciales
- CORS
- webhooks
- RLS en Supabase
- endpoints expuestos
- logs sensibles

Si hay riesgo crítico:
DETENER ejecución y reportar

---

## 8. Reglas de Git

Antes de commit:
1. git status
2. revisar cambios
3. comprobar secretos
4. ejecutar pruebas si existen

Reglas:
- no commit automático
- no push sin confirmación
- no incluir archivos innecesarios
- no mensajes genéricos

Formato:
feat:, fix:, docs:, chore:, refactor:, security:

---

## 9. Documentación obligatoria

Actualizar tras cambios relevantes:

Siempre:
- docs/PROJECT_STATUS.md
- docs/ROADMAP.md

Si aplica:
- docs/ARCHITECTURE.md
- docs/SECURITY.md
- docs/N8N_WORKFLOWS.md
- docs/DEPLOYMENT.md
- docs/SALES_PLAYBOOK.md

---

## 10. Definición de tarea terminada

Una tarea termina cuando:
- cumple el objetivo
- no rompe funcionalidad
- ha sido revisada
- seguridad validada
- documentación actualizada
- siguiente paso definido

---

## 11. Salida obligatoria

Cada ejecución debe incluir:
1. qué se hizo
2. agentes usados
3. archivos modificados
4. verificaciones
5. riesgos
6. pendientes
7. siguiente paso
8. git status

---

## 12. Prompt maestro de inicio

Al iniciar sesión:

Lee AGENTS.md y sigue sus reglas.
Después lee CONTEXT.md, prompt.md, docs/PROJECT_STATUS.md y docs/ROADMAP.md.
Determina el estado actual del proyecto.
Selecciona el bloque lógico en prompt.md.
Ejecuta ese bloque usando playbooks y agentes necesarios.
Trabaja autónomamente salvo riesgo crítico.
Actualiza documentación.
Finaliza con git status y siguiente paso recomendado.

---

## 13. Regla final

Prioridad:
1. Seguridad
2. CONTEXT.md
3. prompt.md
4. playbooks
5. claridad

Nunca ejecutar acciones críticas sin validación.