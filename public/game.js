/************************************************
 * Nome do jogo: JGNavyWar
 * Homenagem a: João Gabriel Caminha Pequeno
 * Licença: GPLv3
 * Autores: Wellington Sarmento e Patrícia de Sousa
 ************************************************/

// Tamanho do tabuleiro
const BOARD_SIZE = 20;
const TIME_LIMIT = 60; // 1 minuto

// Representação dos navios e tamanhos + classe CSS para cor
// Exemplo de 5 navios (personalize como desejar)
const NAVIOS_CATEGORIAS = [
  { nome: "Porta-aviões", tamanho: 8, pontuacao: 100, cssClass: "porta-avioes" },
  { nome: "Couraçado",     tamanho: 7, pontuacao: 70,  cssClass: "couracado" },
  { nome: "Destróier",     tamanho: 5, pontuacao: 50,  cssClass: "destroier" },
  { nome: "Fragata",       tamanho: 4, pontuacao: 40,  cssClass: "fragata" },
  { nome: "Submarino",     tamanho: 4, pontuacao: 80,  cssClass: "submarino" },
];

// Estado do jogo
let playerName = localStorage.getItem("playerName") || null;
let playerBoard = [];
let computerBoard = [];
let currentPlayer = "human"; // "human" ou "computer"
let timeRemaining = TIME_LIMIT;
let timerInterval = null;
let gameStarted = false;
let gameOver = false;

// Informações de navios destruídos e placar
let playerShips = [];   // {nome, positions: [...], hits: 0, tamanho, pontuacao, destroyed: false, cssClass}
let computerShips = []; // idem

let playerScore = 0;
let computerScore = 0;

// ======================= Inicialização ======================= //
document.addEventListener("DOMContentLoaded", () => {
  // Se já tiver um nome salvo, atualiza o campo e exibe
  if (playerName) {
    document.getElementById("playerName").value = playerName;
    document.getElementById("human-player-name").innerText = playerName;
    // Habilita botão Start caso já tenha nome
    document.getElementById("startGameBtn").disabled = false;
  }

  // Eventos de botão
  document.getElementById("saveNameBtn").addEventListener("click", salvarNome);
  document.getElementById("startGameBtn").addEventListener("click", startGame);
  document.getElementById("refresh-ranking").addEventListener("click", obterRanking);

  // Gera as grades (sem posicionamento de navios ainda)
  generateBoardGrid("player-board", BOARD_SIZE, true);
  generateBoardGrid("computer-board", BOARD_SIZE, false);
});

// ======================= Funções Principais ======================= //


function salvarNome() {
  const inputName = document.getElementById("playerName").value.trim();
  if (inputName) {
    playerName = inputName;
    localStorage.setItem("playerName", playerName);
    document.getElementById("human-player-name").innerText = playerName;
    addChatMessage(`Nome salvo: ${playerName}`);
    // Habilita botão Start ao ter nome
    document.getElementById("startGameBtn").disabled = false;
  } else {
    alert("Por favor, digite um nome válido!");
  }
}

async function startGame() {
  if (!playerName) {
    alert("Defina seu nome antes de iniciar o jogo!");
    return;
  }
  if (gameStarted) {
    alert("O jogo já está em andamento!");
    return;
  }
  gameStarted = true;
  gameOver = false;

  // Desabilita o botão Start durante o jogo
  document.getElementById("startGameBtn").disabled = true;

  // Reinicia estado no servidor (ataques do computador) 
  await fetch('/reset-game', { method: "POST" });

  addChatMessage("Jogo iniciado!");
  resetBoards();
  positionShipsRandomly();

  // Indicar turno inicial
  setTurnIndicator(currentPlayer); // "human" ou "computer"


  // Iniciar timer de 1 minuto para jogada
  timeRemaining = TIME_LIMIT;
  document.getElementById("time-remaining").innerText = timeRemaining;
  timerInterval = setInterval(() => {
    timeRemaining--;
    document.getElementById("time-remaining").innerText = timeRemaining;
    if (timeRemaining <= 0) {
      // Se tempo acabou, decide o resultado agora
      addChatMessage("Tempo Esgotado! Fim de jogo.");
      endGameByTime();
    }
  }, 1000);
}

// Gera a grid HTML
function generateBoardGrid(boardId, size, isPlayerBoard) {
  const boardElement = document.getElementById(boardId);
  boardElement.innerHTML = ""; // limpa

  // Cria um array 2D representando as células
  let boardArray = [];
  for (let row = 0; row < size; row++) {
    let rowArray = [];
    for (let col = 0; col < size; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = row;
      cell.dataset.col = col;

      if (!isPlayerBoard) {
        // Tabuleiro do computador: clique para atacar
        cell.addEventListener("click", () => {
          if (currentPlayer === "human" && !gameOver && gameStarted) {
            handlePlayerAttack(row, col, cell);
          }
        });
      }

      boardElement.appendChild(cell);
      rowArray.push(null); // inicialmente sem navio
    }
    boardArray.push(rowArray);
  }

  if (isPlayerBoard) {
    playerBoard = boardArray;
  } else {
    computerBoard = boardArray;
  }
}

