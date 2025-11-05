import {
  _decorator,
  Component,
  EventMouse,
  input,
  Input,
  Vec3,
  Animation,
} from "cc";
const { ccclass, property } = _decorator;
export const enum Direction {
  RIGHT = 0,
  LEFT = 2,
}
export const BLOCK_SIZE = 80;
@ccclass("PlayerController")
export class PlayerController extends Component {
  @property(Animation)
  BodyAnim: Animation = null;
  // 角色移动步长
  private _moveStep: number = BLOCK_SIZE;
  private _targetPos: Vec3 = new Vec3(0, 0, 0);
  private _curPos: Vec3 = new Vec3(0, 0, 0);
  private _deltaPos: Vec3 = new Vec3(0, 0, 0);
  private _totalTime: number = 0.2;
  private _currentTime: number = 0;
  private _jumpSpeed: number = 0;
  private _jumpDirection: Direction = Direction.RIGHT;
  private _isJumping: boolean = false;
  // 当前跳了多少步
  private _curMoveIndex: number = 0;
  /**
   * 思路 ： 1. 监听键盘事件 2. 根据键盘事件移动角色
   * 1. 监听键盘事件
   * 鼠标左键跳一步 鼠标右键跳两步
   * 2. 根据键盘事件移动角色
   * 记录是否在移动 标识 isJumping
   * 记录当前跳跃的总时间 totalTime 跳跃时间超过0.1秒 角色停止跳跃
   * 记录当前移动的速度 currentSpeed 步数*步长/跳跃时间
   * 记录移动的总时间 _currentTime
   *
   * 记录当前位置、在每一帧调用时更新
   * 移动时间超过限制时间totalTime之后 强制更新终点位置
   *
   */
  start() {
    // input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
  }

  reset() {
    this._curMoveIndex = 0;
    this.node.getPosition(this._curPos);
    this._targetPos.set(0, 0, 0);
  }

  setInputActive(active: boolean) {
    if (active) {
      input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    } else {
      input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    }
  }

  onMouseUp(event: EventMouse) {
    console.log("onMouseUp", event.getButton());
    if (event.getButton() === Direction.RIGHT) {
      // 向右跳一步
      this.jumpByStep(1, Direction.RIGHT);
    } else if (event.getButton() === Direction.LEFT) {
      // 向左跳一步
      //   this.jumpByStep(1, Direction.LEFT);
      this.jumpByStep(2, Direction.RIGHT);
    }
  }

  jumpByStep(step: number, dir: Direction) {
    if (this._isJumping) {
      return;
    }
    this._isJumping = true;

    const clipName = dir === Direction.RIGHT ? "oneStep" : "twoStep";
    const state = this.BodyAnim.getState(clipName);
    this._totalTime = state.duration;
    // 根据输入设置当前跳跃方向
    this._jumpDirection = dir;
    this._currentTime = 0;
    this._jumpSpeed = (step * this._moveStep) / this._totalTime;
    // 终点位置
    this.node.getPosition(this._curPos);
    if (dir === Direction.RIGHT) {
      Vec3.add(
        this._targetPos,
        this._curPos,
        new Vec3(this._moveStep * step, 0, 0)
      );
    } else if (dir === Direction.LEFT) {
      console.log("dir xxxx", dir);
      Vec3.subtract(
        this._targetPos,
        this._curPos,
        new Vec3(this._moveStep * step, 0, 0)
      );
    }
    this.BodyAnim.play(clipName);
    this._curMoveIndex += step;
  }

  onOnceJumpEnd() {
    this.node.emit("JumpEnd", this._curMoveIndex);
  }

  update(deltaTime: number) {
    if (this._isJumping) {
      this._currentTime += deltaTime;
      if (this._currentTime >= this._totalTime) {
        this._isJumping = false;
        // 强制更新终点位置
        this.node.setPosition(this._targetPos);
        // 跳动结束 发射事件
        this.onOnceJumpEnd();
      } else {
        this.node.getPosition(this._curPos);
        // 每帧仅在 X 轴更新位移，避免残留 Y/Z 值影响
        this._deltaPos.set(this._jumpSpeed * deltaTime, 0, 0);
        if (this._jumpDirection === Direction.LEFT) {
          Vec3.subtract(this._curPos, this._curPos, this._deltaPos);
        } else {
          Vec3.add(this._curPos, this._curPos, this._deltaPos);
        }
        // 更新位置
        this.node.setPosition(this._curPos);
      }
    }
  }
}
