// Configurações centralizadas do projeto
const config = {
  // Configurações do servidor
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    externalAddress: process.env.EXTERNAL_ADDRESS,
    enableUsersRoute: process.env.ENABLE_USERS_ROUTE === 'true',
    masterPasswordHash: process.env.MASTER_PASSWORD_HASH || ''
  },

  // Configurações de segurança
  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxAttempts: 5,
      message: 'Muitas tentativas. Tente novamente em 15 minutos.'
    },
    bcrypt: {
      saltRounds: 10
    },
    session: {
      timeout: 24 * 60 * 60 * 1000 // 24 horas
    }
  },

  // Configurações de armazenamento
  storage: {
    usersFile: process.env.USERS_FILE_PATH || process.env.USERS_FILE || './server/users.json',
    cache: {
      ttl: 5000, // 5 segundos
      enabled: true
    }
  },

  // Configurações do frontend
  frontend: {
    inventory: {
      defaultRows: 10,
      defaultCols: 10,
      maxRows: 20,
      maxCols: 20,
      cellSize: 40,
      cellGap: 2
    },
    items: {
      maxWidth: 10,
      maxHeight: 6,
      defaultColor: '#2b8a3e',
      defaultMaxStress: 3,
      defaultStress: 0
    },
    performance: {
      batchSize: 50,
      debounceDelay: 300,
      throttleDelay: 16,
      virtualListThreshold: 100
    },
    animations: {
      duration: 300,
      easing: 'ease-out'
    }
  },

  // Configurações de desenvolvimento
  development: {
    debug: process.env.NODE_ENV !== 'production',
    logLevel: process.env.LOG_LEVEL || 'info',
    enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING === 'true'
  },

  // Configurações de validação
  validation: {
    username: {
      minLength: 3,
      maxLength: 20,
      pattern: /^[a-zA-Z0-9_-]+$/
    },
    password: {
      minLength: 6,
      maxLength: 100
    },
    itemName: {
      minLength: 1,
      maxLength: 50
    }
  },

  // Configurações de erro
  errors: {
    messages: {
      userExists: 'Nome de usuário já está em uso.',
      userNotFound: 'Usuário não encontrado.',
      wrongPassword: 'Senha incorreta.',
      wrongAnswer: 'Resposta secreta incorreta.',
      saveError: 'Erro ao salvar dados.',
      validationError: 'Dados inválidos.',
      serverError: 'Erro interno do servidor.',
      rateLimitExceeded: 'Muitas tentativas. Tente novamente em 15 minutos.'
    }
  }
};

// Funções helper para acessar configurações
const getConfig = (path) => {
  const keys = path.split('.');
  let value = config;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  
  return value;
};

const setConfig = (path, value) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  let current = config;
  
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
};

// Configurações específicas para diferentes ambientes
const environmentConfigs = {
  development: {
    ...config,
    development: {
      ...config.development,
      debug: true,
      logLevel: 'debug'
    }
  },
  
  production: {
    ...config,
    development: {
      ...config.development,
      debug: false,
      logLevel: 'error'
    },
    security: {
      ...config.security,
      rateLimit: {
        ...config.security.rateLimit,
        maxAttempts: 3
      }
    }
  },
  
  test: {
    ...config,
    development: {
      ...config.development,
      debug: true,
      logLevel: 'warn'
    },
    storage: {
      ...config.storage,
      usersFile: './test-users.json'
    }
  }
};

// Função para carregar configuração baseada no ambiente
const loadEnvironmentConfig = (env = process.env.NODE_ENV || 'development') => {
  const envConfig = environmentConfigs[env];
  if (envConfig) {
    Object.assign(config, envConfig);
  }
  return config;
};

// Exportar configuração padrão
module.exports = {
  config,
  getConfig,
  setConfig,
  environmentConfigs,
  loadEnvironmentConfig
}; 