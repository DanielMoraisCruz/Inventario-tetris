import { placeItem, returnItemToPanel, removeItemFromPanel, updateItemList } from './inventory.js';

export function finalizeMouseDrop(e, params) {
    const { inventory, lastGhostPos, draggedItem, draggedFromGrid, currentPreviewSize, previewRotation, previousPlacement, hideGhost, removePreview } = params;
    const invRect = inventory.getBoundingClientRect();
    const outOfGrid = (
        e.clientX < invRect.left ||
        e.clientY < invRect.top ||
        e.clientX > invRect.right ||
        e.clientY > invRect.bottom
    );

    if (outOfGrid && draggedItem && draggedFromGrid) {
        returnItemToPanel(draggedItem);
    } else if (lastGhostPos.x !== null && lastGhostPos.y !== null && draggedItem) {
        if (lastGhostPos.valid) {
            placeItem(lastGhostPos.x, lastGhostPos.y, currentPreviewSize.width, currentPreviewSize.height, { ...draggedItem, rotacionado: previewRotation });
        } else if (draggedFromGrid) {
            placeItem(previousPlacement.x, previousPlacement.y, previousPlacement.width, previousPlacement.height, previousPlacement);
        }
    }

    removePreview();
    hideGhost();
}

export function handlePanelDrop(draggedItem, lastGhostPos, currentPreviewSize, previewRotation, removePreview, hideGhost) {
    if (!draggedItem) return;
    if (lastGhostPos.x !== null && lastGhostPos.y !== null && lastGhostPos.valid) {
        removeItemFromPanel(draggedItem.id);
        placeItem(lastGhostPos.x, lastGhostPos.y, currentPreviewSize.width, currentPreviewSize.height, { ...draggedItem, rotacionado: previewRotation });
    }
    removePreview();
    hideGhost();
    updateItemList();
}
