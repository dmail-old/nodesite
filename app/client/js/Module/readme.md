Module
=============

Implement module client side

## Example

```javascript
// require a relative module
require('../test/submodule');

// require an absolute module
require('modulename');

window.module; // new Module('/')
window.__dirname; // '/'
window.__filename; // '/'
window.require; // window.module.require.bind(window.module);
```

## Requirements

NONE

## new Module(filename, parent)

Create a module located at filename, used internally you don't need to instantiate module by yourself.

## Module.filename

Filename leading to the module server side.

## Module.parent

Parent of this module. When a module requires an other he is considered parent of the required module.

## Module.source

Javascript source that will be evaluated when module is required.

## Module.load()

Load source with a synchronous AJAX request at module.filename

## Module.exports

What module provides is contained in Module.exports, it can be anything.

## Module.compile()

Eval source in a specific context

```javascript
window.ok = false;
var test = new Module();
test.source = "var ok = true; module.exports = 'yo';";
test.compile();

window.ok; // false
test.exports; // 'yo'
```

## Context of module evaluation

Module.source is evaluated as if it was written in the following anonymous function:

```javascript
(function(exports, require, module, __dirname, __filename){
	// source here
});
```

## Module.resolve(path)

Resolve path into a module filename. throw Module not found error if path doesn't lead to a module.

## Module.resolvedPaths

Cache resolvedPaths for this module.

## Module.require(path)

Call Module.resolve(path), create a module, loads corresponding sources, compiles it and returns module.exports.  

## Module.cache

Cache module instance by filename