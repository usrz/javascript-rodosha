'use strict';

Esquire.define('slave', [ 'promize',
                          'slave/workers',
                          'slave/messages',
                          'slave/proxy' ],
function(promize, workers, messages, proxy) {

  /* ID generator */
  var lastId = 0;
  function makeId() {
    var id = lastId ++;
    return id.toString(16);
  }

  /* ======================================================================== */
  /* SLAVE OBJECT                                                             */
  /* ======================================================================== */

  function createSlave(debug) {

    /* The ID of this worker (for reference) */
    var workerId = makeId();

    /* Our deferred for initialization */
    var initialized = new promize.Deferred();

    /* Pending messages */
    var pendingMessages = {};

    /* The modules injected in the worker */
    var injectedModules = {};

    /* The slave to be returned */
    var slave  = {
      "import": importModule,
      "proxy": proxyModule
    };

    /* The worker (created at the end) */
    var worker;

    /* ====================================================================== */

    /* Encode and send a message to the worker */
    function send(message) {
      var deferred = new promize.Deferred();
      message = messages.encode(message);
      message.id = makeId();
      pendingMessages[message.id] = deferred;
      if (debug) {
        console.log("Sending to Worker[" + workerId + "]\n" + JSON.stringify(message, null, 2));
      }
      worker.postMessage(message);
      return deferred.promise;
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
        promises.push(send({define: injectables[i]}).then(function(moduleName) {
          injectedModules[moduleName] = true;
          return moduleName;
        }));

      }

      return promize.Promise.all(promises);
    };

    /* ---------------------------------------------------------------------- */

    /** Create a proxy object for a module defined in the worker. */
    function proxyModule(module) {

      /* Import all modules required for this proxy to work */
      return this.import(module).then(function() {

        /* Once the modules have been imported, request a proxy */
        return send({proxy: module}).then(function(success) {
          if (success.value) {
            /* Static value? Already decoded, just go for it */
            return success.value;
          } else {
            /* Full definition, make a proxy */
            var definition = success.definition;
            var proxyId = success.proxy;
            return proxy.makeProxy(definition, proxyId, send);
          }
        });
      });
    };

    /* ---------------------------------------------------------------------- */

    /* Worker console emulation */
    function workerConsole(method, args) {
      args.unshift("Worker[" + workerId + "]");
      console[method].apply(console, args);
    }

    /* ---------------------------------------------------------------------- */

    /* Error handler */
    function errorHandler(event) {
      workerConsole("error", [event]);
      initialized.reject(event);
    }

    /* Message handler */
    function messageHandler(event) {

      /* Basic check */
      var msgid = event.data.id;
      if (! msgid) {
        console.error("No ID for message", event.data);
      }

      else {
        if (debug) {
          console.log("Received from Worker[" + workerId + "]\n" + JSON.stringify(event.data, null, 2));
        }
        var data = messages.decode(event.data);
        switch (msgid) {

          /* Console logging */
          case 'console':
            workerConsole(data.method, data.arguments);
            break;

          /* Initialization handler */
          case 'initialized':
            for (var i in data.resolve) {
                injectedModules[data.resolve[i]] = true;
            }
            initialized.resolve(slave);
            return;

          /* Any other pending messge */
          default: {
            var deferred = pendingMessages[msgid];
            if (deferred) {
              delete pendingMessages[msgid];
              if (data.hasOwnProperty('resolve')) {
                deferred.resolve(data.resolve);
              } else if (data.hasOwnProperty('reject')) {
                console.warn("Rejected message " + msgid, data);
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
      }
    }

    /* ====================================================================== */

    /*
     * Create the "slave":
     * - script to Blob, then URL and call init() on the remote side.
     * - set up message and error handler.
     * - return the promize that will return our "slave"
     */

    /* Create our Blob URL */
    var script = [];
    script.push("(" + Esquire.$$script + ")(self);\n");
    script.push(Esquire.module("slave/messages").$$script + ";\n");
    script.push(Esquire.module("slave/client").$$script + ";\n");
    script.push("new Esquire().require('slave/client').init();\n");

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
      console.log("Worker script\n" + debugScript.join('\n'));
    }

    /* Create worker */
    worker = new workers.makeWorker(script);
    worker.onmessage = messageHandler;
    worker.onerror = errorHandler;

    /* Return our promise */
    return initialized.promise;

  }

  /* ======================================================================== */
  /* EXPORTS                                                                  */
  /* ======================================================================== */

  return Object.freeze({ create: createSlave });

});
