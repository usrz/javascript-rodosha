console.log("Worker: started with PID", process.pid);

process.on('message', function(message) {
  if (global.onmessage) {
    global.onmessage({ data: message });
  } else {
    console.warn("Worker: no message listener");
  }
});

process.on('uncaughtException', function(err) {
  console.log('Worker: Uncaught exception: ' + err.stack);
});

global.self = global;
global.location = { href: process.argv[1] };
global.close = function() { setTimeout(function() { process.exit(0) }) };
global.postMessage = function(message) {
  process.send(message);
};
