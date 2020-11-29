var Node = require('./node');

function Layer(size) {
  this.parent = null;
  this.child = null;

  this.nodes = new Array(size);
  for (var i = 0; i < this.nodes.length; ++i) {
    this.nodes[i] = new Node('inherit');
  } 

  this.dirtyNegative = false;
  this.dirtyPositive = false;
}

Layer.prototype.createNeighborLayer = function(offset) {
  if (offset !== 1 && offset !== -1) {
    throw new Error('Invalid layer offset ' + offset);
  }

  var layer = new Layer(this.nodes.length);
  
  var centerIndex = Math.floor(this.nodes.length / 2);
  
  if (offset === -1) {
    this.parent = layer;
    layer.child = this;
    for (var i = 0; i < this.nodes.length - 1; i += 2) {
      if (this.nodes[i].value === this.nodes[i + 1].value) {
        layer.nodes[i].value = this.nodes[i].value;
      }
    }
    layer.dirtyNegative = true;
    this.dirtyNegative = false;
  } else if (offset === 1) {
    this.child = layer;
    layer.parent = this;
    layer.nodes[centerIndex].value = this.nodes[centerIndex].value;
    for (var i = 1; i <= centerIndex; ++i) {
      layer.nodes[centerIndex - i].value = this.nodes[Math.floor(centerIndex - i / Math.pow(2, offset))].value;
      layer.nodes[centerIndex + i].value = this.nodes[Math.floor(centerIndex + i / Math.pow(2, offset))].value;
    }
    this.dirtyPositive = false;
  }

  return layer;
};

module.exports = Layer;
