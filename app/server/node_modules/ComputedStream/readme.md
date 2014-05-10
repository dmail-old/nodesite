ComputedStream
=============

ComputedStream is a [Duplex Stream](http://nodejs.org/api/stream.html#stream_class_stream_duplex) that maintains order of piped streams

## Example

```javascript
var ComputedStream = require('ComputedStream');
var computedStream = ComputedStream.new();

computedStream.chain(require('fs').createReadStream('readme.md'));
computedStream.chain(new require('iconv').Iconv('UTF-8', 'ISO-8859-1')); // convert utf8 into iso-8859-1
computedStream.chain(require('zlib').createGzip()); // gzip stream

computedStream.on('data', function(chunk){
	// chunk is a buffer containing readme.md bytes encoded in 'ISO-8859-1' and gzipped
});

```

## Requirements

TODO

## ComputedStream.chain(stream)

Add a stream that will be piped after. First chained stream can be readable only others must be readable & writable.

## ComputedStream.resolve()

Pipe chained stream into computedStream. Piping is delayed to control when error are produced.

## Error handling

If a stream piped to computedStream has no listener for the 'error' event, 'error' event is fired on computedStream

```javascript
computedStream.on('error', function(error){
	// error could come from fileStream, iconvStream or gzipStream
});
```
