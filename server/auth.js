const crypto = require('crypto');
const { loadUsers, saveUsers } = require('./storage');

function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function registerUser(username, password) {
  const users = loadUsers();
  if (users[username]) return false;
  users[username] = { hash: hash(password) };
  saveUsers(users);
  return true;
}

function verifyUser(username, password) {
  const users = loadUsers();
  const user = users[username];
  if (!user) return false;
  return user.hash === hash(password);
}

module.exports = { registerUser, verifyUser, hash };
