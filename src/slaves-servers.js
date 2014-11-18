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
