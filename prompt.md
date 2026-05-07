# prompt.md

## Como usar este documento

Codex debe usar este archivo como guia operativa recurrente del proyecto.

Reglas de uso:

1. Leer siempre `prompt.md` antes de trabajar.
2. Identificar el estado actual del proyecto leyendo:
   - `CONTEXT.md`
   - `AGENTS.md`
   - `docs/PROJECT_STATUS.md`
   - `docs/ROADMAP.md`
3. Elegir el bloque logico correspondiente segun el estado real del repositorio.
4. Ejecutar el prompt exacto del bloque elegido.
5. Actualizar `docs/PROJECT_STATUS.md` cuando cambie el estado real.
6. Actualizar `docs/ROADMAP.md` si cambia la planificacion o el siguiente hito.
7. Generar al final el siguiente prompt recomendado.
8. No hacer `commit` ni `push` salvo instruccion expresa o salvo que se este ejecutando el bloque especifico de commit y push.

Reglas permanentes:

- trabajar de forma autonoma salvo riesgo critico, cambio destructivo o produccion;
- no modificar produccion sin confirmacion;
- no tocar `.env` con valores reales;
- no exponer secretos;
- terminar siempre con `git status` resumido y siguiente paso recomendado.
- cuando la sesion se ejecute mediante wrappers autonomos (`codexauto` o `codexloop`), cerrar siempre con el bloque estructurado `CODEX_NEXT` definido al final de este documento.

## Convencion de bloque

Cada bloque de este documento incluye:

- nombre del bloque;
- cuando usarlo;
- playbook recomendado;
- agentes implicados;
- prompt exacto para Codex;
- resultado esperado;
- archivos que puede modificar;
- archivos que no debe modificar;
- comprobaciones finales;
- condicion para pasar al siguiente bloque.

---

## 1. Diagnostico inicial del proyecto

**Cuando usarlo**

- al iniciar una sesion nueva;
- cuando haya dudas sobre el estado real del repo;
- antes de retomar un bloque interrumpido.

**Playbook recomendado**

- `.codex/playbooks/project-diagnosis-and-next-prompt.md`

**Agentes implicados**

- `orchestrator`
- `project-state-auditor`
- `roadmap-planner`
- `prompt-engineer`

**Prompt exacto para Codex**

```text
Quiero ejecutar un diagnostico inicial seguro del proyecto.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Usa `.codex/playbooks/project-diagnosis-and-next-prompt.md`

Objetivo:
- revisar el estado real del repositorio,
- detectar el bloque logico actual,
- actualizar solo documentacion si hay desalineaciones claras,
- no modificar frontend, backend, workflows n8n ni base de datos salvo documentacion,
- no hacer commit ni push.

Trabaja de forma autonoma salvo riesgo critico.

Entrega final:
- resumen del estado actual,
- desalineaciones detectadas,
- archivos documentales tocados,
- bloque logico recomendado,
- siguiente prompt exacto recomendado.

Termina con `git status` resumido.
```

**Resultado esperado**

- estado real del repo resumido;
- bloque actual identificado;
- siguiente accion clara.

**Archivos que puede modificar**

- `docs/PROJECT_STATUS.md`
- `docs/ROADMAP.md`
- `docs/README.md`
- documentacion relacionada con estado si procede

**Archivos que no debe modificar**

- `src/frontend/**`
- `src/backend/**`
- `n8n/workflows/**`
- `.env*` con valores reales

**Comprobaciones finales**

- `git status`

**Condicion para pasar al siguiente bloque**

- que el estado actual y el siguiente bloque esten claros.

---

## 2. Actualizacion de `PROJECT_STATUS.md`

**Cuando usarlo**

- cuando el estado real del proyecto haya cambiado;
- tras validaciones, despliegues o nuevas automatizaciones.

**Playbook recomendado**

- `.codex/playbooks/documentation-update.md`

**Agentes implicados**

- `documentation-writer`
- `project-state-auditor`

**Prompt exacto para Codex**

