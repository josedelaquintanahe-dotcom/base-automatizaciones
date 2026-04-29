# Workflow `onboarding__audit__onboarding_dispatch_health_checked__v1`

## Objetivo

Dejar evidencia tecnica de que el backend sigue exponiendo un estado seguro de dispatch para onboarding (`configured = true` y `pathStatus = expected`).

## Trigger

- tipo recomendado: `Execute Workflow` o `webhook` interno tecnico
- origen esperado: despues de `onboarding_credentials_metadata_checked`

## Input esperado

- contrato comun definido en `n8n/docs/onboarding_audit_sequence.md`
- opcionalmente un bloque sanitario adicional con `system_status_snapshot`

## Logica esperada

Opcion preferida de bajo riesgo:

- reutilizar un snapshot sanitario del `system/status` ya obtenido por backend o por el preflight operativo

Opcion alternativa futura:

- consultar un endpoint interno seguro si se habilita un contrato backend especifico para ello

En esta fase no debe requerir credenciales nuevas ni acceso privilegiado adicional.

## Output esperado

```json
{
  "workflow_name": "onboarding_dispatch_health_checked",
  "workflow_version": "v1",
  "correlation_id": "uuid",
  "cliente_id": "uuid",
  "check_name": "dispatch_health_checked",
  "check_status": "completed",
  "result_summary": "onboardingDispatch configurado y con path esperado",
  "next_action": "Continuar con onboarding_sanitized_report_compiled",
  "output_payload": {
    "configured": true,
    "pathStatus": "expected"
  }
}
```

## Sistemas afectados

- escritura tecnica en `ejecuciones_workflows`

## Riesgos

- bajo si reutiliza snapshot sanitario,
- medio si en el futuro se resuelve con llamada HTTP directa y se abren nuevas dependencias.

## Idempotencia

- clave recomendada: `onboarding_dispatch_health_checked + correlation_id`

## Validacion esperada

- fila tecnica en `ejecuciones_workflows`
- `output_payload.pathStatus = expected`
