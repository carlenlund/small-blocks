var utils = require('./utils');
var Chunk4 = require('./chunk4');
var Player = require('./player');

function Game(window, canvas, ctx) {
  this.window = window;
  this.canvas = canvas;
  this.ctx = ctx;

  this.renderDistance = 4;

  this.world = new Chunk4(Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS);
  this.initializeWorld(this.world);

  this.player = new Player();
  this.player.speed = Game.NUM_SUBDIVISIONS;
  this.player.chunk = this.world;
  this.player.x = this.player.chunk.size / 2;
  this.player.y = this.player.chunk.size / 2;

  this.oneHotOffsetX = this.player.x;
  this.oneHotOffsetY = this.player.y;

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

Game.NUM_SUBDIVISIONS = 4;
Game.CHUNK_SIZE = 8;

Game.prototype.run = function() {
  this.updateLoop();
};

Game.prototype.moveUp = function() {
  var previousPlayerY = this.player.y;
  this.player.y -= this.player.speed;
  this.player.y = Math.ceil(this.player.y / Game.NUM_SUBDIVISIONS)
                  * Game.NUM_SUBDIVISIONS;

  this.oneHotOffsetY += this.player.y - previousPlayerY;
  this.oneHotOffsetY =
      utils.modulo(this.oneHotOffsetY,
                   2 * Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS);
};

Game.prototype.moveDown = function() {
  var previousPlayerY = this.player.y;
  this.player.y += this.player.speed;
  this.player.y = Math.ceil(this.player.y / Game.NUM_SUBDIVISIONS)
                  * Game.NUM_SUBDIVISIONS;

  this.oneHotOffsetY += this.player.y - previousPlayerY;
  this.oneHotOffsetY =
      utils.modulo(this.oneHotOffsetY,
                   2 * Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS);
};

Game.prototype.moveLeft = function() {
  var previousPlayerX = this.player.x;
  this.player.x -= this.player.speed;
  this.player.x = Math.ceil(this.player.x / Game.NUM_SUBDIVISIONS)
                  * Game.NUM_SUBDIVISIONS;

  this.oneHotOffsetX += this.player.x - previousPlayerX;
  this.oneHotOffsetX =
      utils.modulo(this.oneHotOffsetX,
                   2 * Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS);
};

Game.prototype.moveRight = function() {
  var previousPlayerX = this.player.x;
  this.player.x += this.player.speed;
  this.player.x = Math.floor(this.player.x / Game.NUM_SUBDIVISIONS)
                  * Game.NUM_SUBDIVISIONS;

  this.oneHotOffsetX += this.player.x - previousPlayerX;
  this.oneHotOffsetX =
      utils.modulo(this.oneHotOffsetX,
                   2 * Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS);
};

Game.prototype.zoomOut = function() {
  this.oneHotOffsetX /= 2;
  this.oneHotOffsetX =
      utils.modulo(this.oneHotOffsetX,
                   2 * Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS);
  this.oneHotOffsetY /= 2;
  this.oneHotOffsetY =
      utils.modulo(this.oneHotOffsetY,
                   2 * Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS);

  this.player.x /= 2;
  if (this.player.chunk.oneHotX) {
    this.player.x += this.player.chunk.size / 2;
  }
  this.player.y /= 2;
  if (this.player.chunk.oneHotY) {
    this.player.y += this.player.chunk.size / 2;
  }

  var chunk = this.player.chunk.parent;
  if (!chunk) {
    var roundedOffsetX = Math.floor(this.oneHotOffsetX);
    var oneHotX = roundedOffsetX >= Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS;
    var roundedOffsetY = Math.floor(this.oneHotOffsetY);
    var oneHotY = roundedOffsetY >= Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS;
    chunk = this.player.chunk.createParent(oneHotX, oneHotY);
  }
  chunk.sampleChildren();

  this.player.chunk = chunk;

  --this.player.zoom;
};

Game.prototype.zoomIn = function() {
  this.oneHotOffsetX *= 2;
  this.oneHotOffsetX =
      utils.modulo(this.oneHotOffsetX,
                   2 * Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS);
  this.oneHotOffsetY *= 2;
  this.oneHotOffsetY =
      utils.modulo(this.oneHotOffsetY,
                   2 * Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS);

  var childIndex = (this.player.y < this.player.chunk.size / 2 ? 0 : 2)
                   + (this.player.x < this.player.chunk.size / 2 ? 0 : 1);
  if (this.player.x >= this.player.chunk.size / 2) {
    this.player.x -= this.player.chunk.size / 2;
  }
  if (this.player.y >= this.player.chunk.size / 2) {
    this.player.y -= this.player.chunk.size / 2;
  }
  this.player.x *= 2;
  this.player.y *= 2;

  var chunk = this.player.chunk.children[childIndex];
  if (!chunk) {
    chunk = this.player.chunk.createChild(childIndex);
  }
  console.log('sample parent');
  chunk.sampleParent();

  this.player.chunk = chunk;

  ++this.player.zoom;
};

Game.prototype.breakBlock = function() {
  this.setBlock(Math.round(this.player.x / Game.NUM_SUBDIVISIONS),
                Math.round(this.player.y / Game.NUM_SUBDIVISIONS),
                0);
};

Game.prototype.placeBlock = function() {
  this.setBlock(Math.round(this.player.x / Game.NUM_SUBDIVISIONS),
                Math.round(this.player.y / Game.NUM_SUBDIVISIONS),
                3);
};

Game.prototype.setBlock = function(x, y, value) {
  var neighborX = 0;
  var neighborY = 0;
  if (x >= Game.CHUNK_SIZE) {
    neighborX = 1;
    x -= Game.CHUNK_SIZE;
  } else if (x < 0) {
    x += Game.CHUNK_SIZE;
    neighborX = -1;
  }
  if (y >= Game.CHUNK_SIZE) {
    neighborY = 1;
    y -= Game.CHUNK_SIZE;
  } else if (y < 0) {
    y += Game.CHUNK_SIZE;
    neighborY = -1;
  }

  var chunk;
  if (neighborX !== 0 || neighborY !== 0) {
    chunk = this.player.chunk.lookUpNeighbor(neighborX, neighborY);
    if (!chunk) {
      chunk = this.player.chunk.createNeighbor(neighborX, neighborY);
    }
  } else {
    chunk = this.player.chunk;
  }

  for (var i = 0; i < Game.NUM_SUBDIVISIONS; ++i) {
    for (var j = 0; j < Game.NUM_SUBDIVISIONS; ++j) {
      chunk.setBlock(x * Game.NUM_SUBDIVISIONS + j,
                     y * Game.NUM_SUBDIVISIONS + i,
                     value);
    }
  }
};

Game.prototype.checkPlayerOutOfBounds = function() {
  while (this.player.x < 0) {
    var chunk = this.player.chunk.lookUpNeighbor(-1, 0);
    if (!chunk) {
      chunk = this.player.chunk.createNeighbor(-1, 0);
    }
    this.player.chunk = chunk;
    this.player.x += this.player.chunk.size;
  }
  while (this.player.x >= this.player.chunk.size) {
    var chunk = this.player.chunk.lookUpNeighbor(1, 0);
    if (!chunk) {
      chunk = this.player.chunk.createNeighbor(1, 0);
    }
    this.player.chunk = chunk;
    this.player.x -= this.player.chunk.size;
  }

  while (this.player.y < 0) {
    var chunk = this.player.chunk.lookUpNeighbor(0, -1);
    if (!chunk) {
      chunk = this.player.chunk.createNeighbor(0, -1);
    }
    this.player.chunk = chunk;
    this.player.y += this.player.chunk.size;
  }
  while (this.player.y >= this.player.chunk.size) {
    var chunk = this.player.chunk.lookUpNeighbor(0, 1);
    if (!chunk) {
      chunk = this.player.chunk.createNeighbor(0, 1);
    }
    this.player.chunk = chunk;
    this.player.y -= this.player.chunk.size;
  }
};

Game.prototype.enforceRenderDistance = function(chunk, renderDistance,
                                                previousChunk) {
  previousChunk = previousChunk || null;
  if (renderDistance < 1) {
    return;
  }
  --renderDistance;

  for (var neighborY = -1; neighborY <= 1; ++neighborY) {
    for (var neighborX = -1; neighborX <= 1; ++neighborX) {
      if (neighborX === 0 && neighborY === 0) {
        continue;
      }
      var neighbor = chunk.lookUpNeighbor(neighborX, neighborY);
      if (neighbor === previousChunk) {
        continue;
      }
      if (!neighbor) {
        neighbor = chunk.createNeighbor(neighborX, neighborY);
      }
      this.enforceRenderDistance(neighbor, renderDistance, chunk);
    }
  }
};

Game.prototype.initializeWorld = function(chunk) {
  this.generateBlocks(chunk);
  for (var neighborY = -1; neighborY <= 1; ++neighborY) {
    for (var neighborX = -1; neighborX <= 1; ++neighborX) {
      var neighbor = chunk.lookUpNeighbor(neighborX, neighborY);
      if (!neighbor) {
        neighbor = chunk.createNeighbor(neighborX, neighborY);
      }
      this.generateBlocks(neighbor);
    }
  }
};

Game.prototype.generateBlocks = function(chunk) {
  // TODO: This should take into account the current zoom level.
  for (var y = 0; y < chunk.size; ++y) {
    for (var x = 0; x < chunk.size; ++x) {
      var i = y * chunk.size + x;
      var j = x * chunk.size + y;
      var block;
      if (!chunk.oneHotX && !chunk.oneHotY) {
        block = Math.floor(i / Game.NUM_SUBDIVISIONS) % 2 === 0 ? 1 : 0;
      } else if (chunk.oneHotX && !chunk.oneHotY) {
        block = Math.floor(j / Game.NUM_SUBDIVISIONS) % 2 === 0 ? 2 : 0;
      } else if (!chunk.oneHotX && chunk.oneHotY) {
        block = Math.floor(i / Game.NUM_SUBDIVISIONS) % 2 === 0 ? 3 : 0;
      } else if (chunk.oneHotX && chunk.oneHotY) {
        block = Math.floor(j / Game.NUM_SUBDIVISIONS) % 2 === 0 ? 4 : 0;
      }
      chunk.setBlock(x, y, block);
    }
  }
};

Game.prototype.updateLoop = function() {
  this.render();

  requestAnimationFrame(this.updateLoop.bind(this));
};

Game.prototype.update = function() {
  // TODO
  // this.checkPlayerOutOfBounds();
  // this.enforceRenderDistance(this.player.chunk, this.renderDistance);
};

Game.prototype.render = function() {
  this.ctx.fillStyle = '#000';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

  var scale = 200;

  this.ctx.save();
  this.ctx.translate(
      this.canvas.width / 2 - this.player.x * scale / this.player.chunk.size,
      this.canvas.height / 2 - this.player.y * scale / this.player.chunk.size);

  this.renderChunk(this.player.chunk, 0, 0, this.renderDistance, scale);
  this.renderPlayer(this.player, scale);

  this.ctx.restore();

  // console.log('X: ' + this.player.x +
  //             ', Zoom: ' + this.player.zoom);
};

Game.prototype.renderChunk = function(chunk, x, y,
                                      depth, scale, previousChunk) {
  previousChunk = typeof(previousChunk) === 'undefined' ? null : previousChunk;
  if (depth < 0) {
    return;
  }
  if (previousChunk === chunk) {
    return;
  }

  var halfWidth = scale / 2;
  var blockSize = scale / this.player.chunk.size;
  for (var i = 0; i < chunk.size; ++i) {
    for (var j = 0; j < chunk.size; ++j) {
      var block = chunk.blocks[i * chunk.size + j];
      if (block === 0) {
        continue;
      }
      if (block === 1) {
        this.ctx.fillStyle = '#9c5';
      } else if (block === 2) {
        this.ctx.fillStyle = '#46d';
      } else if (block === 3) {
        this.ctx.fillStyle = '#d64';
      } else if (block === 4) {
        this.ctx.fillStyle = '#dc4';
      }

      this.ctx.fillRect(x + j * blockSize, y + i * blockSize,
                        blockSize, blockSize);
    }
  }

  --depth;
  // for (var neighborY = -1; neighborY <= 1; ++neighborY) {
  //   for (var neighborX = -1; neighborX <= 1; ++neighborX) {
  //     if (neighborX === 0 && neighborY === 0) {
  //       continue;
  //     }
  //     var neighbor = chunk.lookUpNeighbor(neighborX, neighborY);
  //     if (neighbor) {
  //       this.renderChunk(neighbor,
  //                        x + neighborX * scale,
  //                        y + neighborY * scale,
  //                        depth,
  //                        scale,
  //                        chunk);
  //     }
  //   }
  // }
};

Game.prototype.renderPlayer = function(player, scale) {
  this.ctx.fillStyle = '#ff0';
  this.ctx.strokeStyle = '#000';
  this.ctx.lineWidth = 1;
  this.ctx.beginPath();
  var x = this.player.x * scale / this.player.chunk.size
          + scale / this.player.chunk.size / 2 * Game.NUM_SUBDIVISIONS;
  var y = this.player.y * scale / this.player.chunk.size
          + scale / this.player.chunk.size / 2 * Game.NUM_SUBDIVISIONS;
  this.ctx.arc(x, y, this.player.size / 2, 0, 2 * Math.PI);
  this.ctx.fill();
  this.ctx.stroke();
};

module.exports = Game;
