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
        
        const rect = field.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;
        
        this.startPos = {
            x: rect.left,
            y: rect.top,
            offsetX: offsetX,
            offsetY: offsetY
        };
        
        this.startMouse = {
            x: event.clientX,
            y: event.clientY
        };
        
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
        
        field.classList.add('resizing');
        document.body.style.cursor = 'se-resize';
        
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
        const newX = event.clientX - this.startPos.offsetX;
        const newY = event.clientY - this.startPos.offsetY;
        
        // Limites baseados na área da tela (com margem para a demarcação)
        const fieldWidth = this.draggedField.offsetWidth;
        const fieldHeight = this.draggedField.offsetHeight;
        
        // Limites da tela com margem para a demarcação
        const screenMargin = 20; // Margem para a demarcação
        const maxX = window.innerWidth - fieldWidth - screenMargin;
        const maxY = window.innerHeight - fieldHeight - screenMargin;
        const minX = screenMargin; // Respeitar a margem da demarcação
        const minY = screenMargin; // Respeitar a margem da demarcação
        
        const clampedX = Math.max(minX, Math.min(newX, maxX));
        const clampedY = Math.max(minY, Math.min(newY, maxY));
        
        this.draggedField.style.left = `${clampedX}px`;
        this.draggedField.style.top = `${clampedY}px`;
        
        // Verificar se está fora dos limites
        this.checkFieldBounds(this.draggedField);
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
        const deltaX = event.clientX - this.startMouse.x;
        const deltaY = event.clientY - this.startMouse.y;
        
        const newWidth = this.startSize.width + deltaX;
        const newHeight = this.startSize.height + deltaY;
        
        const minWidth = 150;
        const minHeight = 100;
        
        const clampedWidth = Math.max(minWidth, newWidth);
        const clampedHeight = Math.max(minHeight, newHeight);
        
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
        this.checkAllFieldBounds();
    }

    endResize() {
        this.resizingField.classList.remove('resizing');
        this.resizingField = null;
        this.isResizing = false;
        document.body.style.cursor = '';
        
        this.saveFieldPositions();
        this.checkAllFieldBounds();
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
            field.style.height = field.dataset.originalHeight || 'auto';
        } else {
            field.classList.add('minimized');
            field.dataset.originalHeight = field.style.height || field.offsetHeight + 'px';
            content.style.display = 'none';
            resizer.style.display = 'none';
            field.style.height = '40px';
        }
        
        this.saveFieldPositions();
    }

    closeField(field) {
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
                this.checkAllFieldBounds();
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
        
        // Calcular espaçamento respeitando os limites da tela
        const screenMargin = 40; // Margem para a demarcação
        const availableWidth = windowWidth - (screenMargin * 2);
        const availableHeight = windowHeight - (screenMargin * 2);
        
        const fieldWidth = Math.min(400, (availableWidth - (cols - 1) * 100) / cols);
        const fieldHeight = Math.min(300, (availableHeight - (rows - 1) * 80) / rows);
        const spacingX = 100;
        const spacingY = 80;
        
        fields.forEach((field, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            // Calcular posições respeitando os limites da tela
            const left = screenMargin + col * (fieldWidth + spacingX);
            const top = screenMargin + row * (fieldHeight + spacingY);
            
            field.style.left = `${left}px`;
            field.style.top = `${top}px`;
            field.style.width = `${fieldWidth}px`;
            field.style.height = `${fieldHeight}px`;
        });
        
        this.saveFieldPositions();
    }
}

// Inicializar quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', () => {
    window.fieldManager = new FieldManager();
});

export default FieldManager; 