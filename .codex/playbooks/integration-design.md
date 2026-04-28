# Playbook: Integration Design

## Objetivo

Disenar una integracion entre sistemas con contratos, seguridad y fallback claros.

## Cuando usarlo

- backend <-> Supabase
- backend <-> n8n
- n8n <-> APIs externas
- integraciones con Excel, OneDrive, Sheets, CRM o ERP

## Agentes participantes

- `business-analyst`
- `integration-architect`
- `n8n-automation-builder`
- `database-architect`
- `security-auditor`
- `documentation-writer`

## Fases

1. Definir problema y proceso.
2. Mapear origen, destino y trigger.
3. Definir datos, autenticacion, errores y logs.
4. Documentar fallback manual.

## Reglas

- no mezclar contexto comercial con detalles tecnicos sin orden
- no inventar credenciales
- mantener trazabilidad de eventos

## Entrega final esperada

Diseno de integracion listo para implementacion o auditoria.
