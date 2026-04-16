import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import { crearCliente, listarClientes } from "../utils/api";

const BACKOFFICE_TOKEN_STORAGE_KEY = "backoffice_api_token";
const initialFormState = {
  nombre_empresa: "",
  email: "",
  telefono: "",
  plan: "profesional",
  gmail_email: "",
  api_token: "",
  credenciales_json: "",
};

function buildCredenciales(formState) {
  const credenciales = {};

  if (formState.gmail_email.trim()) {
    credenciales.gmail_email = formState.gmail_email.trim();
  }

  if (formState.api_token.trim()) {
    credenciales.api_token = formState.api_token.trim();
  }

  if (!formState.credenciales_json.trim()) {
    return credenciales;
  }

  const parsed = JSON.parse(formState.credenciales_json);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("credenciales_json debe ser un objeto JSON valido.");
  }

  return {
    ...credenciales,
    ...parsed,
  };
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getClienteErrorMessage(error) {
  if (!error) {
    return "No se pudo completar el onboarding.";
  }

  if (error.status === 400) {
    return "Revisa los datos del formulario o usa un email no registrado";
  }

  if (error.status === 401 || error.status === 403) {
    return "No autorizado";
  }

  if (error.status === 500) {
    return "Error interno del servidor";
  }

  if (error.message === "No se pudo conectar con el backend") {
    return "No se pudo conectar con el backend";
  }

  return error.message || "No se pudo completar el onboarding.";
}

