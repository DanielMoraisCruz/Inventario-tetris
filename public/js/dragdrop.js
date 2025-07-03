import { inventory, itemList, clearGridSelection, removeItemFromGrid, clearCells, canPlace, placeItem, createItemImageElement, returnItemToPanel, removeItemFromPanel, getInventoryState, setInventoryState, updateItemList } from './inventory.js';
import { saveInventory } from './storage.js';
import { ROWS, COLS, CELL_GAP, getCellSize } from './constants.js';
import { session } from './login.js';

const dragGhost = document.getElementById('drag-ghost');

let draggedItem = null;
let draggedFromGrid = false;
let previewRotation = false;
let currentPreviewSize = { width: 1, height: 1 };
let previousPlacement = null;
let lastGhostPos = { x: null, y: null, valid: true };
let selectedItemId = null;
let deleteBtn = null;

// Reaplica handlers sempre que a lista de itens é atualizada
document.addEventListener('itemListUpdated', registerPanelDragHandlers);

export function registerPanelDragHandlers() {
    const { itemsData } = getInventoryState();
    itemList.querySelectorAll('.item').forEach(el => {
        const idx = parseInt(el.dataset.idx, 10);
        const item = itemsData[idx];
        el.addEventListener('dragstart', e => {
            hideDeleteButton();
            draggedItem = { ...item, source: 'panel' };
            previewRotation = false;
            currentPreviewSize = { width: item.width, height: item.height };
            setTimeout(() => el.style.opacity = 0.5, 0);
            snapGhostToGrid(e.pageX, e.pageY);
        });
        el.addEventListener('dragend', () => {
            draggedItem = null;
            el.style.opacity = 1;
            removePreview();
            hideGhost();
        });
        el.addEventListener('contextmenu', ev => {
            ev.preventDefault();
            if (!session.isMaster) return;
            const itemId = el.dataset.id;
            if (!itemId) return;

            hideDeleteButton();

            const rect = el.getBoundingClientRect();
            const left = rect.left + window.scrollX + rect.width - 22;
            const top = rect.top + window.scrollY + 2;

            deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'X';
            deleteBtn.style.position = 'absolute';
            deleteBtn.style.left = `${left}px`;
            deleteBtn.style.top = `${top}px`;

            deleteBtn.addEventListener('click', e2 => {
                e2.stopPropagation();
                if (confirm('Tem certeza que deseja remover este item do invent\u00e1rio?')) {
                    removeItemFromPanel(itemId);
                }
                hideDeleteButton();
            });

            document.body.appendChild(deleteBtn);
        });
    });
}

export function initDragDrop() {
    window.addEventListener('keydown', onKeyDown);
    inventory.addEventListener('click', onInventoryClick);
    inventory.addEventListener('mousedown', onInventoryMouseDown);
    inventory.addEventListener('contextmenu', onInventoryContextMenu);
    inventory.addEventListener('dragover', onDragOver);
    inventory.addEventListener('dragleave', onDragLeave);
    inventory.addEventListener('drop', onDrop);
    document.addEventListener('click', onDocumentClick);
}

function onKeyDown(e) {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId) {
        e.preventDefault();
        removeItemFromGrid(selectedItemId, true);
        selectedItemId = null;
        return;
    }
    if (!draggedItem) return;
    if (e.key.toLowerCase() === 'r') {
        previewRotation = !previewRotation;
        currentPreviewSize = {
            width: previewRotation ? draggedItem.height : draggedItem.width,
            height: previewRotation ? draggedItem.width : draggedItem.height
        };
        if (lastGhostPos.x !== null && lastGhostPos.y !== null) {
            showGhostOnGrid(lastGhostPos.x, lastGhostPos.y);
        }
    }
}

