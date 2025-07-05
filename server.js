const express = require('express');
const path = require('path');
let helmet;
try {
  helmet = require('helmet');
} catch (e) {
  console.warn('Helmet module not found. Continuing without it.');
}
const { body, validationResult } = require('express-validator');
const { ensureUsersFile, loadUsers } = require('./server/storage');
const {
  registerUser,
  authenticateUser,
  resetPassword
} = require('./server/auth');

const app = express();

app.use(express.json());
if (helmet) {
  app.use(helmet());
}
app.use(express.static(path.join(__dirname, 'public')));

ensureUsersFile();

app.post(
  '/register',
  [
    body('username').trim().notEmpty().withMessage('Nome de usu\u00e1rio \u00e9 obrigat\u00f3rio.'),
    body('password').notEmpty().withMessage('Senha \u00e9 obrigat\u00f3ria.'),
    body('pergunta').optional().isString(),
    body('resposta').optional().isString()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, password, pergunta, resposta } = req.body;
    const result = registerUser(username, password, pergunta, resposta);
  if (!result.created) {
    if (result.code === 'exists') {
      return res.status(409).json({ error: 'Nome de usu\u00e1rio j\u00e1 est\u00e1 em uso.' });
    }
    return res.status(500).json({ error: 'Erro ao salvar dados do usu\u00e1rio.' });
  }
  res.status(201).json({ message: 'Usu\u00e1rio registrado com sucesso!' });
});

app.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Nome de usu\u00e1rio \u00e9 obrigat\u00f3rio.'),
    body('password').notEmpty().withMessage('Senha \u00e9 obrigat\u00f3ria.')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;
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

app.post(
  '/reset-password',
  [
    body('username').trim().notEmpty().withMessage('Nome de usu\u00e1rio \u00e9 obrigat\u00f3rio.'),
    body('resposta').notEmpty().withMessage('Resposta \u00e9 obrigat\u00f3ria.'),
    body('novaSenha').notEmpty().withMessage('Nova senha \u00e9 obrigat\u00f3ria.')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, resposta, novaSenha } = req.body;
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

// Return only the secret question for a specific user
app.get('/question/:username', (req, res) => {
  const { username } = req.params;
  const users = loadUsers();
  const user = users[username];
  if (!user || !user.pergunta) {
    return res.status(404).json({ error: 'Usuário não encontrado ou sem pergunta secreta.' });
  }
  res.json({ pergunta: user.pergunta });
});

// List all users (only for development/testing)
app.get('/users', (req, res) => {
  const users = loadUsers();
  const user = users[username];
  if (!user || !user.pergunta) {
    return res.status(404).json({ error: 'Usu\u00e1rio n\u00e3o encontrado ou sem pergunta secreta.' });
  }
  res.json({ pergunta: user.pergunta });
});

// List all users - optional and protected
if (process.env.ENABLE_USERS_ROUTE === 'true') {
  const basicMasterAuth = (req, res, next) => {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Basic ')) {
      res.set('WWW-Authenticate', 'Basic');
      return res.status(401).send('Authentication required');
    }
    const decoded = Buffer.from(auth.split(' ')[1], 'base64').toString('utf8');
    const [user, pass] = decoded.split(':');
    const result = authenticateUser(user, pass);
    if (!result.ok || !result.userData.isMaster) {
      return res.status(403).send('Forbidden');
    }
    next();
  };

  app.get('/users', basicMasterAuth, (req, res) => {
    const users = loadUsers();
    res.json(users);
  });
}

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
