/**
 * Sistema de Gerenciamento de Zoom
 * Permite zoom in/out com Ctrl + Scroll
 */

class ZoomManager {
    constructor() {
        this.currentZoom = 1;
        this.minZoom = 0.5;
        this.maxZoom = 3;
        this.zoomStep = 0.1;
        this.container = document.querySelector('.ficha-container');
        this.indicator = document.getElementById('zoom-indicator');
        
        this.init();
    }

    /**
     * Inicializa o sistema de zoom
     */
    init() {
        this.setupEventListeners();
        this.loadSavedZoom();
        this.updateZoom();
    }

    /**
     * Configura os event listeners
     */
    setupEventListeners() {
        // Zoom com Ctrl + Scroll
        document.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                this.handleZoom(e);
            }
        }, { passive: false });

        // Zoom com Ctrl + +/- (teclado)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                if (e.key === '+' || e.key === '=') {
                    e.preventDefault();
                    this.zoomIn();
                } else if (e.key === '-') {
                    e.preventDefault();
                    this.zoomOut();
                } else if (e.key === '0') {
                    e.preventDefault();
                    this.resetZoom();
                }
            }
        });

        // Prevenir zoom do navegador
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });

        document.addEventListener('gesturechange', (e) => {
            e.preventDefault();
        });

        document.addEventListener('gestureend', (e) => {
            e.preventDefault();
        });
    }

    /**
     * Manipula o zoom com scroll
     */
    handleZoom(event) {
        const delta = event.deltaY > 0 ? -1 : 1;
        const newZoom = this.currentZoom + (delta * this.zoomStep);
        this.setZoom(newZoom);
    }

    /**
     * Aumenta o zoom
     */
    zoomIn() {
        const newZoom = Math.min(this.currentZoom + this.zoomStep, this.maxZoom);
        this.setZoom(newZoom);
    }

    /**
     * Diminui o zoom
     */
    zoomOut() {
        const newZoom = Math.max(this.currentZoom - this.zoomStep, this.minZoom);
        this.setZoom(newZoom);
    }

    /**
     * Reseta o zoom para 100%
     */
    resetZoom() {
        this.setZoom(1);
    }

    /**
     * Define o zoom
     */
    setZoom(zoom) {
        this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
        this.updateZoom();
        this.saveZoom();
        this.showIndicator();
    }

    /**
     * Atualiza a interface com o zoom atual
     */
    updateZoom() {
        if (this.container) {
            this.container.style.transform = `scale(${this.currentZoom})`;
            
            // Ajustar overflow baseado no zoom
            if (this.currentZoom > 1) {
                document.body.classList.add('zoomed');
            } else {
                document.body.classList.remove('zoomed');
            }
        }

        if (this.indicator) {
            this.indicator.textContent = `Zoom: ${Math.round(this.currentZoom * 100)}%`;
        }
        
        // Disparar evento de mudança de zoom
        window.dispatchEvent(new CustomEvent('zoomChanged', { detail: { zoom: this.currentZoom } }));
    }

    /**
     * Mostra o indicador de zoom
     */
    showIndicator() {
        if (this.indicator) {
            this.indicator.classList.add('show');
            
            // Esconder após 2 segundos
            clearTimeout(this.indicatorTimeout);
            this.indicatorTimeout = setTimeout(() => {
                this.indicator.classList.remove('show');
            }, 2000);
        }
    }

    /**
     * Salva o zoom no localStorage
     */
    saveZoom() {
        localStorage.setItem('zoom-level', this.currentZoom.toString());
    }

    /**
     * Carrega o zoom salvo
     */
    loadSavedZoom() {
        const saved = localStorage.getItem('zoom-level');
        if (saved) {
            const zoom = parseFloat(saved);
            if (!isNaN(zoom) && zoom >= this.minZoom && zoom <= this.maxZoom) {
                this.currentZoom = zoom;
            }
        }
    }

    /**
     * Obtém o zoom atual
     */
    getCurrentZoom() {
        return this.currentZoom;
    }

    /**
     * Converte coordenadas do mouse para coordenadas do container
     */
    getContainerCoordinates(mouseX, mouseY) {
        const rect = this.container.getBoundingClientRect();
        return {
            x: (mouseX - rect.left) / this.currentZoom,
            y: (mouseY - rect.top) / this.currentZoom
        };
    }

    /**
     * Converte coordenadas do container para coordenadas da tela
     */
    getScreenCoordinates(containerX, containerY) {
        const rect = this.container.getBoundingClientRect();
        return {
            x: containerX * this.currentZoom + rect.left,
            y: containerY * this.currentZoom + rect.top
        };
    }
}

// Inicializar o sistema quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', () => {
    window.zoomManager = new ZoomManager();
});

export default ZoomManager; 