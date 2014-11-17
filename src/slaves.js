'use strict';

Esquire.define('slaves', [ 'promize',
                           'slaves/servers',
                           'slaves/workers' ],
function(promize, servers, workers) {

  function createSlave(debug) {

    var workerId = Math.floor(Math.random() * 0x0100000000).toString(16);
    while (workerId.length < 8) workerId = '0' + workerId;

    /* Our deferred for initialization */
    var initialized = new promize.Deferred();

    /* Create our Blob URL */
    var script = [];
    script.push("(" + Esquire.$$script + ")(self);\n");
    script.push(Esquire.module("slaves/messages").$$script + ";\n");
    script.push(Esquire.module("slaves/client").$$script + ";\n");
    script.push("new Esquire().require('slaves/client').init();\n");

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

    /* Create worker */
    var server = servers.create(workers.makeWorker(script), workerId, debug);

    /* Error handler */
    server.worker.onerror = function(event) {
      console.error("Worker[" + workerId + "] Uncaught exception", event.data);
      initialized.reject(event);
    }

    /* Message handler */
    server.worker.onmessage = function(event) {

      if ('initialized' in event.data) {
        var worker = event.target;
        initialized.resolve(server.init(event.data.initialized));
      } else try {
        server.received(event.data);
      } catch (error) {
        console.error("Worker[" + workerId + "] Exception processing message", event.data);
      }
    }

    /* Return our promise */
    return initialized.promise;

  }

  /* ======================================================================== */
  /* EXPORTS                                                                  */
  /* ======================================================================== */

  return Object.freeze({ create: createSlave });

});
