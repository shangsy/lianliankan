// ========== 关卡配置 ==========
// rows: 行数, cols: 列数, types: 图案种类数
const LEVELS = [
  // 1~10 关：小棋盘，少图案（极易）
  { rows: 4, cols: 6, types: 6 },
  { rows: 4, cols: 6, types: 6 },
  { rows: 4, cols: 6, types: 7 },
  { rows: 4, cols: 6, types: 7 },
  { rows: 5, cols: 6, types: 7 },
  { rows: 5, cols: 6, types: 7 },
  { rows: 5, cols: 6, types: 8 },
  { rows: 5, cols: 6, types: 8 },
  { rows: 5, cols: 6, types: 9 },
  { rows: 5, cols: 8, types: 9 },
  // 11~20 关：中等棋盘
  { rows: 6, cols: 6, types: 9 },
  { rows: 6, cols: 6, types: 9 },
  { rows: 6, cols: 8, types: 10 },
  { rows: 6, cols: 8, types: 10 },
  { rows: 6, cols: 8, types: 11 },
  { rows: 6, cols: 8, types: 11 },
  { rows: 7, cols: 8, types: 11 },
  { rows: 7, cols: 8, types: 11 },
  { rows: 7, cols: 8, types: 12 },
  { rows: 7, cols: 8, types: 12 },
  // 21~30 关：稍大棋盘
  { rows: 8, cols: 8, types: 12 },
  { rows: 8, cols: 8, types: 12 },
  { rows: 8, cols: 10, types: 13 },
  { rows: 8, cols: 10, types: 13 },
  { rows: 8, cols: 10, types: 14 },
  { rows: 8, cols: 10, types: 14 },
  { rows: 8, cols: 10, types: 15 },
  { rows: 8, cols: 10, types: 15 },
  { rows: 8, cols: 10, types: 16 },
  { rows: 8, cols: 10, types: 16 },
  // 新增 31~50 关
  { rows: 8, cols: 10, types: 16 },
  { rows: 8, cols: 10, types: 16 },
  { rows: 8, cols: 10, types: 17 },
  { rows: 8, cols: 10, types: 17 },
  { rows: 8, cols: 10, types: 18 },
  { rows: 8, cols: 10, types: 18 },
  { rows: 8, cols: 10, types: 19 },
  { rows: 8, cols: 10, types: 19 },
  { rows: 8, cols: 10, types: 20 },
  { rows: 8, cols: 10, types: 20 },
  { rows: 8, cols: 10, types: 21 },
  { rows: 8, cols: 10, types: 21 },
  { rows: 8, cols: 10, types: 22 },
  { rows: 8, cols: 10, types: 22 },
  { rows: 8, cols: 10, types: 23 },
  { rows: 8, cols: 10, types: 23 },
  { rows: 8, cols: 10, types: 24 },
  { rows: 8, cols: 10, types: 24 },
  { rows: 8, cols: 10, types: 25 },
  { rows: 8, cols: 10, types: 25 }
];

