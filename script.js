const ROWS = 6;
const COLS = 10;
const CELL_SIZE = 40;
const CELL_GAP = 3;

const inventory = document.getElementById('inventory');
const itemList = document.getElementById('item-list');
const form = document.getElementById('item-form');
const dragGhost = document.getElementById('drag-ghost');

let itemsData = [
    { id: generateId(), nome: 'Espada', width: 2, height: 1, img: null },
    { id: generateId(), nome: 'Lança', width: 1, height: 3, img: null },
    { id: generateId(), nome: 'Escudo', width: 2, height: 2, img: null },
];
let placedItems = [];
let draggedItem = null;
let draggedFromGrid = false;
let previewRotation = false;
let currentPreviewSize = { width: 1, height: 1 };
let previousPlacement = null;
let lastGhostPos = { x: null, y: null, valid: true };
let selectedItemId = null;

// LOGIN variables
let isMaster = false;
let userName = "";
let masterPasswordHash = null; // carregado do backend

async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buf);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getMasterHash() {
    if (masterPasswordHash !== null) return masterPasswordHash;
    try {
        const res = await fetch('/master-hash');
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        masterPasswordHash = data.hash || '';
    } catch (e) {
        console.error('Erro ao obter hash da senha mestre');
        masterPasswordHash = '';
    }
    return masterPasswordHash;
}

// -------- Persistência Local --------
function saveInventory() {
    const data = {
        itemsData,
        placedItems
    };
    localStorage.setItem("tetris-inventory", JSON.stringify(data));
}

function loadInventory() {
    const data = localStorage.getItem("tetris-inventory");
    if (!data) return;
    try {
        const obj = JSON.parse(data);
        if (obj.itemsData && obj.placedItems) {
            itemsData = obj.itemsData;
            placedItems = obj.placedItems;
        }
    } catch (e) {
        console.warn("Inventário local corrompido ou inexistente.");
    }
}

function redrawPlacedItems() {
    Array.from(inventory.children).forEach(cell => {
        cell.classList.remove('placed', 'selected');
        delete cell.dataset.itemid;
        cell.title = '';
        removeGridImage(cell);
    });
    placedItems.forEach(item => {
        placeItem(item.x, item.y, item.width, item.height, item, true);
    });
}
// ------------------------------------

// Cria grid do inventário
for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.x = x;
        cell.dataset.y = y;
        inventory.appendChild(cell);
    }
}

// LOGIN LÓGICA
const loginScreen = document.getElementById('login-screen');
const loginBtn = document.getElementById('login-btn');
const loginUser = document.getElementById('login-user');
const loginPass = document.getElementById('login-pass');
const loginErr = document.getElementById('login-err');
const userWelcome = document.getElementById('user-welcome');

loginBtn.onclick = async () => {
    const user = loginUser.value.trim();
    const pass = loginPass.value;
    if (!user) {
        loginErr.textContent = "Digite seu nome!";
        return;
    }
    const hashed = await sha256(pass);
    const masterHash = await getMasterHash();
    if (hashed === masterHash) {
        isMaster = true;
        userName = user;
        localStorage.setItem('session', JSON.stringify({ userName, isMaster }));
        loginScreen.style.display = 'none';
        form.style.display = 'block';
        userWelcome.textContent = "Olá, " + user + " (Mestre)";
    } else if (pass === "") {
        isMaster = false;
        userName = user;
        localStorage.setItem('session', JSON.stringify({ userName, isMaster }));
        loginScreen.style.display = 'none';
        form.style.display = 'none';
        userWelcome.textContent = "Olá, " + user;
    } else {
        loginErr.textContent = "Senha incorreta!";
    }
};

// Sempre oculta o form até login
window.addEventListener('DOMContentLoaded', function() {
    const session = localStorage.getItem('session');
    if (session) {
        try {
            const data = JSON.parse(session);
            userName = data.userName;
            isMaster = data.isMaster;
            loginScreen.style.display = 'none';
            if (isMaster) {
                form.style.display = 'block';
                userWelcome.textContent = "Olá, " + userName + " (Mestre)";
            } else {
                form.style.display = 'none';
                userWelcome.textContent = "Olá, " + userName;
            }
            return;
        } catch (e) {
            console.warn('Sessão inválida');
        }
    }
    form.style.display = 'none';
    loginScreen.style.display = 'flex';
});

// ----------- INVENTÁRIO ---------------

loadInventory();
updateItemList();
redrawPlacedItems();

