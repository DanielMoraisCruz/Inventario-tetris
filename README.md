# 📦 Inventário Tetris | Tetris Inventory

Um sistema visual e interativo de gerenciamento de inventário inspirado em Tetris, voltado para mesas de RPG.

---

## 📌 Descrição (pt-BR)

**Inventário Tetris** é um projeto pessoal criado para uso em mesas de **RPG de mesa**, permitindo ao mestre organizar visualmente os itens dos jogadores em um grid estilo Tetris. Com ele, o mestre pode:

* Criar, visualizar e organizar itens com diferentes tamanhos.
* Atribuir imagens aos itens.
* Mover, rotacionar, excluir ou reposicionar os itens no grid.
* Salvar o estado do inventário localmente.
* Acessar via login, com um modo especial para o mestre.

O objetivo é tornar o gerenciamento de inventário **mais divertido, interativo e prático** durante as sessões de RPG.

---

## 🚀 Funcionalidades

* 🧱 Inventário em grade com drag & drop estilo Tetris
* 👤 Login com modo mestre
* 📷 Itens com imagem personalizada
* 📐 Itens de tamanhos variados (1x1 até 10x6)
* 🔁 Rotação de itens com tecla `R`
* 💾 Salvamento automático com `localStorage`
* 🧪 Criação de itens via formulário
* 🗑️ Remoção com tecla `Delete`
* 🧙‍♂️ Interface simplificada para mestre
* 📏 O mestre é capaz de aumentar e diminuir o tamanho do inventário dos jogadores


---

## 📈 Funcionalidades Futuras

* 🎲 Rolagem de dados integrada
* 🧍‍♂️ Corpo de personagem com slots equipáveis
* 🛡️ Itens consumíveis, equipáveis, com efeitos especiais
* 💥 Barra de estresse para cada item (item quebra quando atinge o limite)
* ⭐ Sistema de raridade (comum a lendário)
* 🐍 Backend em Python para inserção em massa de itens (futuramente)
* 🧩 Sistema de categorias e filtros
* 📊 Estatísticas de uso dos itens
* 📅 Histórico de alterações do inventário
* 🗂️ Exportação e importação de inventário
* 🛠️ Integração com APIs de RPG populares
* 🖼️ Galeria de imagens de itens

---

## 🛠️ Tecnologias Utilizadas

* HTML5
* CSS3
* JavaScript (ES6+)
* `localStorage` para persistência
* GitHub Pages (hospedagem)

---

## 🖥️ Como Executar Localmente

1. Clone o repositório:

   ```bash
   git clone https://github.com/seu-usuario/inventario-tetris.git
   ```
2. Acesse a pasta:

   ```bash
   cd inventario-tetris
   ```
3. Abra o arquivo `index.html` em seu navegador ou sirva a pasta com qualquer servidor estático.

## 📑 users.json
O repositório inclui um arquivo `users.json` com um exemplo de usuários, senhas (hash) e perguntas secretas. Para carregar esses dados no navegador:

```javascript
fetch('users.json')
  .then(r => r.json())
  .then(data => localStorage.setItem('tetris-users', JSON.stringify(data)));
```

### Registro de usuários

Quando não houver nenhum cadastro, o primeiro usuário criado será o
**Mestre**. O registro solicita nome, senha e uma pergunta de segurança com a
resposta correspondente. Se já existir um mestre, os próximos registros serão
considerados jogadores.
---

## 🌐 Acesse Online

O projeto está hospedado em:
**[https://seu-usuario.github.io/inventario-tetris](https://seu-usuario.github.io/inventario-tetris)**

> *(substituir pelo link real quando publicado)*

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License**.

---

## ✒️ Autor

Desenvolvido por **Daniel Cruz**.
Mestre de RPG, Cientista da Computação e entusiasta de interfaces interativas para jogos de mesa.

---

## 🇺🇸 English Version

### 📌 Description

**Tetris Inventory** is a personal project designed for tabletop RPG campaigns. It allows the game master to visually organize players' items using a grid-based layout inspired by **Tetris mechanics**.

* Add and manage items of varying shapes and sizes
* Upload custom images for each item
* Move, rotate, and organize them on the inventory grid
* Save data locally using `localStorage`
* Master-only features unlocked via login

The goal is to enhance the RPG experience with a fun, interactive inventory system.

---

### 🚀 Features

* 🧱 Tetris-style drag & drop inventory
* 👤 Login screen with Master Mode
* 📷 Custom images for items
* 📐 Adjustable item size (up to 10x6)
* 🔁 Rotate with `R` key
* 💾 Local storage
* 🧪 Form-based item creation
* 🗑️ Delete with `Delete` key
* 🧙‍♂️ Simplified Master interface
* 📏 Master can resize player inventories

---

### 🔮 Future Features

* 🎲 Dice roller system
* 🧍‍♂️ Character body with equipable slots
* 🛡️ Item types: consumables, equipables, special effects
* 💥 Stress bar for each item (item breaks when maxed)
* ⭐ Rarity system: common → legendary
* 🐍 Python backend for bulk item creation (future)
* 🧩 Categories and filters
* 📊 Item usage statistics
* 📅 Inventory change history
* 🗂️ Export/import inventory
* 🛠️ Integration with popular RPG APIs
* 🖼️ Item image gallery

---

### 🛠️ Technologies

* HTML5, CSS3, JavaScript
* LocalStorage API
* GitHub Pages (hosted)

---

### 🖥️ Run Locally

```bash
git clone https://github.com/your-username/inventario-tetris.git
cd inventario-tetris
```

Open `index.html` in your browser or serve the folder with any static server.

The repository also provides a sample `users.json` file containing hashed passwords and secret questions. To load it:

```javascript
fetch('users.json')
  .then(r => r.json())
  .then(data => localStorage.setItem('tetris-users', JSON.stringify(data)));
```

---

### 🌍 Live Demo

Access online:
**[https://your-username.github.io/inventario-tetris](https://your-username.github.io/inventario-tetris)**

> *(replace with actual link)*

---

### 📄 License

Licensed under the **MIT License**.

---

### ✒️ Author

Created by **Daniel Cruz** —
RPG Master, Computer Scientist, and builder of immersive RPG tools.
