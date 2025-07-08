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
    const heading = document.createElement('h3');
    heading.textContent = 'Editar Item';
    modal.appendChild(heading);

    const form = document.createElement('form');
    form.id = 'item-form';
    form.className = 'edit-form';

    function addInput(labelText, type, id, value, min) {
        const label = document.createElement('label');
        label.textContent = labelText;
        form.appendChild(label);

        const input = document.createElement('input');
        input.type = type;
        input.id = id;
        if (min !== undefined) input.min = String(min);
        input.value = value ?? '';
        form.appendChild(input);
        return input;
    }

    addInput('Nome', 'text', 'edit-name', item.nome);
    addInput('Cor', 'color', 'edit-color', item.color);
    addInput('Estresse Atual', 'number', 'edit-stress', item.estresseAtual ?? 0, 0);
    addInput('Estresse Máximo', 'number', 'edit-max', item.maxEstresse ?? 3, 1);
    addInput('Largura', 'number', 'edit-width', item.width, 1);
    addInput('Altura', 'number', 'edit-height', item.height, 1);

    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'btn';
    saveBtn.textContent = 'Salvar';
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn';
    cancelBtn.id = 'edit-cancel';
    cancelBtn.textContent = 'Cancelar';
    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
    form.appendChild(actions);

    modal.appendChild(form);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function close() {
        overlay.remove();
    }

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
    cancelBtn.addEventListener('click', close);
    form.addEventListener('submit', (e) => {
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
