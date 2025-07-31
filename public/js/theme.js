/**
 * Sistema de gerenciamento de temas
 */

/**
 * Configura o toggle de tema
 */
export function setupThemeToggle() {
    const toggleBtn = document.getElementById('toggle-theme');
    if (!toggleBtn) return;

    // Carregar tema salvo
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.className = savedTheme;
        updateThemeIcon(savedTheme === 'light-mode');
    } else {
        // Tema padrão baseado na preferência do sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const defaultTheme = prefersDark ? 'dark-mode' : 'light-mode';
        document.body.className = defaultTheme;
        updateThemeIcon(defaultTheme === 'light-mode');
    }

    // Event listener para toggle
    toggleBtn.addEventListener('click', () => {
        const isLight = document.body.classList.contains('light-mode');
        const newTheme = isLight ? 'dark-mode' : 'light-mode';
        
        document.body.className = newTheme;
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(!isLight);
    });

    // Listener para mudanças na preferência do sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark-mode' : 'light-mode';
            document.body.className = newTheme;
            updateThemeIcon(newTheme === 'light-mode');
        }
    });
}

/**
 * Atualiza o ícone do botão de tema
 */
function updateThemeIcon(isLight) {
    const toggleBtn = document.getElementById('toggle-theme');
    if (!toggleBtn) return;
    
    toggleBtn.textContent = isLight ? '🌙' : '☀️';
    toggleBtn.title = isLight ? 'Mudar para modo escuro' : 'Mudar para modo claro';
}

/**
 * Obtém o tema atual
 */
export function getCurrentTheme() {
    return document.body.classList.contains('light-mode') ? 'light' : 'dark';
}

/**
 * Define o tema programaticamente
 */
export function setTheme(theme) {
    const newTheme = theme === 'light' ? 'light-mode' : 'dark-mode';
    document.body.className = newTheme;
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(theme === 'light');
}

/**
 * Alterna entre os temas
 */
export function toggleTheme() {
    const isLight = document.body.classList.contains('light-mode');
    setTheme(isLight ? 'dark' : 'light');
}
