Rodosha and Node.JS
===================

The _Rodosha API_ also works under [_Node.JS_](http://nodejs.org/) (barely)
with minimal support for `Blob`s and `Worker`s.

Installation should be fairly trivial:

```bash
npm install https://github.com/usrz/javascript-rodosha/tarball/master
```

The `rodosha` main creation endpoint is exposed through the usual `require`
mechanism:

```javascript
var rodoshaFactory = require('rodosha');
rodoshaFactory.create().then(function(rodosha) {
  // Here we have the "Rodosha" instance...
});
```

This basic implementation relies on _Node_'s own
[`child_process`](http://nodejs.org/api/child_process.html)
package, therefore `Rodosha`'s are forked off in a separate child process
and do not interfere with _Node_'s main event loop.
