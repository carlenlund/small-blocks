var Game = require('./game2');

var canvas = document.querySelector('#canvas');
canvas.width = 650;
canvas.height = 150;
resizeCanvas();

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.style.maxWidth = canvas.width + 'px';
  canvas.style.width = '100%';
}

var ctx = canvas.getContext('2d');

var game = new Game(window, canvas, ctx);
game.run();

window.game = game;  // For debugging

window.addEventListener('resize', function() {
  resizeCanvas();
  game.render();
});
