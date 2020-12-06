function Chunk2() {
  throw new Error('Chunk2 not implemented yet');

  this.parent = null;
  this.children = new Array(2);
  for (var i = 0; i < this.children.length; ++i) {
    this.children[i] = null;
  }
  this.neighbors = new Array(2);
  for (var i = 0; i < this.children.length; ++i) {
    this.children[i] = null;
  }

  this.blocks = new Array(Chunk2.WIDTH);
  this.dirtyNegative = new Array(Chunk2.WIDTH);
  this.dirtyPositive = new Array(Chunk2.WIDTH);
  for (var i = 0; i < Chunk2.WIDTH; ++i) {
    this.setBlock(i, 0);
  }

  this.oneHot = false;
}

Chunk2.WIDTH = 8;

Chunk2.prototype.setBlock = function(x, block) {
  if (x < 0 || x >= Chunk2.WIDTH) {
    throw new Error('Chunk index ' + x + ' out of bounds');
  }
  this.blocks[x] = block;
  this.dirtyNegative[x] = true;
  this.dirtyPositive[x] = true;
};

// FIXME: Assumes that the neighbor can be found by searching via parent nodes.
// It might as well be found by traversing child nodes.
Chunk2.prototype.lookUpNeighbor = function(index, isParent, childOneHot) {
  if (isParent &&
      ((childOneHot && index === 0) ||
       (!childOneHot && index === 1))) {
    return this;
  }
  if (this.neighbors[index]) {
    return this.neighbors[index];
  }
  if (!this.parent) {
    return null;
  }
  
  var parentNeighbor = this.parent.lookUpNeighbor(index, true, this.oneHot);
  if (!parentNeighbor) {
    return null;
  }

  var parentNeighborChildIndex;
  var parentNeighborChild;
  if ((this.oneHot && index === 0) ||
      (!this.oneHot && index === 1)) {
    // Use same index, since we have the same parent as the target chunk.
    parentNeighborChildIndex = index;
    parentNeighbor.children[parentNeighborChildIndex];
  } else {
    // Use index in opposite direction to move towards target chunk.
    parentNeighborChildIndex = index === 0 ? 1 : 0;
    parentNeighborChild = parentNeighbor.children[parentNeighborChildIndex];
  }

  if (!parentNeighborChild) {
    parentNeighborChild = new Chunk();
    parentNeighborChild.oneHot = parentNeighborChildIndex === 1;
    parentNeighbor.children[parentNeighborChildIndex] = parentNeighborChild;
    parentNeighborChild.parent = parentNeighbor;
    if (parentNeighborChild.oneHot) {
      parentNeighborChild.sampleDirtyPositive(parentNeighbor,
                                              Chunk2.WIDTH / 2, Chunk2.WIDTH,
                                              0, Chunk2.WIDTH);
    } else {
      parentNeighborChild.sampleDirtyPositive(parentNeighbor,
                                              0, Chunk2.WIDTH / 2,
                                              0, Chunk2.WIDTH);
    }
    parentNeighborChild.setDirtyNegative(0, Chunk2.WIDTH, false);
    if (parentNeighborChild.oneHot) {
      parentNeighbor.setDirtyPositive(Chunk2.WIDTH / 2, Chunk2.WIDTH, false);
    } else {
      parentNeighbor.setDirtyPositive(0, Chunk2.WIDTH / 2, false);
    }
  }

  if (index === 0) {
    this.neighbors[0] = parentNeighborChild;
    parentNeighborChild.neighbors[1] = this;
  } else {
    this.neighbors[1] = parentNeighborChild;
    parentNeighborChild.neighbors[0] = this;
  }

  return parentNeighborChild;
};

// start, sampleStart are either 0 or Chunk2.WIDTH / 2
// end, sampleEnd are either Chunk2.WIDTH / 2 or Chunk2.WIDTH
Chunk2.prototype.sample = function(chunk, sampleStart, sampleEnd, start, end) {
  var sampleWidth = (sampleEnd - sampleStart) / (end - start);
  for (var i = start; i < end; ++i) {
    var index = sampleStart + Math.floor(i * sampleWidth);
    if (sampleWidth === 2) {
      if (chunk.blocks[index] === chunk.blocks[index + 1]) {
        this.setBlock(i, chunk.blocks[index]);
      } else {
        this.setBlock(i, 0);
      }
    } else {
      this.setBlock(i, chunk.blocks[index]);
    }
  }
};

// Samples only blocks marked as dirty negative.
// Parameters same as Chunk2.prototype.sample().
Chunk2.prototype.sampleDirtyNegative = function(chunk, sampleStart, sampleEnd,
                                               start, end) {
  var sampleWidth = (sampleEnd - sampleStart) / (end - start);
  for (var i = start; i < end; ++i) {
    var index = sampleStart + Math.floor(i * sampleWidth);
    if (sampleWidth === 2) {
      if (chunk.dirtyNegative[index] || chunk.dirtyNegative[index + 1]) {
        if (chunk.blocks[index] === chunk.blocks[index + 1]) {
          this.setBlock(i, chunk.blocks[index]);
        } else {
          this.setBlock(i, 0);
        }
      }
    } else if (chunk.dirtyNegative[index]) {
      this.setBlock(i, chunk.blocks[index]);
    }
  }
};

// Samples only blocks marked as dirty positive.
// Parameters same as Chunk2.prototype.sample().
Chunk2.prototype.sampleDirtyPositive = function(chunk, sampleStart, sampleEnd,
                                               start, end) {
  var sampleWidth = (sampleEnd - sampleStart) / (end - start);
  for (var i = start; i < end; ++i) {
    var index = sampleStart + Math.floor(i * sampleWidth);
    if (sampleWidth === 2) {
      if (chunk.dirtyPositive[index] || chunk.dirtyPositive[index + 1]) {
        if (chunk.blocks[index] === chunk.blocks[index + 1]) {
          this.setBlock(i, chunk.blocks[index]);
        } else {
          this.setBlock(i, 0);
        }
      }
    } else if (chunk.dirtyPositive[index]) {
      this.setBlock(i, chunk.blocks[index]);
    }
  }
};

Chunk2.prototype.isDirtyNegative = function(start, end) {
  for (var i = start; i < end; ++i) {
    if (this.dirtyNegative[i]) {
      return true;
    }
  }
  return false;
};

Chunk2.prototype.setDirtyNegative = function(start, end, value) {
  for (var i = start; i < end; ++i) {
    this.dirtyNegative[i] = value;
  }
};

Chunk2.prototype.isDirtyPositive = function(start, end) {
  for (var i = start; i < end; ++i) {
    if (this.dirtyPositive[i]) {
      return true;
    }
  }
  return false;
};

Chunk2.prototype.setDirtyPositive = function(start, end, value) {
  for (var i = start; i < end; ++i) {
    this.dirtyPositive[i] = value;
  }
};

module.exports = Chunk2;
