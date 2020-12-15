// Size is a multiple of 2.
function Chunk2(size) {
  this.parent = null;
  this.children = new Array(2);
  for (var i = 0; i < this.children.length; ++i) {
    this.children[i] = null;
  }
  this.neighbors = new Array(2);
  for (var i = 0; i < this.children.length; ++i) {
    this.children[i] = null;
  }

  this.size = size;
  this.blocks = new Array(this.size);
  this.dirtyNegative = new Array(this.size);
  this.dirtyPositive = new Array(this.size);
  for (var i = 0; i < this.size; ++i) {
    this.setBlock(i, 0);
  }

  this.oneHot = false;
}

Chunk2.prototype.setBlock = function(x, block, keepDirty) {
  if (keepDirty && (this.dirtyNegative[x] || this.dirtyPositive[x])) {
    return;
  }
  this.blocks[x] = block;
  this.dirtyNegative[x] = true;
  this.dirtyPositive[x] = true;
};

Chunk2.prototype.createParent = function(oneHot) {
  var chunk = new Chunk2(this.size);
  chunk.oneHot = oneHot;
  this.parent = chunk;
  var index1 = this.oneHot ? 1 : 0;
  chunk.children[index1] = this;
  var index2 = Chunk2.getOppositeNeighborIndex(index1);
  chunk.children[index2] = this.lookUpNeighbor(index2);
  return chunk;
};

Chunk2.prototype.createChild = function(index) {
  var chunk = new Chunk2(this.size);
  chunk.oneHot = index === 1;
  this.children[index] = chunk;
  chunk.parent = this;
  return chunk;
};

Chunk2.prototype.createNeighbor = function(index) {
  var chunk = new Chunk2(this.size);
  chunk.oneHot = !this.oneHot;
  this.neighbors[index] = chunk;
  chunk.neighbors[Chunk2.getOppositeNeighborIndex(index)] = this;
  return chunk;
};

Chunk2.getOppositeNeighborIndex = function(index) {
  switch (index) {
    case 0: return 1;
    case 1: return 0;
  };
};

// isParent and childOneHot used only for finding parent neighbor children.
Chunk2.prototype.lookUpNeighbor = function(index, isParent, childOneHot, isChild) {
  isParent = typeof(isParent) === 'undefined' ? false : isParent;
  childOneHot = typeof(childOneHot) === 'undefined' ? false : childOneHot;

  if (isParent &&
      ((!childOneHot && index === 1) ||
       (childOneHot && index === 0))) {
    this.sampleChildren(false);
    this.sampleParent(false);
    return this;
  }
  if (this.neighbors[index]) {
    var neighbor = this.neighbors[index];
    // Resample parents last to overwrite child changes.
    neighbor.sampleChildren(true);
    neighbor.sampleParent(true);
    return neighbor;
  }

  // Find neighbor indirectly through parent.
  if (this.parent && !isChild) {
    var parentNeighbor = this.parent.lookUpNeighbor(index, true, this.oneHot,
                                                    false);
    if (!parentNeighbor) {
      return null;
    }

    var parentNeighborChildIndex;
    if ((!this.oneHot && index === 1) ||
        (this.oneHot && index === 0)) {
      // We have the same parent as the target chunk, so keep index.
      parentNeighborChildIndex = index;
    } else {
      // Use index in opposite direction to move towards target chunk.
      parentNeighborChildIndex = index === 0 ? 1 : 0;
    }
    var parentNeighborChild = parentNeighbor.children[parentNeighborChildIndex];
    if (!parentNeighborChild) {
      parentNeighborChild = parentNeighbor.createChild(parentNeighborChildIndex);
    }

    parentNeighborChild.sampleChildren(false);
    parentNeighborChild.sampleParent(false);

    this.neighbors[index] = parentNeighborChild;
    parentNeighborChild.neighbors[Chunk2.getOppositeNeighborIndex(index)] = this;

    return parentNeighborChild;
  }

  // Find neighbor indirectly through child.
  if (this.children[index] && !isParent) {
    var child = this.children[index];
    var childNeighbor = child.lookUpNeighbor(index, false, this.oneHot, true);
    if (!childNeighbor) {
      return null;
    }

    var oneHot = !this.oneHot;
    childNeighborParent = childNeighbor.createParent(oneHot);
    childNeighborParent.sampleChildren(false);
    childNeighborParent.sampleParent(false);

    this.neighbors[index] = childNeighborParent;
    childNeighborParent.neighbors[Chunk2.getOppositeNeighborIndex(index)] = this;

    return childNeighborParent;
  }

  return null;
};

