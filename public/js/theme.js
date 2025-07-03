function applyTheme(theme) {
    const body = document.body;
    const toggleBtn = document.getElementById('toggle-theme');
    if (!toggleBtn) return;
    if (theme === 'dark') {
        body.classList.add('dark-mode');
        body.classList.remove('light-mode');
        toggleBtn.textContent = '☀️';
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        toggleBtn.textContent = '🌙';
    }
    localStorage.setItem('theme', theme);
}

export function setupThemeToggle() {
    const toggleBtn = document.getElementById('toggle-theme');
    if (!toggleBtn) return;
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    toggleBtn.addEventListener('click', () => {
        const current = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
    });
}

export { applyTheme };
