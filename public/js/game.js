// public/js/game.js

// ============================
// Configuração do Phaser
// ============================
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#222222",
  scene: {
    preload,
    create,
    update
  }
};

let game = new Phaser.Game(config);

// ============================
// Variáveis Globais do Jogo
// ============================
let playerGrid = [];
let cpuGrid = [];
let playerCells = [];
let cpuCells = [];
const GRID_SIZE = 10;
const CELL_SIZE = 32;
const SHIP_SIZES = [5, 4, 3, 3, 2];
let currentTurn = "player";
let playerShipsLeft = 0;
let cpuShipsLeft = 0;

// Textos na tela
let infoText;
let playerScoreText;
let cpuScoreText;

// Variável para a música (exemplo)
let bgMusic;

// ============================
// Preload (carrega assets)
// ============================
function preload() {
  // Exemplo de carregamento de música
  // Ajuste o caminho "assets/music.mp3" para o arquivo correto do seu projeto
  this.load.audio('bgMusic', 'assets/music.mp3');
}

// ============================
// Create (inicia cena)
// ============================
function create() {
  // Inicializa as matrizes
  initGrid(playerGrid, GRID_SIZE);
  initGrid(cpuGrid, GRID_SIZE);
  initCellArrays(playerCells, GRID_SIZE);
  initCellArrays(cpuCells, GRID_SIZE);

  // Posiciona navios
  placeAllShips(playerGrid);
  placeAllShips(cpuGrid);

  // Conta células de navio
  playerShipsLeft = countShipCells(playerGrid);
  cpuShipsLeft   = countShipCells(cpuGrid);

  // Desenha tabuleiros
  drawBoard(this, playerGrid, playerCells, 50, 50, true, true);
  drawBoard(this, cpuGrid,   cpuCells,   450, 50, false);

  // Identificação dos tabuleiros
  this.add.text(50, 20, "Tabuleiro do Jogador", { font: "18px Arial", fill: "#ffffff" });
  this.add.text(450, 20, "Tabuleiro do CPU",    { font: "18px Arial", fill: "#ffffff" });

  // Placar
  playerScoreText = this.add.text(50, 400, `Navios do Jogador: ${playerShipsLeft}`, {
    font: "16px Arial",
    fill: "#ffffff"
  });
  cpuScoreText = this.add.text(450, 400, `Navios do CPU: ${cpuShipsLeft}`, {
    font: "16px Arial",
    fill: "#ffffff"
  });

  // Legenda
  this.add.text(50, 460,
    "LEGENDA DE CORES:\n" +
    "- Azul: Água desconhecida\n" +
    "- Cinza: Tiro na água\n" +
    "- Vermelho: Acertou navio\n" +
    "- Verde: Navio do jogador (visível pra debug)",
  { font: "14px Arial", fill: "#ffffff" });

  // Texto de instruções
  infoText = this.add.text(20, 560, "Seu turno! Clique no tabuleiro da direita.", {
    font: "18px Arial",
    fill: "#ffffff"
  });

  // ========== RESOLVENDO O WARNING DO AUDIOCONTEXT ==========
  // Carrega o som de fundo e adiciona
  bgMusic = this.sound.add('bgMusic', { loop: true, volume: 0.3 });

  // Espera o primeiro clique/tap do usuário:
  this.input.once('pointerdown', () => {
    // Retomar o contexto de áudio
    this.sound.context.resume().then(() => {
      console.log('AudioContext retomado após gesto do usuário.');
      // Se quiser, comece a tocar a música de fundo:
      bgMusic.play();
    });
  });
}

// ============================
// Update (loop de jogo)
// ============================
function update() {
  // ...
}

// ========== Funções Auxiliares ==========

function initGrid(grid, size) {
  for (let r = 0; r < size; r++) {
    grid[r] = [];
    for (let c = 0; c < size; c++) {
      grid[r][c] = { hasShip: false, hit: false };
    }
  }
}

function initCellArrays(cellArray, size) {
  for (let r = 0; r < size; r++) {
    cellArray[r] = [];
    for (let c = 0; c < size; c++) {
      cellArray[r][c] = null;
    }
  }
}

function placeAllShips(grid) {
  for (let size of SHIP_SIZES) {
    placeShip(grid, size);
  }
}

