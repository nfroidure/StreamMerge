var assert = require('assert')
  , es = require('event-stream')
  , StreamMerge = require('../src')
  , PlatformStream = require('stream')
  , Stream = require('readable-stream')
;

// Test each type of stream
[PlatformStream, Stream].slice(PlatformStream.Readable ? 0 : 1)
  .forEach(function(Stream) {

// Helpers
function writeToStreamSync(stream, chunks) {
  if(!chunks.length) {
    stream.end();
  } else {
    stream.write(chunks.shift());
    writeToStreamSync(stream, chunks);
  }
  return stream;
}
function writeToStream(stream, chunks) {
  if(!chunks.length) {
    stream.end();
  } else {
    setTimeout(function() {
      stream.write(chunks.shift());
      writeToStream(stream, chunks);
    }, 10);
  }
  return stream;
}
function readableStream(chunks) {
  var stream = new Stream.Readable();
  stream._read = function() {
    if(chunks.length) {
      setTimeout(function() {
        stream.push(chunks.shift());
        if(!chunks.length) {
          stream.push(null);
        }
      }, 10);
    }
  };
  stream.resume();
  return stream;
}
function erroredStream(msg) {
  var erroredStream = new Stream.PassThrough();
  setTimeout(function() {
    erroredStream.emit('error', new Error(msg));
    setTimeout(function() {
      erroredStream.end();
    }, 1500);
  });
  return erroredStream;
}

// Tests
describe('StreamMerge', function() {

  describe('in binary mode', function() {

    describe('and with async streams', function() {

      it('should work with functionnal API', function(done) {
        getStreamText(StreamMerge(
          writeToStream(new Stream.PassThrough(), ['wa','dup']),
          writeToStream(new Stream.PassThrough(), ['pl','op']),
          writeToStream(new Stream.PassThrough(), ['ki','koo','lol'])
        ), function(data) {
          assert.equal(data, 'wadupplopkikoolol');
          done();
        });
      });

      it('should work with functionnal API and options', function(done) {
        getStreamText(StreamMerge({pause: true},
          writeToStream(new Stream.PassThrough(), ['wa','dup']),
          writeToStream(new Stream.PassThrough(), ['pl','op']),
          writeToStream(new Stream.PassThrough(), ['ki','koo','lol'])
        ), function(data) {
          assert.equal(data, 'wadupplopkikoolol');
          done();
        });
      });

      it('should work with POO API', function(done) {
        var queue = new StreamMerge();
        queue.add(writeToStream(new Stream.PassThrough(), ['wa','dup']));
        queue.add(writeToStream(new Stream.PassThrough(), ['pl','op']));
        queue.add(writeToStream(new Stream.PassThrough(), ['ki','koo','lol']));
        assert.equal(queue.length, 3);
        getStreamText(queue, function(data) {
          assert.equal(data, 'wadupplopkikoolol');
          done();
        });
        queue.done();
      });

      it('should work with POO API and options', function(done) {
        var queue = new StreamMerge({});
        queue.add(writeToStream(new Stream.PassThrough(), ['wa','dup']));
        queue.add(writeToStream(new Stream.PassThrough(), ['pl','op']));
        queue.add(writeToStream(new Stream.PassThrough(), ['ki','koo','lol']));
        assert.equal(queue.length, 3);
        getStreamText(queue, function(data) {
          assert.equal(data, 'wadupplopkikoolol');
          done();
        });
        queue.done();
      });

      it('should work with POO API and a late done call', function(done) {
        var queue = new StreamMerge();
        queue.add(writeToStream(new Stream.PassThrough(), ['wa','dup']));
        queue.add(writeToStream(new Stream.PassThrough(), ['pl','op']));
        queue.add(writeToStream(new Stream.PassThrough(), ['ki','koo','lol']));
        assert.equal(queue.length, 3);
        getStreamText(queue, function(data) {
          assert.equal(data, 'wadupplopkikoolol');
          done();
        });
        setTimeout(function() {
          queue.done();
        }, 100);
      });

      it('should reemit errors', function(done) {
        var queue = new StreamMerge();
        queue.add(erroredStream('Aouch!'));
        queue.add(writeToStream(new Stream.PassThrough(), ['wa','dup']));
        queue.add(writeToStream(new Stream.PassThrough(), ['pl','op']));
        queue.add(writeToStream(new Stream.PassThrough(), ['ki','koo','lol']));
        assert.equal(queue.length, 4);
        queue.on('error', function(err) {
          assert.equal(err.message, 'Aouch!')
          done();
        });
        getStreamText(queue, function(data) {});
        queue.done();
      });

    });

    describe('and with sync streams', function() {

      it('should work with functionnal API', function(done) {
        getStreamText(StreamMerge(
          writeToStreamSync(new Stream.PassThrough(), ['wa','dup']),
          writeToStreamSync(new Stream.PassThrough(), ['pl','op']),
          writeToStreamSync(new Stream.PassThrough(), ['ki','koo','lol'])
        ), function(data) {
          assert.equal(data, 'wadupplopkikoolol');
          done();
        });
      });

      it('should work with POO API', function(done) {
        var queue = new StreamMerge();
        queue.add(writeToStreamSync(new Stream.PassThrough(), ['wa','dup']));
        queue.add(writeToStreamSync(new Stream.PassThrough(), ['pl','op']));
        queue.add(writeToStreamSync(new Stream.PassThrough(), ['ki','koo','lol']));
        assert.equal(queue.length, 3);
        getStreamText(queue, function(data) {
          assert.equal(data, 'wadupplopkikoolol');
          done();
        });
        queue.done();
      });

      it('should emit an error when calling done twice', function(done) {
        var queue = new StreamMerge();
        queue.add(writeToStreamSync(new Stream.PassThrough(), ['wa','dup']));
        queue.add(writeToStreamSync(new Stream.PassThrough(), ['pl','op']));
        queue.add(writeToStreamSync(new Stream.PassThrough(), ['ki','koo','lol']));
        assert.equal(queue.length, 3);
        getStreamText(queue, function(data) {
          assert.equal(data, 'wadupplopkikoolol');
          done();
        });
        queue.done();
        assert.throws(function() {
          queue.done();
        });
      });

      it('should emit an error when queueing after done was called', function(done) {
        var queue = new StreamMerge();
        queue.add(writeToStreamSync(new Stream.PassThrough(), ['wa','dup']));
        queue.add(writeToStreamSync(new Stream.PassThrough(), ['pl','op']));
        queue.add(writeToStreamSync(new Stream.PassThrough(), ['ki','koo','lol']));
        assert.equal(queue.length, 3);
        getStreamText(queue, function(data) {
          assert.equal(data, 'wadupplopkikoolol');
          done();
        });
        queue.done();
        assert.throws(function() {
          queue.add(new Stream.PassThrough());
        });
      });

      it('should reemit errors', function(done) {
        var queue = new StreamMerge();
        queue.add(erroredStream('Aouch!'));
        queue.add(writeToStreamSync(new Stream.PassThrough(), ['wa','dup']));
        queue.add(writeToStreamSync(new Stream.PassThrough(), ['pl','op']));
        queue.add(writeToStreamSync(new Stream.PassThrough(), ['ki','koo','lol']));
        assert.equal(queue.length, 4);
        queue.on('error', function(err) {
          assert.equal(err.message, 'Aouch!')
          done();
        });
        getStreamText(queue, function(data) {});
        queue.done();
      });

    });

    describe('and with functions returning streams', function() {

      it('should work with functionnal API', function(done) {
        getStreamText(StreamMerge(function() {
          return writeToStream(new Stream.PassThrough(), ['wa','dup']);
        }, function() {
          return writeToStream(new Stream.PassThrough(), ['pl','op']);
        }, function() {
          return writeToStream(new Stream.PassThrough(), ['ki','koo','lol']);
        }), function(data) {
          assert.equal(data, 'wadupplopkikoolol');
          done();
        });
      });

      it('should work with functionnal API and options', function(done) {
        var stream1 = new Stream.PassThrough()
          , stream2 = new Stream.PassThrough()
          , stream3 = new Stream.PassThrough()
        ;
        getStreamText(StreamMerge({pause: true},
          function() {
            return writeToStream(new Stream.PassThrough(), ['wa','dup']);
          }, function() {
            return writeToStream(new Stream.PassThrough(), ['pl','op']);
          }, function() {
            return writeToStream(new Stream.PassThrough(), ['ki','koo','lol']);
          }), function(data) {
            assert.equal(data, 'wadupplopkikoolol');
            done();
          });
      });

      it('should work with POO API', function(done) {
        var queue = new StreamMerge();
        queue.add(function() {
          return writeToStream(new Stream.PassThrough(), ['wa','dup']);
        });
        queue.add(function() {
          return writeToStream(new Stream.PassThrough(), ['pl','op']);
        });
        queue.add(function() {
          return writeToStream(new Stream.PassThrough(), ['ki','koo','lol']);
        });
        assert.equal(queue.length, 3);
        getStreamText(queue, function(data) {
          assert.equal(data, 'wadupplopkikoolol');
          done();
        });
        queue.done();
      });

      it('should work with POO API and options', function(done) {
        var queue = new StreamMerge({});
        queue.add(function() {
          return writeToStream(new Stream.PassThrough(), ['wa','dup']);
        });
        queue.add(function() {
          return writeToStream(new Stream.PassThrough(), ['pl','op'])
        });
        queue.add(function() {
          return writeToStream(new Stream.PassThrough(), ['ki','koo','lol'])
        });
        assert.equal(queue.length, 3);
        getStreamText(queue, function(data) {
          assert.equal(data, 'wadupplopkikoolol');
          done();
        });
        queue.done();
      });

      it('should work with POO API and a late done call', function(done) {
        var queue = new StreamMerge();
        queue.add(function() {
          return writeToStream(new Stream.PassThrough(), ['wa','dup']);
        });
        queue.add(function() {
          return writeToStream(new Stream.PassThrough(), ['pl','op'])
        });
        queue.add(function() {
          return writeToStream(new Stream.PassThrough(), ['ki','koo','lol'])
        });
        assert.equal(queue.length, 3);
        getStreamText(queue, function(data) {
          assert.equal(data, 'wadupplopkikoolol');
          done();
        });
        setTimeout(function() {
          queue.done();
        }, 100);
      });

      it('should reemit errors', function(done) {
        var gotError = false;
        var queue = new StreamMerge();
        queue.add(erroredStream('Aouch!'));
        queue.add(function() {
          return writeToStream(new Stream.PassThrough(), ['wa','dup']);
        });
        queue.add(function() {
          return writeToStream(new Stream.PassThrough(), ['pl','op'])
        });
        queue.add(function() {
          return writeToStream(new Stream.PassThrough(), ['ki','koo','lol'])
        });
        assert.equal(queue.length, 4);
        queue.on('error', function(err) {
          assert.equal(err.message, 'Aouch!')
          done();
        });
        getStreamText(queue, function(data) {});
        queue.done();
      });

    });

  });

  describe('in object mode', function() {

    it('should work', function(done) {
      var queue = new StreamMerge({objectMode: true});
      queue.add(writeToStream(new Stream.PassThrough({objectMode: true}), [{s:'wa'},{s:'dup'}]));
      queue.add(writeToStream(new Stream.PassThrough({objectMode: true}), [{s:'pl'},{s:'op'}]));
      queue.add(writeToStream(new Stream.PassThrough({objectMode: true}), [{s:'ki'},{s:'koo'},{s:'lol'}]));
      getStreamObjs(queue, function(data) {
        assert.deepEqual(data, [{s:'wa'},{s:'dup'},{s:'pl'},{s:'op'},{s:'ki'},{s:'koo'},{s:'lol'}]);
        done();
      });
      queue.done();
    });

  });

});

});

// Helpers
function getStreamText(stream, cb) {
  var text = '';
  stream.on('readable', function () {
    var chunk;
    do {
      chunk = stream.read();
      if(chunk !== null) {
        text += chunk.toString();
      }
    } while(chunk !== null);
  });
  stream.on('end', function () {
    cb(text);
  });
}

function getStreamObjs(stream, cb) {
  var objs = [];
  stream.on('readable', function () {
    var obj;
    do {
      obj = stream.read();
      if(obj !== null) {
        objs.push(obj);
      }
    } while(obj !== null);
  });
  stream.on('end', function () {
    cb(objs);
  });
}
