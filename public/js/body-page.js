import { setupThemeToggle } from './theme.js';
import { loadSession } from './login.js';

window.addEventListener('DOMContentLoaded', () => {
    setupThemeToggle();

    if (!loadSession()) {
        window.location.href = 'login.html';
        return;
    }

    const zones = [
        { id: 'head', name: 'Cabeça' },
        { id: 'right-arm', name: 'Braço Direito' },
        { id: 'left-arm', name: 'Braço Esquerdo' },
        { id: 'torso', name: 'Torso' },
        { id: 'right-leg', name: 'Perna Direita' },
        { id: 'left-leg', name: 'Perna Esquerda' }
    ];

    zones.forEach(z => {
        const el = document.getElementById(z.id);
        if (!el) return;
        const stressEl = el.querySelector('.stress');
        const inc = el.querySelector('.inc');
        const dec = el.querySelector('.dec');
        let value = 0;
        const max = 3;
        const update = () => { stressEl.textContent = `${value}/${max}`; };
        if (inc) inc.addEventListener('click', () => { if (value < max) { value++; update(); } });
        if (dec) dec.addEventListener('click', () => { if (value > 0) { value--; update(); } });
        update();
    });

    const rollBtn = document.getElementById('roll-body');
    if (rollBtn) {
        rollBtn.addEventListener('click', () => {
            const choice = zones[Math.floor(Math.random() * zones.length)];
            alert(`Parte sorteada: ${choice.name}`);
        });
    }
});
