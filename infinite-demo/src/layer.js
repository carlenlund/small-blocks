var Node = require('./node');

function Layer(size) {
  this.parent = null;
  this.child = null;
  this.nodes = new Array(size);
  this.dirtyNegative = false;
  this.dirtyPositive = false;
}

Layer.prototype.updateFromChildLayer = function(layer) {
  var centerIndex = Math.floor(this.nodes.length / 2);
  for (var i = 1; i <= centerIndex; ++i) {
    this.nodes[centerIndex + Math.floor(i / 2)].value =
        layer.nodes[centerIndex + i].value;
    this.nodes[centerIndex - Math.floor(i / 2)].value =
        layer.nodes[centerIndex - i].value;
  }
  layer.dirtyNegative = false;
  this.dirtyNegative = true;
  this.dirtyPositive = false;
};

Layer.prototype.updateFromParentLayer = function(layer) {
  var centerIndex = Math.floor(this.nodes.length / 2);
  this.nodes[centerIndex].value = layer.nodes[centerIndex].value;
  for (var i = 1; i <= centerIndex; ++i) {
    this.nodes[centerIndex - i].value =
        layer.nodes[centerIndex - Math.floor(i / 2)].value;
    this.nodes[centerIndex + i].value =
        layer.nodes[centerIndex + Math.floor(i / 2)].value;
  }
  layer.dirtyPositive = false;
  this.dirtyPositive = true;
  this.dirtyNegative = false;
};

module.exports = Layer;
