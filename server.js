const express = require('express');
const path = require('path');
const { ensureUsersFile } = require('./server/storage');
const { registerUser, verifyUser } = require('./server/auth');

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
    return res.status(400).json({ error: 'Dados inv\u00e1lidos' });
  }
  const ok = verifyUser(username, password);
  if (!ok) {
    return res.status(401).json({ error: 'Credenciais inv\u00e1lidas' });
  }
  res.json({ success: true });
});

app.get('/master-hash', (req, res) => {
  const hash = process.env.MASTER_PASSWORD_HASH || '';
  res.json({ hash });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
