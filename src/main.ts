import { Game } from './game/Game';
import { StartScreen } from './ui/StartScreen';

const container = document.getElementById('game-container')!;
const startScreen = new StartScreen();
startScreen.show();

startScreen.onPlay(() => {
  startScreen.hide();
  const game = new Game(container);
  let lastTime = performance.now();
  function loop(time: number): void {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    game.update(dt);
    game.render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
});
