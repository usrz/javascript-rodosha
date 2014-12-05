'use strict';

/**
 * A module wrapping the {@link Rodosha} client code (basically the code
 * executed by the {@link Worker} in order to process and respond to messages
 * from the {@link Server}).
 *
 * @module rodosha/client
 */
Esquire.define('rodosha/client', ['$global', '$esquire', 'rodosha/messages'], function($global, $esquire, messages) {

  /* ======================================================================== */
  /* OBJECT PROXIES                                                           */
  /* ======================================================================== */

  /* Create a proxy definition */
  function defineProxy(object, stack) {
    if (! stack) stack = [];

    /* Non-null, non-array objects will be defined recursively */
    if (object &&
        ((typeof(object) === 'object') || (typeof(object) === 'function')) &&
        (!Array.isArray(object))) {

      /* Just triple check */
      if (stack.indexOf(object) >= 0) {
        throw new TypeError("Unable to proxy object: circular reference detected");
      }

      /* Definition, and functions are invokable */
      var definition = {};
      if (typeof(object) === 'function') definition["__$$invocable$$__"] = true;

      /* Recursively define this object */
      stack.push(object);
      for (var i in object) {
        definition[i] = defineProxy(object[i], stack);
      }
      stack.pop();
      return definition;

    }

    /* Everything else is just a getter */
    return { "__$$value$$__": object };
  }

  /* Make a proxy and return a valid response */
  function makeProxy(object) {
    if (((typeof(object) === 'object') && (!Array.isArray(object))) ||
        (typeof(object) === 'function')) {

      /* Only non-array objects and functions get proxied */
      var proxyId = messages.addProxy(object);
      var definition = defineProxy(object);
      return { proxy: { id: proxyId, definition: definition }};

    } else {

      /* Arrays and normal objects go through as values */
      return { resolve: object };
    }
  }

  /* ======================================================================== */
  /* MESSAGES                                                                 */
  /* ======================================================================== */

  function Request(event) {
    var id = event.data.id;
    if (id == null) throw new Error("No ID for message " + JSON.stringify(event.data));

    this.data = messages.decode(event.data);
    this.id = this.data.id;
  }

  Request.prototype.accept = function(data) {
    try {
      if (data && typeof(data.then) === 'function') {
        var message = this;
        data.then(
          function(success) { message.accept(success) },
          function(failure) { message.reject(failure) }
        );
      } else if (data === undefined) {
        $global.postMessage({ id: this.id, resolve: true, undefined: true });
      } else if (data === null) {
        $global.postMessage({ id: this.id, resolve: true, null: true });
      } else {
        var response = this.data.makeProxy ? makeProxy(data) : { resolve: messages.encode(data) };
        response.id = this.id;
        $global.postMessage(response);
      }
    } catch (error) {
      $global.postMessage({ id: this.id, reject: messages.encode(error) });
    }
  }

  Request.prototype.reject = function(data) {
    $global.postMessage({ id: this.id, reject: messages.encode(data) });
  }

  /* ======================================================================== */
  /* CLIENT LOOP                                                              */
  /* ======================================================================== */

  /**
   * Initialize the {@link Worker} side.
   *
   * @function module:rodosha/client.init
   * @param {boolean} [debug] - If `true` debug messages will be sent over and
   *                            logged on the {@link Server}'s console.
   */
  return Object.freeze({ init: function(debug) {

    /* Logging emulation */
    var console = $global.console = {
      error: function() { $global.postMessage({console: 'error', arguments: messages.encode(arguments)}) },
      warn:  function() { $global.postMessage({console: 'warn',  arguments: messages.encode(arguments)}) },
      log:   function() { $global.postMessage({console: 'log',   arguments: messages.encode(arguments)}) },
      info:  function() { $global.postMessage({console: 'info',  arguments: messages.encode(arguments)}) },
      debug: debug ?
             function() { $global.postMessage({console: 'debug', arguments: messages.encode(arguments)}) }:
             function() {},
      clear: function() {}
    };

    /* Our message handler */
    $global.onmessage = function(event) {
      var message = new Request(event);

      /* Handler for messages */
      try {

        /* Esquire definitions */
        if (message.data.module) {
          var module = message.data.module;
          if (Esquire.modules[module.name]) {
            console.warn("Module '" + module.name + "' already defined");
          } else {
            console.debug("Module '" + module.name + "' defined successfully");
            Esquire.define(module);
          }
          message.accept(module.name);
        }

        /* Proxy object request */
        else if (message.data.require) {
          message.accept($esquire.require(message.data.require));
        }

        /* Invoke method on or return value for proxied object */
        else if (message.data.proxy) {
          var proxy = message.data.proxy;
          var result = messages.proxies;
          var target = null;
          var targetName = null;
          for (var i in proxy.proxy) {
            var property = proxy.proxy[i];
            if (property in result) {
              target = result;
              targetName = property;
              result = result[property];
            } else {
              throw new Error("Proxy '" + proxy.proxy.join('.') + "' not found");
            }
          }

          if (typeof(result) === 'function') {
            if (message.data.newInstance === true) {
              /* Construct new object instance */
              message.accept((function(result, args) {
                function Constructor() { result.apply(this, args) };
                Constructor.prototype = result.prototype;
                return new Constructor();
              })(result, proxy.arguments));
            } else {
              /* Simply invoke the function */
              message.accept(result.apply(target, proxy.arguments));
            }
          } else if (proxy.value) {
            message.accept(target[targetName] = proxy.value);
          } else {
            message.accept(result);
          }
        }

        /* Gracefully close this */
        else if (message.data.destroy) {
          messages.deleteProxy(message.data.destroy);
        }

        /* Gracefully close this */
        else if (message.data.close) {
          $global.close();
          message.accept();
        }

        /* Any other message fails */
        else throw new Error("Usupported message: " + JSON.stringify(event.data));

      } catch (error) {
        message.reject(error);
      }
    }

    /* Decode context functions on init */
    console.log("Initialized worker thread from " + $global.location.href);
    $global.postMessage({initialized: Object.keys(Esquire.modules)});
  }});

});
