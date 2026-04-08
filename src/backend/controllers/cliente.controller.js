"use strict";

const {
  crearClienteService,
  obtenerClienteService,
} = require("../services/cliente.service");

async function onboardingController(req, res, next) {
  try {
    const { nombre_empresa, email, telefono, plan, credenciales } = req.body || {};
    const result = await crearClienteService({
      nombre_empresa,
      email,
      telefono,
      plan,
      credenciales,
    });

    res.status(201).json({
      success: true,
      cliente_id: result.cliente_id,
      token: result.token,
      setup_inicial: result.setup_inicial,
      mantenimiento_mensual: result.mantenimiento_mensual,
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerClienteController(req, res, next) {
  try {
    const { cliente_id: clienteId } = req.params;

    if (req.cliente_id !== clienteId) {
      return res.status(403).json({
        success: false,
        error: "No autorizado para acceder a este cliente.",
      });
    }

    const cliente = await obtenerClienteService(clienteId);

    return res.status(200).json({
      success: true,
      cliente,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  onboardingController,
  obtenerClienteController,
};
