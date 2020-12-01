var openSimplexNoise = require('open-simplex-noise');

var Node = require('./node');
var Layer = require('./layer');
var utils = require('./utils');

var values = {
  'none': {
    color: '#000',
  },
  'red': {
    color: '#fa5634',
  },
  'green': {
    color: '#59d444',
  },
  'blue': {
    color: '#3791ff',
  },
  'yellow': {
    color: '#fade37',
  },
  'magenta': {
    color: '#b729e6',
  },
};

var nodeWidth = 4;
var nodeHeight = 400;
var layerSize = 151;
var playerSize = 16;

var canvas = document.querySelector('#canvas');
canvas.width = 800;
canvas.height = 600;

var ctx = canvas.getContext('2d');

var noise2d = openSimplexNoise.makeNoise2D(Date.now());

var player = {
  size: playerSize,
  layer: null,
  zoom: 0,
  x: 0,
};
window.player = player;  // For debugging

var layers = [];

// Initialize world.
var layer = new Layer(layerSize);
for (var i = 0; i < layerSize; ++i) {
  layer.nodes[i] = new Node('none');
}
layers.push(layer);
player.layer = layer;
loadWorld();

render();

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
});

function getChunkPosition(x) {
  return Math.floor((x + layerSize / 2) / layerSize);
}

function moveLeft() {
  --player.x;
  player.x = Math.ceil(player.x);

  var x = utils.modulo(player.x + 1 + layerSize / 2, layerSize) - layerSize / 2 - 1;
  if (x < -Math.floor(layerSize / 2)) {
    loadWorld();
  }

  render();
}

function moveRight() {
  ++player.x;
  player.x = Math.floor(player.x);

  var x = utils.modulo(player.x - 1 + layerSize / 2, layerSize) - layerSize / 2 + 1;
  if (x > Math.floor(layerSize / 2)) {
    loadWorld();
  }

  render();
}

function zoomOut() {
  --player.zoom;
  player.x = player.x / 2;

  if (!player.layer.parent) {
    var layer = new Layer(layerSize);
    for (var i = 0; i < layerSize; ++i) {
      layer.nodes[i] = new Node('none');
    }
    generateWorld(layer, player.zoom, player.x);
    player.layer.parent = layer;
    layer.child = player.layer;
    layer.updateFromChildLayer(player.layer);
    layers.unshift(layer);
  }
  if (player.layer.dirtyNegative) {
    var parent = player.layer.parent.parent;
    var child = player.layer;
    player.layer.parent.updateFromChildLayer(child);
    player.layer.parent.parent = parent;
    player.layer.parent.child = child;
  }
  player.layer = player.layer.parent;

  loadWorld();

  render();
}

function zoomIn() {
  ++player.zoom;
  player.x *= 2;

  if (!player.layer.child) {
    var layer = new Layer(layerSize);
    for (var i = 0; i < layerSize; ++i) {
      layer.nodes[i] = new Node('none');
    }
    player.layer.child = layer;
    layer.parent = player.layer;
    layer.updateFromParentLayer(player.layer);

    layers.push(layer);
  }
  if (player.layer.dirtyPositive) {
    var parent = player.layer;
    var child = player.layer.child.child;
    player.layer.child.updateFromParentLayer(parent);
    player.layer.child.parent = parent;
    player.layer.child.child = child;
  }
  player.layer = player.layer.child;

  loadWorld();

  render();
}

function placeBlock() {
  var layer = player.layer;
  var playerX = utils.modulo(player.x + layerSize / 2, layerSize) - layerSize / 2;
  layer.nodes[Math.floor(layer.nodes.length / 2 + playerX)].value = 'red';
  layer.dirtyNegative = true;
  layer.dirtyPositive = true;
  render();
}

function breakBlock() {
  var layer = player.layer;
  var playerX = utils.modulo(player.x + layerSize / 2, layerSize) - layerSize / 2;
  layer.nodes[Math.floor(layer.nodes.length / 2 + playerX)].value = 'none';
  layer.dirtyNegative = true;
  layer.dirtyPositive = true;
  render();
}

function loadWorld() {
  var layer = player.layer;
  for (var i = 0; i < layerSize; ++i) {
    layer.nodes[i] = new Node('none');
  }
  generateWorld(layer, player.zoom, player.x);
}

function generateWorld(layer, zoom, x) {
  var colorNames = [
    'magenta',
    'blue',
    'yellow',
    'green',
    'red',
  ];

  var chunkX = getChunkPosition(x);

  for (var i = 0; i < layer.nodes.length; ++i) {
    var noise = 0;
    noise += 0.8 * (noise2d(0.05 * (i - Math.floor(layerSize / 2) + chunkX * layerSize) * Math.pow(2, -zoom), 0) + 1) / 2;
    noise += 0.4 * (noise2d(0.5 * (i - Math.floor(layerSize / 2) + chunkX * layerSize) * Math.pow(2, -zoom), 1) + 1) / 2;
    noise -= 0.1;
    noise = Math.min(0.9999999999, Math.max(0, noise));
    var colorName = colorNames[Math.floor(noise * colorNames.length)];
    layer.nodes[i].value = colorName;
  }
  layer.dirtyNegative = true;
  layer.dirtyPositive = true;
}

function render() {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var canvasCenterX = canvas.width / 2;
  var canvasCenterY = canvas.height / 2;
  var layerOffset = nodeHeight * 3;
  var centerIndex = Math.floor(layers.length / 2);

  var layer = player.layer;
  var layerY = canvasCenterY;
  var layerScale = 1;
  renderLayer(layer, layerY, layerScale, player.x);

  var playerX = canvasCenterX;
  var playerY = layerY - nodeHeight / 2;
  var playerSize = player.size;
  renderPlayer(playerX, playerY, playerSize);
}

function renderLayer(layer, y, scale, playerX) {
  playerX = utils.modulo(playerX + layerSize / 2, layerSize) - layerSize / 2;
  var canvasCenterX = canvas.width / 2;
  var centerIndex = Math.floor(layer.nodes.length / 2);
  var renderDistance = centerIndex;

  for (var i = 0; i < layer.nodes.length; ++i) {
    var node = layer.nodes[i];
    var x = canvasCenterX
        - renderDistance * nodeWidth * scale
        + i * nodeWidth * scale
        - playerX * nodeWidth;
    var value = values[node.value];
    var color = value.color;
    if (color === null) {
      ctx.fillStyle = '#000';
    } else {
      ctx.fillStyle = color;
    }
    ctx.fillRect(Math.floor(x - nodeWidth / 2),
                 Math.floor(y - nodeHeight / 2),
                 Math.floor(nodeWidth * scale),
                 Math.floor(nodeHeight));
  }
}

function renderPlayer(x, y, size) {
  ctx.fillStyle = values['yellow'].color;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.15 * size;
  ctx.beginPath();
  ctx.arc(x, y - size / 2, size / 2, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
}
