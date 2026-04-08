import { apiBaseUrl } from "../utils/api";

export default function Settings() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <section className="panel">
        <h2 className="panel-title">Configuracion frontend</h2>
        <p className="panel-subtitle">
          Parametros visibles de entorno para el frontend admin. No se muestran secretos.
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">API base URL</p>
            <p className="mt-2 break-all font-mono text-sm text-ink">{apiBaseUrl}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Variable esperada</p>
            <p className="mt-2 font-mono text-sm text-ink">VITE_API_URL</p>
          </div>
        </div>
      </section>

      <section className="panel bg-sand">
        <h2 className="panel-title">Notas de entorno</h2>
        <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
          <li>El frontend se ha separado como proyecto independiente en <code>src/frontend</code>.</li>
          <li>Los endpoints consumidos se limitan a contratos backend ya presentes.</li>
          <li>Automatizaciones y facturacion mantienen placeholders hasta cerrar integracion final.</li>
          <li>Para local, el ejemplo recomendado es <code>http://localhost:3000/api</code>.</li>
        </ul>
      </section>
    </div>
  );
}
