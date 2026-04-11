"use strict";

// Importamos las funciones internas exponiéndolas a través del módulo público
// Las funciones readPort, readNodeEnv, etc. no se exportan directamente,
// así que testeamos getServerConfig y validateEnvironmentConfig.
// Para los readers individuales usamos getServerConfig con process.env.

const {
  getServerConfig,
  validateEnvironmentConfig,
} = require("../config/server-config");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function withEnv(vars, fn) {
  const backup = {};
  const keysToDelete = [];

  for (const [k, v] of Object.entries(vars)) {
    if (k in process.env) {
      backup[k] = process.env[k];
    } else {
      keysToDelete.push(k);
    }
    process.env[k] = v;
  }

  try {
    return fn();
  } finally {
    for (const k of keysToDelete) {
      delete process.env[k];
    }
    for (const [k, v] of Object.entries(backup)) {
      process.env[k] = v;
    }
  }
}

// ─── getServerConfig ──────────────────────────────────────────────────────────

describe("getServerConfig - PORT", () => {
  test("usa el puerto 3000 por defecto si PORT no está definido", () => {
    const backup = process.env.PORT;
    delete process.env.PORT;
    try {
      expect(getServerConfig().port).toBe(3000);
    } finally {
      if (backup !== undefined) process.env.PORT = backup;
    }
  });

  test("parsea un PORT numérico válido", () => {
    withEnv({ PORT: "8080" }, () => {
      expect(getServerConfig().port).toBe(8080);
    });
  });

  test("acepta puerto en el límite inferior (1)", () => {
    withEnv({ PORT: "1" }, () => {
      expect(getServerConfig().port).toBe(1);
    });
  });

  test("acepta puerto en el límite superior (65535)", () => {
    withEnv({ PORT: "65535" }, () => {
      expect(getServerConfig().port).toBe(65535);
    });
  });

  test("lanza Error si PORT es 0", () => {
    withEnv({ PORT: "0" }, () => {
      expect(() => getServerConfig()).toThrow(/PORT/);
    });
  });

  test("lanza Error si PORT excede 65535", () => {
    withEnv({ PORT: "65536" }, () => {
      expect(() => getServerConfig()).toThrow(/PORT/);
    });
  });

  test("lanza Error si PORT es una cadena no numérica", () => {
    withEnv({ PORT: "abc" }, () => {
      expect(() => getServerConfig()).toThrow(/PORT/);
    });
  });
});

describe("getServerConfig - NODE_ENV", () => {
  test("usa 'development' por defecto si NODE_ENV no está definido", () => {
    const backup = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    try {
      const config = withEnv({ PORT: "3000" }, () => getServerConfig());
      expect(config.nodeEnv).toBe("development");
    } finally {
      if (backup !== undefined) process.env.NODE_ENV = backup;
    }
  });

  test.each(["development", "staging", "production", "test"])(
    'acepta NODE_ENV válido "%s"',
    (env) => {
      withEnv({ NODE_ENV: env }, () => {
        expect(getServerConfig().nodeEnv).toBe(env);
      });
    },
  );

  test("lanza Error si NODE_ENV es desconocido", () => {
    withEnv({ NODE_ENV: "preprod" }, () => {
      expect(() => getServerConfig()).toThrow(/NODE_ENV/);
    });
  });
});

describe("getServerConfig - BASE_API_PATH", () => {
  test("usa '/api' por defecto", () => {
    const backup = process.env.BASE_API_PATH;
    delete process.env.BASE_API_PATH;
    try {
      expect(getServerConfig().baseApiPath).toBe("/api");
    } finally {
      if (backup !== undefined) process.env.BASE_API_PATH = backup;
    }
  });

  test("acepta una ruta válida que empieza por '/'", () => {
    withEnv({ BASE_API_PATH: "/v2/api" }, () => {
      expect(getServerConfig().baseApiPath).toBe("/v2/api");
    });
  });

  test("lanza Error si la ruta no empieza por '/'", () => {
    withEnv({ BASE_API_PATH: "api" }, () => {
      expect(() => getServerConfig()).toThrow(/BASE_API_PATH/);
    });
  });

  test("lanza Error si la ruta termina con '/' y no es solo '/'", () => {
    withEnv({ BASE_API_PATH: "/api/" }, () => {
      expect(() => getServerConfig()).toThrow(/BASE_API_PATH/);
    });
  });

  test("acepta '/' como ruta raíz", () => {
    withEnv({ BASE_API_PATH: "/" }, () => {
      expect(getServerConfig().baseApiPath).toBe("/");
    });
  });
});

