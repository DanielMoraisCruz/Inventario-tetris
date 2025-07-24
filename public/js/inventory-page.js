import { session, loadSession, clearSession, saveSession } from './login.js';
import { cacheDomElements, initInventory, form, searchInput, renderItemList, updateItemList, redrawPlacedItems, createGrid, inventory, getInventoryState } from './inventory.js';
import { handleItemSubmit } from './inventory.js';
import { initDragDrop, registerPanelDragHandlers } from './dragdrop.js';
import { applyLayoutSettings, calcDefaultSize, setInventorySize } from './constants.js';
import { saveInventory } from './storage.js';
import { setupThemeToggle } from './theme.js';

const DEFAULT_SKILLS = [
    'Acrobacia',
    'Armas Brancas',
    'Ataque \u00e0 Dist\u00e2ncia',
    'Atletismo',
    'Briga',
    'Esquiva',
    'Furtividade',
    'Trabalho ()',
    'Prestidigita\u00e7\u00e3o',
    'Sobreviv\u00eancia',
    'Atua\u00e7\u00e3o',
    'Empatia com Animais',
    'Engana\u00e7\u00e3o',
    'Etiqueta',
    'Intimida\u00e7\u00e3o',
    'Lideran\u00e7a',
    'Persuas\u00e3o',
    'Empatia',
    'Resist\u00eancia Mental',
    'Hobby ()',
    'Alquimia',
    'Arcanismo',
    'Educa\u00e7\u00e3o',
    'Investiga\u00e7\u00e3o',
    'Medicina',
    'Natureza',
    'Percep\u00e7\u00e3o',
    'Crafting',
    'Religi\u00e3o',
    'Tecnologia'
];

function ensureDefaultSkills() {
    if (!session.userSkills) {
        session.userSkills = {};
    }
    DEFAULT_SKILLS.forEach(n => {
        if (session.userSkills[n] === undefined) {
            session.userSkills[n] = 0;
        }
    });
}

function createSkillRow(name) {
    const list = document.getElementById('skill-list');
    const div = document.createElement('div');
    div.className = 'skill';
    div.dataset.skill = name;

    const label = document.createElement('span');
    label.className = 'skill-name';
    label.textContent = name;

    const controls = document.createElement('div');
    controls.className = 'controls';

    const dec = document.createElement('button');
    dec.className = 'btn dec';
    dec.textContent = '-';

    const val = document.createElement('span');
    val.className = 'value';
    val.textContent = String(session.userSkills[name] || 0);

    const inc = document.createElement('button');
    inc.className = 'btn inc';
    inc.textContent = '+';

    inc.addEventListener('click', () => {
        let v = session.userSkills[name] || 0;
        v++;
        session.userSkills[name] = v;
        val.textContent = String(v);
        saveSession();
    });

    dec.addEventListener('click', () => {
        let v = session.userSkills[name] || 0;
        if (v > 0) {
            v--;
            session.userSkills[name] = v;
            val.textContent = String(v);
            saveSession();
        }
    });

    controls.append(dec, val, inc);
    div.append(label, controls);

    if (!DEFAULT_SKILLS.includes(name) && session.isMaster) {
        const remove = document.createElement('button');
        remove.className = 'btn remove';
        remove.textContent = '✕';
        remove.addEventListener('click', () => {
            delete session.userSkills[name];
            saveSession();
            div.remove();
        });
        div.appendChild(remove);
    }

    list.appendChild(div);
}

function renderSkills() {
    ensureDefaultSkills();
    const list = document.getElementById('skill-list');
    list.innerHTML = '';
    Object.keys(session.userSkills).forEach(name => {
        createSkillRow(name);
    });
}

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
    const DEFAULT_WIDTH = 260;
    const savedWidth = localStorage.getItem('items-width');
    if (savedWidth) {
        const w = parseInt(savedWidth, 10);
        root.style.setProperty('--items-width', `${w}px`);
        root.style.setProperty('--preview-scale', (w / DEFAULT_WIDTH).toString());
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

    renderSkills();
    const addSkillBtn = document.getElementById('add-skill');
    if (addSkillBtn) {
        if (!session.isMaster) {
            addSkillBtn.style.display = 'none';
        } else {
            addSkillBtn.addEventListener('click', () => {
                const name = prompt('Nome da nova perícia:');
                if (!name) return;
                if (session.userSkills[name] === undefined) {
                    session.userSkills[name] = 0;
                    saveSession();
                    renderSkills();
                }
            });
        }
    }

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
        localStorage.removeItem('tetris-inventory');
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
            root.style.setProperty('--preview-scale', (newWidth / DEFAULT_WIDTH).toString());
        };

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            const finalWidth = parseInt(getComputedStyle(itemsPanel).width, 10);
            localStorage.setItem('items-width', finalWidth);
            root.style.setProperty('--preview-scale', (finalWidth / DEFAULT_WIDTH).toString());
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
