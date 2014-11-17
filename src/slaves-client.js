'use strict';

/**
 * A module wrapping the {@link Slave} client code (basically the code executed
 * by the {@link Worker} when starting up.
 *
 * @module slave/client
 */
Esquire.define('slaves/client', ['$window', '$esquire', 'slaves/messages'], function($window, $esquire, messages) {

  function defineProxy(object, stack) {
    if (! stack) stack = [];

    /* Functions always get invoked */
    if (typeof(object) === 'function') {
      return true; // invoke
    }

    /* Non-array objects will be defined recursively */
    if ((typeof(object) === 'object') && (!Array.isArray(object))) {

      /* Just triple check */
      if (stack.indexOf(object) >= 0) {
        throw new TypeError("Unable to proxy object: circular reference detected");
      }

      /* Recursively define this object */
      stack.push(object);
      var definition = {};
      for (var i in object) {
        definition[i] = defineProxy(object[i], stack);
      }
      stack.pop();
      return definition;

    }

    /* Everything else is just a getter */
    return false;
  }

  /**
   * Initialize the {@link Worker} side.
   *
   * @function init
   */
  function init() {

    /* Remember the proxies we created */
    var proxies = {};
    var lastProxyId = 0;
    function makeProxy(object) {
      if (((typeof(object) === 'object') && (!Array.isArray(object))) ||
          (typeof(object) === 'function')) {

        /* Only non-array objects and functions get proxied */
        var proxyId = "proxy_" + (++ lastProxyId);
        proxies[proxyId] = object;
        var definition = defineProxy(object);
        return { proxy: proxyId, object: object, definition: definition };

      } else {

        /* Arrays and normal objects go through as values */
        return { value: object };
      }
    }

    /* Encoding and decoding of messages */
    var encode = messages.encode;
    var decode = messages.decode;

    /* Logging emulation */
    $window.console = {
      error: function() { $window.postMessage({id: 'console', method: 'error', arguments: encode(arguments)}) },
      warn:  function() { $window.postMessage({id: 'console', method: 'warn',  arguments: encode(arguments)}) },
      log:   function() { $window.postMessage({id: 'console', method: 'log',   arguments: encode(arguments)}) },
      info:  function() { $window.postMessage({id: 'console', method: 'info',  arguments: encode(arguments)}) },
      debug: function() { $window.postMessage({id: 'console', method: 'debug', arguments: encode(arguments)}) },
      clear: function() {}
    };

    /* Resolve remotely */
    function resolve(id, data) {
      if (data && typeof(data.then) === 'function') {
        data.then(
          function(success) { resolve(id, success) },
          function(failure) { reject(id,  failure) });
      } else {
        $window.postMessage({ id: id, resolve: encode(data) });
      }
    }

    /* Resolve remotely */
    function reject(id, data) {
      $window.postMessage({ id: id, reject: encode(data) });
    }

    /* Our message handler */
    $window.onmessage = function(event) {

      /* Basic check */
      var id = event.data.id;
      if (! id) {
        console.error("No ID for message", event.data);
      }

      /* Handler for messages */
      else try {

        /* Our data object */
        var data = messages.decode(event.data);

        /* Esquire definitions */
        if (data.define) {
          var module = data.define;
          if (Esquire.modules[module.name]) {
            console.warn("Module '" + module.name + "' already defined");
          } else {
            console.debug("Module '" + module.name + "' defined successfully");
            Esquire.define(module);
          }
          resolve(id, Esquire.module(module.name).name);
        }

        /* Proxy object request */
        else if (data.proxy) {
          resolve(id, makeProxy($esquire.require(data.proxy)));
        }

        /* Return value for proxied object */
        else if (data.get) {
          var get = data.get;
          var result = proxies;
          for (var i in get.proxy) {
            result = result[get.proxy[i]];
          }

          resolve(id, result);
        }

        /* Invoke method on proxy */
        else if (data.invoke) {
          var invoke = data.invoke;
          var object = proxies;
          var target = null;
          for (var i in invoke.proxy) {
            target = object;
            object = object[invoke.proxy[i]];
          }

          resolve(id, object.apply(target, invoke.arguments));
        }

        /* Any other message fails */
        else if (data.close) {
          resolve(id, { close: $window.close() });
        }

        /* Any other message fails */
        else {
          throw new Error("Usupported message: " + JSON.stringify(event.data));
        }

      } catch (error) {
        reject(id, error);
      }
    }

    /* Decode context functions on init */
    console.debug("Initialized worker thread from " + $window.location.href);
    resolve('initialized', Object.keys(Esquire.modules));
  };

  return Object.freeze({ init: init });

});
