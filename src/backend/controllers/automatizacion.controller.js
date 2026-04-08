"use strict";

const {
  obtenerAutomatizacionesService,
  pausarAutomatizacionService,
} = require("../services/automatizacion.service");
const {
  ejecutarWorkflowService,
  obtenerHistorialService,
} = require("../services/ejecucion.service");

function buildForbiddenResponse(res) {
  return res.status(403).json({
    success: false,
    error: "No autorizado para acceder a este cliente.",
  });
}

function resolveWorkflowRecord(automatizaciones, workflowId) {
  return (automatizaciones || []).find((item) => item.id === workflowId || item.n8n_workflow_id === workflowId);
}

function buildEstadisticas(ejecuciones) {
  const historial = Array.isArray(ejecuciones) ? ejecuciones : [];
  const total = historial.length;
  const exitosas = historial.filter((item) => item.estado === "exito").length;
  const errores = historial.filter((item) => item.estado === "error").length;
  const duraciones = historial
    .map((item) => item.duracion_ms)
    .filter((value) => Number.isInteger(value) && value >= 0);
  const duracionPromedio =
    duraciones.length > 0
      ? Math.round(duraciones.reduce((sum, value) => sum + value, 0) / duraciones.length)
      : 0;

  return {
    total,
    exitosas,
    errores,
    tasa_exito: total > 0 ? Number((exitosas / total).toFixed(2)) : 0,
    duracion_promedio: duracionPromedio,
  };
}

async function ejecutarWorkflowController(req, res, next) {
  try {
    const { cliente_id: clienteId, workflow_id: workflowId } = req.params;

    if (req.cliente_id !== clienteId) {
      return buildForbiddenResponse(res);
    }

    const result = await ejecutarWorkflowService(clienteId, workflowId, req.body || {});

    return res.status(200).json({
      success: true,
      resultado: result.resultado,
      duracion_ms: result.duracion_ms,
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerStatusController(req, res, next) {
  try {
    const { cliente_id: clienteId, workflow_id: workflowId } = req.params;

    if (req.cliente_id !== clienteId) {
      return buildForbiddenResponse(res);
    }

    const automatizaciones = await obtenerAutomatizacionesService(clienteId);
    const workflow = resolveWorkflowRecord(automatizaciones, workflowId);

    if (!workflow) {
      const error = new Error("Automatizacion no encontrada para el cliente indicado.");
      error.statusCode = 404;
      throw error;
    }

    const ultimasEjecuciones = await obtenerHistorialService(workflow.id, 10);
    const estadisticas = buildEstadisticas(ultimasEjecuciones);
    const ultimaEjecucion = ultimasEjecuciones[0] || null;
    const estadoWorkflow =
      ultimaEjecucion && ultimaEjecucion.estado
        ? ultimaEjecucion.estado
        : workflow.estado;

    return res.status(200).json({
      success: true,
      estado_workflow: estadoWorkflow,
      estadisticas,
      ultimas_ejecuciones: ultimasEjecuciones,
    });
  } catch (error) {
    next(error);
  }
}

async function pausarWorkflowController(req, res, next) {
  try {
    const { workflow_id: workflowId } = req.params;

    await pausarAutomatizacionService(workflowId);

    return res.status(200).json({
      success: true,
      mensaje: "Workflow pausado",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  ejecutarWorkflowController,
  obtenerStatusController,
  pausarWorkflowController,
};
