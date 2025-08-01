import { session, loadSession, clearSession, saveSession } from './login.js';
import { cacheDomElements, initInventory, form, searchInput, renderItemList, updateItemList, redrawPlacedItems, createGrid, inventory, getInventoryState } from './inventory.js';
import { handleItemSubmit } from './inventory.js';
import { initDragDrop, registerPanelDragHandlers } from './dragdrop.js';
import { applyLayoutSettings, calcDefaultSize, setInventorySize } from './constants.js';
import { saveInventory } from './storage.js';
import { setupThemeToggle } from './theme.js';
import { initBodyUI, updateBodyUI } from './body-ui.js';
import FieldManager from './field-manager.js';

const DEFAULT_SKILLS = [
    'Acrobacia',
    'Armas Brancas',
    'Ataque à Distância',
    'Atletismo',
    'Briga',
    'Esquiva',
    'Furtividade',
    'Trabalho',
    'Prestidigitação',
    'Sobrevivência',
    'Atuação',
    'Empatia com Animais',
    'Enganação',
    'Etiqueta',
    'Intimidação',
    'Liderança',
    'Persuasão',
    'Empatia',
    'Resistência Mental',
    'Hobby',
    'Alquimia',
    'Arcanismo',
    'Educação',
    'Investigação',
    'Medicina',
    'Natureza',
    'Percepção',
    'Crafting',
    'Religião',
    'Tecnologia'
];

/**
 * Garante que as perícias padrão existam
 */
function ensureDefaultSkills() {
    if (!session.userSkills) {
        session.userSkills = {};
    }
    DEFAULT_SKILLS.forEach(skill => {
        if (session.userSkills[skill] === undefined) {
            session.userSkills[skill] = 0;
        }
    });
}

/**
 * Cria uma linha de perícia na interface
 */
function createSkillRow(name) {
    const list = document.getElementById('skill-list');
    if (!list) return;
    
    const div = document.createElement('div');
    div.className = 'skill';
    div.dataset.skill = name;

    const label = document.createElement('span');
    label.className = 'skill-name';
    label.textContent = name;

    const controls = document.createElement('div');
    controls.className = 'controls';

    const dec = document.createElement('button');
    dec.className = 'btn dec';
    dec.textContent = '-';

    const val = document.createElement('span');
    val.className = 'value';
    val.textContent = String(session.userSkills[name] || 0);

    const inc = document.createElement('button');
    inc.className = 'btn inc';
    inc.textContent = '+';

    inc.addEventListener('click', () => {
        let v = session.userSkills[name] || 0;
        v++;
        session.userSkills[name] = v;
        val.textContent = String(v);
        saveSession();
    });

    dec.addEventListener('click', () => {
        let v = session.userSkills[name] || 0;
        if (v > 0) {
            v--;
            session.userSkills[name] = v;
            val.textContent = String(v);
            saveSession();
        }
    });

    controls.append(dec, val, inc);
    div.append(label, controls);

    // Permitir remoção apenas para mestres e perícias customizadas
    if (!DEFAULT_SKILLS.includes(name) && session.isMaster) {
        const remove = document.createElement('button');
        remove.className = 'btn remove';
        remove.textContent = '✕';
        remove.addEventListener('click', () => {
            delete session.userSkills[name];
            saveSession();
            div.remove();
        });
        div.appendChild(remove);
    }

    list.appendChild(div);
}

/**
 * Renderiza todas as perícias
 */
function renderSkills() {
    ensureDefaultSkills();
    const list = document.getElementById('skill-list');
    if (!list) return;
    
    list.innerHTML = '';
    Object.keys(session.userSkills).forEach(name => {
        createSkillRow(name);
    });
}

/**
 * Inicializa o sistema de magias
 */
function initSpells() {
    if (!session.userSpells) {
        session.userSpells = [];
    }
    
    const addSpellBtn = document.getElementById('add-spell');
    if (addSpellBtn) {
        if (!session.isMaster) {
            addSpellBtn.style.display = 'none';
        } else {
            addSpellBtn.addEventListener('click', () => {
                const name = prompt('Nome da nova magia:');
                if (!name) return;
                
                const spell = {
                    id: crypto.randomUUID(),
                    name: name,
                    level: 1,
                    description: ''
                };
                
                session.userSpells.push(spell);
                saveSession();
                renderSpells();
            });
        }
    }
    
    renderSpells();
}

/**
 * Renderiza as magias
 */
