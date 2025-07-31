/**
 * Sistema de Gerenciamento de Campos Customizáveis
 * Permite arrastar, redimensionar e organizar campos como páginas em uma mesa
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

    /**
     * Inicializa o sistema
     */
    init() {
        this.loadFieldPositions();
        this.setupEventListeners();
        this.setupFieldControls();
        this.preventOverlap();
    }

    /**
     * Configura os event listeners
     */
    setupEventListeners() {
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Prevenir seleção de texto durante drag
        document.addEventListener('selectstart', (e) => {
            if (this.isDragging || this.isResizing) {
                e.preventDefault();
            }
        });
        
        // Listener para mudanças de zoom
        window.addEventListener('zoomChanged', this.handleZoomChange.bind(this));
    }

    /**
     * Manipula mudanças de zoom
     */
    handleZoomChange() {
        // Recarregar posições quando o zoom mudar
        this.loadFieldPositions();
    }

    /**
     * Configura os controles de cada campo
     */
    setupFieldControls() {
        const fields = document.querySelectorAll('.field');
        
        fields.forEach(field => {
            const fieldId = field.dataset.field;
            this.fields.set(fieldId, field);
            
            // Configurar drag do cabeçalho
            const header = field.querySelector('.field-header');
            if (header) {
                header.addEventListener('mousedown', (e) => {
                    this.startDrag(field, e);
                });
            }
            
            // Configurar redimensionamento
            const resizer = field.querySelector('.field-resizer');
            if (resizer) {
                resizer.addEventListener('mousedown', (e) => {
                    this.startResize(field, e);
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

    /**
     * Inicia o arrastar de um campo
     */
    startDrag(field, event) {
        if (this.isResizing) return;
        
        this.isDragging = true;
        this.draggedField = field;
        
        // Obter posição atual do campo
        const rect = field.getBoundingClientRect();
        
        // Calcular offset do mouse dentro do campo
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
        
        // Prevenir eventos de zoom durante drag
        event.stopPropagation();
    }

    /**
     * Inicia o redimensionamento de um campo
     */
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
        
        // Prevenir eventos de zoom durante resize
        event.stopPropagation();
    }

    /**
     * Manipula o movimento do mouse
     */
    handleMouseMove(event) {
        if (this.isDragging && this.draggedField) {
            this.handleDrag(event);
        } else if (this.isResizing && this.resizingField) {
            this.handleResize(event);
        }
    }

    /**
     * Manipula o arrastar
     */
    handleDrag(event) {
        // Obter zoom atual
        const zoom = window.zoomManager ? window.zoomManager.getCurrentZoom() : 1;
        
        // Calcular nova posição considerando o zoom
        const newX = event.clientX - this.startPos.offsetX;
        const newY = event.clientY - this.startPos.offsetY;
        
        // Permitir arrastar para qualquer lugar da tela
        // Sem limites rígidos, apenas limites suaves para manter o campo visível
        const fieldWidth = this.draggedField.offsetWidth;
        const fieldHeight = this.draggedField.offsetHeight;
        
        // Limites suaves baseados no tamanho da janela
        const maxX = window.innerWidth - fieldWidth - 50;
        const maxY = window.innerHeight - fieldHeight - 50;
        const minX = -fieldWidth + 100; // Deixar pelo menos 100px visível
        const minY = -fieldHeight + 100; // Deixar pelo menos 100px visível
        
        const clampedX = Math.max(minX, Math.min(newX, maxX));
        const clampedY = Math.max(minY, Math.min(newY, maxY));
        
        // Aplicar posição absoluta
        this.draggedField.style.left = `${clampedX}px`;
        this.draggedField.style.top = `${clampedY}px`;
    }

    /**
     * Manipula o redimensionamento
     */
    handleResize(event) {
        const deltaX = event.clientX - this.startMouse.x;
        const deltaY = event.clientY - this.startMouse.y;
        
        const newWidth = this.startSize.width + deltaX;
        const newHeight = this.startSize.height + deltaY;
        
        // Limites mínimos e máximos
        const minWidth = 200;
        const minHeight = 150;
        const maxWidth = window.innerWidth - 50;
        const maxHeight = window.innerHeight - 50;
        
        const clampedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
        const clampedHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
        
        this.resizingField.style.width = `${clampedWidth}px`;
        this.resizingField.style.height = `${clampedHeight}px`;
    }

    /**
     * Manipula o fim do mouse
     */
    handleMouseUp() {
        if (this.isDragging && this.draggedField) {
            this.endDrag();
        } else if (this.isResizing && this.resizingField) {
            this.endResize();
        }
    }

    /**
     * Finaliza o arrastar
     */
    endDrag() {
        this.draggedField.classList.remove('dragging');
        this.draggedField = null;
        this.isDragging = false;
        document.body.style.cursor = '';
        
        this.saveFieldPositions();
        // Não forçar prevenção de sobreposição para permitir campos em áreas vazias
        // this.preventOverlap();
    }

    /**
     * Finaliza o redimensionamento
     */
    endResize() {
        this.resizingField.classList.remove('resizing');
        this.resizingField = null;
        this.isResizing = false;
        document.body.style.cursor = '';
        
        this.saveFieldPositions();
        this.preventOverlap();
    }

    /**
     * Manipula os controles do campo
     */
    handleFieldControl(field, button) {
        const title = button.title;
        
        if (title === 'Minimizar') {
            this.toggleMinimize(field);
        } else if (title === 'Fechar') {
            this.closeField(field);
        }
    }

    /**
     * Minimiza/maximiza um campo
     */
    toggleMinimize(field) {
        const content = field.querySelector('.field-content');
        const resizer = field.querySelector('.field-resizer');
        const isMinimized = field.classList.contains('minimized');
        
        if (isMinimized) {
            // Restaurar
            field.classList.remove('minimized');
            content.style.display = '';
            resizer.style.display = '';
            field.style.height = field.dataset.originalHeight || 'auto';
        } else {
            // Minimizar
            field.classList.add('minimized');
            field.dataset.originalHeight = field.style.height || field.offsetHeight + 'px';
            content.style.display = 'none';
            resizer.style.display = 'none';
            field.style.height = '40px'; // Altura do cabeçalho
        }
        
        this.saveFieldPositions();
    }

    /**
     * Fecha um campo
     */
    closeField(field) {
        field.style.display = 'none';
        this.saveFieldPositions();
    }

    /**
     * Previne sobreposição de campos (apenas quando necessário)
     */
    preventOverlap() {
        const fields = Array.from(this.fields.values()).filter(f => f.style.display !== 'none');
        
        for (let i = 0; i < fields.length; i++) {
            for (let j = i + 1; j < fields.length; j++) {
                const field1 = fields[i];
                const field2 = fields[j];
                
                if (this.isOverlapping(field1, field2)) {
                    this.resolveOverlap(field1, field2);
                }
            }
        }
    }

    /**
     * Verifica se dois campos estão sobrepostos
     */
    isOverlapping(field1, field2) {
        const rect1 = field1.getBoundingClientRect();
        const rect2 = field2.getBoundingClientRect();
        
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }

    /**
     * Resolve sobreposição entre dois campos
     */
    resolveOverlap(field1, field2) {
        const rect1 = field1.getBoundingClientRect();
        const rect2 = field2.getBoundingClientRect();
        
        // Calcular a sobreposição
        const overlapX = Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left);
        const overlapY = Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top);
        
        // Mover o segundo campo para resolver a sobreposição
        if (overlapX > 0 && overlapY > 0) {
            const currentLeft = parseInt(field2.style.left) || 0;
            const currentTop = parseInt(field2.style.top) || 0;
            
            // Mover para a direita
            field2.style.left = `${currentLeft + overlapX + 10}px`;
            
            // Se ainda houver sobreposição, mover para baixo
            if (this.isOverlapping(field1, field2)) {
                field2.style.top = `${currentTop + overlapY + 10}px`;
            }
        }
    }

    /**
     * Salva as posições dos campos
     */
    saveFieldPositions() {
        const positions = {};
        const zoom = window.zoomManager ? window.zoomManager.getCurrentZoom() : 1;
        
        this.fields.forEach((field, id) => {
            const rect = field.getBoundingClientRect();
            
            // Salvar posições considerando o zoom
            positions[id] = {
                left: rect.left / zoom,
                top: rect.top / zoom,
                width: field.offsetWidth,
                height: field.offsetHeight,
                minimized: field.classList.contains('minimized'),
                visible: field.style.display !== 'none'
            };
        });
        
        localStorage.setItem('field-positions', JSON.stringify(positions));
    }

    /**
     * Carrega as posições dos campos
     */
    loadFieldPositions() {
        const saved = localStorage.getItem('field-positions');
        if (!saved) return;
        
        try {
            const positions = JSON.parse(saved);
            const zoom = window.zoomManager ? window.zoomManager.getCurrentZoom() : 1;
            
            Object.entries(positions).forEach(([id, pos]) => {
                const field = document.querySelector(`[data-field="${id}"]`);
                if (field) {
                    // Aplicar posições considerando o zoom
                    field.style.left = `${pos.left * zoom}px`;
                    field.style.top = `${pos.top * zoom}px`;
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
        } catch (error) {
            console.error('Erro ao carregar posições dos campos:', error);
        }
    }

    /**
     * Restaura todos os campos
     */
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

    /**
     * Reseta as posições dos campos para o padrão
     */
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
        this.preventOverlap();
    }

    /**
     * Organiza os campos automaticamente
     */
    autoArrange() {
        const fields = Array.from(this.fields.values()).filter(f => f.style.display !== 'none');
        const zoom = window.zoomManager ? window.zoomManager.getCurrentZoom() : 1;
        
        // Usar dimensões da janela
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        const cols = 3;
        const rows = Math.ceil(fields.length / cols);
        const fieldWidth = (windowWidth - 100) / cols;
        const fieldHeight = (windowHeight - 100) / rows;
        
        fields.forEach((field, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            const left = (50 + col * (fieldWidth + 20)) * zoom;
            const top = (50 + row * (fieldHeight + 20)) * zoom;
            
            field.style.left = `${left}px`;
            field.style.top = `${top}px`;
            field.style.width = `${fieldWidth}px`;
            field.style.height = `${fieldHeight}px`;
        });
        
        this.saveFieldPositions();
    }
}

// Inicializar o sistema quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', () => {
    window.fieldManager = new FieldManager();
});

export default FieldManager; 