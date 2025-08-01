/**
 * Sistema de Debug para verificar carregamento dos campos
 */

class DebugManager {
    constructor() {
        this.init();
    }

    init() {
        // Aguardar um pouco para garantir que tudo carregou
        setTimeout(() => {
            this.checkFields();
            this.setupDebugControls();
        }, 1000);
    }

    checkFields() {
        const fields = document.querySelectorAll('.field');
        console.log(`🔍 Debug: Encontrados ${fields.length} campos`);
        
        fields.forEach((field, index) => {
            const rect = field.getBoundingClientRect();
            const isVisible = field.style.display !== 'none';
            console.log(`Campo ${index + 1}: ${field.dataset.field} - Visível: ${isVisible} - Pos: (${rect.left}, ${rect.top})`);
        });

        // Verificar se os managers estão funcionando
        console.log('🔍 Zoom Manager:', window.zoomManager ? '✅ Carregado' : '❌ Não carregado');
        console.log('🔍 Field Manager:', window.fieldManager ? '✅ Carregado' : '❌ Não carregado');
    }

    setupDebugControls() {
        // Adicionar botão de debug
        const debugBtn = document.createElement('button');
        debugBtn.textContent = '🐛 Debug';
        debugBtn.className = 'btn';
        debugBtn.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 10000;
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
        `;
        
        debugBtn.addEventListener('click', () => {
            this.checkFields();
            alert('Debug executado! Verifique o console.');
        });

        document.body.appendChild(debugBtn);
    }
}

// Inicializar debug quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', () => {
    window.debugManager = new DebugManager();
}); 