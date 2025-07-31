# 📚 Exemplos de Uso das Otimizações

Este arquivo contém exemplos práticos de como usar as novas funcionalidades implementadas no projeto.

---

## 🔧 **Backend - Rate Limiting**

### Exemplo de Configuração Personalizada

```javascript
// server/rate-limiter.js
const CUSTOM_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000, // 10 minutos
  maxAttempts: 3, // Mais restritivo
  message: 'Muitas tentativas. Aguarde 10 minutos.'
};

// Aplicar em rotas específicas
app.post('/sensitive-route', customRateLimit, handler);
```

### Monitoramento de Rate Limiting

```javascript
// Adicionar ao rate-limiter.js
function logRateLimitAttempt(req, isBlocked) {
  const clientKey = getClientKey(req);
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] Rate limit attempt:`, {
    client: clientKey,
    blocked: isBlocked,
    userAgent: req.headers['user-agent']
  });
}
```

---

## 🎨 **Frontend - Gestão de Estado**

### Exemplo: Sistema de Undo/Redo

```javascript
// inventory-page.js
import { stateManager } from './state-manager.js';

// Adicionar botões de undo/redo
function setupUndoRedo() {
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  
  // Atualizar estado dos botões
  function updateButtons() {
    undoBtn.disabled = !stateManager.canUndo();
    redoBtn.disabled = !stateManager.canRedo();
  }
  
  // Escutar mudanças de estado
  stateManager.subscribe('itemsData', updateButtons);
  stateManager.subscribe('placedItems', updateButtons);
  
  // Event listeners
  undoBtn.addEventListener('click', () => {
    if (stateManager.undo()) {
      // Re-renderizar interface
      renderInventory();
    }
  });
  
  redoBtn.addEventListener('click', () => {
    if (stateManager.redo()) {
      // Re-renderizar interface
      renderInventory();
    }
  });
}
```

### Exemplo: Sistema de Busca Otimizada

```javascript
// inventory-page.js
import { DOMUtils } from './dom-utils.js';

// Busca com debounce
const debouncedSearch = DOMUtils.debounce((query) => {
  const filteredItems = itemsData.filter(item => 
    item.nome.toLowerCase().includes(query.toLowerCase())
  );
  
  // Renderizar lista otimizada
  DOMUtils.renderList(itemList, filteredItems, createItemElement, {
    batchSize: 25,
    updateExisting: true
  });
}, 300);

// Event listener
searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});
```

### Exemplo: Lista Virtual para Muitos Itens

```javascript
// inventory-page.js
import { DOMUtils } from './dom-utils.js';

// Configurar lista virtual para mais de 100 itens
if (itemsData.length > 100) {
  const virtualList = DOMUtils.createVirtualList(
    itemList,
    itemsData,
    60, // altura do item
    10, // itens visíveis
    createItemElement
  );
  
  // Atualizar quando dados mudarem
  stateManager.subscribe('itemsData', () => {
    virtualList.update();
  });
}
```

---

## ⚙️ **Configuração Centralizada**

### Exemplo: Configuração por Ambiente

```javascript
// config.js
const environmentConfigs = {
  development: {
    frontend: {
      performance: {
        batchSize: 25,
        debounceDelay: 200
      }
    },
    development: {
      debug: true,
      logLevel: 'debug'
    }
  },
  
  production: {
    frontend: {
      performance: {
        batchSize: 100,
        debounceDelay: 500
      }
    },
    development: {
      debug: false,
      logLevel: 'error'
    }
  }
};
```

### Exemplo: Validação Customizada

```javascript
// server.js
import { getConfig } from './config.js';

const validationRules = {
  username: [
    body('username')
      .trim()
      .isLength({ 
        min: getConfig('validation.username.minLength'),
        max: getConfig('validation.username.maxLength')
      })
      .matches(getConfig('validation.username.pattern'))
      .withMessage('Nome de usuário inválido')
  ],
  
  password: [
    body('password')
      .isLength({ 
        min: getConfig('validation.password.minLength'),
        max: getConfig('validation.password.maxLength')
      })
      .withMessage('Senha deve ter entre 6 e 100 caracteres')
  ]
};

app.post('/register', validationRules.username.concat(validationRules.password), handler);
```

---

## 🎯 **Performance Monitoring**

### Exemplo: Medição de Performance

```javascript
// inventory.js
import { DOMUtils } from './dom-utils.js';

