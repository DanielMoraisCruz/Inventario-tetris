function applyTheme(theme) {
    const body = document.body;
    const toggleBtn = document.getElementById('toggle-theme');
    if (!toggleBtn) return;
    if (theme === 'dark') {
        body.classList.add('dark-mode', 'dark-theme');
        body.classList.remove('light-mode');
        toggleBtn.textContent = '☀️';
    } else {
        body.classList.remove('dark-mode', 'dark-theme');
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
        const isDark = document.body.classList.contains('dark-theme');
        applyTheme(isDark ? 'light' : 'dark');
    });
}

export { applyTheme };
