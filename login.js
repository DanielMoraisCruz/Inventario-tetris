export const session = { isMaster: false, userName: '' };

// Utilitarios de hash e armazenamento
export async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getUsers() {
    return JSON.parse(localStorage.getItem('tetris-users') || '{}');
}

function saveUsers(users) {
    localStorage.setItem('tetris-users', JSON.stringify(users));
}

export async function registerUser(userName, password, isMaster = false) {
    const users = getUsers();
    if (users[userName]) return false;
    const hash = await sha256(password);
    users[userName] = { hash, isMaster };
    saveUsers(users);
    return true;
}

export async function validateLogin(userName, password) {
    const users = getUsers();
    if (!users[userName]) return false;
    const hash = await sha256(password);
    return users[userName].hash === hash;
}

export async function setPerguntaSecreta(userName, pergunta, resposta) {
    const users = getUsers();
    if (!users[userName]) return;
    const respostaHash = await sha256(resposta);
    users[userName].pergunta = pergunta;
    users[userName].respostaHash = respostaHash;
    saveUsers(users);
}

export async function validarPerguntaSecreta(userName, respostaDigitada) {
    const users = getUsers();
    if (!users[userName] || !users[userName].respostaHash) return false;
    const respostaHash = await sha256(respostaDigitada);
    return respostaHash === users[userName].respostaHash;
}

export async function redefinirSenha(userName, novaSenha) {
    const users = getUsers();
    if (!users[userName]) return;
    users[userName].hash = await sha256(novaSenha);
    saveUsers(users);
}

// ----- Interface de Login -----
export function setupLogin() {
    const loginScreen = document.getElementById('login-screen');
    const loginBtn = document.getElementById('login-btn');
    const loginUser = document.getElementById('login-user');
    const loginPass = document.getElementById('login-pass');
    const loginErr = document.getElementById('login-err');
    const forgotBtn = document.getElementById('forgot-pass');
    const userWelcome = document.getElementById('user-welcome');
    const logoutBtn = document.getElementById('logout-btn');
    const form = document.getElementById('item-form');
    const inventory = document.getElementById('inventory');
    const itemsPanel = document.getElementById('items');

    loginBtn.onclick = async () => {
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
            await registerUser(user, pass, isFirst);
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
        loginScreen.style.display = 'none';
        if (session.isMaster) {
            form.style.display = 'block';
            userWelcome.textContent = 'Olá, ' + user + ' (Mestre)';
        } else {
            form.style.display = 'none';
            userWelcome.textContent = 'Olá, ' + user;
        }
        inventory.style.display = '';
        itemsPanel.style.display = '';
        userWelcome.style.display = '';
        logoutBtn.style.display = 'inline-block';

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
    };

    forgotBtn.addEventListener('click', async () => {
        const user = prompt('Nome de usuário:');
        if (!user) return;
        const users = getUsers();
        const data = users[user];
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

    window.addEventListener('DOMContentLoaded', function() {
        const saved = localStorage.getItem('session');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                session.userName = data.userName;
                session.isMaster = data.isMaster;
                loginScreen.style.display = 'none';
                if (session.isMaster) {
                    form.style.display = 'block';
                    userWelcome.textContent = 'Olá, ' + session.userName + ' (Mestre)';
                } else {
                    form.style.display = 'none';
                    userWelcome.textContent = 'Olá, ' + session.userName;
                }
                inventory.style.display = '';
                itemsPanel.style.display = '';
                userWelcome.style.display = '';
                logoutBtn.style.display = 'inline-block';
                return;
            } catch (e) {
                console.warn('Sessão inválida');
            }
        }
        form.style.display = 'none';
        loginScreen.style.display = 'flex';
        inventory.style.display = 'none';
        itemsPanel.style.display = 'none';
        userWelcome.style.display = 'none';
        logoutBtn.style.display = 'none';
    });

    logoutBtn.addEventListener('click', () => {
        session.userName = '';
        session.isMaster = false;
        localStorage.removeItem('session');
        loginUser.value = '';
        loginPass.value = '';
        form.style.display = 'none';
        loginScreen.style.display = 'flex';
        inventory.style.display = 'none';
        itemsPanel.style.display = 'none';
        userWelcome.textContent = '';
        userWelcome.style.display = 'none';
        logoutBtn.style.display = 'none';
    });
}
