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
const { authRateLimit } = require('./server/rate-limiter');

const app = express();

app.use(express.json());
if (helmet) {
	app.use(helmet());
}
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
<<<<<<< Updated upstream
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
=======
  '/register',
  authRateLimit,
  [
    body('username').trim().notEmpty().withMessage('Nome de usuário é obrigatório.'),
    body('password').notEmpty().withMessage('Senha é obrigatória.'),
    body('pergunta').optional().isString(),
    body('resposta').optional().isString()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
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
  [
    body('username').trim().notEmpty().withMessage('Nome de usuário é obrigatório.'),
    body('password').notEmpty().withMessage('Senha é obrigatória.')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
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
  [
    body('username').trim().notEmpty().withMessage('Nome de usuário é obrigatório.'),
    body('resposta').notEmpty().withMessage('Resposta é obrigatória.'),
    body('novaSenha').notEmpty().withMessage('Nova senha é obrigatória.')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
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
>>>>>>> Stashed changes
});

// List all users - optional and protected
if (process.env.ENABLE_USERS_ROUTE === 'true') {
<<<<<<< Updated upstream
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
=======
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
>>>>>>> Stashed changes
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
