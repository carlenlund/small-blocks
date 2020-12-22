// Quadtree chunk C, consisting of 4 child chunks:
// c   c
//  \ /
//   C
//  / \
// c   c
//
// With size * size number of blocks:
// B B . . . B
// B B       B
// .   .     .
// .     .   .
// .       . .
// B B . . . B
//
// Size must be a multiple of 2.
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
  // 0 1 2
  // 3 C 5
  // 6 7 8
  // Access with (neighborX, neighborY):
  // (-1,-1)  (0,-1)  (1,-1)
  // (-1, 0)  (0, 0)  (1, 0)
  // (-1, 1)  (0, 1)  (1, 1)
  this.neighbors = new Array(3 * 3);
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

  this.oneHotX = false;
  this.oneHotY = false;
}

Chunk4.prototype.getBlock = function(x, y) {
  return this.blocks[y * this.size + x];
};

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

Chunk4.prototype.createParent = function(oneHotX, oneHotY) {
  var chunk = new Chunk4(this.size);
  chunk.oneHotX = oneHotX;
  chunk.oneHotY = oneHotY;
  this.parent = chunk;
  if (!this.oneHotX && !this.oneHotY) {
    chunk.children[0] = this;
    chunk.children[1] = this.lookUpNeighbor(1, 0);
    chunk.children[2] = this.lookUpNeighbor(0, 1);
    chunk.children[3] = this.lookUpNeighbor(1, 1);
  } else if (this.oneHotX && !this.oneHotY) {
    chunk.children[0] = this.lookUpNeighbor(-1, 0);
    chunk.children[1] = this;
    chunk.children[2] = this.lookUpNeighbor(-1, 1);
    chunk.children[3] = this.lookUpNeighbor(0, 1);
  } else if (!this.oneHotX && this.oneHotY) {
    chunk.children[0] = this.lookUpNeighbor(0, -1);
    chunk.children[1] = this.lookUpNeighbor(1, -1);
    chunk.children[2] = this;
    chunk.children[3] = this.lookUpNeighbor(1, 0);
  } else if (this.oneHotX && this.oneHotY) {
    chunk.children[0] = this.lookUpNeighbor(-1, -1);
    chunk.children[1] = this.lookUpNeighbor(0, -1);
    chunk.children[2] = this.lookUpNeighbor(-1, 0);
    chunk.children[3] = this;
  }
  return chunk;
};

Chunk4.prototype.createChild = function(index) {
  var chunk = new Chunk4(this.size);
  chunk.oneHotX = index % 2 === 1;
  chunk.oneHotY = index >= 2;
  this.children[index] = chunk;
  chunk.parent = this;
  return chunk;
};

Chunk4.prototype.createNeighbor = function(neighborX, neighborY) {
  if (neighborX === 0 && neighborY === 0) {
    throw new Error('Invalid neighbor index (' + neighborX + ', ' + neighborY + ')');
  }

  var chunk = new Chunk4(this.size);
  if (neighborX !== 0) {
    chunk.oneHotX = !this.oneHotX;
  }
  if (neighborY !== 0) {
    chunk.oneHotY = !this.oneHotY;
  }
  this.neighbors[Chunk4.getNeighborIndex(neighborX, neighborY)] = chunk;
  chunk.neighbors[Chunk4.getNeighborIndex(-neighborX, -neighborY)] = this;
  return chunk;
};

Chunk4.getNeighborIndex = function(neighborX, neighborY) {
  return (neighborY + 1) * 3 + (neighborX + 1);
};

