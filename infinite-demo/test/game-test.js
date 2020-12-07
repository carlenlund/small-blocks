var assert = require('assert');
var Game = require('../src/game-2');
var Chunk = require('../src/chunk');
var Chunk2 = require('../src/chunk2');

describe('Game', function() {
  beforeEach(function() {
    this.game = new Game(null, null, null);
  });

  describe('World', function() {
    describe('Zoom in U-turn', function() {
      beforeEach(function() {
        this.chunk1 = this.game.player.chunk;
        for (var x = 0; x < Chunk.WIDTH; ++x) {
          this.game.setBlock(x, 3);
        }
      });

      describe('Left chunk neighbor, Zoom in, Right chunk neighbor', function() {
        beforeEach(function() {
          this.game.player.x = 0;
          this.game.moveLeft();
          this.game.zoomIn();
          this.game.moveRight();
          this.game.moveRight();
        });

        it('connects U-turn chunk with indirect parent', function() {
          var chunk2 = this.game.player.chunk;
          assert.equal(chunk2.parent, this.chunk1);
        });

        it('samples blocks from indirect parent', function() {
          var chunk2 = this.game.player.chunk;
          var blocks = [];
          for (var x = 0; x < Chunk.WIDTH; ++x) {
            blocks.push(3);
          }
          assert.deepEqual(chunk2.blocks, blocks);
        });
      });

      describe('Right half of chunk, Zoom in, Left chunk neighbor', function() {
        beforeEach(function() {
          this.game.player.x = Chunk.WIDTH / 2;
          this.game.moveRight();
          this.game.zoomIn();
          this.game.moveLeft();
        });
      
        it('connects U-turn chunk with indirect parent', function() {
          var chunk2 = this.game.player.chunk;
          assert.equal(chunk2.parent, this.chunk1);
        });
      
        it('samples blocks from indirect parent', function() {
          var chunk2 = this.game.player.chunk;
          var blocks = [];
          for (var x = 0; x < Chunk.WIDTH; ++x) {
            blocks.push(3);
          }
          assert.deepEqual(chunk2.blocks, blocks);
        });
      });

      describe('Right chunk neighbor, Zoom in, Left chunk neighbor', function() {
        beforeEach(function() {
          this.game.player.x = Chunk.WIDTH - 1;
          this.game.moveRight();
          this.game.zoomIn();
          this.game.moveLeft();
        });
      
        it('connects U-turn chunk with indirect parent', function() {
          var chunk2 = this.game.player.chunk;
          assert.equal(chunk2.parent, this.chunk1);
        });
      
        it('samples blocks from indirect parent', function() {
          var chunk2 = this.game.player.chunk;
          var blocks = [];
          for (var x = 0; x < Chunk.WIDTH; ++x) {
            blocks.push(3);
          }
          assert.deepEqual(chunk2.blocks, blocks);
        });
      });
    });

    describe('Zoom in-out building bug', function() {
      it('samples all parent blocks for neighbor chunks', function() {
        this.game.player.x = 0;
        for (var i = 0; i < 4; ++i) {
          this.game.zoomIn();
        }
        for (var i = 0; i < 4; ++i) {
          this.game.zoomOut();
        }
        this.game.setBlock(this.game.player.x, 3);

        for (var i = 0; i < 3; ++i) {
          this.game.zoomIn();
        }
        this.game.player.x = Chunk.WIDTH / 2;
        this.game.breakBlock();
        this.game.zoomIn();

        var leftChunk = this.game.player.chunk.lookUpNeighbor(0);
        var blocks = [];
        for (var x = 0; x < Chunk.WIDTH; ++x) {
          blocks.push(3);
        }
        assert.deepEqual(leftChunk.blocks, blocks);
      });

      it('samples equal child block pairs when zooming out from even coordinate', function() {
        this.game.player.x = 0;
        this.game.breakBlock();
        this.game.zoomIn();
        this.game.placeBlock(3);
        this.game.moveRight();
        this.game.placeBlock(3);
        this.game.moveLeft();
        this.game.zoomOut();
        assert.equal(this.game.player.chunk.blocks[0], 3);
      });
    });
  });
});
