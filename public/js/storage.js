import { ROWS, COLS } from './constants.js';
const DATA_VERSION = 2;

function generateId() {
    return crypto.randomUUID();
}

async function fetchDefaultItems() {
    try {
        const res = await fetch('data/items.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        return data.map(it => ({
            id: generateId(),
            nome: it.nome,
            width: it.width,
            height: it.height,
            img: typeof it.img === 'string' && it.img.length ? it.img : null,
            color: typeof it.color === 'string' ? it.color : '#2b8a3e',
            maxEstresse: Number.isFinite(it.maxEstresse) ? it.maxEstresse : 3,
            estresseAtual: Number.isFinite(it.estresseAtual) ? it.estresseAtual : 0
        }));
    } catch (e) {
        console.warn('Could not load items.json, falling back to defaults.', e);
        return defaultItems();
    }
}

function defaultItems() {
    return [
        { id: generateId(), nome: 'Espada', width: 2, height: 1, img: null, color: '#2b8a3e', maxEstresse: 3, estresseAtual: 0 },
        { id: generateId(), nome: 'Lan\u00e7a', width: 1, height: 3, img: null, color: '#2b8a3e', maxEstresse: 3, estresseAtual: 0 },
        { id: generateId(), nome: 'Escudo', width: 2, height: 2, img: null, color: '#2b8a3e', maxEstresse: 3, estresseAtual: 0 }
    ];
}

function sanitizeItems(items) {
    if (!Array.isArray(items)) return [];
    const valid = [];
    for (const it of items) {
        const width = parseInt(it.width);
        const height = parseInt(it.height);
        if (typeof it.nome !== 'string') continue;
        if (!Number.isFinite(width) || width <= 0 || width > COLS) continue;
        if (!Number.isFinite(height) || height <= 0 || height > ROWS) continue;
        valid.push({
            id: typeof it.id === 'string' ? it.id : generateId(),
            nome: it.nome,
            width,
            height,
            img: it.img || null,
            color: typeof it.color === 'string' ? it.color : '#2b8a3e',
            maxEstresse: Number.isFinite(parseInt(it.maxEstresse)) ? parseInt(it.maxEstresse) : 3,
            estresseAtual: Number.isFinite(parseInt(it.estresseAtual)) ? parseInt(it.estresseAtual) : 0
        });
    }
    return valid;
}

function sanitizePlaced(items) {
    if (!Array.isArray(items)) return [];
    const valid = [];
    for (const it of items) {
        const width = parseInt(it.width);
        const height = parseInt(it.height);
        const x = parseInt(it.x);
        const y = parseInt(it.y);
        if (!Number.isFinite(width) || width <= 0 || width > COLS) continue;
        if (!Number.isFinite(height) || height <= 0 || height > ROWS) continue;
        if (!Number.isFinite(x) || x < 0 || x + width > COLS) continue;
        if (!Number.isFinite(y) || y < 0 || y + height > ROWS) continue;
        valid.push({
            id: typeof it.id === 'string' ? it.id : generateId(),
            nome: typeof it.nome === 'string' ? it.nome : '',
            x,
            y,
            width,
            height,
            rotacionado: !!it.rotacionado,
            img: it.img || null,
            color: typeof it.color === 'string' ? it.color : '#2b8a3e',
            originalWidth: it.originalWidth ?? width,
            originalHeight: it.originalHeight ?? height,
            maxEstresse: Number.isFinite(parseInt(it.maxEstresse)) ? parseInt(it.maxEstresse) : 3,
            estresseAtual: Number.isFinite(parseInt(it.estresseAtual)) ? parseInt(it.estresseAtual) : 0
        });
    }
    return valid;
}

export function saveInventory(itemsData, placedItems) {
    const data = { version: DATA_VERSION, itemsData, placedItems };
    localStorage.setItem('tetris-inventory', JSON.stringify(data));
}

export async function loadInventory() {
    const raw = localStorage.getItem('tetris-inventory');
    if (!raw) {
        const itemsData = await fetchDefaultItems();
        return { itemsData, placedItems: [] };
    }
    try {
        const obj = JSON.parse(raw);
        if (obj.version !== DATA_VERSION) throw new Error('version mismatch');
        let itemsData = sanitizeItems(obj.itemsData);
        if (!itemsData.length) itemsData = await fetchDefaultItems();
        const placedItems = sanitizePlaced(obj.placedItems);
        return { itemsData, placedItems };
    } catch (e) {
        console.warn('Dados do invent\u00e1rio corrompidos, restaurando padr\u00e3o.');
        localStorage.removeItem('tetris-inventory');
        if (typeof alert === 'function') {
            alert('Dados do invent\u00e1rio estavam corrompidos e foram reiniciados.');
        }
        const itemsData = await fetchDefaultItems();
        return { itemsData, placedItems: [] };
    }
}
