const fs = require('fs');
const path = require('path');

const USERS_FILE = process.env.USERS_FILE || path.join(__dirname, 'users.json');

function ensureUsersFile() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({}), 'utf-8');
  }
}

function loadUsers() {
  ensureUsersFile();
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data || '{}');
}

function saveUsers(usersObj) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(usersObj, null, 2), 'utf-8');
}

module.exports = { USERS_FILE, ensureUsersFile, loadUsers, saveUsers };
