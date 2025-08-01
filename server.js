const express = require('express');
const path = require('path');
const { 
  compressionMiddleware, 
  securityMiddleware, 
  optimizedLogger, 
  optimizedValidation, 
  validators,
  authCacheMiddleware
} = require('./server/middleware/optimization');
const { ensureUsersFile, loadUsers } = require('./server/storage-optimized');
const {
	registerUser,
	authenticateUser,
	resetPassword
} = require('./server/auth-optimized');
const { authRateLimit } = require('./server/rate-limiter');

const app = express();

// Middlewares de otimização
app.use(compressionMiddleware());
app.use(securityMiddleware());
app.use(optimizedLogger);
app.use(express.json());
app.use(authCacheMiddleware()); // Cache específico para autenticação
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar arquivo de usuários de forma assíncrona
(async () => {
  try {
    await ensureUsersFile();
  } catch (err) {
    console.error('Erro ao inicializar arquivo de usuários:', err);
  }
})();

app.post(
  '/register',
  authRateLimit,
  optimizedValidation({
    username: [validators.required, validators.minLength(3), validators.maxLength(20)],
    password: [validators.required, validators.minLength(6)],
    pergunta: [validators.maxLength(200)],
    resposta: [validators.maxLength(200)]
  }),
  async (req, res) => {
    const { username, password, pergunta, resposta } = req.body;
    try {
      const result = await registerUser(username, password, pergunta, resposta);
      if (!result.created) {
        if (result.code === 'exists') {
          return res.status(409).json({ error: 'Nome de usuário já está em uso.' });
        }
        return res.status(500).json({ error: 'Erro ao salvar dados do usuário.' });
      }
      res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (err) {
      console.error('Erro no registro:', err);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

app.post(
  '/login',
  authRateLimit,
  optimizedValidation({
    username: [validators.required],
    password: [validators.required]
  }),
  async (req, res) => {
    const { username, password } = req.body;
    try {
      const result = await authenticateUser(username, password);
      if (!result.ok) {
        if (result.code === 'notfound') {
          return res.status(401).json({ error: 'Usuário não encontrado.' });
        }
        return res.status(401).json({ error: 'Senha incorreta.' });
      }
      res.json({
        message: 'Login realizado com sucesso!',
        user: username,
        isMaster: result.userData.isMaster
      });
    } catch (err) {
      console.error('Erro no login:', err);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

app.post(
  '/reset-password',
  authRateLimit,
  optimizedValidation({
    username: [validators.required],
    resposta: [validators.required],
    novaSenha: [validators.required, validators.minLength(6)]
  }),
  async (req, res) => {
    const { username, resposta, novaSenha } = req.body;
    try {
      const result = await resetPassword(username, resposta, novaSenha);
      if (!result.ok) {
        if (result.code === 'notfound') {
          return res.status(404).json({ error: 'Usuário não encontrado ou sem pergunta secreta.' });
        }
        if (result.code === 'wronganswer') {
          return res.status(401).json({ error: 'Resposta secreta incorreta.' });
        }
        return res.status(500).json({ error: 'Erro ao salvar nova senha.' });
      }
      res.json({ message: 'Senha redefinida com sucesso!' });
    } catch (err) {
      console.error('Erro na redefinição de senha:', err);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Return only the secret question for a specific user
app.get('/question/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const users = await loadUsers();
    const user = users[username];
    if (!user || !user.pergunta) {
      return res.status(404).json({ error: 'Usuário não encontrado ou sem pergunta secreta.' });
    }
    res.json({ pergunta: user.pergunta });
  } catch (err) {
    console.error('Erro ao buscar pergunta:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// List all users - optional and protected
if (process.env.ENABLE_USERS_ROUTE === 'true') {
  const basicMasterAuth = async (req, res, next) => {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Basic ')) {
      res.set('WWW-Authenticate', 'Basic');
      return res.status(401).send('Authentication required');
    }
    const decoded = Buffer.from(auth.split(' ')[1], 'base64').toString('utf8');
    const [user, pass] = decoded.split(':');
    try {
      const result = await authenticateUser(user, pass);
      if (!result.ok || !result.userData.isMaster) {
        return res.status(403).send('Forbidden');
      }
      next();
    } catch (err) {
      console.error('Erro na autenticação master:', err);
      res.status(500).send('Internal Server Error');
    }
  };

  app.get('/users', basicMasterAuth, async (req, res) => {
    try {
      const users = await loadUsers();
      res.json(users);
    } catch (err) {
      console.error('Erro ao listar usuários:', err);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  });
}

app.get('/master-hash', (req, res) => {
	const hash = process.env.MASTER_PASSWORD_HASH || '';
	res.json({ hash });
});

const PORT = process.env.PORT || 3000;
const externalAddress = process.env.EXTERNAL_ADDRESS;

// O servidor escuta em '0.0.0.0', permitindo conexões externas (VPN, LAN etc.)
app.listen(PORT, '0.0.0.0', () => {
	console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
	if (externalAddress) {
		console.log(`🌐 Acesse externamente usando: ${externalAddress}`);
	}
});