```text
Quiero actualizar `docs/PROJECT_STATUS.md` de forma segura.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Usa `.codex/playbooks/documentation-update.md`

Objetivo:
- alinear `docs/PROJECT_STATUS.md` con el estado real del repositorio,
- no tocar logica de frontend, backend, n8n ni base de datos,
- no hacer commit ni push.

Trabaja de forma autonoma salvo riesgo critico.

Entrega final:
- cambios hechos,
- huecos pendientes,
- siguiente bloque recomendado.

Termina con `git status` resumido.
```

**Resultado esperado**

- `docs/PROJECT_STATUS.md` alineado.

**Archivos que puede modificar**

- `docs/PROJECT_STATUS.md`
- `docs/decisiones.md` si hay una decision nueva real

**Archivos que no debe modificar**

- codigo productivo
- `.env*`

**Comprobaciones finales**

- `git status`

**Condicion para pasar al siguiente bloque**

- que el estado operativo actual quede reflejado.

---

## 3. Actualizacion de `ROADMAP.md`

**Cuando usarlo**

- cuando cambie el siguiente hito;
- despues de cerrar un bloque funcional o documental.

**Playbook recomendado**

- `.codex/playbooks/documentation-update.md`

**Agentes implicados**

- `roadmap-planner`
- `documentation-writer`

**Prompt exacto para Codex**

```text
Quiero actualizar `docs/ROADMAP.md` de forma segura.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Usa `.codex/playbooks/documentation-update.md`

Objetivo:
- alinear roadmap y prioridades con el estado real del proyecto,
- dejar claro el siguiente hito,
- no tocar logica de producto,
- no hacer commit ni push.

Entrega final:
- cambios realizados,
- nuevo siguiente hito,
- siguiente prompt recomendado.

Termina con `git status` resumido.
```

**Resultado esperado**

- roadmap actualizado y orden de trabajo claro.

**Archivos que puede modificar**

- `docs/ROADMAP.md`
- `docs/decisiones.md` si procede

**Archivos que no debe modificar**

- codigo productivo
- `.env*`

**Comprobaciones finales**

- `git status`

**Condicion para pasar al siguiente bloque**

- que el siguiente hito sea explicito y razonable.

---

## 4. Revision de arquitectura

**Cuando usarlo**

- antes de cambios estructurales;
- cuando haya dudas de separacion por dominios, contratos o integraciones.

**Playbook recomendado**

- `.codex/playbooks/integration-design.md`

**Agentes implicados**

- `backend-architect`
- `integration-architect`
- `database-architect`
- `documentation-writer`

**Prompt exacto para Codex**

```text
Quiero ejecutar una revision segura de arquitectura.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Revisa `docs/ARCHITECTURE.md`
7. Usa `.codex/playbooks/integration-design.md`

Objetivo:
- revisar la arquitectura detectada y la prevista,
- senalar acoplamientos, contratos fragiles y riesgos,
- actualizar solo documentacion salvo necesidad minima y segura,
- no modificar produccion,
- no hacer commit ni push.

Entrega final:
- hallazgos,
- cambios documentales,
- siguiente recomendacion tecnica.

Termina con `git status` resumido.
```

**Resultado esperado**

- arquitectura explicada y riesgos claros.

**Archivos que puede modificar**

- `docs/ARCHITECTURE.md`
- `docs/decisiones.md`
- documentacion tecnica relacionada

**Archivos que no debe modificar**

- frontend
- backend
- workflows n8n
- `.env*`

**Comprobaciones finales**

- `git status`

**Condicion para pasar al siguiente bloque**

- que la arquitectura objetivo del siguiente bloque sea coherente.

---

## 5. Revision de seguridad

**Cuando usarlo**

- antes de despliegues o nuevas automatizaciones;
- despues de cambios en tokens, endpoints o tablas criticas.

**Playbook recomendado**

- `.codex/playbooks/secure-release.md`

**Agentes implicados**

- `security-auditor`
- `backend-architect`
- `database-architect`
- `documentation-writer`

**Prompt exacto para Codex**

