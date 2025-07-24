# 📦 Inventário Tetris | Tetris Inventory

Um sistema visual e interativo de gerenciamento de inventário inspirado em Tetris, voltado para mesas de RPG.

---

## 🇧🇷 Português

### 📌 Descrição

**Inventário Tetris** é um projeto pessoal criado para uso em mesas de **RPG de mesa**, permitindo ao mestre organizar visualmente os itens dos jogadores em um grid estilo Tetris. Com ele, o mestre pode:

* Criar, visualizar e organizar itens com diferentes tamanhos.
* Atribuir imagens aos itens.
* Mover, rotacionar, excluir ou reposicionar os itens no grid.
* Salvar o estado do inventário localmente.
* Acessar via login, com um modo especial para o mestre.

O objetivo é tornar o gerenciamento de inventário **mais divertido, interativo e prático** durante as sessões de RPG.

---

### 🚀 Funcionalidades

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
* 🌗 Alternância de tema claro/escuro
* 🧍‍♂️ Corpo do personagem com slots equipáveis
* 💥 Barra de estresse/durabilidade para cada item
* 🎯 Sistema de perícias editáveis com valores persistentes

---

### 📈 Funcionalidades Futuras

* 🎲 Rolagem de dados integrada
* 🛡️ Itens consumíveis, equipáveis, com efeitos especiais
* ⭐ Sistema de raridade (comum a lendário)
* 🐍 Backend em Python para inserção em massa de itens (futuramente)
* 🧩 Sistema de categorias e filtros
* 📊 Estatísticas de uso dos itens
* 📅 Histórico de alterações do inventário
* 🗂️ Exportação e importação de inventário
* 🛠️ Integração com APIs de RPG populares
* 🖼️ Galeria de imagens de itens

---

### 🛠️ Tecnologias Utilizadas

* HTML5
* CSS3
* JavaScript (ES6+)
* `localStorage` para persistência
* GitHub Pages (hospedagem)

---

### 🖥️ Como Executar Localmente

Pré-requisitos: **Node.js 18+** e **Python 3** caso queira utilizar o script de atualização de itens.

1. Clone o repositório:

   ```bash
   git clone https://github.com/seu-usuario/inventario-tetris.git
   ```
2. Acesse a pasta do projeto e instale as dependências do servidor:

   ```bash
   cd inventario-tetris
   npm install
   ```
3. Inicie o servidor:

   ```bash
   npm start
   ```

Depois de configurado o projeto, execute `npm test` para rodar a suíte de testes do Jest.

Isso levantará o servidor Express em `http://localhost:3000`.
Abra `http://localhost:3000/login.html` (ou `index.html`) no navegador para acessar o front‑end.

O backend criará automaticamente o arquivo `server/users.json` se ele não existir e disponibilizará as rotas de API (`/register`, `/login`, `/reset-password`, `/security-question` etc.) para a aplicação. As senhas são armazenadas usando **bcryptjs**. Toda comunicação é feita via JSON, portanto utilize o prefixo correto nas requisições, por exemplo:

```javascript
fetch('http://localhost:3000/login')
```

A rota `/master-hash` permite consultar o valor da variável de ambiente `MASTER_PASSWORD_HASH`, caso ela esteja definida. Você também pode definir `USERS_FILE_PATH` (ou o antigo `USERS_FILE`) para alterar o local do arquivo `users.json`. Defina também `EXTERNAL_ADDRESS` caso queira registrar um endereço externo ao iniciar o servidor (por exemplo, `http://seu-ip:3000`).

### 📑 users.json
O arquivo `server/users.json` é gerado automaticamente na primeira execução do servidor e armazena os usuários cadastrados. Se quiser reiniciar os cadastros, exclua esse arquivo antes de iniciar o servidor.

### Atualizar itens via CSV
Na pasta `public/data/` existe o script `atualizar_items.py` que converte o arquivo `CSV-itens.csv` em `items.json`. O arquivo `items.json` vem vazio no repositório e precisa ser gerado uma primeira vez com o script. Caso tenha a dependência `openpyxl` instalada, o script também aceita `CSV-itens.xlsx` (não incluído no repositório). Execute:

