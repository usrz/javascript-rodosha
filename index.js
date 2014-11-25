'use strict';

/* Load our required dependencies */
var esquire = require('esquire');
var joinPath = require('path').join;
var TmpFile = require('temporary').File;
var childProcess = require('child_process');

/* Load our sources */
var path = joinPath(__dirname, "src");
require("fs").readdirSync(path).forEach(function(file) {
  require("./src/" + file);
});

/* Files to delete */
var tempFiles = [];
process.on('exit', function() {
  tempFiles.forEach(function(file) {
    file.unlinkSync();
  });
});

/* Emulate a web worker */
esquire.define("$global/Worker", [], function() {
  return function Worker(uri) {
    var child = childProcess.fork(uri);
    var worker = this;

    child.on('message', function(message) {
      if (worker.onmessage) {
        worker.onmessage({ data: message });
      } else {
        console.warn("Server: no message listener");
      }
    });

    this.postMessage = function(message) { child.send(message) };
    this.terminate   = function()        { child.kill() };
  }
});

/* Emulate a blob */
esquire.define("$global/Blob", [], function() {
  return function Blob(data) {
    if (data instanceof Array) data = data.join('');
    this.$$data$$ = data;
  }
});

/* Emulate the URL.createObjectURL call */
esquire.define("$global/URL", ["$global/Blob"], function(Blob) {
  return Object.freeze({
    createObjectURL: function(blob) {
      if (blob instanceof Blob) {
        var file = new TmpFile();
        tempFiles.push(file);
        var script = "require('" + joinPath(__dirname, "worker.js") + "');\n"
                   + "(function(){" + blob.$$data$$ + "})();\n";
        file.writeFileSync(script, 'utf8');
        return file.path;
      } else {
        throw new Error("Only (fake) Blob(s) supported: ", blob);
      }
    }
  });
});

/* Our Rodosha promise */
var promise = esquire('rodosha');

module.exports = {
  create: function() {
    var args = arguments;
    return promise.then(function(rodosha) {
      return rodosha.create.apply(rodosha, args);
    });
  }
};
