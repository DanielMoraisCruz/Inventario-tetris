export const session = { isMaster: false, userName: '', userStats: { forca: 0, inteligencia: 0, determinacao: 0 } };

export function loadSession() {
    const saved = localStorage.getItem('session');
    if (!saved) return false;
    try {
        const data = JSON.parse(saved);
        session.userName = data.userName || '';
        session.isMaster = !!data.isMaster;
        if (data.userStats) {
            session.userStats = {
                forca: parseInt(data.userStats.forca) || 0,
                inteligencia: parseInt(data.userStats.inteligencia) || 0,
                determinacao: parseInt(data.userStats.determinacao) || 0
            };
        }
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
    session.userStats = { forca: 0, inteligencia: 0, determinacao: 0 };
    localStorage.removeItem('session');
}
