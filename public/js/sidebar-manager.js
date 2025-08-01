/**
 * Gerenciador das Abas Laterais
 * Gerencia abas esquerda (itens) e direita (telas fechadas)
 */

class SidebarManager {
    constructor() {
        // Aba esquerda
        this.sidebarLeft = document.getElementById('sidebar-left');
        this.contentLeft = document.getElementById('sidebar-left-content');
        this.toggleLeft = document.getElementById('sidebar-left-toggle');
        this.resizerLeft = document.getElementById('sidebar-left-resizer');
        
        // Aba direita
        this.sidebarRight = document.getElementById('sidebar-right');
        this.contentRight = document.getElementById('sidebar-right-content');
        this.toggleRight = document.getElementById('sidebar-right-toggle');
        this.resizerRight = document.getElementById('sidebar-right-resizer');
        
        this.closedFields = new Map();
        this.isResizing = false;
        this.resizeTarget = null;
        this.startSize = { width: 0 };
        this.startMouse = { x: 0 };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadClosedFields();
        this.loadSidebarState();
    }

    setupEventListeners() {
        // Toggle da aba esquerda
        this.toggleLeft.addEventListener('click', () => {
            this.toggleSidebar('left');
        });

        // Toggle da aba direita
        this.toggleRight.addEventListener('click', () => {
            this.toggleSidebar('right');
        });

        // Redimensionamento das abas
        this.resizerLeft.addEventListener('mousedown', (e) => {
            this.startResize('left', e);
        });

        this.resizerRight.addEventListener('mousedown', (e) => {
            this.startResize('right', e);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isResizing) {
                this.handleResize(e);
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isResizing) {
                this.endResize();
            }
        });
    }

    toggleSidebar(side) {
        const sidebar = side === 'left' ? this.sidebarLeft : this.sidebarRight;
        const toggle = side === 'left' ? this.toggleLeft : this.toggleRight;
        
        sidebar.classList.toggle('minimized');
        toggle.textContent = sidebar.classList.contains('minimized') ? '+' : '−';
        this.saveSidebarState();
    }

    startResize(side, event) {
        this.isResizing = true;
        this.resizeTarget = side;
        const sidebar = side === 'left' ? this.sidebarLeft : this.sidebarRight;
        this.startSize.width = sidebar.offsetWidth;
        this.startMouse.x = event.clientX;
        document.body.style.cursor = 'ew-resize';
        event.stopPropagation();
    }

    handleResize(event) {
        const sidebar = this.resizeTarget === 'left' ? this.sidebarLeft : this.sidebarRight;
        const deltaX = this.resizeTarget === 'left' ? 
            event.clientX - this.startMouse.x : 
            this.startMouse.x - event.clientX;
        
        const newWidth = this.startSize.width + deltaX;
        const minWidth = 200;
        const maxWidth = window.innerWidth * 0.4;
        const clampedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
        
        sidebar.style.width = `${clampedWidth}px`;
    }

    endResize() {
        this.isResizing = false;
        this.resizeTarget = null;
        document.body.style.cursor = '';
        this.saveSidebarState();
    }

    addClosedField(field) {
        const fieldId = field.dataset.field;
        const fieldTitle = field.querySelector('.field-title').textContent;
        
        // Criar elemento da tela fechada
        const closedField = document.createElement('div');
        closedField.className = 'closed-field';
        closedField.dataset.fieldId = fieldId;
        closedField.innerHTML = `
            <div class="closed-field-title">${fieldTitle}</div>
            <div class="closed-field-info">Clique e arraste para restaurar</div>
        `;

        // Configurar drag para restaurar
        closedField.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.startDragClosedField(closedField, e);
            }
        });

        this.contentRight.appendChild(closedField);
        this.closedFields.set(fieldId, {
            element: closedField,
            originalField: field,
            title: fieldTitle
        });

        this.saveClosedFields();
    }

    startDragClosedField(closedField, event) {
        const fieldId = closedField.dataset.fieldId;
        const fieldData = this.closedFields.get(fieldId);
        
        if (!fieldData) return;

        // Criar clone para drag
        const dragClone = fieldData.originalField.cloneNode(true);
        dragClone.style.position = 'fixed';
        dragClone.style.zIndex = '5000';
        dragClone.style.opacity = '0.8';
        dragClone.style.pointerEvents = 'none';
        document.body.appendChild(dragClone);

        const startX = event.clientX;
        const startY = event.clientY;
        const startLeft = dragClone.offsetLeft;
        const startTop = dragClone.offsetTop;

        const handleMouseMove = (e) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            dragClone.style.left = `${startLeft + deltaX}px`;
            dragClone.style.top = `${startTop + deltaY}px`;
        };

        const handleMouseUp = (e) => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.removeChild(dragClone);

            // Verificar se soltou na área principal
            const container = document.querySelector('.ficha-container');
            const containerRect = container.getBoundingClientRect();
            
            if (e.clientX >= containerRect.left && e.clientX <= containerRect.right &&
                e.clientY >= containerRect.top && e.clientY <= containerRect.bottom) {
                this.restoreField(fieldId);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    restoreField(fieldId) {
        const fieldData = this.closedFields.get(fieldId);
        if (!fieldData) return;

        const { originalField, element } = fieldData;
        
        // Remover da aba lateral
        element.remove();
        this.closedFields.delete(fieldId);
        
        // Restaurar o campo original
        originalField.style.display = '';
        originalField.style.left = '50px';
        originalField.style.top = '50px';
        
        // Reativar o campo no field manager
        if (window.fieldManager) {
            window.fieldManager.fields.set(fieldId, originalField);
            window.fieldManager.setupFieldControls();
        }
        
        this.saveClosedFields();
    }

    removeClosedField(fieldId) {
        const fieldData = this.closedFields.get(fieldId);
        if (fieldData) {
            fieldData.element.remove();
            this.closedFields.delete(fieldId);
            this.saveClosedFields();
        }
    }

    saveClosedFields() {
        const closedFieldsData = {};
        this.closedFields.forEach((data, fieldId) => {
            closedFieldsData[fieldId] = {
                title: data.title
            };
        });
        localStorage.setItem('closed-fields', JSON.stringify(closedFieldsData));
    }

    loadClosedFields() {
        const saved = localStorage.getItem('closed-fields');
        if (saved) {
            try {
                const closedFieldsData = JSON.parse(saved);
                Object.keys(closedFieldsData).forEach(fieldId => {
                    // Criar placeholder para campos fechados salvos
                    const closedField = document.createElement('div');
                    closedField.className = 'closed-field';
                    closedField.dataset.fieldId = fieldId;
                    closedField.innerHTML = `
                        <div class="closed-field-title">${closedFieldsData[fieldId].title}</div>
                        <div class="closed-field-info">Campo fechado</div>
                    `;
                    this.contentRight.appendChild(closedField);
                });
            } catch (error) {
                console.error('Erro ao carregar campos fechados:', error);
            }
        }
    }

    saveSidebarState() {
        const state = {
            minimizedLeft: this.sidebarLeft.classList.contains('minimized'),
            minimizedRight: this.sidebarRight.classList.contains('minimized'),
            widthLeft: this.sidebarLeft.style.width || '250px',
            widthRight: this.sidebarRight.style.width || '250px'
        };
        localStorage.setItem('sidebar-state', JSON.stringify(state));
    }

    loadSidebarState() {
        const saved = localStorage.getItem('sidebar-state');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state.minimizedLeft) {
                    this.sidebarLeft.classList.add('minimized');
                    this.toggleLeft.textContent = '+';
                }
                if (state.minimizedRight) {
                    this.sidebarRight.classList.add('minimized');
                    this.toggleRight.textContent = '+';
                }
                if (state.widthLeft) {
                    this.sidebarLeft.style.width = state.widthLeft;
                }
                if (state.widthRight) {
                    this.sidebarRight.style.width = state.widthRight;
                }
            } catch (error) {
                console.error('Erro ao carregar estado da aba:', error);
            }
        }
    }
}

// Inicializar quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', () => {
    window.sidebarManager = new SidebarManager();
});

export default SidebarManager; 