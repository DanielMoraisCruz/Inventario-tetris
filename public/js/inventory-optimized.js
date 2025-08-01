/**
 * Inventário Otimizado - Versão com melhorias de performance
 */

import { saveInventory, loadInventory } from './storage.js';
import { session } from './login.js';
import { ROWS, COLS, setInventorySize, CELL_GAP, getCellSize } from './constants.js';
import { 
  PerformanceCache, 
  PerformanceLogger, 
  debounce, 
  throttle, 
  BatchProcessor, 
  DOMOptimizer 
} from './performance-optimizer.js';

// Cache para operações custosas
const cache = new PerformanceCache();
const batchProcessor = new BatchProcessor();

// DOM elements com cache
export let inventory;
export let itemList;
export let form;
export let itemsPanel;
export let searchInput;
export let itemMsg;

// Cache de elementos DOM
const domCache = new Map();

export function cacheDomElements() {
  PerformanceLogger.measure('Cache DOM Elements', () => {
    inventory = document.getElementById('inventory');
    itemList = document.getElementById('item-list');
    form = document.getElementById('item-form');
    itemsPanel = document.getElementById('items');
    searchInput = document.getElementById('item-search');
    itemMsg = document.getElementById('item-msg');
    
    // Cachear elementos frequentemente acessados
    domCache.set('inventory', inventory);
    domCache.set('itemList', itemList);
    domCache.set('form', form);
    domCache.set('itemsPanel', itemsPanel);
    domCache.set('searchInput', searchInput);
    domCache.set('itemMsg', itemMsg);
  });
}

// Inicialização automática
if (document.readyState !== 'loading') {
  cacheDomElements();
} else {
  window.addEventListener('DOMContentLoaded', cacheDomElements, { once: true });
}

let itemsData = [];
let placedItems = [];

export function getInventoryState() {
  return { itemsData, placedItems };
}

export function setInventoryState(data) {
  itemsData = data.itemsData;
  placedItems = data.placedItems;
}

export async function initInventory() {
  PerformanceLogger.measure('Initialize Inventory', async () => {
    const loaded = await loadInventory();
    if (loaded.rows && loaded.cols) {
      setInventorySize(loaded.rows, loaded.cols);
    }
    createGrid();
    itemsData = loaded.itemsData;
    placedItems = loaded.placedItems;
    renderItemList();
    redrawPlacedItems();
  });
}

export function createGrid() {
  PerformanceLogger.measure('Create Grid', () => {
    const fragment = document.createDocumentFragment();
    
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = DOMOptimizer.createElement('div', {
          className: 'cell',
          dataset: { x, y }
        });
        fragment.appendChild(cell);
      }
    }
    
    inventory.appendChild(fragment);
  });
}

// Renderização otimizada com virtualização para listas grandes
export function renderItemList() {
  PerformanceLogger.measure('Render Item List', () => {
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const filteredItems = itemsData.filter(it => it.nome.toLowerCase().includes(query));
    
    // Usar virtualização para listas grandes
    if (filteredItems.length > 100) {
      renderVirtualList(filteredItems);
    } else {
      renderStandardList(filteredItems);
    }
  });
}

function renderStandardList(items) {
  const fragment = document.createDocumentFragment();
  
  items.forEach((item, idx) => {
    const el = createItemElement(item, idx);
    fragment.appendChild(el);
  });
  
  itemList.innerHTML = '';
  itemList.appendChild(fragment);
}

function renderVirtualList(items) {
  // Implementação de lista virtual para performance
  const itemHeight = 60; // Altura estimada do item
  const visibleCount = Math.ceil(itemList.clientHeight / itemHeight);
  
  // Limpar e configurar container
  itemList.innerHTML = '';
  itemList.style.height = `${items.length * itemHeight}px`;
  itemList.style.position = 'relative';
  
  // Renderizar apenas itens visíveis
  const visibleItems = items.slice(0, visibleCount);
  const fragment = document.createDocumentFragment();
  
  visibleItems.forEach((item, idx) => {
    const el = createItemElement(item, idx);
    el.style.position = 'absolute';
    el.style.top = `${idx * itemHeight}px`;
    fragment.appendChild(el);
  });
  
  itemList.appendChild(fragment);
}

