import { session, loadSession, clearSession } from './login.js';
import { cacheDomElements, initInventory, form, searchInput, renderItemList, updateItemList, redrawPlacedItems, createGrid, inventory, getInventoryState } from './inventory.js';
import { handleItemSubmit } from './inventory.js';
import { initDragDrop, registerPanelDragHandlers } from './dragdrop.js';
import { applyLayoutSettings, calcDefaultSize, setInventorySize } from './constants.js';
import { saveInventory } from './storage.js';
import { setupThemeToggle } from './theme.js';

window.addEventListener('DOMContentLoaded', async () => {
    setupThemeToggle();
    cacheDomElements();
    const userWelcome = document.getElementById('user-welcome');
    const logoutBtn = document.getElementById('logout-btn');
    const resetBtn = document.getElementById('reset-btn');
    const itemsPanel = document.getElementById('items');
    const itemsResizer = document.getElementById('items-resizer');
    const inventoryEl = document.getElementById('inventory');
    const menuBtn = document.getElementById('menu-btn');
    const resizePanel = document.getElementById('resize-panel');
    const resizeRows = document.getElementById('resize-rows');
    const resizeCols = document.getElementById('resize-cols');
    const resizeBtn = document.getElementById('resize-btn');
    const root = document.documentElement;
    const savedWidth = localStorage.getItem('items-width');
    if (savedWidth) {
        root.style.setProperty('--items-width', `${savedWidth}px`);
    }

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

    if (session.isMaster) {
        resizePanel.style.display = 'block';
        const savedSize = localStorage.getItem('inventory-size');
        if (savedSize) {
            try {
                const obj = JSON.parse(savedSize);
                if (obj.rows && obj.cols) {
                    setInventorySize(obj.rows, obj.cols);
                    resizeRows.value = obj.rows;
                    resizeCols.value = obj.cols;
                }
            } catch {}
        }
    } else {
        const { rows, cols } = calcDefaultSize(session.userStats);
        setInventorySize(rows, cols);
    }

    applyLayoutSettings();
    await initInventory();
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderItemList();
        });
    }
    initDragDrop();

    if (resizeBtn) {
        resizeBtn.addEventListener('click', () => {
            const r = parseInt(resizeRows.value);
            const c = parseInt(resizeCols.value);
            if (!Number.isFinite(r) || !Number.isFinite(c)) return;
            if (r < 3 || r > 20 || c < 3 || c > 20) {
                alert('Valores fora do limite.');
                return;
            }
            setInventorySize(r, c);
            inventory.innerHTML = '';
            createGrid();
            redrawPlacedItems();
            const state = getInventoryState();
            saveInventory(state.itemsData, state.placedItems);
            localStorage.setItem('inventory-size', JSON.stringify({ rows: r, cols: c }));
        });
    }

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

    if (itemsResizer) {
        let startX = 0;
        let startWidth = 0;

        const onMove = (e) => {
            let newWidth = startWidth + e.clientX - startX;
            newWidth = Math.max(180, Math.min(400, newWidth));
            root.style.setProperty('--items-width', `${newWidth}px`);
        };

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            const finalWidth = parseInt(getComputedStyle(itemsPanel).width, 10);
            localStorage.setItem('items-width', finalWidth);
        };

        itemsResizer.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startWidth = parseInt(getComputedStyle(itemsPanel).width, 10);
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            e.preventDefault();
        });
    }

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            itemsPanel.classList.toggle('open');
            menuBtn.classList.toggle('open');
        });
    }
});