// Limpa e reseta informações para nova partida
function resetBoards() {
  playerShips = [];
  computerShips = [];
  playerScore = 0;
  computerScore = 0;

  // Limpar célula visual
  const allCells = document.querySelectorAll(".cell");
  allCells.forEach((cell) => {
    cell.className = "cell"; // reseta para "cell"
    cell.innerText = "";
  });

  // Zerar chat e destroyed list
  document.getElementById("chat-box").innerHTML = "";
  document.getElementById("destroyed-list").innerHTML = "";
}

// Posiciona navios aleatoriamente em sub-grid de 1/4 do tabuleiro
function positionShipsRandomly() {
  const subGridSize = BOARD_SIZE / 2; // 10

  // Posicionar para jogador
  playerShips = generateShipsPositions(NAVIOS_CATEGORIAS, subGridSize, true);
  // Posicionar para computador
  computerShips = generateShipsPositions(NAVIOS_CATEGORIAS, subGridSize, false);
}

// Gera as posições dos navios
function generateShipsPositions(naviosCategorias, subGridSize, isPlayer) {
  let shipsArray = [];
  const board = isPlayer ? playerBoard : computerBoard;

  naviosCategorias.forEach((navioCat) => {
    let placed = false;
    while (!placed) {
      // Gera posição inicial e orientação
      const startRow = Math.floor(Math.random() * subGridSize);
      const startCol = Math.floor(Math.random() * subGridSize);
      const horizontal = Math.random() < 0.5;

      if (canPlaceShip(board, startRow, startCol, navioCat.tamanho, horizontal, subGridSize)) {
        const positions = [];
        for (let i = 0; i < navioCat.tamanho; i++) {
          const r = startRow + (horizontal ? 0 : i);
          const c = startCol + (horizontal ? i : 0);
          board[r][c] = navioCat.nome; // marca no array 2D
          positions.push({ row: r, col: c });
          // Se for tabuleiro do player, mostre
          if (isPlayer) {
            const cell = getCellElement("player-board", r, c);
            cell.classList.add(navioCat.cssClass);
          }
        }
        shipsArray.push({
          nome: navioCat.nome,
          tamanho: navioCat.tamanho,
          pontuacao: navioCat.pontuacao,
          positions,
          hits: 0,
          destroyed: false,
          cssClass: navioCat.cssClass
        });
        placed = true;
      }
    }
  });
  return shipsArray;
}

function canPlaceShip(board, startRow, startCol, size, horizontal, subGridSize) {
  if (horizontal) {
    if (startCol + size > subGridSize) return false;
    for (let i = 0; i < size; i++) {
      if (board[startRow][startCol + i]) return false;
    }
  } else {
    if (startRow + size > subGridSize) return false;
    for (let i = 0; i < size; i++) {
      if (board[startRow + i][startCol]) return false;
    }
  }
  return true;
}

function getCellElement(boardId, row, col) {
  const boardElement = document.getElementById(boardId);
  const index = row * BOARD_SIZE + col;
  return boardElement.children[index];
}

// ======================= Lógica de Ataques ======================= //
function handlePlayerAttack(row, col, cell) {
  if (cell.classList.contains("hit") || cell.classList.contains("miss")) {
    addChatMessage(`Você já tentou (${convertToGridNotation(row, col)}) antes!`);
    return;
  }

  // Verifica se tem navio inimigo
  const shipName = computerBoard[row][col];
  if (shipName) {
    // Acerto
    cell.classList.add("hit");
    cell.innerText = "X";

    const ship = computerShips.find((s) => s.nome === shipName && !s.destroyed);
    if (ship) {
      ship.hits++;
      if (ship.hits === ship.tamanho) {
        ship.destroyed = true;
        playerScore += ship.pontuacao;
        addChatMessage(`Alvo destruído! Navio inimigo: ${ship.nome}`);
        addDestroyedShipInfo(false, ship);
      } else {
        addChatMessage(`Acertou em ${convertToGridNotation(row, col)}!`);
      }
    }
  } else {
    // Erro
    cell.classList.add("miss");
    addChatMessage(`Errou em ${convertToGridNotation(row, col)}.`);
  }

  // Verifica se venceu
  if (checkAllShipsDestroyed(computerShips)) {
    addChatMessage("Você venceu!!!");
    endGame("human");
    return;
  }

  // Depois do ataque do jogador, muda para o computador
  switchTurn();
}

