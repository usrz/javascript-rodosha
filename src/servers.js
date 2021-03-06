'use strict';

/**
 * A module wrapping the {@link Rodosha} client code (basically the code executed
 * by the {@link Worker} when starting up.
 *
 * @module rodosha/servers
 */
Esquire.define('rodosha/servers', ['$promise', '$deferred' ,'rodosha/messages' ,'rodosha/proxy', 'rodosha/utils'], function(Promise, Deferred, messages, proxy, utils) {

  /**
   * Create a new {@link module:rodosha/servers.Server Server} instance wrapping
   * a {@link Worker}.
   *
   * @function module:rodosha/servers.create
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
     * @class module:rodosha/servers.Server
     * @classdesc A wrapper for a remote {@link Worker} capable of sending
     *            messages to it and processing received messages.
     * @extends {module:rodosha.Rodosha}
     */
    var server = Object.freeze({

      get worker() { return worker },
      get modules() { return Object.keys(injectedModules) },

      /**
       * Initialize this instance.
       *
       * @function module:rodosha/servers.Server#init
       * @param {string[]} [modules] - An array of _Esquire_ module names known
       *                               to be available in the {@link Worker}
       * @return {Rodosha} This instance.
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
       * @function module:rodosha/servers.Server#send
       * @param {*} message - The message to be encoded and sent.
       * @return {Promise} A {@link Promise} to the response from the response.
       */
      send: function(message) {

        /* Sanity check */
        if (! worker) throw new Error("Worker " + workerId + " unavailable");

        /* Create and remember our deferred */
        var deferred = new Deferred();

        /* Encode and remember this message */
        var omsg = message;
        var xid = message.id = lastMessageId ++;
        message = messages.encode(message);

        if (message.id == null) {
          console.warn("PROXIES", messages.reverseProxies);
          throw new Error("GONZO: " + xid + " ->\n" + JSON.stringify(omsg, null, 2) + "\n ->\n" + JSON.stringify(message, null , 2));
        }

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
       * {@link Rodosha#send send(...)} method.
       *
       * @function module:rodosha/servers.Server#receive
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
            try {
              delete pendingMessages[msgid];
              if (data.hasOwnProperty('proxy')) {
                var instance = proxy.buildProxy(data.proxy, this);
                messages.addProxy(instance, data.proxy.id);
                deferred.resolve(Object.freeze(instance));
              } else if (data.hasOwnProperty('resolve')) {
                if (data.resolve === true) {
                  if (data.undefined === true) deferred.resolve(undefined);
                  else if (data.null === true) deferred.resolve(null);
                  else deferred.resolve(true);
                } else {
                  deferred.resolve(data.resolve);
                }
              } else if (data.hasOwnProperty('reject')) {
                if (debug) console.warn("Rejected message " + msgid, data);
                deferred.reject(data.reject);
              } else {
                console.warn("Invalid message data " + msgid, data);
                deferred.reject(new Error("Invalid message data"));
              }
            } catch(error) {
              deferred.reject(error);
            }
          } else {
            console.error("Unknown message ID", msgid);
          }
        }
      },

      /* -------------------------------------------------------------------- */

      close: function() {
        if (! worker) return Promise.resolve();
        return this.send({close: true}).then(function(success) {
          server.terminate(new Error("Worker " + workerId + " closed"));
          return success;
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

      /* -------------------------------------------------------------------- */

      import: function() {

        /* Find all modules to import */
        var server = this;
        return utils.resolve(arguments).then(function(modules) {

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
            promises.push(server.send({module: injectables[i]})
              .then(function(moduleName) {
                injectedModules[moduleName] = true;
                return moduleName;
              })
            );
          }

          /* Return a promise combining all imports */
          return Promise.all(promises);
        });
      },

      proxy: function(module) {
        return this.import(module).then(function() {
          return server.send({require: module, makeProxy: true});
        });
      },

      destroy: function(proxy) {
        var proxyId = messages.deleteProxy(proxy);
        this.send({destroy: proxyId});
      }

    });

    return server;

  }});

});
