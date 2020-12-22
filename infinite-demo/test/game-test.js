var assert = require('assert');
var Game = require('../src/game');
var Chunk = require('../src/chunk');

describe('Game', function() {
  beforeEach(function() {
    this.game = new Game(null, null, null);
    this.game.renderDistance = 0;
    this.game.world = new Chunk();
    for (var i = 0; i < this.game.world.neighbors.length; ++i) {
      this.game.world.createNeighbor(i);
    }
    this.game.update();
  });

  describe('World', function() {
    describe('Zoom in U-turn', function() {
      beforeEach(function() {
        this.chunk1 = this.game.player.chunk;
        for (var x = 0; x < Game.CHUNK_SIZE; ++x) {
          this.game.setBlock(x, 3);
        }
      });

      describe('Left chunk neighbor, Zoom in, Right chunk neighbor', function() {
        beforeEach(function() {
          this.game.player.x = 0;
          this.game.moveLeft(); this.game.update();
          this.game.zoomIn(); this.game.update();
          this.game.moveRight(); this.game.update();
          this.game.moveRight(); this.game.update();
        });

        it('connects U-turn chunk with indirect parent', function() {
          var chunk2 = this.game.player.chunk;
          assert.equal(chunk2.parent, this.chunk1);
        });

        it('samples blocks from indirect parent', function() {
          var chunk2 = this.game.player.chunk;
          var blocks = [];
          for (var x = 0; x < Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS; ++x) {
            blocks.push(3);
          }
          assert.deepEqual(chunk2.blocks, blocks);
        });
      });

      describe('Right half of chunk, Zoom in, Left chunk neighbor', function() {
        beforeEach(function() {
          this.game.player.x = Game.CHUNK_SIZE / 2;
          this.game.moveRight(); this.game.update();
          this.game.zoomIn(); this.game.update();
          this.game.moveLeft(); this.game.update();
        });

        it('connects U-turn chunk with indirect parent', function() {
          var chunk2 = this.game.player.chunk;
          assert.equal(chunk2.parent, this.chunk1);
        });

        it('samples blocks from indirect parent', function() {
          var chunk2 = this.game.player.chunk;
          var blocks = [];
          for (var x = 0; x < Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS; ++x) {
            blocks.push(3);
          }
          assert.deepEqual(chunk2.blocks, blocks);
        });
      });

      describe('Right chunk neighbor, Zoom in, Left chunk neighbor', function() {
        beforeEach(function() {
          this.game.player.x = Game.CHUNK_SIZE - 1;
          this.game.moveRight(); this.game.update();
          this.game.zoomIn(); this.game.update();
          this.game.moveLeft(); this.game.update();
        });

        it('connects U-turn chunk with indirect parent', function() {
          var chunk2 = this.game.player.chunk;
          assert.equal(chunk2.parent, this.chunk1);
        });

        it('samples blocks from indirect parent', function() {
          var chunk2 = this.game.player.chunk;
          var blocks = [];
          for (var x = 0; x < Game.CHUNK_SIZE * Game.NUM_SUBDIVISIONS; ++x) {
            blocks.push(3);
          }
          assert.deepEqual(chunk2.blocks, blocks);
        });
      });
    });

    describe('Zoom in-out building bug', function() {
      it('places blocks in right neighbor chunk when zooming out on right edge chunk', function() {
        this.game.player.x = 0;
        this.game.moveLeft(); this.game.update();
        this.game.zoomOut(); this.game.update();
        this.game.placeBlock(3);
        var chunk = this.game.player.chunk;
        assert.equal(this.game.player.chunk.blocks[Game.CHUNK_SIZE - 1], 0);
        this.game.moveRight(); this.game.update();
        assert.equal(this.game.player.chunk.blocks[0], 3);
      });

      it('samples child blocks in neighbor chunks when zooming out', function() {
        this.game.player.x = 0;
        this.game.player.chunk.neighbors[0].setBlock(this.game.player.chunk.neighbors[0].size - 1, 3);
        this.game.player.chunk.neighbors[0].setBlock(this.game.player.chunk.neighbors[0].size - 2, 3);
        this.game.zoomOut(); this.game.update();
        var leftNeighbor = this.game.player.chunk.lookUpNeighbor(0);
        assert.equal(leftNeighbor.blocks[leftNeighbor.size - 1], 3);
      });
    });
  });
});
