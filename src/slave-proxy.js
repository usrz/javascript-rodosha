'use strict';

/**
 * A module providing a utility function to wrap remote {@link Worker} objects.
 *
 * @module slave/client
 */
Esquire.define('slave/proxy', ['slave/messages'], function(messages) {

  var encode = messages.encode;

  /**
   * Wrap the specified object replacing all functions with remote executors
   * returning {@link Promise}s.
   *
   * @param {*} object The object to wrap
   */
  function makeProxy(object, names, send, getter) {
    if (! names) throw new Error("No name proxying object " + JSON.stringify(object));
    if (! Array.isArray(names)) names = [ names ];

    if (typeof(object) === 'object') {
      if (getter) {
        var clone = names.slice(0);
        return function() {
          return makeProxy(object, clone, send);
        };
      } else {
        for (var i in object) {
            (function(i) {
              var child = object[i];
              var clone = names.slice(0);
              clone.push(i);

              Object.defineProperty(object, i, {
                enumerable: true,
                configurable: true,
                get: function() {
                  console.log("CREATING DYNAMIC PROXY", clone);
                  return makeProxy(child, clone, send);
                }
              });
              // names.push(i);
              // object[i] = makeProxy(object[i], names, send);
              // names.pop(i);
            })(i);
        }
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
      if (getter) {
        var clone = names.slice(0);
        return function() {
          return send({get: {
            proxy: clone
          }});
        }
      } else {
        return object;
      }
    }

  }

  return Object.freeze({ makeProxy : makeProxy });

});