function onInventoryClick(e) {
    const cell = e.target.closest('.cell');
    clearGridSelection();
    if (!cell || !cell.classList.contains('placed')) {
        selectedItemId = null;
        return;
    }
    const itemId = cell.dataset.itemid;
    if (!itemId) {
        selectedItemId = null;
        return;
    }
    selectedItemId = itemId;
    const { placedItems } = getInventoryState();
    const placed = placedItems.find(item => item.id === itemId);
    if (placed) {
        for (let dy = 0; dy < placed.height; dy++) {
            for (let dx = 0; dx < placed.width; dx++) {
                const index = (placed.y + dy) * COLS + (placed.x + dx);
                const c = inventory.children[index];
                c.classList.add('selected');
            }
        }
    }
}

function onInventoryMouseDown(e) {
    hideDeleteButton();
    if (e.button !== 0) return;
    const cell = e.target.closest('.cell');
    if (!cell || !cell.classList.contains('placed')) return;
    const itemId = cell.dataset.itemid;
    if (!itemId) return;
    e.preventDefault();

    const state = getInventoryState();
    const placed = state.placedItems.find(item => item.id === itemId);
    if (!placed) return;

    clearGridSelection();
    selectedItemId = null;

    draggedItem = { ...placed, source: 'grid' };
    draggedFromGrid = true;
    previewRotation = placed.rotacionado;
    currentPreviewSize = { width: placed.width, height: placed.height };
    previousPlacement = { ...placed };

    clearCells(placed.x, placed.y, placed.width, placed.height);
    state.placedItems = state.placedItems.filter(item => item.id !== itemId);
    setInventoryState(state);
    saveInventory(state.itemsData, state.placedItems);

    snapGhostToGrid(e.pageX, e.pageY);

    document.addEventListener('mousemove', snapGhostToGridMouseMove);
    document.addEventListener('mouseup', mouseupDrop);
}

function snapGhostToGridMouseMove(e) {
    snapGhostToGrid(e.pageX, e.pageY);
}

function computeGridPosition(pageX, pageY) {
    const invRect = inventory.getBoundingClientRect();
    const relX = pageX - invRect.left;
    const relY = pageY - invRect.top;
    const total = getCellSize() + CELL_GAP;
    let gridX = Math.floor(relX / total);
    let gridY = Math.floor(relY / total);
    if (gridX < 0) gridX = 0;
    if (gridY < 0) gridY = 0;
    if (gridX > COLS - currentPreviewSize.width) gridX = COLS - currentPreviewSize.width;
    if (gridY > ROWS - currentPreviewSize.height) gridY = ROWS - currentPreviewSize.height;
    return { gridX, gridY };
}

function snapGhostToGrid(pageX, pageY) {
    const { gridX, gridY } = computeGridPosition(pageX, pageY);
    lastGhostPos = { x: gridX, y: gridY };
    showGhostOnGrid(gridX, gridY);
}

function showGhostOnGrid(gridX, gridY) {
    const valid = canPlace(gridX, gridY, currentPreviewSize.width, currentPreviewSize.height);
    dragGhost.innerHTML = '';
    const total = getCellSize() + CELL_GAP;
    dragGhost.style.width = (currentPreviewSize.width * total - CELL_GAP - 2) + 'px';
    dragGhost.style.height = (currentPreviewSize.height * total - CELL_GAP - 2) + 'px';
    dragGhost.style.display = 'block';

    dragGhost.className = valid ? '' : 'ghost-invalid';

    for (let i = 0; i < currentPreviewSize.width * currentPreviewSize.height; i++) {
        const cell = document.createElement('div');
        cell.className = 'ghost-cell';
        dragGhost.appendChild(cell);
    }
    if (draggedItem && draggedItem.img) {
        const img = createItemImageElement({ ...draggedItem, rotacionado: previewRotation }, currentPreviewSize.width, currentPreviewSize.height, true);
        dragGhost.appendChild(img);
    }
    const invRect = inventory.getBoundingClientRect();
    dragGhost.style.left = (invRect.left + gridX * total) + 'px';
    dragGhost.style.top = (invRect.top + gridY * total) + 'px';

    removePreview();
    if (valid) {
        for (let dy = 0; dy < currentPreviewSize.height; dy++) {
            for (let dx = 0; dx < currentPreviewSize.width; dx++) {
                const index = (gridY + dy) * COLS + (gridX + dx);
                const c = inventory.children[index];
                if (c) c.classList.add('preview');
            }
        }
    }
    lastGhostPos.valid = valid;
}

