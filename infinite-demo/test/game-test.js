var assert = require('assert');
var Game = require('../src/game-2');
var Chunk = require('../src/chunk');

describe('Game', function() {
  describe('World', function() {
    describe('U-turn', function() {
      beforeEach(function() {
        this.game = new Game(null, null, null);
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
  });
});
