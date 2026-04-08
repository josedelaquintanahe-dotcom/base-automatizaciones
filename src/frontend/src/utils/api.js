import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

function createApiError(message, status = null, details = null) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}

export function parseApiError(error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? null;
    const backendError = error.response?.data?.error || null;

    if (!error.response) {
      return createApiError("No se pudo conectar con el backend", null, backendError);
    }

    if (status === 400) {
      return createApiError(
        backendError || "Revisa los datos enviados antes de volver a intentarlo",
        status,
        backendError,
      );
    }

    if (status === 401 || status === 403) {
      return createApiError("No autorizado", status, backendError);
    }

    if (status === 404) {
      return createApiError("Recurso no encontrado", status, backendError);
    }

    if (status >= 500) {
      return createApiError("Error interno del servidor", status, backendError);
    }

    return createApiError(
      backendError || error.message || "Error desconocido de comunicacion con la API.",
      status,
      backendError,
    );
  }

  return createApiError(error?.message || "Error desconocido de comunicacion con la API.");
}

export async function getHealth() {
  try {
    const response = await api.get("/health");
    return response.data;
  } catch (error) {
    throw parseApiError(error);
  }
}

export async function getSystemStatus() {
  try {
    const response = await api.get("/system/status");
    return response.data;
  } catch (error) {
    throw parseApiError(error);
  }
}

export async function crearCliente(datos) {
  try {
    const response = await api.post("/clientes/onboarding", datos);
    return response.data;
  } catch (error) {
    throw parseApiError(error);
  }
}

export async function obtenerCliente(clienteId, token) {
  try {
    const response = await api.get(`/clientes/${clienteId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw parseApiError(error);
  }
}

export { api, apiBaseUrl };
