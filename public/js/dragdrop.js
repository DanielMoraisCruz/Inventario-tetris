import { inventory, itemList, clearGridSelection, removeItemFromGrid, clearCells, getInventoryState, setInventoryState, updateItemList, adjustItemStress } from './inventory.js';
import { saveInventory } from './storage.js';
import { session } from './login.js';
import { currentMenu, hideContextMenu } from './context-menu.js';
import { COLS } from './constants.js';
import { initGhost, snapGhostToGrid, showGhostOnGrid, removePreview, hideGhost, setPreviewSize, setPreviewRotation, getLastGhostPos, getCurrentPreviewSize, getPreviewRotation } from './ghost-preview.js';
import { finalizeMouseDrop, handlePanelDrop } from './placement.js';
import { showPanelContextMenu, handleInventoryContextMenu } from './context-handlers.js';

let draggedItem = null;
let draggedFromGrid = false;
let previousPlacement = null;
let selectedItemId = null;
let deleteBtn = null; // legacy, kept for backward compatibility
let panelDeleteBtn = null;

// Reaplica handlers sempre que a lista de itens é atualizada
document.addEventListener('itemListUpdated', registerPanelDragHandlers);

let panelHandlersRegistered = false;

export function registerPanelDragHandlers() {
    if (panelHandlersRegistered) return;
    panelHandlersRegistered = true;

    itemList.addEventListener('dragstart', e => {
        const el = e.target.closest('.item');
        if (!el) return;
        const idx = parseInt(el.dataset.idx, 10);
        const { itemsData } = getInventoryState();
        const item = itemsData[idx];
        hidePanelDeleteButton();
        draggedItem = { ...item, source: 'panel' };
        setPreviewRotation(false);
        setPreviewSize(item.width, item.height);
        setTimeout(() => el.style.opacity = 0.5, 0);
        try { e.dataTransfer.setData('text/plain', item.id); } catch {}
        snapGhostToGrid(e.pageX, e.pageY, draggedItem);
    });

    itemList.addEventListener('dragend', e => {
        const el = e.target.closest('.item');
        if (!el) return;
        draggedItem = null;
        el.style.opacity = 1;
        removePreview();
        hideGhost();
        hidePanelDeleteButton();
    });

    itemList.addEventListener('contextmenu', e => {
        const el = e.target.closest('.item');
        if (!el || !session.isMaster) return;
        e.preventDefault();
        const idx = parseInt(el.dataset.idx, 10);
        const { itemsData } = getInventoryState();
        const item = itemsData[idx];
        showPanelContextMenu(item, e);
    });
}

export function initDragDrop() {
    initGhost(document.getElementById('drag-ghost'));
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
    if (!draggedItem) {
        if (session.isMaster && selectedItemId) {
            if (e.key === '+' || e.key === '=' || e.key === 'Add' || e.key === 'NumpadAdd') {
                e.preventDefault();
                adjustItemStress(selectedItemId, 1);
                return;
            }
            if (e.key === '-' || e.key === '_' || e.key === 'Subtract' || e.key === 'NumpadSubtract') {
                e.preventDefault();
                adjustItemStress(selectedItemId, -1);
                return;
            }
        }
        return;
    }
    if (e.key.toLowerCase() === 'r') {
        const rotation = !getPreviewRotation();
        setPreviewRotation(rotation);
        const size = {
            width: rotation ? draggedItem.height : draggedItem.width,
            height: rotation ? draggedItem.width : draggedItem.height
        };
        setPreviewSize(size.width, size.height);
        const pos = getLastGhostPos();
        if (pos.x !== null && pos.y !== null) {
            showGhostOnGrid(pos.x, pos.y, draggedItem);
        }
    }
}

function onInventoryClick(e) {
    hidePanelDeleteButton();
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
    hidePanelDeleteButton();
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
    setPreviewRotation(placed.rotacionado);
    setPreviewSize(placed.width, placed.height);
    previousPlacement = { ...placed };

    clearCells(placed.x, placed.y, placed.width, placed.height);
    state.placedItems = state.placedItems.filter(item => item.id !== itemId);
    setInventoryState(state);
    saveInventory(state.itemsData, state.placedItems);

    snapGhostToGrid(e.pageX, e.pageY, draggedItem);

    document.addEventListener('mousemove', snapGhostToGridMouseMove);
    document.addEventListener('mouseup', mouseupDrop);
}

function snapGhostToGridMouseMove(e) {
    snapGhostToGrid(e.pageX, e.pageY, draggedItem);
}


function mouseupDrop(e) {
    finalizeMouseDrop(e, {
        inventory,
        lastGhostPos: getLastGhostPos(),
        draggedItem,
        draggedFromGrid,
        currentPreviewSize: getCurrentPreviewSize(),
        previewRotation: getPreviewRotation(),
        previousPlacement,
        hideGhost,
        removePreview
    });
    draggedItem = null;
    draggedFromGrid = false;
    document.removeEventListener('mousemove', snapGhostToGridMouseMove);
    document.removeEventListener('mouseup', mouseupDrop);
}

function onDragOver(e) {
    e.preventDefault();
    if (!draggedItem) return;
    snapGhostToGrid(e.clientX, e.clientY, draggedItem);
}

function onDragLeave() {
    removePreview();
    hideGhost();
}

function onDrop(e) {
    e.preventDefault();
    if (!draggedItem) return;
    if (draggedFromGrid) return;
    handlePanelDrop(draggedItem, getLastGhostPos(), getCurrentPreviewSize(), getPreviewRotation(), removePreview, hideGhost);
    draggedItem = null;
    updateItemList();
}


function hideDeleteButton() {
    if (deleteBtn) {
        deleteBtn.remove();
        deleteBtn = null;
    }
    hideContextMenu();
}

function hidePanelDeleteButton() {
    if (panelDeleteBtn) {
        panelDeleteBtn.remove();
        panelDeleteBtn = null;
    }
    hideContextMenu();
}

function onDocumentClick(e) {
    if (deleteBtn && !deleteBtn.contains(e.target)) {
        hideDeleteButton();
    }
    if (panelDeleteBtn && !panelDeleteBtn.contains(e.target)) {
        hidePanelDeleteButton();
    }
    if (currentMenu && !currentMenu.contains(e.target)) {
        hideContextMenu();
    }
}
function onInventoryContextMenu(e) {
    handleInventoryContextMenu(e);
}