describe("getServerConfig - CORS_ALLOWED_ORIGINS", () => {
  test("retorna array vacío si CORS_ALLOWED_ORIGINS no está definido", () => {
    const backup = process.env.CORS_ALLOWED_ORIGINS;
    delete process.env.CORS_ALLOWED_ORIGINS;
    try {
      expect(getServerConfig().corsAllowedOrigins).toEqual([]);
    } finally {
      if (backup !== undefined) process.env.CORS_ALLOWED_ORIGINS = backup;
    }
  });

  test("parsea una URL válida", () => {
    withEnv({ CORS_ALLOWED_ORIGINS: "https://miapp.com" }, () => {
      expect(getServerConfig().corsAllowedOrigins).toEqual(["https://miapp.com"]);
    });
  });

  test("parsea múltiples URLs separadas por coma", () => {
    withEnv(
      { CORS_ALLOWED_ORIGINS: "https://a.com,http://b.local:3000" },
      () => {
        expect(getServerConfig().corsAllowedOrigins).toEqual([
          "https://a.com",
          "http://b.local:3000",
        ]);
      },
    );
  });

  test("lanza Error si alguna URL no es válida", () => {
    withEnv({ CORS_ALLOWED_ORIGINS: "https://valida.com,no-es-url" }, () => {
      expect(() => getServerConfig()).toThrow(/CORS_ALLOWED_ORIGINS/);
    });
  });
});

// ─── validateEnvironmentConfig ────────────────────────────────────────────────

describe("validateEnvironmentConfig", () => {
  const configValida = {
    port: 3000,
    nodeEnv: "development",
    baseApiPath: "/api",
    corsAllowedOrigins: [],
  };

  test("es válida con config correcta en entorno development", () => {
    const { isValid, errors } = validateEnvironmentConfig(configValida);
    expect(isValid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  test("genera error si port no es entero", () => {
    const { isValid, errors } = validateEnvironmentConfig({
      ...configValida,
      port: "3000",
    });
    expect(isValid).toBe(false);
    expect(errors.some((e) => e.includes("PORT"))).toBe(true);
  });

  test("genera error si nodeEnv es inválido", () => {
    const { isValid, errors } = validateEnvironmentConfig({
      ...configValida,
      nodeEnv: "unknown",
    });
    expect(isValid).toBe(false);
    expect(errors.some((e) => e.includes("NODE_ENV"))).toBe(true);
  });

  test("genera error si baseApiPath no empieza por '/'", () => {
    const { isValid, errors } = validateEnvironmentConfig({
      ...configValida,
      baseApiPath: "api",
    });
    expect(isValid).toBe(false);
    expect(errors.some((e) => e.includes("BASE_API_PATH"))).toBe(true);
  });

  test("genera error si corsAllowedOrigins no es array", () => {
    const { isValid, errors } = validateEnvironmentConfig({
      ...configValida,
      corsAllowedOrigins: "https://a.com",
    });
    expect(isValid).toBe(false);
    expect(errors.some((e) => e.includes("CORS"))).toBe(true);
  });

  test("genera error en production si faltan variables de integración", () => {
    const backup = {};
    const keysToDelete = [
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "N8N_WEBHOOK_BASE_URL",
      "JWT_SECRET",
      "ENCRYPTION_KEY",
    ];
    for (const k of keysToDelete) {
      backup[k] = process.env[k];
      delete process.env[k];
    }

    try {
      const { isValid, errors } = validateEnvironmentConfig({
        ...configValida,
        nodeEnv: "production",
      });
      expect(isValid).toBe(false);
      expect(errors.length).toBeGreaterThan(0);
    } finally {
      for (const k of keysToDelete) {
        if (backup[k] !== undefined) process.env[k] = backup[k];
      }
    }
  });

  test("emite warnings (no errores) en development si faltan variables de integración", () => {
    const backup = {};
    const keysToDelete = [
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "N8N_WEBHOOK_BASE_URL",
      "JWT_SECRET",
      "ENCRYPTION_KEY",
    ];
    for (const k of keysToDelete) {
      backup[k] = process.env[k];
      delete process.env[k];
    }

    try {
      const { isValid, errors, warnings } = validateEnvironmentConfig({
        ...configValida,
        nodeEnv: "development",
      });
      expect(isValid).toBe(true);
      expect(errors).toHaveLength(0);
      expect(warnings.length).toBeGreaterThan(0);
    } finally {
      for (const k of keysToDelete) {
        if (backup[k] !== undefined) process.env[k] = backup[k];
      }
    }
  });

  // NOTA: La función comprueba !config en los primeros 4 campos pero accede a
  // config.nodeEnv sin guarda en la lógica de producción (línea ~126).
  // Por tanto lanza TypeError en lugar de retornar isValid:false.
  // Este test documenta el comportamiento actual como referencia para una futura corrección.
  test("lanza TypeError si config es null (bug conocido: falta guarda en acceso a nodeEnv)", () => {
    expect(() => validateEnvironmentConfig(null)).toThrow(TypeError);
  });
});
