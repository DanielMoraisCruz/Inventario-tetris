const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'users.json');

function ensureUsersFile() {
  if (!fs.existsSync(USERS_FILE)) {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify({}), 'utf-8');
    } catch (err) {
      throw err;
    }
  }
}

function loadUsers() {
  ensureUsersFile();
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data || '{}');
  } catch (err) {
    throw err;
  }
}

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
  }
}

module.exports = { USERS_FILE, ensureUsersFile, loadUsers, saveUsers };