function updateItemList() {
    itemList.innerHTML = '';
    itemsData.forEach((item, idx) => {
        const el = document.createElement('div');
        el.classList.add('item');
        el.draggable = true;
        el.dataset.idx = idx;
        el.dataset.width = item.width;
        el.dataset.height = item.height;

        if (item.img) {
            const img = document.createElement('img');
            img.src = item.img;
            img.alt = item.nome;
            img.className = 'item-img';
            el.appendChild(img);
        }
        const span = document.createElement('span');
        span.textContent = `${item.nome} (${item.width}x${item.height})`;
        el.appendChild(span);

        el.addEventListener('dragstart', (e) => {
            draggedItem = {
                ...item,
                source: "panel"
            };
            previewRotation = false;
            currentPreviewSize = { width: item.width, height: item.height };
            setTimeout(() => el.style.opacity = 0.5, 0);
            snapGhostToGrid(e.pageX, e.pageY);
        });
        el.addEventListener('dragend', () => {
            draggedItem = null;
            el.style.opacity = 1;
            removePreview();
            hideGhost();
        });
        itemList.appendChild(el);
    });
    saveInventory();
}

// Adiciona novo item pelo formulário (com imagem)
form.addEventListener('submit', handleItemSubmit);

function getItemFormData() {
    const nome = document.getElementById('nome').value.trim();
    const width = parseInt(document.getElementById('largura').value);
    const height = parseInt(document.getElementById('altura').value);
    const imgInput = document.getElementById('imagem');
    if (!nome || width < 1 || height < 1 || width > COLS || height > ROWS) return null;
    return { nome, width, height, imgInput };
}

function addNewItem(data) {
    itemsData.push({
        id: generateId(),
        nome: data.nome,
        width: data.width,
        height: data.height,
        img: data.img
    });
    updateItemList();
    saveInventory();
}

function readImageFile(input) {
    return new Promise(resolve => {
        if (!input.files || !input.files[0]) {
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = ev => resolve(ev.target.result);
        reader.readAsDataURL(input.files[0]);
    });
}

async function handleItemSubmit(e) {
    e.preventDefault();
    if (!isMaster) {
        alert("Só o mestre pode criar itens.");
        return;
    }
    const data = getItemFormData();
    if (!data) return;
    data.img = await readImageFile(data.imgInput);
    addNewItem(data);
    form.reset();
}

window.addEventListener('keydown', function(e) {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId) {
        e.preventDefault();
        removeItemFromGrid(selectedItemId, true);
        selectedItemId = null;
        saveInventory();
        return;
    }

    if (!draggedItem) return;
    if (e.key.toLowerCase() === 'r') {
        previewRotation = !previewRotation;
        currentPreviewSize = {
            width: previewRotation ? draggedItem.height : draggedItem.width,
            height: previewRotation ? draggedItem.width : draggedItem.height
        };
        if (lastGhostPos.x !== null && lastGhostPos.y !== null) {
            showGhostOnGrid(lastGhostPos.x, lastGhostPos.y);
        }
    }
});

inventory.addEventListener('click', function(e) {
    const cell = e.target.closest('.cell');
    clearGridSelection();
    if (!cell || !cell.classList.contains('placed')) {
        selectedItemId = null;
        return;
    }
    const itemId = cell.dataset.itemid;
    if (!itemId) {
        selectedItemId = null;
        return;
    }
    selectedItemId = itemId;
    const placed = placedItems.find(item => item.id === itemId);
    if (placed) {
        for (let dy = 0; dy < placed.height; dy++) {
            for (let dx = 0; dx < placed.width; dx++) {
                const index = (placed.y + dy) * COLS + (placed.x + dx);
                const c = inventory.children[index];
                c.classList.add('selected');
            }
        }
    }
});

inventory.addEventListener('mousedown', function(e) {
    const cell = e.target.closest('.cell');
    if (!cell || !cell.classList.contains('placed')) return;
    const itemId = cell.dataset.itemid;
    if (!itemId) return;
    e.preventDefault();

    const placed = placedItems.find(item => item.id === itemId);
    if (!placed) return;

    clearGridSelection();
    selectedItemId = null;

    draggedItem = {
        ...placed,
        source: "grid"
    };
    draggedFromGrid = true;
    previewRotation = placed.rotacionado;
    currentPreviewSize = { width: placed.width, height: placed.height };
    previousPlacement = { ...placed };

    for (let dy = 0; dy < placed.height; dy++) {
        for (let dx = 0; dx < placed.width; dx++) {
            const index = (placed.y + dy) * COLS + (placed.x + dx);
            const c = inventory.children[index];
            c.classList.remove('placed', 'selected');
            delete c.dataset.itemid;
            c.title = '';
            removeGridImage(c);
        }
    }
    placedItems = placedItems.filter(item => item.id !== itemId);

    saveInventory();

    snapGhostToGrid(e.pageX, e.pageY);

    document.addEventListener('mousemove', snapGhostToGridMouseMove);
    document.addEventListener('mouseup', mouseupDrop);
});

