'use strict';

/**
 * A module wrapping the {@link Slave} client code (basically the code executed
 * by the {@link Worker} when starting up.
 *
 * @module slave/client
 */
Esquire.define('slaves/server', ['$window', '$esquire', 'promize' ,'slaves/messages'], function($window, $esquire, promize, messages) {

  function create(send, modules) {

    /* The modules injected in the worker */
    var injectedModules = {};
    for (var i in modules) {
      injectedModules[modules[i]] = true;
    }

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

    /* ---------------------------------------------------------------------- */

    // /** Create a proxy object for a module defined in the worker. */
    // function closeWorker() {
    //   if (! worker) return promize.Promise.resolve();
    //   return send({close: true}).then(function(succcess) {
    //     terminateWorker(new Error("Worker " + workerId + " closed"));
    //   });
    // };

    // function terminateWorker(cause) {
    //   if (worker) {
    //     worker.terminate();
    //     worker = null;
    //     cause = cause || new Error("Worker " + workerId + " terminated");
    //     for (var msgid in pendingMessages) {
    //       var message = pendingMessages[msgid];
    //       delete pendingMessages[msgid];
    //       message.reject(cause);
    //     }
    //   }
    // }

    function destroyProxy(proxy) {
      if (proxy && proxy['$$proxyId$$']) {
        return send({destroy: proxy['$$proxyId$$']});
      } else {
        throw new Error("Invalid proxy object " + proxy);
      }
    }

    return {
      "import": importModule,
      "proxy": proxyModule,
      // "close": closeWorker
      "destroy": destroyProxy
      // "terminate": terminateWorker
    };
  }

  return Object.freeze({ create: create });

});
