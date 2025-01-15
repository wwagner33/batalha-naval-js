/**
 * Nome do jogo: JGNavyWar
 * Homenagem a: João Gabriel Caminha Pequeno
 * Licença: GPLv3
 * Autores: Wellington Sarmento e Patrícia de Sousa
 */

const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, '../public')));

// ======== Armazenamento simples em memória (DEMO) ======== // 
// Guardaremos aqui as células já atacadas pelo computador, 
// para não repetir jogada.
let computerAttacks = new Set(); // cada elemento será "row-col" (string)

// Simulação de um ranking em memória
let ranking = [];

/**
 * Rota para obter ranking de jogadores vencedores.
 * Retorna JSON com o array de jogadores e scores.
 */
app.get('/ranking', (req, res) => {
  res.json(ranking);
});

/**
 * Rota para registrar o placar de um jogador que venceu.
 * Ex: POST /salvar-placar  { "nomeJogador": "Fulano", "score": 350 }
 */
app.post('/salvar-placar', (req, res) => {
  const { nomeJogador, score } = req.body;
  if (nomeJogador && score !== undefined) {
    ranking.push({ nome: nomeJogador, pontuacao: score });
    // Ordena em ordem decrescente
    ranking.sort((a, b) => b.pontuacao - a.pontuacao);
    res.json({ success: true, ranking });
  } else {
    res.status(400).json({ success: false, message: 'Dados inválidos' });
  }
});

/**
 * Rota para zerar o estado do servidor antes de cada partida
 */
app.post('/reset-game', (req, res) => {
  computerAttacks.clear();
  res.json({ success: true });
});

/**
 * Rota onde o computador "pensa" a jogada.
 * Neste exemplo, é apenas um ataque aleatório que não repete célula.
 * Retorna { row, col }.
 */
app.get('/computer-move', (req, res) => {
  const BOARD_SIZE = 20;

  let row, col;
  let maxTentativas = 1000;
  while (maxTentativas > 0) {
    row = Math.floor(Math.random() * BOARD_SIZE);
    col = Math.floor(Math.random() * BOARD_SIZE);
    const key = `${row}-${col}`;
    if (!computerAttacks.has(key)) {
      // ainda não atacou essa célula
      computerAttacks.add(key);
      break;
    }
    maxTentativas--;
  }

  res.json({ row, col });
});

// Inicializa servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
