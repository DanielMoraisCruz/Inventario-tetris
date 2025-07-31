/**
 * Constantes e configurações do sistema de inventário
 * Gerencia dimensões, tamanhos e configurações do grid
 */

// Configurações padrão do inventário
export let ROWS = 6;
export let COLS = 10;
export const CELL_SIZE = 40; // tamanho base em px
export const CELL_GAP = 3;  // espaçamento em px

// Limites de configuração
export const MIN_ROWS = 3;
export const MAX_ROWS = 20;
export const MIN_COLS = 3;
export const MAX_COLS = 20;

/**
 * Define o tamanho do inventário
 * @param {number} rows - Número de linhas
 * @param {number} cols - Número de colunas
 */
export function setInventorySize(rows, cols) {
    // Validar limites
    const validRows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, rows));
    const validCols = Math.max(MIN_COLS, Math.min(MAX_COLS, cols));
    
    ROWS = validRows;
    COLS = validCols;
    
    applyLayoutSettings();
}

/**
 * Calcula o tamanho padrão baseado nas estatísticas do personagem
 * @param {Object} stats - Estatísticas do personagem
 * @param {number} stats.forca - Força do personagem
 * @param {number} stats.inteligencia - Inteligência do personagem
 * @param {number} stats.determinacao - Determinação do personagem
 * @returns {Object} Dimensões calculadas {rows, cols}
 */
export function calcDefaultSize({ forca, inteligencia, determinacao }) {
    const cols = Math.max(MIN_COLS, Math.floor(inteligencia / 2) + determinacao);
    const rows = Math.max(MIN_ROWS, Math.floor(forca / 2) + determinacao);
    return { rows, cols };
}

/**
 * Obtém o tamanho da célula em pixels
 * @returns {number} Tamanho da célula em pixels
 */
export function getCellSize() {
    const value = getComputedStyle(document.documentElement)
        .getPropertyValue('--cell-size')
        .trim();
    
    const num = parseFloat(value);
    
    if (value.endsWith('rem')) {
        const rootSize = parseFloat(
            getComputedStyle(document.documentElement).fontSize
        );
        return num * rootSize;
    }
    
    return num;
}

/**
 * Aplica as configurações de layout ao CSS
 * Atualiza variáveis CSS e controles de interface
 */
export function applyLayoutSettings() {
    const root = document.documentElement;
    
    // Definir variáveis CSS
    root.style.setProperty('--rows', ROWS);
    root.style.setProperty('--cols', COLS);
    root.style.setProperty('--cell-size', `${CELL_SIZE / 16}rem`);
    root.style.setProperty('--cell-gap', `${CELL_GAP / 16}rem`);

    // Atualizar controles de interface
    updateSizeControls();
}

/**
 * Atualiza os controles de tamanho na interface
 */
function updateSizeControls() {
    const widthInput = document.getElementById('largura');
    const heightInput = document.getElementById('altura');
    
    if (widthInput) {
        widthInput.max = COLS;
        widthInput.value = Math.min(widthInput.value || 1, COLS);
    }
    
    if (heightInput) {
        heightInput.max = ROWS;
        heightInput.value = Math.min(heightInput.value || 1, ROWS);
    }
}

/**
 * Obtém as dimensões atuais do inventário
 * @returns {Object} Dimensões {rows, cols}
 */
export function getInventoryDimensions() {
    return { rows: ROWS, cols: COLS };
}

/**
 * Verifica se uma posição está dentro dos limites do inventário
 * @param {number} x - Posição X
 * @param {number} y - Posição Y
 * @param {number} width - Largura do item
 * @param {number} height - Altura do item
 * @returns {boolean} True se a posição é válida
 */
export function isValidPosition(x, y, width, height) {
    return x >= 0 && y >= 0 && 
           x + width <= COLS && 
           y + height <= ROWS;
}
