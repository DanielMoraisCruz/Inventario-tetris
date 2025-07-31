import { ROWS, COLS } from './constants.js';

/**
 * Versão dos dados para controle de compatibilidade
 */
const DATA_VERSION = 2;

/**
 * Gera um ID único para itens
 * @returns {string} ID único
 */
function generateId() {
    return crypto.randomUUID();
}

/**
 * Busca itens padrão do arquivo JSON
 * @returns {Promise<Array>} Array de itens padrão
 */
async function fetchDefaultItems() {
    try {
        const response = await fetch('data/items.json');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return data.map(item => ({
            id: generateId(),
            nome: item.nome || 'Item sem nome',
            width: Math.max(1, Math.min(10, item.width || 1)),
            height: Math.max(1, Math.min(6, item.height || 1)),
            img: typeof item.img === 'string' && item.img.length > 0 ? item.img : null,
            color: typeof item.color === 'string' ? item.color : '#2b8a3e',
            maxEstresse: Number.isFinite(item.maxEstresse) ? Math.max(0, item.maxEstresse) : 3,
            estresseAtual: Number.isFinite(item.estresseAtual) ? Math.max(0, item.estresseAtual) : 0
        }));
    } catch (error) {
        console.warn('Não foi possível carregar items.json, usando padrões:', error);
        return getDefaultItems();
    }
}

/**
 * Retorna itens padrão caso o arquivo não seja encontrado
 * @returns {Array} Array de itens padrão
 */
function getDefaultItems() {
    return [
        { 
            id: generateId(), 
            nome: 'Espada', 
            width: 2, 
            height: 1, 
            img: null, 
            color: '#2b8a3e', 
            maxEstresse: 3, 
            estresseAtual: 0 
        },
        { 
            id: generateId(), 
            nome: 'Lança', 
            width: 1, 
            height: 3, 
            img: null, 
            color: '#2b8a3e', 
            maxEstresse: 3, 
            estresseAtual: 0 
        },
        { 
            id: generateId(), 
            nome: 'Escudo', 
            width: 2, 
            height: 2, 
            img: null, 
            color: '#2b8a3e', 
            maxEstresse: 3, 
            estresseAtual: 0 
        }
    ];
}

/**
 * Valida e sanitiza itens do inventário
 * @param {Array} items - Array de itens para validar
 * @returns {Array} Array de itens válidos
 */
function sanitizeItems(items) {
    if (!Array.isArray(items)) {
        console.warn('Items não é um array válido, retornando array vazio');
        return [];
    }
    
    const validItems = [];
    
    for (const item of items) {
        // Validar propriedades obrigatórias
        if (typeof item.nome !== 'string' || item.nome.trim().length === 0) {
            console.warn('Item sem nome válido, ignorando:', item);
            continue;
        }
        
        const width = parseInt(item.width);
        const height = parseInt(item.height);
        
        // Validar dimensões
        if (!Number.isFinite(width) || width <= 0 || width > COLS) {
            console.warn(`Item "${item.nome}" com largura inválida: ${width}`, item);
            continue;
        }
        
        if (!Number.isFinite(height) || height <= 0 || height > ROWS) {
            console.warn(`Item "${item.nome}" com altura inválida: ${height}`, item);
            continue;
        }
        
        // Criar item sanitizado
        validItems.push({
            id: typeof item.id === 'string' ? item.id : generateId(),
            nome: item.nome.trim(),
            width,
            height,
            img: item.img || null,
            color: typeof item.color === 'string' ? item.color : '#2b8a3e',
            maxEstresse: Number.isFinite(parseInt(item.maxEstresse)) ? Math.max(0, parseInt(item.maxEstresse)) : 3,
            estresseAtual: Number.isFinite(parseInt(item.estresseAtual)) ? Math.max(0, parseInt(item.estresseAtual)) : 0
        });
    }
    
    return validItems;
}

/**
 * Valida e sanitiza itens posicionados no inventário
 * @param {Array} items - Array de itens posicionados
 * @returns {Array} Array de itens válidos
 */
