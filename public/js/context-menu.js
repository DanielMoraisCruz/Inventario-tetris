export let currentMenu = null;

export function hideContextMenu() {
    if (currentMenu) {
        currentMenu.remove();
        currentMenu = null;
    }
}

export function showContextMenu(options, x, y) {
    hideContextMenu();
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    options.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'context-option';
        item.textContent = opt.label;
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            hideContextMenu();
            opt.action();
        });
        menu.appendChild(item);
    });
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    document.body.appendChild(menu);
    currentMenu = menu;
}

document.addEventListener('click', (e) => {
    if (currentMenu && !currentMenu.contains(e.target)) {
        hideContextMenu();
    }
});

export function openEditModal(item, onSave) {
    hideContextMenu();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal panel';
    modal.innerHTML = `
        <form class="edit-form">
            <h3>Editar Item</h3>
            <label>Nome</label>
            <input type="text" id="edit-name" value="${item.nome}">
            <label>Cor</label>
            <input type="color" id="edit-color" value="${item.color}">
            <label>Estresse Atual</label>
            <input type="number" id="edit-stress" min="0" value="${item.estresseAtual ?? 0}">
            <label>Estresse Máximo</label>
            <input type="number" id="edit-max" min="1" value="${item.maxEstresse ?? 3}">
            <label>Largura</label>
            <input type="number" id="edit-width" min="1" value="${item.width}">
            <label>Altura</label>
            <input type="number" id="edit-height" min="1" value="${item.height}">
            <div class="modal-actions">
                <button type="submit" class="btn">Salvar</button>
                <button type="button" class="btn" id="edit-cancel">Cancelar</button>
            </div>
        </form>`;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function close() {
        overlay.remove();
    }

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
    modal.querySelector('#edit-cancel').addEventListener('click', close);
    modal.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const updated = {
            nome: modal.querySelector('#edit-name').value,
            color: modal.querySelector('#edit-color').value,
            estresseAtual: parseInt(modal.querySelector('#edit-stress').value) || 0,
            maxEstresse: parseInt(modal.querySelector('#edit-max').value) || 1,
            width: parseInt(modal.querySelector('#edit-width').value) || 1,
            height: parseInt(modal.querySelector('#edit-height').value) || 1
        };
        onSave(updated);
        close();
    });
}
