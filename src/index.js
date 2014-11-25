'use strict';

/**
 * The main entry point for operating with {@link Worker}s and {@link Rodosha}s.
 *
 * @module rodosha
 */
Esquire.define('rodosha', [ '$deferred', 'rodosha/servers', 'rodosha/workers' ], function(Deferred, servers, workers) {

  function dependencies(modules, moduleName) {
    var module = Esquire.module(moduleName);
    if (!module) throw new Error("Module '" + moduleName + "' not found");
    modules[module.name] = module;
    var dependencies = Esquire.resolve(module, true);
    for (var i in dependencies) {
      var dependency = dependencies[i];
      if (dependency.$$dynamic) continue;
      modules[dependency.name] = dependency;
    }
    return modules;
  }

  /**
   * Create a new {@link Rodosha} instance.
   *
   * @function module:rodosha.create
   * @param {string} [module] - Any module to import in the {@link Worker} at
   *                            construction time.
   * @param {string} [...] - Any other module name (allows multiple arguments)
   * @param {boolean} [debug] - If `true` (lots of) debugging information will
   *                            be dumped to the console.
   * @return {Promise} A {@link Promise} for a {@link Rodosha} instance.
   */
  return Object.freeze({ create: function() {

    var workerId = Math.floor(Math.random() * 0x0100000000).toString(16);
    while (workerId.length < 8) workerId = '0' + workerId;

    /* Our deferred for initialization */
    var initialized = new Deferred();

    /* Debug? */
    var debug = false;
    var lastArgument = arguments.length;
    if (arguments.length > 0) {
      if (typeof(arguments[arguments.length - 1]) === 'boolean') {
        debug = arguments[arguments.length - 1];
        lastArgument -= 1;
      }
    }

    /* Resolve any module from the arguments */
    var modules = dependencies({}, "rodosha/client");
    for (var i = 0; i < lastArgument; i ++) {
      modules = dependencies(modules, arguments[i]);
    }

    /* Create our Blob URL */
    var script = [];
    script.push("(" + Esquire.$$script + ")(self);\n");

    /* All our preimported modules */
    for (var i in modules) {
      script.push(modules[i].$$script + ";\n")
    }

    /* Initialize the client */
    script.push("new Esquire().require('rodosha/client').then(function(client) { client.init(" + debug + ") });\n");

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
     * @class Rodosha
     * @memberof module:rodosha
     * @classdesc A {@link Rodosha} instance wraps a web {@link Worker} and
     *            simplifies its interaction throgh the use of proxy objects.
     */
    var rodosha = Object.freeze({
      get modules() { return server.modules },

      /**
       * Import one or more _Esquire_ modules in the {@link Worker}.
       *
       * If a module was already defined in the {@link Worker}, this method
       * will ignore it.
       *
       * @function module:rodosha.Rodosha#import
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
       * @function module:rodosha.Rodosha#proxy
       * @param {string} module - The name of the module to create a proxy for.
       * @return {Promise} A promise to the proxy object.
       */
      'proxy':     function() { return server['proxy'    ].apply(server, arguments) },

      /**
       * Destroy the specified **proxy** object, releasing its instance in the
       * {@link Worker}'s scope.
       *
       * @function module:rodosha.Rodosha#destroy
       * @param {object} proxy - The proxy module to destroy.
       * @return {Promise} A promise to the completion of the operation.
       */
      'destroy':   function() { return server['destroy'  ].apply(server, arguments) },

      /**
       * Gracefully close the underlying {@link Worker}, allowing queued
       * messages to be processed.
       *
       * @function module:rodosha.Rodosha#close
       * @return {Promise} A promise to the completion of the operation.
       */
      'close':     function() { return server['close'    ].apply(server, arguments) },

      /**
       * Immediately terminate the underlying {@link Worker}, forcing all
       * pending messages to be discarded and unresolved {@link Promise}s to be
       * rejected.
       *
       * @function module:rodosha.Rodosha#terminate
       */
      'terminate': function() { return server['terminate'].apply(server, arguments) },
    });

    /* Error handler */
    server.worker.onerror = function(event) {
      console.error("Worker[" + workerId + "] Uncaught exception", event.message);
      var error = new Error("Uncaught Worker error: " + event.message ? event.message : "[no message]");
      error.event = event;
      initialized.reject(error);
    }

    /* Message handler */
    server.worker.onmessage = function(event) {

      if ('initialized' in event.data) {
        server.init(event.data.initialized);
        initialized.resolve(rodosha);
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
