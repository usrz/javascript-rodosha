'use strict';

/* Load our dependencies */
var esquire = require('esquire');
var promize = require('promize');

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
Esquire.define("$global/Worker", [], function() {
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
Esquire.define("$global/Blob", [], function() {
  return function Blob(data) {
    if (data instanceof Array) data = data.join('');
    this.$$data$$ = data;
  }
});

/* Emulate the URL.createObjectURL call */
Esquire.define("$global/URL", ["$global/Blob"], function(Blob) {
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

module.exports = esquire('slaves');
