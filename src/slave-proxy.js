'use strict';

/**
 * A module providing a utility function to wrap remote {@link Worker} objects.
 *
 * @module slave/client
 */
Esquire.define('slave/proxy', ['slave/messages'], function(messages) {

  var encode = messages.encode;

  function defineProxy(object, stack) {
    if (! stack) stack = [];

    /* Functions always get invoked */
    if (typeof(object) === 'function') {
      return true; // invoke
    }

    /* Non-array objects will be defined recursively */
    if ((typeof(object) === 'object') && (!Array.isArray(object))) {

      /* Just triple check */
      if (stack.indexOf(object) >= 0) {
        throw new TypeError("Unable to proxy object: circular reference detected");
      }

      /* Recursively define this object */
      stack.push(object);
      var definition = {};
      for (var i in object) {
        definition[i] = defineProxy(object[i], stack);
      }
      stack.pop();
      return definition;

    }

    /* Everything else is just a getter */
    return false;
  }

  /**
   * Wrap the specified object replacing all functions with remote executors
   * returning {@link Promise}s.
   *
   * @param {*} object The object to wrap
   */
  function makeProxy(object, names, send) {
    if (! names) throw new Error("No name proxying object " + JSON.stringify(object));
    if (! Array.isArray(names)) names = [ names ];

    if (typeof(object) === 'object') {
      for (var i in object) {
        (function(i) {

          /* Child element of this object */
          var child = object[i];

          /* Clone our names stack and append our name */
          var clone = names.slice(0);
          clone.push(i);

          /* Basic properties for the object to define */
          var props = { enumerable: true, configurable: false };

          /* Depending on the kind... */
          if (typeof(child) === 'object') {

            props.value = makeProxy(child, clone, send);

          } else if (typeof(child) === 'function') {

            /* A function can be simply wrapped */
            props.value = makeProxy(child, clone, send);

          } else {

            props.get = function() {
              console.log("REQUESTING VALUE FOR", clone);
              return send({get: {
                proxy: clone
              }});
            }

          }

          Object.defineProperty(object, i, props);
          // names.push(i);
          // object[i] = makeProxy(object[i], names, send);
          // names.pop(i);
        })(i);
      }

      return object;

    } else if (typeof(object) === 'function') {
      var clone = names.slice(0);
      return function() {
        return send({invoke: {
          proxy: clone,
          arguments: encode(arguments)
        }});
      };

    } else {
      var clone = names.slice(0);
      return send({get: { proxy: clone }});

    }

  }

  return Object.freeze({
    defineProxy: defineProxy,
    makeProxy: makeProxy
  });

});