// Looks up a neighbor chunk given its relative offset.
// Returns a new neighbor if none exists.
// isParent and childOneHot used only for finding parent neighbor children.
Chunk4.prototype.lookUpNeighbor = function(neighborX, neighborY,
                                           isParent, isChild,
                                           childOneHotX, childOneHotY) {
  if (Math.abs(neighborX) > 1) {
    throw new Error('Neighbor x offset ' + neighborX + ' too large');
  }
  if (Math.abs(neighborY) > 1) {
    throw new Error('Neighbor y offset ' + neighborY + ' too large');
  }

  if (neighborX === 0 && neighborY === 0) {
    return this;
  }

  isParent = typeof(isParent) === 'undefined' ? false : isParent;
  isChild = typeof(isChild) === 'undefined' ? false : isChild;
  childOneHotX = typeof(childOneHotX) === 'undefined' ? false : childOneHotX;
  childOneHotY = typeof(childOneHotY) === 'undefined' ? false : childOneHotY;

  if (isParent &&
      ((!childOneHotX && neighborX === 1 &&
           ((!childOneHotY && neighborY === 1) || (childOneHotY && neighborY === -1))) ||
       (childOneHotX && neighborX === -1 &&
           ((!childOneHotY && neighborY === 1) || (childOneHotY && neighborY === -1))))) {
    this.sampleChildren(false);
    this.sampleParent(false);
    return this;
  }

  var neighbor = this.neighbors[Chunk4.getNeighborIndex(neighborX, neighborY)];
  if (neighbor) {
    // Resample parents last to overwrite child changes.
    neighbor.sampleChildren(true);
    neighbor.sampleParent(true);
    return neighbor;
  }

  // Find neighbor indirectly through parent.
  if (this.parent && !isChild) {
    var parentNeighbor = this.parent.lookUpNeighbor(neighborX, neighborY,
                                                    true, false,
                                                    this.oneHotX, this.oneHotY);
    if (!parentNeighbor) {
      // TODO: Try looking up via child instead.
      return null;
    }

    var parentNeighborChildIndex;
    if ((!this.oneHotX && neighborX === 1 &&
            ((!this.oneHotY && neighborY === 1) || (this.oneHotY && neighborY === -1))) ||
        (this.oneHotX && neighborX === -1 &&
            ((!this.oneHotY && neighborY === 1) || (this.oneHotY && neighborY === -1)))) {
      // We have the same parent as the target chunk, so find index for
      // children for current chunk.
      if (!this.oneHotX && !this.oneHotY) {
        if (neighborX === 1 && neighborY === 0) {
          parentNeighborChildIndex = 1;
        } else if (neighborX === 0 && neighborY === 1) {
          parentNeighborChildIndex = 2;
        } else if (neighborX === 1 && neighborY === 1) {
          parentNeighborChildIndex = 3;
        }
      } else if (this.oneHotX && !this.oneHotY) {
        if (neighborX === -1 && neighborY === 0) {
          parentNeighborChildIndex = 0;
        } else if (neighborX === -1 && neighborY === 1) {
          parentNeighborChildIndex = 2;
        } else if (neighborX === 0 && neighborY === 1) {
          parentNeighborChildIndex = 3;
        }
      } else if (!this.oneHotX && this.oneHotY) {
        if (neighborX === 0 && neighborY === -1) {
          parentNeighborChildIndex = 0;
        } else if (neighborX === 1 && neighborY === -1) {
          parentNeighborChildIndex = 1;
        } else if (neighborX === 1 && neighborY === 0) {
          parentNeighborChildIndex = 3;
        }
      } else if (this.oneHotX && this.oneHotY) {
        if (neighborX === -1 && neighborY === -1) {
          parentNeighborChildIndex = 0;
        } else if (neighborX === 0 && neighborY === -1) {
          parentNeighborChildIndex = 1;
        } else if (neighborX === -1 && neighborY === 0) {
          parentNeighborChildIndex = 2;
        }
      }
    } else {
      // We don't have the same parent as the target chunk, so find index in
      // opposite direction to move towards target chunk.
      if (!this.oneHotX && !this.oneHotY) {
        if (neighborX === -1 && neighborY === -1) {
          // 0 1  
          // 2 3  
          //     C c
          //     c c
          parentNeighborChildIndex = 3;
        } else if (neighborX === 0 && neighborY === -1) {
          //     0 1  
          //     2 3  
          //     C c
          //     c c
          parentNeighborChildIndex = 2;
        } else if (neighborX === 1 && neighborY === -1) {
          //     0 1  
          //     2 3  
          //     C c
          //     c c
          parentNeighborChildIndex = 3;
        } else if (neighborX === -1 && neighborY === 0) {
          // 0 1 C c
          // 2 3 c c
          parentNeighborChildIndex = 1;
        } else if (neighborX === -1 && neighborY === 1) {
          // 0 1 C c
          // 2 3 c c
          parentNeighborChildIndex = 3;
        }
      } else if (this.oneHotX && !this.oneHotY) {
        if (neighborX === -1 && neighborY === -1) {
          // 0 1  
          // 2 3  
          // c C
          // c c
          parentNeighborChildIndex = 2;
        } else if (neighborX === 0 && neighborY === -1) {
          // 0 1  
          // 2 3  
          // c C
          // c c
          parentNeighborChildIndex = 3;
        } else if (neighborX === 1 && neighborY === -1) {
          //     0 1  
          //     2 3  
          // c C
          // c c
          parentNeighborChildIndex = 2;
        } else if (neighborX === 1 && neighborY === 0) {
          // c C 0 1
          // c c 2 3
          parentNeighborChildIndex = 0;
        } else if (neighborX === 1 && neighborY === 1) {
          // c C 0 1
          // c c 2 3
          parentNeighborChildIndex = 2;
        }
      } else if (!this.oneHotX && this.oneHotY) {
        if (neighborX === -1 && neighborY === -1) {
          // 0 1 c c
          // 2 3 C c
          parentNeighborChildIndex = 1;
        } else if (neighborX === -1 && neighborY === 0) {
          // 0 1 c c
          // 2 3 C c
          parentNeighborChildIndex = 3;
        } else if (neighborX === -1 && neighborY === 1) {
          //     c c
          //     C c
          // 0 1
          // 2 3
          parentNeighborChildIndex = 1;
        } else if (neighborX === 0 && neighborY === 1) {
          // c c
          // C c
          // 0 1
          // 2 3
          parentNeighborChildIndex = 0;
        } else if (neighborX === 1 && neighborY === 1) {
          // c c
          // C c
          // 0 1
          // 2 3
          parentNeighborChildIndex = 1;
        }
      } else if (this.oneHotX && this.oneHotY) {
        if (neighborX === 1 && neighborY === -1) {
          // c c 0 1
          // c C 2 3
          parentNeighborChildIndex = 0;
        } else if (neighborX === 1 && neighborY === 0) {
          // c c 0 1
          // c C 2 3
          parentNeighborChildIndex = 2;
        } else if (neighborX === -1 && neighborY === 1) {
          // c c
          // c C
          // 0 1
          // 2 3
          parentNeighborChildIndex = 0;
        } else if (neighborX === 0 && neighborY === 1) {
          // c c
          // c C
          // 0 1
          // 2 3
          parentNeighborChildIndex = 1;
        } else if (neighborX === 1 && neighborY === 1) {
          // c c
          // c C
          //     0 1
          //     2 3
          parentNeighborChildIndex = 0;
        }
      }
    }
    var parentNeighborChild = parentNeighbor.children[parentNeighborChildIndex];
    if (!parentNeighborChild) {
      parentNeighborChild = parentNeighbor.createChild(parentNeighborChildIndex);
    }

    parentNeighborChild.sampleChildren(false);
    parentNeighborChild.sampleParent(false);

    this.neighbors[Chunk4.getNeighborIndex(neighborX, neighborY)] = parentNeighborChild;
    parentNeighborChild.neighbors[Chunk4.getNeighborIndex(-neighborX, -neighborY)] = this;

    return parentNeighborChild;
  }

  // Find neighbor indirectly through child.
  if (!isParent) {
    var childIndex = Chunk4.getNeighborIndex(neighborX, neighborY);
    if (neighborX === -1 && neighborY === -1) {
      // c c
      // c C
      //     0 1  
      //     2 3  
      childIndex = 0;
    } else if (neighborX === 0 && neighborY === -1) {
      // c c
      // C c
      // 0 1  
      // 2 3  
      // TODO: Do we need to test if child index 1 works too?
      childIndex = 2;
    } else if (neighborX === 1 && neighborY === -1) {
      //     c c
      //     C c
      // 0 1  
      // 2 3  
      childIndex = 1;
    } else if (neighborX === -1 && neighborY === 0) {
      // c C 0 1
      // c c 2 3
      // TODO: Do we need to test if child index 2 works too?
      childIndex = 0;
    } else if (neighborX === 1 && neighborY === 0) {
      // 0 1 C c
      // 2 3 c c
      // TODO: Do we need to test if child index 3 works too?
      childIndex = 1;
    } else if (neighborX === -1 && neighborY === 1) {
      //     0 1
      //     2 3
      // c C
      // C c
      childIndex = 2;
    } else if (neighborX === 0 && neighborY === 1) {
      // 0 1
      // 2 3
      // C c
      // C c
      // TODO: Do we need to test if child index 3 works too?
      childIndex = 2;
    } else if (neighborX === 1 && neighborY === 1) {
      // 0 1
      // 2 3
      //     C c
      //     c c
      childIndex = 3;
    }
    
    var child = this.children[childIndex];
    if (!child) {
      // TODO: Try looking up via parent instead.
      return null;
    }
    var childNeighbor = child.lookUpNeighbor(neighborX, neighborY,
                                             false, true,
                                             this.oneHotX, this.oneHotY);
    if (!childNeighbor) {
      // TODO: Try looking up via parent instead.
      return null;
    }

    var childNeighborParent = childNeighbor.parent;
    if (!childNeighborParent) {
      var oneHotX = neighborX !== 0 ? !this.oneHotX : this.oneHotX;
      var oneHotY = neighborY !== 0 ? !this.oneHotY : this.oneHotY;
      childNeighborParent = childNeighbor.createParent(oneHotX, oneHotY);
    }
    childNeighborParent.sampleChildren(false);
    childNeighborParent.sampleParent(false);

    this.neighbors[Chunk4.getNeighborIndex(neighborX, neighborY)] = childNeighborParent;
    childNeighborParent.neighbors[Chunk4.getNeighborIndex(-neighborX, -neighborY)] = this;

    return childNeighborParent;
  }

  return null;
};

