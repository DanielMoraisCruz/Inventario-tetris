const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to retrieve master password hash
app.get('/master-hash', (req, res) => {
  const hash = process.env.MASTER_PASSWORD_HASH || '';
  res.json({ hash });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