```text
Quiero ejecutar una revision segura de seguridad.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Lee `docs/SECURITY.md`
7. Usa `.codex/playbooks/secure-release.md`

Objetivo:
- revisar secretos, permisos, tokens, endpoints, Supabase y n8n,
- actualizar documentacion y checklist de seguridad si hace falta,
- no modificar produccion sin confirmacion,
- no tocar `.env` reales,
- no hacer commit ni push.

Entrega final:
- hallazgos por severidad,
- archivos tocados,
- riesgos residuales,
- siguiente paso recomendado.

Termina con `git status` resumido.
```

**Resultado esperado**

- riesgos de seguridad actualizados y priorizados.

**Archivos que puede modificar**

- `docs/SECURITY.md`
- `docs/decisiones.md`
- documentacion operativa relacionada

**Archivos que no debe modificar**

- `.env*` reales
- codigo productivo salvo correccion minima segura y justificada

**Comprobaciones finales**

- `git status`

**Condicion para pasar al siguiente bloque**

- que no haya riesgo critico abierto o que quede claramente documentado.

---

## 6. Revision de frontend

**Cuando usarlo**

- cuando el roadmap apunte a UX, formularios, tablas o consumo de API;
- antes de tocar interfaz.

**Playbook recomendado**

- `.codex/playbooks/review-and-fix.md`

**Agentes implicados**

- `frontend-engineer`
- `ui-designer`
- `qa-verifier`

**Prompt exacto para Codex**

```text
Quiero ejecutar una revision de frontend.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Usa `.codex/playbooks/review-and-fix.md`

Objetivo:
- revisar estructura, UX funcional, estados, consumo de API y riesgos de exposicion,
- modificar frontend solo si el bloque lo requiere de forma explicita,
- no tocar produccion,
- no hacer commit ni push.

Entrega final:
- hallazgos,
- archivos tocados,
- verificaciones realizadas,
- siguiente paso recomendado.

Termina con `git status` resumido.
```

**Resultado esperado**

- estado del frontend claro y, si aplica, correcciones acotadas.

**Archivos que puede modificar**

- `src/frontend/**`
- documentacion de frontend

**Archivos que no debe modificar**

- backend
- workflows n8n
- `.env*`

**Comprobaciones finales**

- lint/test/build si procede
- `git status`

**Condicion para pasar al siguiente bloque**

- que el frontend del bloque actual quede estable o claramente bloqueado.

---

## 7. Revision de backend

**Cuando usarlo**

- cuando el siguiente paso dependa de servicios, rutas, contratos o adaptadores.

**Playbook recomendado**

- `.codex/playbooks/review-and-fix.md`

**Agentes implicados**

- `backend-architect`
- `code-reviewer`
- `qa-verifier`
- `security-auditor`

**Prompt exacto para Codex**

```text
Quiero ejecutar una revision de backend.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Usa `.codex/playbooks/review-and-fix.md`

Objetivo:
- revisar rutas, servicios, middlewares, contratos, adaptadores y trazabilidad,
- aplicar solo cambios pequenos, reversibles y auditables si son necesarios,
- no modificar produccion sin confirmacion,
- no tocar `.env` reales,
- no hacer commit ni push.

Entrega final:
- hallazgos,
- cambios hechos,
- lint/tests ejecutados,
- siguiente paso recomendado.

Termina con `git status` resumido.
```

**Resultado esperado**

- backend revisado y estable para el bloque actual.

**Archivos que puede modificar**

- `src/backend/**`
- documentacion tecnica relacionada

**Archivos que no debe modificar**

- frontend salvo docs
- `.env*`

**Comprobaciones finales**

- `npm --prefix src/backend run lint`
- tests backend relevantes
- `git status`

**Condicion para pasar al siguiente bloque**

- que el contrato backend del siguiente paso este claro y validado.

---

## 8. Revision de Supabase/base de datos

**Cuando usarlo**

- cuando el bloque afecte tablas, constraints, seeds, RLS o consultas sensibles.

**Playbook recomendado**

- `.codex/playbooks/database-change.md`

**Agentes implicados**

- `database-architect`
- `backend-architect`
- `security-auditor`

**Prompt exacto para Codex**