Chunk2.prototype.sampleParent = function() {
  if (!this.parent) {
    return;
  }

  var sampleStart;
  var sampleEnd;
  if (!this.oneHot) {
    sampleStart = 0;
    sampleEnd = this.size / 2;
  } else {
    sampleStart = this.size / 2;
    sampleEnd = this.size;
  }
  this.sampleDirtyPositive(this.parent, sampleStart, sampleEnd,
                           0, this.size);
  this.parent.setDirtyPositive(sampleStart, sampleEnd, false);
};

Chunk2.prototype.sampleChildren = function(keepDirty) {
  for (var i = 0; i < this.children.length; ++i) {
    var child = this.children[i];
    if (!child) {
      continue;
    }

    var start;
    var end;
    if (i === 0) {
      start = 0;
      end = this.size / 2;
    } else {
      start = this.size / 2;
      end = this.size;
    }
    this.sampleDirtyNegative(child, 0, this.size, start, end, keepDirty);
    child.setDirtyNegative(0, this.size, false);
  }
};

Chunk2.prototype.sampleDirtyPositive = function(chunk, sampleStart, sampleEnd,
                                               start, end,
                                               keepDirty) {
  var sampleWidth = (sampleEnd - sampleStart) / (end - start);
  for (var i = 0; i < end - start; ++i) {
    var sampleIndex = sampleStart + Math.floor(i * sampleWidth);
    if (sampleWidth === 2) {
      if (chunk.dirtyPositive[sampleIndex] ||
          chunk.dirtyPositive[sampleIndex + 1]) {
        var block;
        if (chunk.blocks[sampleIndex] === chunk.blocks[sampleIndex + 1]) {
          block = chunk.blocks[sampleIndex];
        } else {
          block = 0;
        }
        this.setBlock(start + i, block, keepDirty);
        this.dirtyNegative[start + i] = false;
      }
    } else if (chunk.dirtyPositive[sampleIndex]) {
      this.setBlock(start + i, chunk.blocks[sampleIndex], keepDirty);
      this.dirtyNegative[start + i] = false;
    }
  }
};

Chunk2.prototype.sampleDirtyNegative = function(chunk, sampleStart, sampleEnd,
                                               start, end,
                                               keepDirty) {
  var sampleWidth = (sampleEnd - sampleStart) / (end - start);
  for (var i = 0; i < end - start; ++i) {
    var sampleIndex = sampleStart + Math.floor(i * sampleWidth);
    if (sampleWidth === 2) {
      if (chunk.dirtyNegative[sampleIndex] ||
          chunk.dirtyNegative[sampleIndex + 1]) {
        var block;
        if (chunk.blocks[sampleIndex] === chunk.blocks[sampleIndex + 1]) {
          block = chunk.blocks[sampleIndex];
        } else {
          block = 0;
        }
        this.setBlock(start + i, block, keepDirty);
        this.dirtyPositive[start + i] = false;
      }
    } else if (chunk.dirtyNegative[sampleIndex]) {
      this.setBlock(start + i, chunk.blocks[sampleIndex], keepDirty);
      this.dirtyPositive[start + i] = false;
    }
  }
};

Chunk2.prototype.setDirtyNegative = function(start, end, value) {
  for (var i = start; i < end; ++i) {
    this.dirtyNegative[i] = value;
  }
};

Chunk2.prototype.setDirtyPositive = function(start, end, value) {
  for (var i = start; i < end; ++i) {
    this.dirtyPositive[i] = value;
  }
};

module.exports = Chunk2;