Chunk4.prototype.sampleParent = function(keepDirty) {
  if (!this.parent) {
    return;
  }

  var sampleStartX;
  var sampleStartY;
  var sampleEndX;
  var sampleEndY;
  if (!this.oneHotX) {
    sampleStartX = 0;
    sampleEndX = this.size / 2;
  } else {
    sampleStartX = this.size / 2;
    sampleEndX = this.size;
  }
  if (!this.oneHotY) {
    sampleStartY = 0;
    sampleEndY = this.size / 2;
  } else {
    sampleStartY = this.size / 2;
    sampleEndY = this.size;
  }

  this.sampleDirtyPositive(this.parent,
                           sampleStartX, sampleStartY,
                           sampleEndX, sampleEndY,
                           0, 0,
                           this.size, this.size,
                           keepDirty);
};

Chunk4.prototype.sampleChildren = function(keepDirty) {
  for (var i = 0; i < this.children.length; ++i) {
    var child = this.children[i];
    if (!child) {
      continue;
    }

    var startX;
    var startY;
    var endX;
    var endY;
    if (i % 2 === 0) {
      startX = 0;
      endX = this.size / 2;
    } else {
      startX = this.size / 2;
      endX = this.size;
    }
    if (i < 2) {
      startY = 0;
      endY = this.size / 2;
    } else {
      startY = this.size / 2;
      endY = this.size;
    }

    this.sampleDirtyNegative(child,
                             0, 0,
                             this.size, this.size,
                             startX, startY,
                             endX, endY,
                             keepDirty);
  }
};