```text
Quiero ejecutar una revision segura de Supabase/base de datos.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Usa `.codex/playbooks/database-change.md`

Objetivo:
- revisar tablas, relaciones, indices, constraints y riesgos de RLS,
- documentar huecos o cambios propuestos,
- no hacer cambios destructivos sin confirmacion,
- no tocar produccion sin confirmacion,
- no hacer commit ni push.

Entrega final:
- analisis de estado,
- cambios documentales o tecnicos minimos,
- riesgos residuales,
- siguiente paso recomendado.

Termina con `git status` resumido.
```

**Resultado esperado**

- estado de datos claro y riesgos documentados.

**Archivos que puede modificar**

- `database/**`
- `docs/**`
- SQL versionado si el bloque lo exige

**Archivos que no debe modificar**

- `.env*`
- datos reales destructivos

**Comprobaciones finales**

- `git status`

**Condicion para pasar al siguiente bloque**

- que el impacto en datos este entendido y documentado.

---

## 9. Revision de n8n/workflows

**Cuando usarlo**

- cuando el siguiente bloque dependa de workflows nuevos o existentes.

**Playbook recomendado**

- `.codex/playbooks/n8n-workflow-build.md`

**Agentes implicados**

- `n8n-automation-builder`
- `integration-architect`
- `automation-auditor`
- `documentation-writer`

**Prompt exacto para Codex**

```text
Quiero ejecutar una revision de n8n/workflows.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Lee `docs/N8N_WORKFLOWS.md`
7. Usa `.codex/playbooks/n8n-workflow-build.md`

Objetivo:
- revisar workflows activos, blueprints, exports sanitarios y scripts operativos,
- documentar desalineaciones y corregir solo lo necesario,
- no tocar produccion sin confirmacion,
- no exponer credenciales,
- no hacer commit ni push.

Entrega final:
- workflows revisados,
- archivos tocados,
- validaciones hechas,
- siguiente paso recomendado.

Termina con `git status` resumido.
```

**Resultado esperado**

- workflows alineados con repo y documentacion.

**Archivos que puede modificar**

- `n8n/workflows/**`
- `workflows/**`
- `docs/N8N_WORKFLOWS.md`
- `scripts/**` si hay validacion operativa

**Archivos que no debe modificar**

- `.env*`
- backend/frontend salvo necesidad minima documentada

**Comprobaciones finales**

- validacion SDK si aplica
- `git status`

**Condicion para pasar al siguiente bloque**

- que el workflow del bloque actual tenga contrato y verificacion claros.

---

## 10. Diseno de siguiente funcionalidad

**Cuando usarlo**

- cuando haya que elegir la siguiente pieza funcional.

**Playbook recomendado**

- `.codex/playbooks/integration-design.md`

**Agentes implicados**

- `business-analyst`
- `integration-architect`
- `backend-architect`
- `roadmap-planner`

**Prompt exacto para Codex**

```text
Quiero disenar la siguiente funcionalidad del proyecto.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Usa `.codex/playbooks/integration-design.md`

Objetivo:
- proponer 2 o 3 opciones razonables,
- comparar valor, riesgo, reversibilidad y coste,
- elegir una,
- dejar el diseno funcional y tecnico preparado,
- no modificar produccion,
- no hacer commit ni push.

Entrega final:
- funcionalidad elegida,
- alternativas descartadas,
- alcance exacto,
- archivos preparados,
- siguiente paso recomendado.

Termina con `git status` resumido.
```

**Resultado esperado**

- siguiente funcionalidad definida y justificada.

**Archivos que puede modificar**

- `workflows/**`
- `docs/**`
- `n8n/workflows/*.planned.json` o blueprint si procede

**Archivos que no debe modificar**

- logica productiva si el bloque es solo de diseno

**Comprobaciones finales**

- `git status`

**Condicion para pasar al siguiente bloque**

- que el diseno sea claro, seguro y ejecutable.

---

## 11. Implementacion de funcionalidad

**Cuando usarlo**

- cuando el diseno ya este claro y se vaya a construir el bloque.

**Playbook recomendado**

- `.codex/playbooks/build-feature.md`

**Agentes implicados**

- `feature-builder`
- `backend-architect`
- `frontend-engineer` si aplica
- `database-architect` si aplica
- `n8n-automation-builder` si aplica

**Prompt exacto para Codex**

