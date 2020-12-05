var utils = require('./utils');
window.utils = utils;
var Chunk = require('./chunk');

var canvas;
var ctx;
var world;
var player;

initialize();
run();

function Player() {
  this.size = 10;
  this.speed = 1;
  this.chunk = null;
  this.x = 0;
}

function initialize() {
  canvas = document.querySelector('#canvas');
  canvas.width = 600;
  canvas.height = 400;

  ctx = canvas.getContext('2d');

  world = new Chunk();
  generateBlocks(world);

  player = new Player();
  player.chunk = world;
  window.player = player;  // For debugging

  window.addEventListener('keydown', function(event) {
    if (event.keyCode === 'A'.charCodeAt(0)) {
      moveLeft();
    }
    if (event.keyCode === 'D'.charCodeAt(0)) {
      moveRight();
    }
    if (event.keyCode === 'Q'.charCodeAt(0)) {
      zoomOut();
    }
    if (event.keyCode === 'E'.charCodeAt(0)) {
      zoomIn();
    }
    if (event.keyCode === 'F'.charCodeAt(0)) {
      placeBlock();
    }
    if (event.keyCode === 'G'.charCodeAt(0)) {
      breakBlock();
    }

    render();
  });
}

function run() {
  render();
}

function moveLeft() {
  player.x -= player.speed;
  player.x = Math.ceil(player.x);

  checkPlayerOutOfBounds();
}

function moveRight() {
  player.x += player.speed;
  player.x = Math.floor(player.x);

  checkPlayerOutOfBounds();
}

function zoomOut() {
  player.x /= 2;
  if (player.chunk.oneHot) {
    player.x += player.chunk.oneHot * Math.floor(Chunk.WIDTH / 2);
  }

  var chunk;
  if (player.chunk.parent) {
    chunk = player.chunk.parent;
  } else {
    chunk = new Chunk();
    player.chunk.parent = chunk;
    chunk.children[player.chunk.oneHot ? 1 : 0] = player.chunk;
  }

  console.log(chunk);

  if (player.chunk.dirtyNegative) {
    if (player.chunk.oneHot) {
      chunk.sample(player.chunk,
                   0, Chunk.WIDTH,
                   Math.floor(Chunk.WIDTH / 2), Chunk.WIDTH);
    } else {
      chunk.sample(player.chunk,
                   0, Chunk.WIDTH,
                   0, Math.floor(Chunk.WIDTH / 2));
    }
    chunk.dirtyNegative = true;
    chunk.dirtyPositive = false;
    player.chunk.dirtyNegative = false;
  }

  player.chunk = chunk;

  checkPlayerOutOfBounds();
}

function zoomIn() {
  var childIndex = player.x < Math.floor(Chunk.WIDTH / 2) ? 0 : 1;

  player.x *= 2;

  var chunk;
  if (player.chunk.children[childIndex]) {
    chunk = player.chunk.children[childIndex];
  } else {
    chunk = new Chunk();
    player.chunk.children[childIndex] = chunk;
    chunk.parent = player.chunk;
  }

  if (player.chunk.dirtyPositive) {
    chunk.sample(player.chunk,
                 0, Math.floor(Chunk.WIDTH / 2),
                 0, Chunk.WIDTH);
    chunk.dirtyPositive = true;
    chunk.dirtyNegative = false;
    // TODO: Below should be specific for each child.
    player.chunk.dirtyPositive = false;
  }

  player.chunk = chunk;

  checkPlayerOutOfBounds();
}

function placeBlock() {
}

function breakBlock() {
}

function checkPlayerOutOfBounds() {
  while (player.x < 0) {
    if (!player.chunk.neighbors[0]) {
      var chunk = new Chunk();
      chunk.oneHot = !player.chunk.oneHot;
      player.chunk.neighbors[0] = chunk;
      chunk.neighbors[1] = player.chunk;

      generateBlocks(chunk);
    }

    player.chunk = player.chunk.neighbors[0];

    player.x += Chunk.WIDTH;
  }

  while (player.x >= Chunk.WIDTH) {
    if (!player.chunk.neighbors[1]) {
      var chunk = new Chunk();
      chunk.oneHot = !player.chunk.oneHot;
      player.chunk.neighbors[1] = chunk;
      chunk.neighbors[0] = player.chunk;

      generateBlocks(chunk);
    }

    player.chunk = player.chunk.neighbors[1];

    player.x -= Chunk.WIDTH;
  }
}

function render() {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var scale = 250;
  renderChunk(player.chunk, canvas.width / 2, 1, scale);

  renderPlayer(player, scale);
}

function renderChunk(chunk, x, depth, scale) {
  if (depth === 0) {
    return;
  }

  var halfWidth = scale / 2;
  var blockSize = scale / Chunk.WIDTH;
  for (var i = 0; i < chunk.blocks.length; ++i) {
    if (chunk.blocks[i] === 0) {
      ctx.fillStyle = '#eee';
    } else if (chunk.blocks[i] === 1) {
      ctx.fillStyle = '#000';
    }

    ctx.fillRect(x + i * blockSize - halfWidth, 0,
                 blockSize, canvas.height);
  }

  --depth;
  if (chunk.neighbors[0]) {
    renderChunk(chunk.neighbors[0],
                x - Chunk.WIDTH / 2 * scale, 
                depth,
                scale);
  }
  if (chunk.neighbors[1]) {
    renderChunk(chunk.neighbors[1],
                x + Chunk.WIDTH / 2 * scale, 
                depth,
                scale);
  }
}

function renderPlayer(player, scale) {
  ctx.fillStyle = '#ff0';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1,
  ctx.beginPath();
  var x = canvas.width / 2 - scale / 2 + player.x * scale / Chunk.WIDTH
      + scale / Chunk.WIDTH / 2;
  ctx.arc(x, 0.1 * canvas.height, player.size / 2, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
}

function generateBlocks(chunk) {
  for (var i = 0; i < chunk.blocks.length; ++i) {
    if (chunk.oneHot) {
      chunk.blocks[i] = Math.floor(i / 2) % 2 === 0 ? 1 : 0;
    } else {
      chunk.blocks[i] = i % 2 === 0 ? 1 : 0;
    }
  }
}
