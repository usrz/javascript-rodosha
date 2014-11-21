USRZ Rodosha API
================

<div class="nojsdoc">
  <p><strong>It also works in <a href="NODE.md">Node.JS</a>.</strong></p>
</div>

Rodosha (&#x52b4;&#x50cd;&#x8005; - or _"worker"_ in Japanese) are an easier
way to deal with multi-threading in the browser by using
[_Web Workers_](https://developer.mozilla.org/en-US/docs/Web/Guide/Performance/Using_web_workers)

The implementation is wrapped in a `rodosha`
[_Esquire_](https://github.com/usrz/javascript-esquire) module which provides
a `create(...)` method. This method will return a `Promise` which will be
resolved with the instance of the `Rodosha` or rejected with a failure:

```javascript
esquire.inject(['rodosha'], function(rodoshaFactory) {
  rodoshaFactory.create().then(function(rodosha) {
    // foo! do something...
  });
})
```

`Rodosha`s operate mainly of _Esquire_ modules which can be imported directly
in a remote `worker`:

```javascript
rodosha.import('module-a', 'module-b').then(function(imported) {
  // the modules (and all their dipendencies) were imported...
});
```

Object proxies
--------------

After those modules are imported, local **proxy** objects pointing to their
instances in the worker can be created quite trivially:

```javascript
rodosha.proxy('module-a').then(function(proxy) {
  // the "proxy" variable is a local object proxying an instance in the worker
})
```

Any method and variable in objects being proxied will be replaced with a
`Promise`, and method execution, or value retrieval will trigger a message,
be executed in the `Worker` and its result will resolve or reject the promise.

So if a module defines a method called `foo()` and a variable `bar` like:

```javascript
{
  foo: function(arg) {
    return "Called with " + arg;
  },
  bar: "hello, world"
}
```

It's proxy will return promises for both:

```javascript
proxy.foo("my value").then(result) {
  // result will be "Called with my value"
}
proxy.bar.then(value) {
  // value will be "hello world"
}
```

What will happen under the covers is that _messages_ will be sent to the
`Worker` asking for the method to be executed in its remote native thread (or
the variable's value to be evaluated) and once a response is received locally
the returned promises will be resolved or rejected.

Proxies from functions
----------------------

A special note for `function` calls is that their return values can also be
retrieved as a **proxy** object by invoking the `asProxy()` method on the
returned promise.

So, for example, if a function is defined as:

```javascript
function gimmeAnObject() {
  // this will return a complex object, with functions and properties
}
```

Locally its result can be used through a **proxy** (henceforth, its methods
will still be invoked - and variables evaluated - in the `Worker`):

```javascript
proxy.gimmeAnObject().asProxy().then(function(newProxy) {
  // newProxy will be a proxy object to what's returned...
})
```

Cleaning up
-----------

Proxies can (should) be discarded when no longer needed, freeing up memory
in the `Worker`:

```javascript
rodosha.destroy(proy);
```

The `Worker` itself can be closed gracefully

```javascript
rodosha.close().then(function() {
  // nicely closed
});
```

or terminated abruptly calling `rodosha.terminate()`.

<div class="nojsdoc">
  <h2>Further reading</h2>
  <p>Licensed under the <a href="LICENSE.md">Apache Software License 2.0</a></p>
  <p>The full API documentation is avaiblable
  <a target="_blank" href="http://usrz.github.io/javascript-rodosha/">here</a>.</p>
</div>