```text
Quiero implementar la funcionalidad ya definida.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Lee la documentacion funcional del bloque
7. Usa `.codex/playbooks/build-feature.md`

Objetivo:
- implementar el bloque de forma autonoma,
- mantener cambios pequenos y reversibles,
- actualizar documentacion asociada,
- no tocar produccion sin confirmacion,
- no tocar `.env` reales,
- no hacer commit ni push.

Entrega final:
- que se implemento,
- archivos tocados,
- verificaciones hechas,
- riesgos residuales,
- siguiente paso recomendado.

Termina con `git status` resumido.
```

**Resultado esperado**

- bloque implementado y verificable.

**Archivos que puede modificar**

- solo los necesarios para el bloque

**Archivos que no debe modificar**

- archivos ajenos al alcance
- `.env*`

**Comprobaciones finales**

- lint/tests/build/validacion SDK segun tipo de bloque
- `git status`

**Condicion para pasar al siguiente bloque**

- que el bloque este construido y comprobado localmente.

---

## 12. QA, tests, lint y build

**Cuando usarlo**

- despues de cambios funcionales;
- antes de cierre o despliegue.

**Playbook recomendado**

- `.codex/playbooks/review-and-fix.md`

**Agentes implicados**

- `qa-verifier`
- `code-reviewer`

**Prompt exacto para Codex**

```text
Quiero ejecutar QA, tests, lint y build del bloque actual.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Usa `.codex/playbooks/review-and-fix.md`

Objetivo:
- ejecutar las comprobaciones razonables del bloque,
- resumir resultados,
- no hacer commit ni push,
- corregir solo fallos claros y acotados si aparecen.

Entrega final:
- comandos ejecutados,
- resultados,
- fallos detectados,
- siguiente paso recomendado.

Termina con `git status` resumido.
```

**Resultado esperado**

- estado de calidad del bloque conocido.

**Archivos que puede modificar**

- tests
- codigo del bloque si corrige fallos acotados
- docs si cambia el estado

**Archivos que no debe modificar**

- produccion
- `.env*`

**Comprobaciones finales**

- lint/test/build relevantes
- `git status`

**Condicion para pasar al siguiente bloque**

- que el bloque pase o que los fallos queden aislados.

---

## 13. Correccion de errores

**Cuando usarlo**

- cuando QA, revision o validacion real detecten fallos.

**Playbook recomendado**

- `.codex/playbooks/review-and-fix.md`

**Agentes implicados**

- `fixer`
- `code-reviewer`
- `qa-verifier`

**Prompt exacto para Codex**

```text
Quiero corregir los errores detectados en el bloque actual.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Lee el resumen de fallos detectados
7. Usa `.codex/playbooks/review-and-fix.md`

Objetivo:
- aplicar correcciones minimas, seguras y reversibles,
- volver a validar el error corregido,
- no tocar produccion sin confirmacion,
- no hacer commit ni push.

Entrega final:
- error corregido,
- archivos tocados,
- validacion repetida,
- siguiente paso recomendado.

Termina con `git status` resumido.
```

**Resultado esperado**

- fallo corregido y verificado.

**Archivos que puede modificar**

- archivos implicados en el error

**Archivos que no debe modificar**

- bloques no relacionados
- `.env*`

**Comprobaciones finales**

- repetir la validacion del error
- `git status`

**Condicion para pasar al siguiente bloque**

- que el error quede resuelto o claramente bloqueado.

---

## 14. Documentacion

**Cuando usarlo**

- al cerrar cualquier bloque que cambie estado, contratos o uso operativo.

**Playbook recomendado**

- `.codex/playbooks/documentation-update.md`

**Agentes implicados**

- `documentation-writer`
- `project-state-auditor`

**Prompt exacto para Codex**

```text
Quiero cerrar la documentacion del bloque actual.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Usa `.codex/playbooks/documentation-update.md`

Objetivo:
- actualizar documentacion afectada por el bloque,
- dejar estado, roadmap y decisiones alineadas,
- no tocar logica salvo documentacion,
- no hacer commit ni push.

Entrega final:
- documentos actualizados,
- huecos pendientes,
- siguiente paso recomendado.

Termina con `git status` resumido.
```