async function computerAttack() {
  // Pede ao servidor para "pensar" a jogada
  try {
    const res = await fetch('/computer-move');
    const data = await res.json();
    const { row, col } = data;

    const cellElement = getCellElement("player-board", row, col);
    if (cellElement.classList.contains("hit") || cellElement.classList.contains("miss")) {
      // Se o servidor, por algum motivo, repetiu jogada, ignora e tenta de novo
      // (Ou poderíamos tratar de outra forma)
      addChatMessage("Computador repetiu jogada, tentando novamente...");
      return computerAttack();
    }

    const shipName = playerBoard[row][col];
    if (shipName) {
      // Acerto
      cellElement.classList.add("hit");
      cellElement.innerText = "X";

      const ship = playerShips.find((s) => s.nome === shipName && !s.destroyed);
      if (ship) {
        ship.hits++;
        if (ship.hits === ship.tamanho) {
          ship.destroyed = true;
          computerScore += ship.pontuacao;
          addChatMessage(`COMPUTADOR destruiu seu navio: ${ship.nome}`);
          addDestroyedShipInfo(true, ship);
        } else {
          addChatMessage(`COMPUTADOR acertou em ${convertToGridNotation(row, col)}!`);
        }
      }
    } else {
      // Erro
      cellElement.classList.add("miss");
      addChatMessage(`COMPUTADOR errou em ${convertToGridNotation(row, col)}.`);
    }

    // Verifica se o computador venceu
    if (checkAllShipsDestroyed(playerShips)) {
      addChatMessage("COMPUTADOR venceu! :(");
      endGame("computer");
      return;
    }
  } catch (err) {
    console.error("Erro na jogada do computador:", err);
    addChatMessage("Houve um erro na jogada do computador.");
  }

  // Passa vez de volta para o humano
  switchTurn();
}

function checkAllShipsDestroyed(ships) {
  return ships.every((ship) => ship.destroyed);
}

// Alterna turno
function switchTurn() {
  if (gameOver) return;

  if (currentPlayer === "human") {
    currentPlayer = "computer";
    setTurnIndicator("computer");
    // Computador joga só depois do humano terminar
    setTimeout(() => {
      computerAttack();
    }, 700);
  } else {
    currentPlayer = "human";
    setTurnIndicator("human");
    addChatMessage(`Sua vez, ${playerName}.`);
  }
}

// ======================= Função para indicar turno ======================= //
function setTurnIndicator(player) {
    const humanIndicator = document.getElementById("human-turn-indicator");
    const computerIndicator = document.getElementById("computer-turn-indicator");
  
    if (player === "human") {
      humanIndicator.classList.add("active");
      computerIndicator.classList.remove("active");
    } else {
      humanIndicator.classList.remove("active");
      computerIndicator.classList.add("active");
    }
  }


// ======================= Fim de Jogo ======================= //
function endGame(winner) {
  gameOver = true;
  gameStarted = false;
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  if (winner === "human") {
    addChatMessage(`Parabéns, ${playerName}, você ganhou com ${playerScore} pontos!`);
    salvarPlacar(playerName, playerScore);
  } else if (winner === "computer") {
    addChatMessage(`O COMPUTADOR ganhou com ${computerScore} pontos!`);
  } else {
    // Empate
    addChatMessage("O jogo terminou em EMPATE!");
  }

  // Habilitar botão de Start para nova partida
  document.getElementById("startGameBtn").disabled = false;
}

/**
 * Caso o tempo acabe, verificamos quem tem mais score.
 * Se empatar, é empate. Caso contrário, aquele com maior score vence.
 */
function endGameByTime() {
  gameOver = true;
  gameStarted = false;
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  if (playerScore > computerScore) {
    addChatMessage(`Tempo esgotado! Você vence com ${playerScore} contra ${computerScore}.`);
    salvarPlacar(playerName, playerScore);
  } else if (computerScore > playerScore) {
    addChatMessage(`Tempo esgotado! Computador vence com ${computerScore} contra ${playerScore}.`);
  } else {
    addChatMessage("Tempo esgotado! O jogo terminou em EMPATE!");
  }

  document.getElementById("startGameBtn").disabled = false;
}

// ======================= Conversões e Exibições ======================= //
function convertToGridNotation(row, col) {
  const letter = String.fromCharCode(65 + col);
  const number = row + 1;
  return `${letter}${number}`;
}

function addChatMessage(msg) {
  const chatBox = document.getElementById("chat-box");
  const p = document.createElement("p");
  p.textContent = msg;
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addDestroyedShipInfo(isPlayerShip, ship) {
  const destroyedList = document.getElementById("destroyed-list");
  const div = document.createElement("div");

  let positionsStr = ship.positions
    .map((pos) => convertToGridNotation(pos.row, pos.col))
    .join(", ");

  div.textContent = `${isPlayerShip ? "Seu" : "Inimigo"} => ${ship.nome} (${positionsStr})`;
  destroyedList.appendChild(div);
}

// ======================= Ranking ======================= //
async function obterRanking() {
  try {
    const response = await fetch("/ranking");
    const data = await response.json();
    const rankingList = document.getElementById("ranking-list");
    rankingList.innerHTML = "";
    data.forEach((item, index) => {
      const p = document.createElement("p");
      p.textContent = `${index + 1}. ${item.nome} - ${item.pontuacao} pontos`;
      rankingList.appendChild(p);
    });
  } catch (err) {
    console.error("Erro ao obter ranking", err);
  }
}

async function salvarPlacar(nomeJogador, score) {
  try {
    const response = await fetch("/salvar-placar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomeJogador, score }),
    });
    const data = await response.json();
    if (data.success) {
      addChatMessage("Seu placar foi salvo no ranking!");
    }
  } catch (err) {
    console.error("Erro ao salvar placar", err);
  }
}
