const bcrypt = require('bcryptjs');
const { loadUsers, saveUsers } = require('./storage');

function hash(text) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(text, salt);
}

function registerUser(username, password, pergunta = '', resposta = '') {
  const users = loadUsers();
  if (users[username]) {
    return { created: false, code: 'exists' };
  }
  const isMaster = Object.keys(users).length === 0;
  const userData = {
    passwordHash: hash(password),
    isMaster
  };
  if (pergunta && resposta) {
    userData.pergunta = pergunta;
    userData.respostaHash = hash(resposta);
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
  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) {
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
  return bcrypt.compareSync(resposta, user.respostaHash);
}

function resetPassword(username, resposta, novaSenha) {
  const users = loadUsers();
  const user = users[username];
  if (!user || !user.respostaHash) {
    return { ok: false, code: 'notfound' };
  }
  if (!bcrypt.compareSync(resposta, user.respostaHash)) {
    return { ok: false, code: 'wronganswer' };
  }
  user.passwordHash = hash(novaSenha);
  try {
    saveUsers(users);
  } catch (e) {
    return { ok: false, code: 'saveError' };
  }
  return { ok: true };
}

module.exports = { registerUser, authenticateUser, verifyUser, verifyResposta, resetPassword };
