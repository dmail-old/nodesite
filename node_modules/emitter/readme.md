Emitter
=============

Emit and listen events

## Example

```javascript
var emitter = require('emitter').create();
var readListener = function(){};

// add listener
emitter.on('read', readListener);
// remove listener
emitter.off('read', readListener);
// add volatile listener
emitter.once('read', readListener);
// call listeners
emitter.emit('read', 'hello', 'world');
// apply listeners
emitter.applyListeners('read', ['hello', 'world']);
```

## getNotifier(name)

Returns or create a notifier object holding the listeners for the name event, see [notifier](../notifier).

## addListener(name, listener, bind = null, once = false)

Add listener to the name event listeners

## removeListener(name, listener, bind = null)

Remove listener from the name event listeners

## removeListener(name)

Remove all listener for the name event

## removeListener()

Remove all listeners

## callListeners(event, ...)

Call event listeners with supplied arguments

## applyListeners(event, args)

Call event listeners with args

## addVolatileListener(event, listener, bind = null)

Same as addListener() but the listener will be removed before being called

## disable(name)

Disabled the notifier associated with the name event

## enable(name)

Enable the notifier associated with the name event

## clear()

Remove all listeners & remove any references to external/internal objects

## eventArgumentAPI

This API is used by on(), off(), once() and emit(). It uses Spaced String, Array, and Object to manipulate multiple event.

```javascript
var emitter = require('emitter').create();
var listener = function(){};
var otherlistener = function(){};

// Spaced String will add listener to both 'eventA' and 'eventB'
emitter.on('eventA eventB', listener);
// Array will add listener to both 'eventA' and 'eventB'
emitter.on(['eventA', 'eventB', listener];
// Object will add listener to 'eventA' and otherlistener to 'eventB'
emitter.on({
  eventA: listener,
  eventB: otherlistener
});
```

## on(event, listener)

addListener using [eventArgumentAPI](#eventArgumentAPI)

## off(event, listener)

removeListener using [eventArgumentAPI](#eventArgumentAPI)

## once(event, listener)

addVolatileListener using [eventArgumentAPI](#eventArgumentAPI)

## emit(event, ...)

callListeners using [eventArgumentAPI](#eventArgumentAPI)

## bind

Bind is the default context for function listeners, by default it's the emitter

## method

Method is the default method for object listeners, by default it's 'handleEvent'