function clearGridSelection() {
    document.querySelectorAll('.cell.selected').forEach(cell => cell.classList.remove('selected'));
}

function removeItemFromGrid(itemId, isDeleteKey = false) {
    const placed = placedItems.find(item => item.id === itemId);
    if (!placed) return;
    for (let dy = 0; dy < placed.height; dy++) {
        for (let dx = 0; dx < placed.width; dx++) {
            const index = (placed.y + dy) * COLS + (placed.x + dx);
            const c = inventory.children[index];
            c.classList.remove('placed', 'selected');
            delete c.dataset.itemid;
            c.title = '';
            removeGridImage(c);
        }
    }
    placedItems = placedItems.filter(item => item.id !== itemId);

    if (!isDeleteKey) {
        itemsData.push({
            id: placed.id,
            nome: placed.nome,
            width: placed.originalWidth,
            height: placed.originalHeight,
            img: placed.img || null
        });
        updateItemList();
    }
    saveInventory();
}

function snapGhostToGridMouseMove(e) {
    snapGhostToGrid(e.pageX, e.pageY);
}

function computeGridPosition(pageX, pageY) {
    const invRect = inventory.getBoundingClientRect();
    const relX = pageX - invRect.left;
    const relY = pageY - invRect.top;
    let gridX = Math.floor(relX / (CELL_SIZE + CELL_GAP));
    let gridY = Math.floor(relY / (CELL_SIZE + CELL_GAP));
    if (gridX < 0) gridX = 0;
    if (gridY < 0) gridY = 0;
    if (gridX > COLS - currentPreviewSize.width) gridX = COLS - currentPreviewSize.width;
    if (gridY > ROWS - currentPreviewSize.height) gridY = ROWS - currentPreviewSize.height;
    return { gridX, gridY };
}

function snapGhostToGrid(pageX, pageY) {
    const { gridX, gridY } = computeGridPosition(pageX, pageY);
    lastGhostPos = { x: gridX, y: gridY };
    showGhostOnGrid(gridX, gridY);
}

function showGhostOnGrid(gridX, gridY) {
    const valid = canPlace(gridX, gridY, currentPreviewSize.width, currentPreviewSize.height);
    dragGhost.innerHTML = '';
    dragGhost.style.width = (currentPreviewSize.width * (CELL_SIZE + CELL_GAP) - CELL_GAP) + 'px';
    dragGhost.style.height = (currentPreviewSize.height * (CELL_SIZE + CELL_GAP) - CELL_GAP) + 'px';
    dragGhost.style.display = 'block';

    dragGhost.className = valid ? '' : 'ghost-invalid';

    for (let i = 0; i < currentPreviewSize.width * currentPreviewSize.height; i++) {
        const cell = document.createElement('div');
        cell.className = 'ghost-cell';
        dragGhost.appendChild(cell);
    }
    if (draggedItem && draggedItem.img) {
        const img = document.createElement('img');
        img.src = draggedItem.img;
        img.className = 'grid-item-img';
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.left = "0";
        img.style.top = "0";
        img.style.position = "absolute";
        img.style.objectFit = "contain";
        img.style.pointerEvents = "none";
        img.style.zIndex = "10";
        img.style.transition = "transform 0.2s";
        if (previewRotation) {
            img.style.transform = "rotate(90deg)";
        } else {
            img.style.transform = "none";
        }
        dragGhost.appendChild(img);
    }
    const invRect = inventory.getBoundingClientRect();
    dragGhost.style.left = (invRect.left + gridX * (CELL_SIZE + CELL_GAP)) + 'px';
    dragGhost.style.top = (invRect.top + gridY * (CELL_SIZE + CELL_GAP)) + 'px';

    removePreview();
    if (valid) {
        for (let dy = 0; dy < currentPreviewSize.height; dy++) {
            for (let dx = 0; dx < currentPreviewSize.width; dx++) {
                const index = (gridY + dy) * COLS + (gridX + dx);
                const c = inventory.children[index];
                if (c) c.classList.add('preview');
            }
        }
    }
    lastGhostPos.valid = valid;
}

