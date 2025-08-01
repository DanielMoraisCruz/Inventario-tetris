/**
 * Middleware de Otimização para o Servidor
 */

const compression = require('compression');
const helmet = require('helmet');

// Cache simples em memória
const memoryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Cache específico para autenticação
const authCache = new Map();
const AUTH_CACHE_TTL = 2 * 60 * 1000; // 2 minutos

// Middleware de cache
function cacheMiddleware(ttl = CACHE_TTL) {
  return (req, res, next) => {
    const key = `${req.method}:${req.url}`;
    const cached = memoryCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return res.json(cached.data);
    }
    
    // Interceptar res.json para cachear
    const originalJson = res.json;
    res.json = function(data) {
      memoryCache.set(key, {
        data,
        timestamp: Date.now()
      });
      return originalJson.call(this, data);
    };
    
    next();
  };
}

// Middleware de cache para autenticação
function authCacheMiddleware() {
  return (req, res, next) => {
    // Apenas para rotas de autenticação
    if (!['/login', '/register', '/reset-password'].includes(req.path)) {
      return next();
    }
    
    const key = `${req.method}:${req.path}:${JSON.stringify(req.body)}`;
    const cached = authCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < AUTH_CACHE_TTL) {
      return res.json(cached.data);
    }
    
    // Interceptar res.json para cachear
    const originalJson = res.json;
    res.json = function(data) {
      // Não cachear erros de autenticação
      if (res.statusCode === 200 || res.statusCode === 201) {
        authCache.set(key, {
          data,
          timestamp: Date.now()
        });
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
}

// Middleware de compressão
function compressionMiddleware() {
  return compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  });
}

// Middleware de segurança otimizado
function securityMiddleware() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  });
}

// Middleware de limpeza de cache
function cleanupCache() {
  const now = Date.now();
  
  // Limpar cache geral
  for (const [key, value] of memoryCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      memoryCache.delete(key);
    }
  }
  
  // Limpar cache de autenticação
  for (const [key, value] of authCache.entries()) {
    if (now - value.timestamp > AUTH_CACHE_TTL) {
      authCache.delete(key);
    }
  }
}

// Executar limpeza a cada 5 minutos
setInterval(cleanupCache, 5 * 60 * 1000);

// Logger otimizado
function optimizedLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = duration > 1000 ? 'warn' : 'info';
    
    // Log mais detalhado para rotas de autenticação
    if (['/login', '/register', '/reset-password'].includes(req.path)) {
      console[logLevel](`[AUTH] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    } else {
      console[logLevel](`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    }
  });
  
  next();
}

// Middleware de validação otimizada
function optimizedValidation(rules) {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, validators] of Object.entries(rules)) {
      const value = req.body[field];
      
      for (const validator of validators) {
        const result = validator(value, field);
        if (result !== true) {
          errors.push({ field, message: result });
          break; // Parar na primeira validação que falha
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    
    next();
  };
}

// Validadores reutilizáveis
const validators = {
  required: (value, field) => {
    return value !== undefined && value !== null && value !== '' 
      ? true 
      : `${field} é obrigatório`;
  },
  
  minLength: (min) => (value, field) => {
    return String(value).length >= min 
      ? true 
      : `${field} deve ter pelo menos ${min} caracteres`;
  },
  
  maxLength: (max) => (value, field) => {
    return String(value).length <= max 
      ? true 
      : `${field} deve ter no máximo ${max} caracteres`;
  },
  
  pattern: (regex) => (value, field) => {
    return regex.test(value) 
      ? true 
      : `${field} tem formato inválido`;
  },
  
  email: (value, field) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) 
      ? true 
      : `${field} deve ser um email válido`;
  }
};

module.exports = {
  cacheMiddleware,
  authCacheMiddleware,
  compressionMiddleware,
  securityMiddleware,
  optimizedLogger,
  optimizedValidation,
  validators,
  memoryCache,
  authCache
}; 