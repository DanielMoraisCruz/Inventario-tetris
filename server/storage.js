const fs = require('fs');
const path = require('path');

// Allow overriding the users file location with the USERS_FILE_PATH environment
// variable, falling back to the default path within the server directory.
const DEFAULT_USERS_FILE = path.join(__dirname, 'users.json');
const USERS_FILE = process.env.USERS_FILE_PATH
  ? path.resolve(process.env.USERS_FILE_PATH)
  : DEFAULT_USERS_FILE;

function ensureUsersFile() {
  if (!fs.existsSync(USERS_FILE)) {
    // Create the directory tree if a custom path is provided
    fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
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
