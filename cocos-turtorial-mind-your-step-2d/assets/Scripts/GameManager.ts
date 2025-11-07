import {
  _decorator,
  CCInteger,
  Component,
  instantiate,
  Prefab,
  Node,
  Label,
  Vec3,
} from "cc";
import { BLOCK_SIZE, PlayerController } from "./PlayerController";
const { ccclass, property } = _decorator;

enum BlockType {
  BT_NONE,
  BT_STONE,
}

enum GameState {
  GS_INIT,
  GS_PLAYING,
  GS_END,
}

let isFirst: boolean = true;
@ccclass("GameManager")
export class GameManager extends Component {
  //预制体 方便复用 装饰器注入
  @property({ type: Prefab })
  public boxPrefab: Prefab | null = null;
  @property({ type: CCInteger })
  public roadLength: number = 50;
  private _road: BlockType[] = [];

  @property({ type: Node })
  public startMenu: Node | null = null; // 开始的 UI
  @property({ type: Node })
  public gameOverMenu: Node | null = null; // 结束的 UI
  @property({ type: PlayerController })
  public playerCtrl: PlayerController | null = null; // 角色控制器
  @property({ type: Label })
  public stepsLabel: Label | null = null; // 计步器

  init() {
    if (this.startMenu && isFirst) {
      this.startMenu.active = true;
      isFirst = false;
    }
    if (this.gameOverMenu) {
      this.gameOverMenu.active = false;
    }
    this.generateRoad();

    if (this.playerCtrl) {
      this.playerCtrl.setInputActive(false);
      this.playerCtrl.node.setPosition(Vec3.ZERO);
      this.playerCtrl.reset();
    }
  }
  setCurState(value: GameState) {
    switch (value) {
      case GameState.GS_INIT:
        this.init();
        break;
      case GameState.GS_PLAYING:
        if (this.startMenu) {
          this.startMenu.active = false;
        }

        if (this.stepsLabel) {
          this.stepsLabel.string = "0"; // 将步数重置为0
        }

        setTimeout(() => {
          //直接设置active会直接开始监听鼠标事件，做了一下延迟处理
          if (this.playerCtrl) {
            this.playerCtrl.setInputActive(true);
          }
        }, 0.1);
        break;
      case GameState.GS_END:
        break;
    }
  }
  start() {
    this.setCurState(GameState.GS_INIT);
    this.playerCtrl?.node.on("JumpEnd", this.onPlayerJumpEnd, this);
  }

  update(deltaTime: number) {}

  generateRoad() {
    // 清除所有节点
    this.node.removeAllChildren();
    // 初始化
    this._road = [];
    this._road.push(BlockType.BT_STONE);
    // 生成节点类型
    for (let i = 1; i < this.roadLength; i++) {
      if (this._road[i - 1] === BlockType.BT_NONE) {
        this._road.push(BlockType.BT_STONE);
      } else {
        this._road.push(Math.floor(Math.random() * 2));
      }
    }
    // 挂载节点
    for (let j = 0; j < this._road.length; j++) {
      // 生成节点
      let block: Node | null = this.spawnBlockByType(this._road[j]);
      if (block) {
        this.node.addChild(block);
        block.setPosition(j * BLOCK_SIZE, 0, 0);
      }
    }
  }

  spawnBlockByType(type: BlockType) {
    if (!this.boxPrefab) {
      return null;
    }
    let block: Node | null = null;
    switch (type) {
      case BlockType.BT_STONE:
        block = instantiate(this.boxPrefab);
        break;
    }
    return block;
  }

  // 按钮点击事件
  onStartButtonClicked() {
    this.setCurState(GameState.GS_PLAYING);
  }
  onEndButtonClicked() {
    if (this.gameOverMenu) {
      this.gameOverMenu.active = false;
    }
    this.setCurState(GameState.GS_INIT);
    if (!isFirst) {
      this.setCurState(GameState.GS_PLAYING);
    }
  }

  onPlayerJumpEnd(moveIndex: number) {
    if (this.stepsLabel) {
      this.stepsLabel.string =
        "" + (moveIndex >= this.roadLength ? this.roadLength : moveIndex);
    }
    this.checkResult(moveIndex);
  }

  checkResult(moveIndex: number) {
    if (moveIndex < this.roadLength) {
      if (this._road[moveIndex] === BlockType.BT_NONE) {
        // this.setCurState(GameState.GS_INIT);
        if (this.gameOverMenu) {
          this.gameOverMenu.active = true;
        }
      }
    } else {
      this.setCurState(GameState.GS_INIT);
    }
  }
}
