import { setupLogin } from './login.js';
import { initInventory, form } from './inventory.js';
import { handleItemSubmit } from './inventory.js';
import { initDragDrop, registerPanelDragHandlers } from './dragdrop.js';

window.addEventListener('DOMContentLoaded', () => {
    setupLogin();
    initInventory();
    registerPanelDragHandlers();
    initDragDrop();
    form.addEventListener('submit', handleItemSubmit);
});
