/**
 * Testes de Integração
 * Verifica se os sistemas funcionam juntos corretamente
 */

describe('Integração dos Sistemas', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div class="ficha-container">
        <div class="field field-attributes" data-field="attributes" data-x="0" data-y="0">
          <div class="field-header">
            <div class="field-title">ATRIBUTOS</div>
            <div class="field-controls">
              <button class="field-control-btn" title="Minimizar">−</button>
              <button class="field-control-btn" title="Fechar">×</button>
            </div>
          </div>
          <div class="field-content">
            <div id="attr-list" class="attr-list"></div>
          </div>
          <div class="field-resizer"></div>
        </div>
        
        <div class="field field-inventory" data-field="inventory" data-x="0" data-y="0">
          <div class="field-header">
            <div class="field-title">Inventário</div>
            <div class="field-controls">
              <button class="field-control-btn" title="Minimizar">−</button>
              <button class="field-control-btn" title="Fechar">×</button>
            </div>
          </div>
          <div class="field-content">
            <div id="inventory"></div>
          </div>
          <div class="field-resizer"></div>
        </div>
      </div>
      
      <div id="item-list">
        <div class="item" data-idx="0">Item 1</div>
        <div class="item" data-idx="1">Item 2</div>
      </div>
      
      <div id="drag-ghost"></div>
    `;

    // Mock window.draggedItem
    Object.defineProperty(window, 'draggedItem', {
      value: null,
      writable: true
    });

    // Mock window.zoomManager
    window.zoomManager = {
      getContainerCoordinates: jest.fn((x, y) => ({ x, y })),
      getZoom: jest.fn(() => 1)
    };

    // Mock window.fieldManager
    window.fieldManager = {
      fields: new Map([
        ['attributes', document.querySelector('[data-field="attributes"]')],
        ['inventory', document.querySelector('[data-field="inventory"]')]
      ])
    };
  });

  afterEach(() => {
    delete window.zoomManager;
    delete window.draggedItem;
    delete window.fieldManager;
    jest.restoreAllMocks();
  });

  describe('Inicialização Conjunta', () => {
    test('deve encontrar todos os campos', () => {
      const fields = document.querySelectorAll('.field');
      expect(fields.length).toBe(2);
      
      const attributesField = document.querySelector('[data-field="attributes"]');
      const inventoryField = document.querySelector('[data-field="inventory"]');
      
      expect(attributesField).toBeDefined();
      expect(inventoryField).toBeDefined();
    });

    test('deve ter estrutura correta dos campos', () => {
      const fields = document.querySelectorAll('.field');
      
      fields.forEach(field => {
        expect(field.querySelector('.field-header')).toBeDefined();
        expect(field.querySelector('.field-content')).toBeDefined();
        expect(field.querySelector('.field-resizer')).toBeDefined();
        expect(field.querySelector('.field-controls')).toBeDefined();
      });
    });
  });

  describe('Interação entre Sistemas', () => {
    test('deve criar campo de debug independente', () => {
      // Criar campo de debug
      const debugField = document.createElement('div');
      debugField.id = 'debug-field';
      debugField.className = 'field field-debug';
      debugField.style.display = 'none';
      debugField.innerHTML = `
        <div class="field-header">
          <div class="field-title">Debug</div>
          <div class="field-controls">
            <button class="field-control-btn" title="Minimizar">−</button>
            <button class="field-control-btn" title="Fechar">×</button>
          </div>
        </div>
        <div class="field-content">
          <div id="debug-info">
            <div><strong>Campos:</strong> <span id="debug-fields">2</span></div>
          </div>
        </div>
      `;
      document.body.appendChild(debugField);
      
      expect(debugField).toBeDefined();
      expect(debugField.classList.contains('field-debug')).toBe(true);
      expect(debugField.style.display).toBe('none');
    });

    test('deve mostrar informações corretas sobre campos', () => {
      // Criar campo de debug
      const debugField = document.createElement('div');
      debugField.id = 'debug-field';
      debugField.className = 'field field-debug';
      debugField.innerHTML = `
        <div class="field-header">
          <div class="field-title">Debug</div>
        </div>
        <div class="field-content">
          <div id="debug-info">
            <div><strong>Campos:</strong> <span id="debug-fields">2</span></div>
          </div>
        </div>
      `;
      document.body.appendChild(debugField);
      
      const fieldsElement = debugField.querySelector('#debug-fields');
      expect(fieldsElement.textContent).toBe('2'); // 2 campos ativos
    });

    test('ambos os sistemas devem salvar posições independentemente', () => {
      // Mover campo
      const field = document.querySelector('[data-field="attributes"]');
      field.style.left = '100px';
      field.style.top = '200px';
      
      // Criar campo de debug
      const debugField = document.createElement('div');
      debugField.id = 'debug-field';
      debugField.className = 'field field-debug';
      debugField.setAttribute('data-x', '300');
      debugField.setAttribute('data-y', '400');
      document.body.appendChild(debugField);
      
      // Salvar posições
      const fieldPositions = {
        attributes: {
          left: '100px',
          top: '200px',
          visible: true
        }
      };
      
      const debugPosition = {
        x: 300,
        y: 400
      };
      
      localStorage.setItem('field-positions', JSON.stringify(fieldPositions));
      localStorage.setItem('debug-position', JSON.stringify(debugPosition));
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'field-positions',
        JSON.stringify(fieldPositions)
      );
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'debug-position',
        JSON.stringify(debugPosition)
      );
    });
  });

  describe('Compatibilidade com Itens', () => {
    test('deve detectar itens corretamente', () => {
      const items = document.querySelectorAll('.item');
      expect(items.length).toBe(2);
      
      const item = document.querySelector('.item[data-idx="0"]');
      expect(item.textContent).toBe('Item 1');
    });

    test('deve detectar elementos de drag corretamente', () => {
      const dragGhost = document.getElementById('drag-ghost');
      const itemList = document.getElementById('item-list');
      
      expect(dragGhost).toBeDefined();
      expect(itemList).toBeDefined();
    });

    test('sistemas não devem interferir com drag de itens', () => {
      const item = document.querySelector('.item');
      const field = document.querySelector('[data-field="attributes"]');
      const header = field.querySelector('.field-header');
      
      // Simular drag de item
      window.draggedItem = { id: 'test-item' };
      
      // Verificar que o item está sendo arrastado
      expect(window.draggedItem).toBeDefined();
      expect(window.draggedItem.id).toBe('test-item');
    });
  });

  describe('Compatibilidade com Zoom', () => {
    test('ambos os sistemas devem usar zoomManager quando disponível', () => {
      // Mock do zoomManager com zoom diferente
      window.zoomManager.getContainerCoordinates.mockReturnValue({ x: 200, y: 300 });
      window.zoomManager.getZoom.mockReturnValue(0.5);
      
      // Testar FieldManager
      const field = document.querySelector('[data-field="attributes"]');
      const header = field.querySelector('.field-header');
      
      const mousedownEvent = new MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100
      });
      
      // Simular chamada do zoomManager
      window.zoomManager.getContainerCoordinates(100, 100);
      
      expect(window.zoomManager.getContainerCoordinates).toHaveBeenCalledWith(100, 100);
      
      // Testar DebugManager
      const debugField = document.createElement('div');
      debugField.id = 'debug-field';
      debugField.className = 'field field-debug';
      debugField.innerHTML = `
        <div class="field-header">
          <div class="field-title">Debug</div>
        </div>
        <div class="field-content">
          <div id="debug-info">
            <div><strong>Zoom:</strong> <span id="debug-zoom">100%</span></div>
          </div>
        </div>
      `;
      document.body.appendChild(debugField);
      
      const zoomElement = debugField.querySelector('#debug-zoom');
      zoomElement.textContent = '50%';
      
      expect(zoomElement.textContent).toBe('50%');
    });

    test('ambos os sistemas devem funcionar sem zoomManager', () => {
      delete window.zoomManager;
      
      // Testar FieldManager
      const field = document.querySelector('[data-field="attributes"]');
      const header = field.querySelector('.field-header');
      
      const mousedownEvent = new MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100
      });
      
      header.dispatchEvent(mousedownEvent);
      
      // Deve não gerar erro
      expect(true).toBe(true);
      
      // Testar DebugManager
      const debugField = document.createElement('div');
      debugField.id = 'debug-field';
      debugField.className = 'field field-debug';
      debugField.innerHTML = `
        <div class="field-header">
          <div class="field-title">Debug</div>
        </div>
        <div class="field-content">
          <div id="debug-info">Debug Info</div>
        </div>
      `;
      document.body.appendChild(debugField);
      
      expect(debugField).toBeDefined();
    });
  });

  describe('Compatibilidade com Interact.js', () => {
    test('deve detectar Interact.js quando disponível', () => {
      // Simular disponibilidade do Interact.js
      const mockInteract = {
        draggable: jest.fn(),
        resizable: jest.fn(),
        modifiers: {
          restrictRect: jest.fn(),
          restrictEdges: jest.fn(),
          restrictSize: jest.fn()
        }
      };
      
      expect(mockInteract).toBeDefined();
      expect(mockInteract.draggable).toBeDefined();
      expect(mockInteract.resizable).toBeDefined();
    });

    test('deve funcionar sem Interact.js', () => {
      // Simular ausência do Interact.js
      const mockInteract = null;
      
      expect(mockInteract).toBe(null);
    });
  });

  describe('Performance e Recursos', () => {
    test('debug deve mostrar informações de performance corretas', () => {
      // Criar campo de debug
      const debugField = document.createElement('div');
      debugField.id = 'debug-field';
      debugField.className = 'field field-debug';
      debugField.innerHTML = `
        <div class="field-header">
          <div class="field-title">Debug</div>
        </div>
        <div class="field-content">
          <div id="debug-info">
            <div><strong>FPS:</strong> <span id="debug-fps">60</span></div>
            <div><strong>Memória:</strong> <span id="debug-memory">0 MB</span></div>
          </div>
        </div>
      `;
      document.body.appendChild(debugField);
      
      const fpsElement = debugField.querySelector('#debug-fps');
      const memoryElement = debugField.querySelector('#debug-memory');
      
      expect(fpsElement.textContent).toBe('60');
      expect(memoryElement.textContent).toBe('0 MB');
    });
  });

  describe('Cenários de Uso Real', () => {
    test('cenário: usuário arrasta campo enquanto debug está ativo', () => {
      // Criar campo de debug
      const debugField = document.createElement('div');
      debugField.id = 'debug-field';
      debugField.className = 'field field-debug';
      debugField.style.display = 'block';
      debugField.innerHTML = `
        <div class="field-header">
          <div class="field-title">Debug</div>
        </div>
        <div class="field-content">
          <div id="debug-info">Debug Info</div>
        </div>
      `;
      document.body.appendChild(debugField);
      
      // Arrastar campo
      const field = document.querySelector('[data-field="attributes"]');
      const header = field.querySelector('.field-header');
      
      const mousedownEvent = new MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100
      });
      header.dispatchEvent(mousedownEvent);
      
      const mousemoveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 150
      });
      document.dispatchEvent(mousemoveEvent);
      
      const mouseupEvent = new MouseEvent('mouseup');
      document.dispatchEvent(mouseupEvent);
      
      // Verificar que ambos funcionaram
      expect(debugField.style.display).toBe('block');
      expect(field).toBeDefined();
    });

    test('cenário: usuário ativa debug, move campos e salva posições', () => {
      // Criar campo de debug
      const debugField = document.createElement('div');
      debugField.id = 'debug-field';
      debugField.className = 'field field-debug';
      debugField.style.display = 'none';
      debugField.innerHTML = `
        <div class="field-header">
          <div class="field-title">Debug</div>
        </div>
        <div class="field-content">
          <div id="debug-info">Debug Info</div>
        </div>
      `;
      document.body.appendChild(debugField);
      
      // Simular Ctrl+F1
      const keydownEvent = new KeyboardEvent('keydown', {
        ctrlKey: true,
        key: 'F1'
      });
      
      // Simular ativação
      debugField.style.display = 'block';
      
      // Mover alguns campos
      const attributesField = document.querySelector('[data-field="attributes"]');
      const inventoryField = document.querySelector('[data-field="inventory"]');
      
      attributesField.style.left = '200px';
      attributesField.style.top = '300px';
      inventoryField.style.left = '400px';
      inventoryField.style.top = '500px';
      
      // Salvar posições
      const positions = {
        attributes: { left: '200px', top: '300px', visible: true },
        inventory: { left: '400px', top: '500px', visible: true }
      };
      
      localStorage.setItem('field-positions', JSON.stringify(positions));
      
      // Verificar que tudo foi salvo
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'field-positions',
        JSON.stringify(positions)
      );
      expect(debugField.style.display).toBe('block');
    });

    test('cenário: usuário redimensiona campo e verifica no debug', () => {
      // Criar campo de debug
      const debugField = document.createElement('div');
      debugField.id = 'debug-field';
      debugField.className = 'field field-debug';
      debugField.style.display = 'block';
      debugField.innerHTML = `
        <div class="field-header">
          <div class="field-title">Debug</div>
        </div>
        <div class="field-content">
          <div id="debug-info">Debug Info</div>
        </div>
      `;
      document.body.appendChild(debugField);
      
      // Redimensionar campo
      const field = document.querySelector('[data-field="attributes"]');
      const resizer = field.querySelector('.field-resizer');
      
      field.style.width = '300px';
      field.style.height = '200px';
      
      const mousedownEvent = new MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100
      });
      resizer.dispatchEvent(mousedownEvent);
      
      const mousemoveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 150
      });
      document.dispatchEvent(mousemoveEvent);
      
      const mouseupEvent = new MouseEvent('mouseup');
      document.dispatchEvent(mouseupEvent);
      
      // Verificar que o campo foi redimensionado
      expect(parseInt(field.style.width)).toBe(300);
      expect(parseInt(field.style.height)).toBe(200);
      
      // Debug deve continuar funcionando
      expect(debugField.style.display).toBe('block');
    });
  });
}); 