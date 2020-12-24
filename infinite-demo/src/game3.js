var utils = require('./utils');
var Player = require('./player');
var World = require('./world');

function Game(window, canvas, ctx) {
  this.window = window;
  this.canvas = canvas;
  this.ctx = ctx;

  this.renderDistance = 4;

  this.world = new World();
  this.initializeWorld(this.world);

  this.player = new Player();
  this.player.speed = 20;
  this.player.x = 0;
  this.player.y = 0;

  this.pressedKeys = {};

  if (this.window) {
    this.window.addEventListener('keydown', function(event) {
      this.pressedKeys[event.keyCode] = true;
      if (event.keyCode === 'W'.charCodeAt(0)) {
        this.moveUp();
      }
      if (event.keyCode === 'S'.charCodeAt(0)) {
        this.moveDown();
      }
      if (event.keyCode === 'A'.charCodeAt(0)) {
        this.moveLeft();
      }
      if (event.keyCode === 'D'.charCodeAt(0)) {
        this.moveRight();
      }
      if (event.keyCode === 'Q'.charCodeAt(0)) {
        this.zoomOut();
      }
      if (event.keyCode === 'E'.charCodeAt(0)) {
        this.zoomIn();
      }
      if (event.keyCode === 'F'.charCodeAt(0)) {
        this.breakBlock();
      }
      if (event.keyCode === 'G'.charCodeAt(0)) {
        this.placeBlock();
      }
      if (event.keyCode === 'H'.charCodeAt(0)) {
        // Regenerate chunks where player is located.
        this.initializeWorld(this.player.chunk);
      }

      this.update();
      this.render();
    }.bind(this));

    this.window.addEventListener('keyup', function(event) {
      this.pressedKeys[event.keyCode] = false;
    }.bind(this));
  }
}

Game.prototype.run = function() {
  this.updateLoop();
};

Game.prototype.moveUp = function() {
};

Game.prototype.moveDown = function() {
};

Game.prototype.moveLeft = function() {
};

Game.prototype.moveRight = function() {
};

Game.prototype.zoomOut = function() {
};

Game.prototype.zoomIn = function() {
};

Game.prototype.breakBlock = function() {
};

Game.prototype.placeBlock = function() {
};

Game.prototype.setBlock = function(x, y, value) {
};

Game.prototype.checkPlayerOutOfBounds = function() {
};

Game.prototype.enforceRenderDistance = function(chunk, renderDistance,
                                                previousChunk) {
};

Game.prototype.initializeWorld = function(chunk) {
};

Game.prototype.generateBlocks = function(chunk) {
};

Game.prototype.updateLoop = function() {
  this.render();

  requestAnimationFrame(this.updateLoop.bind(this));
};

Game.prototype.update = function() {
};

Game.prototype.render = function() {
  this.ctx.fillStyle = '#eef';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  var scale = 200;

  // this.ctx.save();
  // this.ctx.translate(
  //     this.canvas.width / 2 - this.player.x * scale / this.player.chunk.size,
  //     this.canvas.height / 2 - this.player.y * scale / this.player.chunk.size);
  // 
  // this.ctx.restore();

  this.renderPlayer(this.player, scale);
};

Game.prototype.renderChunk = function(chunk, x, y,
                                      depth, scale, previousChunk) {
};

Game.prototype.renderPlayer = function(player, scale) {
  this.ctx.fillStyle = '#ff0';
  this.ctx.strokeStyle = '#000';
  this.ctx.lineWidth = 1;
  this.ctx.beginPath();
  var x = this.player.x;
  var y = this.player.y;
  this.ctx.arc(x, y, this.player.size / 2, 0, 2 * Math.PI);
  this.ctx.fill();
  this.ctx.stroke();
};

module.exports = Game;
