var isStream = require('isstream')
  , Stream = require('readable-stream')
  , StreamQueue = require('streamqueue')
  , util = require('util')
;

// Inherit of PassThrough stream
util.inherits(StreamMerge, Stream.PassThrough);

// Constructor
function StreamMerge(options) {
  var _self = this;

  options = options || {};

  // Ensure new were used
  if (!(this instanceof StreamMerge)) {
    return new (StreamMerge.bind.apply(StreamMerge,
      [StreamMerge].concat([].slice.call(arguments, 0))));
  }

  // Parent constructor
  Stream.PassThrough.call(this,
    isStream(options)  || 'function' === typeof options
      ? undefined
      : options
  );

  // Private props
  this._mergeState = {
    _streams: [],
    _ending: false,
    _ended: false
  };

  // Creating the queue
  this._queue = new StreamQueue(
    isStream(options)  || 'function' === typeof options
      ? undefined
      : options
  );

  // Pipe the queue in
  _self._queue.pipe(_self);
  

  // Reemit errors
  this._queue.on('error', function queueErrorHandler(err) {
    _self.emit('error', err);
  });

  // Add given streams and ends
  if(arguments.length > 1 || isStream(options)
    || 'function' === typeof options) {
    this.done.apply(this,
      [].slice.call(
        arguments, isStream(options) ||
          'function' === typeof options ? 0 : 1
      )
    );
  }

}

// Add each stream given in argument
StreamMerge.prototype.add = function() {
  var streams = [].slice.call(arguments, 0)
    , _self = this;

  if(this._mergeState._ending) {
    throw new Error('Cannot add more streams to the merge.');
  }

  streams = streams.map(function(stream) {
    // Get streams from functions
    if('function' === typeof stream) {
      stream = stream();
    }
    return stream;
  }).filter(function(stream, i) {
    // Reemit errors
    stream.on('error', function(err) {
      _self.emit('error', err);
    });
    // Immediatly queue streams with things in their buffer
    if(stream._readableState.buffer.length) {
      _self._queue.queue(stream);
      return false;
    }
    // Queue streams once they are readable
    stream.once('readable', function() {
      _self._mergeState._streams.splice(_self._mergeState._streams.indexOf(stream), 1);
      _self._queue.queue(stream);
      if(_self._mergeState._ending && (!_self._mergeState._ended) && !_self._mergeState._streams.length) {
        _self._queue.done();
      }
    });
    // Streams may end without emitting readable at all
    stream.once('end', function() {
      var index = _self._mergeState._streams.indexOf(stream);
      if(-1 !== index) {
        _self._mergeState._streams.splice(_self._mergeState._streams.indexOf(stream), 1);
        if(_self._mergeState._ending && (!_self._mergeState._ended) && !_self._mergeState._streams.length) {
          _self._queue.done();
        }
      }
    });
    return true;
  });

  this._mergeState._streams = this._mergeState._streams.length ? this._mergeState._streams.concat(streams) : streams;

  return this;

};

// Add each stream given in argument and ends
StreamMerge.prototype.done = function() {
  if(this._mergeState._ending) {
    throw new Error('The merge is already ending.');
  }
  if(arguments.length) {
    this.add.apply(this, arguments);
  }
  this._mergeState._ending = true;
  if(!this._mergeState._streams.length) {
    this._queue.done();
    this._mergeState._ended = true;
  }
  return this;
}

// Length
Object.defineProperty(StreamMerge.prototype, 'length', {
  get: function() {
    return this._mergeState._streams.length + this._queue.length;
  }
});

module.exports = StreamMerge;
