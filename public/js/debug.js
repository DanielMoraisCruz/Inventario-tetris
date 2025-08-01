/**
 * Sistema de Debug
 * Fornece informações úteis para desenvolvimento
 */

class DebugManager {
    constructor() {
        this.isVisible = false;
        this.init();
    }

    init() {
        this.createDebugButton();
        this.createDebugPanel();
    }

    createDebugButton() {
        const debugBtn = document.createElement('button');
        debugBtn.id = 'debug-btn';
        debugBtn.className = 'btn debug-btn';
        debugBtn.innerHTML = '🐛 Debug';
        debugBtn.title = 'Mostrar/Ocultar informações de debug';
        debugBtn.style.position = 'fixed';
        debugBtn.style.top = '10px';
        debugBtn.style.left = '10px';
        debugBtn.style.zIndex = '1000';
        debugBtn.style.background = '#ff6b6b';
        debugBtn.style.color = 'white';
        debugBtn.style.border = 'none';
        debugBtn.style.borderRadius = '6px';
        debugBtn.style.padding = '6px 10px';
        debugBtn.style.cursor = 'pointer';
        debugBtn.style.fontSize = '0.8rem';
        debugBtn.style.opacity = '0.7';
        debugBtn.style.transition = 'opacity 0.2s';
        
        debugBtn.addEventListener('mouseenter', () => {
            debugBtn.style.opacity = '1';
        });
        
        debugBtn.addEventListener('mouseleave', () => {
            if (!this.isVisible) {
                debugBtn.style.opacity = '0.7';
            }
        });
        
        debugBtn.addEventListener('click', () => {
            this.toggleDebug();
        });
        
        document.body.appendChild(debugBtn);
    }

    createDebugPanel() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 50px;
            left: 10px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            max-width: 300px;
            z-index: 999;
            display: none;
            border: 1px solid #333;
        `;
        
        document.body.appendChild(debugPanel);
    }

    toggleDebug() {
        const panel = document.getElementById('debug-panel');
        const btn = document.getElementById('debug-btn');
        
        this.isVisible = !this.isVisible;
        
        if (this.isVisible) {
            panel.style.display = 'block';
            btn.style.opacity = '1';
            this.updateDebugInfo();
        } else {
            panel.style.display = 'none';
            btn.style.opacity = '0.7';
        }
    }

    updateDebugInfo() {
        const panel = document.getElementById('debug-panel');
        
        const info = {
            'Campos Ativos': window.fieldManager ? window.fieldManager.fields.size : 0,
            'Zoom Atual': window.zoomManager ? `${Math.round(window.zoomManager.getCurrentZoom() * 100)}%` : 'N/A',
            'Abas Laterais': {
                'Esquerda': window.sidebarManager?.sidebarLeft?.classList.contains('minimized') ? 'Minimizada' : 'Visível',
                'Direita': window.sidebarManager?.sidebarRight?.classList.contains('minimized') ? 'Minimizada' : 'Visível'
            },
            'Campos Fechados': window.sidebarManager ? window.sidebarManager.closedFields.size : 0,
            'Tela': `${window.innerWidth}x${window.innerHeight}`,
            'Timestamp': new Date().toLocaleTimeString()
        };
        
        let html = '<h4 style="margin: 0 0 10px 0; color: #ff6b6b;">🐛 Debug Info</h4>';
        
        Object.entries(info).forEach(([key, value]) => {
            if (typeof value === 'object') {
                html += `<div style="margin: 5px 0;"><strong>${key}:</strong></div>`;
                Object.entries(value).forEach(([subKey, subValue]) => {
                    html += `<div style="margin-left: 10px; color: #ccc;">${subKey}: ${subValue}</div>`;
                });
            } else {
                html += `<div style="margin: 5px 0;"><strong>${key}:</strong> ${value}</div>`;
            }
        });
        
        html += '<div style="margin-top: 10px; font-size: 10px; color: #666;">Clique no botão para ocultar</div>';
        
        panel.innerHTML = html;
    }
}

// Inicializar quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', () => {
    window.debugManager = new DebugManager();
});

export default DebugManager; 