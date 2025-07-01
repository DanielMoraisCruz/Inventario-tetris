export const session = { isMaster: false, userName: '' };

let masterPasswordHash = null;

async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buf);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getMasterHash() {
    if (masterPasswordHash !== null) return masterPasswordHash;
    try {
        const res = await fetch('/master-hash');
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        masterPasswordHash = data.hash || '';
    } catch (e) {
        console.error('Erro ao obter hash da senha mestre');
        masterPasswordHash = '';
    }
    return masterPasswordHash;
}

export function setupLogin() {
    const loginScreen = document.getElementById('login-screen');
    const loginBtn = document.getElementById('login-btn');
    const loginUser = document.getElementById('login-user');
    const loginPass = document.getElementById('login-pass');
    const loginErr = document.getElementById('login-err');
    const userWelcome = document.getElementById('user-welcome');
    const logoutBtn = document.getElementById('logout-btn');
    const form = document.getElementById('item-form');
    const inventory = document.getElementById('inventory');
    const itemsPanel = document.getElementById('items');

    loginBtn.onclick = async () => {
        const user = loginUser.value.trim();
        const pass = loginPass.value;
        if (!user) {
            loginErr.textContent = "Digite seu nome!";
            return;
        }
        const hashed = await sha256(pass);
        const masterHash = await getMasterHash();
        if (hashed === masterHash) {
            session.isMaster = true;
            session.userName = user;
            localStorage.setItem('session', JSON.stringify(session));
            loginScreen.style.display = 'none';
            form.style.display = 'block';
            userWelcome.textContent = "Olá, " + user + " (Mestre)";
            inventory.style.display = '';
            itemsPanel.style.display = '';
            userWelcome.style.display = '';
            logoutBtn.style.display = 'inline-block';
        } else if (pass === "") {
            session.isMaster = false;
            session.userName = user;
            localStorage.setItem('session', JSON.stringify(session));
            loginScreen.style.display = 'none';
            form.style.display = 'none';
            userWelcome.textContent = "Olá, " + user;
            inventory.style.display = '';
            itemsPanel.style.display = '';
            userWelcome.style.display = '';
            logoutBtn.style.display = 'inline-block';
        } else {
            loginErr.textContent = "Senha incorreta!";
        }
    };

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
                    userWelcome.textContent = "Olá, " + session.userName + " (Mestre)";
                } else {
                    form.style.display = 'none';
                    userWelcome.textContent = "Olá, " + session.userName;
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
