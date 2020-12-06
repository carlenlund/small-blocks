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
  this.dirtyNegative = new Array(Chunk.WIDTH);
  this.dirtyPositive = new Array(Chunk.WIDTH);
  for (var i = 0; i < Chunk.WIDTH; ++i) {
    this.setBlock(i, 0);
  }

  this.oneHot = false;
}

Chunk.WIDTH = 8;

Chunk.prototype.setBlock = function(x, block) {
  if (x < 0 || x >= Chunk.WIDTH) {
    throw new Error('Chunk index ' + x + ' out of bounds');
  }
  this.blocks[x] = block;
  this.dirtyNegative[x] = true;
  this.dirtyPositive[x] = true;
};

// FIXME: Assumes that the neighbor can be found by searching via parent nodes.
// It might as well be found by traversing child nodes.
Chunk.prototype.lookUpNeighbor = function(index, isParent, childOneHot) {
  isParent = typeof(isParent) === 'undefined' ? false : isParent;
  childOneHot = typeof(childOneHot) === 'undefined' ? false : childOneHot;

  if (isParent &&
      ((childOneHot && index === 0) ||
       (!childOneHot && index === 1))) {
    if (this.parent) {
      // Resample from parent in case blocks have changed in the parent.
      // TODO: Should sample from children as well, but prioritize parent.
      if (this.oneHot) {
        this.sampleDirtyPositive(this.parent,
                                 Chunk.WIDTH / 2, Chunk.WIDTH,
                                 0, Chunk.WIDTH);
      } else {
        this.sampleDirtyPositive(this.parent,
                                 0, Chunk.WIDTH / 2,
                                 0, Chunk.WIDTH);
      }
      this.setDirtyNegative(0, Chunk.WIDTH, false);
      if (this.oneHot) {
        this.parent.setDirtyPositive(Chunk.WIDTH / 2, Chunk.WIDTH, false);
      } else {
        this.parent.setDirtyPositive(0, Chunk.WIDTH / 2, false);
      }
    }

    return this;
  }
  if (this.neighbors[index]) {
    var neighbor = this.neighbors[index];

    if (neighbor.parent) {
      // Resample from parent in case blocks have changed in the parent.
      // TODO: Should sample from children as well, but prioritize parent.
      if (neighbor.oneHot) {
        neighbor.sampleDirtyPositive(neighbor.parent,
                                     Chunk.WIDTH / 2, Chunk.WIDTH,
                                     0, Chunk.WIDTH);
      } else {
        neighbor.sampleDirtyPositive(neighbor.parent,
                                     0, Chunk.WIDTH / 2,
                                     0, Chunk.WIDTH);
      }
      neighbor.setDirtyNegative(0, Chunk.WIDTH, false);
      if (neighbor.oneHot) {
        neighbor.parent.setDirtyPositive(Chunk.WIDTH / 2, Chunk.WIDTH, false);
      } else {
        neighbor.parent.setDirtyPositive(0, Chunk.WIDTH / 2, false);
      }
    }

    return neighbor;
  }
  if (!this.parent) {
    return null;
  }
  
  var parentNeighbor = this.parent.lookUpNeighbor(index, true, this.oneHot);
  if (!parentNeighbor) {
    return null;
  }

  var parentNeighborChildIndex;
  if ((this.oneHot && index === 0) ||
      (!this.oneHot && index === 1)) {
    // Use same index, since we have the same parent as the target chunk.
    parentNeighborChildIndex = index;
  } else {
    // Use index in opposite direction to move towards target chunk.
    parentNeighborChildIndex = index === 0 ? 1 : 0;
  }

  var parentNeighborChild = parentNeighbor.children[parentNeighborChildIndex];

  if (!parentNeighborChild) {
    parentNeighborChild = new Chunk();
    parentNeighborChild.oneHot = parentNeighborChildIndex === 1;
    parentNeighbor.children[parentNeighborChildIndex] = parentNeighborChild;
    parentNeighborChild.parent = parentNeighbor;
  }

  // Resample from parent in case blocks have changed in the parent.
  // TODO: Should sample from children as well, but prioritize parent.
  if (parentNeighborChild.oneHot) {
    parentNeighborChild.sampleDirtyPositive(parentNeighbor,
                                            Chunk.WIDTH / 2, Chunk.WIDTH,
                                            0, Chunk.WIDTH);
  } else {
    parentNeighborChild.sampleDirtyPositive(parentNeighbor,
                                            0, Chunk.WIDTH / 2,
                                            0, Chunk.WIDTH);
  }
  parentNeighborChild.setDirtyNegative(0, Chunk.WIDTH, false);
  if (parentNeighborChild.oneHot) {
    parentNeighbor.setDirtyPositive(Chunk.WIDTH / 2, Chunk.WIDTH, false);
  } else {
    parentNeighbor.setDirtyPositive(0, Chunk.WIDTH / 2, false);
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

// start, sampleStart are either 0 or Chunk.WIDTH / 2
// end, sampleEnd are either Chunk.WIDTH / 2 or Chunk.WIDTH
Chunk.prototype.sample = function(chunk, sampleStart, sampleEnd, start, end) {
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
// Parameters same as Chunk.prototype.sample().
Chunk.prototype.sampleDirtyNegative = function(chunk, sampleStart, sampleEnd,
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
// Parameters same as Chunk.prototype.sample().
Chunk.prototype.sampleDirtyPositive = function(chunk, sampleStart, sampleEnd,
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

Chunk.prototype.isDirtyNegative = function(start, end) {
  for (var i = start; i < end; ++i) {
    if (this.dirtyNegative[i]) {
      return true;
    }
  }
  return false;
};

Chunk.prototype.setDirtyNegative = function(start, end, value) {
  for (var i = start; i < end; ++i) {
    this.dirtyNegative[i] = value;
  }
};

Chunk.prototype.isDirtyPositive = function(start, end) {
  for (var i = start; i < end; ++i) {
    if (this.dirtyPositive[i]) {
      return true;
    }
  }
  return false;
};

Chunk.prototype.setDirtyPositive = function(start, end, value) {
  for (var i = start; i < end; ++i) {
    this.dirtyPositive[i] = value;
  }
};

module.exports = Chunk;
