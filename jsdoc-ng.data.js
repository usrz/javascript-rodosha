(function() {angular.module('jsDocNG-Data', []).constant('$title',   "USRZ Slaves API (v. 0.0.0)").constant('$readme',  "<h1>USRZ Slaves API</h1><div class=\"nojsdoc\">\n  <p><strong>It also works in <a href=\"NODE.md\">Node.JS</a>.</strong></p>\n</div>\n\n<p>Slaves are an easier way to deal with multi-threading in the browser by using\n<a href=\"https://developer.mozilla.org/en-US/docs/Web/Guide/Performance/Using_web_workers\"><em>Web Workers</em></a></p>\n<p>The implementation is wrapped in a <code>slaves</code>\n<a href=\"https://github.com/usrz/javascript-esquire\"><em>Esquire</em></a> module.</p>\n<pre class=\"prettyprint source lang-javascript\"><code>esquire.inject(['slaves'], function(slaves) {\n  slaves.create().then(function(slave) {\n    // foo! do something...\n  });\n})</code></pre><p><code>Slave</code>s operate mainly of <em>Esquire</em> modules which can be imported directly\nin a remote <code>worker</code>:</p>\n<pre class=\"prettyprint source lang-javascript\"><code>slave.import('module-a', 'module-b').then(function(imported) {\n  // the modules (and all their dipendencies) were imported...\n});</code></pre><h2>Object proxies</h2><p>After those modules are imported, local <strong>proxy</strong> objects pointing to their\ninstances in the worker can be created quite trivially:</p>\n<pre class=\"prettyprint source lang-javascript\"><code>slave.proxy('module-a').then(function(proxy) {\n  // the &quot;proxy&quot; variable is a local object proxying an instance in the worker\n})</code></pre><p>Any method and variable in objects being proxied will be replaced with a\n<code>Promise</code>, and method execution, or value retrieval will trigger a message,\nbe executed in the <code>Worker</code> and its result will resolve or reject the promise.</p>\n<p>So if a module defines a method called <code>foo()</code> and a variable <code>bar</code> like:</p>\n<pre class=\"prettyprint source lang-javascript\"><code>{\n  foo: function(arg) {\n    return &quot;Called with &quot; + arg;\n  },\n  bar: &quot;hello, world&quot;\n}</code></pre><p>It's proxy will return promises for both:</p>\n<pre class=\"prettyprint source lang-javascript\"><code>proxy.foo(&quot;my value&quot;).then(result) {\n  // result will be &quot;Called with my value&quot;\n}\nproxy.bar.then(value) {\n  // value will be &quot;hello world&quot;\n}</code></pre><p>What will happen under the covers is that <em>messages</em> will be sent to the\n<code>Worker</code> asking for the method to be executed in its remote native thread (or\nthe variable's value to be evaluated) and once a response is received locally\nthe returned promises will be resolved or rejected.</p>\n<h2>Proxies from functions</h2><p>A special note for <code>function</code> calls is that their return values can also be\nretrieved as a <strong>proxy</strong> object by invoking the <code>asProxy()</code> method on the\nreturned promise.</p>\n<p>So, for example, if a function is defined as:</p>\n<pre class=\"prettyprint source lang-javascript\"><code>function gimmeAnObject() {\n  // this will return a complex object, with functions and properties\n}</code></pre><p>Locally its result can be used through a <strong>proxy</strong> (henceforth, its methods\nwill still be invoked - and variables evaluated - in the <code>Worker</code>):</p>\n<pre class=\"prettyprint source lang-javascript\"><code>proxy.gimmeAnObject().asProxy().then(function(newProxy) {\n  // newProxy will be a proxy object to what's returned...\n})</code></pre><h2>Cleaning up</h2><p>Proxies can (should) be discarded when no longer needed, freeing up memory\nin the <code>Worker</code>:</p>\n<pre class=\"prettyprint source lang-javascript\"><code>slave.destroy(proy);</code></pre><p>The <code>Worker</code> itself can be closed gracefully</p>\n<pre class=\"prettyprint source lang-javascript\"><code>slave.close().then(function() {\n  // nicely closed\n});</code></pre><p>or terminated abruptly calling <code>slave.terminate()</code>.</p>\n<div class=\"nojsdoc\">\n  <h2>Further reading</h2>\n  <p>Licensed under the <a href=\"LICENSE.md\">Apache Software License 2.0</a></p>\n  <p>The full API documentation is avaiblable\n  <a target=\"_blank\" href=\"http://usrz.github.io/javascript-slaves/\">here</a>.</p>\n</div>").constant('$doclets', [
  {
    "kind": "typedef",
    "name": "Slave",
    "type": {
      "names": [
        "module:slaves.Slave"
      ]
    },
    "longname": "Slave",
    "scope": "global",
    "$href": "#Slave",
    "$id": "T000002R000002"
  },
  {
    "access": "protected",
    "kind": "class",
    "name": "Promise",
    "classdesc": "<p>The <a href=\"#!/Promise\"><code>Promise</code></a> interface is used for deferred and\nasynchronous computations.</p>",
    "longname": "Promise",
    "scope": "global",
    "$href": "Promise",
    "$id": "T000002R000003"
  },
  {
    "description": "<p>Appends fulfillment and rejection handlers to this <a href=\"#!/Promise\"><code>Promise</code></a>, and\nreturns a <strong>new</strong> promise resolving to the return value of the called\nhandler.</p>",
    "params": [
      {
        "type": {
          "names": [
            "function"
          ]
        },
        "optional": true,
        "description": "<p>The handler to call when this\n       <a href=\"#!/Promise\"><code>Promise</code></a> has been successfully resolved.</p>",
        "name": "onSuccess"
      },
      {
        "type": {
          "names": [
            "function"
          ]
        },
        "optional": true,
        "description": "<p>The handler to call when this\n       <a href=\"#!/Promise\"><code>Promise</code></a> has been rejected.</p>",
        "name": "onFailure"
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "Promise"
          ]
        },
        "description": "<p>A new <a href=\"#!/Promise\"><code>Promise</code></a> resolving to the return value\n         of the called handler</p>"
      }
    ],
    "scope": "instance",
    "kind": "function",
    "name": "then",
    "memberof": "Promise",
    "longname": "Promise#then",
    "$href": "Promise#then",
    "$id": "T000002R000004"
  },
  {
    "description": "<p>Appends a rejection handler to this <a href=\"#!/Promise\"><code>Promise</code></a>, and returns a\n<strong>new</strong> promise resolving to the return value of the called handler.</p>\n<p>This is equivalent to calling <code>then(null, onFailure)</code>.</p>",
    "params": [
      {
        "type": {
          "names": [
            "function"
          ]
        },
        "optional": true,
        "description": "<p>The handler to call when this\n       <a href=\"#!/Promise\"><code>Promise</code></a> has been rejected.</p>",
        "name": "onFailure"
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "Promise"
          ]
        },
        "description": "<p>A new <a href=\"#!/Promise\"><code>Promise</code></a> resolving to the return value\n         of the called handler</p>"
      }
    ],
    "scope": "instance",
    "kind": "function",
    "name": "catch",
    "memberof": "Promise",
    "longname": "Promise#catch",
    "$href": "Promise#catch",
    "$id": "T000002R000005"
  },
  {
    "access": "protected",
    "kind": "class",
    "name": "Worker",
    "classdesc": "<p>The <a href=\"#!/Worker\"><code>Worker</code></a> interface represents a background task (it\nspawns real OS-level threads) that can be easily created and can send\nmessages back to their creators.</p>",
    "longname": "Worker",
    "scope": "global",
    "$href": "Worker",
    "$id": "T000002R000006"
  },
  {
    "description": "<p>An event listener that is called whenever an error bubbles through the\n<a href=\"#!/Worker\"><code>Worker</code></a>.</p>",
    "kind": "member",
    "name": "onerror",
    "type": {
      "names": [
        "function"
      ]
    },
    "memberof": "Worker",
    "longname": "Worker#onerror",
    "scope": "instance",
    "$href": "Worker#onerror",
    "$id": "T000002R000007"
  },
  {
    "description": "<p>An event listener that is called whenever a message bubbles through the\n<a href=\"#!/Worker\"><code>Worker</code></a>. The message is stored in the event's <code>data</code> property.\n<a href=\"#!/Worker\"><code>Worker</code></a>.</p>",
    "kind": "member",
    "name": "onerror",
    "type": {
      "names": [
        "function"
      ]
    },
    "memberof": "Worker",
    "longname": "Worker#onerror",
    "scope": "instance",
    "$href": "Worker#onerror",
    "$id": "T000002R000008"
  },
  {
    "description": "<p>Sends a message, that is any JavaScript object to the worker's inner scope.</p>",
    "kind": "function",
    "name": "postMessage",
    "params": [
      {
        "type": {
          "names": [
            "*"
          ]
        },
        "description": "<p>The message to send to the worker.</p>",
        "name": "message"
      }
    ],
    "memberof": "Worker",
    "longname": "Worker#postMessage",
    "scope": "instance",
    "$href": "Worker#postMessage",
    "$id": "T000002R000009"
  },
  {
    "description": "<p>Immediately terminates the worker. This does not offer the worker an\nopportunity to finish its operations; it is simply stopped at once.</p>",
    "kind": "function",
    "name": "terminate",
    "memberof": "Worker",
    "longname": "Worker#terminate",
    "scope": "instance",
    "$href": "Worker#terminate",
    "$id": "T000002R000010"
  },
  {
    "description": "<p>Initialize the <a href=\"#!/Worker\"><code>Worker</code></a> side.</p>",
    "kind": "function",
    "name": "init",
    "params": [
      {
        "type": {
          "names": [
            "boolean"
          ]
        },
        "optional": true,
        "description": "<p>If <code>true</code> debug messages will be sent over and\n                           logged on the <code>Server</code>'s console.</p>",
        "name": "debug"
      }
    ],
    "memberof": "module:slaves/client",
    "longname": "module:slaves/client.init",
    "scope": "static",
    "$href": "module:slaves/client#init",
    "$id": "T000002R000011"
  },
  {
    "description": "<p>A module wrapping the <a href=\"#!/#Slave\"><code>Slave</code></a> client code (basically the code executed\nby the <a href=\"#!/Worker\"><code>Worker</code></a> in order to process messages from the <code>Server</code>).</p>",
    "kind": "module",
    "name": "slaves/client",
    "longname": "module:slaves/client",
    "$href": "module:slaves/client",
    "$id": "T000002R000012"
  },
  {
    "kind": "member",
    "name": "stack",
    "type": {
      "names": [
        "string"
      ]
    },
    "description": "<p>The stack trace associated with this instance,\n                       combining both local and remote details.</p>",
    "memberof": "module:slave/messages~RemoteError",
    "scope": "instance",
    "longname": "module:slave/messages~RemoteError#stack",
    "$href": "#stack",
    "$id": "T000002R000075"
  },
  {
    "description": "<p>A module providing utility functions for encoding and decoding messages to\nand from a <a href=\"#!/Worker\"><code>Worker</code></a>.</p>",
    "kind": "module",
    "name": "slaves/messages",
    "longname": "module:slaves/messages",
    "$href": "module:slaves/messages",
    "$id": "T000002R000076"
  },
  {
    "classdesc": "<p>An <code>Error</code> received from or sent to a <a href=\"#!/Worker\"><code>Worker</code></a>.</p>",
    "kind": "class",
    "name": "RemoteError",
    "longname": "module:slaves/messages~RemoteError",
    "scope": "inner",
    "memberof": "module:slaves/messages",
    "$href": "module:slaves/messages~RemoteError",
    "$id": "T000002R000077"
  },
  {
    "kind": "member",
    "name": "message",
    "type": {
      "names": [
        "string"
      ]
    },
    "description": "<p>A message detailing the error.</p>",
    "memberof": "module:slave/messages~RemoteError",
    "scope": "instance",
    "longname": "module:slave/messages~RemoteError#message",
    "$href": "#message",
    "$id": "T000002R000079"
  },
  {
    "description": "<p>Encode a message prior to sending it over with <code>postMessage()</code>.</p>",
    "kind": "function",
    "name": "encode",
    "params": [
      {
        "type": {
          "names": [
            "*"
          ]
        },
        "description": "<p>The object to encode (anything, really)</p>",
        "name": "decoded"
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "*"
          ]
        },
        "description": "<p>The encoded object</p>"
      }
    ],
    "longname": "module:slaves/messages~encode",
    "scope": "inner",
    "memberof": "module:slaves/messages",
    "$href": "module:slaves/messages#encode",
    "$id": "T000002R000107"
  },
  {
    "description": "<p>Decode a message after receiving it from <code>onessage()</code>.</p>",
    "kind": "function",
    "name": "decode",
    "params": [
      {
        "type": {
          "names": [
            "*"
          ]
        },
        "description": "<p>The object to decode (anything, really)</p>",
        "name": "encoded"
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "*"
          ]
        },
        "description": "<p>The decoded object</p>"
      }
    ],
    "longname": "module:slaves/messages~decode",
    "scope": "inner",
    "memberof": "module:slaves/messages",
    "$href": "module:slaves/messages#decode",
    "$id": "T000002R000121"
  },
  {
    "description": "<p>A module providing a utility function to wrap remote <a href=\"#!/Worker\"><code>Worker</code></a> objects.</p>",
    "kind": "module",
    "name": "slaves/proxy",
    "longname": "module:slaves/proxy",
    "$href": "module:slaves/proxy",
    "$id": "T000002R000128"
  },
  {
    "kind": "class",
    "name": "ProxyPromise",
    "classdesc": "<p>A specialized <a href=\"#!/Promise\"><code>Promise</code></a> returned by <code>function</code>s invoked\n           on <strong>proxy</strong> objects.</p>",
    "augments": [
      "Promise"
    ],
    "memberof": "module:slaves/proxy",
    "longname": "module:slaves/proxy.ProxyPromise",
    "scope": "static",
    "$href": "module:slaves/proxy.ProxyPromise",
    "$id": "T000002R000129"
  },
  {
    "description": "<p>Request that the object returned by the function call is stored as a\n<strong>proxy</strong> by the <a href=\"#!/Worker\"><code>Worker</code></a>.</p>\n<p>This instance will wait sending the method request to the remote\n<a href=\"#!/Worker\"><code>Worker</code></a> until a fulfillment or rejection handler is attached via\nthe <a href=\"#!/module:slaves/proxy.ProxyPromise#then\"><code>then(...)</code></a> method.</p>",
    "kind": "function",
    "name": "asProxy",
    "params": [
      {
        "type": {
          "names": [
            "boolean"
          ]
        },
        "optional": true,
        "description": "<p>If <code>true</code> (or unspecified) the object returned\n                         by the call will be a <strong>proxy</strong> object.</p>",
        "name": "proxy"
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "ProxyPromise"
          ]
        },
        "description": "<p>This <code>very</code> instance.</p>"
      }
    ],
    "exceptions": [
      {
        "description": "This method will throw an <code>Error</code> if the underlying\n           message requesting the call's result was already sent (if\n           <a href=\"#!/module:slaves/proxy.ProxyPromise#then\"><code>then(...)</code></a> was\n           already called)."
      }
    ],
    "memberof": "module:slaves/proxy.ProxyPromise",
    "longname": "module:slaves/proxy.ProxyPromise#asProxy",
    "scope": "instance",
    "$href": "module:slaves/proxy.ProxyPromise#asProxy",
    "$id": "T000002R000132"
  },
  {
    "description": "<p>Wrap the specified <strong>proxy</strong> definition instrumenting all functions with\nremote executors returning <a href=\"#!/module:slaves/proxy.ProxyPromise\"><code>module:slaves/proxy.ProxyPromise</code></a>s.</p>",
    "kind": "function",
    "name": "buildProxy",
    "params": [
      {
        "type": {
          "names": [
            "*"
          ]
        },
        "description": "<p>The definition to wrap</p>",
        "name": "definition"
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "object"
          ]
        },
        "description": "<p>A <strong>proxy</strong> object to an instance from the <a href=\"#!/Worker\"><code>Worker</code></a>.</p>"
      }
    ],
    "memberof": "module:slaves/proxy",
    "longname": "module:slaves/proxy.buildProxy",
    "scope": "static",
    "$href": "module:slaves/proxy#buildProxy",
    "$id": "T000002R000166"
  },
  {
    "description": "<p>Create a new <a href=\"#!/module:slaves/servers.Server\"><code>Server</code></a> instance wrapping\na <a href=\"#!/Worker\"><code>Worker</code></a>.</p>",
    "kind": "function",
    "name": "create",
    "params": [
      {
        "type": {
          "names": [
            "Worker"
          ]
        },
        "description": "<p>The <a href=\"#!/Worker\"><code>Worker</code></a> to wrap.</p>",
        "name": "worker"
      },
      {
        "type": {
          "names": [
            "string"
          ]
        },
        "description": "<p>The unique identifier of the <a href=\"#!/Worker\"><code>Worker</code></a> for\n                           logging and debugging purposes.</p>",
        "name": "workerId"
      },
      {
        "type": {
          "names": [
            "boolean"
          ]
        },
        "optional": true,
        "description": "<p>If <code>true</code> (lots of) debugging information will\n                           be dumped to the console.</p>",
        "name": "debug"
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "Server"
          ]
        },
        "description": "<p>The newly created <code>Server</code> instance.</p>"
      }
    ],
    "memberof": "module:slaves/servers",
    "longname": "module:slaves/servers.create",
    "scope": "static",
    "$href": "module:slaves/servers#create",
    "$id": "T000002R000173"
  },
  {
    "description": "<p>A module wrapping the <a href=\"#!/#Slave\"><code>Slave</code></a> client code (basically the code executed\nby the <a href=\"#!/Worker\"><code>Worker</code></a> when starting up.</p>",
    "kind": "module",
    "name": "slaves/servers",
    "longname": "module:slaves/servers",
    "$href": "module:slaves/servers",
    "$id": "T000002R000174"
  },
  {
    "kind": "class",
    "name": "Server",
    "classdesc": "<p>A wrapper for a remote <a href=\"#!/Worker\"><code>Worker</code></a> capable of sending\n           messages to it and processing received messages.</p>",
    "augments": [
      "module:slaves.Slave"
    ],
    "memberof": "module:slaves/servers",
    "longname": "module:slaves/servers.Server",
    "scope": "static",
    "$href": "module:slaves/servers.Server",
    "$id": "T000002R000179"
  },
  {
    "description": "<p>Initialize this instance.</p>",
    "kind": "function",
    "name": "init",
    "params": [
      {
        "type": {
          "names": [
            "Array.<string>"
          ]
        },
        "optional": true,
        "description": "<p>An array of <em>Esquire</em> module names known\n                              to be available in the <a href=\"#!/Worker\"><code>Worker</code></a></p>",
        "name": "modules"
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "module:slaves.Slave"
          ]
        },
        "description": "<p>This instance.</p>"
      }
    ],
    "memberof": "module:slaves.Slave",
    "longname": "module:slaves.Slave#init",
    "scope": "instance",
    "$href": "module:slaves.Slave#init",
    "$id": "T000002R000182"
  },
  {
    "description": "<p>Encode and send the specified message to the <a href=\"#!/Worker\"><code>Worker</code></a>.</p>",
    "kind": "function",
    "name": "send",
    "params": [
      {
        "type": {
          "names": [
            "*"
          ]
        },
        "description": "<p>The message to be encoded and sent.</p>",
        "name": "message"
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "Promise"
          ]
        },
        "description": "<p>A <a href=\"#!/Promise\"><code>Promise</code></a> to the response from the response.</p>"
      }
    ],
    "memberof": "module:slaves.Slave",
    "longname": "module:slaves.Slave#send",
    "scope": "instance",
    "$href": "module:slaves.Slave#send",
    "$id": "T000002R000186"
  },
  {
    "description": "<p>Dencode and process the specified message received from the\n<a href=\"#!/Worker\"><code>Worker</code></a>.</p>\n<p>This method will correlate received messages with sent ones and will\neither resolve or reject those <a href=\"#!/Promise\"><code>Promise</code></a>s returned by the\n<a href=\"#!/module:slaves.Slave#send\"><code>send(...)</code></a> method.</p>",
    "kind": "function",
    "name": "receive",
    "params": [
      {
        "type": {
          "names": [
            "*"
          ]
        },
        "description": "<p>The <code>event.data</code> part of the message received.</p>",
        "name": "data"
      }
    ],
    "memberof": "module:slaves.Slave",
    "longname": "module:slaves.Slave#receive",
    "scope": "instance",
    "$href": "module:slaves.Slave#receive",
    "$id": "T000002R000192"
  },
  {
    "description": "<p>A module dealing with browser <code>Blob</code>s and <a href=\"#!/Worker\"><code>Worker</code></a>s.</p>",
    "kind": "module",
    "name": "slaves/workers",
    "longname": "module:slaves/workers",
    "$href": "module:slaves/workers",
    "$id": "T000002R000226"
  },
  {
    "description": "<p>Create a new <code>Blob</code> instance from a <code>string</code> or an array.</p>",
    "kind": "function",
    "name": "makeBlob",
    "params": [
      {
        "type": {
          "names": [
            "string",
            "Array.<string>"
          ]
        },
        "description": "<p>The content of the <code>Blob</code> to create.</p>",
        "name": "content"
      },
      {
        "type": {
          "names": [
            "string"
          ]
        },
        "optional": true,
        "description": "<p>The MIME type for the <code>Blob</code> to create,\n                              defaults to <code>application/javascript</code>.</p>",
        "name": "contentType"
      }
    ],
    "returns": [
      {
        "description": "<p>Blob A newly created <code>Blob</code> instance.</p>"
      }
    ],
    "longname": "module:slaves/workers~makeBlob",
    "scope": "inner",
    "memberof": "module:slaves/workers",
    "$href": "module:slaves/workers#makeBlob",
    "$id": "T000002R000228"
  },
  {
    "description": "<p>Create a <code>string</code> <strong>URL</strong> for the specified <code>Blob</code> (or content).</p>",
    "kind": "function",
    "name": "makeURL",
    "params": [
      {
        "type": {
          "names": [
            "string",
            "Array.<string>",
            "Blob"
          ]
        },
        "description": "<p>Either the <code>Blob</code> whose URL\n                                      needs to be created, or some content\n                                      which will be wrapped into a new\n                                      <code>Blob</code> instance.</p>",
        "name": "content"
      },
      {
        "type": {
          "names": [
            "string"
          ]
        },
        "optional": true,
        "description": "<p>The MIME type for the <code>Blob</code> to create,\n                              defaults to <code>application/javascript</code>.</p>",
        "name": "contentType"
      }
    ],
    "returns": [
      {
        "description": "<p>string The URL for the <code>Blob</code></p>"
      }
    ],
    "longname": "module:slaves/workers~makeURL",
    "scope": "inner",
    "memberof": "module:slaves/workers",
    "$href": "module:slaves/workers#makeURL",
    "$id": "T000002R000236"
  },
  {
    "description": "<p>Create a <a href=\"#!/Worker\"><code>Worker</code></a> for the specified <code>Blob</code>, URL or content.</p>",
    "kind": "function",
    "name": "makeWorker",
    "params": [
      {
        "type": {
          "names": [
            "string",
            "Array.<string>",
            "Blob"
          ]
        },
        "description": "<p>Either the <a href=\"#!/Worker\"><code>Worker</code></a>'s script\n                                      <code>Blob</code>, or its content, or a\n                                      string starting with <code>blob:</code> which\n                                      will be interpreted as a URL.</p>",
        "name": "content"
      },
      {
        "type": {
          "names": [
            "string"
          ]
        },
        "optional": true,
        "description": "<p>The MIME type for the <code>Blob</code> to create,\n                              defaults to <code>application/javascript</code>.</p>",
        "name": "contentType"
      }
    ],
    "returns": [
      {
        "description": "<p>Worker The <a href=\"#!/Worker\"><code>Worker</code></a> associated with the script.</p>"
      }
    ],
    "longname": "module:slaves/workers~makeWorker",
    "scope": "inner",
    "memberof": "module:slaves/workers",
    "$href": "module:slaves/workers#makeWorker",
    "$id": "T000002R000238"
  },
  {
    "description": "<p>Create a new <a href=\"#!/#Slave\"><code>Slave</code></a> instance.</p>",
    "kind": "function",
    "name": "create",
    "params": [
      {
        "type": {
          "names": [
            "boolean"
          ]
        },
        "optional": true,
        "description": "<p>If <code>true</code> (lots of) debugging information will\n                           be dumped to the console.</p>",
        "name": "debug"
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "Promise"
          ]
        },
        "description": "<p>A <a href=\"#!/Promise\"><code>Promise</code></a> for a <a href=\"#!/#Slave\"><code>Slave</code></a> instance.</p>"
      }
    ],
    "memberof": "module:slaves",
    "longname": "module:slaves.create",
    "scope": "static",
    "$href": "module:slaves#create",
    "$id": "T000002R000243"
  },
  {
    "description": "<p>The main entry point for operating with <a href=\"#!/Worker\"><code>Worker</code></a>s and <a href=\"#!/#Slave\"><code>Slave</code></a>s.</p>",
    "kind": "module",
    "name": "slaves",
    "longname": "module:slaves",
    "$href": "module:slaves",
    "$id": "T000002R000244"
  },
  {
    "kind": "class",
    "name": "Slave",
    "memberof": "module:slaves",
    "classdesc": "<p>A <a href=\"#!/#Slave\"><code>Slave</code></a> instance wraps a web <a href=\"#!/Worker\"><code>Worker</code></a> and\n           simplifies its interaction throgh the use of proxy objects.</p>",
    "scope": "static",
    "longname": "module:slaves.Slave",
    "$href": "module:slaves.Slave",
    "$id": "T000002R000256"
  },
  {
    "description": "<p>Import one or more <em>Esquire</em> modules in the <a href=\"#!/Worker\"><code>Worker</code></a>.</p>\n<p>If a module was already defined in the <a href=\"#!/Worker\"><code>Worker</code></a>, this method\nwill ignore it.</p>",
    "kind": "function",
    "name": "import",
    "params": [
      {
        "type": {
          "names": [
            "string",
            "Array.<string>"
          ]
        },
        "description": "<p>A list of module names, as a\n                                   string or an array of strings.</p>",
        "name": "modules"
      },
      {
        "type": {
          "names": [
            "string"
          ]
        },
        "optional": true,
        "description": "<p>Mode module names to import as arguments.</p>",
        "name": "..."
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "Promise"
          ]
        },
        "description": "<p>A promise to an array of modules actually imported.</p>"
      }
    ],
    "memberof": "module:slaves.Slave",
    "longname": "module:slaves.Slave#import",
    "scope": "instance",
    "$href": "module:slaves.Slave#import",
    "$id": "T000002R000258"
  },
  {
    "description": "<p>Create a <strong>proxy</strong> object for an <em>Esquire</em> module defined in the\n<a href=\"#!/Worker\"><code>Worker</code></a>.</p>",
    "kind": "function",
    "name": "proxy",
    "params": [
      {
        "type": {
          "names": [
            "string"
          ]
        },
        "description": "<p>The name of the module to create a proxy for.</p>",
        "name": "module"
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "Promise"
          ]
        },
        "description": "<p>A promise to the proxy object.</p>"
      }
    ],
    "memberof": "module:slaves.Slave",
    "longname": "module:slaves.Slave#proxy",
    "scope": "instance",
    "$href": "module:slaves.Slave#proxy",
    "$id": "T000002R000260"
  },
  {
    "description": "<p>Destroy the specified <strong>proxy</strong> object, releasing its instance in the\n<a href=\"#!/Worker\"><code>Worker</code></a>'s scope.</p>",
    "kind": "function",
    "name": "destroy",
    "params": [
      {
        "type": {
          "names": [
            "object"
          ]
        },
        "description": "<p>The proxy module to destroy.</p>",
        "name": "proxy"
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "Promise"
          ]
        },
        "description": "<p>A promise to the completion of the operation.</p>"
      }
    ],
    "memberof": "module:slaves.Slave",
    "longname": "module:slaves.Slave#destroy",
    "scope": "instance",
    "$href": "module:slaves.Slave#destroy",
    "$id": "T000002R000262"
  },
  {
    "description": "<p>Gracefully close the underlying <a href=\"#!/Worker\"><code>Worker</code></a>, allowing queued\nmessages to be processed.</p>",
    "kind": "function",
    "name": "close",
    "returns": [
      {
        "type": {
          "names": [
            "Promise"
          ]
        },
        "description": "<p>A promise to the completion of the operation.</p>"
      }
    ],
    "memberof": "module:slaves.Slave",
    "longname": "module:slaves.Slave#close",
    "scope": "instance",
    "$href": "module:slaves.Slave#close",
    "$id": "T000002R000264"
  },
  {
    "description": "<p>Immediately terminate the underlying <a href=\"#!/Worker\"><code>Worker</code></a>, forcing all\npending messages to be discarded and unresolved <a href=\"#!/Promise\"><code>Promise</code></a>s to be\nrejected.</p>",
    "kind": "function",
    "name": "terminate",
    "memberof": "module:slaves.Slave",
    "longname": "module:slaves.Slave#terminate",
    "scope": "instance",
    "$href": "module:slaves.Slave#terminate",
    "$id": "T000002R000266"
  },
  {
    "description": "<p>Appends fulfillment and rejection handlers to this <a href=\"#!/Promise\"><code>Promise</code></a>, and\nreturns a <strong>new</strong> promise resolving to the return value of the called\nhandler.</p>",
    "params": [
      {
        "type": {
          "names": [
            "function"
          ]
        },
        "optional": true,
        "description": "<p>The handler to call when this\n       <a href=\"#!/Promise\"><code>Promise</code></a> has been successfully resolved.</p>",
        "name": "onSuccess"
      },
      {
        "type": {
          "names": [
            "function"
          ]
        },
        "optional": true,
        "description": "<p>The handler to call when this\n       <a href=\"#!/Promise\"><code>Promise</code></a> has been rejected.</p>",
        "name": "onFailure"
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "Promise"
          ]
        },
        "description": "<p>A new <a href=\"#!/Promise\"><code>Promise</code></a> resolving to the return value\n         of the called handler</p>"
      }
    ],
    "scope": "instance",
    "kind": "function",
    "name": "then",
    "memberof": "module:slaves/proxy.ProxyPromise",
    "longname": "module:slaves/proxy.ProxyPromise#then",
    "inherits": "Promise#then",
    "inherited": true,
    "$href": "module:slaves/proxy.ProxyPromise#then",
    "$id": "T000002R000271"
  },
  {
    "description": "<p>Appends a rejection handler to this <a href=\"#!/Promise\"><code>Promise</code></a>, and returns a\n<strong>new</strong> promise resolving to the return value of the called handler.</p>\n<p>This is equivalent to calling <code>then(null, onFailure)</code>.</p>",
    "params": [
      {
        "type": {
          "names": [
            "function"
          ]
        },
        "optional": true,
        "description": "<p>The handler to call when this\n       <a href=\"#!/Promise\"><code>Promise</code></a> has been rejected.</p>",
        "name": "onFailure"
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "Promise"
          ]
        },
        "description": "<p>A new <a href=\"#!/Promise\"><code>Promise</code></a> resolving to the return value\n         of the called handler</p>"
      }
    ],
    "scope": "instance",
    "kind": "function",
    "name": "catch",
    "memberof": "module:slaves/proxy.ProxyPromise",
    "longname": "module:slaves/proxy.ProxyPromise#catch",
    "inherits": "Promise#catch",
    "inherited": true,
    "$href": "module:slaves/proxy.ProxyPromise#catch",
    "$id": "T000002R000272"
  },
  {
    "description": "<p>Initialize this instance.</p>",
    "kind": "function",
    "name": "init",
    "params": [
      {
        "type": {
          "names": [
            "Array.<string>"
          ]
        },
        "optional": true,
        "description": "<p>An array of <em>Esquire</em> module names known\n                              to be available in the <a href=\"#!/Worker\"><code>Worker</code></a></p>",
        "name": "modules"
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "module:slaves.Slave"
          ]
        },
        "description": "<p>This instance.</p>"
      }
    ],
    "memberof": "module:slaves/servers.Server",
    "longname": "module:slaves/servers.Server#init",
    "scope": "instance",
    "inherits": "module:slaves.Slave#init",
    "inherited": true,
    "$href": "module:slaves/servers.Server#init",
    "$id": "T000002R000273"
  },
  {
    "description": "<p>Encode and send the specified message to the <a href=\"#!/Worker\"><code>Worker</code></a>.</p>",
    "kind": "function",
    "name": "send",
    "params": [
      {
        "type": {
          "names": [
            "*"
          ]
        },
        "description": "<p>The message to be encoded and sent.</p>",
        "name": "message"
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "Promise"
          ]
        },
        "description": "<p>A <a href=\"#!/Promise\"><code>Promise</code></a> to the response from the response.</p>"
      }
    ],
    "memberof": "module:slaves/servers.Server",
    "longname": "module:slaves/servers.Server#send",
    "scope": "instance",
    "inherits": "module:slaves.Slave#send",
    "inherited": true,
    "$href": "module:slaves/servers.Server#send",
    "$id": "T000002R000274"
  },
  {
    "description": "<p>Dencode and process the specified message received from the\n<a href=\"#!/Worker\"><code>Worker</code></a>.</p>\n<p>This method will correlate received messages with sent ones and will\neither resolve or reject those <a href=\"#!/Promise\"><code>Promise</code></a>s returned by the\n<a href=\"#!/module:slaves.Slave#send\"><code>send(...)</code></a> method.</p>",
    "kind": "function",
    "name": "receive",
    "params": [
      {
        "type": {
          "names": [
            "*"
          ]
        },
        "description": "<p>The <code>event.data</code> part of the message received.</p>",
        "name": "data"
      }
    ],
    "memberof": "module:slaves/servers.Server",
    "longname": "module:slaves/servers.Server#receive",
    "scope": "instance",
    "inherits": "module:slaves.Slave#receive",
    "inherited": true,
    "$href": "module:slaves/servers.Server#receive",
    "$id": "T000002R000275"
  },
  {
    "description": "<p>Import one or more <em>Esquire</em> modules in the <a href=\"#!/Worker\"><code>Worker</code></a>.</p>\n<p>If a module was already defined in the <a href=\"#!/Worker\"><code>Worker</code></a>, this method\nwill ignore it.</p>",
    "kind": "function",
    "name": "import",
    "params": [
      {
        "type": {
          "names": [
            "string",
            "Array.<string>"
          ]
        },
        "description": "<p>A list of module names, as a\n                                   string or an array of strings.</p>",
        "name": "modules"
      },
      {
        "type": {
          "names": [
            "string"
          ]
        },
        "optional": true,
        "description": "<p>Mode module names to import as arguments.</p>",
        "name": "..."
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "Promise"
          ]
        },
        "description": "<p>A promise to an array of modules actually imported.</p>"
      }
    ],
    "memberof": "module:slaves/servers.Server",
    "longname": "module:slaves/servers.Server#import",
    "scope": "instance",
    "inherits": "module:slaves.Slave#import",
    "inherited": true,
    "$href": "module:slaves/servers.Server#import",
    "$id": "T000002R000276"
  },
  {
    "description": "<p>Create a <strong>proxy</strong> object for an <em>Esquire</em> module defined in the\n<a href=\"#!/Worker\"><code>Worker</code></a>.</p>",
    "kind": "function",
    "name": "proxy",
    "params": [
      {
        "type": {
          "names": [
            "string"
          ]
        },
        "description": "<p>The name of the module to create a proxy for.</p>",
        "name": "module"
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "Promise"
          ]
        },
        "description": "<p>A promise to the proxy object.</p>"
      }
    ],
    "memberof": "module:slaves/servers.Server",
    "longname": "module:slaves/servers.Server#proxy",
    "scope": "instance",
    "inherits": "module:slaves.Slave#proxy",
    "inherited": true,
    "$href": "module:slaves/servers.Server#proxy",
    "$id": "T000002R000277"
  },
  {
    "description": "<p>Destroy the specified <strong>proxy</strong> object, releasing its instance in the\n<a href=\"#!/Worker\"><code>Worker</code></a>'s scope.</p>",
    "kind": "function",
    "name": "destroy",
    "params": [
      {
        "type": {
          "names": [
            "object"
          ]
        },
        "description": "<p>The proxy module to destroy.</p>",
        "name": "proxy"
      }
    ],
    "returns": [
      {
        "type": {
          "names": [
            "Promise"
          ]
        },
        "description": "<p>A promise to the completion of the operation.</p>"
      }
    ],
    "memberof": "module:slaves/servers.Server",
    "longname": "module:slaves/servers.Server#destroy",
    "scope": "instance",
    "inherits": "module:slaves.Slave#destroy",
    "inherited": true,
    "$href": "module:slaves/servers.Server#destroy",
    "$id": "T000002R000278"
  },
  {
    "description": "<p>Gracefully close the underlying <a href=\"#!/Worker\"><code>Worker</code></a>, allowing queued\nmessages to be processed.</p>",
    "kind": "function",
    "name": "close",
    "returns": [
      {
        "type": {
          "names": [
            "Promise"
          ]
        },
        "description": "<p>A promise to the completion of the operation.</p>"
      }
    ],
    "memberof": "module:slaves/servers.Server",
    "longname": "module:slaves/servers.Server#close",
    "scope": "instance",
    "inherits": "module:slaves.Slave#close",
    "inherited": true,
    "$href": "module:slaves/servers.Server#close",
    "$id": "T000002R000279"
  },
  {
    "description": "<p>Immediately terminate the underlying <a href=\"#!/Worker\"><code>Worker</code></a>, forcing all\npending messages to be discarded and unresolved <a href=\"#!/Promise\"><code>Promise</code></a>s to be\nrejected.</p>",
    "kind": "function",
    "name": "terminate",
    "memberof": "module:slaves/servers.Server",
    "longname": "module:slaves/servers.Server#terminate",
    "scope": "instance",
    "inherits": "module:slaves.Slave#terminate",
    "inherited": true,
    "$href": "module:slaves/servers.Server#terminate",
    "$id": "T000002R000280"
  }
]);})();