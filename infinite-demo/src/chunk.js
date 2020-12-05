var utils = require('./utils');

function Chunk() {
  this.parent = null;
  this.children = new Array(2);
  for (var i = 0; i < this.children.length; ++i) {
    this.children[i] = null;
  }
  this.neighbors = new Array(2);
  for (var i = 0; i < this.children.length; ++i) {
    this.children[i] = null;
  }

  this.blocks = new Array(Chunk.WIDTH);
  for (var i = 0; i < this.blocks.length; ++i) {
    this.blocks[i] = 0;
  }

  this.dirtyNegative = true;
  this.dirtyPositive = true;
  this.oneHot = false;
}

Chunk.WIDTH = 16;

// start, sampleStart either 0 or Chunk.WIDTH / 2
// end, sampleEnd either Chunk.WIDTH / 2 or Chunk.WIDTH
Chunk.prototype.sample = function(chunk, sampleStart, sampleEnd, start, end) {
  utils.sampleNearestNeighbor(chunk.blocks, sampleStart, sampleEnd,
                              this.blocks, start, end);
};

module.exports = Chunk;
