# argv

Parse / prepare process.argv

## parse(argv)

```javascript
var parse = function(str){
  require('argv').parse(str.split(' '), 0);
};

parse('--keepalive'); // {keepalive: true}
parse('--keepalive=false'); // {keepalive: false}
parse('--keepalive=foo'); // {keepalive: 'foo'}
parse('foo=bar bar=bat'); // {foo: 'bar', bar: 'bar'}
parse('node manage test --keepalive'); // {'0': 'node', '1': 'manage', '2': 'test', 'keepalive': true}
```

## prepare(args)
```javascript
var stringify = function(args){
  require('argv').prepare(args).join(' ');
};

stringify(['foo', 'bar']); // 'foo bar'
stringify({foo: 'bar', bar: 'bat'}); // 'foo=bar bar=bat'
```
