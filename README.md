# Batalha Naval com Node.js, Express, EJS e Phaser

Este projeto demonstra uma aplicação simples de Batalha Naval usando:
- **Node.js** e **Express** para criar o servidor web
- **EJS** para renderizar a página principal
- **Phaser** como engine de jogos no frontend

## Estrutura de pastas

meu-battleship 
├── README.md 
├── package.json 
├── server.js 
├── views 
│ └── index.ejs 
└── public 
├── js 
│ ├── phaser.min.js 
│ └── game.js 
└── css 
│ └──  style.css

csharp
Copiar código

## Como rodar

1. Instale as dependências:
   ```bash
   npm install
Inicie o servidor:
bash
Copiar código
npm start
Abra o navegador em:
http://localhost:3000/
Personalizações
Você pode alterar o tamanho do tabuleiro, adicionar mais navios etc. em public/js/game.js.
Se quiser trocar o EJS por outra view engine (React, Pug, Handlebars), fique à vontade!
Bom jogo e divirta-se afundando navios!