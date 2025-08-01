/**
 * Sistema de Gerenciamento de Campos
 * Versão simplificada e robusta
 */

class FieldManager {
    constructor() {
        this.fields = new Map();
        this.draggedField = null;
        this.resizingField = null;
        this.startPos = { x: 0, y: 0 };
        this.startSize = { width: 0, height: 0 };
        this.startMouse = { x: 0, y: 0 };
        this.isDragging = false;
        this.isResizing = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFieldControls();
        this.loadFieldPositions();
        
        // Se não há posições salvas ou campos estão na posição padrão, fazer auto-arrange
        const saved = localStorage.getItem('field-positions');
        if (!saved) {
            setTimeout(() => {
                this.autoArrange();
            }, 100);
        } else {
            // Verificar se algum campo está na posição (0,0) - indicando posição padrão
            const hasDefaultPosition = Array.from(this.fields.values()).some(field => {
                const left = parseInt(field.style.left) || 0;
                const top = parseInt(field.style.top) || 0;
                return left === 0 && top === 0;
            });
            
            if (hasDefaultPosition) {
                setTimeout(() => {
                    this.autoArrange();
                }, 100);
            }
        }
    }

    setupEventListeners() {
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Prevenir seleção de texto durante drag
        document.addEventListener('selectstart', (e) => {
            if (this.isDragging || this.isResizing) {
                e.preventDefault();
            }
        });
    }

