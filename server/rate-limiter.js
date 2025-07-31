// Rate limiter simples para proteger contra ataques de força bruta
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 5; // Máximo de tentativas por janela de tempo

function cleanupOldAttempts() {
  const now = Date.now();
  for (const [key, data] of attempts.entries()) {
    if (now - data.timestamp > WINDOW_MS) {
      attempts.delete(key);
    }
  }
}

function getClientKey(req) {
  // Usar IP do cliente ou username para identificação
  return req.ip || req.connection.remoteAddress || 'unknown';
}

function isRateLimited(req) {
  cleanupOldAttempts();
  
  const key = getClientKey(req);
  const now = Date.now();
  
  if (!attempts.has(key)) {
    attempts.set(key, { count: 1, timestamp: now });
    return false;
  }
  
  const data = attempts.get(key);
  
  // Se passou a janela de tempo, resetar
  if (now - data.timestamp > WINDOW_MS) {
    attempts.set(key, { count: 1, timestamp: now });
    return false;
  }
  
  // Incrementar contador
  data.count++;
  
  return data.count > MAX_ATTEMPTS;
}

function rateLimitMiddleware(req, res, next) {
  if (isRateLimited(req)) {
    return res.status(429).json({
      error: 'Muitas tentativas. Tente novamente em 15 minutos.',
      retryAfter: Math.ceil(WINDOW_MS / 1000)
    });
  }
  
  next();
}

// Middleware específico para rotas de autenticação
function authRateLimit(req, res, next) {
  const key = `${getClientKey(req)}:${req.body.username || 'unknown'}`;
  const now = Date.now();
  
  if (!attempts.has(key)) {
    attempts.set(key, { count: 1, timestamp: now });
    return next();
  }
  
  const data = attempts.get(key);
  
  if (now - data.timestamp > WINDOW_MS) {
    attempts.set(key, { count: 1, timestamp: now });
    return next();
  }
  
  data.count++;
  
  if (data.count > MAX_ATTEMPTS) {
    return res.status(429).json({
      error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      retryAfter: Math.ceil(WINDOW_MS / 1000)
    });
  }
  
  next();
}

module.exports = { rateLimitMiddleware, authRateLimit }; 