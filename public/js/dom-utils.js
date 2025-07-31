// Utilitários para otimizar manipulações do DOM
export class DOMUtils {
  // Criar elemento com propriedades em lote
  static createElement(tag, properties = {}, children = []) {
    const element = document.createElement(tag);
    
    // Aplicar propriedades
    for (const [key, value] of Object.entries(properties)) {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.assign(element.dataset, value);
      } else if (key === 'style') {
        Object.assign(element.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        element.setAttribute(key, value);
      }
    }
    
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

  // Renderizar lista de itens de forma otimizada
  static renderList(container, items, createItemElement, options = {}) {
    const {
      key = 'id',
      updateExisting = true,
      removeUnused = true,
      batchSize = 50
    } = options;

    // Criar mapa dos elementos existentes
    const existingElements = new Map();
    if (updateExisting) {
      Array.from(container.children).forEach(child => {
        const itemKey = child.dataset[key];
        if (itemKey) {
          existingElements.set(itemKey, child);
        }
      });
    }

    // Criar fragmento para melhor performance
    const fragment = document.createDocumentFragment();
    const newElements = new Set();

    // Processar itens em lotes para não bloquear a UI
    const processBatch = (startIndex) => {
      const endIndex = Math.min(startIndex + batchSize, items.length);
      
      for (let i = startIndex; i < endIndex; i++) {
        const item = items[i];
        const itemKey = item[key];
        
        let element = existingElements.get(itemKey);
        
        if (element && updateExisting) {
          // Atualizar elemento existente
          const newElement = createItemElement(item, i);
          element.replaceWith(newElement);
          element = newElement;
        } else {
          // Criar novo elemento
          element = createItemElement(item, i);
        }
        
        fragment.appendChild(element);
        newElements.add(itemKey);
      }
      
      // Processar próximo lote se necessário
      if (endIndex < items.length) {
        requestAnimationFrame(() => processBatch(endIndex));
      } else {
        // Finalizar renderização
        if (removeUnused) {
          // Remover elementos não utilizados
          existingElements.forEach((element, key) => {
            if (!newElements.has(key)) {
              element.remove();
            }
          });
        }
        
        // Limpar container e adicionar fragmento
        container.innerHTML = '';
        container.appendChild(fragment);
      }
    };

    // Iniciar processamento em lotes
    if (items.length > 0) {
      processBatch(0);
    } else {
      container.innerHTML = '';
    }
  }

  // Debounce para otimizar eventos frequentes
  static debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  // Throttle para limitar frequência de execução
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Observar mudanças no DOM
  static observeChanges(element, callback, options = {}) {
    const defaultOptions = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-*']
    };
    
    const observer = new MutationObserver((mutations) => {
      callback(mutations, observer);
    });
    
    observer.observe(element, { ...defaultOptions, ...options });
    return observer;
  }

  // Medir performance de operações DOM
  static measurePerformance(name, operation) {
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    
    console.log(`${name} executado em ${(end - start).toFixed(2)}ms`);
    return result;
  }

  // Virtualização simples para listas grandes
  static createVirtualList(container, items, itemHeight, visibleCount, createItemElement) {
    const scrollContainer = container.parentElement;
    const totalHeight = items.length * itemHeight;
    const visibleHeight = visibleCount * itemHeight;
    
    // Criar container com altura total
    const virtualContainer = DOMUtils.createElement('div', {
      style: { height: `${totalHeight}px`, position: 'relative' }
    });
    
    // Container para itens visíveis
    const visibleContainer = DOMUtils.createElement('div', {
      style: { position: 'absolute', top: '0', left: '0', right: '0' }
    });
    
    virtualContainer.appendChild(visibleContainer);
    container.appendChild(virtualContainer);
    
    let currentStartIndex = 0;
    let currentEndIndex = visibleCount;
    
    const updateVisibleItems = () => {
      const scrollTop = scrollContainer.scrollTop;
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(startIndex + visibleCount, items.length);
      
      if (startIndex !== currentStartIndex || endIndex !== currentEndIndex) {
        currentStartIndex = startIndex;
        currentEndIndex = endIndex;
        
        // Limpar e recriar itens visíveis
        visibleContainer.innerHTML = '';
        visibleContainer.style.transform = `translateY(${startIndex * itemHeight}px)`;
        
        for (let i = startIndex; i < endIndex; i++) {
          const item = items[i];
          const element = createItemElement(item, i);
          element.style.position = 'absolute';
          element.style.top = `${(i - startIndex) * itemHeight}px`;
          element.style.width = '100%';
          element.style.height = `${itemHeight}px`;
          visibleContainer.appendChild(element);
        }
      }
    };
    
    // Adicionar listener de scroll
    scrollContainer.addEventListener('scroll', DOMUtils.throttle(updateVisibleItems, 16));
    
    // Inicializar
    updateVisibleItems();
    
    return {
      update: updateVisibleItems,
      destroy: () => {
        scrollContainer.removeEventListener('scroll', updateVisibleItems);
      }
    };
  }

  // Animações suaves
  static animate(element, properties, duration = 300, easing = 'ease-out') {
    return new Promise((resolve) => {
      const startValues = {};
      const endValues = {};
      
      // Capturar valores iniciais
      for (const [property, value] of Object.entries(properties)) {
        startValues[property] = parseFloat(getComputedStyle(element)[property]) || 0;
        endValues[property] = value;
      }
      
      const startTime = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Aplicar easing
        const easedProgress = easing === 'ease-out' 
          ? 1 - Math.pow(1 - progress, 3)
          : progress;
        
        // Aplicar valores interpolados
        for (const [property, startValue] of Object.entries(startValues)) {
          const endValue = endValues[property];
          const currentValue = startValue + (endValue - startValue) * easedProgress;
          element.style[property] = `${currentValue}px`;
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }
} 