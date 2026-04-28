# Playbook: Database Change

## Objetivo

Disenar o revisar cambios de base de datos con seguridad y documentacion.

## Cuando usarlo

- cambios de esquema
- nuevas tablas
- cambios de relaciones, indices o RLS

## Agentes participantes

- `database-architect`
- `backend-architect`
- `security-auditor`
- `qa-verifier`
- `documentation-writer`

## Fases

1. Revisar modelo actual.
2. Disenar cambio y dependencias.
3. Evaluar riesgo destructivo.
4. Documentar impacto y verificacion.

## Reglas

- bloquear cambios destructivos sin confirmacion
- no inventar tablas ni columnas
- documentar impacto en backend y n8n

## Entrega final esperada

Propuesta o cambio documentado con riesgos, SQL y validaciones necesarias.
