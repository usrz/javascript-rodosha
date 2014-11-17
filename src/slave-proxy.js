'use strict';

/**
 * A module providing a utility function to wrap remote {@link Worker} objects.
 *
 * @module slave/proxy
 */
Esquire.define('slave/proxy', ['promize'], function(promize) {

  function sendOrProxy(send, message) {
    var deferred = new promize.Deferred();
    var sent = false;
    window.setTimeout(function() {
      sent = true;
      deferred.resolve(send(message));
      // send(message).then(
      //   function(success) { deferred.resolve(success) },
      //   function(failure) { deferred.reject(failure) }
      // );
    });

    Object.defineProperty(deferred.promise, "asPromise", {
      enumerable: true, configurable: false,
      get: function() {
        if (sent) throw new Error("Message already sent");
        message.asProxy = true;
        return this;
      }
    });

    return deferred.promise;
  }

  /**
   * Wrap the specified object replacing all functions with remote executors
   * returning {@link Promise}s.
   *
   * @param {*} definition The definition to wrap
   */
  function makeProxy(definition, names, send) {
    if (! names) throw new Error("No name proxying definition " + JSON.stringify(definition));
    if (! Array.isArray(names)) names = [ names ];

    /* Object definitions need to be re-wrapped */
    if (typeof(definition) === 'object') {

      var object = {};
      for (var i in definition) {
        (function(i) {
          var child = definition[i];
          var clone = names.slice(0);
          clone.push(i);

          /* Basic properties for the object to define */
          var props = { enumerable: true, configurable: false };

          if (typeof(child) === 'object') {
            /* Create dynamic proxies for nested definitions */
            props.get = function() { return makeProxy(child, clone, send) }

          } else if (child === true) {
            /* A function can be simply wrapped (call recursively) */
            props.value = makeProxy(child, clone, send);

          } else {
            /* All other properties just request values asynchronously */
            props.get = function() { return sendOrProxy(send, { get: { proxy: clone } })};
            props.set = function() { return send({ set: { proxy: clone } })};

          }

          /* Define the properties for this */
          Object.defineProperty(object, i, props);
        })(i);
      }

      return object;

    }

    /* The definition is "true" meaning "invoke me" */
    if (definition === true) {
      var clone = names.slice(0);
      // return sendOrProxy(send, { invoke: { proxy: clone, arguments: arguments }});
      return function() {
        return sendOrProxy(send, { invoke: { proxy: clone, arguments: arguments }});
        // var args = arguments;
        // var deferred = new promize.Deferred();
        // window.setTimeout(function() {
        //   console.log("SEND", JSON.stringify({ invoke: { proxy: clone, arguments: args }}));
        //   send({ invoke: { proxy: clone, arguments: args }}).then(
        //     function(success) { console.log("OK", success); deferred.resolve(success) },
        //     function(failure) { console.log("NO", failure); deferred.reject(failure) }
        //   );
        // });
        // return deferred.promise;

        //return send({ invoke: { proxy: clone, arguments: arguments }});
      }
    }

    /* The definition is "false", meaning request a remote value */
    throw new Error("Wrong proxy definition for ", names);

  }

  return Object.freeze({
    makeProxy: makeProxy
  });

});
