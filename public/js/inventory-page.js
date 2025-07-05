import { session, loadSession, clearSession } from './login.js';
import { cacheDomElements, initInventory, form, searchInput, updateItemList } from './inventory.js';
import { handleItemSubmit } from './inventory.js';
import { initDragDrop, registerPanelDragHandlers } from './dragdrop.js';
import { applyLayoutSettings } from './constants.js';
import { setupThemeToggle } from './theme.js';

window.addEventListener('DOMContentLoaded', async () => {
    setupThemeToggle();
    cacheDomElements();
    const userWelcome = document.getElementById('user-welcome');
    const logoutBtn = document.getElementById('logout-btn');
    const resetBtn = document.getElementById('reset-btn');
    const itemsPanel = document.getElementById('items');
    const inventoryEl = document.getElementById('inventory');
    const menuBtn = document.getElementById('menu-btn');

    if (!loadSession()) {
        window.location.href = 'login.html';
        return;
    }

    userWelcome.textContent = session.isMaster ? `Olá, ${session.userName} (Mestre)` : `Olá, ${session.userName}`;
    userWelcome.style.display = '';
    logoutBtn.style.display = 'inline-block';
    resetBtn.style.display = 'inline-block';
    itemsPanel.style.display = '';
    inventoryEl.style.display = '';
    form.style.display = session.isMaster ? 'block' : 'none';

    applyLayoutSettings();
    await initInventory();
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            updateItemList();
        });
    }
    initDragDrop();

    form.addEventListener('submit', async (e) => {
        await handleItemSubmit(e);
    });

    logoutBtn.addEventListener('click', () => {
        clearSession();
        window.location.href = 'login.html';
    });

    resetBtn.addEventListener('click', () => {
        if (!confirm('Resetar dados e sair?')) return;
        localStorage.removeItem('tetris-inventory');
        clearSession();
        window.location.href = 'login.html';
    });

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            itemsPanel.classList.toggle('open');
            menuBtn.classList.toggle('open');
        });
    }
});
