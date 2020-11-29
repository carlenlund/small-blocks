var Node = require('./node');

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
var nodeHeight = 20;
var numExtraLayers = 3;
var layerSize = 5;

var player = {
  position: 0,
  zoom: 0,
};

var canvas = document.querySelector('#canvas');
canvas.width = 800;
canvas.height = 600;

var ctx = canvas.getContext('2d');
ctx.fillStyle = '#fff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

var layer0 = createLayer(layerSize);
layer0[0].value = 'yellow';
layer0[1].value = 'red';
layer0[2].value = 'blue';
layer0[3].value = 'green';
layer0[4].value = 'magenta';

// Initialize layers from reference layer 0.
var layers = new Array(1 + 2 * numExtraLayers);
for (var i = 0; i < layers.length; ++i) {
  layers[i] = createLayer(layerSize);
}

updateLayers(layers, layer0, 0);

render();

setTimeout(function() {
  // Update layer 1.
  var layer1 = layers[Math.floor(layers.length / 2) + 1];
  var node0 = layer1[Math.floor(layer1.length / 2)];
  node0.value = 'magenta';
  updateLayers(layers, layer1, 1);
  render();
}, 1000);

function queryLayer(layers, currentLayer, offset) {
  // if (offset === 0) {
  //   return;
  // }
  // 
  // var layer = layers[Math.floor(layers.length / 2) + offset];
  // var centerIndex = Math.floor(layer.length / 2);
  // 
  // if (offset <= -2) {
  //   for (var i = 0; i < layer.length - 1; i += 2) {
  //     if (currentLayer[i].value === currentLayer[i + 1].value) {
  //       layer[i].value = currentLayer[i].value;
  //     }
  //   }
  //   ++offset;
  //   queryLayer(layers, currentLayer, offset) {
  // } else if (offset === -1) {
  //   layer[centerIndex].value = currentLayer[centerIndex].value;
  //   for (var i = 1; i <= centerIndex; ++i) {
  //     if (i <= Math.floor(centerIndex / 2)) {
  //       layer[centerIndex - i].value = currentLayer[centerIndex - i * 2].value;
  //       layer[centerIndex + i].value = currentLayer[centerIndex + i * 2].value;
  //     }
  //   }
  // } else if (offset > 0) {
  //   layer[centerIndex].value = currentLayer[centerIndex].value;
  //   for (var i = 1; i <= centerIndex; ++i) {
  //     layer[centerIndex - i].value = currentLayer[Math.floor(centerIndex - i / Math.pow(2, offset))].value;
  //     layer[centerIndex + i].value = currentLayer[Math.floor(centerIndex + i / Math.pow(2, offset))].value;
  //   }
  // }
}

function updateLayers(layers, layer, offset) {
  var centerIndex = Math.floor(layers.length / 2) + offset;
  layers[centerIndex] = layer;
  // for (var i = -1 + offset; i >= -numExtraLayers; --i) {
  //   queryLayer(layers, layers[centerIndex + i + 1], i);
  // }
  // for (var i = 1 + offset; i <= numExtraLayers; ++i) {
  //   queryLayer(layers, layers[centerIndex + i - 1], i);
  // }
  queryLayer(layers, layers[centerIndex + i + 1], i);
  queryLayer(layers, layers[centerIndex + i - 1], i);
}

function createLayer(size) {
  var layer = new Array(size)
  for (var i = 0; i < size; ++i) {
    layer[i] = new Node('inherit');
  } 
  return layer;
}

function render() {
  var canvasCenterY = canvas.height / 2;
  var layerOffset = nodeHeight * 2.4;
  var centerIndex = Math.floor(layers.length / 2);

  for (var i = 0; i < layers.length; ++i) {
    var y = canvasCenterY - centerIndex * layerOffset + i * layerOffset;
    var scale = Math.pow(2, centerIndex - i);
    renderLayer(layers[i], y, scale);
  }
} 

function renderLayer(layer, y, scale) {
  var canvasCenterX = canvas.width / 2;

  var centerIndex = Math.floor(layer.length / 2);
  var renderDistance = centerIndex;

  for (var i = 0; i < layer.length; ++i) {
    var node = layer[i];
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
