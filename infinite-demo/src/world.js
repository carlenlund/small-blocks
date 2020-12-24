function Chunk() {
  this.parent = null;
  this.children = new Array(4);
  for (var i = 0; i < this.children.length; ++i) {
    this.children[i] = null;
  }
}

function World() {
  this.chunk = new Chunk();
}

module.exports = World;