**Resultado esperado**

- documentacion coherente con el bloque recien trabajado.

**Archivos que puede modificar**

- `docs/**`
- `README.md`
- `workflows/**`
- `scripts/README.md`

**Archivos que no debe modificar**

- logica de producto si el bloque es solo documental

**Comprobaciones finales**

- `git status`

**Condicion para pasar al siguiente bloque**

- que el estado documental quede alineado.

---

## 15. Preparacion de despliegue

**Cuando usarlo**

- antes de validar en Render/Vercel/n8n un bloque ya implementado.

**Playbook recomendado**

- `.codex/playbooks/deployment-prep.md`

**Agentes implicados**

- `deployment-engineer`
- `qa-verifier`
- `security-auditor`

**Prompt exacto para Codex**

```text
Quiero preparar el despliegue del bloque actual.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Lee `docs/DEPLOYMENT.md`
7. Usa `.codex/playbooks/deployment-prep.md`

Objetivo:
- revisar configuracion, variables, scripts y checklist de despliegue,
- no modificar produccion sin confirmacion,
- no tocar `.env` reales,
- no hacer commit ni push salvo que el bloque lo exija luego.

Entrega final:
- checklist de despliegue,
- huecos de configuracion,
- siguiente paso recomendado.

Termina con `git status` resumido.
```

**Resultado esperado**

- bloque listo para desplegar o revalidar.

**Archivos que puede modificar**

- `docs/DEPLOYMENT.md`
- `render.yaml`
- documentacion operativa de despliegue

**Archivos que no debe modificar**

- `.env*` reales
- produccion sin confirmacion

**Comprobaciones finales**

- `git status`

**Condicion para pasar al siguiente bloque**

- que el despliegue tenga checklist clara.

---

## 16. Preparacion comercial/ventas

**Cuando usarlo**

- cuando haya que convertir la capacidad tecnica en oferta vendible.

**Playbook recomendado**

- `.codex/playbooks/sales-campaign.md`

**Agentes implicados**

- `business-analyst`
- `sales-lead-generator`
- `documentation-writer`

**Prompt exacto para Codex**

```text
Quiero preparar el bloque comercial/ventas del proyecto.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Lee `docs/SALES_PLAYBOOK.md`
7. Usa `.codex/playbooks/sales-campaign.md`

Objetivo:
- definir oferta, ICP, propuesta de valor y material comercial reutilizable,
- no enviar comunicaciones reales,
- no tocar logica del producto,
- no hacer commit ni push.

Entrega final:
- piezas comerciales preparadas,
- huecos pendientes,
- siguiente paso recomendado.

Termina con `git status` resumido.
```

**Resultado esperado**

- base comercial utilizable para negocio real.

**Archivos que puede modificar**

- `docs/SALES_PLAYBOOK.md`
- documentacion comercial relacionada

**Archivos que no debe modificar**

- produccion
- `.env*`
- logica tecnica salvo documentacion

**Comprobaciones finales**

- `git status`

**Condicion para pasar al siguiente bloque**

- que exista material comercial claro y accionable.

---

## 17. Cierre de bloque

**Cuando usarlo**

- cuando un bloque ya esta implementado y validado.

**Playbook recomendado**

- `.codex/playbooks/secure-release.md`

**Agentes implicados**

- `qa-verifier`
- `security-auditor`
- `documentation-writer`

**Prompt exacto para Codex**

```text
Quiero cerrar el bloque actual de forma segura.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Usa `.codex/playbooks/secure-release.md`

Objetivo:
- confirmar que el bloque esta implementado, validado y documentado,
- dejar riesgos residuales claros,
- no hacer commit ni push todavia salvo que el siguiente bloque sea precisamente el de Git.

Entrega final:
- resumen del bloque,
- verificaciones ejecutadas,
- riesgos residuales,
- recomendacion de commit o no.

Termina con `git status` resumido.
```

**Resultado esperado**

- bloque listo para commit o claramente pendiente.

**Archivos que puede modificar**

- documentacion final del bloque

**Archivos que no debe modificar**

- logica no relacionada

**Comprobaciones finales**

- `git status`

**Condicion para pasar al siguiente bloque**

