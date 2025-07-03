import { setupThemeToggle } from './theme.js';

window.addEventListener('DOMContentLoaded', () => {
  setupThemeToggle();

  const initialScreen = document.getElementById('initial-screen');
  const loginBox = document.getElementById('login-box');
  const registerBox = document.getElementById('register-box');

  document.getElementById('btn-show-login').onclick = () => {
    initialScreen.style.display = 'none';
    registerBox.style.display = 'none';
    loginBox.style.display = 'block';
  };

  document.getElementById('btn-show-register').onclick = () => {
    initialScreen.style.display = 'none';
    loginBox.style.display = 'none';
    registerBox.style.display = 'block';
  };

  document.getElementById('goto-login').onclick = (e) => {
    e.preventDefault();
    registerBox.style.display = 'none';
    loginBox.style.display = 'block';
  };

  document.getElementById('goto-register').onclick = (e) => {
    e.preventDefault();
    loginBox.style.display = 'none';
    registerBox.style.display = 'block';
  };

  const loginForm = document.getElementById('login-form');
  const loginUser = document.getElementById('login-user');
  const loginPass = document.getElementById('login-pass');
  const loginErr = document.getElementById('login-err');
  const forgotBtn = document.getElementById('forgot-pass');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginErr.textContent = '';
    const username = loginUser.value.trim();
    const password = loginPass.value;
    if (!username || !password) {
      loginErr.textContent = 'Por favor, preencha nome e senha.';
      return;
    }
    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const result = await response.json();
      if (!response.ok) {
        loginErr.textContent = result.error || 'Falha no login.';
        return;
      }
      const sessionData = { userName: username, isMaster: result.isMaster };
      localStorage.setItem('session', JSON.stringify(sessionData));
      window.location.href = 'inventory.html';
    } catch (err) {
      console.error(err);
      loginErr.textContent = 'Erro de rede ao tentar login.';
    }
  });

  const registerForm = document.getElementById('register-form');
  const regUser = document.getElementById('register-user');
  const regPass = document.getElementById('register-pass');
  const regPergunta = document.getElementById('register-question');
  const regResposta = document.getElementById('register-answer');
  const regErr = document.getElementById('register-err');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    regErr.textContent = '';
    const username = regUser.value.trim();
    const password = regPass.value;
    const pergunta = regPergunta.value.trim();
    const resposta = regResposta.value.trim();
    if (!username || !password) {
      regErr.textContent = 'Nome de usuário e senha são obrigatórios!';
      return;
    }
    const payload = { username, password };
    if (pergunta && resposta) {
      payload.pergunta = pergunta;
      payload.resposta = resposta;
    }
    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) {
        regErr.textContent = result.error || 'Erro no cadastro.';
        return;
      }
      alert('✅ Cadastro realizado com sucesso! Faça login para continuar.');
      regUser.value = '';
      regPass.value = '';
      regPergunta.value = '';
      regResposta.value = '';
      registerBox.style.display = 'none';
      loginBox.style.display = 'block';
    } catch (err) {
      console.error(err);
      regErr.textContent = 'Erro de rede ao tentar cadastrar.';
    }
  });

  forgotBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const username = prompt('Nome de usuário:');
    if (!username) return;
    try {
      const res = await fetch('/users');
      const users = await res.json();
      if (!users[username] || !users[username].pergunta) {
        alert('Usuário não encontrado ou sem pergunta secreta cadastrada.');
        return;
      }
      const question = users[username].pergunta;
      const answer = prompt(question);
      if (!answer) return;
      const newPass = prompt('Digite a nova senha:');
      if (!newPass) return;
      const res2 = await fetch('/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, resposta: answer, novaSenha: newPass })
      });
      const result = await res2.json();
      if (!res2.ok) {
        alert(result.error || 'Não foi possível redefinir a senha.');
      } else {
        alert('Senha redefinida com sucesso! Faça login com sua nova senha.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao tentar recuperar senha.');
    }
  });

  const saved = localStorage.getItem('session');
  if (saved) {
    window.location.href = 'inventory.html';
  }
});
