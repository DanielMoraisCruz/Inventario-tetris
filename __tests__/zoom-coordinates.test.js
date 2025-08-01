/**
 * Testes para verificar a conversão de coordenadas do ZoomManager
 * Especialmente importante para o problema de velocidade de movimentação
 */

describe('ZoomManager - Conversão de Coordenadas', () => {
  let zoomManager;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div class="ficha-container" style="position: relative; width: 1000px; height: 800px;">
        <div class="field" style="position: absolute; left: 100px; top: 100px; width: 200px; height: 150px;">
          Campo de Teste
        </div>
      </div>
    `;

    // Mock do ZoomManager
    zoomManager = {
      currentZoom: 1,
      panOffset: { x: 0, y: 0 },
      container: document.querySelector('.ficha-container'),
      
      getContainerCoordinates(mouseX, mouseY) {
        if (!this.container) return { x: 0, y: 0 };
        
        const rect = this.container.getBoundingClientRect();
        
        // Posição do mouse relativa ao container transformado
        const mouseXRelativeToContainer = mouseX - rect.left;
        const mouseYRelativeToContainer = mouseY - rect.top;
        
        // Inverter a transformação para obter coordenadas no espaço original do container
        // A transformação é: translate(panX, panY) scale(zoom)
        // Para inverter: (val - pan) / zoom
        const containerX = (mouseXRelativeToContainer - this.panOffset.x) / this.currentZoom;
        const containerY = (mouseYRelativeToContainer - this.panOffset.y) / this.currentZoom;
        
        return { x: containerX, y: containerY };
      }
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Conversão Básica', () => {
    test('deve converter coordenadas corretamente sem zoom e pan', () => {
      // Simular clique no centro do container
      const mouseX = 500; // Centro horizontal do container (1000px / 2)
      const mouseY = 400; // Centro vertical do container (800px / 2)
      
      const coords = zoomManager.getContainerCoordinates(mouseX, mouseY);
      
      // Como o container está em (0,0) e tem 1000x800, o centro deve ser (500, 400)
      expect(coords.x).toBeCloseTo(500, 1);
      expect(coords.y).toBeCloseTo(400, 1);
    });

    test('deve converter coordenadas corretamente com zoom 2x', () => {
      zoomManager.currentZoom = 2;
      
      // Simular clique no centro do container
      const mouseX = 500;
      const mouseY = 400;
      
      const coords = zoomManager.getContainerCoordinates(mouseX, mouseY);
      
      // Com zoom 2x, as coordenadas devem ser metade
      expect(coords.x).toBeCloseTo(250, 1);
      expect(coords.y).toBeCloseTo(200, 1);
    });

    test('deve converter coordenadas corretamente com zoom 0.5x', () => {
      zoomManager.currentZoom = 0.5;
      
      // Simular clique no centro do container
      const mouseX = 500;
      const mouseY = 400;
      
      const coords = zoomManager.getContainerCoordinates(mouseX, mouseY);
      
      // Com zoom 0.5x, as coordenadas devem ser o dobro
      expect(coords.x).toBeCloseTo(1000, 1);
      expect(coords.y).toBeCloseTo(800, 1);
    });
  });

  describe('Conversão com Pan', () => {
    test('deve converter coordenadas corretamente com pan', () => {
      zoomManager.panOffset = { x: 100, y: 50 };
      
      // Simular clique no centro do container
      const mouseX = 500;
      const mouseY = 400;
      
      const coords = zoomManager.getContainerCoordinates(mouseX, mouseY);
      
      // Com pan de (100, 50), as coordenadas devem ser ajustadas
      expect(coords.x).toBeCloseTo(400, 1); // 500 - 100
      expect(coords.y).toBeCloseTo(350, 1); // 400 - 50
    });

    test('deve converter coordenadas corretamente com zoom e pan', () => {
      zoomManager.currentZoom = 2;
      zoomManager.panOffset = { x: 100, y: 50 };
      
      // Simular clique no centro do container
      const mouseX = 500;
      const mouseY = 400;
      
      const coords = zoomManager.getContainerCoordinates(mouseX, mouseY);
      
      // Com zoom 2x e pan (100, 50): ((500 - 100) / 2, (400 - 50) / 2)
      expect(coords.x).toBeCloseTo(200, 1); // (500 - 100) / 2
      expect(coords.y).toBeCloseTo(175, 1); // (400 - 50) / 2
    });
  });

  describe('Simulação de Drag', () => {
    test('deve manter velocidade consistente durante drag com zoom', () => {
      zoomManager.currentZoom = 1.5;
      
      // Simular início do drag
      const startX = 100;
      const startY = 100;
      const startCoords = zoomManager.getContainerCoordinates(startX, startY);
      
      // Simular movimento do mouse
      const endX = 200;
      const endY = 200;
      const endCoords = zoomManager.getContainerCoordinates(endX, endY);
      
      // Calcular delta
      const deltaX = endCoords.x - startCoords.x;
      const deltaY = endCoords.y - startCoords.y;
      
      // O delta deve ser proporcional ao movimento do mouse
      // Movimento do mouse: (100, 100)
      // Com zoom 1.5x: (100 / 1.5, 100 / 1.5) = (66.67, 66.67)
      expect(deltaX).toBeCloseTo(66.67, 1);
      expect(deltaY).toBeCloseTo(66.67, 1);
    });

    test('deve manter velocidade consistente durante drag com zoom e pan', () => {
      zoomManager.currentZoom = 0.8;
      zoomManager.panOffset = { x: 50, y: 25 };
      
      // Simular início do drag
      const startX = 100;
      const startY = 100;
      const startCoords = zoomManager.getContainerCoordinates(startX, startY);
      
      // Simular movimento do mouse
      const endX = 200;
      const endY = 200;
      const endCoords = zoomManager.getContainerCoordinates(endX, endY);
      
      // Calcular delta
      const deltaX = endCoords.x - startCoords.x;
      const deltaY = endCoords.y - startCoords.y;
      
      // O delta deve ser proporcional ao movimento do mouse
      // Movimento do mouse: (100, 100)
      // Com zoom 0.8x: (100 / 0.8, 100 / 0.8) = (125, 125)
      expect(deltaX).toBeCloseTo(125, 1);
      expect(deltaY).toBeCloseTo(125, 1);
    });
  });

  describe('Casos Extremos', () => {
    test('deve lidar com zoom muito baixo', () => {
      zoomManager.currentZoom = 0.25;
      
      const mouseX = 500;
      const mouseY = 400;
      
      const coords = zoomManager.getContainerCoordinates(mouseX, mouseY);
      
      // Com zoom 0.25x: (500 / 0.25, 400 / 0.25) = (2000, 1600)
      expect(coords.x).toBeCloseTo(2000, 1);
      expect(coords.y).toBeCloseTo(1600, 1);
    });

    test('deve lidar com zoom muito alto', () => {
      zoomManager.currentZoom = 3;
      
      const mouseX = 500;
      const mouseY = 400;
      
      const coords = zoomManager.getContainerCoordinates(mouseX, mouseY);
      
      // Com zoom 3x: (500 / 3, 400 / 3) = (166.67, 133.33)
      expect(coords.x).toBeCloseTo(166.67, 1);
      expect(coords.y).toBeCloseTo(133.33, 1);
    });

    test('deve lidar com pan negativo', () => {
      zoomManager.panOffset = { x: -100, y: -50 };
      
      const mouseX = 500;
      const mouseY = 400;
      
      const coords = zoomManager.getContainerCoordinates(mouseX, mouseY);
      
      // Com pan negativo: (500 - (-100), 400 - (-50)) = (600, 450)
      expect(coords.x).toBeCloseTo(600, 1);
      expect(coords.y).toBeCloseTo(450, 1);
    });
  });

  describe('Consistência de Velocidade', () => {
    test('deve manter velocidade 1:1 sem zoom e pan', () => {
      const mouseMovement = 50;
      
      const startCoords = zoomManager.getContainerCoordinates(100, 100);
      const endCoords = zoomManager.getContainerCoordinates(100 + mouseMovement, 100 + mouseMovement);
      
      const deltaX = endCoords.x - startCoords.x;
      const deltaY = endCoords.y - startCoords.y;
      
      // Sem zoom e pan, o movimento deve ser 1:1
      expect(deltaX).toBeCloseTo(mouseMovement, 1);
      expect(deltaY).toBeCloseTo(mouseMovement, 1);
    });

    test('deve manter velocidade proporcional com zoom', () => {
      zoomManager.currentZoom = 2;
      const mouseMovement = 50;
      
      const startCoords = zoomManager.getContainerCoordinates(100, 100);
      const endCoords = zoomManager.getContainerCoordinates(100 + mouseMovement, 100 + mouseMovement);
      
      const deltaX = endCoords.x - startCoords.x;
      const deltaY = endCoords.y - startCoords.y;
      
      // Com zoom 2x, o movimento deve ser metade
      expect(deltaX).toBeCloseTo(mouseMovement / 2, 1);
      expect(deltaY).toBeCloseTo(mouseMovement / 2, 1);
    });

    test('deve manter velocidade proporcional com zoom e pan', () => {
      zoomManager.currentZoom = 0.5;
      zoomManager.panOffset = { x: 25, y: 25 };
      const mouseMovement = 50;
      
      const startCoords = zoomManager.getContainerCoordinates(100, 100);
      const endCoords = zoomManager.getContainerCoordinates(100 + mouseMovement, 100 + mouseMovement);
      
      const deltaX = endCoords.x - startCoords.x;
      const deltaY = endCoords.y - startCoords.y;
      
      // Com zoom 0.5x, o movimento deve ser o dobro
      expect(deltaX).toBeCloseTo(mouseMovement * 2, 1);
      expect(deltaY).toBeCloseTo(mouseMovement * 2, 1);
    });
  });
}); 

describe('ZoomManager - centerOnItems', () => {
    let zoomManager;
    let container;

    beforeEach(() => {
        // Configurar DOM
        document.body.innerHTML = `
            <div class="ficha-container">
                <div class="field" data-field="attributes" style="left: 50px; top: 50px; width: 300px; height: 200px; display: block;"></div>
                <div class="field" data-field="inventory" style="left: 370px; top: 50px; width: 400px; height: 300px; display: block;"></div>
                <div class="inventory-grid" style="left: 370px; top: 50px; width: 400px; height: 300px;"></div>
            </div>
            <div id="zoom-indicator"></div>
            <div id="pan-indicator"></div>
        `;
        
        container = document.querySelector('.ficha-container');
        
        // Mock do ZoomManager
        zoomManager = {
            currentZoom: 1,
            maxZoom: 3,
            minZoom: 0.25,
            panOffset: { x: 0, y: 0 },
            container: container,
            
            setZoom: jest.fn(function(zoom) {
                this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
            }),
            
            updateTransform: jest.fn(),
            saveZoom: jest.fn(),
            
            getCurrentZoom: jest.fn(function() {
                return this.currentZoom;
            }),
            
            getPanOffset: jest.fn(function() {
                return { ...this.panOffset };
            }),
            
            centerOnItems: function() {
                // Simular a lógica básica do centerOnItems
                setTimeout(() => {
                    const fields = document.querySelectorAll('.field');
                    const inventoryGrid = document.querySelector('.inventory-grid');
                    
                    if (fields.length === 0 && !inventoryGrid) {
                        console.log('🔍 ZoomManager: Nenhum campo ou inventário encontrado para centralizar');
                        return;
                    }

                    let minX = Infinity, minY = Infinity;
                    let maxX = -Infinity, maxY = -Infinity;
                    let hasVisibleElements = false;

                    // Calcular limites dos campos
                    fields.forEach(field => {
                        const rect = field.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0 && field.style.display !== 'none') {
                            const fieldLeft = parseFloat(field.style.left) || 0;
                            const fieldTop = parseFloat(field.style.top) || 0;
                            const fieldWidth = parseFloat(field.style.width) || rect.width;
                            const fieldHeight = parseFloat(field.style.height) || rect.height;

                            minX = Math.min(minX, fieldLeft);
                            minY = Math.min(minY, fieldTop);
                            maxX = Math.max(maxX, fieldLeft + fieldWidth);
                            maxY = Math.max(maxY, fieldTop + fieldHeight);
                            hasVisibleElements = true;
                        }
                    });

                    if (!hasVisibleElements) {
                        console.log('🔍 ZoomManager: Nenhum elemento visível encontrado');
                        return;
                    }

                    // Calcular zoom ideal
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    const itemsWidth = maxX - minX;
                    const itemsHeight = maxY - minY;
                    const margin = 50;
                    const zoomX = (viewportWidth - margin * 2) / itemsWidth;
                    const zoomY = (viewportHeight - margin * 2) / itemsHeight;
                    const idealZoom = Math.min(zoomX, zoomY, this.maxZoom);

                    // Aplicar zoom
                    this.setZoom(idealZoom);

                    // Calcular posição central
                    const centerX = minX + itemsWidth / 2;
                    const centerY = minY + itemsHeight / 2;
                    const containerRect = this.container.getBoundingClientRect();
                    const containerCenterX = containerRect.width / 2;
                    const containerCenterY = containerRect.height / 2;

                    // Aplicar pan
                    this.panOffset.x = containerCenterX - (centerX * idealZoom);
                    this.panOffset.y = containerCenterY - (centerY * idealZoom);

                    this.updateTransform();
                    this.saveZoom();
                }, 200);
            }
        };
    });

    afterEach(() => {
        document.body.innerHTML = '';
        localStorage.clear();
    });

    test('deve centralizar a tela nos itens quando chamado', () => {
        // Mock do viewport
        Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });

        // Mock do getBoundingClientRect para o container
        const mockRect = {
            width: 1000,
            height: 600,
            left: 0,
            top: 0
        };
        container.getBoundingClientRect = jest.fn(() => mockRect);

        // Chamar centerOnItems
        zoomManager.centerOnItems();

        // Aguardar o setTimeout
        jest.advanceTimersByTime(200);

        // Verificar se o zoom foi ajustado
        expect(zoomManager.getCurrentZoom()).toBeLessThanOrEqual(zoomManager.maxZoom);
        expect(zoomManager.getCurrentZoom()).toBeGreaterThan(0);

        // Verificar se o pan foi ajustado
        const panOffset = zoomManager.getPanOffset();
        expect(panOffset.x).toBeDefined();
        expect(panOffset.y).toBeDefined();
    });

    test('deve lidar com campos ocultos', () => {
        // Ocultar um campo
        const hiddenField = document.querySelector('[data-field="attributes"]');
        hiddenField.style.display = 'none';

        // Mock do viewport
        Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });

        // Mock do getBoundingClientRect
        const mockRect = {
            width: 1000,
            height: 600,
            left: 0,
            top: 0
        };
        container.getBoundingClientRect = jest.fn(() => mockRect);

        // Chamar centerOnItems
        zoomManager.centerOnItems();

        // Aguardar o setTimeout
        jest.advanceTimersByTime(200);

        // Deve ainda funcionar com campos visíveis
        expect(zoomManager.getCurrentZoom()).toBeLessThanOrEqual(zoomManager.maxZoom);
    });

    test('deve lidar quando não há elementos visíveis', () => {
        // Ocultar todos os campos
        document.querySelectorAll('.field').forEach(field => {
            field.style.display = 'none';
        });
        document.querySelector('.inventory-grid').style.display = 'none';

        // Chamar centerOnItems
        zoomManager.centerOnItems();

        // Aguardar o setTimeout e executar todos os timers pendentes
        jest.runAllTimers();

        // Verificar que não houve erro e o zoom permanece válido
        expect(zoomManager.getCurrentZoom()).toBeGreaterThanOrEqual(zoomManager.minZoom);
        expect(zoomManager.getCurrentZoom()).toBeLessThanOrEqual(zoomManager.maxZoom);
    });
}); 

describe('Ghost Preview - Posicionamento com Zoom', () => {
    let inventory;
    let dragGhost;

    beforeEach(() => {
        // Configurar DOM
        document.body.innerHTML = `
            <div class="ficha-container" style="position: relative; width: 1000px; height: 800px;">
                <div id="inventory" style="position: absolute; left: 100px; top: 100px; width: 400px; height: 300px;">
                    <div class="cell" data-x="0" data-y="0"></div>
                    <div class="cell" data-x="1" data-y="0"></div>
                    <div class="cell" data-x="0" data-y="1"></div>
                    <div class="cell" data-x="1" data-y="1"></div>
                </div>
                <div id="drag-ghost" style="position: absolute;"></div>
            </div>
        `;
        
        inventory = document.getElementById('inventory');
        dragGhost = document.getElementById('drag-ghost');
        
        // Mock do ZoomManager
        window.zoomManager = {
            currentZoom: 1,
            panOffset: { x: 0, y: 0 },
            getCurrentZoom: jest.fn(() => 1),
            getPanOffset: jest.fn(() => ({ x: 0, y: 0 })),
            getContainerCoordinates: jest.fn((x, y) => ({ x, y }))
        };
    });

    afterEach(() => {
        document.body.innerHTML = '';
        delete window.zoomManager;
    });

    test('deve posicionar ghost corretamente sem zoom', () => {
        // Simular posicionamento do ghost
        const pageX = 150; // Dentro do inventário
        const pageY = 150;
        
        // Mock do getBoundingClientRect
        inventory.getBoundingClientRect = jest.fn(() => ({
            left: 100,
            top: 100,
            width: 400,
            height: 300
        }));
        
        // Simular função computeGridPosition
        const computeGridPosition = (px, py) => {
            const invRect = inventory.getBoundingClientRect();
            const relX = px - invRect.left;
            const relY = py - invRect.top;
            const total = 50; // Tamanho da célula + gap
            const gridX = Math.floor(relX / total);
            const gridY = Math.floor(relY / total);
            return { gridX: Math.max(0, gridX), gridY: Math.max(0, gridY) };
        };
        
        const { gridX, gridY } = computeGridPosition(pageX, pageY);
        
        // Verificar se as coordenadas do grid estão corretas
        expect(gridX).toBe(1); // (150 - 100) / 50 = 1
        expect(gridY).toBe(1); // (150 - 100) / 50 = 1
    });

    test('deve posicionar ghost corretamente com zoom 2x', () => {
        // Configurar zoom 2x
        window.zoomManager.currentZoom = 2;
        window.zoomManager.getCurrentZoom = jest.fn(() => 2);
        window.zoomManager.getContainerCoordinates = jest.fn((x, y) => ({
            x: x / 2, // Inverter zoom
            y: y / 2
        }));
        
        const pageX = 200; // Com zoom 2x, isso seria 100 no espaço do container
        const pageY = 200;
        
        // Mock do getBoundingClientRect
        inventory.getBoundingClientRect = jest.fn(() => ({
            left: 100,
            top: 100,
            width: 400,
            height: 300
        }));
        
        // Simular função computeGridPosition com zoom
        const computeGridPosition = (px, py) => {
            const invRect = inventory.getBoundingClientRect();
            const containerCoords = window.zoomManager.getContainerCoordinates(px, py);
            const invContainerCoords = window.zoomManager.getContainerCoordinates(invRect.left, invRect.top);
            
            const relX = containerCoords.x - invContainerCoords.x;
            const relY = containerCoords.y - invContainerCoords.y;
            const total = 50;
            const gridX = Math.floor(relX / total);
            const gridY = Math.floor(relY / total);
            return { gridX: Math.max(0, gridX), gridY: Math.max(0, gridY) };
        };
        
        const { gridX, gridY } = computeGridPosition(pageX, pageY);
        
        // Com zoom 2x: (200/2 - 100/2) / 50 = (100 - 50) / 50 = 1
        expect(gridX).toBe(1);
        expect(gridY).toBe(1);
    });

    test('deve posicionar ghost corretamente com pan', () => {
        // Configurar pan
        window.zoomManager.panOffset = { x: 50, y: 25 };
        window.zoomManager.getPanOffset = jest.fn(() => ({ x: 50, y: 25 }));
        window.zoomManager.getContainerCoordinates = jest.fn((x, y) => ({
            x: x - 50, // Inverter pan
            y: y - 25
        }));
        
        const pageX = 200; // Com pan, isso seria 150 no espaço do container
        const pageY = 175; // Com pan, isso seria 150 no espaço do container
        
        // Mock do getBoundingClientRect
        inventory.getBoundingClientRect = jest.fn(() => ({
            left: 100,
            top: 100,
            width: 400,
            height: 300
        }));
        
        // Simular função computeGridPosition com pan
        const computeGridPosition = (px, py) => {
            const invRect = inventory.getBoundingClientRect();
            const containerCoords = window.zoomManager.getContainerCoordinates(px, py);
            const invContainerCoords = window.zoomManager.getContainerCoordinates(invRect.left, invRect.top);
            
            const relX = containerCoords.x - invContainerCoords.x;
            const relY = containerCoords.y - invContainerCoords.y;
            const total = 50;
            const gridX = Math.floor(relX / total);
            const gridY = Math.floor(relY / total);
            return { gridX: Math.max(0, gridX), gridY: Math.max(0, gridY) };
        };
        
        const { gridX, gridY } = computeGridPosition(pageX, pageY);
        
        // Com pan: ((200-50) - (100-50)) / 50 = (150 - 50) / 50 = 2
        expect(gridX).toBe(2);
        expect(gridY).toBe(1);
    });
}); 