function renderSpells() {
    const list = document.getElementById('spell-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (!session.userSpells || session.userSpells.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.textContent = 'Nenhuma magia conhecida';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.opacity = '0.7';
        emptyMsg.style.padding = '20px';
        list.appendChild(emptyMsg);
        return;
    }
    
    session.userSpells.forEach(spell => {
        const div = document.createElement('div');
        div.className = 'spell';
        div.dataset.spellId = spell.id;

        const name = document.createElement('span');
        name.className = 'spell-name';
        name.textContent = `${spell.name} (Nv. ${spell.level})`;

        const controls = document.createElement('div');
        controls.className = 'controls';

        const levelDec = document.createElement('button');
        levelDec.className = 'btn';
        levelDec.textContent = '-';
        levelDec.addEventListener('click', () => {
            if (spell.level > 1) {
                spell.level--;
                name.textContent = `${spell.name} (Nv. ${spell.level})`;
                saveSession();
            }
        });

        const levelInc = document.createElement('button');
        levelInc.className = 'btn';
        levelInc.textContent = '+';
        levelInc.addEventListener('click', () => {
            if (spell.level < 9) {
                spell.level++;
                name.textContent = `${spell.name} (Nv. ${spell.level})`;
                saveSession();
            }
        });

        controls.append(levelDec, levelInc);
        div.append(name, controls);

        // Permitir remoção apenas para mestres
        if (session.isMaster) {
            const remove = document.createElement('button');
            remove.className = 'btn remove';
            remove.textContent = '✕';
            remove.addEventListener('click', () => {
                session.userSpells = session.userSpells.filter(s => s.id !== spell.id);
                saveSession();
                div.remove();
            });
            div.appendChild(remove);
        }

        list.appendChild(div);
    });
}

/**
 * Inicializa o sistema de redimensionamento
 */
function initResizeSystem() {
    const resizeRows = document.getElementById('resize-rows');
    const resizeCols = document.getElementById('resize-cols');
    const resizeBtn = document.getElementById('resize-btn');
    
    if (!resizeBtn) return;

    if (session.isMaster) {
        // Carregar tamanho salvo
        const savedSize = localStorage.getItem('inventory-size');
        if (savedSize) {
            try {
                const obj = JSON.parse(savedSize);
                if (obj.rows && obj.cols) {
                    setInventorySize(obj.rows, obj.cols);
                    if (resizeRows) resizeRows.value = obj.rows;
                    if (resizeCols) resizeCols.value = obj.cols;
                }
            } catch (error) {
                console.error('Erro ao carregar tamanho do inventário:', error);
            }
        }
    } else {
        const { rows, cols } = calcDefaultSize(session.userStats);
        setInventorySize(rows, cols);
    }

    if (resizeBtn) {
        resizeBtn.addEventListener('click', () => {
            const r = parseInt(resizeRows?.value || 6);
            const c = parseInt(resizeCols?.value || 10);
            
            if (!Number.isFinite(r) || !Number.isFinite(c)) return;
            if (r < 3 || r > 20 || c < 3 || c > 20) {
                alert('Valores fora do limite (3-20).');
                return;
            }
            
            setInventorySize(r, c);
            if (inventory) {
            inventory.innerHTML = '';
            createGrid();
            redrawPlacedItems();
            }
            
            const state = getInventoryState();
            saveInventory(state.itemsData, state.placedItems);
            localStorage.setItem('inventory-size', JSON.stringify({ rows: r, cols: c }));
        });
    }
}

/**
 * Inicializa o sistema de itens
 */
function initItemsSystem() {
    const itemsPanel = document.getElementById('items');
    const itemsResizer = document.getElementById('items-resizer');
    const menuBtn = document.getElementById('menu-btn');
    const root = document.documentElement;
    const DEFAULT_WIDTH = 260;
    
    // Carregar largura salva
    const savedWidth = localStorage.getItem('items-width');
    if (savedWidth) {
        const w = parseInt(savedWidth, 10);
        root.style.setProperty('--items-width', `${w}px`);
        root.style.setProperty('--preview-scale', (w / DEFAULT_WIDTH).toString());
    }

    // Sistema de redimensionamento do painel
    if (itemsResizer) {
        let startX = 0;
        let startWidth = 0;

        const onMove = (e) => {
            let newWidth = startWidth + e.clientX - startX;
            newWidth = Math.max(180, Math.min(400, newWidth));
            root.style.setProperty('--items-width', `${newWidth}px`);
            root.style.setProperty('--preview-scale', (newWidth / DEFAULT_WIDTH).toString());
        };

        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            const finalWidth = parseInt(getComputedStyle(itemsPanel).width, 10);
            localStorage.setItem('items-width', finalWidth);
            root.style.setProperty('--preview-scale', (finalWidth / DEFAULT_WIDTH).toString());
        };

        itemsResizer.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startWidth = parseInt(getComputedStyle(itemsPanel).width, 10);
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            e.preventDefault();
        });
    }

    // Botão do menu
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            itemsPanel.classList.toggle('open');
            menuBtn.classList.toggle('open');
        });
    }

    // Busca de itens
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderItemList();
        });
    }
}

/**
 * Inicializa os controles de ação
 */
function initActionControls() {
    const logoutBtn = document.getElementById('logout-btn');
    const resetBtn = document.getElementById('reset-btn');
    const addSkillBtn = document.getElementById('add-skill');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                clearSession();
                window.location.href = 'login.html';
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja resetar todos os dados? Esta ação não pode ser desfeita.')) {
                localStorage.removeItem('tetris-inventory');
                localStorage.removeItem('field-positions');
                clearSession();
                window.location.href = 'login.html';
            }
        });
    }

    if (addSkillBtn) {
        if (!session.isMaster) {
            addSkillBtn.style.display = 'none';
        } else {
            addSkillBtn.addEventListener('click', () => {
                const name = prompt('Nome da nova perícia:');
                if (!name || name.trim() === '') return;
                
                const skillName = name.trim();
                if (session.userSkills[skillName] === undefined) {
                    session.userSkills[skillName] = 0;
                    saveSession();
                    renderSkills();
                } else {
                    alert('Esta perícia já existe!');
                }
            });
        }
    }
}

