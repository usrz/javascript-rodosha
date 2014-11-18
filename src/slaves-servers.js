'use strict';

/**
 * A module wrapping the {@link Slave} client code (basically the code executed
 * by the {@link Worker} when starting up.
 *
 * @module slaves/client
 */
Esquire.define('slaves/servers', ['promize' ,'slaves/messages' ,'slaves/proxy'], function(promize, messages, proxy) {

  return Object.freeze({ create: function(worker, workerId, debug) {

    /* Messages ID and pending */
    var lastMessageId = 0;
    var pendingMessages = {};

    /* The modules injected in the worker */
    var injectedModules = {};

    /* ---------------------------------------------------------------------- */

    var server = Object.freeze({

      worker: worker,

      init: function(modules) {
        for (var i in modules) {
          injectedModules[modules[i]] = true;
        }
        return this;
      },

      /* -------------------------------------------------------------------- */

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
