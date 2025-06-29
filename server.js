const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const USERS_FILE = path.join(__dirname, 'users.json');

app.use(express.json());
app.use(express.static(__dirname));

function loadUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, '[]', 'utf8');
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to read users.json', e);
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ success: false, message: 'Missing fields' });
  }
  const users = loadUsers();
  if (users.find(u => u.username === username)) {
    return res.json({ success: false, message: 'User already exists' });
  }
  const passwordHash = hashPassword(password);
  users.push({ username, passwordHash });
  saveUsers(users);
  return res.json({ success: true });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ success: false, message: 'Missing fields' });
  }
  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.json({ success: false, message: 'User not found' });
  }
  const hash = hashPassword(password);
  if (hash === user.passwordHash) {
    return res.json({ success: true });
  }
  return res.json({ success: false, message: 'Invalid password' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
