var utils = require('./utils');
var Chunk2 = require('./chunk2');
var Player = require('./player');

function Game(window, canvas, ctx) {
  this.window = window;
  this.canvas = canvas;
  this.ctx = ctx;

  this.renderDistance = 4;

  this.world = new Chunk2(Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS);
  this.initializeWorld(this.world);

  this.player = new Player();
  this.player.speed = Game.NUM_SUBDIVISIONS;
  this.player.chunk = this.world;
  this.player.x = this.player.chunk.size / 2;

  this.oneHotOffset = this.player.x;

  this.pressedKeys = {};

  if (this.window) {
    this.window.addEventListener('keydown', function(event) {
      this.pressedKeys[event.keyCode] = true;
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

      var roundedOffset = Math.floor(this.oneHotOffset);
      var oneHot = roundedOffset >= Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS;

      this.update();
      this.render();
    }.bind(this));

    this.window.addEventListener('keyup', function(event) {
      this.pressedKeys[event.keyCode] = false;
    }.bind(this));
  }
}

Game.NUM_SUBDIVISIONS = 4;
Game.CHUNK_SIZE = 16;

Game.prototype.run = function() {
  this.updateLoop();
};

Game.prototype.moveLeft = function() {
  var previousPlayerX = this.player.x;
  this.player.x -= this.player.speed;
  this.player.x = Math.ceil(this.player.x / Game.NUM_SUBDIVISIONS)
                  * Game.NUM_SUBDIVISIONS;

  this.oneHotOffset += this.player.x - previousPlayerX;
  this.oneHotOffset =
      utils.modulo(this.oneHotOffset,
                   2 * Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS);
};

Game.prototype.moveRight = function() {
  var previousPlayerX = this.player.x;
  this.player.x += this.player.speed;
  this.player.x = Math.floor(this.player.x / Game.NUM_SUBDIVISIONS)
                  * Game.NUM_SUBDIVISIONS;

  this.oneHotOffset += this.player.x - previousPlayerX;
  this.oneHotOffset =
      utils.modulo(this.oneHotOffset,
                   2 * Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS);
};

Game.prototype.zoomOut = function() {
  this.oneHotOffset /= 2;
  this.oneHotOffset =
      utils.modulo(this.oneHotOffset,
                   2 * Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS);

  this.player.x /= 2;
  if (this.player.chunk.oneHot) {
    this.player.x += this.player.chunk.size / 2;
  }

  var chunk = this.player.chunk.parent;
  if (!chunk) {
    var roundedOffset = Math.floor(this.oneHotOffset);
    var oneHot = roundedOffset >= Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS;
    chunk = this.player.chunk.createParent(oneHot);
  }
  chunk.sampleChildren();

  this.player.chunk = chunk;

  --this.player.zoom;
};

Game.prototype.zoomIn = function() {
  this.oneHotOffset *= 2;
  this.oneHotOffset =
      utils.modulo(this.oneHotOffset,
                   2 * Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS);

  var childIndex = this.player.x < this.player.chunk.size / 2 ? 0 : 1;
  if (childIndex === 1) {
    this.player.x -= this.player.chunk.size / 2;
  }
  this.player.x *= 2;

  var chunk = this.player.chunk.children[childIndex];
  if (!chunk) {
    chunk = this.player.chunk.createChild(childIndex);
  }
  chunk.sampleParent();

  this.player.chunk = chunk;

  ++this.player.zoom;
};

Game.prototype.breakBlock = function() {
  this.setBlock(Math.round(this.player.x / Game.NUM_SUBDIVISIONS), 0);
};

Game.prototype.placeBlock = function() {
  this.setBlock(Math.round(this.player.x / Game.NUM_SUBDIVISIONS), 3);
};

Game.prototype.setBlock = function(x, value) {
  var chunk;
  if (x >= Game.CHUNK_SIZE) {
    x -= Game.CHUNK_SIZE;
    chunk = this.player.chunk.lookUpNeighbor(1);
    if (!chunk) {
      chunk = this.player.chunk.createNeighbor(1);
    }
  } else {
    chunk = this.player.chunk;
  }
  for (var i = 0; i < Game.NUM_SUBDIVISIONS; ++i) {
    chunk.setBlock(x * Game.NUM_SUBDIVISIONS + i, value);
  }
};