function getListadoErrorMessage(error) {
  if (!error) {
    return "No se pudo cargar el listado de clientes.";
  }

  if (error.status === 401 || error.status === 403) {
    return "Token de backoffice invalido o no autorizado para el listado interno.";
  }

  if (error.status === 503) {
    return "El backend no tiene configurado BACKOFFICE_API_TOKEN para el backoffice.";
  }

  if (error.message === "No se pudo conectar con el backend") {
    return "No se pudo conectar con el backend para cargar el listado.";
  }

  if (error.status >= 500) {
    return "El backend devolvio un error al cargar el listado de clientes.";
  }

  return error.message || "No se pudo cargar el listado de clientes.";
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

export default function Clientes() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [copyMessage, setCopyMessage] = useState("");
  const [clientes, setClientes] = useState([]);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [clientesError, setClientesError] = useState("");
  const [backofficeToken, setBackofficeToken] = useState(getInitialBackofficeToken);

  const lastCliente = useMemo(() => response || null, [response]);

  function updateBackofficeToken(value) {
    setBackofficeToken(value);

    if (typeof window === "undefined") {
      return;
    }

    if (value.trim()) {
      window.sessionStorage.setItem(BACKOFFICE_TOKEN_STORAGE_KEY, value);
      return;
    }

    window.sessionStorage.removeItem(BACKOFFICE_TOKEN_STORAGE_KEY);
  }

  async function loadClientes(options = {}) {
    const { silentIfMissing = false } = options;
    const trimmedToken = backofficeToken.trim();

    if (!trimmedToken) {
      setClientes([]);
      setClientesLoading(false);

      if (!silentIfMissing) {
        setClientesError("Introduce un token Bearer de backoffice para cargar el listado interno.");
      }

      return;
    }

    try {
      setClientesLoading(true);
      setClientesError("");
      const result = await listarClientes(trimmedToken);
      setClientes(Array.isArray(result.clientes) ? result.clientes : []);
    } catch (requestError) {
      setClientesError(getListadoErrorMessage(requestError));
    } finally {
      setClientesLoading(false);
    }
  }

  useEffect(() => {
    loadClientes({ silentIfMissing: true });
  }, []);

  function validateForm() {
    const errors = [];

    if (!formState.nombre_empresa.trim() || formState.nombre_empresa.trim().length < 3) {
      errors.push("El nombre de empresa debe tener al menos 3 caracteres.");
    }

    if (!validarEmail(formState.email.trim())) {
      errors.push("Introduce un email valido.");
    }

    if (!formState.telefono.trim()) {
      errors.push("El telefono es obligatorio.");
    }

    if (!formState.plan.trim()) {
      errors.push("Selecciona un plan.");
    }

    if (!formState.gmail_email.trim()) {
      errors.push("gmail_email es obligatorio.");
    }

    if (!formState.api_token.trim()) {
      errors.push("api_token es obligatorio.");
    }

    if (formState.credenciales_json.trim()) {
      try {
        const parsed = JSON.parse(formState.credenciales_json);

        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          errors.push("El JSON extra debe ser un objeto valido.");
        }
      } catch (parseError) {
        errors.push("El JSON extra no tiene un formato valido.");
      }
    }

    return errors;
  }

  async function copyToClipboard(value, label) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(`${label} copiado.`);
      window.setTimeout(() => setCopyMessage(""), 2400);
    } catch (copyError) {
      setCopyMessage(`No se pudo copiar ${label.toLowerCase()}.`);
      window.setTimeout(() => setCopyMessage(""), 2400);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const formErrors = validateForm();

    if (formErrors.length > 0) {
      setValidationErrors(formErrors);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setValidationErrors([]);
      setCopyMessage("");
      const payload = {
        nombre_empresa: formState.nombre_empresa.trim(),
        email: formState.email.trim(),
        telefono: formState.telefono.trim(),
        plan: formState.plan,
        credenciales: buildCredenciales(formState),
      };
      const result = await crearCliente(payload);
      setResponse(result);
      setFormState(initialFormState);
      await loadClientes({ silentIfMissing: true });
    } catch (requestError) {
      setError(getClienteErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  function updateField(fieldName, fieldValue) {
    setFormState((current) => ({
      ...current,
      [fieldName]: fieldValue,
    }));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="panel">
          <h2 className="panel-title">Onboarding de cliente</h2>
          <p className="panel-subtitle">
            Conectado a <code>POST /api/clientes/onboarding</code>. Devuelve el identificador del
            cliente y el token operativo generado por backend.
          </p>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Nombre empresa</label>
                <input
                  className="field"
                  value={formState.nombre_empresa}
                  onChange={(event) => updateField("nombre_empresa", event.target.value)}
                  placeholder="Test SL"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  className="field"
                  type="email"
                  value={formState.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="test@test.com"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Telefono</label>
                <input
                  className="field"
                  value={formState.telefono}
                  onChange={(event) => updateField("telefono", event.target.value)}
                  placeholder="600000000"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Plan</label>
                <select
                  className="field"
                  value={formState.plan}
                  onChange={(event) => updateField("plan", event.target.value)}
                >
                  <option value="basico">Basico</option>
                  <option value="profesional">Profesional</option>
                  <option value="empresarial">Empresarial</option>
                </select>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                Credenciales
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">gmail_email</label>
                  <input
                    className="field"
                    value={formState.gmail_email}
                    onChange={(event) => updateField("gmail_email", event.target.value)}
                    placeholder="test@gmail.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">api_token</label>
                  <input
                    className="field"
                    value={formState.api_token}
                    onChange={(event) => updateField("api_token", event.target.value)}
                    placeholder="abc123"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium text-slate-700">
                  Credenciales extra en JSON
                </label>
                <textarea
                  className="field min-h-28 font-mono"
                  value={formState.credenciales_json}
                  onChange={(event) => updateField("credenciales_json", event.target.value)}
                  placeholder='{"otra_clave":"valor"}'
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="button-primary" type="submit" disabled={loading}>
                {loading ? "Creando cliente..." : "Crear cliente"}
              </button>
              <button
                className="button-secondary"
                type="button"
                disabled={loading}
                onClick={() => {
                  setFormState(initialFormState);
                  setError("");
                  setValidationErrors([]);
                  setCopyMessage("");
                }}
              >
                Limpiar
              </button>
            </div>
          </form>

          <div className="mt-6">
            {loading ? <LoadingSpinner label="Enviando onboarding al backend..." /> : null}
            {validationErrors.length > 0 ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-medium">Corrige estos campos antes de enviar:</p>
                <ul className="mt-2 list-disc pl-5">
                  {validationErrors.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {error}
              </div>
            ) : null}
            {copyMessage ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                {copyMessage}
              </div>
            ) : null}
          </div>
        </section>

        <div className="space-y-6">
          <section className="panel">
            <h2 className="panel-title">Ultima respuesta de onboarding</h2>
            <p className="panel-subtitle">
              El token solo se muestra en la respuesta inmediata del backend para facilitar pruebas
              controladas en local.
            </p>
            {lastCliente ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">
                        Cliente creado
                      </p>
                      <p className="mt-2 text-sm text-emerald-900/80">
                        Guarda estos datos solo en un entorno seguro de administracion.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                      OK
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">cliente_id</p>
                    <button
                      className="button-secondary px-3 py-2 text-xs"
                      type="button"
                      onClick={() => copyToClipboard(lastCliente.cliente_id, "Cliente ID")}
                    >
                      Copiar
                    </button>
                  </div>
                  <p className="mt-2 break-all text-sm font-medium text-ink">
                    {lastCliente.cliente_id}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">token</p>
                    <button
                      className="button-secondary px-3 py-2 text-xs"
                      type="button"
                      onClick={() => copyToClipboard(lastCliente.token, "Token")}
                    >
                      Copiar
                    </button>
                  </div>
                  <p className="mt-2 break-all font-mono text-xs text-ink">{lastCliente.token}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Setup inicial</p>
                    <p className="mt-2 text-xl font-semibold text-ink">
                      {lastCliente.setup_inicial} EUR
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Mantenimiento mensual</p>
                    <p className="mt-2 text-xl font-semibold text-ink">
                      {lastCliente.mantenimiento_mensual} EUR
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Aun no hay cliente creado"
                description="Completa el formulario y ejecuta el onboarding para ver aqui el cliente_id, el token operativo y el resumen economico devueltos por el backend."
              />
            )}
          </section>
        </div>
      </div>

      <section className="panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="panel-title">Listado global de clientes</h2>
            <p className="panel-subtitle">
              Conectado a <code>GET /api/clientes</code> con <code>Authorization: Bearer</code> de
              backoffice. El listado se refresca automaticamente tras crear un cliente si el token
              interno ya esta cargado.
            </p>
          </div>
          <button
            className="button-secondary"
            type="button"
            onClick={() => loadClientes()}
            disabled={clientesLoading}
          >
            {clientesLoading ? "Actualizando..." : "Refrescar listado"}
          </button>
        </div>

        <div className="mt-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <label className="text-sm font-medium text-slate-700">Bearer token de backoffice</label>
            <div className="mt-3 flex flex-col gap-3 md:flex-row">
              <input
                className="field"
                type="password"
                value={backofficeToken}
                onChange={(event) => updateBackofficeToken(event.target.value)}
                placeholder="Introduce el token interno"
                autoComplete="off"
              />
              <button
                className="button-secondary"
                type="button"
                onClick={() => loadClientes()}
                disabled={clientesLoading}
              >
                {clientesLoading ? "Validando..." : "Cargar listado"}
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Este token se guarda solo en la sesion del navegador para no incrustar secretos en el
              frontend.
            </p>
          </div>

          {clientesLoading ? <LoadingSpinner label="Cargando clientes..." /> : null}
          {clientesError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {clientesError}
            </div>
          ) : null}

          {!clientesLoading && !clientesError && clientes.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Sin clientes registrados"
                description="Todavia no hay clientes en la base de datos o el listado aun esta vacio."
              />
            </div>
          ) : null}

          {!clientesLoading && !clientesError && clientes.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Nombre</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Fecha de alta</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clientes.map((cliente) => (
                      <tr key={cliente.id} className="align-top">
                        <td className="px-4 py-3 font-medium text-ink">{cliente.nombre || "-"}</td>
                        <td className="px-4 py-3 text-slate-700">{cliente.email_contacto || "-"}</td>
                        <td className="px-4 py-3 text-slate-700">{formatDate(cliente.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {cliente.estado || "sin estado"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{cliente.id}</td>
                        <td className="px-4 py-3">
                          <button
                            className="button-secondary px-3 py-2 text-xs"
                            type="button"
                            onClick={() => {
                              navigate(`/cliente-detalle?cliente_id=${encodeURIComponent(cliente.id)}`);
                            }}
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
