import { saveInventory, loadInventory } from './storage.js';
import { session } from './login.js';
import { ROWS, COLS } from './constants.js';

export const inventory = document.getElementById('inventory');
export const itemList = document.getElementById('item-list');
export const form = document.getElementById('item-form');
export const itemsPanel = document.getElementById('items');
export const searchInput = document.getElementById('item-search');

let itemsData = [];

let placedItems = [];

export function getInventoryState() {
    return { itemsData, placedItems };
}

export function setInventoryState(data) {
    itemsData = data.itemsData;
    placedItems = data.placedItems;
}

export async function initInventory() {
    createGrid();
    const loaded = await loadInventory();
    itemsData = loaded.itemsData;
    placedItems = loaded.placedItems;
    updateItemList();
    redrawPlacedItems();
}

function createGrid() {
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.x = x;
            cell.dataset.y = y;
            inventory.appendChild(cell);
        }
    }
}

export function updateItemList() {
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    itemList.innerHTML = '';
    itemsData
        .filter(it => it.nome.toLowerCase().includes(query))
        .forEach((item, idx) => {
            const el = document.createElement('div');
            el.classList.add('item');
            el.draggable = true;
            el.dataset.idx = idx;
            el.dataset.width = item.width;
            el.dataset.height = item.height;
            el.dataset.id = item.id;
            el.style.setProperty('--w', item.width);
            el.style.setProperty('--h', item.height);
            el.style.setProperty('--color', item.color);

            const preview = document.createElement('div');
            preview.className = 'item-preview';
            if (item.rotacionado) {
                preview.classList.add('rotacionado');
            }
            if (item.img) {
                const img = document.createElement('img');
                img.src = item.img;
                img.alt = item.nome;
                preview.appendChild(img);
            }
            el.appendChild(preview);

            const stress = document.createElement('div');
            stress.className = 'item-stress';
            const cur = item.estresseAtual ?? 0;
            const max = item.maxEstresse ?? 3;
            stress.textContent = `${cur} / ${max}`;
            preview.appendChild(stress);

            if (cur >= max) {
                preview.classList.add('broken');
                if (item.img) {
                    preview.querySelector('img').style.opacity = '0.3';
                }
            }

            const nameSpan = document.createElement('span');
            nameSpan.className = 'item-name';
            nameSpan.textContent = item.nome;
            el.appendChild(nameSpan);

            itemList.appendChild(el);
        });
    saveInventory(itemsData, placedItems);
    document.dispatchEvent(new Event('itemListUpdated'));
}

export function getItemFormData() {
    const nome = document.getElementById('nome').value.trim();
    const width = parseInt(document.getElementById('largura').value);
    const height = parseInt(document.getElementById('altura').value);
    const imgInput = document.getElementById('imagem');
    const color = document.getElementById('cor').value || '#2b8a3e';
    if (!nome || width < 1 || height < 1 || width > COLS || height > ROWS) return null;
    return { nome, width, height, imgInput, color };
}

export function addNewItem(data) {
    itemsData.push({
        id: generateId(),
        nome: data.nome,
        width: data.width,
        height: data.height,
        img: data.img,
        color: data.color,
        maxEstresse: 3,
        estresseAtual: 0
    });
    updateItemList();
    saveInventory(itemsData, placedItems);
}

export function removeItemFromPanel(itemId) {
    itemsData = itemsData.filter(item => item.id !== itemId);
    updateItemList();
    saveInventory(itemsData, placedItems);
}

export function returnItemToPanel(item) {
    itemsData.push({
        id: item.id,
        nome: item.nome,
        width: item.originalWidth ?? item.width,
        height: item.originalHeight ?? item.height,
        img: item.img || null,
        color: item.color,
        maxEstresse: item.maxEstresse ?? 3,
        estresseAtual: item.estresseAtual ?? 0
    });
    updateItemList();
    saveInventory(itemsData, placedItems);
}

export function readImageFile(input) {
    return new Promise(resolve => {
        if (!input.files || !input.files[0]) {
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = ev => resolve(ev.target.result);
        reader.readAsDataURL(input.files[0]);
    });
}

export async function handleItemSubmit(e) {
    e.preventDefault();
    if (!session.isMaster) {
        alert("Só o mestre pode criar itens.");
        return;
    }
    const data = getItemFormData();
    if (!data) return;
    data.img = await readImageFile(data.imgInput);
    addNewItem(data);
    form.reset();
}

export function redrawPlacedItems() {
    Array.from(inventory.children).forEach(resetCell);
    placedItems.forEach(item => {
        placeItem(item.x, item.y, item.width, item.height, item, true);
    });
}

export function clearGridSelection() {
    document.querySelectorAll('.cell.selected').forEach(cell => cell.classList.remove('selected'));
}

export function removeItemFromGrid(itemId, isDeleteKey = false) {
    const placed = placedItems.find(item => item.id === itemId);
    if (!placed) return;
    clearCells(placed.x, placed.y, placed.width, placed.height);
    placedItems = placedItems.filter(item => item.id !== itemId);

    if (!isDeleteKey) {
        returnItemToPanel(placed);
    }
    saveInventory(itemsData, placedItems);
}

export function clearCells(x, y, w, h) {
    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            const index = (y + dy) * COLS + (x + dx);
            const cell = inventory.children[index];
            if (cell) resetCell(cell);
        }
    }
}

export function canPlace(x, y, w, h) {
    if (x + w > COLS || y + h > ROWS) return false;
    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            const index = (y + dy) * COLS + (x + dx);
            const cell = inventory.children[index];
            if (cell.classList.contains('placed')) return false;
        }
    }
    return true;
}

