import {
    getInventoryState,
    removeItemFromGrid,
    removeItemFromPanel,
    adjustItemStress,
    returnItemToPanel,
    placeItem,
    inventory,
    itemList
} from './inventory.js';
const BODY_IMG_SRC = '/img/body.png';
const parts = [
    { id: 'head', name: 'Cabeça' },
    { id: 'right-arm', name: 'Braço Direito' },
    { id: 'left-arm', name: 'Braço Esquerdo' },
    { id: 'torso', name: 'Torso' },
    { id: 'right-leg', name: 'Perna Direita' },
    { id: 'left-leg', name: 'Perna Esquerda' }
];

let draggedSlot = null;

function colorFor(current, max) {
    const colors = ['#2b8a3e', '#f1c40f', '#fd7e14', '#c92a2a'];
    if (!max) return colors[0];
    const ratio = current / max;
    if (ratio < 0.25) return colors[0];
    if (ratio < 0.5) return colors[1];
    if (ratio < 0.75) return colors[2];
    return colors[3];
}

window.addEventListener('DOMContentLoaded', () => {
    const bodyImg = document.getElementById('body-img');
    if (bodyImg) bodyImg.src = BODY_IMG_SRC;
    const rollBtn = document.getElementById('roll-body');
    parts.forEach(p => {
        const el = document.getElementById(p.id);
        if (!el) return;
        const span = el.querySelector('.stress-val');
        const plus = el.querySelector('.stress-plus');
        const minus = el.querySelector('.stress-minus');
        const space = el.querySelector('.equip-space');

        const updateSlotDisplay = (id) => {
            if (!id) {
                span.textContent = '0/0';
                el.style.backgroundColor = colorFor(0, 0);
                space.draggable = false;
                return;
            }
            const state = getInventoryState();
            const item = state.itemsData.find(it => it.id === id) ||
                state.placedItems.find(it => it.id === id) ||
                space._itemData;
            if (!item) {
                span.textContent = '0/0';
                el.style.backgroundColor = colorFor(0, 0);
                space.draggable = false;
                return;
            }
            span.textContent = `${item.estresseAtual}/${item.maxEstresse}`;
            el.style.backgroundColor = colorFor(item.estresseAtual, item.maxEstresse);
            space.draggable = true;
        };

        if (plus) plus.addEventListener('click', () => {
            const id = space.dataset.itemId;
            if (id) adjustItemStress(id, 1);
            updateSlotDisplay(id);
        });

        if (minus) minus.addEventListener('click', () => {
            const id = space.dataset.itemId;
            if (id) adjustItemStress(id, -1);
            updateSlotDisplay(id);
        });

        updateSlotDisplay(space.dataset.itemId);

        space.addEventListener('dragover', e => {
            e.preventDefault();
        });
        space.addEventListener('dragstart', e => {
            if (!space.dataset.itemId) {
                e.preventDefault();
                return;
            }
            draggedSlot = { el: space, update: updateSlotDisplay, span };
            try { e.dataTransfer.setData('text/plain', space.dataset.itemId); } catch {}
        });
        space.addEventListener('dragend', () => {
            draggedSlot = null;
        });
        space.addEventListener('drop', e => {
            e.preventDefault();
            const itemId = e.dataTransfer.getData('text/plain');
            if (!itemId) return;
            const state = getInventoryState();
            let item = state.itemsData.find(it => it.id === itemId);
            if (item) {
                removeItemFromPanel(item.id);
            } else {
                item = state.placedItems.find(it => it.id === itemId);
                if (item) {
                    removeItemFromGrid(item.id, true);
                }
            }
            if (!item) return;
            space.innerHTML = '';
            if (item.img) {
                const img = document.createElement('img');
                img.src = item.img;
                img.alt = item.nome;
                img.className = 'equipped-img';
                space.appendChild(img);
            } else {
                space.textContent = item.nome;
            }
            space.dataset.itemId = item.id;
            space._itemData = { ...item };
            updateSlotDisplay(item.id);
        });
    });

    if (inventory) {
        inventory.addEventListener('dragover', e => {
            if (draggedSlot) e.preventDefault();
        });
        inventory.addEventListener('drop', e => {
            if (!draggedSlot) return;
            e.preventDefault();
            const cell = e.target.closest('.cell');
            if (!cell) return;
            const x = parseInt(cell.dataset.x, 10);
            const y = parseInt(cell.dataset.y, 10);
            const item = draggedSlot.el._itemData;
            if (!item) return;
            placeItem(x, y, item.width, item.height, item);
            draggedSlot.el.innerHTML = 'Espaço para item';
            delete draggedSlot.el.dataset.itemId;
            delete draggedSlot.el._itemData;
            draggedSlot.update(null);
            draggedSlot = null;
        });
    }

    if (itemList) {
        itemList.addEventListener('dragover', e => {
            if (draggedSlot) e.preventDefault();
        });
        itemList.addEventListener('drop', e => {
            if (!draggedSlot) return;
            e.preventDefault();
            const item = draggedSlot.el._itemData;
            if (!item) return;
            returnItemToPanel(item);
            draggedSlot.el.innerHTML = 'Espaço para item';
            delete draggedSlot.el.dataset.itemId;
            delete draggedSlot.el._itemData;
            draggedSlot.update(null);
            draggedSlot = null;
        });
    }

    if (rollBtn) {
        rollBtn.addEventListener('click', () => {
            const choice = parts[Math.floor(Math.random() * parts.length)];
            alert(`Parte sorteada: ${choice.name}`);
        });
    }
});

