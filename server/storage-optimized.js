/**
 * Storage Otimizado - Melhorias de performance para operações de arquivo
 */

const fs = require('fs').promises;
const path = require('path');

// Configurações otimizadas
const USERS_FILE = process.env.USERS_FILE_PATH || 
                   process.env.USERS_FILE || 
                   path.join(__dirname, 'users.json');

// Cache em memória otimizado
let usersCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 1000; // 30 segundos (aumentado para reduzir I/O)

// Flag para evitar múltiplas operações simultâneas
let isWriting = false;
let writeQueue = [];

function isCacheValid() {
  return usersCache !== null && (Date.now() - cacheTimestamp) < CACHE_TTL;
}

async function ensureUsersFile() {
  try {
    await fs.access(USERS_FILE);
  } catch (err) {
    try {
      // Criar diretório se não existir
      const dir = path.dirname(USERS_FILE);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(USERS_FILE, JSON.stringify({}), 'utf-8');
    } catch (writeErr) {
      throw writeErr;
    }
  }
}

async function loadUsers() {
  // Verificar se o cache é válido primeiro
  if (isCacheValid()) {
    return usersCache;
  }
  
  const startTime = Date.now();
  
  try {
    await ensureUsersFile();
    
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    usersCache = JSON.parse(data || '{}');
    cacheTimestamp = Date.now();
    
    console.log(`[STORAGE] Carregamento de usuários em ${Date.now() - startTime}ms`);
    
    return usersCache;
  } catch (err) {
    console.error('[STORAGE] Erro ao carregar usuários:', err);
    throw err;
  }
}

// Função de escrita otimizada com fila
async function saveUsers(usersObj) {
  return new Promise((resolve, reject) => {
    writeQueue.push({ usersObj, resolve, reject });
    processWriteQueue();
  });
}

async function processWriteQueue() {
  if (isWriting || writeQueue.length === 0) {
    return;
  }
  
  isWriting = true;
  
  while (writeQueue.length > 0) {
    const { usersObj, resolve, reject } = writeQueue.shift();
    
    try {
      const startTime = Date.now();
      
      // Atualizar cache imediatamente
      usersCache = usersObj;
      cacheTimestamp = Date.now();
      
      const tempFile = `${USERS_FILE}.tmp`;
      const data = JSON.stringify(usersObj, null, 2);
      
      // Escrita atômica
      await fs.writeFile(tempFile, data, 'utf-8');
      await fs.rename(tempFile, USERS_FILE);
      
      console.log(`[STORAGE] Salvamento de usuários em ${Date.now() - startTime}ms`);
      
      resolve();
    } catch (err) {
      console.error('[STORAGE] Erro ao salvar usuários:', err);
      
      // Tentar limpar arquivo temporário
      try {
        const tempFile = `${USERS_FILE}.tmp`;
        await fs.access(tempFile);
        await fs.unlink(tempFile);
      } catch (_) {
        // Ignorar erros de limpeza
      }
      
      reject(err);
    }
  }
  
  isWriting = false;
}

// Função para invalidar cache
function invalidateCache() {
  usersCache = null;
  cacheTimestamp = 0;
}

// Função para obter estatísticas do cache
function getCacheStats() {
  return {
    hasCache: usersCache !== null,
    cacheAge: usersCache ? Date.now() - cacheTimestamp : 0,
    queueLength: writeQueue.length,
    isWriting
  };
}

// Limpeza periódica do cache (opcional)
setInterval(() => {
  if (usersCache && (Date.now() - cacheTimestamp) > CACHE_TTL * 2) {
    console.log('[STORAGE] Limpeza automática do cache');
    invalidateCache();
  }
}, 60 * 1000); // Verificar a cada minuto

module.exports = { 
  USERS_FILE, 
  ensureUsersFile, 
  loadUsers, 
  saveUsers, 
  invalidateCache,
  getCacheStats
}; 