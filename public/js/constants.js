export let ROWS = 6;
export let COLS = 10;
export const CELL_SIZE = 40; // tamanho base em px
export const CELL_GAP = 3;  // espaçamento em px

export function setInventorySize(rows, cols) {
    ROWS = rows;
    COLS = cols;
    applyLayoutSettings();
}

export function calcDefaultSize({ forca, inteligencia, determinacao }) {
    const cols = Math.max(3, Math.floor(inteligencia / 2) + determinacao);
    const rows = Math.max(3, Math.floor(forca / 2) + determinacao);
    return { rows, cols };
}

export function getCellSize() {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--cell-size').trim();
    const num = parseFloat(value);
    if (value.endsWith('rem')) {
        const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        return num * rootSize;
    }
    return num;
}

export function applyLayoutSettings() {
    const root = document.documentElement;
    root.style.setProperty('--rows', ROWS);
    root.style.setProperty('--cols', COLS);
    root.style.setProperty('--cell-size', `${CELL_SIZE / 16}rem`);
    root.style.setProperty('--cell-gap', `${CELL_GAP / 16}rem`);

    const widthInput = document.getElementById('largura');
    const heightInput = document.getElementById('altura');
    if (widthInput) widthInput.max = COLS;
    if (heightInput) heightInput.max = ROWS;
}
