const express = require('express');
const path = require('path');
const { ensureUsersFile, loadUsers } = require('./server/storage');
const { registerUser, authenticateUser, resetPassword } = require('./server/auth');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

ensureUsersFile();

app.post('/register', (req, res) => {
  const { username, password, pergunta, resposta } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Nome de usu\u00e1rio e senha s\u00e3o obrigat\u00f3rios.' });
  }
  const result = registerUser(username, password, pergunta, resposta);
  if (!result.created) {
    if (result.code === 'exists') {
      return res.status(409).json({ error: 'Nome de usu\u00e1rio j\u00e1 est\u00e1 em uso.' });
    }
    return res.status(500).json({ error: 'Erro ao salvar dados do usu\u00e1rio.' });
  }
  res.status(201).json({ message: 'Usu\u00e1rio registrado com sucesso!' });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Nome de usu\u00e1rio e senha s\u00e3o obrigat\u00f3rios.' });
  }
  const result = authenticateUser(username, password);
  if (!result.ok) {
    if (result.code === 'notfound') {
      return res.status(401).json({ error: 'Usu\u00e1rio n\u00e3o encontrado.' });
    }
    return res.status(401).json({ error: 'Senha incorreta.' });
  }
  res.json({
    message: 'Login realizado com sucesso!',
    user: username,
    isMaster: result.userData.isMaster
  });
});

app.post('/reset-password', (req, res) => {
  const { username, resposta, novaSenha } = req.body;
  if (!username || !resposta || !novaSenha) {
    return res.status(400).json({ error: 'Nome de usu\u00e1rio, resposta e nova senha s\u00e3o obrigat\u00f3rios.' });
  }
  const result = resetPassword(username, resposta, novaSenha);
  if (!result.ok) {
    if (result.code === 'notfound') {
      return res.status(404).json({ error: 'Usu\u00e1rio n\u00e3o encontrado ou sem pergunta secreta.' });
    }
    if (result.code === 'wronganswer') {
      return res.status(401).json({ error: 'Resposta secreta incorreta.' });
    }
    return res.status(500).json({ error: 'Erro ao salvar nova senha.' });
  }
  res.json({ message: 'Senha redefinida com sucesso!' });
});

// List all users (only for development/testing)
app.get('/users', (req, res) => {
  const users = loadUsers();
  res.json(users);
});

app.get('/master-hash', (req, res) => {
  const hash = process.env.MASTER_PASSWORD_HASH || '';
  res.json({ hash });
});

const PORT = process.env.PORT || 3000;

// O servidor escuta em '0.0.0.0', permitindo conexões externas (VPN, LAN etc.)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`🌐 Acesse pela rede VPN usando: http://26.219.159.252:${PORT}`);
});