'use strict';

/**
 * A module wrapping the {@link Slave} client code (basically the code executed
 * by the {@link Worker} when starting up.
 *
 * @module slave/client
 */
Esquire.define('slaves/servers', ['promize' ,'slaves/messages' ,'slaves/proxy'], function(promize, messages, proxy) {

  function create(worker, workerId, debug) {

    /* Messages ID and pending */
    var lastMessageId = 0;
    var pendingMessages = {};

    /* The modules injected in the worker */
    var injectedModules = {};

    /* ---------------------------------------------------------------------- */

    //return Object.freeze({})
      function init(modules) {
        for (var i in modules) {
          injectedModules[modules[i]] = true;
        }
        return this;
      }

      function send(message) {
        /* Sanity checks */
        if (! worker) throw new Error("Worker " + workerId + " unavailable");

        /* Create and remember our deferred */
        var deferred = new promize.Deferred();

        try {
          /* Prepare the message for sending */
          message.id = lastMessageId ++;
          message = messages.encode(message);
          pendingMessages[message.id] = deferred;

          /* If debugging, debug! */
          if (debug) {
            console.log("Sending to Worker[" + workerId + "]\n" + JSON.stringify(message, null, 2));
          }

          /* Send it out */
          worker.postMessage(message);
        } catch (error) {
          deferred.reject(error);
        }

        /* Return our promise */
        return deferred.promise;
      }

      function received(data) {

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
              deferred.resolve(proxy.buildProxy(data.proxy, send));
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
      }

      /** Create a proxy object for a module defined in the worker. */
      function closeWorker() {
        if (! worker) return promize.Promise.resolve();
        return send({close: true}).then(function(succcess) {
          terminateWorker(new Error("Worker " + workerId + " closed"));
        });
      };

      function terminateWorker(cause) {
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
      }

      /* ---------------------------------------------------------------------- */

      /* Import one (or more) modules in the worker */
      function importModule() {

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
          promises.push(send({module: injectables[i]}).then(function(moduleName) {
            injectedModules[moduleName] = true;
            return moduleName;
          }));

        }

        return promize.Promise.all(promises);
      };

      /* ---------------------------------------------------------------------- */

      /** Create a proxy object for a module defined in the worker. */
      function proxyModule(module) {
        return this.import(module).then(function() {
          return send({require: module, makeProxy: true});
        });
      };

      function destroyProxy(proxy) {
        if (proxy && proxy['$$proxyId$$']) {
          return send({destroy: proxy['$$proxyId$$']});
        } else {
          throw new Error("Invalid proxy object " + proxy);
        }
      }

    return Object.freeze({
      "worker": worker,
      "init": init,
      "send": send,
      "received": received,
      "import": importModule,
      "proxy": proxyModule,
      "close": closeWorker,
      "destroy": destroyProxy,
      "terminate": terminateWorker
    });
  }

  return Object.freeze({ create: create });

});
