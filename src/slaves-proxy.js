'use strict';

/**
 * A module providing a utility function to wrap remote {@link Worker} objects.
 *
 * @module slaves/proxy
 */
Esquire.define('slaves/proxy', ['promize'], function(promize) {

  /**
   * @class module:slaves/proxy.ProxyPromise
   * @classdesc A specialized {@link Promise} returned by `function`s invoked
   *            on **proxy** objects.
   * @extends Promise
   */
  function ProxyPromise(message, send) {
    var promise = null;

    /**
     * Request that the object returned by the function call is stored as a
     * **proxy** by the {@link Worker}.
     *
     * This instance will wait sending the method request to the remote
     * {@link Worker} until a fulfillment or rejection handler is attached via
     * the {@link module:slaves/proxy.ProxyPromise#then then(...)} method.
     *
     * @function module:slaves/proxy.ProxyPromise#asProxy
     * @param {boolean} [proxy] If `true` (or unspecified) the object returned
     *                          by the call will be a **proxy** object.
     * @return {ProxyPromise} This `very` instance.
     * @exception This method will throw an {@link Error} if the underlying
     *            message requesting the call's result was already sent (if
     *            {@link module:slaves/proxy.ProxyPromise#then then(...)} was
     *            already called).
     */
    this.asProxy = function(proxy) {
      /* If we haven't sent the message, request a new proxy object */
      if (promise != null) throw new Error("Message already sent");
      if (proxy === undefined) proxy = true;
      if (proxy) message.makeProxy = true;
      return this;
    }

    this.then = function(onSuccess, onFailure) {
      /* Send the message if we haven't done so already */
      try {
        if (promise == null) promise = send(message);
      } catch (error) {
        promise = promize.Promise.reject(error);
      }
      /* Set up the promise's handlers */
      return promise.then(onSuccess, onFailure);
    }

  };

  ProxyPromise.prototype.catch = function(onFailure) {
    return this.then(null, onFailure);
  }

  /* ======================================================================== */

  function makeProxy(definition, names, send) {
    if (! names) throw new Error("No name proxying definition " + JSON.stringify(definition));
    if (! Array.isArray(names)) names = [ names ];

    /* Object definitions need to be re-wrapped */
    if (typeof(definition) === 'object') {

      var object = Object.defineProperty({}, "$$proxyId$$", {
        enumerable: false, configurable: false, value: names[0]
      });

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
            props['get'] = function() { return send({ proxy: { proxy: clone } })};
            props['set'] = function(v) { send({ proxy: { value: v, proxy: clone } }) };
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
      return function() {
        /* Prepare our message and return a promise to send */
        var message = { proxy: { proxy: clone, arguments: arguments }};
        return new ProxyPromise(message, send);
      }
    }

    /* The definition is "false", meaning request a remote value */
    throw new Error("Wrong proxy definition for ", names);

  }

  /**
   * Wrap the specified **proxy** definition instrumenting all functions with
   * remote executors returning {@link module:slaves/proxy.ProxyPromise}s.
   *
   * @function module:slaves/proxy.buildProxy
   * @param {*} definition The definition to wrap
   * @return {object} A **proxy** object to an instance from the {@link Worker}.
   */
  function buildProxy(proxy, server) {
    var object = makeProxy(proxy.definition, [ proxy.id ], server.send);
    return Object.defineProperty(object, "$$proxyId$$", {
      enumerable: false, configurable: false, value: proxy.id
    });
  }

  return Object.freeze({ buildProxy: buildProxy });

});