function createItemElement(item, idx) {
  return DOMOptimizer.createElement('div', {
    className: 'item',
    draggable: true,
    dataset: {
      idx,
      width: item.width,
      height: item.height,
      id: item.id
    },
    style: {
      '--w': item.width,
      '--h': item.height,
      '--color': item.color
    }
  }, [
    createItemPreview(item),
    createStressElement(item)
  ]);
}

function createItemPreview(item) {
  const preview = DOMOptimizer.createElement('div', {
    className: `item-preview${item.rotacionado ? ' rotacionado' : ''}`
  });
  
  if (item.img) {
    const img = DOMOptimizer.createElement('img', {
      src: item.img,
      alt: item.nome
    });
    preview.appendChild(img);
  }
  
  return preview;
}

function createStressElement(item) {
  const cur = item.estresseAtual ?? 0;
  const max = item.maxEstresse ?? 3;
  
  return DOMOptimizer.createElement('div', {
    className: 'item-stress'
  }, [
    DOMOptimizer.createElement('div', {
      className: 'stress-bar',
      style: {
        width: `${(cur / max) * 100}%`,
        backgroundColor: cur >= max ? '#dc2626' : '#16a34a'
      }
    }),
    DOMOptimizer.createElement('span', {
      className: 'stress-text'
    }, [`${cur}/${max}`])
  ]);
}

// Debounce para busca
const debouncedSearch = debounce(() => {
  renderItemList();
}, 300);

export function updateItemList() {
  debouncedSearch();
}

export function getItemFormData() {
  const formData = new FormData(form);
  return {
    nome: formData.get('nome'),
    width: parseInt(formData.get('width')),
    height: parseInt(formData.get('height')),
    color: formData.get('color'),
    maxEstresse: parseInt(formData.get('maxEstresse')),
    img: formData.get('img')
  };
}

export function addNewItem(data) {
  const newItem = {
    id: generateId(),
    ...data,
    estresseAtual: 0
  };
  
  itemsData.push(newItem);
  updateItemList();
  return newItem;
}

export function removeItemFromPanel(itemId) {
  itemsData = itemsData.filter(item => item.id !== itemId);
  updateItemList();
}

export function returnItemToPanel(item) {
  removeItemFromGrid(item.id, false);
  itemsData.push(item);
  updateItemList();
}

export function readImageFile(input) {
  return new Promise((resolve) => {
    const file = input.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    } else {
      resolve(null);
    }
  });
}

export async function handleItemSubmit(e) {
  e.preventDefault();
  
  const data = getItemFormData();
  const imgFile = await readImageFile(document.getElementById('item-img'));
  
  if (imgFile) {
    data.img = imgFile;
  }
  
  addNewItem(data);
  form.reset();
}

// Throttle para redesenho
const throttledRedraw = throttle(() => {
  redrawPlacedItems();
}, 16);

export function redrawPlacedItems() {
  PerformanceLogger.measure('Redraw Placed Items', () => {
    clearGridSelection();
    placedItems.forEach(item => {
      placeItem(item.x, item.y, item.width, item.height, item, true);
    });
  });
}

export function clearGridSelection() {
  const cells = inventory.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.classList.remove('selected');
    cell.innerHTML = '';
  });
}

export function removeItemFromGrid(itemId, isDeleteKey = false) {
  const item = placedItems.find(item => item.id === itemId);
  if (item) {
    clearCells(item.x, item.y, item.width, item.height);
    placedItems = placedItems.filter(item => item.id !== itemId);
    
    if (isDeleteKey) {
      removeItemFromPanel(itemId);
    } else {
      returnItemToPanel(item);
    }
    
    throttledRedraw();
  }
}