    setupFieldControls() {
        const fields = document.querySelectorAll('.field');
        
        fields.forEach(field => {
            const fieldId = field.dataset.field;
            this.fields.set(fieldId, field);
            
            // Configurar drag do cabeçalho
            const header = field.querySelector('.field-header');
            if (header) {
                header.addEventListener('mousedown', (e) => {
                    if (e.button === 0) { // Apenas botão esquerdo
                        this.startDrag(field, e);
                    }
                });
            }
            
            // Configurar redimensionamento
            const resizer = field.querySelector('.field-resizer');
            if (resizer) {
                resizer.addEventListener('mousedown', (e) => {
                    if (e.button === 0) { // Apenas botão esquerdo
                        this.startResize(field, e);
                    }
                });
            }
            
            // Configurar controles do cabeçalho
            const controls = field.querySelectorAll('.field-control-btn');
            controls.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleFieldControl(field, btn);
                });
            });
        });
    }

    startDrag(field, event) {
        if (this.isResizing) return;
        
        this.isDragging = true;
        this.draggedField = field;
        
        // Calcular offset simples baseado na posição do mouse
        const rect = field.getBoundingClientRect();
        this.offsetX = event.clientX - rect.left;
        this.offsetY = event.clientY - rect.top;
        
        field.classList.add('dragging');
        document.body.style.cursor = 'grabbing';
        event.stopPropagation();
    }

    startResize(field, event) {
        if (this.isDragging) return;
        
        this.isResizing = true;
        this.resizingField = field;
        this.startSize = {
            width: field.offsetWidth,
            height: field.offsetHeight
        };
        this.startMouse = {
            x: event.clientX,
            y: event.clientY
        };
        
        // Determinar tipo de redimensionamento
        this.resizeType = field.classList.contains('field-items') ? 'horizontal' : 'both';
        
        field.classList.add('resizing');
        document.body.style.cursor = this.resizeType === 'horizontal' ? 'ew-resize' : 'se-resize';
        
        event.stopPropagation();
    }

    handleMouseMove(event) {
        if (this.isDragging && this.draggedField) {
            this.handleDrag(event);
        } else if (this.isResizing && this.resizingField) {
            this.handleResize(event);
        }
    }

    handleDrag(event) {
        if (!this.isDragging || !this.draggedField) return;
        
        // Calcular nova posição baseada no mouse
        const newLeft = event.clientX - this.offsetX;
        const newTop = event.clientY - this.offsetY;
        
        // Aplicar nova posição diretamente
        this.draggedField.style.left = `${newLeft}px`;
        this.draggedField.style.top = `${newTop}px`;
    }

    /**
     * Verifica se um campo está dentro dos limites da tela
     */
    checkFieldBounds(field) {
        const rect = field.getBoundingClientRect();
        const screenMargin = 20;
        
        const isOutOfBounds = 
            rect.left < screenMargin ||
            rect.top < screenMargin ||
            rect.right > window.innerWidth - screenMargin ||
            rect.bottom > window.innerHeight - screenMargin;
        
        if (isOutOfBounds) {
            field.classList.add('out-of-bounds');
        } else {
            field.classList.remove('out-of-bounds');
        }
    }

    /**
     * Verifica todos os campos para limites
     */
    checkAllFieldBounds() {
        this.fields.forEach(field => {
            this.checkFieldBounds(field);
        });
    }

    handleResize(event) {
        if (!this.isResizing || !this.resizingField) return;
        
        const deltaX = event.clientX - this.startMouse.x;
        const deltaY = event.clientY - this.startMouse.y;
        
        // Redimensionamento simples
        const newWidth = this.startSize.width + deltaX;
        const newHeight = this.startSize.height + deltaY;
        
        // Limites mínimos e máximos
        const minWidth = 200;
        const minHeight = 150;
        const maxWidth = window.innerWidth * 0.9;
        const maxHeight = window.innerHeight * 0.9;
        
        const clampedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
        const clampedHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
        
        this.resizingField.style.width = `${clampedWidth}px`;
        this.resizingField.style.height = `${clampedHeight}px`;
    }

    handleMouseUp() {
        if (this.isDragging && this.draggedField) {
            this.endDrag();
        } else if (this.isResizing && this.resizingField) {
            this.endResize();
        }
    }

    endDrag() {
        this.draggedField.classList.remove('dragging');
        this.draggedField = null;
        this.isDragging = false;
        document.body.style.cursor = '';
        
        this.saveFieldPositions();
        // Verificação de limites desativada
        // this.checkAllFieldBounds();
    }

    endResize() {
        this.resizingField.classList.remove('resizing');
        this.resizingField = null;
        this.isResizing = false;
        document.body.style.cursor = '';
        
        this.saveFieldPositions();
        // Verificação de limites desativada
        // this.checkAllFieldBounds();
    }

    handleFieldControl(field, button) {
        const title = button.title;
        
        if (title === 'Minimizar') {
            this.toggleMinimize(field);
        } else if (title === 'Fechar') {
            this.closeField(field);
        }
    }

    toggleMinimize(field) {
        const content = field.querySelector('.field-content');
        const resizer = field.querySelector('.field-resizer');
        const isMinimized = field.classList.contains('minimized');
        
        if (isMinimized) {
            field.classList.remove('minimized');
            content.style.display = '';
            resizer.style.display = '';
            if (field.classList.contains('field-items')) {
                field.style.width = field.dataset.originalWidth || '300px';
            } else {
                field.style.height = field.dataset.originalHeight || 'auto';
            }
        } else {
            field.classList.add('minimized');
            if (field.classList.contains('field-items')) {
                field.dataset.originalWidth = field.style.width || field.offsetWidth + 'px';
                field.style.width = '40px';
            } else {
                field.dataset.originalHeight = field.style.height || field.offsetHeight + 'px';
                content.style.display = 'none';
                resizer.style.display = 'none';
                field.style.height = '40px';
            }
        }
        
        this.saveFieldPositions();
    }

    closeField(field) {
        // Em vez de apenas esconder, enviar para a aba lateral direita
        if (window.sidebarManager) {
            window.sidebarManager.addClosedField(field);
        }
        field.style.display = 'none';
        this.saveFieldPositions();
    }

    saveFieldPositions() {
        const positions = {};
        
        this.fields.forEach((field, id) => {
            const rect = field.getBoundingClientRect();
            
            positions[id] = {
                left: rect.left,
                top: rect.top,
                width: field.offsetWidth,
                height: field.offsetHeight,
                minimized: field.classList.contains('minimized'),
                visible: field.style.display !== 'none'
            };
        });
        
        localStorage.setItem('field-positions', JSON.stringify(positions));
    }

    loadFieldPositions() {
        const saved = localStorage.getItem('field-positions');
        if (!saved) return;
        
        try {
            const positions = JSON.parse(saved);
            
            Object.entries(positions).forEach(([id, pos]) => {
                const field = document.querySelector(`[data-field="${id}"]`);
                if (field) {
                    field.style.left = `${pos.left}px`;
                    field.style.top = `${pos.top}px`;
                    field.style.width = `${pos.width}px`;
                    field.style.height = `${pos.height}px`;
                    
                    if (pos.minimized) {
                        this.toggleMinimize(field);
                    }
                    
                    if (!pos.visible) {
                        field.style.display = 'none';
                    }
                }
            });
            
            // Verificar limites após carregar posições
            setTimeout(() => {
                // Verificação de limites desativada
                // this.checkAllFieldBounds();
            }, 100);
        } catch (error) {
            console.error('Erro ao carregar posições dos campos:', error);
        }
    }

    restoreAllFields() {
        this.fields.forEach(field => {
            field.style.display = '';
            field.classList.remove('minimized');
            const content = field.querySelector('.field-content');
            const resizer = field.querySelector('.field-resizer');
            if (content) content.style.display = '';
            if (resizer) resizer.style.display = '';
        });
        
        this.saveFieldPositions();
    }

    resetFieldPositions() {
        this.fields.forEach(field => {
            field.style.left = '';
            field.style.top = '';
            field.style.width = '';
            field.style.height = '';
            field.style.display = '';
            field.classList.remove('minimized');
        });
        
        localStorage.removeItem('field-positions');
    }

    autoArrange() {
        const fields = Array.from(this.fields.values()).filter(f => f.style.display !== 'none');
        
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Considerar as abas laterais
        const leftSidebarWidth = 300; // Aba esquerda (itens)
        const rightSidebarWidth = 270; // Aba direita (telas fechadas)
        
        // Área disponível para os campos (dentro do ficha-container)
        const availableWidth = windowWidth - leftSidebarWidth - rightSidebarWidth - 40; // -40px para padding
        const availableHeight = windowHeight - 40; // -40px para padding
        
        // Layout adaptativo
        let cols, rows;
        if (fields.length <= 3) {
            cols = 3;
            rows = 1;
        } else if (fields.length <= 6) {
            cols = 3;
            rows = 2;
        } else {
            cols = 4;
            rows = Math.ceil(fields.length / 4);
        }
        
        // Calcular espaçamento respeitando as abas laterais
        const screenMargin = 20;
        const fieldWidth = Math.min(400, (availableWidth - (cols - 1) * 100) / cols);
        const fieldHeight = Math.min(300, (availableHeight - (rows - 1) * 80) / rows);
        const spacingX = 100;
        const spacingY = 80;
        
        fields.forEach((field, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            // Calcular posições dentro do ficha-container (sem considerar as abas)
            const left = screenMargin + col * (fieldWidth + spacingX);
            const top = screenMargin + row * (fieldHeight + spacingY);
            
            field.style.left = `${left}px`;
            field.style.top = `${top}px`;
            field.style.width = `${fieldWidth}px`;
            field.style.height = `${fieldHeight}px`;
        });
        
        this.saveFieldPositions();
    }

    /**
     * Calcula o tamanho mínimo necessário para um campo baseado no seu conteúdo
     */
    calculateMinSize(field) {
        const content = field.querySelector('.field-content');
        if (!content) return { width: 200, height: 150 };

        // Obter dimensões do conteúdo
        const contentRect = content.getBoundingClientRect();
        const scrollWidth = content.scrollWidth;
        const scrollHeight = content.scrollHeight;
        
        // Calcular tamanho mínimo baseado no conteúdo
        let minWidth = Math.max(200, scrollWidth + 40); // 40px para padding e bordas
        let minHeight = Math.max(150, scrollHeight + 60); // 60px para header e padding
        
        // Aplicar limites máximos
        minWidth = Math.min(minWidth, window.innerWidth * 0.8);
        minHeight = Math.min(minHeight, window.innerHeight * 0.8);
        
        return { width: minWidth, height: minHeight };
    }

    /**
     * Aplica tamanho mínimo se necessário
     */
    applyMinSize(field) {
        const currentWidth = field.offsetWidth;
        const currentHeight = field.offsetHeight;
        const minSize = this.calculateMinSize(field);
        
        let needsResize = false;
        let newWidth = currentWidth;
        let newHeight = currentHeight;
        
        if (currentWidth < minSize.width) {
            newWidth = minSize.width;
            needsResize = true;
        }
        
        if (currentHeight < minSize.height) {
            newHeight = minSize.height;
            needsResize = true;
        }
        
        if (needsResize) {
            field.style.width = `${newWidth}px`;
            field.style.height = `${newHeight}px`;
            this.saveFieldPositions();
        }
    }

    /**
     * Aplica tamanho mínimo para todos os campos
     */
    applyMinSizeToAll() {
        this.fields.forEach(field => {
            this.applyMinSize(field);
        });
    }
}

// Inicializar quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', () => {
    window.fieldManager = new FieldManager();
});

export default FieldManager; 