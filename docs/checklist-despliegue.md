# Checklist de despliegue

## Proposito

Checklist previa a despliegue para validar configuracion, permisos y trazabilidad antes de publicar cambios en staging o produccion.

## Variables de entorno

- [ ] Las variables requeridas existen en el entorno correcto.
- [ ] No se han usado credenciales reales en archivos versionados.
- [ ] Las variables de produccion no se han reutilizado en preview o local.
- [ ] Las claves privilegiadas no estan expuestas al frontend.

## Supabase

- [ ] `SUPABASE_URL` apunta al entorno correcto.
- [ ] `SUPABASE_ANON_KEY` corresponde al entorno correcto.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` solo se usa en backend o serverless.
- [ ] Las politicas y permisos necesarios estan verificados.
- [ ] Las tablas de trazabilidad existen o estan planificadas para el despliegue.

## n8n

- [ ] `N8N_WEBHOOK_BASE_URL` corresponde al entorno correcto.
- [ ] Los endpoints de webhook esperados existen y estan documentados.
- [ ] Los workflows afectados tienen naming, logs y versionado definidos.
- [ ] No hay workflows activos no auditados para el entorno objetivo.

## Vercel

- [ ] El entorno destino es el correcto: preview o produccion.
- [ ] Las variables de entorno cargadas en Vercel corresponden al entorno esperado.
- [ ] Los endpoints serverless expuestos estan documentados.
- [ ] No se exponen secretos ni configuraciones privilegiadas al cliente.

## Rendel

- [ ] Los agentes del entorno correcto estan identificados.
- [ ] Las entradas y salidas del agente estan documentadas.
- [ ] Los limites y responsabilidades del agente estan definidos.
- [ ] No se ejecutan agentes de prueba sobre datos productivos.

## Logs y trazabilidad

- [ ] Se registra `correlation_id` en el flujo afectado.
- [ ] Existen logs minimos para eventos, workflows y agentes.
- [ ] Los errores quedan normalizados y son localizables.
- [ ] El despliegue permite diagnostico posterior sin depender de datos manuales.

## Validacion final

- [ ] La documentacion del modulo afectado esta actualizada.
- [ ] `docs/decisiones.md` refleja cualquier decision estructural relevante.
- [ ] El cambio es reversible o tiene plan de mitigacion documentado.
- [ ] El despliegue ha sido revisado con criterio conservador.
