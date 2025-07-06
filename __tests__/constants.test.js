/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let constants;

beforeAll(() => {
  const codePath = path.join(__dirname, '../public/js/constants.js');
  let code = fs.readFileSync(codePath, 'utf8');
  code = code
    .replace(/export\s+let\s+/g, 'var ')
    .replace(/export\s+const\s+/g, 'var ')
    .replace(/export\s+function\s+/g, 'function ');
  const context = { document: window.document, window };
  vm.createContext(context);
  vm.runInContext(code, context);
  constants = {
    get ROWS() { return context.ROWS; },
    get COLS() { return context.COLS; },
    CELL_SIZE: context.CELL_SIZE,
    CELL_GAP: context.CELL_GAP,
    getCellSize: context.getCellSize,
    applyLayoutSettings: context.applyLayoutSettings,
    setInventorySize: context.setInventorySize,
    calcDefaultSize: context.calcDefaultSize
  };
});

test('calcDefaultSize computes correctly', () => {
  const res = constants.calcDefaultSize({ forca: 8, inteligencia: 12, determinacao: 1 });
  expect(res).toEqual({ rows: 5, cols: 7 });
});

test('setInventorySize updates variables and css', () => {
  constants.setInventorySize(4, 5);
  expect(constants.ROWS).toBe(4);
  expect(constants.COLS).toBe(5);
  const root = document.documentElement.style;
  expect(root.getPropertyValue('--rows')).toBe('4');
  expect(root.getPropertyValue('--cols')).toBe('5');
});
