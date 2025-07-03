export function setupThemeToggle() {
    const toggleBtn = document.getElementById('toggle-theme');
    if (!toggleBtn) return;
    const current = localStorage.getItem('theme');
    if (current === 'dark') {
        document.body.classList.add('dark-mode');
        toggleBtn.textContent = '☀️';
    } else {
        toggleBtn.textContent = '🌙';
    }
    toggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        toggleBtn.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}
