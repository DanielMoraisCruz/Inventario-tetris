import { getInventoryState } from './inventory.js';
const BODY_IMG_SRC = 'img/body.png';

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
