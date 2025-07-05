import { setupThemeToggle } from './theme.js';
import { loadSession } from './login.js';

const ATTRS = [
    'Carne', 'Fôlego', 'Dano', 'Força', 'Fuga',
    'Determinação', 'Mente', 'Coragem', 'Proteção', 'Velocidade'
];

function createAttrRow(name) {
    const row = document.createElement('div');
    row.className = 'attr';

    const label = document.createElement('span');
    label.className = 'attr-name';
    label.textContent = name;

    const controls = document.createElement('div');
    controls.className = 'controls';

    const dec = document.createElement('button');
    dec.className = 'btn dec';
    dec.textContent = '-';

    const val = document.createElement('span');
    val.className = 'value';
    val.textContent = '0';
    let value = 0;

    const inc = document.createElement('button');
    inc.className = 'btn inc';
    inc.textContent = '+';

    inc.addEventListener('click', () => {
        value++;
        val.textContent = String(value);
    });

    dec.addEventListener('click', () => {
        if (value > 0) {
            value--;
            val.textContent = String(value);
        }
    });

    controls.append(dec, val, inc);
    row.append(label, controls);
    return row;
}

function addSkill(name = '', type = 'ativa') {
    const list = document.getElementById('skill-list');
    const div = document.createElement('div');
    div.className = 'skill';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Nome';
    input.value = name;

    const select = document.createElement('select');
    const optA = document.createElement('option');
    optA.value = 'ativa';
    optA.textContent = 'Ativa';
    const optP = document.createElement('option');
    optP.value = 'passiva';
    optP.textContent = 'Passiva';
    select.append(optA, optP);
    select.value = type;

    const remove = document.createElement('button');
    remove.className = 'btn remove';
    remove.textContent = '✕';
    remove.addEventListener('click', () => {
        list.removeChild(div);
    });

    div.append(input, select, remove);
    list.appendChild(div);
}

function addSpell(name = '', type = 'ativa') {
    const list = document.getElementById('spell-list');
    const div = document.createElement('div');
    div.className = 'skill';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Nome';
    input.value = name;

    const select = document.createElement('select');
    const optA = document.createElement('option');
    optA.value = 'ativa';
    optA.textContent = 'Ativa';
    const optP = document.createElement('option');
    optP.value = 'passiva';
    optP.textContent = 'Passiva';
    select.append(optA, optP);
    select.value = type;

    const remove = document.createElement('button');
    remove.className = 'btn remove';
    remove.textContent = '✕';
    remove.addEventListener('click', () => {
        list.removeChild(div);
    });

    div.append(input, select, remove);
    list.appendChild(div);
}

window.addEventListener('DOMContentLoaded', () => {
    setupThemeToggle();

    if (!loadSession()) {
        window.location.href = 'login.html';
        return;
    }

    const attrList = document.getElementById('attr-list');
    ATTRS.forEach(a => {
        attrList.appendChild(createAttrRow(a));
    });

    document.getElementById('add-skill').addEventListener('click', () => addSkill());
    const addSpellBtn = document.getElementById('add-spell');
    if (addSpellBtn) {
        addSpellBtn.addEventListener('click', () => addSpell());
    }
});