/**
 * Adiciona controles de organização dos campos
 */
function addFieldOrganizationControls() {
    // Criar painel de controles flutuante
    const controlPanel = document.createElement('div');
    controlPanel.style.cssText = `
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--panel-bg);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 8px;
        display: flex;
        gap: 8px;
        z-index: 200;
        font-size: 0.8rem;
    `;
    
    const autoArrangeBtn = document.createElement('button');
    autoArrangeBtn.className = 'btn';
    autoArrangeBtn.textContent = 'Organizar';
    autoArrangeBtn.title = 'Organizar campos automaticamente';
    autoArrangeBtn.addEventListener('click', () => {
        if (window.fieldManager) {
            window.fieldManager.autoArrange();
        }
    });
    
    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'btn';
    restoreBtn.textContent = 'Restaurar';
    restoreBtn.title = 'Restaurar todos os campos';
    restoreBtn.addEventListener('click', () => {
        if (window.fieldManager) {
            window.fieldManager.restoreAllFields();
        }
    });
    
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn';
    resetBtn.textContent = 'Resetar';
    resetBtn.title = 'Resetar posições dos campos';
    resetBtn.addEventListener('click', () => {
        if (confirm('Resetar posições dos campos?')) {
            if (window.fieldManager) {
                window.fieldManager.resetFieldPositions();
            }
        }
    });
    
    const resetPanBtn = document.createElement('button');
    resetPanBtn.className = 'btn';
    resetPanBtn.textContent = 'Resetar Vista';
    resetPanBtn.title = 'Resetar posição da tela e zoom';
    resetPanBtn.addEventListener('click', () => {
        if (window.zoomManager) {
            window.zoomManager.resetAll();
        }
    });
    
    const checkBoundsBtn = document.createElement('button');
    checkBoundsBtn.className = 'btn';
    checkBoundsBtn.textContent = 'Verificar Limites';
    checkBoundsBtn.title = 'Verificar se campos estão dentro dos limites';
    checkBoundsBtn.addEventListener('click', () => {
        if (window.fieldManager) {
            window.fieldManager.checkAllFieldBounds();
            alert('Limites verificados! Campos fora dos limites terão borda vermelha.');
        }
    });
    
    controlPanel.append(autoArrangeBtn, restoreBtn, resetBtn, resetPanBtn, checkBoundsBtn);
    document.body.appendChild(controlPanel);
}

/**
 * Inicialização principal
 */
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando sistema de inventário...');
    
    // Configurar tema
    setupThemeToggle();
    
    // Cache de elementos DOM
    cacheDomElements();
    
    // Verificar sessão
    if (!loadSession()) {
        window.location.href = 'login.html';
        return;
    }

    // Configurar interface do usuário
    const userWelcome = document.getElementById('user-welcome');
    if (userWelcome) {
        userWelcome.textContent = session.isMaster ? 
            `Olá, ${session.userName} (Mestre)` : 
            `Olá, ${session.userName}`;
    }

    // Aplicar configurações de layout
    applyLayoutSettings();
    
    // Aguardar um pouco para garantir que os managers sejam inicializados
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verificar se os managers foram carregados
    if (!window.fieldManager) {
        console.error('❌ Field Manager não foi carregado!');
    } else {
        console.log('✅ Field Manager carregado com sucesso');
    }
    
    if (!window.zoomManager) {
        console.error('❌ Zoom Manager não foi carregado!');
    } else {
        console.log('✅ Zoom Manager carregado com sucesso');
    }
    
    // Inicializar sistemas
    await initInventory();
    initDragDrop();
    initBodyUI();
    initResizeSystem();
    initActionControls();
    
    // Renderizar dados
    renderSkills();
    initSpells();
    
    // Configurar formulário de itens
    if (form) {
        form.style.display = session.isMaster ? 'block' : 'none';
        form.addEventListener('submit', async (e) => {
            await handleItemSubmit(e);
        });
    }
    
    // Busca de itens
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderItemList();
        });
    }
    
    // Adicionar controles de organização dos campos
    addFieldOrganizationControls();
    
    // Verificar campos após inicialização
    setTimeout(() => {
        const fields = document.querySelectorAll('.field');
        console.log(`🎯 Sistema inicializado! ${fields.length} campos encontrados`);
        
        fields.forEach((field, index) => {
            const rect = field.getBoundingClientRect();
            console.log(`Campo ${index + 1}: ${field.dataset.field} em (${rect.left}, ${rect.top})`);
        });
    }, 500);
    
    console.log('✅ Sistema de inventário com campos customizáveis inicializado com sucesso!');
});
