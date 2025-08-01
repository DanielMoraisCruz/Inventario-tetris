/**
 * Otimizador de Performance - Centraliza melhorias de performance
 */

// Configurações de performance
const PERFORMANCE_CONFIG = {
  debounceDelay: 300,
  throttleDelay: 16,
  batchSize: 50,
  virtualListThreshold: 100,
  cacheTTL: 5000,
  enableLogging: process.env.NODE_ENV === 'development'
};

// Cache simples para operações custosas
class PerformanceCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  set(key, value, ttl = PERFORMANCE_CONFIG.cacheTTL) {
    this.cache.set(key, value);
    
    // Limpar cache após TTL
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    
    this.timers.set(key, setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttl));
  }

  get(key) {
    return this.cache.get(key);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }
}

// Logger otimizado
class PerformanceLogger {
  static log(message, ...args) {
    if (PERFORMANCE_CONFIG.enableLogging) {
      console.log(`[PERF] ${message}`, ...args);
    }
  }

  static warn(message, ...args) {
    if (PERFORMANCE_CONFIG.enableLogging) {
      console.warn(`[PERF] ${message}`, ...args);
    }
  }

  static error(message, ...args) {
    console.error(`[PERF] ${message}`, ...args);
  }

  static measure(name, operation) {
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    
    this.log(`${name} executado em ${(end - start).toFixed(2)}ms`);
    return result;
  }
}

// Debounce otimizado
function debounce(func, wait = PERFORMANCE_CONFIG.debounceDelay) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle otimizado
function throttle(func, limit = PERFORMANCE_CONFIG.throttleDelay) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Batch processor para operações em lote
class BatchProcessor {
  constructor(batchSize = PERFORMANCE_CONFIG.batchSize) {
    this.batchSize = batchSize;
    this.queue = [];
    this.processing = false;
  }

  add(operation) {
    this.queue.push(operation);
    if (!this.processing) {
      this.process();
    }
  }

  async process() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      
      // Processar em paralelo
      await Promise.all(batch.map(op => op()));
      
      // Pequena pausa para não bloquear a UI
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    this.processing = false;
  }
}

// Virtual list para listas grandes
class VirtualList {
  constructor(container, items, itemHeight, visibleCount) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.visibleCount = visibleCount;
    this.scrollTop = 0;
    this.startIndex = 0;
    this.endIndex = visibleCount;
    
    this.init();
  }

  init() {
    this.container.style.height = `${this.items.length * this.itemHeight}px`;
    this.container.style.position = 'relative';
    
    this.visibleContainer = document.createElement('div');
    this.visibleContainer.style.position = 'absolute';
    this.visibleContainer.style.top = '0';
    this.visibleContainer.style.left = '0';
    this.visibleContainer.style.right = '0';
    
    this.container.appendChild(this.visibleContainer);
    
    this.container.addEventListener('scroll', throttle(() => {
      this.updateVisibleItems();
    }, 16));
    
    this.updateVisibleItems();
  }

  updateVisibleItems() {
    const scrollTop = this.container.scrollTop;
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    const endIndex = Math.min(startIndex + this.visibleCount, this.items.length);
    
    if (startIndex !== this.startIndex || endIndex !== this.endIndex) {
      this.startIndex = startIndex;
      this.endIndex = endIndex;
      
      this.visibleContainer.innerHTML = '';
      this.visibleContainer.style.transform = `translateY(${startIndex * this.itemHeight}px)`;
      
      for (let i = startIndex; i < endIndex; i++) {
        const item = this.items[i];
        const element = this.createItemElement(item, i);
        element.style.position = 'absolute';
        element.style.top = `${(i - startIndex) * this.itemHeight}px`;
        element.style.width = '100%';
        element.style.height = `${this.itemHeight}px`;
        this.visibleContainer.appendChild(element);
      }
    }
  }

  createItemElement(item, index) {
    // Implementação específica para cada tipo de item
    const element = document.createElement('div');
    element.textContent = item.nome || `Item ${index}`;
    return element;
  }
}

// Otimizador de DOM
class DOMOptimizer {
  static batchDOMUpdates(updates) {
    // Usar DocumentFragment para atualizações em lote
    const fragment = document.createDocumentFragment();
    
    updates.forEach(update => {
      const element = update();
      if (element) {
        fragment.appendChild(element);
      }
    });
    
    return fragment;
  }

  static createElement(tag, properties = {}, children = []) {
    const element = document.createElement(tag);
    
    // Aplicar propriedades em lote
    Object.entries(properties).forEach(([key, value]) => {
      if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key === 'dataset' && typeof value === 'object') {
        Object.assign(element.dataset, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.slice(2), value);
      } else {
        element[key] = value;
      }
    });
    
    // Adicionar filhos
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    });
    
    return element;
  }
}

// Exportar utilitários
export {
  PerformanceCache,
  PerformanceLogger,
  debounce,
  throttle,
  BatchProcessor,
  VirtualList,
  DOMOptimizer,
  PERFORMANCE_CONFIG
}; 