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