export function clearCells(x, y, w, h) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const cell = inventory.querySelector(`[data-x="${x + dx}"][data-y="${y + dy}"]`);
      if (cell) {
        resetCell(cell);
      }
    }
  }
}

export function canPlace(x, y, w, h) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      if (x + dx >= COLS || y + dy >= ROWS) return false;
      const cell = inventory.querySelector(`[data-x="${x + dx}"][data-y="${y + dy}"]`);
      if (cell && cell.children.length > 0) return false;
    }
  }
  return true;
}

export function placeItem(x, y, w, h, item, fromRedraw = false) {
  if (!canPlace(x, y, w, h)) return false;
  
  PerformanceLogger.measure('Place Item', () => {
    const itemElement = createItemImageElement(item, w, h);
    
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const cell = inventory.querySelector(`[data-x="${x + dx}"][data-y="${y + dy}"]`);
        if (cell) {
          if (dx === 0 && dy === 0) {
            cell.appendChild(itemElement);
          }
          cell.classList.add('occupied');
        }
      }
    }
    
    if (!fromRedraw) {
      placedItems.push({ ...item, x, y });
      throttledRedraw();
    }
  });
  
  return true;
}

export function createItemImageElement(item, width, height, isGhost = false) {
  const element = DOMOptimizer.createElement('div', {
    className: `item-image${isGhost ? ' ghost' : ''}`,
    style: {
      width: `${width * getCellSize() - CELL_GAP}px`,
      height: `${height * getCellSize() - CELL_GAP}px`,
      backgroundColor: item.color,
      position: 'absolute',
      top: '0',
      left: '0',
      zIndex: isGhost ? '1' : '2'
    }
  });
  
  if (item.img) {
    const img = DOMOptimizer.createElement('img', {
      src: item.img,
      alt: item.nome,
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }
    });
    element.appendChild(img);
  }
  
  return element;
}

export function createStressElement(item, width) {
  const cur = item.estresseAtual ?? 0;
  const max = item.maxEstresse ?? 3;
  
  return DOMOptimizer.createElement('div', {
    className: 'stress-display',
    style: {
      position: 'absolute',
      bottom: '2px',
      left: '2px',
      right: '2px',
      height: '4px',
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: '2px'
    }
  }, [
    DOMOptimizer.createElement('div', {
      style: {
        width: `${(cur / max) * 100}%`,
        height: '100%',
        backgroundColor: cur >= max ? '#dc2626' : '#16a34a',
        borderRadius: '2px',
        transition: 'width 0.3s ease'
      }
    })
  ]);
}

export function removeStressDisplay(cell) {
  const stressDisplay = cell.querySelector('.stress-display');
  if (stressDisplay) {
    stressDisplay.remove();
  }
}

export function removeGridImage(cell) {
  const itemImage = cell.querySelector('.item-image');
  if (itemImage) {
    itemImage.remove();
  }
}

export function resetCell(cell) {
  cell.classList.remove('occupied', 'selected');
  cell.innerHTML = '';
}

export function hideGhostElement(ghost) {
  if (ghost) {
    ghost.style.display = 'none';
  }
}

export function updateStressDisplay(item) {
  const cells = inventory.querySelectorAll('.cell');
  cells.forEach(cell => {
    const itemImage = cell.querySelector('.item-image');
    if (itemImage && itemImage.dataset.itemId === item.id) {
      removeStressDisplay(cell);
      const stressElement = createStressElement(item);
      itemImage.appendChild(stressElement);
    }
  });
}

export function adjustItemStress(itemId, delta) {
  const item = placedItems.find(item => item.id === itemId);
  if (item) {
    item.estresseAtual = Math.max(0, Math.min(item.maxEstresse, item.estresseAtual + delta));
    updateStressDisplay(item);
  }
}

export function generateId() {
  return crypto.randomUUID();
} 