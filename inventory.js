import { saveInventory, loadInventory } from './storage.js';
import { session } from './login.js';
import { ROWS, COLS } from './constants.js';

export const inventory = document.getElementById('inventory');
export const itemList = document.getElementById('item-list');
export const form = document.getElementById('item-form');
export const itemsPanel = document.getElementById('items');

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
    itemList.innerHTML = '';
    itemsData.forEach((item, idx) => {
        const el = document.createElement('div');
        el.classList.add('item');
        el.draggable = true;
        el.dataset.idx = idx;
        el.dataset.width = item.width;
        el.dataset.height = item.height;
        el.style.borderColor = item.color;
        if (item.img) {
            const img = document.createElement('img');
            img.src = item.img;
            img.alt = item.nome;
            img.className = 'item-img';
            el.appendChild(img);
        }
        const span = document.createElement('span');
        span.textContent = `${item.nome} (${item.width}x${item.height})`;
        el.appendChild(span);
        itemList.appendChild(el);
    });
    saveInventory(itemsData, placedItems);
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
        color: data.color
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
        color: item.color
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
                cell.style.background = item.color;
                cell.style.border = `2px solid ${item.color}`;
                if (dx > 0) cell.style.borderLeft = '0';
                if (dy > 0) cell.style.borderTop = '0';
                if (dx < w - 1) cell.style.borderRight = '0';
                if (dy < h - 1) cell.style.borderBottom = '0';
            } else if (dx === 0 && dy === 0) {
                removeGridImage(cell);
            }
        }
    }
    if (item.img) {
        const cell0 = inventory.children[y * COLS + x];
        cell0.classList.add('has-img');
        const img = createItemImageElement({ ...item, rotacionado: fromRedraw ? item.rotacionado : item.rotacionado }, w, h);
        removeGridImage(cell0);
        cell0.appendChild(img);
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
            originalHeight: item.originalHeight ?? (item.rotacionado ? item.width : item.height)
        });
        saveInventory(itemsData, placedItems);
    }
}

export function createItemImageElement(item, width, height, isGhost = false) {
    const img = document.createElement('img');
    img.src = item.img;
    img.alt = item.nome;
    img.className = 'grid-item-img';
    img.style.border = `2px solid ${item.color}`;
    if (!isGhost) {
        img.classList.add(`w${width}`, `h${height}`);
        if (item.rotacionado) {
            img.classList.add('rotacionado');
        }
    } else if (item.rotacionado) {
        img.classList.add('rotacionado');
    }
    return img;
}

export function removeGridImage(cell) {
    const img = cell.querySelector('.grid-item-img');
    if (img) cell.removeChild(img);
    cell.classList.remove('has-img');
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
}

export function hideGhostElement(ghost) {
    ghost.style.display = 'none';
    ghost.innerHTML = '';
}

export function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}
