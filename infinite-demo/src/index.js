var Node = require('./node');
var Layer = require('./layer');

var values = {
  'delete': {
    color: '#ddd',
  },
  'inherit': {
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

var nodeWidth = 40;
var nodeHeight = 40;
var layerSize = 5;

var player = {
  size: 25,
  layer: null,
};

var canvas = document.querySelector('#canvas');
canvas.width = 800;
canvas.height = 600;

var ctx = canvas.getContext('2d');

var layers = [];

// Add origin layer.
var layer0 = new Layer(layerSize);
layer0.nodes[0].value = 'yellow';
layer0.nodes[1].value = 'red';
layer0.nodes[2].value = 'blue';
layer0.nodes[3].value = 'blue';
layer0.nodes[4].value = 'magenta';
layer0.dirtyNegative = true;
layer0.dirtyPositive = true;
layers.push(layer0);

player.layer = layer0;

render();

console.log('Q - Zoom out');
console.log('E - Zoom in');
window.addEventListener('keydown', function(event) {
  if (event.keyCode === 'Q'.charCodeAt(0)) {
    zoomOut();
  }
  if (event.keyCode === 'E'.charCodeAt(0)) {
    zoomIn();
  }
});

for (var i = 1; i <= 3; ++i) {
  setTimeout(function() {
    var layer = layers[0].createNeighborLayer(-1);
    layers.unshift(layer);

    var layer = layers[layers.length - 1].createNeighborLayer(1);
    layers.push(layer);

    render();
  }, i * 150);
}

function zoomOut() {
  if (!player.layer.parent) {
    var layer = layers[0].createNeighborLayer(-1);
    layers.unshift(layer);
  }
  player.layer = player.layer.parent;
  render();
}

function zoomIn() {
  if (!player.layer.child) {
    var layer = layers[layers.length - 1].createNeighborLayer(1);
    layers.push(layer);
  } 
  player.layer = player.layer.child;
  render();
}

function render() {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var canvasCenterX = canvas.width / 2;
  var canvasCenterY = canvas.height / 2;
  var layerOffset = nodeHeight * 3;
  var centerIndex = Math.floor(layers.length / 2);

  // for (var i = 0; i < layers.length; ++i) {
  //   var layer = layers[i];
  //   var layerY = canvasCenterY - centerIndex * layerOffset + i * layerOffset;
  //   // var layerScale = Math.pow(2, centerIndex - i);
  //   var layerScale = 1;
  //   renderLayer(layer, layerY, layerScale);
  // }

  // for (var i = 0; i < layers.length; ++i) {
  //   var layer = layers[i];
  //   var layerY = canvasCenterY - centerIndex * layerOffset + i * layerOffset;
  //   // var layerScale = Math.pow(2, centerIndex - i);
  //   var layerScale = 1;
  //   if (layer === player.layer) {
  //     var playerX = canvasCenterX;
  //     var playerY = layerY;
  //     var playerSize = nodeHeight;
  //     renderPlayer(playerX, playerY, playerSize);
  //   }
  // }

  var layer = player.layer;
  var layerY = canvasCenterY - centerIndex;
  var layerScale = 1;
  renderLayer(layer, layerY, layerScale);

  var playerX = canvasCenterX;
  var playerY = layerY - nodeHeight / 2;
  var playerSize = player.size;
  renderPlayer(playerX, playerY, playerSize);
} 

function renderLayer(layer, y, scale) {
  var canvasCenterX = canvas.width / 2;

  var centerIndex = Math.floor(layer.nodes.length / 2);
  var renderDistance = centerIndex;

  for (var i = 0; i < layer.nodes.length; ++i) {
    var node = layer.nodes[i];
    var x = canvasCenterX - renderDistance * nodeWidth * scale + i * nodeWidth * scale;
    var value = values[node.value];
    var color = value.color;
    if (color === null) {
      ctx.fillStyle = '#000';
    } else {
      ctx.fillStyle = color;
    }
    ctx.fillRect(x - nodeWidth / 2,
                 y - nodeHeight / 2,
                 nodeWidth * scale,
                 nodeHeight);
  }
}

function renderPlayer(x, y, size) {
  ctx.fillStyle = values['yellow'].color;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.2 * size;
  ctx.beginPath();
  ctx.arc(x, y - size / 2, size / 2, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
}
