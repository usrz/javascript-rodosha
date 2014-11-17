'use strict';

Esquire.define('slaves', [ 'promize',
                           'slaves/server',
                           'slaves/workers',
                           'slaves/messages',
                           'slaves/proxy' ],
function(promize, server, workers, messages, proxy) {

  /* ID generator */
  var lastId = 0;

  /* ======================================================================== */
  /* SLAVE OBJECT                                                             */
  /* ======================================================================== */

  function createSlave(debug) {

    /* The ID of this worker (for reference) */
    var workerId = lastId ++;

    /* Our deferred for initialization */
    var initialized = new promize.Deferred();

    /* Pending messages */
    var pendingMessages = {};

    /* The worker (created at the end) */
    var worker;

    /* ---------------------------------------------------------------------- */

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

    /* Worker console emulation */
    function workerConsole(method, args) {
      args.unshift("Worker[" + workerId + "]");
      console[method].apply(console, args);
    }

    /* ---------------------------------------------------------------------- */

    /* Encode and send a message to the worker */
    function send(message) {
      /* Sanity checks */
      if (! worker) throw new Error("Worker " + workerId + " unavailable");

      /* Create and remember our deferred */
      var deferred = new promize.Deferred();

      /* If debugging, debug! */
      if (debug) {
        console.log("Sending to Worker[" + workerId + "]\n" + JSON.stringify(message, null, 2));
      }

      try {
        /* Prepare the message for sending */
        message.id = lastId ++;
        message = messages.encode(message);
        pendingMessages[message.id] = deferred;

        /* Send it out */
        worker.postMessage(message);
      } catch (error) {
        deferred.reject(error);
      }

      /* Return our promise */
      return deferred.promise;
    }

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
            // for (var i in data.modules) {
            //     injectedModules[data.modules[i]] = true;
            // }
            var slave = server.create(send, data.modules);
            slave.close = closeWorker;
            slave.terminate = terminateWorker;
            initialized.resolve(slave);
            return;

          /* Any other pending messge */
          default: {
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
