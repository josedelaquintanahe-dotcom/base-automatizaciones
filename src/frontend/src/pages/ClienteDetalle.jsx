import { useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { obtenerCliente } from "../utils/api";

function getClienteDetalleErrorMessage(error) {
  if (!error) {
    return "No se pudo consultar el cliente.";
  }

  if (error.status === 401) {
    return "Token no valido o expirado";
  }

  if (error.status === 403) {
    return "El token no corresponde a ese cliente";
  }

  if (error.status === 404) {
    return "Cliente no encontrado";
  }

  if (error.status === 500) {
    return "Error interno del servidor";
  }

  if (error.message === "No se pudo conectar con el backend") {
    return "No se pudo conectar con el backend";
  }

  return error.message || "No se pudo consultar el cliente.";
}

export default function ClienteDetalle() {
  const [clienteId, setClienteId] = useState("");
  const [token, setToken] = useState("");
  const [cliente, setCliente] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  function validateQuery() {
    if (!clienteId.trim()) {
      return "cliente_id es obligatorio.";
    }

    if (!token.trim()) {
      return "El token es obligatorio.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const localError = validateQuery();

    if (localError) {
      setValidationError(localError);
      setError("");
      setCliente(null);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setValidationError("");
      const result = await obtenerCliente(clienteId.trim(), token.trim());
      setCliente(result.cliente);
    } catch (requestError) {
      setCliente(null);
      setError(getClienteDetalleErrorMessage(requestError));
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
              disabled={loading}
              onClick={() => {
                setClienteId("");
                setToken("");
                setCliente(null);
                setError("");
                setValidationError("");
              }}
            >
              Limpiar
            </button>
          </div>
        </form>

        <div className="mt-6">
          {loading ? <LoadingSpinner label="Consultando cliente autenticado..." /> : null}
          {validationError ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {validationError}
            </div>
          ) : null}
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
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    Cliente autenticado
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Consulta resuelta con token Bearer valido para este cliente.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                  Acceso permitido
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