Chunk4.prototype.sampleDirtyPositive = function(chunk,
                                                sampleStartX, sampleStartY,
                                                sampleEndX, sampleEndY,
                                                startX, startY,
                                                endX, endY,
                                                keepDirty) {
  // FIXME: The following values are = Infinity
  var sampleWidth = (sampleEndX - sampleStartX) / (endX - startX);
  var sampleHeight = (sampleEndY - sampleStartY) / (endY - startY);

  for (var i = 0; i < endY - startY; ++i) {
    for (var j = 0; j < endX - startX; ++j) {
      var sampleX = sampleStartX + Math.floor(j * sampleWidth);
      var sampleY = sampleStartY + Math.floor(i * sampleHeight);
      var sampleIndex = sampleY * this.size + sampleX;

      if (sampleWidth === 2 && sampleHeight === 2) {
        if (chunk.dirtyPositive[sampleIndex] ||
            chunk.dirtyPositive[sampleIndex + 1] ||
            chunk.dirtyPositive[sampleIndex + this.size] ||
            chunk.dirtyPositive[sampleIndex + this.size + 1]) {
          var block;
          if (chunk.blocks[sampleIndex] === chunk.blocks[sampleIndex + 1] &&
              chunk.blocks[sampleIndex] === chunk.blocks[sampleIndex + this.size] &&
              chunk.blocks[sampleIndex] === chunk.blocks[sampleIndex + this.size + 1]) {
            block = chunk.blocks[sampleIndex];
          } else {
            block = 0;
          }
          this.setBlock(startX + j, startY + i, block, keepDirty);
          this.dirtyNegative[(startY + i) * this.size + startX + j] = false;
        }
      } else if (chunk.dirtyPositive[sampleIndex]) {
        this.setBlock(startX + j, startY + i, chunk.blocks[sampleIndex], keepDirty);
        this.dirtyNegative[(startY + i) * this.size + startX + j] = false;
      }
    }
  }

  chunk.setDirtyPositive(sampleStartX, sampleStartY,
                         sampleEndX, sampleEndY,
                         false);
};

