export const ROWS = 6;
export const COLS = 10;
export const CELL_SIZE = 40; // tamanho base em px
export const CELL_GAP = 3;  // espaçamento em px

export function getCellSize() {
    const value = getComputedStyle(document.documentElement).getPropertyValue('--cell-size');
    return parseFloat(value);
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