```bash
python3 public/data/atualizar_items.py
```

para gerar ou atualizar a lista de itens. O CSV possui as colunas `nome`, `width`, `height`, `color`, `img`, `maxEstresse`, `tipo` e `slot`. Todos esses valores serão copiados para `items.json`.

### Problemas ao carregar scripts ou imagens
Se ao abrir a página os botões não responderem ou a imagem do personagem estiver ausente, verifique no console do navegador se `inventory-page.js` e `body-ui.js` foram carregados corretamente. Esses arquivos ficam em `public/js/` e devem ser incluídos assim:

```html
<script type="module" src="js/inventory-page.js"></script>
<script type="module" src="js/body-ui.js"></script>
```

Se você salvou os arquivos pelo navegador e eles possuem o sufixo `.download`, renomeie-os para `.js` e recarregue a página. A imagem do personagem será definida automaticamente pelo script.

### Registro de usuários
Quando não houver nenhum cadastro, o primeiro usuário criado será o **Mestre**. O registro solicita nome, senha e uma pergunta de segurança com a resposta correspondente. Se já existir um mestre, os próximos registros serão considerados jogadores.

### 🌐 Acesse Online
O projeto está hospedado em:
[https://danielmoraiscruz.github.io/Inventario-tetris/public/login.html](https://danielmoraiscruz.github.io/Inventario-tetris/public/login.html)

---

### 📄 Licença
Este projeto está licenciado sob a **MIT License**.

---

### ✒️ Autor
Desenvolvido por **Daniel Cruz**. Mestre de RPG, Cientista da Computação e entusiasta de interfaces interativas para jogos de mesa.

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
* 🌗 Light/dark theme toggle
* 🧍‍♂️ Character body with equipable slots
* 💥 Stress/durability tracking per item

---

### 🔮 Future Features

* 🎲 Dice roller system
* 🛡️ Item types: consumables, equipables, special effects
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

Prerequisites: **Node.js 18+** and **Python 3** if you plan to run the item update script.

```bash
git clone https://github.com/your-username/inventario-tetris.git
cd inventario-tetris
npm install
npm start
```

After the setup you can run all Jest tests with:

```bash
npm test
```

This starts the Express backend on `http://localhost:3000`. Open `http://localhost:3000/login.html` (or `index.html`) in your browser to view the front-end.

The backend automatically creates `users.json` if missing and exposes the API routes (`/register`, `/login`, `/reset-password`, `/security-question`, etc.) used by the app. Passwords are stored using **bcryptjs**. All communication happens through JSON, so remember to prefix your requests, e.g.:

```javascript
fetch('http://localhost:3000/login')
```

The `/master-hash` endpoint returns the value of the `MASTER_PASSWORD_HASH` environment variable when it is defined. You can also set `USERS_FILE_PATH` (or the legacy `USERS_FILE`) to change where the `users.json` file is stored. Set `EXTERNAL_ADDRESS` if you want the server to print an external URL when it starts (e.g., `http://your-ip:3000`).

### `users.json`
The file `server/users.json` is created automatically when the server first starts and stores all registered users. Delete this file before launching the server if you wish to reset the credentials.

### Update items from CSV
Inside `public/data/` there is a script called `atualizar_items.py` that converts `CSV-itens.csv` into `items.json`. The repository ships with an empty `items.json`, so run the script once to create it. If the `openpyxl` dependency is installed the script will also accept `CSV-itens.xlsx` (not included in the repository). Run:

```bash
python3 public/data/atualizar_items.py
```

to generate or update the item list. The CSV includes the columns `nome`, `width`, `height`, `color`, `img`, `maxEstresse`, `tipo` and `slot`. All of them are written to `items.json`.

### 🌍 Live Demo
Access online:
**[https://danielmoraiscruz.github.io/Inventario-tetris/public/login.html](https://danielmoraiscruz.github.io/Inventario-tetris/public/login.html)**

---

### 📄 License
Licensed under the **MIT License**.

---

### ✒️ Author
Created by **Daniel Cruz** —
RPG Master, Computer Scientist, and builder of immersive RPG tools.
