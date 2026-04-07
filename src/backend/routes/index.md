# Rutas backend

## Proposito

Este archivo documenta la estructura modular de rutas del backend Express.

## Estructura modular de rutas

Las rutas deben organizarse por dominio o capacidad, evitando archivos unicos con toda la superficie HTTP del backend.

Convencion sugerida:

- un archivo indice para montar rutas base,
- modulos de rutas por dominio,
- versionado cuando sea necesario,
- delegacion inmediata a controladores.

## Convencion de routing

- usar rutas claras y predecibles,
- mantener prefijo comun mediante `BASE_API_PATH`,
- separar rutas internas, operativas e integraciones cuando el sistema crezca,
- no insertar logica de negocio en definiciones de rutas,
- versionar rutas cuando cambien contratos publicos de forma relevante.

## Flujo recomendado

1. la ruta recibe la solicitud
2. aplica middlewares requeridos
3. delega en controlador
4. el controlador llama a servicios
5. la respuesta vuelve estructurada

## Regla

Las rutas deben actuar como capa de ensamblado HTTP. Toda validacion compleja, acceso a datos o integracion externa debe delegarse en otras capas.
