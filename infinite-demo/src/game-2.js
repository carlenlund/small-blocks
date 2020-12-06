var utils = require('./utils');
var Chunk = require('./chunk');
var Player = require('./player');

function Game(window, canvas, ctx) {
  this.window = window;
  this.canvas = canvas;
  this.ctx = ctx;

  this.renderDistance = 3;

  this.world = new Chunk();
  this.generateBlocks(this.world);

  this.player = new Player();
  this.player.x = Chunk.WIDTH / 2 - 1;
  this.player.chunk = this.world;

  if (this.window) {
    this.window.addEventListener('keydown', function(event) {
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

      this.render();
    }.bind(this));
  }
}

Game.prototype.run = function() {
  this.checkPlayerOutOfBounds();
  this.render();
};

Game.prototype.moveLeft = function() {
  this.player.x -= this.player.speed;
  this.player.x = Math.ceil(this.player.x);

  this.checkPlayerOutOfBounds();
};

Game.prototype.moveRight = function() {
  this.player.x += this.player.speed;
  this.player.x = Math.floor(this.player.x);

  this.checkPlayerOutOfBounds();
};

Game.prototype.zoomOut = function() {
  this.player.x /= 2;
  if (this.player.chunk.oneHot) {
    this.player.x += this.player.chunk.oneHot * Chunk.WIDTH / 2;
  }

  var chunk;
  var isNewChunk = false;
  if (this.player.chunk.parent) {
    chunk = this.player.chunk.parent;
  } else {
    chunk = new Chunk();
    this.player.chunk.parent = chunk;
    chunk.children[this.player.chunk.oneHot ? 1 : 0] = this.player.chunk;
    isNewChunk = true;
  }

  if (isNewChunk) {
    if (this.player.chunk.oneHot) {
      chunk.sample(this.player.chunk,
                   0, Chunk.WIDTH,
                   Chunk.WIDTH / 2, Chunk.WIDTH);
    } else {
      chunk.sample(this.player.chunk,
                   0, Chunk.WIDTH,
                   0, Chunk.WIDTH / 2);
    }
  } else {
    if (this.player.chunk.oneHot) {
      chunk.sampleDirtyNegative(this.player.chunk,
                                0, Chunk.WIDTH,
                                Chunk.WIDTH / 2, Chunk.WIDTH);
    } else {
      chunk.sampleDirtyNegative(this.player.chunk,
                                0, Chunk.WIDTH,
                                0, Chunk.WIDTH / 2);
    }
  }
  if (this.player.chunk.oneHot) {
    chunk.setDirtyPositive(Chunk.WIDTH / 2, Chunk.WIDTH, false);
  } else {
    chunk.setDirtyPositive(0, Chunk.WIDTH / 2, false);
  }
  this.player.chunk.setDirtyNegative(0, Chunk.WIDTH, false);

  this.player.chunk = chunk;

  this.checkPlayerOutOfBounds();

  --this.player.zoom;
};

Game.prototype.zoomIn = function() {
  var childIndex = this.player.x < Chunk.WIDTH / 2 ? 0 : 1;

  if (childIndex === 1) {
    this.player.x -= Chunk.WIDTH / 2;
  }
  this.player.x *= 2;

  var chunk;
  var isNewChunk = false;
  if (this.player.chunk.children[childIndex]) {
    chunk = this.player.chunk.children[childIndex];
  } else {
    chunk = new Chunk();
    chunk.oneHot = childIndex === 1;
    this.player.chunk.children[childIndex] = chunk;
    chunk.parent = this.player.chunk;
    isNewChunk = true;
  }

  if (isNewChunk) {
    if (chunk.oneHot) {
      chunk.sample(this.player.chunk,
                   Chunk.WIDTH / 2, Chunk.WIDTH,
                   0, Chunk.WIDTH);
    } else {
      chunk.sample(this.player.chunk,
                   0, Chunk.WIDTH / 2,
                   0, Chunk.WIDTH);
    }
  } else {
    if (chunk.oneHot) {
      chunk.sampleDirtyPositive(this.player.chunk,
                                Chunk.WIDTH / 2, Chunk.WIDTH,
                                0, Chunk.WIDTH);
    } else {
      chunk.sampleDirtyPositive(this.player.chunk,
                                0, Chunk.WIDTH / 2,
                                0, Chunk.WIDTH);
    }
  }
  chunk.setDirtyNegative(0, Chunk.WIDTH, false);
  if (chunk.oneHot) {
    this.player.chunk.setDirtyPositive(Chunk.WIDTH / 2, Chunk.WIDTH, false);
  } else {
    this.player.chunk.setDirtyPositive(0, Chunk.WIDTH / 2, false);
  }

  this.player.chunk = chunk;

  this.checkPlayerOutOfBounds();

  ++this.player.zoom;
};

