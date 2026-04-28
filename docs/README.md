# Documentacion del proyecto

## Objetivo

Servir como mapa de referencia para la documentacion de `base-automatizaciones`, separando documentos canonicos, documentos historicos y documentos de apoyo.

## Regla de lectura

Cuando varios documentos hablen del mismo tema, prevalece este orden:

1. `CONTEXT.md`
2. `AGENTS.md`
3. `docs/PROJECT_STATUS.md`
4. `docs/ROADMAP.md`
5. documentos canonicos en `docs/` con nombres operativos en mayusculas
6. documentos historicos o complementarios en espanol

## Secuencia de entrada recomendada

Para un agente nuevo o para una revision segura:

1. leer `CONTEXT.md`
2. leer `AGENTS.md`
3. revisar `docs/PROJECT_STATUS.md`
4. revisar `docs/ROADMAP.md`
5. usar este `docs/README.md` como mapa de la carpeta `docs/`
6. abrir la documentacion especifica del bloque objetivo

## Documentos canonicos

- `PROJECT_STATUS.md`: estado real y resumido del repositorio
- `ROADMAP.md`: fases, prioridades y siguiente hito
- `ARCHITECTURE.md`: arquitectura detectada y prevista
- `SECURITY.md`: reglas y checklist de seguridad
- `DEPLOYMENT.md`: guia base de despliegue y entorno
- `N8N_WORKFLOWS.md`: indice canonico de workflows n8n
- `SALES_PLAYBOOK.md`: base comercial reutilizable
- `decisiones.md`: registro oficial de decisiones tecnicas

## Documentos historicos o complementarios

- `arquitectura.md`: contexto historico y patrones ampliados de arquitectura
- `seguridad.md`: desarrollo narrativo de seguridad backend
- `plan.md`: plan tecnico inicial de arranque
- `modelo-seguridad.md`: marco general de seguridad
- `entornos.md`: separacion de entornos y riesgos asociados

## Documentos de apoyo

- `backend-node.md`
- `backend-patterns.md`
- `checklist-despliegue.md`

Estos documentos no sustituyen a la capa canonica. Deben usarse como detalle adicional o checklist operativo.

## Duplicidades controladas

Las siguientes parejas conviven de forma intencional y no deben fusionarse automaticamente sin revision:

- `ARCHITECTURE.md` y `arquitectura.md`
- `SECURITY.md` y `seguridad.md`
- `ROADMAP.md` y `plan.md`
- `DEPLOYMENT.md` y `entornos.md`

## Siguiente uso recomendado

Para revisiones seguras sin tocar logica del producto:

- usar `.codex/playbooks/documentation-update.md` cuando el objetivo sea alinear documentacion
- usar `.codex/playbooks/project-diagnosis-and-next-prompt.md` cuando el objetivo sea rediagnosticar el estado general y generar el siguiente prompt operativo
