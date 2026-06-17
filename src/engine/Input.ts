/** 输入状态接口 */
export interface InputState {
  keys: Set<string>;       // 当前按下的键盘键集合
  mouseX: number;          // 鼠标屏幕 X 坐标
  mouseY: number;          // 鼠标屏幕 Y 坐标
  mouseDown: boolean;      // 鼠标左键是否按住
}

/** 全局输入状态（模块级单例） */
const state: InputState = {
  keys: new Set(),
  mouseX: 0,
  mouseY: 0,
  mouseDown: false,
};

/**
 * 初始化输入系统
 * @param canvas 绑定鼠标事件的 canvas 元素
 */
export function initInput(canvas: HTMLCanvasElement): void {
  // 键盘按下/抬起监听
  window.addEventListener('keydown', (e) => state.keys.add(e.key.toLowerCase()));
  window.addEventListener('keyup', (e) => state.keys.delete(e.key.toLowerCase()));
  // 鼠标移动监听
  canvas.addEventListener('mousemove', (e) => {
    state.mouseX = e.clientX;
    state.mouseY = e.clientY;
  });
  // 鼠标按键监听
  canvas.addEventListener('mousedown', () => { state.mouseDown = true; });
  canvas.addEventListener('mouseup', () => { state.mouseDown = false; });
}

/** 获取当前输入状态 */
export function getInput(): InputState {
  return state;
}
