import { useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { obtenerCliente } from "../utils/api";

export default function ClienteDetalle() {
  const [clienteId, setClienteId] = useState("");
  const [token, setToken] = useState("");
  const [cliente, setCliente] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      const result = await obtenerCliente(clienteId.trim(), token.trim());
      setCliente(result.cliente);
    } catch (requestError) {
      setCliente(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="panel">
        <h2 className="panel-title">Consulta segura de cliente</h2>
        <p className="panel-subtitle">
          Conectado a <code>GET /api/clientes/:cliente_id</code> con <code>Authorization: Bearer</code>.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">cliente_id</label>
            <input
              className="field"
              value={clienteId}
              onChange={(event) => setClienteId(event.target.value)}
              placeholder="UUID del cliente"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Bearer token</label>
            <textarea
              className="field min-h-32 font-mono"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="client_xxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>

          <div className="flex gap-3">
            <button className="button-primary" type="submit" disabled={loading}>
              {loading ? "Consultando..." : "Obtener cliente"}
            </button>
            <button
              className="button-secondary"
              type="button"
              onClick={() => {
                setClienteId("");
                setToken("");
                setCliente(null);
                setError("");
              }}
            >
              Limpiar
            </button>
          </div>
        </form>

        <div className="mt-6">
          {loading ? <LoadingSpinner label="Consultando cliente autenticado..." /> : null}
          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {error}
            </div>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">Respuesta del backend</h2>
        <p className="panel-subtitle">
          Solo se muestran datos publicos del cliente. El backend no expone credenciales ni hashes
          de tokens.
        </p>

        {cliente ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Empresa</p>
              <p className="mt-2 text-lg font-semibold text-ink">{cliente.nombre_empresa}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Email</p>
              <p className="mt-2 text-lg font-semibold text-ink">{cliente.email_contacto}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Plan</p>
              <p className="mt-2 text-lg font-semibold text-ink">{cliente.plan}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Estado</p>
              <p className="mt-2 text-lg font-semibold text-ink">{cliente.estado}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Telefono</p>
              <p className="mt-2 text-lg font-semibold text-ink">{cliente.telefono || "-"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Precio mensual</p>
              <p className="mt-2 text-lg font-semibold text-ink">{cliente.precio_mensual} EUR</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
              <p className="text-sm text-slate-500">Payload completo</p>
              <pre className="mt-3 overflow-auto text-xs text-slate-700">
                {JSON.stringify(cliente, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="Sin consulta ejecutada"
              description="Introduce un cliente_id y un Bearer token valido para consultar el endpoint real ya disponible en backend."
            />
          </div>
        )}
      </section>
    </div>
  );
}