export function renderItemList() {
  return DOMUtils.measurePerformance('renderItemList', () => {
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const filteredItems = itemsData.filter(it => 
      it.nome.toLowerCase().includes(query)
    );
    
    DOMUtils.renderList(itemList, filteredItems, createItemElement, {
      batchSize: getConfig('frontend.performance.batchSize')
    });
  });
}
```

### Exemplo: Observador de Mudanças

```javascript
// inventory-page.js
import { DOMUtils } from './dom-utils.js';

// Monitorar mudanças no inventário
const inventoryObserver = DOMUtils.observeChanges(inventory, (mutations) => {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      console.log('Itens adicionados/removidos:', mutation.addedNodes.length, mutation.removedNodes.length);
    }
  });
});

// Limpar observer quando necessário
function cleanup() {
  inventoryObserver.disconnect();
}
```

---

## 🎨 **Animações Suaves**

### Exemplo: Animação de Item

```javascript
// dragdrop.js
import { DOMUtils } from './dom-utils.js';

async function animateItemPlacement(element, targetX, targetY) {
  const startX = element.offsetLeft;
  const startY = element.offsetTop;
  
  await DOMUtils.animate(element, {
    left: targetX,
    top: targetY
  }, 300, 'ease-out');
  
  // Callback após animação
  onPlacementComplete();
}
```

### Exemplo: Feedback Visual

```javascript
// inventory.js
import { DOMUtils } from './dom-utils.js';

function showSuccessFeedback(element) {
  // Animação de sucesso
  DOMUtils.animate(element, {
    transform: 'scale(1.1)',
    backgroundColor: '#4ade80'
  }, 200, 'ease-out').then(() => {
    // Retornar ao normal
    return DOMUtils.animate(element, {
      transform: 'scale(1)',
      backgroundColor: ''
    }, 200, 'ease-in');
  });
}
```

---

## 🔄 **Integração com Sistema Existente**

### Exemplo: Migração Gradual

```javascript
// inventory.js - Migração para state manager
import { stateManager, stateHelpers } from './state-manager.js';

// Manter compatibilidade com código existente
export function getInventoryState() {
  return stateManager.getState();
}

export function setInventoryState(data) {
  stateManager.setState(data);
}

// Gradualmente migrar para helpers
export function addNewItem(data) {
  // Código existente
  const newItem = {
    id: generateId(),
    ...data
  };
  
  // Usar novo sistema
  stateHelpers.addItem(newItem);
  
  // Manter compatibilidade
  itemsData.push(newItem);
  renderItemList();
}
```

---

## 🧪 **Testes das Otimizações**

### Exemplo: Teste de Performance

```javascript
// __tests__/performance.test.js
import { DOMUtils } from '../public/js/dom-utils.js';

test('renderList performance', () => {
  const container = document.createElement('div');
  const items = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    nome: `Item ${i}`,
    width: 1,
    height: 1
  }));
  
  const startTime = performance.now();
  
  DOMUtils.renderList(container, items, (item) => {
    const el = document.createElement('div');
    el.textContent = item.nome;
    return el;
  });
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Deve renderizar em menos de 100ms
  expect(duration).toBeLessThan(100);
});
```

### Exemplo: Teste de Rate Limiting

```javascript
// __tests__/rate-limiter.test.js
import request from 'supertest';
import app from '../server.js';

test('rate limiting blocks excessive requests', async () => {
  const loginData = {
    username: 'testuser',
    password: 'testpass'
  };
  
  // Fazer 6 tentativas (mais que o limite de 5)
  for (let i = 0; i < 6; i++) {
    const response = await request(app)
      .post('/login')
      .send(loginData);
    
    if (i < 5) {
      expect(response.status).not.toBe(429);
    } else {
      expect(response.status).toBe(429);
      expect(response.body.error).toContain('Muitas tentativas');
    }
  }
});
```

---

## 📊 **Métricas e Monitoramento**

### Exemplo: Log de Performance

```javascript
// server.js
import { getConfig } from './config.js';

// Middleware de logging
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = getConfig('development.logLevel');
    
    if (logLevel === 'debug' || duration > 1000) {
      console.log(`${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
});
```

---

*Estes exemplos demonstram como usar as otimizações implementadas de forma prática e eficaz.* 