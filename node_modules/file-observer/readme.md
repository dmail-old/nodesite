FileObserver
=============

Call a listener when a file is changed

## Example

```javascript
var FileObserver = require('file-observer');

FileObserver.observe('nodesite/app/config', function(){
  // make server restart
});
```

## Requirements

- Notifier