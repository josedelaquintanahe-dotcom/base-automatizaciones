import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

function normalizeError(error) {
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.message) {
    return error.message;
  }

  return "Error desconocido de comunicacion con la API.";
}

export async function getHealth() {
  try {
    const response = await api.get("/health");
    return response.data;
  } catch (error) {
    throw new Error(normalizeError(error));
  }
}

export async function getSystemStatus() {
  try {
    const response = await api.get("/system/status");
    return response.data;
  } catch (error) {
    throw new Error(normalizeError(error));
  }
}

export async function crearCliente(datos) {
  try {
    const response = await api.post("/clientes/onboarding", datos);
    return response.data;
  } catch (error) {
    throw new Error(normalizeError(error));
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
    throw new Error(normalizeError(error));
  }
}

export { api, apiBaseUrl };
