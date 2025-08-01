/**
 * Sistema de Autenticação Otimizado
 * Melhorias de performance para reduzir tempo de resposta
 */

const bcrypt = require('bcryptjs');
const { loadUsers, saveUsers } = require('./storage-optimized');

// Cache para hashes de senha para evitar recálculos
const passwordHashCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

// Configurações otimizadas do bcrypt
const SALT_ROUNDS = 8; // Reduzido de 10 para 8 (ainda seguro, mas mais rápido)

// Função de hash otimizada com cache
async function hashPassword(password) {
  const cacheKey = `hash_${password}`;
  const cached = passwordHashCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.hash;
  }
  
  // Usar versão assíncrona para não bloquear
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  
  passwordHashCache.set(cacheKey, {
    hash,
    timestamp: Date.now()
  });
  
  return hash;
}

// Função de comparação otimizada
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Limpeza periódica do cache
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of passwordHashCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      passwordHashCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Limpar a cada 5 minutos

async function registerUser(username, password, pergunta = '', resposta = '') {
  const startTime = Date.now();
  
  try {
    const users = await loadUsers();
    
    if (users[username]) {
      return { created: false, code: 'exists' };
    }
    
    const isMaster = Object.keys(users).length === 0;
    
    // Hash da senha de forma assíncrona
    const passwordHash = await hashPassword(password);
    
    const userData = {
      passwordHash,
      isMaster
    };
    
    if (pergunta && resposta) {
      userData.pergunta = pergunta;
      userData.respostaHash = await hashPassword(resposta);
    }
    
    users[username] = userData;
    
    await saveUsers(users);
    
    console.log(`[AUTH] Registro de usuário '${username}' em ${Date.now() - startTime}ms`);
    
    return { created: true, isMaster };
  } catch (error) {
    console.error('[AUTH] Erro no registro:', error);
    return { created: false, code: 'saveError' };
  }
}

async function authenticateUser(username, password) {
  const startTime = Date.now();
  
  try {
    const users = await loadUsers();
    const user = users[username];
    
    if (!user) {
      return { ok: false, code: 'notfound' };
    }
    
    // Comparação assíncrona
    const valid = await comparePassword(password, user.passwordHash);
    
    if (!valid) {
      return { ok: false, code: 'wrongpass' };
    }
    
    console.log(`[AUTH] Login de usuário '${username}' em ${Date.now() - startTime}ms`);
    
    return { ok: true, userData: user };
  } catch (error) {
    console.error('[AUTH] Erro na autenticação:', error);
    return { ok: false, code: 'error' };
  }
}

async function verifyUser(username, password) {
  const result = await authenticateUser(username, password);
  return result.ok;
}

async function verifyResposta(username, resposta) {
  try {
    const users = await loadUsers();
    const user = users[username];
    
    if (!user || !user.respostaHash) {
      return false;
    }
    
    return await comparePassword(resposta, user.respostaHash);
  } catch (error) {
    console.error('[AUTH] Erro na verificação de resposta:', error);
    return false;
  }
}

async function resetPassword(username, resposta, novaSenha) {
  const startTime = Date.now();
  
  try {
    const users = await loadUsers();
    const user = users[username];
    
    if (!user || !user.respostaHash) {
      return { ok: false, code: 'notfound' };
    }
    
    const validAnswer = await comparePassword(resposta, user.respostaHash);
    
    if (!validAnswer) {
      return { ok: false, code: 'wronganswer' };
    }
    
    // Hash da nova senha
    user.passwordHash = await hashPassword(novaSenha);
    
    await saveUsers(users);
    
    console.log(`[AUTH] Reset de senha para '${username}' em ${Date.now() - startTime}ms`);
    
    return { ok: true };
  } catch (error) {
    console.error('[AUTH] Erro no reset de senha:', error);
    return { ok: false, code: 'saveError' };
  }
}

// Função para limpar cache (útil para testes)
function clearPasswordCache() {
  passwordHashCache.clear();
}

module.exports = { 
  registerUser, 
  authenticateUser, 
  verifyUser, 
  verifyResposta, 
  resetPassword,
  clearPasswordCache
}; 