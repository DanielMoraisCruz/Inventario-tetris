import { inventory, createItemImageElement, canPlace } from './inventory.js';
import { ROWS, COLS, CELL_GAP, getCellSize } from './constants.js';

let dragGhost;
let previewRotation = false;
let currentPreviewSize = { width: 1, height: 1 };
let lastGhostPos = { x: null, y: null, valid: true };

export function initGhost(el) {
    dragGhost = el;
}

export function setPreviewSize(width, height) {
    currentPreviewSize = { width, height };
}

export function setPreviewRotation(rot) {
    previewRotation = rot;
}

export function getPreviewRotation() {
    return previewRotation;
}

export function getCurrentPreviewSize() {
    return { ...currentPreviewSize };
}

export function getLastGhostPos() {
    return { ...lastGhostPos };
}

export function computeGridPosition(pageX, pageY) {
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

export function snapGhostToGrid(pageX, pageY, draggedItem) {
    const { gridX, gridY } = computeGridPosition(pageX, pageY);
    lastGhostPos = { x: gridX, y: gridY };
    showGhostOnGrid(gridX, gridY, draggedItem);
}

export function showGhostOnGrid(gridX, gridY, draggedItem) {
    if (!dragGhost) return;
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

export function removePreview() {
    document.querySelectorAll('.cell.preview').forEach(c => c.classList.remove('preview'));
}

export function hideGhost() {
    if (!dragGhost) return;
    dragGhost.style.display = 'none';
    dragGhost.innerHTML = '';
    dragGhost.className = '';
    lastGhostPos = { x: null, y: null, valid: true };
}
