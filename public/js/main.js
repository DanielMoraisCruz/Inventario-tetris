import { setupLogin } from './login.js';
import { initInventory, form } from './inventory.js';
import { handleItemSubmit } from './inventory.js';
import { initDragDrop, registerPanelDragHandlers } from './dragdrop.js';
import { applyLayoutSettings } from './constants.js';

window.addEventListener('DOMContentLoaded', async () => {
    applyLayoutSettings();
    setupLogin();
    await initInventory();
    initDragDrop();
    form.addEventListener('submit', async (e) => {
        await handleItemSubmit(e);
    });
});
