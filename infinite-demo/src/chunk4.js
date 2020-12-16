// Quadtree chunk C, consisting of 4 child chunks:
// C C
// C C
//
// With size * size number of blocks:
// B B . . . B (size columns)
// B B       B
// .   .     .
// .     .   .
// .       . .
// B B . . . B (size * size blocks)
// (size
//  rows)
//
// Size is a multiple of 2.
function Chunk4(size) {
  this.parent = null;

  // Child indices:
  // 0 1
  // 2 3
  this.children = new Array(4);
  for (var i = 0; i < this.children.length; ++i) {
    this.children[i] = null;
  }

  // Neighbor indices:
  //   0
  // 3 C 1
  //   2
  this.neighbors = new Array(4);
  for (var i = 0; i < this.neighbors.length; ++i) {
    this.neighbors[i] = null;
  }

  this.size = size;
  this.blocks = new Array(this.size * this.size);
  this.dirtyNegative = new Array(this.size * this.size);
  this.dirtyPositive = new Array(this.size * this.size);
  for (var y = 0; y < this.size; ++y) {
    for (var x = 0; x < this.size; ++x) {
      this.setBlock(x, y, 0);
    }
  }

  this.oneHot = false;
}

Chunk4.prototype.setBlock = function(x, y, block, keepDirty) {
  if (keepDirty &&
      (this.dirtyNegative[y * this.size + x] ||
       this.dirtyPositive[y * this.size + x])) {
    return;
  }
  this.blocks[y * this.size + x] = block;
  this.dirtyNegative[y * this.size + x] = true;
  this.dirtyPositive[y * this.size + x] = true;
};

// TODO
Chunk4.prototype.createParent = function(oneHot) {
  var chunk = new Chunk4(this.size);
  chunk.oneHot = oneHot;
  this.parent = chunk;
  var index1 = this.oneHot ? 1 : 0;
  chunk.children[index1] = this;
  var index2 = Chunk4.getOppositeNeighborIndex(index1);
  chunk.children[index2] = this.lookUpNeighbor(index2);
  return chunk;
};

// TODO
Chunk4.prototype.createChild = function(index) {
  var chunk = new Chunk4(this.size);
  chunk.oneHot = index === 1;
  this.children[index] = chunk;
  chunk.parent = this;
  return chunk;
};

Chunk4.prototype.createNeighbor = function(index) {
  var chunk = new Chunk4(this.size);
  // TODO
  chunk.oneHot = !this.oneHot;
  this.neighbors[index] = chunk;
  chunk.neighbors[Chunk4.getOppositeNeighborIndex(index)] = this;
  return chunk;
};

Chunk4.getOppositeNeighborIndex = function(index) {
  switch (index) {
    case 0: return 2;
    case 1: return 3;
    case 2: return 0;
    case 3: return 1;
  };
};

// TODO
// isParent and childOneHot used only for finding parent neighbor children.
Chunk4.prototype.lookUpNeighbor = function(index, isParent, childOneHot, isChild) {
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
    parentNeighborChild.neighbors[Chunk4.getOppositeNeighborIndex(index)] = this;

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
    childNeighborParent.neighbors[Chunk4.getOppositeNeighborIndex(index)] = this;

    return childNeighborParent;
  }

  return null;
};

// TODO
Chunk4.prototype.sampleParent = function() {
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

// TODO
Chunk4.prototype.sampleChildren = function(keepDirty) {
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

// TODO
Chunk4.prototype.sampleDirtyPositive = function(chunk, sampleStart, sampleEnd,
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

// TODO
Chunk4.prototype.sampleDirtyNegative = function(chunk, sampleStart, sampleEnd,
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

// TODO
Chunk4.prototype.setDirtyNegative = function(start, end, value) {
  for (var i = start; i < end; ++i) {
    this.dirtyNegative[i] = value;
  }
};

// TODO
Chunk4.prototype.setDirtyPositive = function(start, end, value) {
  for (var i = start; i < end; ++i) {
    this.dirtyPositive[i] = value;
  }
};

module.exports = Chunk4;
