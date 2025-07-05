import { session } from './login.js';
import { removeItemFromPanel, updateItemList, readImageFile, getInventoryState, redrawPlacedItems, removeItemFromGrid, placeItem, canPlace } from './inventory.js';
import { saveInventory } from './storage.js';
import { showContextMenu, hideContextMenu, openEditModal } from './context-menu.js';

export function showPanelContextMenu(item, e) {
    const opts = [
        { label: 'Remover', action: () => removeItemFromPanel(item.id) },
        { label: 'Editar', action: () => openEditModal(item, updates => {
                Object.assign(item, updates);
                updateItemList();
                saveInventory(getInventoryState().itemsData, getInventoryState().placedItems);
            }) },
        { label: 'Girar', action: () => {
                const tmpW = item.width;
                item.width = item.height;
                item.height = tmpW;
                item.rotacionado = !item.rotacionado;
                updateItemList();
                saveInventory(getInventoryState().itemsData, getInventoryState().placedItems);
            } },
        { label: 'Add Imagem', action: async () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.addEventListener('change', async () => {
                    const img = await readImageFile(input);
                    if (img) {
                        item.img = img;
                        updateItemList();
                        saveInventory(getInventoryState().itemsData, getInventoryState().placedItems);
                    }
                });
                input.click();
            } },
        { label: 'Remover Imagem', action: () => {
                item.img = null;
                updateItemList();
                saveInventory(getInventoryState().itemsData, getInventoryState().placedItems);
            } },
        { label: 'Deletar', action: () => {
                if (confirm('Tem certeza que deseja excluir este item permanentemente?')) {
                    removeItemFromPanel(item.id);
                }
            } }
    ];
    showContextMenu(opts, e.clientX, e.clientY);
}

export function handleInventoryContextMenu(e) {
    e.preventDefault();
    if (!session.isMaster) return;
    const cell = e.target.closest('.cell');
    if (!cell || !cell.classList.contains('placed')) {
        hideContextMenu();
        return;
    }
    const itemId = cell.dataset.itemid;
    if (!itemId) return;
    const state = getInventoryState();
    const placed = state.placedItems.find(it => it.id === itemId);
    if (!placed) return;
    hideContextMenu();
    const opts = [
        { label: 'Remover', action: () => removeItemFromGrid(itemId, false) },
        { label: 'Editar', action: () => openEditModal(placed, updates => {
                Object.assign(placed, updates);
                redrawPlacedItems();
                saveInventory(getInventoryState().itemsData, getInventoryState().placedItems);
            }) },
        { label: 'Girar', action: () => {
                const tmpW = placed.width;
                const tmpH = placed.height;
                const newItem = { ...placed, width: tmpH, height: tmpW, rotacionado: !placed.rotacionado };
                removeItemFromGrid(itemId, true);
                if (canPlace(placed.x, placed.y, newItem.width, newItem.height)) {
                    placeItem(placed.x, placed.y, newItem.width, newItem.height, newItem);
                } else {
                    placeItem(placed.x, placed.y, placed.width, placed.height, placed);
                    alert('Não há espaço para girar o item.');
                }
            } },
        { label: 'Add Imagem', action: async () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.addEventListener('change', async () => {
                    const img = await readImageFile(input);
                    if (img) {
                        placed.img = img;
                        redrawPlacedItems();
                        saveInventory(getInventoryState().itemsData, getInventoryState().placedItems);
                    }
                });
                input.click();
            } },
        { label: 'Remover Imagem', action: () => {
                placed.img = null;
                redrawPlacedItems();
                saveInventory(getInventoryState().itemsData, getInventoryState().placedItems);
            } },
        { label: 'Deletar', action: () => {
                if (confirm('Tem certeza que deseja excluir este item permanentemente?')) {
                    removeItemFromGrid(itemId, true);
                }
            } }
    ];
    showContextMenu(opts, e.clientX, e.clientY);
}