function mouseupDrop(e) {
    const invRect = inventory.getBoundingClientRect();
    const outOfGrid = (
        e.clientX < invRect.left ||
        e.clientY < invRect.top ||
        e.clientX > invRect.right ||
        e.clientY > invRect.bottom
    );

    if (outOfGrid && draggedItem) {
        itemsData.push({
            id: draggedItem.id,
            nome: draggedItem.nome,
            width: draggedItem.originalWidth ?? draggedItem.width,
            height: draggedItem.originalHeight ?? draggedItem.height,
            img: draggedItem.img || null
        });
        updateItemList();
        saveInventory();
    } else if (lastGhostPos.x !== null && lastGhostPos.y !== null && draggedItem) {
        if (lastGhostPos.valid) {
            placeItem(lastGhostPos.x, lastGhostPos.y, currentPreviewSize.width, currentPreviewSize.height, draggedItem);
        } else {
            if (draggedFromGrid) {
                placeItem(previousPlacement.x, previousPlacement.y, previousPlacement.width, previousPlacement.height, previousPlacement);
            }
        }
    }
    draggedItem = null;
    draggedFromGrid = false;
    removePreview();
    hideGhost();
    document.removeEventListener('mousemove', snapGhostToGridMouseMove);
    document.removeEventListener('mouseup', mouseupDrop);
    saveInventory();
}

inventory.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!draggedItem) return;
    const { gridX, gridY } = computeGridPosition(e.clientX, e.clientY);
    lastGhostPos = { x: gridX, y: gridY };
    showGhostOnGrid(gridX, gridY);
});

inventory.addEventListener('dragleave', () => {
    removePreview();
    hideGhost();
});

inventory.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!draggedItem) return;
    if (draggedFromGrid) return;
    if (lastGhostPos.x !== null && lastGhostPos.y !== null && lastGhostPos.valid) {
        if (draggedItem.source === "panel") {
            itemsData = itemsData.filter(item => item.id !== draggedItem.id);
            updateItemList();
        }
        placeItem(lastGhostPos.x, lastGhostPos.y, currentPreviewSize.width, currentPreviewSize.height, draggedItem);
    }
    removePreview();
    hideGhost();
    draggedItem = null;
    saveInventory();
});

function removePreview() {
    document.querySelectorAll('.cell.preview').forEach(c => c.classList.remove('preview'));
}

function canPlace(x, y, w, h) {
    if (x + w > COLS || y + h > ROWS) return false;
    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            const index = (y + dy) * COLS + (x + dx);
            const cell = inventory.children[index];
            if (cell.classList.contains('placed')) return false;
        }
    }
    return true;
}

function placeItem(x, y, w, h, item, fromRedraw = false) {
    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            const index = (y + dy) * COLS + (x + dx);
            const cell = inventory.children[index];
            cell.classList.add('placed');
            cell.dataset.itemid = item.id;
            cell.title = item.nome || '';
            if (dx === 0 && dy === 0) {
                removeGridImage(cell);
            }
        }
    }
    if (item.img) {
        const cell0 = inventory.children[y * COLS + x];
        cell0.classList.add('has-img');
        let img = document.createElement('img');
        img.src = item.img;
        img.alt = item.nome;
        img.className = 'grid-item-img';
        img.style.width = ((CELL_SIZE + CELL_GAP) * w - CELL_GAP) + "px";
        img.style.height = ((CELL_SIZE + CELL_GAP) * h - CELL_GAP) + "px";
        img.style.left = "0";
        img.style.top = "0";
        img.style.position = "absolute";
        img.style.objectFit = "contain";
        img.style.pointerEvents = "none";
        img.style.zIndex = "10";
        img.style.transition = "transform 0.2s";
        if (item.rotacionado) {
            img.style.transform = "rotate(90deg)";
        } else {
            img.style.transform = "none";
        }
        removeGridImage(cell0);
        cell0.appendChild(img);
    }

    if (!fromRedraw) {
        placedItems.push({
            id: item.id,
            nome: item.nome,
            x, y,
            width: w,
            height: h,
            rotacionado: previewRotation,
            img: item.img || null,
            originalWidth: item.originalWidth ?? (item.rotacionado ? item.height : item.width),
            originalHeight: item.originalHeight ?? (item.rotacionado ? item.width : item.height)
        });
        saveInventory();
    }
}

function removeGridImage(cell) {
    const img = cell.querySelector('.grid-item-img');
    if (img) cell.removeChild(img);
    cell.classList.remove('has-img');
}

function hideGhost() {
    dragGhost.style.display = 'none';
    dragGhost.innerHTML = '';
    lastGhostPos = { x: null, y: null, valid: true };
}

function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}
