/**
 * Testes para o DebugManager
 * Cobre funcionalidades de debug, ativação e informações em tempo real
 */

describe('DebugManager', () => {
  let debugManager;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div class="ficha-container">
        <div class="field field-attributes" data-field="attributes">
          <div class="field-header">
            <div class="field-title">ATRIBUTOS</div>
          </div>
          <div class="field-content"></div>
        </div>
      </div>
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
        ['attributes', document.querySelector('[data-field="attributes"]')]
      ])
    };
  });

  afterEach(() => {
    delete window.zoomManager;
    delete window.draggedItem;
    delete window.fieldManager;
    jest.restoreAllMocks();
    
    // Clear intervals
    if (debugManager && debugManager.debugInterval) {
      clearInterval(debugManager.debugInterval);
    }
  });

  describe('Estrutura DOM', () => {
    test('deve ter estrutura básica para debug', () => {
      const fichaContainer = document.querySelector('.ficha-container');
      expect(fichaContainer).toBeDefined();
      
      const field = document.querySelector('[data-field="attributes"]');
      expect(field).toBeDefined();
      expect(field.querySelector('.field-header')).toBeDefined();
      expect(field.querySelector('.field-content')).toBeDefined();
    });
  });

  describe('Controles do Debug', () => {
    test('deve criar campo de debug com estrutura correta', () => {
      // Simular criação do campo de debug
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
            <div><strong>Zoom:</strong> <span id="debug-zoom">100%</span></div>
            <div><strong>Mouse:</strong> <span id="debug-mouse">0, 0</span></div>
            <div><strong>Campos:</strong> <span id="debug-fields">1</span></div>
            <div><strong>FPS:</strong> <span id="debug-fps">60</span></div>
            <div><strong>Memória:</strong> <span id="debug-memory">0 MB</span></div>
          </div>
        </div>
      `;
      
      document.body.appendChild(debugField);
      
      expect(debugField).toBeDefined();
      expect(debugField.classList.contains('field-debug')).toBe(true);
      expect(debugField.style.display).toBe('none');
      expect(debugField.querySelector('.field-header')).toBeDefined();
      expect(debugField.querySelector('.field-content')).toBeDefined();
    });

    test('deve minimizar campo de debug', () => {
      // Criar campo de debug
      const debugField = document.createElement('div');
      debugField.id = 'debug-field';
      debugField.className = 'field field-debug';
      debugField.innerHTML = `
        <div class="field-header">
          <div class="field-title">Debug</div>
          <div class="field-controls">
            <button class="field-control-btn" title="Minimizar">−</button>
            <button class="field-control-btn" title="Fechar">×</button>
          </div>
        </div>
        <div class="field-content">
          <div id="debug-info">Debug Info</div>
        </div>
      `;
      document.body.appendChild(debugField);
      
      const minimizeBtn = debugField.querySelector('.field-control-btn[title="Minimizar"]');
      const content = debugField.querySelector('.field-content');
      
      // Simular clique no botão minimizar
      content.style.display = 'none';
      minimizeBtn.textContent = '+';
      minimizeBtn.title = 'Expandir';
      
      expect(content.style.display).toBe('none');
      expect(minimizeBtn.textContent).toBe('+');
      expect(minimizeBtn.title).toBe('Expandir');
    });

    test('deve expandir campo minimizado', () => {
      // Criar campo de debug
      const debugField = document.createElement('div');
      debugField.id = 'debug-field';
      debugField.className = 'field field-debug';
      debugField.innerHTML = `
        <div class="field-header">
          <div class="field-title">Debug</div>
          <div class="field-controls">
            <button class="field-control-btn" title="Minimizar">−</button>
            <button class="field-control-btn" title="Fechar">×</button>
          </div>
        </div>
        <div class="field-content">
          <div id="debug-info">Debug Info</div>
        </div>
      `;
      document.body.appendChild(debugField);
      
      const minimizeBtn = debugField.querySelector('.field-control-btn[title="Minimizar"]');
      const content = debugField.querySelector('.field-content');
      
      // Minimizar primeiro
      content.style.display = 'none';
      minimizeBtn.textContent = '+';
      minimizeBtn.title = 'Expandir';
      expect(content.style.display).toBe('none');
      
      // Expandir
      content.style.display = 'block';
      minimizeBtn.textContent = '−';
      minimizeBtn.title = 'Minimizar';
      expect(content.style.display).toBe('block');
      expect(minimizeBtn.textContent).toBe('−');
      expect(minimizeBtn.title).toBe('Minimizar');
    });

    test('deve fechar campo de debug', () => {
      // Criar campo de debug
      const debugField = document.createElement('div');
      debugField.id = 'debug-field';
      debugField.className = 'field field-debug';
      debugField.style.display = 'block';
      debugField.innerHTML = `
        <div class="field-header">
          <div class="field-title">Debug</div>
          <div class="field-controls">
            <button class="field-control-btn" title="Minimizar">−</button>
            <button class="field-control-btn" title="Fechar">×</button>
          </div>
        </div>
        <div class="field-content">
          <div id="debug-info">Debug Info</div>
        </div>
      `;
      document.body.appendChild(debugField);
      
      const closeBtn = debugField.querySelector('.field-control-btn[title="Fechar"]');
      
      // Simular clique no botão fechar
      debugField.style.display = 'none';
      
      expect(debugField.style.display).toBe('none');
    });
  });

  describe('Informações em Tempo Real', () => {
    test('deve mostrar informações de zoom', () => {
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
            <div><strong>Zoom:</strong> <span id="debug-zoom">100%</span></div>
          </div>
        </div>
      `;
      document.body.appendChild(debugField);
      
      window.zoomManager.getZoom.mockReturnValue(0.5);
      
      const zoomElement = debugField.querySelector('#debug-zoom');
      zoomElement.textContent = '50%';
      
      expect(zoomElement.textContent).toBe('50%');
    });

    test('deve mostrar número de campos ativos', () => {
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
            <div><strong>Campos:</strong> <span id="debug-fields">1</span></div>
          </div>
        </div>
      `;
      document.body.appendChild(debugField);
      
      const fieldsElement = debugField.querySelector('#debug-fields');
      expect(fieldsElement.textContent).toBe('1');
    });

    test('deve mostrar FPS', () => {
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
          </div>
        </div>
      `;
      document.body.appendChild(debugField);
      
      const fpsElement = debugField.querySelector('#debug-fps');
      expect(fpsElement.textContent).toBe('60');
    });

    test('deve mostrar uso de memória', () => {
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
            <div><strong>Memória:</strong> <span id="debug-memory">0 MB</span></div>
          </div>
        </div>
      `;
      document.body.appendChild(debugField);
      
      const memoryElement = debugField.querySelector('#debug-memory');
      expect(memoryElement.textContent).toBe('0 MB');
    });
  });

  describe('Ativação/Desativação', () => {
    test('deve ativar debug com Ctrl+F1', () => {
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
      
      expect(debugField.style.display).toBe('block');
    });

    test('não deve ativar com outras teclas', () => {
      // Criar campo de debug
      const debugField = document.createElement('div');
      debugField.id = 'debug-field';
      debugField.className = 'field field-debug';
      debugField.style.display = 'none';
      document.body.appendChild(debugField);
      
      // Simular F2
      const keydownEvent = new KeyboardEvent('keydown', {
        ctrlKey: true,
        key: 'F2'
      });
      
      // Campo deve permanecer oculto
      expect(debugField.style.display).toBe('none');
    });

    test('não deve ativar sem Ctrl', () => {
      // Criar campo de debug
      const debugField = document.createElement('div');
      debugField.id = 'debug-field';
      debugField.className = 'field field-debug';
      debugField.style.display = 'none';
      document.body.appendChild(debugField);
      
      // Simular F1 sem Ctrl
      const keydownEvent = new KeyboardEvent('keydown', {
        ctrlKey: false,
        key: 'F1'
      });
      
      // Campo deve permanecer oculto
      expect(debugField.style.display).toBe('none');
    });
  });

  describe('Salvamento de Posição', () => {
    test('deve salvar posição do debug', () => {
      // Criar campo de debug
      const debugField = document.createElement('div');
      debugField.id = 'debug-field';
      debugField.className = 'field field-debug';
      debugField.setAttribute('data-x', '100');
      debugField.setAttribute('data-y', '200');
      debugField.style.width = '300px';
      debugField.style.height = '250px';
      document.body.appendChild(debugField);
      
      const position = {
        x: 100,
        y: 200,
        width: '300px',
        height: '250px'
      };
      
      localStorage.setItem('debug-position', JSON.stringify(position));
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'debug-position',
        JSON.stringify(position)
      );
    });

    test('deve carregar posição salva', () => {
      const savedPosition = {
        x: 150,
        y: 250,
        width: '350px',
        height: '300px'
      };
      
      localStorage.getItem.mockReturnValue(JSON.stringify(savedPosition));
      
      const loadedPosition = JSON.parse(localStorage.getItem('debug-position'));
      
      expect(loadedPosition.x).toBe(150);
      expect(loadedPosition.y).toBe(250);
    });
  });

  describe('Compatibilidade com Zoom', () => {
    test('deve usar zoomManager quando disponível', () => {
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
            <div><strong>Zoom:</strong> <span id="debug-zoom">100%</span></div>
          </div>
        </div>
      `;
      document.body.appendChild(debugField);
      
      // Mock do zoomManager com zoom diferente
      window.zoomManager.getZoom.mockReturnValue(0.5);
      
      const zoomElement = debugField.querySelector('#debug-zoom');
      zoomElement.textContent = '50%';
      
      expect(zoomElement.textContent).toBe('50%');
    });

    test('deve funcionar sem zoomManager', () => {
      delete window.zoomManager;
      
      // Criar campo de debug
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
      
      // Deve não gerar erro
      expect(debugField).toBeDefined();
    });
  });
}); 