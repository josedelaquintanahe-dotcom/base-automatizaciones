"use strict";

const {
  getServerConfig,
  validateEnvironmentConfig,
} = require("../config/server-config");

function withEnv(vars, fn) {
  const backup = {};
  const keysToDelete = [];

  for (const [key, value] of Object.entries(vars)) {
    if (key in process.env) {
      backup[key] = process.env[key];
    } else {
      keysToDelete.push(key);
    }

    process.env[key] = value;
  }

  try {
    return fn();
  } finally {
    for (const key of keysToDelete) {
      delete process.env[key];
    }

    for (const [key, value] of Object.entries(backup)) {
      process.env[key] = value;
    }
  }
}

describe("getServerConfig - PORT", () => {
  test("usa el puerto 3000 por defecto si PORT no esta definido", () => {
    const backup = process.env.PORT;
    delete process.env.PORT;

    try {
      expect(getServerConfig().port).toBe(3000);
    } finally {
      if (backup !== undefined) process.env.PORT = backup;
    }
  });

  test("parsea un PORT numerico valido", () => {
    withEnv({ PORT: "8080" }, () => {
      expect(getServerConfig().port).toBe(8080);
    });
  });

  test("acepta puerto en el limite inferior (1)", () => {
    withEnv({ PORT: "1" }, () => {
      expect(getServerConfig().port).toBe(1);
    });
  });

  test("acepta puerto en el limite superior (65535)", () => {
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

  test("lanza Error si PORT es una cadena no numerica", () => {
    withEnv({ PORT: "abc" }, () => {
      expect(() => getServerConfig()).toThrow(/PORT/);
    });
  });
});

describe("getServerConfig - NODE_ENV", () => {
  test("usa development por defecto si NODE_ENV no esta definido", () => {
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
    'acepta NODE_ENV valido "%s"',
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

describe("getServerConfig - HOST", () => {
  test("retorna null por defecto en development si HOST no esta definido", () => {
    const backupHost = process.env.HOST;
    const backupNodeEnv = process.env.NODE_ENV;
    delete process.env.HOST;
    delete process.env.NODE_ENV;

    try {
      expect(getServerConfig().host).toBeNull();
    } finally {
      if (backupHost !== undefined) process.env.HOST = backupHost;
      if (backupNodeEnv !== undefined) process.env.NODE_ENV = backupNodeEnv;
    }
  });

  test("usa 0.0.0.0 por defecto en production si HOST no esta definido", () => {
    const backupHost = process.env.HOST;
    delete process.env.HOST;

    try {
      withEnv({ NODE_ENV: "production" }, () => {
        expect(getServerConfig().host).toBe("0.0.0.0");
      });
    } finally {
      if (backupHost !== undefined) process.env.HOST = backupHost;
    }
  });

  test("acepta HOST explicito", () => {
    withEnv({ NODE_ENV: "production", HOST: "127.0.0.1" }, () => {
      expect(getServerConfig().host).toBe("127.0.0.1");
    });
  });
});

describe("getServerConfig - BASE_API_PATH", () => {
  test("usa /api por defecto", () => {
    const backup = process.env.BASE_API_PATH;
    delete process.env.BASE_API_PATH;

    try {
      expect(getServerConfig().baseApiPath).toBe("/api");
    } finally {
      if (backup !== undefined) process.env.BASE_API_PATH = backup;
    }
  });

  test("acepta una ruta valida que empieza por /", () => {
    withEnv({ BASE_API_PATH: "/v2/api" }, () => {
      expect(getServerConfig().baseApiPath).toBe("/v2/api");
    });
  });

  test("lanza Error si la ruta no empieza por /", () => {
    withEnv({ BASE_API_PATH: "api" }, () => {
      expect(() => getServerConfig()).toThrow(/BASE_API_PATH/);
    });
  });

  test("lanza Error si la ruta termina con / y no es solo /", () => {
    withEnv({ BASE_API_PATH: "/api/" }, () => {
      expect(() => getServerConfig()).toThrow(/BASE_API_PATH/);
    });
  });

  test("acepta / como ruta raiz", () => {
    withEnv({ BASE_API_PATH: "/" }, () => {
      expect(getServerConfig().baseApiPath).toBe("/");
    });
  });
});

describe("getServerConfig - CORS_ALLOWED_ORIGINS", () => {
  test("retorna array vacio si CORS_ALLOWED_ORIGINS no esta definido", () => {
    const backup = process.env.CORS_ALLOWED_ORIGINS;
    delete process.env.CORS_ALLOWED_ORIGINS;

    try {
      expect(getServerConfig().corsAllowedOrigins).toEqual([]);
    } finally {
      if (backup !== undefined) process.env.CORS_ALLOWED_ORIGINS = backup;
    }
  });

  test("parsea una URL valida", () => {
    withEnv({ CORS_ALLOWED_ORIGINS: "https://miapp.com" }, () => {
      expect(getServerConfig().corsAllowedOrigins).toEqual(["https://miapp.com"]);
    });
  });

  test("parsea multiples URLs separadas por coma", () => {
    withEnv({ CORS_ALLOWED_ORIGINS: "https://a.com,http://b.local:3000" }, () => {
      expect(getServerConfig().corsAllowedOrigins).toEqual([
        "https://a.com",
        "http://b.local:3000",
      ]);
    });
  });

  test("lanza Error si alguna URL no es valida", () => {
    withEnv({ CORS_ALLOWED_ORIGINS: "https://valida.com,no-es-url" }, () => {
      expect(() => getServerConfig()).toThrow(/CORS_ALLOWED_ORIGINS/);
    });
  });
});

describe("getServerConfig - ONBOARDING_DISPATCH_WEBHOOK_URL", () => {
  test("retorna null si ONBOARDING_DISPATCH_WEBHOOK_URL no esta definida", () => {
    const backup = process.env.ONBOARDING_DISPATCH_WEBHOOK_URL;
    delete process.env.ONBOARDING_DISPATCH_WEBHOOK_URL;

    try {
      expect(getServerConfig().onboardingDispatchWebhookUrl).toBeNull();
    } finally {
      if (backup !== undefined) process.env.ONBOARDING_DISPATCH_WEBHOOK_URL = backup;
    }
  });

  test("acepta una URL webhook valida", () => {
    withEnv({ ONBOARDING_DISPATCH_WEBHOOK_URL: "https://n8n.example.com/webhook/onboarding" }, () => {
      expect(getServerConfig().onboardingDispatchWebhookUrl).toBe(
        "https://n8n.example.com/webhook/onboarding",
      );
    });
  });

  test("lanza Error si ONBOARDING_DISPATCH_WEBHOOK_URL no es valida", () => {
    withEnv({ ONBOARDING_DISPATCH_WEBHOOK_URL: "no-es-url" }, () => {
      expect(() => getServerConfig()).toThrow(/ONBOARDING_DISPATCH_WEBHOOK_URL/);
    });
  });
});

describe("validateEnvironmentConfig", () => {
  const configValida = {
    port: 3000,
    nodeEnv: "development",
    host: null,
    baseApiPath: "/api",
    corsAllowedOrigins: [],
    onboardingDispatchWebhookUrl: null,
  };

  test("es valida con config correcta en entorno development", () => {
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
    expect(errors.some((error) => error.includes("PORT"))).toBe(true);
  });

  test("genera error si nodeEnv es invalido", () => {
    const { isValid, errors } = validateEnvironmentConfig({
      ...configValida,
      nodeEnv: "unknown",
    });
    expect(isValid).toBe(false);
    expect(errors.some((error) => error.includes("NODE_ENV"))).toBe(true);
  });

  test("genera error si host no es null ni string", () => {
    const { isValid, errors } = validateEnvironmentConfig({
      ...configValida,
      host: 8080,
    });
    expect(isValid).toBe(false);
    expect(errors.some((error) => error.includes("HOST"))).toBe(true);
  });

  test("genera error si baseApiPath no empieza por /", () => {
    const { isValid, errors } = validateEnvironmentConfig({
      ...configValida,
      baseApiPath: "api",
    });
    expect(isValid).toBe(false);
    expect(errors.some((error) => error.includes("BASE_API_PATH"))).toBe(true);
  });

  test("genera error si corsAllowedOrigins no es array", () => {
    const { isValid, errors } = validateEnvironmentConfig({
      ...configValida,
      corsAllowedOrigins: "https://a.com",
    });
    expect(isValid).toBe(false);
    expect(errors.some((error) => error.includes("CORS"))).toBe(true);
  });

  test("genera error en production si faltan variables obligatorias", () => {
    const backup = {};
    const keysToDelete = [
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "N8N_WEBHOOK_BASE_URL",
      "JWT_SECRET",
      "ENCRYPTION_KEY",
      "BACKOFFICE_API_TOKEN",
      "CORS_ALLOWED_ORIGINS",
    ];

    for (const key of keysToDelete) {
      backup[key] = process.env[key];
      delete process.env[key];
    }

    try {
      const { isValid, errors } = validateEnvironmentConfig({
        ...configValida,
        nodeEnv: "production",
        host: "0.0.0.0",
      });
      expect(isValid).toBe(false);
      expect(errors.length).toBeGreaterThan(0);
    } finally {
      for (const key of keysToDelete) {
        if (backup[key] !== undefined) process.env[key] = backup[key];
      }
    }
  });

  test("emite warnings en development si faltan variables de integracion", () => {
    const backup = {};
    const keysToDelete = [
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "N8N_WEBHOOK_BASE_URL",
      "JWT_SECRET",
      "ENCRYPTION_KEY",
    ];

    for (const key of keysToDelete) {
      backup[key] = process.env[key];
      delete process.env[key];
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
      for (const key of keysToDelete) {
        if (backup[key] !== undefined) process.env[key] = backup[key];
      }
    }
  });

  test("es valida en production cuando existen variables requeridas y CORS", () => {
    withEnv(
      {
        NODE_ENV: "production",
        CORS_ALLOWED_ORIGINS: "https://admin.example.com",
        SUPABASE_URL: "https://test.supabase.co",
        SUPABASE_ANON_KEY: "anon-key-test",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key-test",
        N8N_WEBHOOK_BASE_URL: "https://n8n.example.com/webhook",
        JWT_SECRET: "jwt-secret-test",
        ENCRYPTION_KEY: "clave-test-1234567890abcdef",
        BACKOFFICE_API_TOKEN: "backoffice-token-test",
      },
      () => {
        const config = getServerConfig();
        const { isValid, errors } = validateEnvironmentConfig(config);
        expect(isValid).toBe(true);
        expect(errors).toHaveLength(0);
        expect(config.host).toBe("0.0.0.0");
      },
    );
  });

  test("genera error en production si falta CORS_ALLOWED_ORIGINS", () => {
    const backup = process.env.CORS_ALLOWED_ORIGINS;
    delete process.env.CORS_ALLOWED_ORIGINS;

    try {
      withEnv(
        {
          NODE_ENV: "production",
          SUPABASE_URL: "https://test.supabase.co",
          SUPABASE_ANON_KEY: "anon-key-test",
          SUPABASE_SERVICE_ROLE_KEY: "service-role-key-test",
          N8N_WEBHOOK_BASE_URL: "https://n8n.example.com/webhook",
          JWT_SECRET: "jwt-secret-test",
          ENCRYPTION_KEY: "clave-test-1234567890abcdef",
          BACKOFFICE_API_TOKEN: "backoffice-token-test",
        },
        () => {
          const { isValid, errors } = validateEnvironmentConfig(getServerConfig());
          expect(isValid).toBe(false);
          expect(errors.some((error) => error.includes("CORS_ALLOWED_ORIGINS"))).toBe(true);
        },
      );
    } finally {
      if (backup !== undefined) process.env.CORS_ALLOWED_ORIGINS = backup;
    }
  });

  test("lanza TypeError si config es null (bug conocido: falta guarda en acceso a nodeEnv)", () => {
    expect(() => validateEnvironmentConfig(null)).toThrow(TypeError);
  });
});