Game.prototype.checkPlayerOutOfBounds = function() {
  while (this.player.x < 0) {
    var chunk = this.player.chunk.lookUpNeighbor(0);
    if (!chunk) {
      chunk = this.player.chunk.createNeighbor(0);
    }
    this.player.chunk = this.player.chunk.neighbors[0];
    this.player.x += this.player.chunk.size;
  }

  while (this.player.x >= this.player.chunk.size) {
    var chunk = this.player.chunk.lookUpNeighbor(1);
    if (!chunk) {
      chunk = this.player.chunk.createNeighbor(1);
    }
    this.player.chunk = this.player.chunk.neighbors[1];
    this.player.x -= this.player.chunk.size;
  }
};

Game.prototype.enforceRenderDistance = function(chunk, renderDistance, previousChunk) {
  previousChunk = previousChunk || null;
  if (renderDistance < 1) {
    return;
  }
  --renderDistance;
  for (var i = 0; i < chunk.neighbors.length; ++i) {
    var neighbor = chunk.lookUpNeighbor(i);
    if (neighbor === previousChunk) {
      continue;
    }
    if (!neighbor) {
      neighbor = chunk.createNeighbor(i);
    }
    this.enforceRenderDistance(neighbor, renderDistance, chunk);
  }
};

Game.prototype.updateLoop = function() {
  this.render();

  requestAnimationFrame(this.updateLoop.bind(this));
};

Game.prototype.update = function() {
  this.checkPlayerOutOfBounds();
  this.enforceRenderDistance(this.player.chunk, this.renderDistance);
};

Game.prototype.render = function() {
  this.ctx.fillStyle = '#000';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  var scale = 200;

  this.ctx.save();
  this.ctx.translate(
      this.canvas.width / 2 - this.player.x * scale / this.player.chunk.size,
      0);

  this.renderChunk(this.player.chunk, 0, this.renderDistance, scale, null);
  this.renderPlayer(this.player, scale);

  this.ctx.restore();

  // console.log('X: ' + this.player.x +
  //             ', Zoom: ' + this.player.zoom);
};

Game.prototype.renderChunk = function(chunk, x, depth, scale, previousChunk) {
  if (depth < 0) {
    return;
  }
  if (previousChunk === chunk) {
    return;
  }

  var halfWidth = scale / 2;
  var blockSize = scale / this.player.chunk.size;
  for (var i = 0; i < chunk.blocks.length; ++i) {
    if (chunk.blocks[i] === 0) {
      continue;
    }
    if (chunk.blocks[i] === 1) {
      this.ctx.fillStyle = '#9c5';
    } else if (chunk.blocks[i] === 2) {
      this.ctx.fillStyle = '#46d';
    } else if (chunk.blocks[i] === 3) {
      this.ctx.fillStyle = '#d64';
    }

    this.ctx.fillRect(x + i * blockSize, 0,
                      blockSize, this.canvas.height);
  }

  --depth;
  if (chunk.neighbors[0]) {
    this.renderChunk(chunk.neighbors[0],
                     x - scale, 
                     depth,
                     scale,
                     chunk);
  }
  if (chunk.neighbors[1]) {
    this.renderChunk(chunk.neighbors[1],
                     x + scale, 
                     depth,
                     scale,
                     chunk);
  }
};

Game.prototype.renderPlayer = function(player, scale) {
  this.ctx.fillStyle = '#ff0';
  this.ctx.strokeStyle = '#000';
  this.ctx.lineWidth = 1;
  this.ctx.beginPath();
  var x = this.player.x * scale / this.player.chunk.size
          + scale / this.player.chunk.size / 2 * Game.NUM_SUBDIVISIONS;
  var y = 0.38 * this.canvas.height;
  this.ctx.arc(x, y, this.player.size / 2, 0, 2 * Math.PI);
  this.ctx.fill();
  this.ctx.stroke();
};

Game.prototype.initializeWorld = function(chunk) {
  this.generateBlocks(chunk);
  for (var i = 0; i < chunk.neighbors.length; ++i) {
    var neighbor = chunk.lookUpNeighbor(i);
    if (!neighbor) {
      neighbor = chunk.createNeighbor(i);
    }
    this.generateBlocks(neighbor);
  }
};

Game.prototype.generateBlocks = function(chunk) {
  // TODO: This should take into account the current zoom level.
  for (var i = 0; i < chunk.blocks.length; ++i) {
    var block;
    if (!chunk.oneHot) {
      block = Math.floor(i / Game.NUM_SUBDIVISIONS) % 2 === 0 ? 1 : 0;
    } else {
      block = Math.floor(i / Game.NUM_SUBDIVISIONS) % 3 === 0 ? 2 : 0;
    }
    chunk.setBlock(i, block);
  }
};

module.exports = Game;
