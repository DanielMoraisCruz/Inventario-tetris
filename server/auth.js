const crypto = require('crypto');
const { loadUsers, saveUsers } = require('./storage');

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function registerUser(username, password, pergunta = '', resposta = '') {
  const users = loadUsers();
  if (users[username]) {
    return { created: false, code: 'exists' };
  }
  const isMaster = Object.keys(users).length === 0;
  const userData = {
    passwordHash: sha256(password),
    isMaster
  };
  if (pergunta && resposta) {
    userData.pergunta = pergunta;
    userData.respostaHash = sha256(resposta);
  }
  users[username] = userData;
  try {
    saveUsers(users);
  } catch (e) {
    return { created: false, code: 'saveError' };
  }
  return { created: true, isMaster };
}

function authenticateUser(username, password) {
  const users = loadUsers();
  const user = users[username];
  if (!user) {
    return { ok: false, code: 'notfound' };
  }
  const candidateHash = sha256(password);
  if (candidateHash !== user.passwordHash) {
    return { ok: false, code: 'wrongpass' };
  }
  return { ok: true, userData: user };
}

function verifyUser(username, password) {
  return authenticateUser(username, password).ok;
}

function verifyResposta(username, resposta) {
  const users = loadUsers();
  const user = users[username];
  if (!user || !user.respostaHash) return false;
  return user.respostaHash === sha256(resposta);
}

function resetPassword(username, resposta, novaSenha) {
  const users = loadUsers();
  const user = users[username];
  if (!user || !user.respostaHash) {
    return { ok: false, code: 'notfound' };
  }
  if (sha256(resposta) !== user.respostaHash) {
    return { ok: false, code: 'wronganswer' };
  }
  user.passwordHash = sha256(novaSenha);
  try {
    saveUsers(users);
  } catch (e) {
    return { ok: false, code: 'saveError' };
  }
  return { ok: true };
}

module.exports = { registerUser, authenticateUser, verifyUser, verifyResposta, resetPassword, sha256 };
