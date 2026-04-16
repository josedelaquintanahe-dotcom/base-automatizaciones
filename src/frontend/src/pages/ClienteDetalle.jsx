import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { obtenerClienteBackoffice } from "../utils/api";

const BACKOFFICE_TOKEN_STORAGE_KEY = "backoffice_api_token";

function getClienteDetalleErrorMessage(error) {
  if (!error) {
    return "No se pudo consultar el detalle del cliente.";
  }

  if (error.status === 401) {
    return "Token de backoffice no valido o expirado";
  }

  if (error.status === 403) {
    return "No autorizado para acceder al detalle administrativo";
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

  return error.message || "No se pudo consultar el detalle del cliente.";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

function getInitialBackofficeToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.sessionStorage.getItem(BACKOFFICE_TOKEN_STORAGE_KEY) || "";
}

export default function ClienteDetalle() {
  const [searchParams] = useSearchParams();
  const [clienteId, setClienteId] = useState(searchParams.get("cliente_id") || "");
  const [token, setToken] = useState(getInitialBackofficeToken);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const cliente = useMemo(() => detail?.cliente || null, [detail]);
  const operationalSummary = useMemo(() => detail?.operational_summary || null, [detail]);
  const automationReadiness = useMemo(() => detail?.automation_readiness || null, [detail]);

  useEffect(() => {
    const clienteIdParam = searchParams.get("cliente_id") || "";
    setClienteId(clienteIdParam);
  }, [searchParams]);

  function updateBackofficeToken(value) {
    setToken(value);

    if (typeof window === "undefined") {
      return;
    }

    if (value.trim()) {
      window.sessionStorage.setItem(BACKOFFICE_TOKEN_STORAGE_KEY, value);
      return;
    }

    window.sessionStorage.removeItem(BACKOFFICE_TOKEN_STORAGE_KEY);
  }

  function validateQuery() {
    if (!clienteId.trim()) {
      return "cliente_id es obligatorio.";
    }

    if (!token.trim()) {
      return "El token de backoffice es obligatorio.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const localError = validateQuery();

    if (localError) {
      setValidationError(localError);
      setError("");
      setDetail(null);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setValidationError("");
      const result = await obtenerClienteBackoffice(clienteId.trim(), token.trim());
      setDetail(result);
    } catch (requestError) {
      setDetail(null);
      setError(getClienteDetalleErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="panel">
        <h2 className="panel-title">Detalle administrativo de cliente</h2>
        <p className="panel-subtitle">
          Conectado a <code>GET /api/clientes/backoffice/:cliente_id</code> con{" "}
          <code>Authorization: Bearer</code> de backoffice.
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
            <label className="text-sm font-medium text-slate-700">Bearer token de backoffice</label>
            <textarea
              className="field min-h-32 font-mono"
              value={token}
              onChange={(event) => updateBackofficeToken(event.target.value)}
              placeholder="backoffice_xxxxxxxxxxxxxxxxxxxxxxxxxx"
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
                updateBackofficeToken("");
                setDetail(null);
                setError("");
                setValidationError("");
              }}
            >
              Limpiar
            </button>
          </div>
        </form>

        <div className="mt-6">
          {loading ? <LoadingSpinner label="Consultando detalle administrativo..." /> : null}
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
        <h2 className="panel-title">Resumen operativo</h2>
        <p className="panel-subtitle">
          Se muestran datos utiles para operaciones internas y readiness de automatizacion sin
          exponer secretos, valores cifrados ni tokens completos.
        </p>

        {cliente ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    Cliente operativo
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Vista administrativa preparada para alimentar futuras automatizaciones de onboarding.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                  Backoffice OK
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
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Fecha de alta</p>
                <p className="mt-2 text-lg font-semibold text-ink">{formatDate(cliente.created_at)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Inicio de servicio</p>
                <p className="mt-2 text-lg font-semibold text-ink">{formatDate(cliente.fecha_inicio)}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Estado onboarding</p>
                <p className="mt-2 text-lg font-semibold text-ink">
                  {operationalSummary?.onboarding_status || "-"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Credenciales activas</p>
                <p className="mt-2 text-lg font-semibold text-ink">
                  {operationalSummary?.credenciales?.activas ?? 0} /{" "}
                  {operationalSummary?.credenciales?.total ?? 0}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Token operativo</p>
                <p className="mt-2 text-lg font-semibold text-ink">
                  {operationalSummary?.access?.token_operativo_activo ? "Activo" : "Pendiente"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Tipos de credencial</p>
                <p className="mt-2 text-sm font-medium text-ink">
                  {operationalSummary?.credenciales?.tipos_configurados?.length
                    ? operationalSummary.credenciales.tipos_configurados.join(", ")
                    : "Sin credenciales activas"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Expiracion token operativo</p>
                <p className="mt-2 text-sm font-medium text-ink">
                  {operationalSummary?.access?.expiracion_token || "-"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Factura inicial</p>
                <p className="mt-2 text-sm font-medium text-ink">
                  {operationalSummary?.billing?.factura_inicial_emitida
                    ? `${operationalSummary.billing.ultima_factura?.estado || "registrada"} - ${
                        operationalSummary.billing.ultima_factura?.total || 0
                      } EUR`
                    : "Pendiente"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Proxima accion recomendada</p>
                <p className="mt-2 text-sm font-medium text-ink">
                  {automationReadiness?.next_recommended_action || "-"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Checks de readiness</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {(automationReadiness?.checks || []).map((check) => (
                  <div
                    key={check.key}
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      check.ok
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-amber-200 bg-amber-50 text-amber-900"
                    }`}
                  >
                    <p className="font-medium">{check.label}</p>
                    <p className="mt-1">{check.ok ? "OK" : "Pendiente"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Payload completo</p>
              <pre className="mt-3 overflow-auto text-xs text-slate-700">
                {JSON.stringify(detail, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="Sin consulta ejecutada"
              description="Introduce un cliente_id y un Bearer token de backoffice para consultar el detalle operativo y preparar futuras automatizaciones."
            />
          </div>
        )}
      </section>
    </div>
  );
}
