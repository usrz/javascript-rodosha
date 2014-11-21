(function() {angular.module('jsDocNG-Data', []).constant('$title',   "USRZ Rodosha API (v. 0.0.0)").constant('$readme',  "<h1>USRZ Rodosha API</h1><div class=\"nojsdoc\">\n  <p><strong>It also works in <a href=\"NODE.md\">Node.JS</a>.</strong></p>\n</div>\n\n<p>Rodosha (&#x52b4;&#x50cd;&#x8005; - or <em>&quot;worker&quot;</em> in Japanese) are an easier\nway to deal with multi-threading in the browser by using\n<a href=\"https://developer.mozilla.org/en-US/docs/Web/Guide/Performance/Using_web_workers\"><em>Web Workers</em></a></p>\n<p>The implementation is wrapped in a <code>rodosha</code>\n<a href=\"https://github.com/usrz/javascript-esquire\"><em>Esquire</em></a> module which provides\na <code>create(...)</code> method. This method will return a <code>Promise</code> which will be\nresolved with the instance of the <code>Rodosha</code> or rejected with a failure:</p>\n<pre class=\"prettyprint source lang-javascript\"><code>esquire.inject(['rodosha'], function(rodoshaFactory) {\n  rodoshaFactory.create().then(function(rodosha) {\n    // foo! do something...\n  });\n})</code></pre><p><code>Rodosha</code>s operate mainly of <em>Esquire</em> modules which can be imported directly\nin a remote <code>worker</code>:</p>\n<pre class=\"prettyprint source lang-javascript\"><code>rodosha.import('module-a', 'module-b').then(function(imported) {\n  // the modules (and all their dipendencies) were imported...\n});</code></pre><h2>Object proxies</h2><p>After those modules are imported, local <strong>proxy</strong> objects pointing to their\ninstances in the worker can be created quite trivially:</p>\n<pre class=\"prettyprint source lang-javascript\"><code>rodosha.proxy('module-a').then(function(proxy) {\n  // the &quot;proxy&quot; variable is a local object proxying an instance in the worker\n})</code></pre><p>Any method and variable in objects being proxied will be replaced with a\n<code>Promise</code>, and method execution, or value retrieval will trigger a message,\nbe executed in the <code>Worker</code> and its result will resolve or reject the promise.</p>\n<p>So if a module defines a method called <code>foo()</code> and a variable <code>bar</code> like:</p>\n<pre class=\"prettyprint source lang-javascript\"><code>{\n  foo: function(arg) {\n    return &quot;Called with &quot; + arg;\n  },\n  bar: &quot;hello, world&quot;\n}</code></pre><p>It's proxy will return promises for both:</p>\n<pre class=\"prettyprint source lang-javascript\"><code>proxy.foo(&quot;my value&quot;).then(result) {\n  // result will be &quot;Called with my value&quot;\n}\nproxy.bar.then(value) {\n  // value will be &quot;hello world&quot;\n}</code></pre><p>What will happen under the covers is that <em>messages</em> will be sent to the\n<code>Worker</code> asking for the method to be executed in its remote native thread (or\nthe variable's value to be evaluated) and once a response is received locally\nthe returned promises will be resolved or rejected.</p>\n<h2>Proxies from functions</h2><p>A special note for <code>function</code> calls is that their return values can also be\nretrieved as a <strong>proxy</strong> object by invoking the <code>asProxy()</code> method on the\nreturned promise.</p>\n<p>So, for example, if a function is defined as:</p>\n<pre class=\"prettyprint source lang-javascript\"><code>function gimmeAnObject() {\n  // this will return a complex object, with functions and properties\n}</code></pre><p>Locally its result can be used through a <strong>proxy</strong> (henceforth, its methods\nwill still be invoked - and variables evaluated - in the <code>Worker</code>):</p>\n<pre class=\"prettyprint source lang-javascript\"><code>proxy.gimmeAnObject().asProxy().then(function(newProxy) {\n  // newProxy will be a proxy object to what's returned...\n})</code></pre><h2>Cleaning up</h2><p>Proxies can (should) be discarded when no longer needed, freeing up memory\nin the <code>Worker</code>:</p>\n<pre class=\"prettyprint source lang-javascript\"><code>rodosha.destroy(proy);</code></pre><p>The <code>Worker</code> itself can be closed gracefully</p>\n<pre class=\"prettyprint source lang-javascript\"><code>rodosha.close().then(function() {\n  // nicely closed\n});</code></pre><p>or terminated abruptly calling <code>rodosha.terminate()</code>.</p>\n<div class=\"nojsdoc\">\n  <h2>Further reading</h2>\n  <p>Licensed under the <a href=\"LICENSE.md\">Apache Software License 2.0</a></p>\n  <p>The full API documentation is avaiblable\n  <a target=\"_blank\" href=\"http://usrz.github.io/javascript-rodosha/\">here</a>.</p>\n</div>").constant('$doclets', [
  {
    "kind": "typedef",
    "name": "Rodosha",
    "type": {
      "names": [
        "module:rodosha.Rodosha"
      ]
    },
    "longname": "Rodosha",
    "scope": "global",
    "$href": "#Rodosha",
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
    "memberof": "module:rodosha/client",
    "longname": "module:rodosha/client.init",
    "scope": "static",
    "$href": "module:rodosha/client#init",
    "$id": "T000002R000011"
  },
  {
    "description": "<p>A module wrapping the <a href=\"#!/#Rodosha\"><code>Rodosha</code></a> client code (basically the code\nexecuted by the <a href=\"#!/Worker\"><code>Worker</code></a> in order to process and respond to messages\nfrom the <code>Server</code>).</p>",
    "kind": "module",
    "name": "rodosha/client",
    "longname": "module:rodosha/client",
    "$href": "module:rodosha/client",
    "$id": "T000002R000012"
  },
  {
    "description": "<p>A module providing utility functions for encoding and decoding messages to\nand from a <a href=\"#!/Worker\"><code>Worker</code></a>.</p>",
    "kind": "module",
    "name": "rodosha/messages",
    "longname": "module:rodosha/messages",
    "$href": "module:rodosha/messages",
    "$id": "T000002R000075"
  },
  {
    "classdesc": "<p>An <code>Error</code> received from or sent to a <a href=\"#!/Worker\"><code>Worker</code></a>.</p>",
    "kind": "class",
    "name": "RemoteError",
    "longname": "module:rodosha/messages~RemoteError",
    "scope": "inner",
    "memberof": "module:rodosha/messages",
    "$href": "module:rodosha/messages~RemoteError",
    "$id": "T000002R000076"
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
    "memberof": "module:rodosha/messages~RemoteError",
    "scope": "instance",
    "longname": "module:rodosha/messages~RemoteError#message",
    "$href": "module:rodosha/messages~RemoteError#message",
    "$id": "T000002R000078"
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
    "memberof": "module:rodosha/messages~RemoteError",
    "scope": "instance",
    "longname": "module:rodosha/messages~RemoteError#stack",
    "$href": "module:rodosha/messages~RemoteError#stack",
    "$id": "T000002R000084"
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
    "longname": "module:rodosha/messages~encode",
    "scope": "inner",
    "memberof": "module:rodosha/messages",
    "$href": "module:rodosha/messages#encode",
    "$id": "T000002R000098"
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
    "longname": "module:rodosha/messages~decode",
    "scope": "inner",
    "memberof": "module:rodosha/messages",
    "$href": "module:rodosha/messages#decode",
    "$id": "T000002R000112"
  },
  {
    "description": "<p>A module providing a utility function to wrap remote <a href=\"#!/Worker\"><code>Worker</code></a> objects.</p>",
    "kind": "module",
    "name": "rodosha/proxy",
    "longname": "module:rodosha/proxy",
    "$href": "module:rodosha/proxy",
    "$id": "T000002R000119"
  },
  {
    "kind": "class",
    "name": "ProxyPromise",
    "classdesc": "<p>A specialized <a href=\"#!/Promise\"><code>Promise</code></a> returned by <code>function</code>s invoked\n           on <strong>proxy</strong> objects.</p>",
    "augments": [
      "Promise"
    ],
    "memberof": "module:rodosha/proxy",
    "longname": "module:rodosha/proxy.ProxyPromise",
    "scope": "static",
    "$href": "module:rodosha/proxy.ProxyPromise",
    "$id": "T000002R000120"
  },
  {
    "description": "<p>Request that the object returned by the function call is stored as a\n<strong>proxy</strong> by the <a href=\"#!/Worker\"><code>Worker</code></a>.</p>\n<p>This instance will wait sending the method request to the remote\n<a href=\"#!/Worker\"><code>Worker</code></a> until a fulfillment or rejection handler is attached via\nthe <a href=\"#!/module:rodosha/proxy.ProxyPromise#then\"><code>then(...)</code></a> method.</p>",
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
        "description": "This method will throw an <code>Error</code> if the underlying\n           message requesting the call's result was already sent (if\n           <a href=\"#!/module:rodosha/proxy.ProxyPromise#then\"><code>then(...)</code></a> was\n           already called)."
      }
    ],
    "memberof": "module:rodosha/proxy.ProxyPromise",
    "longname": "module:rodosha/proxy.ProxyPromise#asProxy",
    "scope": "instance",
    "$href": "module:rodosha/proxy.ProxyPromise#asProxy",
    "$id": "T000002R000123"
  },
  {
    "description": "<p>Wrap the specified <strong>proxy</strong> definition instrumenting all functions with\nremote executors returning <a href=\"#!/module:rodosha/proxy.ProxyPromise\"><code>module:rodosha/proxy.ProxyPromise</code></a>s.</p>",
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
    "memberof": "module:rodosha/proxy",
    "longname": "module:rodosha/proxy.buildProxy",
    "scope": "static",
    "$href": "module:rodosha/proxy#buildProxy",
    "$id": "T000002R000157"
  },
  {
    "description": "<p>Create a new <a href=\"#!/module:rodosha/servers.Server\"><code>Server</code></a> instance wrapping\na <a href=\"#!/Worker\"><code>Worker</code></a>.</p>",
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
    "memberof": "module:rodosha/servers",
    "longname": "module:rodosha/servers.create",
    "scope": "static",
    "$href": "module:rodosha/servers#create",
    "$id": "T000002R000164"
  },
  {
    "description": "<p>A module wrapping the <a href=\"#!/#Rodosha\"><code>Rodosha</code></a> client code (basically the code executed\nby the <a href=\"#!/Worker\"><code>Worker</code></a> when starting up.</p>",
    "kind": "module",
    "name": "rodosha/servers",
    "longname": "module:rodosha/servers",
    "$href": "module:rodosha/servers",
    "$id": "T000002R000165"
  },
  {
    "kind": "class",
    "name": "Server",
    "classdesc": "<p>A wrapper for a remote <a href=\"#!/Worker\"><code>Worker</code></a> capable of sending\n           messages to it and processing received messages.</p>",
    "augments": [
      "module:rodosha.Rodosha"
    ],
    "memberof": "module:rodosha/servers",
    "longname": "module:rodosha/servers.Server",
    "scope": "static",
    "$href": "module:rodosha/servers.Server",
    "$id": "T000002R000170"
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
            "Rodosha"
          ]
        },
        "description": "<p>This instance.</p>"
      }
    ],
    "memberof": "module:rodosha/servers.Server",
    "longname": "module:rodosha/servers.Server#init",
    "scope": "instance",
    "$href": "module:rodosha/servers.Server#init",
    "$id": "T000002R000173"
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
    "memberof": "module:rodosha/servers.Server",
    "longname": "module:rodosha/servers.Server#send",
    "scope": "instance",
    "$href": "module:rodosha/servers.Server#send",
    "$id": "T000002R000177"
  },
  {
    "description": "<p>Dencode and process the specified message received from the\n<a href=\"#!/Worker\"><code>Worker</code></a>.</p>\n<p>This method will correlate received messages with sent ones and will\neither resolve or reject those <a href=\"#!/Promise\"><code>Promise</code></a>s returned by the\n<code>send(...)</code> method.</p>",
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
    "memberof": "module:rodosha/servers.Server",
    "longname": "module:rodosha/servers.Server#receive",
    "scope": "instance",
    "$href": "module:rodosha/servers.Server#receive",
    "$id": "T000002R000183"
  },
  {
    "description": "<p>A module dealing with browser <code>Blob</code>s and <a href=\"#!/Worker\"><code>Worker</code></a>s.</p>",
    "kind": "module",
    "name": "rodosha/workers",
    "longname": "module:rodosha/workers",
    "$href": "module:rodosha/workers",
    "$id": "T000002R000217"
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
    "longname": "module:rodosha/workers~makeBlob",
    "scope": "inner",
    "memberof": "module:rodosha/workers",
    "$href": "module:rodosha/workers#makeBlob",
    "$id": "T000002R000218"
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
    "longname": "module:rodosha/workers~makeURL",
    "scope": "inner",
    "memberof": "module:rodosha/workers",
    "$href": "module:rodosha/workers#makeURL",
    "$id": "T000002R000225"
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
    "longname": "module:rodosha/workers~makeWorker",
    "scope": "inner",
    "memberof": "module:rodosha/workers",
    "$href": "module:rodosha/workers#makeWorker",
    "$id": "T000002R000227"
  },
  {
    "description": "<p>Create a new <a href=\"#!/#Rodosha\"><code>Rodosha</code></a> instance.</p>",
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
        "description": "<p>A <a href=\"#!/Promise\"><code>Promise</code></a> for a <a href=\"#!/#Rodosha\"><code>Rodosha</code></a> instance.</p>"
      }
    ],
    "memberof": "module:rodosha",
    "longname": "module:rodosha.create",
    "scope": "static",
    "$href": "module:rodosha#create",
    "$id": "T000002R000232"
  },
  {
    "description": "<p>The main entry point for operating with <a href=\"#!/Worker\"><code>Worker</code></a>s and <a href=\"#!/#Rodosha\"><code>Rodosha</code></a>s.</p>",
    "kind": "module",
    "name": "rodosha",
    "longname": "module:rodosha",
    "$href": "module:rodosha",
    "$id": "T000002R000233"
  },
  {
    "kind": "class",
    "name": "Rodosha",
    "memberof": "module:rodosha",
    "classdesc": "<p>A <a href=\"#!/#Rodosha\"><code>Rodosha</code></a> instance wraps a web <a href=\"#!/Worker\"><code>Worker</code></a> and\n           simplifies its interaction throgh the use of proxy objects.</p>",
    "scope": "static",
    "longname": "module:rodosha.Rodosha",
    "$href": "module:rodosha.Rodosha",
    "$id": "T000002R000245"
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
    "memberof": "module:rodosha.Rodosha",
    "longname": "module:rodosha.Rodosha#import",
    "scope": "instance",
    "$href": "module:rodosha.Rodosha#import",
    "$id": "T000002R000247"
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
    "memberof": "module:rodosha.Rodosha",
    "longname": "module:rodosha.Rodosha#proxy",
    "scope": "instance",
    "$href": "module:rodosha.Rodosha#proxy",
    "$id": "T000002R000249"
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
    "memberof": "module:rodosha.Rodosha",
    "longname": "module:rodosha.Rodosha#destroy",
    "scope": "instance",
    "$href": "module:rodosha.Rodosha#destroy",
    "$id": "T000002R000251"
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
    "memberof": "module:rodosha.Rodosha",
    "longname": "module:rodosha.Rodosha#close",
    "scope": "instance",
    "$href": "module:rodosha.Rodosha#close",
    "$id": "T000002R000253"
  },
  {
    "description": "<p>Immediately terminate the underlying <a href=\"#!/Worker\"><code>Worker</code></a>, forcing all\npending messages to be discarded and unresolved <a href=\"#!/Promise\"><code>Promise</code></a>s to be\nrejected.</p>",
    "kind": "function",
    "name": "terminate",
    "memberof": "module:rodosha.Rodosha",
    "longname": "module:rodosha.Rodosha#terminate",
    "scope": "instance",
    "$href": "module:rodosha.Rodosha#terminate",
    "$id": "T000002R000255"
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
    "memberof": "module:rodosha/proxy.ProxyPromise",
    "longname": "module:rodosha/proxy.ProxyPromise#then",
    "inherits": "Promise#then",
    "inherited": true,
    "$href": "module:rodosha/proxy.ProxyPromise#then",
    "$id": "T000002R000260"
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
    "memberof": "module:rodosha/proxy.ProxyPromise",
    "longname": "module:rodosha/proxy.ProxyPromise#catch",
    "inherits": "Promise#catch",
    "inherited": true,
    "$href": "module:rodosha/proxy.ProxyPromise#catch",
    "$id": "T000002R000261"
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
    "memberof": "module:rodosha/servers.Server",
    "longname": "module:rodosha/servers.Server#import",
    "scope": "instance",
    "inherits": "module:rodosha.Rodosha#import",
    "inherited": true,
    "$href": "module:rodosha/servers.Server#import",
    "$id": "T000002R000262"
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
    "memberof": "module:rodosha/servers.Server",
    "longname": "module:rodosha/servers.Server#proxy",
    "scope": "instance",
    "inherits": "module:rodosha.Rodosha#proxy",
    "inherited": true,
    "$href": "module:rodosha/servers.Server#proxy",
    "$id": "T000002R000263"
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
    "memberof": "module:rodosha/servers.Server",
    "longname": "module:rodosha/servers.Server#destroy",
    "scope": "instance",
    "inherits": "module:rodosha.Rodosha#destroy",
    "inherited": true,
    "$href": "module:rodosha/servers.Server#destroy",
    "$id": "T000002R000264"
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
    "memberof": "module:rodosha/servers.Server",
    "longname": "module:rodosha/servers.Server#close",
    "scope": "instance",
    "inherits": "module:rodosha.Rodosha#close",
    "inherited": true,
    "$href": "module:rodosha/servers.Server#close",
    "$id": "T000002R000265"
  },
  {
    "description": "<p>Immediately terminate the underlying <a href=\"#!/Worker\"><code>Worker</code></a>, forcing all\npending messages to be discarded and unresolved <a href=\"#!/Promise\"><code>Promise</code></a>s to be\nrejected.</p>",
    "kind": "function",
    "name": "terminate",
    "memberof": "module:rodosha/servers.Server",
    "longname": "module:rodosha/servers.Server#terminate",
    "scope": "instance",
    "inherits": "module:rodosha.Rodosha#terminate",
    "inherited": true,
    "$href": "module:rodosha/servers.Server#terminate",
    "$id": "T000002R000266"
  }
]);})();