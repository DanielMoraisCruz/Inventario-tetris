const fs = require('fs').promises;
const path = require('path');

// Allow both USERS_FILE_PATH and the legacy USERS_FILE variable
const USERS_FILE =
    process.env.USERS_FILE_PATH ||
    process.env.USERS_FILE ||
    path.join(__dirname, 'users.json');

// Cache em memória para melhor performance
let usersCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5 segundos

<<<<<<< Updated upstream
<<<<<<< Updated upstream
function ensureUsersFile() {
    if (!fs.existsSync(USERS_FILE)) {
        try {
            fs.writeFileSync(USERS_FILE, JSON.stringify({}), 'utf-8');
        } catch (err) {
            throw err;
        }
=======
function isCacheValid() {
  return usersCache !== null && (Date.now() - cacheTimestamp) < CACHE_TTL;
}

async function ensureUsersFile() {
  try {
    await fs.access(USERS_FILE);
=======
function isCacheValid() {
  return usersCache !== null && (Date.now() - cacheTimestamp) < CACHE_TTL;
}

async function ensureUsersFile() {
  try {
    await fs.access(USERS_FILE);
  } catch (err) {
    try {
      await fs.writeFile(USERS_FILE, JSON.stringify({}), 'utf-8');
    } catch (writeErr) {
      throw writeErr;
    }
  }
}

async function loadUsers() {
  await ensureUsersFile();
  
  // Verificar se o cache é válido
  if (isCacheValid()) {
    return usersCache;
  }
  
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    usersCache = JSON.parse(data || '{}');
    cacheTimestamp = Date.now();
    return usersCache;
>>>>>>> Stashed changes
  } catch (err) {
    try {
      await fs.writeFile(USERS_FILE, JSON.stringify({}), 'utf-8');
    } catch (writeErr) {
      throw writeErr;
>>>>>>> Stashed changes
    }
}

<<<<<<< Updated upstream
function loadUsers() {
    ensureUsersFile();
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        return JSON.parse(data || '{}');
    } catch (err) {
        throw err;
    }
}

<<<<<<< Updated upstream
function saveUsers(usersObj) {
    const tempFile = `${USERS_FILE}.tmp`;
    const data = JSON.stringify(usersObj, null, 2);
    try {
        fs.writeFileSync(tempFile, data, 'utf-8');
        fs.renameSync(tempFile, USERS_FILE);
    } catch (err) {
        try {
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
        } catch (_) {
            // ignore cleanup errors
        }
        throw err;
=======
async function loadUsers() {
  await ensureUsersFile();
  
  // Verificar se o cache é válido
  if (isCacheValid()) {
    return usersCache;
  }
  
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    usersCache = JSON.parse(data || '{}');
    cacheTimestamp = Date.now();
    return usersCache;
  } catch (err) {
=======
async function saveUsers(usersObj) {
  const tempFile = `${USERS_FILE}.tmp`;
  const data = JSON.stringify(usersObj, null, 2);
  
  try {
    await fs.writeFile(tempFile, data, 'utf-8');
    await fs.rename(tempFile, USERS_FILE);
    
    // Atualizar cache
    usersCache = usersObj;
    cacheTimestamp = Date.now();
  } catch (err) {
    try {
      await fs.access(tempFile);
      await fs.unlink(tempFile);
    } catch (_) {
      // ignore cleanup errors
    }
>>>>>>> Stashed changes
    throw err;
  }
}

<<<<<<< Updated upstream
async function saveUsers(usersObj) {
  const tempFile = `${USERS_FILE}.tmp`;
  const data = JSON.stringify(usersObj, null, 2);
  
  try {
    await fs.writeFile(tempFile, data, 'utf-8');
    await fs.rename(tempFile, USERS_FILE);
    
    // Atualizar cache
    usersCache = usersObj;
    cacheTimestamp = Date.now();
  } catch (err) {
    try {
      await fs.access(tempFile);
      await fs.unlink(tempFile);
    } catch (_) {
      // ignore cleanup errors
>>>>>>> Stashed changes
    }
}

=======
>>>>>>> Stashed changes
// Função para invalidar cache (útil para testes ou quando necessário)
function invalidateCache() {
  usersCache = null;
  cacheTimestamp = 0;
}

module.exports = { 
  USERS_FILE, 
  ensureUsersFile, 
  loadUsers, 
  saveUsers, 
  invalidateCache 
};