// ========== 游戏主场景 ==========
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
  // 如果传入了关卡号（下一关/重新开始），就使用它；否则默认第1关
  this.currentLevel = (data && data.level) ? data.level : 0;
}

  create() {
    this.cameras.main.setBackgroundColor('#2d5a3b');
    this.level = LEVELS[this.currentLevel];
    this.rows = this.level.rows;
    this.cols = this.level.cols;
    this.types = this.level.types;

    // 棋盘数据数组（扩展边界：行数+2，列数+2）
    this.board = [];
    this.tiles = [];
    this.selectedTile = null;

    // UI
    this.createUI();

    // 生成并绘制棋盘
    this.createBoard();
  }

  // ========== UI：大字体、大按钮 ==========
  createUI() {
    const centerX = this.sys.game.config.width / 2;

    // 标题
    this.add.text(centerX, 50, '连连看', {
      fontSize: '52px',
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 关卡显示
    this.levelText = this.add.text(centerX, 110, `第 ${this.currentLevel + 1}/${LEVELS.length} 关`, {
      fontSize: '36px',
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 按钮区域（屏幕底部）
    const btnY = this.sys.game.config.height - 80;

    // 提示按钮
    const hintBtn = this.add.text(120, btnY, '💡 提示', {
      fontSize: '36px',
      fontFamily: 'Arial',
      backgroundColor: '#e67e22',
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
      color: '#fff',
      borderRadius: 10
    }).setOrigin(0.5).setInteractive();

    hintBtn.on('pointerdown', () => this.showHint());

    // 洗牌按钮
    const shuffleBtn = this.add.text(350, btnY, '🔀 洗牌', {
      fontSize: '36px',
      fontFamily: 'Arial',
      backgroundColor: '#3498db',
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
      color: '#fff',
      borderRadius: 10
    }).setOrigin(0.5).setInteractive();

    shuffleBtn.on('pointerdown', () => this.shuffleBoard());

    // 给老人用的提示文字
    this.add.text(centerX, btnY - 60, '点击两个相同图案即可消除', {
      fontSize: '24px',
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      color: '#ddd'
    }).setOrigin(0.5);
  }

  // ========== 棋盘生成（带边界空行/列）==========
  createBoard() {
    // 实际数据数组大小：(rows+2) x (cols+2)
    const totalRows = this.rows + 2;
    const totalCols = this.cols + 2;
    this.board = Array.from({ length: totalRows }, () => Array(totalCols).fill(0));

    // 生成成对图案 ID
    const totalSlots = this.rows * this.cols;
    let icons = [];
    for (let i = 0; i < totalSlots / 2; i++) {
      const id = Phaser.Math.Between(1, this.types);
      icons.push(id, id);
    }
    // 洗牌直到有解
    do {
      Phaser.Utils.Array.Shuffle(icons);
      // 填入内部区域（避开边界）
      let idx = 0;
      for (let r = 1; r <= this.rows; r++) {
        for (let c = 1; c <= this.cols; c++) {
          this.board[r][c] = icons[idx++];
        }
      }
    } while (!this.hasAnyMatch());

    this.drawBoard();
  }

  // 检查棋盘是否有任何可消对
  hasAnyMatch() {
    for (let r1 = 1; r1 <= this.rows; r1++) {
      for (let c1 = 1; c1 <= this.cols; c1++) {
        if (this.board[r1][c1] === 0) continue;
        for (let r2 = 1; r2 <= this.rows; r2++) {
          for (let c2 = 1; c2 <= this.cols; c2++) {
            if (r1 === r2 && c1 === c2) continue;
            if (this.board[r1][c1] === this.board[r2][c2] &&
                this.canConnect(r1, c1, r2, c2)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  // 洗牌（保留现有方块，只打乱位置）
// 洗牌（保留现有方块，打乱位置，并保证有解）
shuffleBoard() {
    // 清除当前高亮
    this.clearSelection();

    // 收集所有非空图案及其位置
    let items = [];
    for (let r = 1; r <= this.rows; r++) {
        for (let c = 1; c <= this.cols; c++) {
            if (this.board[r][c] !== 0) {
                items.push({ id: this.board[r][c] });
            }
        }
    }

    // 如果棋盘已空，直接返回
    if (items.length === 0) return;

    // 反复打乱，直到生成的棋盘有解（最多尝试 100 次）
    let attempts = 0;
    do {
        // 打乱图案顺序
        Phaser.Utils.Array.Shuffle(items);
        // 清空内部格子
        for (let r = 1; r <= this.rows; r++)
            for (let c = 1; c <= this.cols; c++)
                this.board[r][c] = 0;
        // 按新顺序填入
        let idx = 0;
        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                if (idx < items.length) {
                    this.board[r][c] = items[idx].id;
                    idx++;
                }
            }
        }
        attempts++;
        // 防止死循环（棋盘本身不可能有解时放弃）
        if (attempts > 100) break;
    } while (!this.hasAnyMatch());

    // 重新绘制整个棋盘
    this.drawBoard();

    // 提示玩家洗牌完成
    this.showNotice('已重新排列');
}

  // 绘制棋盘方块
  drawBoard() {
    // 销毁旧方块
    this.tiles.forEach(t => t.destroy());
    this.tiles = [];

    const tileSize = 60;
    // 计算棋盘偏移使其居中
    const offsetX = (this.sys.game.config.width - this.cols * tileSize) / 2;
    const offsetY = 160;

    for (let r = 1; r <= this.rows; r++) {
      for (let c = 1; c <= this.cols; c++) {
        const id = this.board[r][c];
        if (id === 0) continue;

        const x = offsetX + (c - 1) * tileSize + tileSize/2;
        const y = offsetY + (r - 1) * tileSize + tileSize/2;

        // 方块容器
        const tile = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, tileSize - 6, tileSize - 6, this.getColor(id));
        bg.setStrokeStyle(3, 0xffffff);
        // 大数字
        const text = this.add.text(0, 0, id, {
          fontSize: '30px',
          fontFamily: 'Arial',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5);

        tile.add([bg, text]);
        tile.setSize(tileSize - 6, tileSize - 6);
        tile.setInteractive();
        // 存储棋盘坐标（注意是逻辑坐标，1..rows）
        tile.setData('row', r);
        tile.setData('col', c);
        tile.setData('id', id);
        tile.on('pointerdown', () => this.onTileClick(tile));
        this.tiles.push(tile);
      }
    }
  }

  // 柔和的大色板
  getColor(id) {
    const colors = [
      0xE74C3C, 0x3498DB, 0x2ECC71, 0xF1C40F, 0x9B59B6,
      0xE67E22, 0x1ABC9C, 0xE91E63, 0x00BCD4, 0xFF9800,
      0x8BC34A, 0x03A9F4, 0xF44336, 0xCDDC39, 0xFF5722,
      0x607D8B, 0x795548, 0x9C27B0, 0x673AB7, 0x009688
    ];
    return colors[(id - 1) % colors.length];
  }

  // ========== 点击交互 ==========
  onTileClick(tile) {
    const r = tile.getData('row');
    const c = tile.getData('col');
    if (this.board[r][c] === 0) return;

    if (!this.selectedTile) {
      this.selectedTile = tile;
      tile.list[0].setStrokeStyle(4, 0xFFD700); // 金色粗边高亮
    } else {
      const tileA = this.selectedTile;
      const tileB = tile;
      if (tileA === tileB) {
        this.clearSelection();
        return;
      }
      const r1 = tileA.getData('row');
      const c1 = tileA.getData('col');
      const r2 = tileB.getData('row');
      const c2 = tileB.getData('col');

      if (this.board[r1][c1] === this.board[r2][c2] &&
          this.canConnect(r1, c1, r2, c2)) {
        this.clearSelection(); // 先取消高亮
        this.removeTiles(tileA, tileB, r1, c1, r2, c2);
      } else {
        this.clearSelection();
      }
    }
  }

  clearSelection() {
    if (this.selectedTile) {
      this.selectedTile.list[0].setStrokeStyle(3, 0xffffff);
      this.selectedTile = null;
    }
  }

  // 消除动画
  removeTiles(tileA, tileB, r1, c1, r2, c2) {
    this.tweens.add({
      targets: [tileA, tileB],
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        tileA.destroy();
        tileB.destroy();
        this.board[r1][c1] = 0;
        this.board[r2][c2] = 0;

        // 检查是否获胜
        if (this.checkWin()) {
          this.showWin();
        } else if (!this.hasAnyMatch()) {
          // 无解自动洗牌
          this.shuffleBoard();
          this.showNotice('无解啦，已自动重排');
        }
      }
    });
  }

  checkWin() {
    for (let r = 1; r <= this.rows; r++)
      for (let c = 1; c <= this.cols; c++)
        if (this.board[r][c] !== 0) return false;
    return true;
  }

  showWin() {
    const centerX = this.sys.game.config.width / 2;
    const centerY = this.sys.game.config.height / 2;

    const winText = this.add.text(centerX, centerY - 40, '恭喜过关！', {
      fontSize: '60px',
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const nextBtn = this.add.text(centerX, centerY + 60, '下一关', {
      fontSize: '44px',
      fontFamily: 'Arial',
      backgroundColor: '#27ae60',
      color: '#fff',
      padding: { left: 30, right: 30, top: 10, bottom: 10 },
      borderRadius: 15
    }).setOrigin(0.5).setInteractive();

    nextBtn.on('pointerdown', () => {
      winText.destroy();
      nextBtn.destroy();
      // 下一关
      this.currentLevel++;
      if (this.currentLevel >= LEVELS.length) {
        this.add.text(centerX, centerY, '您已通关全部关卡！', {
          fontSize: '48px', color: '#fff'
        }).setOrigin(0.5);
        // 可提供重新开始按钮
        this.time.delayedCall(3000, () => this.scene.restart());
      } else {
        this.scene.restart({ level: this.currentLevel });
      }
    });
  }

  showNotice(msg) {
    const notice = this.add.text(
      this.sys.game.config.width / 2,
      this.sys.game.config.height / 2,
      msg,
      { fontSize: '36px', color: '#fff', backgroundColor: '#00000088', padding: 10 }
    ).setOrigin(0.5);
    this.time.delayedCall(1500, () => notice.destroy());
  }

  // ========== 提示：找到一对可消的闪烁 ==========
  showHint() {
    for (let r1 = 1; r1 <= this.rows; r1++) {
      for (let c1 = 1; c1 <= this.cols; c1++) {
        if (this.board[r1][c1] === 0) continue;
        for (let r2 = 1; r2 <= this.rows; r2++) {
          for (let c2 = 1; c2 <= this.cols; c2++) {
            if (r1 === r2 && c1 === c2) continue;
            if (this.board[r1][c1] === this.board[r2][c2] &&
                this.canConnect(r1, c1, r2, c2)) {
              // 找到第一对，高亮闪烁
              const tileA = this.getTileAt(r1, c1);
              const tileB = this.getTileAt(r2, c2);
              if (tileA && tileB) {
                this.tweens.add({
                  targets: [tileA.list[0], tileB.list[0]],
                  alpha: 0.3,
                  yoyo: true,
                  repeat: 3,
                  duration: 200
                });
                return;
              }
            }
          }
        }
      }
    }
    // 没找到？
    this.showNotice('无解，试试洗牌吧');
  }

  getTileAt(r, c) {
    return this.tiles.find(t => t.getData('row') === r && t.getData('col') === c);
  }

  // ========== 核心：连通性判断（含边界）==========
  canConnect(r1, c1, r2, c2) {
    // 直连
    if (this.isLineEmpty(r1, c1, r2, c2)) return true;
    // 一个拐角
    if (this.board[r1][c2] === 0 &&
        this.isLineEmpty(r1, c1, r1, c2) &&
        this.isLineEmpty(r1, c2, r2, c2)) return true;
    if (this.board[r2][c1] === 0 &&
        this.isLineEmpty(r1, c1, r2, c1) &&
        this.isLineEmpty(r2, c1, r2, c2)) return true;
    // 两个拐角：垂直扫描
    for (let r = 0; r <= this.rows + 1; r++) {
      if (this.board[r][c1] === 0 && this.isLineEmpty(r1, c1, r, c1)) {
        if (this.board[r][c2] === 0 &&
            this.isLineEmpty(r, c1, r, c2) &&
            this.isLineEmpty(r, c2, r2, c2)) return true;
      }
    }
    // 水平扫描
    for (let c = 0; c <= this.cols + 1; c++) {
      if (this.board[r1][c] === 0 && this.isLineEmpty(r1, c1, r1, c)) {
        if (this.board[r2][c] === 0 &&
            this.isLineEmpty(r1, c, r2, c) &&
            this.isLineEmpty(r2, c, r2, c2)) return true;
      }
    }
    return false;
  }

  isLineEmpty(r1, c1, r2, c2) {
    if (r1 === r2) {
      const minC = Math.min(c1, c2);
      const maxC = Math.max(c1, c2);
      for (let c = minC + 1; c < maxC; c++) {
        if (this.board[r1][c] !== 0) return false;
      }
      return true;
    } else if (c1 === c2) {
      const minR = Math.min(r1, r2);
      const maxR = Math.max(r1, r2);
      for (let r = minR + 1; r < maxR; r++) {
        if (this.board[r][c1] !== 0) return false;
      }
      return true;
    }
    return false;
  }
}

// ========== 游戏配置 ==========
const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 720,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: GameScene
};

const game = new Phaser.Game(config);