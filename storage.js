const DATA_VERSION = 1;
const ROWS = 6;
const COLS = 10;

function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function defaultItems() {
    return [
        { id: generateId(), nome: 'Espada', width: 2, height: 1, img: null },
        { id: generateId(), nome: 'Lan\u00e7a', width: 1, height: 3, img: null },
        { id: generateId(), nome: 'Escudo', width: 2, height: 2, img: null }
    ];
}

function sanitizeItems(items) {
    if (!Array.isArray(items)) return defaultItems();
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
            img: it.img || null
        });
    }
    return valid.length ? valid : defaultItems();
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
            originalWidth: it.originalWidth ?? width,
            originalHeight: it.originalHeight ?? height
        });
    }
    return valid;
}

export function saveInventory(itemsData, placedItems) {
    const data = { version: DATA_VERSION, itemsData, placedItems };
    localStorage.setItem('tetris-inventory', JSON.stringify(data));
}

export function loadInventory() {
    const raw = localStorage.getItem('tetris-inventory');
    if (!raw) {
        return { itemsData: defaultItems(), placedItems: [] };
    }
    try {
        const obj = JSON.parse(raw);
        if (obj.version !== DATA_VERSION) throw new Error('version mismatch');
        const itemsData = sanitizeItems(obj.itemsData);
        const placedItems = sanitizePlaced(obj.placedItems);
        return { itemsData, placedItems };
    } catch (e) {
        console.warn('Dados do invent\u00e1rio corrompidos, restaurando padr\u00e3o.');
        localStorage.removeItem('tetris-inventory');
        if (typeof alert === 'function') {
            alert('Dados do invent\u00e1rio estavam corrompidos e foram reiniciados.');
        }
        return { itemsData: defaultItems(), placedItems: [] };
    }
}
