export const ROWS = 6;
export const COLS = 10;
export const CELL_SIZE = 40; // tamanho base em px
export const CELL_GAP = 3;  // espaçamento em px

export function applyLayoutSettings() {
    const root = document.documentElement;
    root.style.setProperty('--rows', ROWS);
    root.style.setProperty('--cols', COLS);
    root.style.setProperty('--cell-size', `${CELL_SIZE}px`);
    root.style.setProperty('--cell-gap', `${CELL_GAP}px`);

    const widthInput = document.getElementById('largura');
    const heightInput = document.getElementById('altura');
    if (widthInput) widthInput.max = COLS;
    if (heightInput) heightInput.max = ROWS;
}
