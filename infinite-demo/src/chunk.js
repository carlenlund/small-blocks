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

Chunk.WIDTH = 16;

Chunk.prototype.setBlock = function(x, block) {
  if (x < 0 || x >= Chunk.WIDTH) {
    throw new Error('Chunk index ' + x + ' out of bounds');
  }
  this.blocks[x] = block;
  this.dirtyNegative[x] = true;
  this.dirtyPositive[x] = true;
};

Chunk.prototype.createChild = function(index) {
  var chunk = new Chunk();
  chunk.oneHot = index === 1;
  this.children[index] = chunk;
  chunk.parent = this;
  return chunk;
};

Chunk.prototype.createNeighbor = function(index) {
  var chunk = new Chunk();
  chunk.oneHot = !this.oneHot;
  this.neighbors[index] = chunk;
  chunk.neighbors[Chunk.getOppositeNeighborIndex(index)] = this;
  return chunk;
};

Chunk.getOppositeNeighborIndex = function(index) {
  switch (index) {
    case 0: return 1;
    case 1: return 0;
  };
};

// FIXME: Assumes that the neighbor can be found by searching via parent nodes.
// It might as well be found by traversing child nodes.
Chunk.prototype.lookUpNeighbor = function(index, isParent, childOneHot) {
  isParent = typeof(isParent) === 'undefined' ? false : isParent;
  childOneHot = typeof(childOneHot) === 'undefined' ? false : childOneHot;

  if (isParent &&
    ((childOneHot && index === 0) ||
      (!childOneHot && index === 1))) {
    // TODO: Should sample from children as well, but prioritize parent.
    this.sampleParent();
    return this;
  }
  if (this.neighbors[index]) {
    var neighbor = this.neighbors[index];
    // TODO: Should sample from children as well, but prioritize parent.
    neighbor.sampleParent();
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
    parentNeighborChild = parentNeighbor.createChild(parentNeighborChildIndex);
  }
  // TODO: Should sample from children as well, but prioritize parent.
  parentNeighborChild.sampleParent();

  this.neighbors[index] = parentNeighborChild;
  parentNeighborChild[Chunk.getOppositeNeighborIndex(index)] = this;

  return parentNeighborChild;
};

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

Chunk.prototype.sampleParent = function() {
  if (!this.parent) {
    return;
  }

  var sampleStart;
  var sampleEnd;
  if (this.oneHot) {
    sampleStart = Chunk.WIDTH / 2;
    sampleEnd = Chunk.WIDTH;
  } else {
    sampleStart = 0;
    sampleEnd = Chunk.WIDTH / 2;
  }
  this.sampleDirtyPositive(this.parent, sampleStart, sampleEnd, 0, Chunk.WIDTH);

  this.setDirtyNegative(0, Chunk.WIDTH, false);
  this.parent.setDirtyPositive(sampleStart, sampleEnd, false);
};

Chunk.prototype.sampleDirtyNegative = function(chunk, sampleStart, sampleEnd,
  start, end) {
  var sampleWidth = (sampleEnd - sampleStart) / (end - start);
  for (var i = start; i < end; ++i) {
    var index = sampleStart + Math.floor(i * sampleWidth);
    if (sampleWidth === 2) {
      if (chunk.dirtyNegative[index] ||
          chunk.dirtyNegative[index + 1]) {
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

Chunk.prototype.sampleDirtyPositive = function(chunk, sampleStart, sampleEnd,
                                               start, end) {
  var sampleWidth = (sampleEnd - sampleStart) / (end - start);
  for (var i = start; i < end; ++i) {
    var index = sampleStart + Math.floor(i * sampleWidth);
    if (sampleWidth === 2) {
      if (chunk.dirtyPositive[index] ||
          chunk.dirtyPositive[index + 1]) {
        if (chunk.blocks[index] === chunk.blocks[index + 1]) {
          this.setBlock(i, chunk.blocks[index]);
        } else {
          this.setBlock(i, 0);
        }
      }
    } else if (this.parent.dirtyPositive[index]) {
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