Chunk4.prototype.sampleDirtyNegative = function(chunk,
                                                sampleStartX, sampleStartY,
                                                sampleEndX, sampleEndY,
                                                startX, startY,
                                                endX, endY,
                                                keepDirty) {
  var sampleWidth = (sampleEndX - sampleStartX) / (endX - startX);
  var sampleHeight = (sampleEndY - sampleStartY) / (endY - startY);

  for (var i = 0; i < endY - startY; ++i) {
    for (var j = 0; j < endX - startX; ++j) {
      var sampleX = sampleStartX + Math.floor(j * sampleWidth);
      var sampleY = sampleStartY + Math.floor(i * sampleHeight);
      var sampleIndex = sampleY * this.size + sampleX;

      if (sampleWidth === 2 && sampleHeight === 2) {
        if (chunk.dirtyNegative[sampleIndex] ||
            chunk.dirtyNegative[sampleIndex + 1] ||
            chunk.dirtyNegative[sampleIndex + this.size] ||
            chunk.dirtyNegative[sampleIndex + this.size + 1]) {
          var block;
          if (chunk.blocks[sampleIndex] === chunk.blocks[sampleIndex + 1] &&
              chunk.blocks[sampleIndex] === chunk.blocks[sampleIndex + this.size] &&
              chunk.blocks[sampleIndex] === chunk.blocks[sampleIndex + this.size + 1]) {
            block = chunk.blocks[sampleIndex];
          } else {
            block = 0;
          }
          this.setBlock(startX + j, startY + i, block, keepDirty);
          this.dirtyPositive[(startY + i) * this.size + startX + j] = false;
        }
      } else if (chunk.dirtyNegative[sampleIndex]) {
        this.setBlock(startX + j, startY + i, chunk.blocks[sampleIndex], keepDirty);
        this.dirtyPositive[(startY + i) * this.size + startX + j] = false;
      }
    }
  }

  chunk.setDirtyNegative(sampleStartX, sampleStartY,
                         sampleEndX, sampleEndY,
                         false);
};

Chunk4.prototype.setDirtyNegative = function(startX, startY,
                                             endX, endY,
                                             value) {
  for (var i = startY; i < endY; ++i) {
    for (var j = startX; j < endX; ++j) {
      this.dirtyNegative[i * this.size + j] = value;
    }
  }
};

Chunk4.prototype.setDirtyPositive = function(startX, startY,
                                             endX, endY,
                                             value) {
  for (var i = startY; i < endY; ++i) {
    for (var j = startX; j < endX; ++j) {
      this.dirtyPositive[i * this.size + j] = value;
    }
  }
};

module.exports = Chunk4;