export function placeItem(x, y, w, h, item, fromRedraw = false) {
    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            const index = (y + dy) * COLS + (x + dx);
            const cell = inventory.children[index];
            cell.classList.add('placed');
            cell.dataset.itemid = item.id;
            cell.title = item.nome || '';
            if (!item.img) {
                const broken = (item.estresseAtual ?? 0) >= (item.maxEstresse ?? 3);
                cell.style.background = broken ? 'transparent' : item.color;
                cell.style.border = `2px solid ${broken ? '#ccc' : item.color}`;
                if (dx > 0) cell.style.borderLeft = '0';
                if (dy > 0) cell.style.borderTop = '0';
                if (dx < w - 1) cell.style.borderRight = '0';
                if (dy < h - 1) cell.style.borderBottom = '0';
            } else {
                cell.style.backgroundColor = 'transparent';
                if (dx === 0 && dy === 0) {
                    removeGridImage(cell);
                }
            }
        }
    }
    if (item.img) {
        const cell0 = inventory.children[y * COLS + x];
        cell0.classList.add('has-img');
        const wrapper = createItemImageElement({ ...item, rotacionado: fromRedraw ? item.rotacionado : item.rotacionado }, w, h);
        removeGridImage(cell0);
        cell0.appendChild(wrapper);
        const broken = (item.estresseAtual ?? 0) >= (item.maxEstresse ?? 3);
        if (broken) {
            const imgEl = wrapper.querySelector('.grid-item-img');
            if (imgEl) {
                imgEl.style.opacity = '0.3';
                imgEl.style.border = '2px solid #ccc';
            }
        }
    } else {
        const cell0 = inventory.children[y * COLS + x];
        removeGridImage(cell0);
        const stressEl = createStressElement(item, w);
        removeStressDisplay(cell0);
        cell0.appendChild(stressEl);
    }

    if (!fromRedraw) {
        placedItems.push({
            id: item.id,
            nome: item.nome,
            x, y,
            width: w,
            height: h,
            rotacionado: item.rotacionado,
            img: item.img || null,
            color: item.color,
            originalWidth: item.originalWidth ?? (item.rotacionado ? item.height : item.width),
            originalHeight: item.originalHeight ?? (item.rotacionado ? item.width : item.height),
            maxEstresse: item.maxEstresse ?? 3,
            estresseAtual: item.estresseAtual ?? 0
        });
        saveInventory(itemsData, placedItems);
    }
}

export function createItemImageElement(item, width, height, isGhost = false) {
    const wrapper = document.createElement('div');
    wrapper.className = 'grid-item-wrapper';
    wrapper.classList.add(`w${width}`, `h${height}`);
    if (item.rotacionado) {
        wrapper.classList.add('rotacionado');
    }

    const img = document.createElement('img');
    img.src = item.img;
    img.alt = item.nome;
    img.className = 'grid-item-img';
    img.style.border = `2px solid ${item.color}`;
    img.style.backgroundColor = 'transparent';
    wrapper.appendChild(img);

    if (!isGhost) {
        const stress = createStressElement(item, width);
        wrapper.appendChild(stress);
    }
    return wrapper;
}

export function createStressElement(item, width) {
    const div = document.createElement('div');
    div.className = 'stress-display';
    div.textContent = `${item.estresseAtual ?? 0} / ${item.maxEstresse ?? 3}`;
    // only width is needed; height would create a dark overlay over the item
    // leading to a "shadow" effect. We want a small bar at the bottom.
    div.classList.add(`w${width}`);
    return div;
}

export function removeStressDisplay(cell) {
    const el = cell.querySelector('.stress-display');
    if (el) el.remove();
}

export function removeGridImage(cell) {
    const wrapper = cell.querySelector('.grid-item-wrapper');
    if (wrapper) wrapper.remove();
    const legacyImg = cell.querySelector('.grid-item-img');
    if (legacyImg && !legacyImg.closest('.grid-item-wrapper')) {
        legacyImg.remove();
    }
}

export function resetCell(cell) {
    cell.classList.remove('placed', 'selected');
    delete cell.dataset.itemid;
    cell.title = '';
    cell.style.border = '';
    cell.style.borderLeft = '';
    cell.style.borderTop = '';
    cell.style.borderRight = '';
    cell.style.borderBottom = '';
    cell.style.background = '';
    removeGridImage(cell);
    removeStressDisplay(cell);
}

export function hideGhostElement(ghost) {
    ghost.style.display = 'none';
    ghost.innerHTML = '';
}

export function updateStressDisplay(item) {
    const cell0 = inventory.children[item.y * COLS + item.x];
    if (!cell0) return;
    const el = cell0.querySelector('.stress-display');
    if (el) el.textContent = `${item.estresseAtual ?? 0} / ${item.maxEstresse ?? 3}`;
    const broken = (item.estresseAtual ?? 0) >= (item.maxEstresse ?? 3);
    if (item.img) {
        const img = cell0.querySelector('.grid-item-img');
        if (img) {
            img.style.opacity = broken ? '0.3' : '1';
            img.style.border = broken ? '2px solid #ccc' : `2px solid ${item.color}`;
        }
    } else {
        clearCells(item.x, item.y, item.width, item.height);
        placeItem(item.x, item.y, item.width, item.height, item, true);
    }
}

export function adjustItemStress(itemId, delta) {
    const item = placedItems.find(it => it.id === itemId);
    if (!item) return;
    item.estresseAtual = Math.max(0, Math.min(item.maxEstresse ?? 3, item.estresseAtual + delta));
    updateStressDisplay(item);
    saveInventory(itemsData, placedItems);
}

export function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}
