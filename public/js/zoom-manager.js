/**
 * Sistema de Gerenciamento de Zoom e Pan
 * Versão simplificada e robusta
 */

class ZoomManager {
    constructor() {
        this.currentZoom = 1;
        this.minZoom = 0.25;
        this.maxZoom = 3;
        this.zoomStep = 0.1;
        this.container = document.querySelector('.ficha-container');
        this.indicator = document.getElementById('zoom-indicator');
        this.panIndicator = document.getElementById('pan-indicator');
        
        // Sistema de pan simplificado
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        this.panOffset = { x: 0, y: 0 };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSavedZoom();
        this.updateTransform();
    }

    setupEventListeners() {
        // Zoom com Ctrl + Scroll
        document.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -1 : 1;
                const newZoom = this.currentZoom + (delta * this.zoomStep);
                this.setZoom(newZoom);
            }
        }, { passive: false });

        // Zoom com teclado
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                if (e.key === '+' || e.key === '=') {
                    e.preventDefault();
                    this.setZoom(this.currentZoom + this.zoomStep);
                } else if (e.key === '-') {
                    e.preventDefault();
                    this.setZoom(this.currentZoom - this.zoomStep);
                } else if (e.key === '0') {
                    e.preventDefault();
                    this.resetAll();
                }
            }
        });

        // Pan com botão do meio
        document.addEventListener('mousedown', (e) => {
            if (e.button === 1) {
                e.preventDefault();
                this.startPan(e);
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                e.preventDefault();
                this.handlePan(e);
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 1 && this.isPanning) {
                e.preventDefault();
                this.endPan();
            }
        });

        // Prevenir zoom do navegador
        document.addEventListener('gesturestart', e => e.preventDefault());
        document.addEventListener('gesturechange', e => e.preventDefault());
        document.addEventListener('gestureend', e => e.preventDefault());
    }

    startPan(event) {
        this.isPanning = true;
        this.panStart = { x: event.clientX, y: event.clientY };
        document.body.classList.add('panning');
        this.showPanIndicator();
    }

    handlePan(event) {
        if (!this.isPanning) return;

        const deltaX = event.clientX - this.panStart.x;
        const deltaY = event.clientY - this.panStart.y;

        this.panOffset.x += deltaX;
        this.panOffset.y += deltaY;

        this.panStart = { x: event.clientX, y: event.clientY };
        this.updateTransform();
    }

    endPan() {
        this.isPanning = false;
        document.body.classList.remove('panning');
        this.hidePanIndicator();
    }

    setZoom(zoom) {
        this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
        this.updateTransform();
        this.saveZoom();
        this.showIndicator();
    }

    resetAll() {
        this.currentZoom = 1;
        this.panOffset = { x: 0, y: 0 };
        this.updateTransform();
        this.saveZoom();
        this.showIndicator();
    }

    resetPan() {
        this.panOffset = { x: 0, y: 0 };
        this.updateTransform();
    }

    updateTransform() {
        if (!this.container) return;

        // Aplicar transformação combinada
        const transform = `translate(${this.panOffset.x}px, ${this.panOffset.y}px) scale(${this.currentZoom})`;
        this.container.style.transform = transform;

        // Ajustar overflow baseado no zoom
        if (this.currentZoom < 1) {
            document.body.classList.add('zoomed');
        } else {
            document.body.classList.remove('zoomed');
        }

        // Atualizar indicador
        if (this.indicator) {
            this.indicator.textContent = `Zoom: ${Math.round(this.currentZoom * 100)}%`;
        }

        // Disparar evento
        window.dispatchEvent(new CustomEvent('zoomChanged', { 
            detail: { zoom: this.currentZoom, pan: this.panOffset } 
        }));
    }

    showIndicator() {
        if (this.indicator) {
            this.indicator.classList.add('show');
            clearTimeout(this.indicatorTimeout);
            this.indicatorTimeout = setTimeout(() => {
                this.indicator.classList.remove('show');
            }, 2000);
        }
    }

    showPanIndicator() {
        if (this.panIndicator) {
            this.panIndicator.classList.add('show');
        }
    }

    hidePanIndicator() {
        if (this.panIndicator) {
            this.panIndicator.classList.remove('show');
        }
    }

    saveZoom() {
        localStorage.setItem('zoom-level', this.currentZoom.toString());
        localStorage.setItem('pan-offset', JSON.stringify(this.panOffset));
    }

    loadSavedZoom() {
        const savedZoom = localStorage.getItem('zoom-level');
        const savedPan = localStorage.getItem('pan-offset');
        
        if (savedZoom) {
            const zoom = parseFloat(savedZoom);
            if (!isNaN(zoom) && zoom >= this.minZoom && zoom <= this.maxZoom) {
                this.currentZoom = zoom;
            }
        }
        
        if (savedPan) {
            try {
                this.panOffset = JSON.parse(savedPan);
            } catch (e) {
                this.panOffset = { x: 0, y: 0 };
            }
        }
    }

    getCurrentZoom() {
        return this.currentZoom;
    }

    getPanOffset() {
        return { ...this.panOffset };
    }

    /**
     * Converte coordenadas do viewport para coordenadas do container
     * Útil para elementos com position: absolute dentro do container transformado
     */
    getContainerCoordinates(mouseX, mouseY) {
        if (!this.container) return { x: 0, y: 0 };
        
        const rect = this.container.getBoundingClientRect();
        
        // Posição do mouse relativa ao container transformado
        const mouseXRelativeToContainer = mouseX - rect.left;
        const mouseYRelativeToContainer = mouseY - rect.top;
        
        // Inverter a transformação para obter coordenadas no espaço original do container
        // A transformação é: translate(panX, panY) scale(zoom)
        // Para inverter: (val - pan) / zoom
        const containerX = (mouseXRelativeToContainer - this.panOffset.x) / this.currentZoom;
        const containerY = (mouseYRelativeToContainer - this.panOffset.y) / this.currentZoom;
        
        return { x: containerX, y: containerY };
    }

    /**
     * Posiciona automaticamente a tela para mostrar todos os itens/campos visíveis
     */
    centerOnItems() {
        if (!this.container) return;

        // Aguardar um pouco para garantir que os campos estejam posicionados
        setTimeout(() => {
            const fields = document.querySelectorAll('.field');
            const inventoryGrid = document.querySelector('.inventory-grid');
            
            if (fields.length === 0 && !inventoryGrid) {
                console.log('🔍 ZoomManager: Nenhum campo ou inventário encontrado para centralizar');
                return;
            }

            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;
            let hasVisibleElements = false;

            // Calcular limites dos campos
            fields.forEach(field => {
                const rect = field.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0 && field.style.display !== 'none') {
                    const fieldLeft = parseFloat(field.style.left) || 0;
                    const fieldTop = parseFloat(field.style.top) || 0;
                    const fieldWidth = parseFloat(field.style.width) || rect.width;
                    const fieldHeight = parseFloat(field.style.height) || rect.height;

                    minX = Math.min(minX, fieldLeft);
                    minY = Math.min(minY, fieldTop);
                    maxX = Math.max(maxX, fieldLeft + fieldWidth);
                    maxY = Math.max(maxY, fieldTop + fieldHeight);
                    hasVisibleElements = true;
                }
            });

            // Calcular limites do inventário se existir
            if (inventoryGrid) {
                const rect = inventoryGrid.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    const inventoryLeft = rect.left;
                    const inventoryTop = rect.top;
                    const inventoryWidth = rect.width;
                    const inventoryHeight = rect.height;

                    minX = Math.min(minX, inventoryLeft);
                    minY = Math.min(minY, inventoryTop);
                    maxX = Math.max(maxX, inventoryLeft + inventoryWidth);
                    maxY = Math.max(maxY, inventoryTop + inventoryHeight);
                    hasVisibleElements = true;
                }
            }

            if (!hasVisibleElements) {
                console.log('🔍 ZoomManager: Nenhum elemento visível encontrado');
                return;
            }

            // Calcular dimensões do viewport
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Calcular dimensões da área dos itens
            const itemsWidth = maxX - minX;
            const itemsHeight = maxY - minY;

            // Calcular zoom ideal para caber tudo na tela com margem
            const margin = 50; // margem em pixels
            const zoomX = (viewportWidth - margin * 2) / itemsWidth;
            const zoomY = (viewportHeight - margin * 2) / itemsHeight;
            const idealZoom = Math.min(zoomX, zoomY, this.maxZoom);

            // Aplicar zoom
            this.setZoom(idealZoom);

            // Calcular posição central dos itens
            const centerX = minX + itemsWidth / 2;
            const centerY = minY + itemsHeight / 2;

            // Calcular offset para centralizar
            const containerRect = this.container.getBoundingClientRect();
            const containerCenterX = containerRect.width / 2;
            const containerCenterY = containerRect.height / 2;

            // Aplicar pan para centralizar
            this.panOffset.x = containerCenterX - (centerX * idealZoom);
            this.panOffset.y = containerCenterY - (centerY * idealZoom);

            // Atualizar transformação
            this.updateTransform();
            this.saveZoom();

            console.log('🎯 ZoomManager: Tela centralizada nos itens - Zoom:', Math.round(idealZoom * 100) + '%');
        }, 200); // Aguardar 200ms para garantir que todos os elementos estejam posicionados
    }
}

// Inicializar quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', () => {
    window.zoomManager = new ZoomManager();
});

export default ZoomManager; 