- que el bloque quede listo para Git o quede bloqueado con precision.

---

## 18. Commit y push

**Cuando usarlo**

- solo cuando el usuario lo pida expresamente o el bloque lo autorice de forma explicita.

**Playbook recomendado**

- `.codex/playbooks/commit-and-push.md`

**Agentes implicados**

- `git-operator`
- `security-auditor`

**Prompt exacto para Codex**

```text
Quiero preparar y ejecutar commit/push del bloque actual.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Usa `.codex/playbooks/commit-and-push.md`

Objetivo:
- revisar `git status`,
- agrupar archivos correctamente,
- detectar secretos o ficheros no deseados,
- proponer mensaje de commit,
- hacer commit y push solo porque este es el bloque especifico de Git.

Entrega final:
- archivos incluidos,
- commit realizado,
- push realizado o bloqueo preciso,
- estado final de Git.
```

**Resultado esperado**

- commit y push limpios o bloqueo claramente documentado.

**Archivos que puede modificar**

- ninguno por logica; solo indice Git si procede

**Archivos que no debe modificar**

- `.env*` reales
- secretos

**Comprobaciones finales**

- `git status`
- `git log --oneline -N`

**Condicion para pasar al siguiente bloque**

- que el repositorio quede limpio o el bloqueo de Git sea explicito.

---

## 19. Generacion del siguiente prompt operativo

**Cuando usarlo**

- al final de cualquier bloque ya trabajado.

**Playbook recomendado**

- `.codex/playbooks/project-diagnosis-and-next-prompt.md`

**Agentes implicados**

- `prompt-engineer`
- `roadmap-planner`
- `orchestrator`

**Prompt exacto para Codex**

```text
Quiero generar el siguiente prompt operativo del proyecto.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`
6. Usa `.codex/playbooks/project-diagnosis-and-next-prompt.md`

Objetivo:
- identificar el siguiente bloque logico real,
- generar un prompt exacto y ejecutable para Codex,
- no hacer commit ni push,
- dejar claro que documentacion debe actualizarse en el siguiente paso.

Entrega final:
- siguiente bloque logico,
- prompt exacto listo para copiar,
- riesgos previos,
- condicion de cierre del siguiente bloque.

Termina con `git status` resumido.
```

**Resultado esperado**

- siguiente prompt listo y coherente con el estado real.

**Archivos que puede modificar**

- `docs/PROJECT_STATUS.md`
- `docs/ROADMAP.md`
- `prompt.md` si la guia requiere mantenimiento

**Archivos que no debe modificar**

- logica de producto salvo documentacion

**Comprobaciones finales**

- `git status`

**Condicion para pasar al siguiente bloque**

- que el siguiente prompt quede accionable sin ambiguedad.

---

## Prompt maestro de continuidad

```text
Quiero que continues el proyecto de forma autonoma.

Antes de actuar:
1. Lee `CONTEXT.md`
2. Lee `AGENTS.md`
3. Lee `prompt.md`
4. Lee `docs/PROJECT_STATUS.md`
5. Lee `docs/ROADMAP.md`

Objetivo:
- determinar el bloque logico actual del proyecto,
- elegir en `prompt.md` el bloque que corresponda,
- ejecutar el prompt exacto de ese bloque,
- trabajar de forma autonoma salvo riesgo critico, cambio destructivo o produccion,
- actualizar documentacion cuando proceda,
- no tocar `.env` reales,
- no exponer secretos,
- no hacer commit ni push salvo que el bloque activo sea especificamente el de Git o exista instruccion expresa.

Entrega final obligatoria:
- bloque ejecutado,
- archivos tocados,
- verificaciones realizadas,
- riesgos residuales,
- `git status` resumido,
- siguiente paso recomendado,
- siguiente prompt exacto listo para ejecutar.

Despues de esa entrega, anade obligatoriamente este cierre estructurado exacto:

=== CODEX_NEXT ===
block: <nombre exacto del siguiente bloque de prompt.md>
prompt:
```text
<siguiente prompt exacto listo para ejecutar>
```
=== /CODEX_NEXT ===

No anadas texto despues de `=== /CODEX_NEXT ===`.
```