function sanitizePlacedItems(items) {
    if (!Array.isArray(items)) {
        console.warn('Items posicionados não é um array válido, retornando array vazio');
        return [];
    }
    
    const validItems = [];
    
    for (const item of items) {
        const width = parseInt(item.width);
        const height = parseInt(item.height);
        const x = parseInt(item.x);
        const y = parseInt(item.y);
        
        // Validar dimensões
        if (!Number.isFinite(width) || width <= 0 || width > COLS) {
            console.warn(`Item posicionado com largura inválida: ${width}`, item);
            continue;
        }
        
        if (!Number.isFinite(height) || height <= 0 || height > ROWS) {
            console.warn(`Item posicionado com altura inválida: ${height}`, item);
            continue;
        }
        
        // Validar posição
        if (!Number.isFinite(x) || x < 0 || x + width > COLS) {
            console.warn(`Item posicionado com posição X inválida: ${x}`, item);
            continue;
        }
        
        if (!Number.isFinite(y) || y < 0 || y + height > ROWS) {
            console.warn(`Item posicionado com posição Y inválida: ${y}`, item);
            continue;
        }
        
        // Criar item sanitizado
        validItems.push({
            id: typeof item.id === 'string' ? item.id : generateId(),
            nome: typeof item.nome === 'string' ? item.nome.trim() : 'Item sem nome',
            x,
            y,
            width,
            height,
            rotacionado: Boolean(item.rotacionado),
            img: item.img || null,
            color: typeof item.color === 'string' ? item.color : '#2b8a3e',
            originalWidth: item.originalWidth ?? width,
            originalHeight: item.originalHeight ?? height,
            maxEstresse: Number.isFinite(parseInt(item.maxEstresse)) ? Math.max(0, parseInt(item.maxEstresse)) : 3,
            estresseAtual: Number.isFinite(parseInt(item.estresseAtual)) ? Math.max(0, parseInt(item.estresseAtual)) : 0
        });
    }
    
    return validItems;
}

/**
 * Salva dados do inventário no localStorage
 * @param {Array} itemsData - Dados dos itens
 * @param {Array} placedItems - Itens posicionados
 */
export function saveInventory(itemsData, placedItems) {
    try {
        const data = {
            version: DATA_VERSION,
            itemsData,
            placedItems,
            rows: ROWS,
            cols: COLS,
            timestamp: Date.now()
        };
        
        localStorage.setItem('tetris-inventory', JSON.stringify(data));
        console.log('Inventário salvo com sucesso');
    } catch (error) {
        console.error('Erro ao salvar inventário:', error);
        throw new Error('Falha ao salvar dados do inventário');
    }
}

/**
 * Carrega dados do inventário do localStorage
 * @returns {Promise<Object>} Dados do inventário
 */
export async function loadInventory() {
    try {
        const raw = localStorage.getItem('tetris-inventory');
        
        if (!raw) {
            console.log('Nenhum dado encontrado, carregando padrões');
            const itemsData = await fetchDefaultItems();
            return { itemsData, placedItems: [] };
        }
        
        const data = JSON.parse(raw);
        
        // Verificar versão
        if (data.version !== DATA_VERSION) {
            console.warn('Versão dos dados incompatível, restaurando padrões');
            localStorage.removeItem('tetris-inventory');
            const itemsData = await fetchDefaultItems();
            return { itemsData, placedItems: [] };
        }
        
        // Sanitizar dados
        let itemsData = sanitizeItems(data.itemsData);
        if (itemsData.length === 0) {
            console.warn('Nenhum item válido encontrado, carregando padrões');
            itemsData = await fetchDefaultItems();
        }
        
        const placedItems = sanitizePlacedItems(data.placedItems);
        
        // Validar dimensões
        const rows = Number.isFinite(parseInt(data.rows)) ? parseInt(data.rows) : undefined;
        const cols = Number.isFinite(parseInt(data.cols)) ? parseInt(data.cols) : undefined;
        
        console.log('Inventário carregado com sucesso');
        return { itemsData, placedItems, rows, cols };
        
    } catch (error) {
        console.error('Erro ao carregar inventário:', error);
        
        // Limpar dados corrompidos
        localStorage.removeItem('tetris-inventory');
        
        // Notificar usuário
        if (typeof alert === 'function') {
            alert('Dados do inventário estavam corrompidos e foram reiniciados.');
        }
        
        // Retornar dados padrão
        const itemsData = await fetchDefaultItems();
        return { itemsData, placedItems: [], rows: ROWS, cols: COLS };
    }
}

/**
 * Limpa todos os dados do inventário
 */
export function clearInventory() {
    try {
        localStorage.removeItem('tetris-inventory');
        console.log('Inventário limpo com sucesso');
    } catch (error) {
        console.error('Erro ao limpar inventário:', error);
    }
}

/**
 * Verifica se há dados salvos
 * @returns {boolean} True se há dados salvos
 */
export function hasSavedData() {
    try {
        const raw = localStorage.getItem('tetris-inventory');
        if (!raw) return false;
        
        const data = JSON.parse(raw);
        return data.version === DATA_VERSION;
    } catch (error) {
        console.error('Erro ao verificar dados salvos:', error);
        return false;
    }
}
