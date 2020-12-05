var Game = require('./game-2');

var canvas = document.querySelector('#canvas');
canvas.width = 600;
canvas.height = 400;

var ctx = canvas.getContext('2d');

var game = new Game(window, canvas, ctx);
game.run();

window.game = game;  // For debugging
