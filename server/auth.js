const crypto = require('crypto');
const { loadUsers, saveUsers } = require('./storage');

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function hasMaster(users) {
  return Object.values(users).some(u => u.isMaster);
}

function registerUser(username, password, pergunta = '', resposta = '') {
  const users = loadUsers();
  if (users[username]) return false;
  const isMaster = !hasMaster(users);
  const userData = {
    passwordHash: sha256(password),
    isMaster
  };
  if (pergunta && resposta) {
    userData.pergunta = pergunta;
    userData.respostaHash = sha256(resposta);
  }
  users[username] = userData;
  saveUsers(users);
  return true;
}

function verifyUser(username, password) {
  const users = loadUsers();
  const user = users[username];
  if (!user) return false;
  return user.passwordHash === sha256(password);
}

function verifyResposta(username, resposta) {
  const users = loadUsers();
  const user = users[username];
  if (!user || !user.respostaHash) return false;
  return user.respostaHash === sha256(resposta);
}

module.exports = { registerUser, verifyUser, verifyResposta, sha256 };
