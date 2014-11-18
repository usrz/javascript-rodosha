Slaves and Node.JS
==================

The _Slaves API_ also works under [_Node.JS_](http://nodejs.org/) (barely)
with minimal support for `Blob`s and `Worker`s.

Installation should be fairly trivial:

```bash
npm install https://github.com/usrz/javascript-slaves/tarball/master
```

The `slave` main creation endpoint is exposed through the usual `require`
mechanism:

```javascript
var slaves = require('slaves');
slaves.create().then(function(slave) {
  // Here we have the "slave" instance...
});
```

This basic implementation relies on _Node_'s own
[`child_process`](http://nodejs.org/api/child_process.html)
package, therefore _slaves_ are forked off in a separate child process
and do not interfere with _Node_'s main event loop.
