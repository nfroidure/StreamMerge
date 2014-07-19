# StreamMerge
> StreamMerge pipe the given streams one by one once they are readable and
 preserve their content integrity.

[![NPM version](https://badge.fury.io/js/streammerge.png)](https://npmjs.org/package/streammerge) [![Build Status](https://travis-ci.org/nfroidure/StreamMerge.png?branch=master)](https://travis-ci.org/nfroidure/StreamMerge) [![Dependency Status](https://david-dm.org/nfroidure/streammerge.png)](https://david-dm.org/nfroidure/streammerge) [![devDependency Status](https://david-dm.org/nfroidure/streammerge/dev-status.png)](https://david-dm.org/nfroidure/streammerge#info=devDependencies) [![Coverage Status](https://coveralls.io/repos/nfroidure/StreamMerge/badge.png?branch=master)](https://coveralls.io/r/nfroidure/StreamMerge?branch=master)

## Usage
Install the [npm module](https://npmjs.org/package/streammerge):
```sh
npm install streammerge --save
```
Then, in your scripts:
```js
var streammerge = require('streammerge');

streammerge(
  Fs.createReadStream('input.txt'),
  Fs.createReadStream('input2.txt'),
  Fs.createReadStream('input3.txt')
).pipe(process.stdout);
```
StreamMerge also accept functions returning streams, the above can be written
 like this, doing system calls only when piping:
```js
var streammerge = require('streammerge');

streammerge(
  Fs.createReadStream.bind(null, 'input.txt'),
  Fs.createReadStream.bind(null, 'input2.txt'),
  Fs.createReadStream.bind(null, 'input3.txt')
).pipe(process.stdout);
```

Object-oriented traditionnal API offers more flexibility:
```js
var StreamMerge = require('streammerge');

var mergeStream = new StreamMerge();
mergeStream.add(
  Fs.createReadStream('input.txt'),
  Fs.createReadStream('input2.txt'),
  Fs.createReadStream('input3.txt')
);
mergeStream.done();

mergeStream.pipe(process.stdout);
```
You can also chain StreamMerge methods like that:
```js
var StreamMerge = require('streammerge');

new StreamMerge()
  .add(Fs.createReadStream('input.txt'))
  .add(Fs.createReadStream('input2.txt'))
  .add(Fs.createReadStream('input3.txt'))
  .done()
  .pipe(process.stdout);
```

You can add new streams at any moment until you call the done() method. So the
 created stream will not fire the end event until done() call.

## API

### StreamMerge([options], [stream1, stream2, ... streamN])

#### options

##### options.objectMode
Type: `Boolean`
Default value: `false`

Use if piped in streams are in object mode. In this case, the merge stream will
 also be in the object mode.

##### options.*

StreamMerge inherits of Stream.Readable, the options are passed to the
 parent constructor so you can use it's options too.

#### streamN
Type: `Stream`

Append streams given in argument to the merge and ends when each streams are consumed.

### StreamMerge.add(stream1, [stream2, ... streamN])

Append streams given in argument to the merge.

### StreamMerge.done([stream1, stream2, ... streamN])

Append streams given in argument to the merge and ends when each streams are consumed.

## Stats

[![NPM](https://nodei.co/npm/streammerge.png?downloads=true&stars=true)](https://nodei.co/npm/streammerge/)
[![NPM](https://nodei.co/npm-dl/streammerge.png)](https://nodei.co/npm/streammerge/)


## Contributing
Feel free to pull your code if you agree with publishing it under the MIT license.

