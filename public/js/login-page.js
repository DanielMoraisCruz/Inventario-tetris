import { session, registerUser, validateLogin, setPerguntaSecreta, validarPerguntaSecreta, redefinirSenha } from './login.js';

function getUsers() {
    return JSON.parse(localStorage.getItem('tetris-users') || '{}');
}

window.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginUser = document.getElementById('login-user');
    const loginPass = document.getElementById('login-pass');
    const loginErr = document.getElementById('login-err');
    const forgotBtn = document.getElementById('forgot-pass');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = loginUser.value.trim();
        const pass = loginPass.value;
        loginErr.textContent = '';
        if (!user) {
            loginErr.textContent = 'Digite seu nome!';
            return;
        }
        const users = getUsers();
        if (!users[user]) {
            const isFirst = Object.keys(users).length === 0;
            const pergunta = prompt('Pergunta de segurança:');
            if (!pergunta) {
                loginErr.textContent = 'Pergunta obrigatória para registro';
                return;
            }
            const resposta = prompt('Resposta para a pergunta:');
            if (!resposta) {
                loginErr.textContent = 'Resposta obrigatória para registro';
                return;
            }
            await registerUser(user, pass, isFirst, pergunta, resposta);
        }
        const ok = await validateLogin(user, pass);
        if (!ok) {
            loginErr.textContent = 'Senha incorreta!';
            return;
        }
        const current = getUsers()[user];
        session.userName = user;
        session.isMaster = !!current.isMaster;
        localStorage.setItem('session', JSON.stringify(session));
        if (!current.pergunta) {
            const pergunta = prompt('Cadastre uma pergunta secreta para recuperar sua senha:');
            if (pergunta) {
                const resposta = prompt('Resposta:');
                if (resposta) {
                    await setPerguntaSecreta(user, pergunta, resposta);
                    alert('Pergunta secreta cadastrada!');
                }
            }
        }
        window.location.href = 'inventory.html';
    });

    forgotBtn.addEventListener('click', async () => {
        const user = prompt('Nome de usuário:');
        if (!user) return;
        const data = getUsers()[user];
        if (!data || !data.pergunta) {
            alert('Usuário não encontrado ou sem pergunta cadastrada');
            return;
        }
        const resposta = prompt(data.pergunta);
        if (!resposta) return;
        const ok = await validarPerguntaSecreta(user, resposta);
        if (!ok) {
            alert('Resposta incorreta');
            return;
        }
        const nova = prompt('Digite a nova senha:');
        if (!nova) return;
        await redefinirSenha(user, nova);
        alert('Senha redefinida com sucesso!');
    });

    const saved = localStorage.getItem('session');
    if (saved) {
        window.location.href = 'inventory.html';
    }
});