function mouseupDrop(e) {
    const invRect = inventory.getBoundingClientRect();
    const outOfGrid = (
        e.clientX < invRect.left ||
        e.clientY < invRect.top ||
        e.clientX > invRect.right ||
        e.clientY > invRect.bottom
    );

    const state = getInventoryState();

    if (outOfGrid && draggedItem) {
        returnItemToPanel(draggedItem);
    } else if (lastGhostPos.x !== null && lastGhostPos.y !== null && draggedItem) {
        if (lastGhostPos.valid) {
            placeItem(lastGhostPos.x, lastGhostPos.y, currentPreviewSize.width, currentPreviewSize.height, { ...draggedItem, rotacionado: previewRotation });
        } else if (draggedFromGrid) {
            placeItem(previousPlacement.x, previousPlacement.y, previousPlacement.width, previousPlacement.height, previousPlacement);
        }
    }
    draggedItem = null;
    draggedFromGrid = false;
    removePreview();
    hideGhost();
    document.removeEventListener('mousemove', snapGhostToGridMouseMove);
    document.removeEventListener('mouseup', mouseupDrop);
    saveInventory(state.itemsData, state.placedItems);
}

function onDragOver(e) {
    e.preventDefault();
    if (!draggedItem) return;
    const { gridX, gridY } = computeGridPosition(e.clientX, e.clientY);
    lastGhostPos = { x: gridX, y: gridY };
    showGhostOnGrid(gridX, gridY);
}

function onDragLeave() {
    removePreview();
    hideGhost();
}

function onDrop(e) {
    e.preventDefault();
    if (!draggedItem) return;
    if (draggedFromGrid) return;
    if (lastGhostPos.x !== null && lastGhostPos.y !== null && lastGhostPos.valid) {
        removeItemFromPanel(draggedItem.id);
        placeItem(lastGhostPos.x, lastGhostPos.y, currentPreviewSize.width, currentPreviewSize.height, { ...draggedItem, rotacionado: previewRotation });
    }
    removePreview();
    hideGhost();
    draggedItem = null;
    const state = getInventoryState();
    saveInventory(state.itemsData, state.placedItems);
    updateItemList();
    registerPanelDragHandlers();
}

function removePreview() {
    document.querySelectorAll('.cell.preview').forEach(c => c.classList.remove('preview'));
}

function hideGhost() {
    dragGhost.style.display = 'none';
    dragGhost.innerHTML = '';
    lastGhostPos = { x: null, y: null, valid: true };
}

function hideDeleteButton() {
    if (deleteBtn) {
        deleteBtn.remove();
        deleteBtn = null;
    }
}

function onDocumentClick(e) {
    if (deleteBtn && !deleteBtn.contains(e.target)) {
        hideDeleteButton();
    }
}

function onInventoryContextMenu(e) {
    e.preventDefault();
    if (!session.isMaster) return;
    const cell = e.target.closest('.cell');
    if (!cell || !cell.classList.contains('placed')) {
        hideDeleteButton();
        return;
    }
    const itemId = cell.dataset.itemid;
    if (!itemId) return;
    const state = getInventoryState();
    const placed = state.placedItems.find(it => it.id === itemId);
    if (!placed) return;

    hideDeleteButton();

    const invRect = inventory.getBoundingClientRect();
    const total = getCellSize() + CELL_GAP;
    const left = invRect.left + window.scrollX + placed.x * total + placed.width * total - CELL_GAP - 22;
    const top = invRect.top + window.scrollY + placed.y * total + 2;

    deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'X';
    deleteBtn.style.position = 'absolute';
    deleteBtn.style.left = `${left}px`;
    deleteBtn.style.top = `${top}px`;

    deleteBtn.addEventListener('click', ev => {
        ev.stopPropagation();
        if (confirm('Tem certeza que deseja remover este item do invent\u00e1rio?')) {
            removeItemFromGrid(itemId, true);
        }
        hideDeleteButton();
    });

    document.body.appendChild(deleteBtn);
}
