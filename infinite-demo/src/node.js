function Node(value) {
  this.value = typeof value !== 'undefined' ? value : null;
  this.parent = null;
  this.children = [];
}

module.exports = Node;
