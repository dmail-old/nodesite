# nodesite [![Build Status](https://travis-ci.org/dmail/nodesite.svg)](http://travis-ci.org/dmail/nodesite)

A node framework for web applications. 

WARNING: Unstable!! In developement.

## Client compatibility

- IE 9+
- Firefox 6+
- Chrome 2+
- Opera 11.5+
- Safari 5.1+

## How modules are shared by client&server?

Module are client and server side are node (CommonJS) modules.  
Client requires modules `synchronously` with an AJAX request to the server.

- [client/js/Module](/app/client/js/Module)
- [router/middleware/module](/app/server/node_modules/Router/middleware/module)

## Main shared modules

- [core](/app/node_modules/core)
- [proto](/app/node_modules/proto)
- [Emitter](/app/node_modules/Emitter)
- [StringTemplate](/app/node_modules/StringTemplate)
- [PropertyAccessorObserver](/app/node_modules/PropertyAccessorObserver)

## Main server modules

- [Router](/app/server/node_modules/Router)
- [database](/app/server/node_modules/localDB)

## Main client modules

- [dom](/app/client/node_modules/dom)
- [MDV](/app/client/node_modules/mdv)
