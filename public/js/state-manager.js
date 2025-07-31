// Sistema de gestão de estado centralizado
class StateManager {
  constructor() {
    this.state = {
      itemsData: [],
      placedItems: [],
      selectedItemId: null,
      draggedItem: null,
      isDragging: false,
      searchQuery: '',
      isMaster: false,
      currentUser: null
    };
    
    this.listeners = new Map();
    this.history = [];
    this.historyIndex = -1;
    this.maxHistorySize = 50;
  }

  // Obter estado atual
  getState() {
    return { ...this.state };
  }

  // Obter parte específica do estado
  getStateSlice(key) {
    return this.state[key];
  }

  // Atualizar estado
  setState(updates, saveToHistory = true) {
    const oldState = { ...this.state };
    
    // Aplicar atualizações
    Object.assign(this.state, updates);
    
    // Salvar no histórico se necessário
    if (saveToHistory) {
      this.saveToHistory(oldState);
    }
    
    // Notificar listeners
    this.notifyListeners(updates);
  }

  // Atualizar parte específica do estado
  updateSlice(key, value, saveToHistory = true) {
    this.setState({ [key]: value }, saveToHistory);
  }

  // Adicionar listener para mudanças de estado
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    
    // Retornar função para cancelar inscrição
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  // Notificar listeners
  notifyListeners(updates) {
    for (const [key, value] of Object.entries(updates)) {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(value, this.state);
          } catch (error) {
            console.error('Erro no listener:', error);
          }
        });
      }
    }
  }

  // Salvar estado no histórico
  saveToHistory(oldState) {
    // Remover estados futuros se estamos no meio do histórico
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    // Adicionar novo estado
    this.history.push(oldState);
    this.historyIndex++;
    
    // Limitar tamanho do histórico
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  // Desfazer última ação
  undo() {
    if (this.historyIndex >= 0) {
      const previousState = this.history[this.historyIndex];
      this.historyIndex--;
      
      const currentState = { ...this.state };
      this.state = { ...previousState };
      
      // Notificar listeners sem salvar no histórico
      this.notifyListeners(currentState);
      
      return true;
    }
    return false;
  }

  // Refazer ação
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const nextState = this.history[this.historyIndex];
      
      const currentState = { ...this.state };
      this.state = { ...nextState };
      
      // Notificar listeners sem salvar no histórico
      this.notifyListeners(currentState);
      
      return true;
    }
    return false;
  }

  // Verificar se pode desfazer
  canUndo() {
    return this.historyIndex >= 0;
  }

  // Verificar se pode refazer
  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  // Limpar histórico
  clearHistory() {
    this.history = [];
    this.historyIndex = -1;
  }

  // Resetar estado
  reset() {
    const oldState = { ...this.state };
    this.state = {
      itemsData: [],
      placedItems: [],
      selectedItemId: null,
      draggedItem: null,
      isDragging: false,
      searchQuery: '',
      isMaster: false,
      currentUser: null
    };
    
    this.notifyListeners(oldState);
    this.clearHistory();
  }
}

// Instância global do gerenciador de estado
export const stateManager = new StateManager();

// Helpers para operações comuns
export const stateHelpers = {
  // Adicionar item
  addItem(item) {
    const itemsData = [...stateManager.getStateSlice('itemsData'), item];
    stateManager.updateSlice('itemsData', itemsData);
  },

  // Remover item
  removeItem(itemId) {
    const itemsData = stateManager.getStateSlice('itemsData').filter(item => item.id !== itemId);
    const placedItems = stateManager.getStateSlice('placedItems').filter(item => item.id !== itemId);
    
    stateManager.setState({
      itemsData,
      placedItems,
      selectedItemId: stateManager.getStateSlice('selectedItemId') === itemId ? null : stateManager.getStateSlice('selectedItemId')
    });
  },

  // Colocar item no grid
  placeItem(item, x, y) {
    const placedItem = { ...item, x, y };
    const placedItems = [...stateManager.getStateSlice('placedItems'), placedItem];
    stateManager.updateSlice('placedItems', placedItems);
  },

  // Remover item do grid
  removeFromGrid(itemId) {
    const placedItems = stateManager.getStateSlice('placedItems').filter(item => item.id !== itemId);
    stateManager.updateSlice('placedItems', placedItems);
  },

  // Selecionar item
  selectItem(itemId) {
    stateManager.updateSlice('selectedItemId', itemId);
  },

  // Atualizar estresse do item
  updateItemStress(itemId, newStress) {
    const itemsData = stateManager.getStateSlice('itemsData').map(item => 
      item.id === itemId ? { ...item, estresseAtual: newStress } : item
    );
    
    const placedItems = stateManager.getStateSlice('placedItems').map(item => 
      item.id === itemId ? { ...item, estresseAtual: newStress } : item
    );
    
    stateManager.setState({ itemsData, placedItems });
  }
}; 