function placeShip(grid, size) {
  let placed = false;
  while (!placed) {
    let isVertical = Math.random() < 0.5;
    if (isVertical) {
      let row = Phaser.Math.Between(0, GRID_SIZE - size);
      let col = Phaser.Math.Between(0, GRID_SIZE - 1);
      if (!checkOverlap(grid, row, col, size, true)) {
        for (let i = 0; i < size; i++) {
          grid[row + i][col].hasShip = true;
        }
        placed = true;
      }
    } else {
      let row = Phaser.Math.Between(0, GRID_SIZE - 1);
      let col = Phaser.Math.Between(0, GRID_SIZE - size);
      if (!checkOverlap(grid, row, col, size, false)) {
        for (let i = 0; i < size; i++) {
          grid[row][col + i].hasShip = true;
        }
        placed = true;
      }
    }
  }
}

function checkOverlap(grid, row, col, size, vertical) {
  for (let i = 0; i < size; i++) {
    let r = vertical ? row + i : row;
    let c = vertical ? col : col + i;
    if (grid[r][c].hasShip) return true;
  }
  return false;
}

function drawBoard(scene, grid, cellArray, offsetX, offsetY, isPlayer, showPlayerShips = false) {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      let x = offsetX + col * CELL_SIZE;
      let y = offsetY + row * CELL_SIZE;
      let cellRect = scene.add.rectangle(
        x + CELL_SIZE / 2,
        y + CELL_SIZE / 2,
        CELL_SIZE - 2,
        CELL_SIZE - 2,
        0x0000ff
      );
      cellRect.setOrigin(0.5);

      cellArray[row][col] = cellRect;

      if (isPlayer && showPlayerShips && grid[row][col].hasShip) {
        cellRect.fillColor = 0x006600;
      }

      if (!isPlayer) {
        cellRect.setInteractive();
        cellRect.on("pointerdown", () => {
          if (currentTurn === "player") {
            handlePlayerShot(scene, cpuGrid, cpuCells, row, col);
          }
        });
      }
    }
  }
}

function countShipCells(grid) {
  let total = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c].hasShip) total++;
    }
  }
  return total;
}

function handlePlayerShot(scene, cpuGridState, cpuCellShapes, row, col) {
  let cellData = cpuGridState[row][col];
  if (cellData.hit) {
    infoText.setText("Você já atirou nessa célula!");
    return;
  }
  cellData.hit = true;
  let cellRect = cpuCellShapes[row][col];

  if (cellData.hasShip) {
    cellRect.fillColor = 0xff0000; 
    cpuShipsLeft--;
    updateScores();

    if (cpuShipsLeft === 0) {
      infoText.setText("Você venceu! Parabéns!");
      endGame(scene, "player");
      return;
    }
    infoText.setText("Acertou! Pode continuar atirando!");
  } else {
    cellRect.fillColor = 0x888888;
    infoText.setText("Errou! Agora é turno do CPU.");
    currentTurn = "cpu";
    scene.time.delayedCall(1000, () => {
      cpuTurn(scene);
    });
  }
}

function cpuTurn(scene) {
  if (cpuShipsLeft === 0 || playerShipsLeft === 0) return;

  let keepShooting = true;
  while (keepShooting) {
    let row, col;
    do {
      row = Phaser.Math.Between(0, GRID_SIZE - 1);
      col = Phaser.Math.Between(0, GRID_SIZE - 1);
    } while (playerGrid[row][col].hit);

    playerGrid[row][col].hit = true;
    let cellRect = playerCells[row][col];

    if (playerGrid[row][col].hasShip) {
      playerShipsLeft--;
      cellRect.fillColor = 0xff0000;
      infoText.setText(`CPU acertou seu navio em (${row}, ${col})!`);
      updateScores();

      if (playerShipsLeft === 0) {
        infoText.setText("Todos os seus navios foram afundados! Você perdeu.");
        endGame(scene, "cpu");
        return;
      }
    } else {
      cellRect.fillColor = 0x888888;
      infoText.setText(`CPU errou em (${row}, ${col}). Sua vez!`);
      keepShooting = false;
    }
  }
  currentTurn = "player";
}

function endGame(scene, winner) {
  console.log(`Fim de jogo! Vencedor: ${winner}`);
  currentTurn = "none";
  let message = winner === "player" ? "Você Venceu! :D" : "Você Perdeu! :(";
  scene.add.text(200, 300, message, { font: "40px Arial", fill: "#ffffff" });
}

function updateScores() {
  if (playerScoreText && cpuScoreText) {
    playerScoreText.setText(`Navios do Jogador: ${playerShipsLeft}`);
    cpuScoreText.setText(`Navios do CPU: ${cpuShipsLeft}`);
  }
}
