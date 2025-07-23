import { getInventoryState, removeItemFromGrid, removeItemFromPanel, adjustItemStress } from './inventory.js';
const BODY_IMG_SRC = '/img/body.png';
const parts = [
    { id: 'head', name: 'Cabeça' },
    { id: 'right-arm', name: 'Braço Direito' },
    { id: 'left-arm', name: 'Braço Esquerdo' },
    { id: 'torso', name: 'Torso' },
    { id: 'right-leg', name: 'Perna Direita' },
    { id: 'left-leg', name: 'Perna Esquerda' }
];

function colorFor(current, max) {
    const colors = ['#2b8a3e', '#f1c40f', '#fd7e14', '#c92a2a'];
    if (!max) return colors[0];
    const idx = Math.min(colors.length - 1, Math.floor((current / max) * colors.length));
    return colors[idx];
}

window.addEventListener('DOMContentLoaded', () => {
    const bodyImg = document.getElementById('body-img');
    if (bodyImg) bodyImg.src = BODY_IMG_SRC;
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
                return;
            }
            const state = getInventoryState();
            const item = state.itemsData.find(it => it.id === id) || state.placedItems.find(it => it.id === id);
            if (!item) {
                span.textContent = '0/0';
                el.style.backgroundColor = colorFor(0, 0);
                return;
            }
            span.textContent = `${item.estresseAtual}/${item.maxEstresse}`;
            el.style.backgroundColor = colorFor(item.estresseAtual, item.maxEstresse);
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
            updateSlotDisplay(item.id);
        });
    });
});
