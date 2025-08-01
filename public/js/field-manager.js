/**
 * Gerenciador de Campos - Versão Híbrida
 * Tenta usar Interact.js, mas tem fallback para sistema customizado
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
        this.interactAvailable = false;
        this.init();
    }

    async init() {
        console.log('🔧 FieldManager: Iniciando...');
        
        // Verificar se o container existe
        const container = document.querySelector('.ficha-container');
        if (!container) {
            console.error('🔧 FieldManager: Container .ficha-container não encontrado!');
            return;
        }
        console.log('🔧 FieldManager: Container encontrado:', container);
        
        // Tentar carregar Interact.js
        await this.tryLoadInteract();
        
        if (this.interactAvailable) {
            console.log('🔧 FieldManager: Usando Interact.js');
            this.initInteract();
        } else {
            console.log('🔧 FieldManager: Usando sistema customizado');
            this.initCustomSystem();
        }
        
        this.loadFieldPositions();
        this.setupFieldControls();
        
        console.log('🔧 FieldManager: Inicialização completa');
        console.log('🔧 FieldManager: Campos encontrados:', this.fields.size);
    }

    async tryLoadInteract() {
        try {
            // Tentar importar Interact.js
            const interactModule = await import('interactjs');
            this.interact = interactModule.default;
            this.interactAvailable = true;
            console.log('✅ Interact.js carregado com sucesso');
        } catch (error) {
            console.warn('⚠️ Interact.js não disponível, usando sistema customizado');
            this.interactAvailable = false;
        }
    }

    initInteract() {
        if (!this.interact) return;
        
        // Configurar drag para todos os campos
        this.interact('.field')
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

    initCustomSystem() {
        this.setupEventListeners();
        this.setupFieldDrag();
    }

    setupEventListeners() {
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Prevenir seleção de texto durante drag
        document.addEventListener('selectstart', (e) => {
            // Não interferir com drag de itens
            if (e.target.closest('.item') || e.target.closest('#item-list') || 
                e.target.closest('#drag-ghost') || e.target.closest('#inventory') ||
                (window.draggedItem && window.draggedItem !== null)) { // Verificar se há um item sendo arrastado globalmente
                return;
            }
            
            if (this.isDragging || this.isResizing) {
                e.preventDefault();
            }
        });
    }

    setupFieldDrag() {
        const fields = document.querySelectorAll('.field');
        console.log('🔧 FieldManager: Encontrados', fields.length, 'campos');
        
        fields.forEach(field => {
            const fieldId = field.dataset.field;
            console.log('🔧 FieldManager: Configurando campo:', fieldId);
            this.fields.set(fieldId, field);
            
            // Configurar drag do cabeçalho
            const header = field.querySelector('.field-header');
            if (header) {
                header.addEventListener('mousedown', (e) => {
                    // Verificar se não está arrastando um item
                    if (e.target.closest('.item') || e.target.closest('#item-list') ||
                        (window.draggedItem && window.draggedItem !== null)) { // Verificar se há um item sendo arrastado globalmente
                        return; // Não interferir com drag de itens
                    }
                    
                    // Verificação especial para o campo de inventário
                    if (field.classList.contains('field-inventory')) {
                        // Permitir drag apenas no cabeçalho, não no conteúdo
                        if (!e.target.closest('.field-header')) {
                            return;
                        }
                    }
                    
                    if (e.button === 0) { // Apenas botão esquerdo
                        this.startDrag(field, e);
                    }
                });
            }
            
            // Configurar redimensionamento
            const resizer = field.querySelector('.field-resizer');
            if (resizer) {
                resizer.addEventListener('mousedown', (e) => {
                    // Verificar se não está arrastando um item
                    if (e.target.closest('.item') || e.target.closest('#item-list') ||
                        (window.draggedItem && window.draggedItem !== null)) { // Verificar se há um item sendo arrastado globalmente
                        return; // Não interferir com drag de itens
                    }
                    
                    if (e.button === 0) { // Apenas botão esquerdo
                        this.startResize(field, e);
                    }
                });
            }
        });
    }

    startDrag(field, event) {
        if (this.isResizing) return;
        
        // Verificar se não está arrastando um item
        if (event.target.closest('.item') || event.target.closest('#item-list') || 
            event.target.closest('#drag-ghost') || event.target.closest('#inventory') ||
            (window.draggedItem && window.draggedItem !== null)) { // Verificar se há um item sendo arrastado globalmente
            return; // Não interferir com drag de itens
        }
        
        this.isDragging = true;
        this.draggedField = field;
        
        // Obter coordenadas do mouse no espaço do container (considerando zoom e pan)
        const containerCoords = window.zoomManager ? 
            window.zoomManager.getContainerCoordinates(event.clientX, event.clientY) : 
            { x: event.clientX, y: event.clientY };
        
        // Obter a posição atual do campo no espaço do container
        const rect = field.getBoundingClientRect();
        const fieldContainerCoords = window.zoomManager ? 
            window.zoomManager.getContainerCoordinates(rect.left, rect.top) : 
            { x: rect.left, y: rect.top };
        
        this.startFieldLeft = fieldContainerCoords.x;
        this.startFieldTop = fieldContainerCoords.y;
        this.startMouseX = containerCoords.x;
        this.startMouseY = containerCoords.y;
        
        // Garantir que o campo tenha posição absoluta
        if (field.style.position !== 'absolute') {
            field.style.position = 'absolute';
        }
        
        field.classList.add('dragging');
        document.body.style.cursor = 'grabbing';
        event.stopPropagation();
        event.preventDefault();
    }

    startResize(field, event) {
        if (this.isDragging) return;
        
        // Verificar se não está arrastando um item
        if (event.target.closest('.item') || event.target.closest('#item-list') ||
            (window.draggedItem && window.draggedItem !== null)) { // Verificar se há um item sendo arrastado globalmente
            return; // Não interferir com drag de itens
        }
        
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
        // Verificar se não está arrastando um item
        if (event.target.closest('.item') || event.target.closest('#item-list') || 
            event.target.closest('#drag-ghost') || event.target.closest('#inventory') ||
            (window.draggedItem && window.draggedItem !== null)) { // Verificar se há um item sendo arrastado globalmente
            return; // Não interferir com drag de itens
        }
        
        if (this.isDragging && this.draggedField) {
            this.handleDrag(event);
        } else if (this.isResizing && this.resizingField) {
            this.handleResize(event);
        }
    }

    handleDrag(event) {
        if (!this.isDragging || !this.draggedField) return;
        
        // Verificar se não está arrastando um item
        if (event.target.closest('.item') || event.target.closest('#item-list') || 
            event.target.closest('#drag-ghost') || event.target.closest('#inventory') ||
            (window.draggedItem && window.draggedItem !== null)) { // Verificar se há um item sendo arrastado globalmente
            return; // Não interferir com drag de itens
        }
        
        // Obter coordenadas do mouse no espaço do container (considerando zoom e pan)
        const containerCoords = window.zoomManager ? 
            window.zoomManager.getContainerCoordinates(event.clientX, event.clientY) : 
            { x: event.clientX, y: event.clientY };
        
        // Calcular o delta de movimento do mouse no espaço do container
        const deltaX = containerCoords.x - this.startMouseX;
        const deltaY = containerCoords.y - this.startMouseY;
        
        // Aplicar o delta à posição inicial do campo
        const newLeft = this.startFieldLeft + deltaX;
        const newTop = this.startFieldTop + deltaY;
        
        // Garantir que o campo tenha posição absoluta
        if (this.draggedField.style.position !== 'absolute') {
            this.draggedField.style.position = 'absolute';
        }
        
        // Aplicar nova posição diretamente
        this.draggedField.style.left = `${newLeft}px`;
        this.draggedField.style.top = `${newTop}px`;
        
        // Prevenir seleção de texto durante o drag
        event.preventDefault();
    }

    handleResize(event) {
        if (!this.isResizing || !this.resizingField) return;
        
        // Verificar se não está arrastando um item
        if (event.target.closest('.item') || event.target.closest('#item-list') ||
            (window.draggedItem && window.draggedItem !== null)) { // Verificar se há um item sendo arrastado globalmente
            return; // Não interferir com drag de itens
        }
        
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
    }

    endResize() {
        this.resizingField.classList.remove('resizing');
        this.resizingField = null;
        this.isResizing = false;
        document.body.style.cursor = '';
        
        this.saveFieldPositions();
    }

    // Métodos do Interact.js
    dragStartListener(event) {
        event.target.classList.add('dragging');
        event.target.style.zIndex = '1000';
    }

    dragMoveListener(event) {
        const target = event.target;
        
        // Interact.js já lida com zoom automaticamente!
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
    }

    dragEndListener(event) {
        const target = event.target;
        target.classList.remove('dragging');
        target.style.zIndex = '';
        
        // Salvar posição
        this.saveFieldPosition(target);
    }

    resizeMoveListener(event) {
        const target = event.target;
        
        // Atualizar tamanho
        target.style.width = event.rect.width + 'px';
        target.style.height = event.rect.height + 'px';

        // Atualizar posição se necessário
        const x = (parseFloat(target.getAttribute('data-x')) || 0);
        const y = (parseFloat(target.getAttribute('data-y')) || 0);

        target.style.transform = `translate(${x}px, ${y}px)`;
    }

    setupFieldControls() {
        // Configurar botões de minimizar e fechar
        document.querySelectorAll('.field-control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevenir início do drag
                
                const field = btn.closest('.field');
                const title = btn.getAttribute('title');
                
                if (title === 'Minimizar') {
                    this.toggleMinimize(field, btn);
                } else if (title === 'Fechar') {
                    this.closeField(field);
                }
            });
        });
    }

    toggleMinimize(field, btn) {
        const content = field.querySelector('.field-content');
        const isMinimized = content.style.display === 'none';
        
        if (isMinimized) {
            content.style.display = 'block';
            btn.textContent = '−';
            btn.title = 'Minimizar';
        } else {
            content.style.display = 'none';
            btn.textContent = '+';
            btn.title = 'Expandir';
        }
    }

    closeField(field) {
        const fieldId = field.dataset.field;
        
        // Adicionar à lista de campos fechados
        if (window.sidebarManager) {
            window.sidebarManager.addClosedField(fieldId, field);
        }
        
        // Ocultar o campo
        field.style.display = 'none';
    }

    saveFieldPosition(field) {
        const fieldId = field.dataset.field;
        const x = parseFloat(field.getAttribute('data-x')) || 0;
        const y = parseFloat(field.getAttribute('data-y')) || 0;
        const width = field.style.width;
        const height = field.style.height;

        const position = { x, y, width, height };
        localStorage.setItem(`field-${fieldId}`, JSON.stringify(position));
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
        console.log('🔧 FieldManager: Carregando posições dos campos...');
        
        if (this.interactAvailable) {
            // Carregar posições para Interact.js
            document.querySelectorAll('.field').forEach(field => {
                const fieldId = field.dataset.field;
                const saved = localStorage.getItem(`field-${fieldId}`);
                
                if (saved) {
                    const position = JSON.parse(saved);
                    field.setAttribute('data-x', position.x);
                    field.setAttribute('data-y', position.y);
                    field.style.transform = `translate(${position.x}px, ${position.y}px)`;
                    
                    if (position.width) field.style.width = position.width;
                    if (position.height) field.style.height = position.height;
                }
            });
        } else {
            // Carregar posições para sistema customizado
            const saved = localStorage.getItem('field-positions');
            if (!saved) {
                console.log('🔧 FieldManager: Nenhuma posição salva encontrada, usando posições padrão');
                // Definir posições padrão se não houver posições salvas
                this.setDefaultPositions();
                return;
            }
            
            try {
                const positions = JSON.parse(saved);
                console.log('🔧 FieldManager: Posições carregadas:', positions);
                
                Object.entries(positions).forEach(([id, pos]) => {
                    const field = document.querySelector(`[data-field="${id}"]`);
                    if (field) {
                        field.style.left = `${pos.left}px`;
                        field.style.top = `${pos.top}px`;
                        field.style.width = `${pos.width}px`;
                        field.style.height = `${pos.height}px`;
                        
                        if (pos.minimized) {
                            this.toggleMinimize(field, field.querySelector('.field-control-btn[title="Minimizar"]'));
                        }
                        
                        if (!pos.visible) {
                            field.style.display = 'none';
                        }
                    }
                });
            } catch (error) {
                console.error('Erro ao carregar posições dos campos:', error);
                // Em caso de erro, usar posições padrão
                this.setDefaultPositions();
            }
        }
    }
    
    setDefaultPositions() {
        console.log('🔧 FieldManager: Definindo posições padrão...');
        
        const fields = document.querySelectorAll('.field');
        const positions = {
            'attributes': { left: 50, top: 50, width: 300, height: 200, visible: true },
            'inventory': { left: 370, top: 50, width: 400, height: 300, visible: true },
            'body': { left: 50, top: 270, width: 300, height: 250, visible: true },
            'skills': { left: 370, top: 370, width: 300, height: 200, visible: true },
            'spells': { left: 690, top: 370, width: 300, height: 200, visible: true }
        };
        
        Object.entries(positions).forEach(([id, pos]) => {
            const field = document.querySelector(`[data-field="${id}"]`);
            if (field) {
                console.log('🔧 FieldManager: Posicionando campo', id, 'em', pos.left, pos.top);
                field.style.left = `${pos.left}px`;
                field.style.top = `${pos.top}px`;
                field.style.width = `${pos.width}px`;
                field.style.height = `${pos.height}px`;
                field.style.display = 'block';
                field.style.position = 'absolute';
                field.style.visibility = 'visible';
                field.style.opacity = '1';
                field.style.zIndex = '10';
            } else {
                console.error('🔧 FieldManager: Campo não encontrado:', id);
            }
        });
        
        // Verificar se todos os campos estão visíveis
        setTimeout(() => {
            const allFields = document.querySelectorAll('.field');
            console.log('🔧 FieldManager: Verificação final - campos encontrados:', allFields.length);
            allFields.forEach(field => {
                const rect = field.getBoundingClientRect();
                console.log('🔧 FieldManager: Campo', field.dataset.field, '- visível:', rect.width > 0 && rect.height > 0, '- posição:', rect.left, rect.top);
            });
        }, 100);
    }

    // Método para adicionar novo campo dinamicamente
    addField(fieldElement) {
        const fieldId = fieldElement.dataset.field;
        this.fields.set(fieldId, fieldElement);
        
        if (this.interactAvailable && this.interact) {
            // Configurar Interact.js para o novo campo
            this.interact(fieldElement)
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
        } else {
            // Configurar sistema customizado para o novo campo
            const header = fieldElement.querySelector('.field-header');
            if (header) {
                header.addEventListener('mousedown', (e) => {
                    if (e.button === 0) {
                        this.startDrag(fieldElement, e);
                    }
                });
            }
        }
    }

    // Método para remover campo
    removeField(fieldId) {
        const field = this.fields.get(fieldId);
        if (field) {
            if (this.interactAvailable && this.interact) {
                this.interact(field).unset();
            }
            this.fields.delete(fieldId);
        }
    }
}

// Inicializar quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 FieldManager: DOM carregado, criando instância...');
    if (!window.fieldManager) {
        window.fieldManager = new FieldManager();
    }
});

export default FieldManager; 