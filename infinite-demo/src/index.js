var Game = require('./game2');

var canvas = document.querySelector('#canvas');
resizeCanvas();

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.maxWidth = canvas.width + 'px';
  canvas.style.width = '100%';
}

var ctx = canvas.getContext('2d');

var game = new Game(window, canvas, ctx);
game.run();

window.addEventListener('resize', function() {
  resizeCanvas();
  game.render();
});

// For debugging.
window.game = game;
