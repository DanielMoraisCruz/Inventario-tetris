export const session = { isMaster: false, userName: '' };

export function loadSession() {
    const saved = localStorage.getItem('session');
    if (!saved) return false;
    try {
        const data = JSON.parse(saved);
        session.userName = data.userName || '';
        session.isMaster = !!data.isMaster;
        return true;
    } catch {
        return false;
    }
}

export function saveSession() {
    localStorage.setItem('session', JSON.stringify(session));
}

export function clearSession() {
    session.userName = '';
    session.isMaster = false;
    localStorage.removeItem('session');
}
