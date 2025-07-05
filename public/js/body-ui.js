import { getInventoryState } from './inventory.js';
const BODY_IMG_SRC = 'data:image/png;base64,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';

const MAX_STRESS = 3;
const parts = [
    { id: 'head', name: 'Cabeça' },
    { id: 'right-arm', name: 'Braço Direito' },
    { id: 'left-arm', name: 'Braço Esquerdo' },
    { id: 'torso', name: 'Torso' },
    { id: 'right-leg', name: 'Perna Direita' },
    { id: 'left-leg', name: 'Perna Esquerda' }
];

function colorFor(value) {
    const colors = ['#2b8a3e', '#f1c40f', '#fd7e14', '#c92a2a'];
    return colors[Math.min(value, colors.length - 1)];
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
        let value = 0;
        const update = () => {
            span.textContent = `${value}/${MAX_STRESS}`;
            el.style.backgroundColor = colorFor(value);
        };
        if (plus) plus.addEventListener('click', () => { if (value < MAX_STRESS) { value++; update(); } });
        if (minus) minus.addEventListener('click', () => { if (value > 0) { value--; update(); } });
        update();

        space.addEventListener('dragover', e => {
            e.preventDefault();
        });
        space.addEventListener('drop', e => {
            e.preventDefault();
            const itemId = e.dataTransfer.getData('text/plain');
            if (!itemId) return;
            const { itemsData } = getInventoryState();
            const item = itemsData.find(it => it.id === itemId);
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
        });
    });
});
