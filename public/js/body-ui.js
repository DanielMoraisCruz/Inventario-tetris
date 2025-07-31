import { session, saveSession } from './login.js';

/**
 * Atributos padrão do personagem
 */
const DEFAULT_ATTRIBUTES = [
    { name: 'Força', key: 'forca' },
    { name: 'Destreza', key: 'destreza' },
    { name: 'Vigor', key: 'vigor' },
    { name: 'Carisma', key: 'carisma' },
    { name: 'Aparência', key: 'aparencia' },
    { name: 'Autocontrole', key: 'autocontrole' },
    { name: 'Inteligência', key: 'inteligencia' },
    { name: 'Raciocínio', key: 'raciocinio' },
    { name: 'Determinação', key: 'determinacao' }
];

/**
 * Inicializa os atributos do personagem
 */
function initAttributes() {
    // Garantir que todos os atributos existam
    DEFAULT_ATTRIBUTES.forEach(attr => {
        if (session.userStats[attr.key] === undefined) {
            session.userStats[attr.key] = 0;
        }
    });
    
    renderAttributes();
}

/**
 * Renderiza os atributos na interface
 */
function renderAttributes() {
    const attrList = document.getElementById('attr-list');
    if (!attrList) return;
    
    attrList.innerHTML = '';
    
    DEFAULT_ATTRIBUTES.forEach(attr => {
        const attrItem = document.createElement('div');
        attrItem.className = 'attr-item';
        
        const attrName = document.createElement('span');
        attrName.className = 'attr-name';
        attrName.textContent = attr.name;
        
        const attrControls = document.createElement('div');
        attrControls.className = 'attr-controls';
        
        const decBtn = document.createElement('button');
        decBtn.className = 'btn';
        decBtn.textContent = '-';
        decBtn.addEventListener('click', () => {
            if (session.userStats[attr.key] > 0) {
                session.userStats[attr.key]--;
                attrValue.textContent = session.userStats[attr.key];
                saveSession();
            }
        });
        
        const attrValue = document.createElement('span');
        attrValue.className = 'attr-value';
        attrValue.textContent = session.userStats[attr.key];
        
        const incBtn = document.createElement('button');
        incBtn.className = 'btn';
        incBtn.textContent = '+';
        incBtn.addEventListener('click', () => {
            session.userStats[attr.key]++;
            attrValue.textContent = session.userStats[attr.key];
            saveSession();
        });
        
        attrControls.append(decBtn, attrValue, incBtn);
        attrItem.append(attrName, attrControls);
        attrList.appendChild(attrItem);
    });
}

/**
 * Inicializa o sistema de stress das partes do corpo
 */
function initBodyStress() {
    const bodyParts = document.querySelectorAll('.body-part');
    
    bodyParts.forEach(part => {
        const stressMinus = part.querySelector('.stress-minus');
        const stressPlus = part.querySelector('.stress-plus');
        const stressVal = part.querySelector('.stress-val');
        const partId = part.id;
        
        // Inicializar stress se não existir
        if (!session.bodyStress) {
            session.bodyStress = {};
        }
        if (session.bodyStress[partId] === undefined) {
            session.bodyStress[partId] = { current: 0, max: 3 };
        }
        
        // Atualizar display
        stressVal.textContent = `${session.bodyStress[partId].current}/${session.bodyStress[partId].max}`;
        
        // Event listeners
        stressMinus.addEventListener('click', () => {
            if (session.bodyStress[partId].current > 0) {
                session.bodyStress[partId].current--;
                stressVal.textContent = `${session.bodyStress[partId].current}/${session.bodyStress[partId].max}`;
                saveSession();
            }
        });
        
        stressPlus.addEventListener('click', () => {
            if (session.bodyStress[partId].current < session.bodyStress[partId].max) {
                session.bodyStress[partId].current++;
                stressVal.textContent = `${session.bodyStress[partId].current}/${session.bodyStress[partId].max}`;
                saveSession();
            }
        });
    });
}

/**
 * Inicializa o sistema de equipamento
 */
