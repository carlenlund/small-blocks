var Game = require('./game-2');

var canvas = document.querySelector('#canvas');
canvas.width = 650;
canvas.height = 400;
canvas.style.maxWidth = canvas.width + 'px';
canvas.style.width = '100%';

var ctx = canvas.getContext('2d');

var game = new Game(window, canvas, ctx);
game.run();

window.game = game;  // For debugging
