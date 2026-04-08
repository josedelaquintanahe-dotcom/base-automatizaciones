import EmptyState from "../components/EmptyState";

export default function Automatizaciones() {
  return (
    <div className="space-y-6">
      <section className="panel">
        <h2 className="panel-title">Automatizaciones</h2>
        <p className="panel-subtitle">
          El backend ya define rutas y services para automatizaciones, pero esta pantalla se
          mantiene conservadora hasta validar el flujo completo extremo a extremo con n8n y tokens
          reales.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="panel">
          <h3 className="text-lg font-semibold text-ink">Ejecutar workflow</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Pendiente de integracion backend validada. Se reservara este bloque para disparar
            <code> POST /api/automatizaciones/:cliente_id/:workflow_id/ejecutar</code>.
          </p>
          <button className="button-primary mt-6" disabled>
            Pendiente de integracion
          </button>
        </div>

        <div className="panel">
          <h3 className="text-lg font-semibold text-ink">Estado de workflow</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Preparado para consumir el endpoint de estado una vez quede validado el retorno real de
            estadisticas e historial.
          </p>
          <button className="button-secondary mt-6" disabled>
            Endpoint pendiente de validacion final
          </button>
        </div>

        <div className="panel">
          <h3 className="text-lg font-semibold text-ink">Pausar workflow</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Bloque reservado para pausar automatizaciones sin asumir todavia que la UX admin final
            ya esta cerrada.
          </p>
          <button className="button-secondary mt-6" disabled>
            Pendiente de integracion
          </button>
        </div>
      </div>

      <EmptyState
        title="Integracion frontend-backend aun conservadora"
        description="No se simulan datos ni ejecuciones. Esta vista existe para ordenar el dashboard admin y dejar claro que la funcionalidad backend necesita validacion operativa antes de abrirla al frontend."
      />
    </div>
  );
}
