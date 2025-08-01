/**
 * Sistema de Debug - Versão Híbrida
 * Tenta usar Interact.js, mas tem fallback para sistema customizado
 */

class DebugManager {
    constructor() {
        this.debugField = null;
        this.isVisible = false;
        this.interactAvailable = false;
        this.interact = null;
        this.isDragging = false;
        this.startPos = { x: 0, y: 0 };
        this.startMouse = { x: 0, y: 0 };
        this.init();
    }

    async init() {
        await this.tryLoadInteract();
        this.setupKeyboardListener();
        this.createDebugField();
        this.loadDebugPosition();
    }

    async tryLoadInteract() {
        try {
            const interactModule = await import('interactjs');
            this.interact = interactModule.default;
            this.interactAvailable = true;
            console.log('✅ Debug: Interact.js carregado');
        } catch (error) {
            console.warn('⚠️ Debug: Interact.js não disponível, usando sistema customizado');
            this.interactAvailable = false;
        }
    }

    setupKeyboardListener() {
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.key === 'F1') {
                event.preventDefault();
                this.toggleDebug();
            }
        });
    }

    createDebugField() {
        // Remover campo de debug existente se houver
        const existingDebug = document.getElementById('debug-field');
        if (existingDebug) {
            existingDebug.remove();
        }

        // Criar novo campo de debug
        this.debugField = document.createElement('div');
        this.debugField.id = 'debug-field';
        this.debugField.className = 'field field-debug';
        this.debugField.setAttribute('data-x', '0');
        this.debugField.setAttribute('data-y', '0');
        this.debugField.style.display = 'none';
        this.debugField.style.position = 'absolute';
        this.debugField.style.zIndex = '9999';

        this.debugField.innerHTML = `
            <div class="field-header">
                <div class="field-title">DEBUG</div>
                <div class="field-controls">
                    <button class="field-control-btn" title="Minimizar">−</button>
                    <button class="field-control-btn" title="Fechar">×</button>
                </div>
            </div>
            <div class="field-content">
                <div id="debug-info">
                    <div><strong>Zoom:</strong> <span id="debug-zoom">100%</span></div>
                    <div><strong>Mouse:</strong> <span id="debug-mouse">0, 0</span></div>
                    <div><strong>Campos:</strong> <span id="debug-fields">0</span></div>
                    <div><strong>FPS:</strong> <span id="debug-fps">60</span></div>
                    <div><strong>Memória:</strong> <span id="debug-memory">0 MB</span></div>
                </div>
            </div>
            <div class="field-resizer"></div>
        `;

        document.body.appendChild(this.debugField);

        // Configurar controles
        this.setupDebugControls();

        // Configurar drag/resize
        if (this.interactAvailable && this.interact) {
            this.setupDebugInteract();
        } else {
            this.setupDebugCustom();
        }
    }

    setupDebugInteract() {
        if (!this.interact || !this.debugField) return;

        this.interact(this.debugField)
            .draggable({
                inertia: true,
                modifiers: [
                    this.interact.modifiers.restrictRect({
                        restriction: 'parent',
                        endOnly: true
                    })
                ],
                autoScroll: true,
                listeners: {
                    start: this.dragStartListener.bind(this),
                    move: this.dragMoveListener.bind(this),
                    end: this.dragEndListener.bind(this)
                }
            })
            .resizable({
                edges: { right: true, bottom: true, left: true, top: true },
                margin: 10,
                modifiers: [
                    this.interact.modifiers.restrictEdges({
                        outer: 'parent',
                        endOnly: true
                    }),
                    this.interact.modifiers.restrictSize({
                        min: { width: 200, height: 150 }
                    })
                ],
                listeners: {
                    move: this.resizeMoveListener.bind(this)
                }
            });
    }

    setupDebugCustom() {
        if (!this.debugField) return;

        // Configurar drag do cabeçalho
        const header = this.debugField.querySelector('.field-header');
        if (header) {
            header.addEventListener('mousedown', (e) => {
                if (e.button === 0) {
                    this.startDrag(e);
                }
            });
        }

        // Configurar redimensionamento
        const resizer = this.debugField.querySelector('.field-resizer');
        if (resizer) {
            resizer.addEventListener('mousedown', (e) => {
                if (e.button === 0) {
                    this.startResize(e);
                }
            });
        }

        // Event listeners globais
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    startDrag(event) {
        if (this.isDragging) return;
        
        this.isDragging = true;
        
        // Obter coordenadas do mouse no espaço do container
        const containerCoords = window.zoomManager ? 
            window.zoomManager.getContainerCoordinates(event.clientX, event.clientY) : 
            { x: event.clientX, y: event.clientY };
        
        // Obter a posição atual do campo
        const rect = this.debugField.getBoundingClientRect();
        const fieldContainerCoords = window.zoomManager ? 
            window.zoomManager.getContainerCoordinates(rect.left, rect.top) : 
            { x: rect.left, y: rect.top };
        
        this.startPos.x = fieldContainerCoords.x;
        this.startPos.y = fieldContainerCoords.y;
        this.startMouse.x = containerCoords.x;
        this.startMouse.y = containerCoords.y;
        
        this.debugField.classList.add('dragging');
        document.body.style.cursor = 'grabbing';
        event.stopPropagation();
        event.preventDefault();
    }

    startResize(event) {
        // Implementação básica de resize
        console.log('Debug resize iniciado');
    }

    handleMouseMove(event) {
        if (!this.isDragging) return;
        
        // Obter coordenadas do mouse no espaço do container
        const containerCoords = window.zoomManager ? 
            window.zoomManager.getContainerCoordinates(event.clientX, event.clientY) : 
            { x: event.clientX, y: event.clientY };
        
        // Calcular delta
        const deltaX = containerCoords.x - this.startMouse.x;
        const deltaY = containerCoords.y - this.startMouse.y;
        
        // Aplicar nova posição
        const newLeft = this.startPos.x + deltaX;
        const newTop = this.startPos.y + deltaY;
        
        this.debugField.style.left = `${newLeft}px`;
        this.debugField.style.top = `${newTop}px`;
        
        event.preventDefault();
    }

    handleMouseUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.debugField.classList.remove('dragging');
            document.body.style.cursor = '';
            this.saveDebugPosition();
        }
    }

    // Métodos do Interact.js
    dragStartListener(event) {
        event.target.classList.add('dragging');
        event.target.style.zIndex = '10000';
    }

    dragMoveListener(event) {
        const target = event.target;
        
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
    }

    dragEndListener(event) {
        const target = event.target;
        target.classList.remove('dragging');
        target.style.zIndex = '9999';
        
        this.saveDebugPosition();
    }

    resizeMoveListener(event) {
        const target = event.target;
        
        target.style.width = event.rect.width + 'px';
        target.style.height = event.rect.height + 'px';

        const x = (parseFloat(target.getAttribute('data-x')) || 0);
        const y = (parseFloat(target.getAttribute('data-y')) || 0);

        target.style.transform = `translate(${x}px, ${y}px)`;
    }

    setupDebugControls() {
        const minimizeBtn = this.debugField.querySelector('.field-control-btn[title="Minimizar"]');
        const closeBtn = this.debugField.querySelector('.field-control-btn[title="Fechar"]');

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMinimize();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hideDebug();
            });
        }
    }

    toggleMinimize() {
        const content = this.debugField.querySelector('.field-content');
        const btn = this.debugField.querySelector('.field-control-btn[title="Minimizar"]');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            btn.textContent = '−';
            btn.title = 'Minimizar';
        } else {
            content.style.display = 'none';
            btn.textContent = '+';
            btn.title = 'Expandir';
        }
    }

    toggleDebug() {
        if (this.isVisible) {
            this.hideDebug();
        } else {
            this.showDebug();
        }
    }

    showDebug() {
        if (this.debugField) {
            this.debugField.style.display = 'block';
            this.isVisible = true;
            this.updateDebugInfo();
            
            // Atualizar informações a cada segundo
            this.debugInterval = setInterval(() => {
                this.updateDebugInfo();
            }, 1000);
        }
    }

    hideDebug() {
        if (this.debugField) {
            this.debugField.style.display = 'none';
            this.isVisible = false;
            
            if (this.debugInterval) {
                clearInterval(this.debugInterval);
                this.debugInterval = null;
            }
        }
    }

    updateDebugInfo() {
        if (!this.debugField || !this.isVisible) return;

        // Zoom
        const zoomElement = this.debugField.querySelector('#debug-zoom');
        if (zoomElement && window.zoomManager) {
            const zoom = Math.round(window.zoomManager.getZoom() * 100);
            zoomElement.textContent = `${zoom}%`;
        }

        // Mouse position
        const mouseElement = this.debugField.querySelector('#debug-mouse');
        if (mouseElement) {
            mouseElement.textContent = `${Math.round(window.mouseX || 0)}, ${Math.round(window.mouseY || 0)}`;
        }

        // Campos ativos
        const fieldsElement = this.debugField.querySelector('#debug-fields');
        if (fieldsElement && window.fieldManager) {
            const visibleFields = Array.from(document.querySelectorAll('.field')).filter(f => f.style.display !== 'none').length;
            fieldsElement.textContent = visibleFields;
        }

        // FPS (simulado)
        const fpsElement = this.debugField.querySelector('#debug-fps');
        if (fpsElement) {
            fpsElement.textContent = '60';
        }

        // Memória (simulado)
        const memoryElement = this.debugField.querySelector('#debug-memory');
        if (memoryElement) {
            memoryElement.textContent = '0 MB';
        }
    }

    saveDebugPosition() {
        if (!this.debugField) return;

        const x = parseFloat(this.debugField.getAttribute('data-x')) || 0;
        const y = parseFloat(this.debugField.getAttribute('data-y')) || 0;
        const width = this.debugField.style.width;
        const height = this.debugField.style.height;

        const position = { x, y, width, height };
        localStorage.setItem('debug-position', JSON.stringify(position));
    }

    loadDebugPosition() {
        if (!this.debugField) return;

        const saved = localStorage.getItem('debug-position');
        if (saved) {
            try {
                const position = JSON.parse(saved);
                
                if (this.interactAvailable) {
                    this.debugField.setAttribute('data-x', position.x);
                    this.debugField.setAttribute('data-y', position.y);
                    this.debugField.style.transform = `translate(${position.x}px, ${position.y}px)`;
                } else {
                    this.debugField.style.left = `${position.x}px`;
                    this.debugField.style.top = `${position.y}px`;
                }
                
                if (position.width) this.debugField.style.width = position.width;
                if (position.height) this.debugField.style.height = position.height;
            } catch (error) {
                console.error('Erro ao carregar posição do debug:', error);
            }
        }
    }
}

// Inicializar quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', () => {
    window.debugManager = new DebugManager();
});

export default DebugManager; 