Game.prototype.breakBlock = function() {
  this.setBlock(Math.round(this.player.x), 0);
};

Game.prototype.placeBlock = function() {
  this.setBlock(Math.round(this.player.x), 3);
};

Game.prototype.setBlock = function(x, value) {
  this.player.chunk.setBlock(x, value);
};

Game.prototype.checkPlayerOutOfBounds = function() {
  while (this.player.x < 0) {
    var chunk = this.player.chunk.lookUpNeighbor(0);
    if (!chunk) {
      chunk = new Chunk();
      chunk.oneHot = !this.player.chunk.oneHot;
      this.player.chunk.neighbors[0] = chunk;
      chunk.neighbors[1] = this.player.chunk;

      this.generateBlocks(chunk);
    }

    this.player.chunk = this.player.chunk.neighbors[0];

    this.player.x += Chunk.WIDTH;
  }

  while (this.player.x >= Chunk.WIDTH) {
    var chunk = this.player.chunk.lookUpNeighbor(1);
    if (!chunk) {
      chunk = new Chunk();
      chunk.oneHot = !this.player.chunk.oneHot;
      this.player.chunk.neighbors[1] = chunk;
      chunk.neighbors[0] = this.player.chunk;

      this.generateBlocks(chunk);
    }

    this.player.chunk = this.player.chunk.neighbors[1];

    this.player.x -= Chunk.WIDTH;
  }

  this.enforceRenderDistance(this.player.chunk, this.renderDistance);
};

Game.prototype.enforceRenderDistance = function(chunk, renderDistance) {
  if (renderDistance <= 1) {
    return;
  }
  --renderDistance;
  for (var i = 0; i < chunk.neighbors.length; ++i) {
    var neighbor = chunk.lookUpNeighbor(i);
    if (!neighbor) {
      neighbor = new Chunk();
      neighbor.oneHot = !chunk.oneHot;
      chunk.neighbors[i] = neighbor;
      neighbor.neighbors[i === 0 ? 1 : 0] = chunk;

      this.generateBlocks(neighbor);
    }
    this.enforceRenderDistance(neighbor, renderDistance);
  }
};

Game.prototype.render = function() {
  this.ctx.fillStyle = '#fff';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  var scale = 130;

  this.ctx.save();
  this.ctx.translate(this.canvas.width / 2 - this.player.x * scale / Chunk.WIDTH, 0);

  this.renderChunk(this.player.chunk, 0, this.renderDistance, scale, null);
  this.renderPlayer(this.player, scale);

  this.ctx.restore();

  // console.log('X: ' + this.player.x +
  //             ', Zoom: ' + this.player.zoom);
};

Game.prototype.renderChunk = function(chunk, x, depth, scale, previousChunk) {
  if (depth === 0) {
    return;
  }
  if (previousChunk === chunk) {
    return;
  }

  var halfWidth = scale / 2;
  var blockSize = scale / Chunk.WIDTH;
  for (var i = 0; i < chunk.blocks.length; ++i) {
    if (chunk.blocks[i] === 0) {
      this.ctx.fillStyle = '#ddd';
    } else if (chunk.blocks[i] === 1) {
      this.ctx.fillStyle = '#45a';
    } else if (chunk.blocks[i] === 2) {
      this.ctx.fillStyle = '#b54';
    } else if (chunk.blocks[i] === 3) {
      this.ctx.fillStyle = '#4a5';
    }

    this.ctx.fillRect(Math.floor(x + i * blockSize), 0,
                      Math.ceil(blockSize), this.canvas.height);
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
  var x = this.player.x * scale / Chunk.WIDTH + scale / Chunk.WIDTH / 2;
  this.ctx.arc(x, 0.1 * this.canvas.height, this.player.size / 2,
               0, 2 * Math.PI);
  this.ctx.fill();
  this.ctx.stroke();
};

Game.prototype.generateBlocks = function(chunk) {
  // TODO: This should take into account the current zoom level.
  for (var i = 0; i < chunk.blocks.length; ++i) {
    if (chunk.oneHot) {
      chunk.setBlock(i, i % 3 === 0 ? 2 : 0);
    } else {
      chunk.setBlock(i, i % 2 === 0 ? 1 : 0);
    }
  }
};

module.exports = Game;