function initEquipment() {
    const equipSpaces = document.querySelectorAll('.equip-space');
    
    equipSpaces.forEach(space => {
        const partId = space.dataset.part;
        
        // Inicializar equipamento se não existir
        if (!session.equipment) {
            session.equipment = {};
        }
        if (!session.equipment[partId]) {
            session.equipment[partId] = null;
        }
        
        // Renderizar item equipado se existir
        if (session.equipment[partId]) {
            renderEquippedItem(space, session.equipment[partId]);
        }
        
        // Permitir drop de itens
        space.addEventListener('dragover', (e) => {
            e.preventDefault();
            space.style.borderColor = '#4CAF50';
            space.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
        });
        
        space.addEventListener('dragleave', (e) => {
                e.preventDefault();
            space.style.borderColor = '';
            space.style.backgroundColor = '';
        });
        
        space.addEventListener('drop', (e) => {
            e.preventDefault();
            space.style.borderColor = '';
            space.style.backgroundColor = '';
            
            const itemData = e.dataTransfer.getData('application/json');
            if (itemData) {
                try {
                    const item = JSON.parse(itemData);
                    equipItem(partId, item);
                    renderEquippedItem(space, item);
                } catch (error) {
                    console.error('Erro ao equipar item:', error);
                }
            }
        });
    });
}

/**
 * Equipa um item em uma parte do corpo
 */
function equipItem(partId, item) {
    if (!session.equipment) {
        session.equipment = {};
    }
    session.equipment[partId] = item;
    saveSession();
}

/**
 * Renderiza um item equipado
 */
function renderEquippedItem(space, item) {
    space.innerHTML = '';
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'equipped-item';
    itemDiv.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--button-bg);
        border-radius: 4px;
        padding: 4px;
        position: relative;
    `;
    
    if (item.img) {
        const img = document.createElement('img');
        img.src = item.img;
        img.style.cssText = `
            width: 24px;
            height: 24px;
            object-fit: contain;
            margin-bottom: 2px;
        `;
        itemDiv.appendChild(img);
    }
    
    const name = document.createElement('div');
    name.textContent = item.nome;
    name.style.cssText = `
        font-size: 0.7rem;
        text-align: center;
        font-weight: bold;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
    `;
    itemDiv.appendChild(name);
    
    // Botão de remover
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.style.cssText = `
        position: absolute;
        top: 2px;
        right: 2px;
        width: 16px;
        height: 16px;
        background: #ff6b6b;
        color: white;
        border: none;
        border-radius: 2px;
        cursor: pointer;
        font-size: 0.8rem;
        line-height: 1;
    `;
    removeBtn.addEventListener('click', () => {
        unequipItem(space.dataset.part);
    });
    itemDiv.appendChild(removeBtn);
    
    space.appendChild(itemDiv);
}

/**
 * Remove um item equipado
 */
function unequipItem(partId) {
    if (session.equipment && session.equipment[partId]) {
        session.equipment[partId] = null;
        saveSession();
        
        const space = document.querySelector(`[data-part="${partId}"]`);
        if (space) {
            space.innerHTML = 'Espaço para item';
        }
    }
}

/**
 * Inicializa o botão de rolar corpo
 */
function initRollBody() {
    const rollBtn = document.getElementById('roll-body');
    if (!rollBtn) return;
    
        rollBtn.addEventListener('click', () => {
        const result = rollBodyDice();
        alert(`Resultado do teste de corpo: ${result}`);
    });
}

/**
 * Simula um teste de corpo
 */
function rollBodyDice() {
    // Simulação simples de dados
    const dice = Math.floor(Math.random() * 6) + 1;
    const modifier = Math.floor((session.userStats.vigor + session.userStats.destreza) / 2);
    const total = dice + modifier;
    
    return `${dice} + ${modifier} = ${total}`;
}

/**
 * Inicializa toda a interface do corpo
 */
export function initBodyUI() {
    initAttributes();
    initBodyStress();
    initEquipment();
    initRollBody();
}

/**
 * Atualiza a interface do corpo
 */
export function updateBodyUI() {
    renderAttributes();
}

