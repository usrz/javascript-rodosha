(function() {
/** @typedef {module:slaves.Slave} Slave */

/* ========================================================================== */

/**
 * @protected
 * @class Promise
 * @classdesc The {@link Promise} interface is used for deferred and
 * asynchronous computations.
 */

/**
 * Appends fulfillment and rejection handlers to this {@link Promise}, and
 * returns a **new** promise resolving to the return value of the called
 * handler.
 *
 * @param {function} [onSuccess] - The handler to call when this
 *        {@link Promise} has been successfully resolved.
 * @param {function} [onFailure] - The handler to call when this
 *        {@link Promise} has been rejected.
 * @returns {Promise} A new {@link Promise} resolving to the return value
 *          of the called handler
 * @instance
 * @function Promise#then
 */

/**
 * Appends a rejection handler to this {@link Promise}, and returns a
 * **new** promise resolving to the return value of the called handler.
 *
 * This is equivalent to calling `then(null, onFailure)`.
 *
 * @param {function} [onFailure] - The handler to call when this
 *        {@link Promise} has been rejected.
 * @returns {Promise} A new {@link Promise} resolving to the return value
 *          of the called handler
 * @instance
 * @function Promise#catch
 */

/**
 * @protected
 * @class Worker
 * @classdesc The {@link Worker} interface represents a background task (it
 * spawns real OS-level threads) that can be easily created and can send
 * messages back to their creators.
 */

/**
 * An event listener that is called whenever an error bubbles through the
 * {@link Worker}.
 *
 * @member Worker#onerror
 * @type function
 */

/**
 * An event listener that is called whenever a message bubbles through the
 * {@link Worker}. The message is stored in the event's `data` property.
 * {@link Worker}.
 *
 * @member Worker#onerror
 * @type function
 */

/**
 * Sends a message, that is any JavaScript object to the worker's inner scope.
 *
 * @function Worker#postMessage
 * @param {*} message - The message to send to the worker.
 */

/**
 *
 * Immediately terminates the worker. This does not offer the worker an
 * opportunity to finish its operations; it is simply stopped at once.
 *
 * @function Worker#terminate
 */
;
'use strict';

/**
 * A module wrapping the {@link Slave} client code (basically the code executed
 * by the {@link Worker} in order to process messages from the {@link Server}).
 *
 * @module slaves/client
 */
Esquire.define('slaves/client', ['$window', '$esquire', 'slaves/messages'], function($window, $esquire, messages) {

  /* ======================================================================== */
  /* OBJECT PROXIES                                                           */
  /* ======================================================================== */

  var proxies = {};
  var lastProxyId = 0;

  /* Create a proxy definition */
  function defineProxy(object, stack) {
    if (! stack) stack = [];

    /* Functions always get invoked */
    if (typeof(object) === 'function') {
      return true; // invoke
    }

    /* Non-null, non-array objects will be defined recursively */
    if (object && (typeof(object) === 'object') && (!Array.isArray(object))) {

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

  /* Make a proxy and return a valid response */
  function makeProxy(object) {
    if (((typeof(object) === 'object') && (!Array.isArray(object))) ||
        (typeof(object) === 'function')) {

      /* Only non-array objects and functions get proxied */
      var proxyId = "proxy_" + (++ lastProxyId);
      proxies[proxyId] = object;
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
    if (data && typeof(data.then) === 'function') {
      var message = this;
      data.then(
        function(success) { message.accept(success) },
        function(failure) { message.reject(failure) }
      );
    } else if (data !== undefined) {
      var response = this.data.makeProxy ? makeProxy(data) : { resolve: messages.encode(data) };
      response.id = this.id;
      $window.postMessage(response);
    } else {
      $window.postMessage({ id: this.id, resolve: true });
    }
  }

  Request.prototype.reject = function(data) {
    $window.postMessage({ id: this.id, reject: messages.encode(data) });
  }

  /* ======================================================================== */
  /* CLIENT LOOP                                                              */
  /* ======================================================================== */

  /**
   * Initialize the {@link Worker} side.
   *
   * @function module:slaves/client.init
   * @param {boolean} [debug] - If `true` debug messages will be sent over and
   *                            logged on the {@link Server}'s console.
   */
  return Object.freeze({ init: function(debug) {

    /* Logging emulation */
    $window.console = {
      error: function() { $window.postMessage({console: 'error', arguments: messages.encode(arguments)}) },
      warn:  function() { $window.postMessage({console: 'warn',  arguments: messages.encode(arguments)}) },
      log:   function() { $window.postMessage({console: 'log',   arguments: messages.encode(arguments)}) },
      info:  function() { $window.postMessage({console: 'info',  arguments: messages.encode(arguments)}) },
      debug: debug ?
             function() { $window.postMessage({console: 'debug', arguments: messages.encode(arguments)}) }:
             function() {},
      clear: function() {}
    };

    /* Our message handler */
    $window.onmessage = function(event) {
      var message = new Request(event);

      if (message.foo) {console.log("FOO IS", message.foo)};

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
          message.accept(Esquire.module(module.name).name);
        }

        /* Proxy object request */
        else if (message.data.require) {
          message.accept($esquire.require(message.data.require));
        }

        /* Invoke method on or return value for proxied object */
        else if (message.data.proxy) {
          var proxy = message.data.proxy;
          var result = proxies;
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
            message.accept(result.apply(target, proxy.arguments));
          } else if (proxy.value) {
            message.accept(target[targetName] = proxy.value);
          } else {
            message.accept(result);
          }
        }

        /* Gracefully close this */
        else if (message.data.destroy) {
          if (message.data.destroy in proxies) {
            delete proxies[message.data.destroy];
            message.accept();
          } else {
            message.reject();
          }
        }

        /* Gracefully close this */
        else if (message.data.close) {
          $window.close();
          message.accept();
        }

        /* Any other message fails */
        else throw new Error("Usupported message: " + JSON.stringify(event.data));

      } catch (error) {
        message.reject(error);
      }
    }

    /* Decode context functions on init */
    console.log("Initialized worker thread from " + $window.location.href);
    $window.postMessage({initialized: Object.keys(Esquire.modules)});
  }});

});
;
'use strict';

/**
 * A module providing utility functions for encoding and decoding messages to
 * and from a {@link Worker}.
 *
 * @module slaves/messages
 */
Esquire.define('slaves/messages', [], function messages() {

  /**
   * @classdesc An {@link Error} received from or sent to a {@link Worker}.
   * @class RemoteError
   */
  function RemoteError(error) {
    /**
     * @member {string} message A message detailing the error.
     * @memberof module:slave/messages~RemoteError
     * @instance
     */
    var message = error.message || "Unknown error";
    var name = "RemoteError" + (error.name ? ("[" + error.name + "]") : "");
    Error.call(message);

    Object.defineProperties(this, {
      "message" : { enumerable: true, configurable: false, get:   function() { return message }},
      "name" :    { enumerable: true, configurable: false, get:   function() { return name    }},
      "toString": { enumerable: true, configurable: false, value: function() { return name + ": " + message }}
    });

    /**
     * @member {string} stack The stack trace associated with this instance,
     *                        combining both local and remote details.
     * @memberof module:slave/messages~RemoteError
     * @instance
     */
    if ((error.stack) || (this.stack)) {
      var localStack = this.stack;
      /* Setting "this.stack" won't work */
      Object.defineProperty(this, 'stack', { enumerable: false, configurable: false, get: function() {
        var stack = this.toString();
        if (error.stack) stack += "\nRemote stack: " + error.stack;
        if (localStack)  stack += "\nLocal stack:" + localStack;
        return stack;
      }});
    }
  }
  RemoteError.prototype = new Error;
  RemoteError.prototype.name = 'RemoteError';

  /* ======================================================================== */

  /*
   * Copy a source object onto a target, making sure we don't loop, and
   * encoding or decoding all of its members
   */
  function copy(source, target, stack, call) {
    /* Check the stack */
    if (stack.indexOf(source) >= 0) {
      throw new TypeError("Unable to (en|de)code object: circular reference detected");
    } else {
      stack.push(source);
    }

    /* PhantomJS's arguments are not enumerable */
    if (source.hasOwnProperty('callee') && (typeof(source.length) === 'number')) {
      for (var i = 0; i < source.length; i ++) {
        target[i] = call(source[i], stack);
      }
    } else {
      for (var i in source) {
        target[i] = call(source[i], stack);
      }
    }

    /* Pop source from stack and continue */
    stack.pop();
    return target;
  }

  /**
   * Encode a message prior to sending it over with `postMessage()`.
   *
   * @function encode
   * @param {*} decoded - The object to encode (anything, really)
   * @returns {*} The encoded object
   */
  function encode(decoded, stack) {
    if (!stack) stack = [];

    if (decoded === undefined) return undefined;
    if (decoded === null) return null;

    var type = typeof(decoded);
    if (type === 'undefined') return undefined;
    if (type === 'boolean') return decoded;
    if (type === 'number') return decoded;
    if (type === 'string') return decoded;
    if (type === 'function') return { "__$$function$$__": decoded.toString() };

    if (type === 'object') {

      /* Normal arrays */
      if (Array.isArray(decoded)) {
        return copy(decoded, [], stack, encode);
      }

      /* Arguments array */
      else if (decoded.hasOwnProperty('callee') && (typeof(arguments.length) === 'number')) {
        return copy(decoded, [], stack, encode);
      }

      /* Error object */
      else if (decoded instanceof Error) {
        var name = decoded.name || Object.getPrototypeOf(decoded).name;
        var message = decoded.message;
        var stack = decoded.stack;
        var error = {};
        if (name) error.name = name;
        if (message) error.message = message;
        if (stack) error.stack = stack;
        return { "__$$error$$__": error };
      }

      /* Other (normal) object */
      else return copy(decoded, {}, stack, encode);

    }
    return { "__$$typeof$$__": type };
  };

  /**
   * Decode a message after receiving it from `onessage()`.
   *
   * @function decode
   * @param {*} encoded - The object to decode (anything, really)
   * @returns {*} The decoded object
   */
  function decode(encoded, stack) {
    if (!stack) stack = [];

    if (encoded === undefined) return undefined;
    if (encoded === null) return null;

    var type = typeof(encoded);
    if (type === 'undefined') return undefined;
    if (type === 'boolean') return encoded;
    if (type === 'number') return encoded;
    if (type === 'string') return encoded;

    if (type === 'object') {

      if (Array.isArray(encoded)) {
        return copy(encoded, [], stack, decode);
      }

      else if (encoded["__$$error$$__"] != null) {
        return new RemoteError(encoded["__$$error$$__"]);
      }

      else if (encoded["__$$function$$__"] != null) {
        return eval('(' + encoded["__$$function$$__"] + ')');
      }

      /* Other (normal) object */
      else {
        return copy(encoded, {}, stack, decode);
      }
    }

    throw new TypeError("Error decoding " + type + ": " + JSON.stringify(encoded));
  }

  return Object.freeze({
    RemoteError: RemoteError,
    encode: encode,
    decode: decode
  });

});
;
'use strict';

/**
 * A module providing a utility function to wrap remote {@link Worker} objects.
 *
 * @module slaves/proxy
 */
Esquire.define('slaves/proxy', ['promize'], function(promize) {

  /**
   * @class module:slaves/proxy.ProxyPromise
   * @classdesc A specialized {@link Promise} returned by `function`s invoked
   *            on **proxy** objects.
   * @extends Promise
   */
  function ProxyPromise(message, send) {
    var promise = null;

    /**
     * Request that the object returned by the function call is stored as a
     * **proxy** by the {@link Worker}.
     *
     * This instance will wait sending the method request to the remote
     * {@link Worker} until a fulfillment or rejection handler is attached via
     * the {@link module:slaves/proxy.ProxyPromise#then then(...)} method.
     *
     * @function module:slaves/proxy.ProxyPromise#asProxy
     * @param {boolean} [proxy] If `true` (or unspecified) the object returned
     *                          by the call will be a **proxy** object.
     * @return {ProxyPromise} This `very` instance.
     * @exception This method will throw an {@link Error} if the underlying
     *            message requesting the call's result was already sent (if
     *            {@link module:slaves/proxy.ProxyPromise#then then(...)} was
     *            already called).
     */
    this.asProxy = function(proxy) {
      /* If we haven't sent the message, request a new proxy object */
      if (promise != null) throw new Error("Message already sent");
      if (proxy === undefined) proxy = true;
      if (proxy) message.makeProxy = true;
      return this;
    }

    this.then = function(onSuccess, onFailure) {
      /* Send the message if we haven't done so already */
      try {
        if (promise == null) promise = send(message);
      } catch (error) {
        promise = promize.Promise.reject(error);
      }
      /* Set up the promise's handlers */
      return promise.then(onSuccess, onFailure);
    }

  };

  ProxyPromise.prototype.catch = function(onFailure) {
    return this.then(null, onFailure);
  }

  /* ======================================================================== */

  function makeProxy(definition, names, send) {
    if (! names) throw new Error("No name proxying definition " + JSON.stringify(definition));
    if (! Array.isArray(names)) names = [ names ];

    /* Object definitions need to be re-wrapped */
    if (typeof(definition) === 'object') {

      var object = Object.defineProperty({}, "$$proxyId$$", {
        enumerable: false, configurable: false, value: names[0]
      });

      for (var i in definition) {
        (function(i) {
          var child = definition[i];
          var clone = names.slice(0);
          clone.push(i);

          /* Basic properties for the object to define */
          var props = { enumerable: true, configurable: false };

          if (typeof(child) === 'object') {
            /* Create dynamic proxies for nested definitions */
            props.get = function() { return makeProxy(child, clone, send) }

          } else if (child === true) {
            /* A function can be simply wrapped (call recursively) */
            props.value = makeProxy(child, clone, send);

          } else {
            /* All other properties just request values asynchronously */
            props['get'] = function() { return send({ proxy: { proxy: clone } })};
            props['set'] = function(v) { send({ proxy: { value: v, proxy: clone } }) };
          }

          /* Define the properties for this */
          Object.defineProperty(object, i, props);
        })(i);
      }

      return object;

    }

    /* The definition is "true" meaning "invoke me" */
    if (definition === true) {
      var clone = names.slice(0);
      return function() {
        /* Prepare our message and return a promise to send */
        var message = { proxy: { proxy: clone, arguments: arguments }};
        return new ProxyPromise(message, send);
      }
    }

    /* The definition is "false", meaning request a remote value */
    throw new Error("Wrong proxy definition for ", names);

  }

  /**
   * Wrap the specified **proxy** definition instrumenting all functions with
   * remote executors returning {@link module:slaves/proxy.ProxyPromise}s.
   *
   * @function module:slaves/proxy.buildProxy
   * @param {*} definition The definition to wrap
   * @return {object} A **proxy** object to an instance from the {@link Worker}.
   */
  function buildProxy(proxy, server) {
    var object = makeProxy(proxy.definition, [ proxy.id ], server.send);
    return Object.defineProperty(object, "$$proxyId$$", {
      enumerable: false, configurable: false, value: proxy.id
    });
  }

  return Object.freeze({ buildProxy: buildProxy });

});
;
'use strict';

/**
 * A module wrapping the {@link Slave} client code (basically the code executed
 * by the {@link Worker} when starting up.
 *
 * @module slaves/servers
 */
Esquire.define('slaves/servers', ['promize' ,'slaves/messages' ,'slaves/proxy'], function(promize, messages, proxy) {

  /**
   * Create a new {@link module:slaves/servers.Server Server} instance wrapping
   * a {@link Worker}.
   *
   * @function module:slaves/servers.create
   * @param {Worker} worker - The {@link Worker} to wrap.
   * @param {string} workerId - The unique identifier of the {@link Worker} for
   *                            logging and debugging purposes.
   * @param {boolean} [debug] - If `true` (lots of) debugging information will
   *                            be dumped to the console.
   * @return {Server} The newly created {@link Server} instance.
   */
  return Object.freeze({ create: function(worker, workerId, debug) {

    /* Messages ID and pending */
    var lastMessageId = 0;
    var pendingMessages = {};

    /* The modules injected in the worker */
    var injectedModules = {};

    /* ---------------------------------------------------------------------- */

    /**
     * @class module:slaves/servers.Server
     * @classdesc A wrapper for a remote {@link Worker} capable of sending
     *            messages to it and processing received messages.
     * @extends module:slaves.Slave
     */
    var server = Object.freeze({

      worker: worker,

      /**
       * Initialize this instance.
       *
       * @function module:slaves.Slave#init
       * @param {string[]} [modules] - An array of _Esquire_ module names known
       *                               to be available in the {@link Worker}
       * @return {module:slaves.Slave} This instance.
       */
      init: function(modules) {
        for (var i in modules) {
          injectedModules[modules[i]] = true;
        }
        return this;
      },

      /* -------------------------------------------------------------------- */

      /**
       * Encode and send the specified message to the {@link Worker}.
       *
       * @function module:slaves.Slave#send
       * @param {*} message - The message to be encoded and sent.
       * @return {Promise} A {@link Promise} to the response from the response.
       */
      send: function(message) {

        /* Sanity check */
        if (! worker) throw new Error("Worker " + workerId + " unavailable");

        /* Create and remember our deferred */
        var deferred = new promize.Deferred();

        /* Encode and remember this message */
        message.id = lastMessageId ++;
        message = messages.encode(message);
        pendingMessages[message.id] = deferred;

        /* If debugging, debug! */
        if (debug) {
          console.log("Sending to Worker[" + workerId + "]\n" + JSON.stringify(message, null, 2));
        }

        /* Post the message */
        worker.postMessage(message);

        /* Return our promise */
        return deferred.promise;
      },

      /**
       * Dencode and process the specified message received from the
       * {@link Worker}.
       *
       * This method will correlate received messages with sent ones and will
       * either resolve or reject those {@link Promise}s returned by the
       * {@link module:slaves.Slave#send send(...)} method.
       *
       * @function module:slaves.Slave#receive
       * @param {*} data - The `event.data` part of the message received.
       */
      received: function(data) {

        data = messages.decode(data);

        if (debug) {
          console.log("Received from Worker[" + workerId + "]\n" + JSON.stringify(data, null, 2));
        }


        if ('console' in data) {
          data.arguments.unshift("Worker[" + workerId + "]");
          console[data.console].apply(console, data.arguments);
        }

        if ('id' in data) {
          var msgid = data.id;
          var deferred = pendingMessages[msgid];
          if (deferred) {
            delete pendingMessages[msgid];
            if (data.hasOwnProperty('proxy')) {
              deferred.resolve(proxy.buildProxy(data.proxy, this));
            } else if (data.hasOwnProperty('resolve')) {
              deferred.resolve(data.resolve);
            } else if (data.hasOwnProperty('reject')) {
              if (debug) console.warn("Rejected message " + msgid, data);
              deferred.reject(data.reject);
            } else {
              console.warn("Invalid message data " + msgid, data);
              deferred.reject(new Error("Invalid message data"));
            }
          } else {
            console.error("Unknown message ID", msgid);
          }
        }
      },

      /* -------------------------------------------------------------------- */

      close: function() {
        if (! worker) return promize.Promise.resolve();
        return this.send({close: true}).then(function(success) {
          server.terminate(new Error("Worker " + workerId + " closed"));
        });
      },

      terminate: function(cause) {
        if (worker) {
          worker.terminate();
          worker = null;
          cause = cause || new Error("Worker " + workerId + " terminated");
          for (var msgid in pendingMessages) {
            var message = pendingMessages[msgid];
            delete pendingMessages[msgid];
            message.reject(cause);
          }
        }
      },

      /* ---------------------------------------------------------------------- */

      import: function() {

        /* Find all modules to import */
        var modules = {};
        var args = Esquire.$$normalize(arguments).arguments;
        for (var i = 0; i < args.length; i++) {
          var moduleName = args[i];
          var module = Esquire.module(moduleName);
          if (! module) {
            throw new Error("Module '" + moduleName + "' not defined");
          } else {
            modules[moduleName] = module;
            var dependencies = Esquire.resolve(module, true);
            for (var j in dependencies) {
              var dependency = dependencies[j];
              modules[dependency.name] = dependency;
            }
          }
        }

        /* Prune modules already injected in the worker */
        var injectables = [];
        for (var moduleName in modules) {
          if (injectedModules[moduleName]) continue;
          injectables.push(modules[moduleName]);
        }

        /* Inject each module in the worker */
        var promises = [];
        for (var i in injectables) {

          /* Message id, deferred, and (derived) promise */
          promises.push(this.send({module: injectables[i]})
            .then(function(moduleName) {
              injectedModules[moduleName] = true;
              return moduleName;
            })
          );
        }

        return promize.Promise.all(promises);
      },

      proxy: function(module) {
        return this.import(module).then(function() {
          return server.send({require: module, makeProxy: true});
        });
      },

      destroy: function(proxy) {
        if (proxy && proxy['$$proxyId$$']) {
          return this.send({destroy: proxy['$$proxyId$$']});
        } else {
          throw new Error("Invalid proxy object " + proxy);
        }
      }

    });

    return server;

  }});

});
;
'use strict';

/**
 * A module dealing with browser {@link Blob}s and {@link Worker}s.
 *
 * @module slaves/workers
 */
Esquire.define('slaves/workers', ['$window'], function($window) {

  /* Sanity check */
  if (! $window.Worker) throw new Error("Browser does not support workers");
  if (! $window.Blob) throw new Error("Browser does not support blobs");
  var URL = $window.URL || $window.webkitURL || $window.mozURL;
  if (! URL) throw new Error("Browser does not support URLs")
  if (! URL.createObjectURL) throw new Error("Browser does not support object URLs")

  /**
   * Create a new {@link Blob} instance from a `string` or an array.
   *
   * @function makeBlob
   * @param {string|string[]} content The content of the {@link Blob} to create.
   * @param {string} [contentType] The MIME type for the {@link Blob} to create,
   *                               defaults to `application/javascript`.
   * @returns Blob A newly created `Blob` instance.
   */
  function makeBlob(content, contentType) {
    if (! Array.isArray(content)) content = [ content ];
    if (! contentType) contentType = "application/javascript";
    try {
      /* Try normal construction */
      return new $window.Blob(content, { type: contentType });

    } catch (error) {
      /* Ouch! Use the builder? :-) */

      var Builder = $window.BlobBuilder
                 || $window.WebKitBlobBuilder
                 || $window.MozBlobBuilder;

      /* Fail on no builders */
      if (! Builder) throw new Error("Blob builders unsupported");

      /* Instrument the builder */
      var builder = new Builder();
      for (var i in content) {
        builder.append(content[i]);
      }

      /* Create the blob */
      return builder.getBlob('application/javascript');
    }
  }

  /**
   * Create a `string` __URL__ for the specified {@link Blob} (or content).
   *
   * @function makeURL
   * @param {string|string[]|Blob} content Either the {@link Blob} whose URL
   *                                       needs to be created, or some content
   *                                       which will be wrapped into a new
   *                                       {@link Blob} instance.
   * @param {string} [contentType] The MIME type for the {@link Blob} to create,
   *                               defaults to `application/javascript`.
   * @returns string The URL for the {@link Blob}
   */
  function makeURL(content, contentType) {
    if (content instanceof $window.Blob) {
      return URL.createObjectURL(content, contentType);
    } else {
      return URL.createObjectURL(makeBlob(content));
    }
  }

  /**
   * Create a {@link Worker} for the specified {@link Blob}, URL or content.
   *
   * @function makeWorker
   * @param {string|string[]|Blob} content Either the {@link Worker}'s script
   *                                       {@link Blob}, or its content, or a
   *                                       string starting with `blob:` which
   *                                       will be interpreted as a URL.
   * @param {string} [contentType] The MIME type for the {@link Blob} to create,
   *                               defaults to `application/javascript`.
   * @returns Worker The {@link Worker} associated with the script.
   */
  function makeWorker(content, contentType) {
    if ((typeof(content) === 'string') && content.match(/^blob:/)) {
      return new $window.Worker(content);
    } else {
      return new $window.Worker(makeURL(content, contentType));
    }
  }

  return Object.freeze({
    makeWorker: makeWorker,
    makeBlob: makeBlob,
    makeURL:  makeURL
  });

});
;
'use strict';

/**
 * The main entry point for operating with {@link Worker}s and {@link Slave}s.
 *
 * @module slaves
 */
Esquire.define('slaves', [ 'promize', 'slaves/servers', 'slaves/workers' ], function(promize, servers, workers) {

  /**
   * Create a new {@link Slave} instance.
   *
   * @function module:slaves.create
   * @param {boolean} [debug] - If `true` (lots of) debugging information will
   *                            be dumped to the console.
   * @return {Promise} A {@link Promise} for a {@link Slave} instance.
   */
  return Object.freeze({ create: function(debug) {

    var workerId = Math.floor(Math.random() * 0x0100000000).toString(16);
    while (workerId.length < 8) workerId = '0' + workerId;

    /* Our deferred for initialization */
    var initialized = new promize.Deferred();

    /* Create our Blob URL */
    var script = [];
    script.push("(" + Esquire.$$script + ")(self);\n");
    script.push(Esquire.module("slaves/messages").$$script + ";\n");
    script.push(Esquire.module("slaves/client").$$script + ";\n");
    script.push("new Esquire().require('slaves/client').init(" + debug + ");\n");

    /* Dump our code for debugging */
    if (debug) {
      var debugScript = script.join('').split('\n');
      for (var i in debugScript) {
        var line = new Number(i) + 1;
        line = line < 10 ? '  ' + line + ' - ':
               line < 100 ? ' ' + line + ' - ' :
               line + ' - ';
        debugScript[i] = line + debugScript[i];
      }
      console.log("Worker[" + workerId + "] Script\n" + debugScript.join('\n'));
    }

    /* ---------------------------------------------------------------------- */

    /* Create worker and wrap it into a server */
    var server = servers.create(workers.makeWorker(script), workerId, debug);

    /**
     * @class Slave
     * @memberof module:slaves
     * @classdesc A {@link Slave} instance wraps a web {@link Worker} and
     *            simplifies its interaction throgh the use of proxy objects.
     */
    var slave = Object.freeze({
      /**
       * Import one or more _Esquire_ modules in the {@link Worker}.
       *
       * If a module was already defined in the {@link Worker}, this method
       * will ignore it.
       *
       * @function module:slaves.Slave#import
       * @param {string|string[]} modules - A list of module names, as a
       *                                    string or an array of strings.
       * @param {string} [...] - Mode module names to import as arguments.
       * @return {Promise} A promise to an array of modules actually imported.
       */
      'import':    function() { return server['import'   ].apply(server, arguments) },

      /**
       * Create a **proxy** object for an _Esquire_ module defined in the
       * {@link Worker}.
       *
       * @function module:slaves.Slave#proxy
       * @param {string} module - The name of the module to create a proxy for.
       * @return {Promise} A promise to the proxy object.
       */
      'proxy':     function() { return server['proxy'    ].apply(server, arguments) },

      /**
       * Destroy the specified **proxy** object, releasing its instance in the
       * {@link Worker}'s scope.
       *
       * @function module:slaves.Slave#destroy
       * @param {object} proxy - The proxy module to destroy.
       * @return {Promise} A promise to the completion of the operation.
       */
      'destroy':   function() { return server['destroy'  ].apply(server, arguments) },

      /**
       * Gracefully close the underlying {@link Worker}, allowing queued
       * messages to be processed.
       *
       * @function module:slaves.Slave#close
       * @return {Promise} A promise to the completion of the operation.
       */
      'close':     function() { return server['close'    ].apply(server, arguments) },

      /**
       * Immediately terminate the underlying {@link Worker}, forcing all
       * pending messages to be discarded and unresolved {@link Promise}s to be
       * rejected.
       *
       * @function module:slaves.Slave#terminate
       */
      'terminate': function() { return server['terminate'].apply(server, arguments) },
    });

    /* Error handler */
    server.worker.onerror = function(event) {
      console.error("Worker[" + workerId + "] Uncaught exception", event.data);
      initialized.reject(event);
    }

    /* Message handler */
    server.worker.onmessage = function(event) {

      if ('initialized' in event.data) {
        server.init(event.data.initialized);
        initialized.resolve(slave);
      } else try {
        server.received(event.data);
      } catch (error) {
        console.error("Worker[" + workerId + "] Exception processing message", event.data, error);
        console.error(error.stack);
      }
    }

    /* Return our promise */
    return initialized.promise;

  }});

});

})();