# AGENTS.md

## Proposito

Este repositorio define la base estructural de un sistema profesional de automatizaciones empresariales en Windows. Los agentes que trabajen aqui deben priorizar consistencia arquitectonica, seguridad y trazabilidad documental.

## Reglas generales del agente

- Responder en espanol salvo instruccion explicita en otro idioma.
- No modificar archivos fuera de este repositorio.
- Mantener compatibilidad completa con Windows en scripts, rutas, ejemplos y documentacion.
- No introducir credenciales reales, secretos ni identificadores sensibles.
- Prohibido almacenar secretos en archivos versionados, ejemplos o documentacion.
- Tratar `.env.example` como plantilla publica y nunca como almacen de secretos.
- Antes de cambios estructurales relevantes, explicar el plan de implementacion.
- Registrar en `docs/decisiones.md` antes de ejecutar cambios estructurales relevantes o cambios que afecten seguridad, despliegue o integraciones.
- Mantener la documentacion alineada con los cambios realizados.
- No ejecutar comandos destructivos sin confirmacion explicita del usuario.
- Priorizar cambios pequenos, reversibles y faciles de auditar.

## Criterios de trabajo

- Favorecer una arquitectura modular con separacion clara por dominio.
- Preferir modularidad frente a soluciones monoliticas o acopladas.
- Preferir cambios pequenos antes que refactors amplios sin necesidad real.
- Documentar supuestos tecnicos cuando todavia no exista implementacion.
- Evitar dependencias implicitas entre modulos sin registrarlas en `docs/arquitectura.md`.
- Preservar nombres de carpetas y convenciones pensadas para reutilizacion en proyectos futuros.
- Si aparece una ambiguedad de arquitectura, elegir la opcion mas simple que mantenga escalabilidad y dejar constancia en `docs/decisiones.md`.
- Aplicar cambios reversibles siempre que sea posible y evitar mutaciones dificiles de deshacer.

## Organizacion del repositorio

- `database/`: documentacion de modelo de datos y activos relacionados con Supabase.
- `workflows/`: catalogo y documentacion de workflows de n8n.
- `agents/`: inventario y especificacion de agentes definidos en Rendel.com.
- `deployment/`: despliegue, entornos y operacion en Vercel.
- `integrations/`: contratos y documentacion de servicios externos.
- `config/`: variables de entorno, configuracion base y convenciones operativas.
- `docs/`: documentacion transversal del sistema.

## Expectativas de mantenimiento

- Cada nuevo modulo debe incluir documentacion minima de proposito, entradas, salidas y dependencias.
- Cualquier cambio que afecte a arquitectura, despliegue, seguridad o integracion externa debe quedar reflejado en `docs/decisiones.md`.
- Si se anaden scripts o codigo ejecutable, deben disenarse para funcionar en Windows o documentar claramente sus prerequisitos.
- Todo cambio de seguridad debe adoptar el principio de minimo privilegio por defecto.
