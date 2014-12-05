'use strict';

/**
 * A module providing a utility function to wrap remote {@link Worker} objects.
 *
 * @module rodosha/proxy
 */
Esquire.define('rodosha/proxy', ['$promise'], function(Promise) {

  /**
   * @class module:rodosha/proxy.ProxyPromise
   * @classdesc A specialized {@link Promise} returned by `function`s invoked
   *            on **proxy** objects.
   * @extends Promise
   */
  function ProxyPromise(message, send, initialValue) {
    var promise = null;

    /**
     * Request that the object returned by the function call is stored as a
     * **proxy** by the {@link Worker}.
     *
     * This instance will wait sending the method request to the remote
     * {@link Worker} until a fulfillment or rejection handler is attached via
     * the {@link module:rodosha/proxy.ProxyPromise#then then(...)} method.
     *
     * @function module:rodosha/proxy.ProxyPromise#asProxy
     * @param {boolean} [proxy] If `true` (or unspecified) the object returned
     *                          by the call will be a **proxy** object.
     * @return {ProxyPromise} This `very` instance.
     * @exception This method will throw an {@link Error} if the underlying
     *            message requesting the call's result was already sent (if
     *            {@link module:rodosha/proxy.ProxyPromise#then then(...)} was
     *            already called).
     */
    this.asProxy = function(proxy) {
      /* If we haven't sent the message, request a new proxy object */
      if (promise != null) throw new Error("Message already sent");
      if (proxy === undefined) proxy = true;
      if (proxy) message.makeProxy = true;
      return this;
    }

    /**
     * Return the initial value stored by this proxy instance, or in other
     * words, the value that was recorded by this proxy instance from its last
     * round trip (either a get or a set).
     *
     * This always returns `undefined` for function calls.
     *
     * @function module:rodosha/proxy.ProxyPromise#initialValue
     * @return {*} The initial value stored by this proxy instance.
     */
    this.initialValue = function() {
      return initialValue;
    }

    /*
     * Define this.then() and this.catch() here, rather than in the prototype,
     * for when functions are invoked with "new F(..)"... Just easier!
     */
    this.then = function(onSuccess, onFailure) {
      /* Send the message if we haven't done so already */
      try {
        if (promise == null) promise = send(message);
      } catch (error) {
        promise = Promise.reject(error);
      }
      /* Set up the promise's handlers */
      return promise.then(onSuccess, onFailure);
    }

    this.catch = function(onFailure) {
      return this.then(null, onFailure);
    }
  }

  /* ======================================================================== */

  function makeProxy(definition, names, send, rootDefinition) {
    if (! names) throw new Error("No name proxying definition " + JSON.stringify(definition));
    if (! Array.isArray(names)) names = [ names ];

    /* All definitions are objects! */
    if (typeof(definition) !== 'object') {
      throw new Error("Wrong proxy definition at " + names.join('.') + " for \n"
                    + JSON.stringify(rootDefinition, null, 1));
    }

    /* Initial object */
    var object = {};

    /* Function definitions, can be also at top level */
    if (definition['!$invocable$!'] === true) {
      var clone = names.slice(0);

      /* Can be called as "new F()" or "f()" */
      var Invocable = function() {

        /* Prepare our message */
        var message = { proxy: { proxy: clone, arguments: arguments }};

        /* Is this "new F()" or a normal call? */
        if (this instanceof Invocable) {
          message.newInstance = true;
          ProxyPromise.call(this, message, send);
          this.asProxy(true);
        } else {
          return new ProxyPromise(message, send);
        }
      }

      /* Functions can have members, so keep processing */
      object = Invocable;

    }

    /* Clone all the members of the definition */
    for (var i in definition) {
      (function(i) {
        var child = definition[i];
        var clone = names.slice(0);
        clone.push(i);

        /* Basic properties for the object to define */
        var props = { enumerable: true, configurable: false };

        /* Function definitions */
        if (child['!$invocable$!'] === true) {
          props.value = makeProxy(child, clone, send, rootDefinition);
        }

        /* Setters/getters definitions */
        else if (child.hasOwnProperty('!$value$!')) {
          var initialValue = child['!$value$!'];
          props['get'] = function() {
            var message = { proxy: { proxy: clone } };
            var promise = new ProxyPromise(message, send, initialValue);
            promise.asProxy = function() { return promise } // already a proxy
            promise.then(function(success) { initialValue = success });
            return promise; // return the original ProxyPromise instance
          };
          props['set'] = function(value) {
            initialValue = value;
            send({ proxy: { value: value, proxy: clone } })
              .then(function(success) { initialValue = success });
          };
        }

        /* Nested definitions get recursively processed */
        else if (typeof(child) === 'object') {
          props.value = makeProxy(child, clone, send, rootDefinition);
        }

        else if (i !== '!$invocable$!') {
          throw new Error("Wrong proxy definition at " + names.join('.') + "." + i + " for \n"
                        + JSON.stringify(rootDefinition, null, 1));
        }

        /* Define the properties for this */
        Object.defineProperty(object, i, props);
      })(i);
    }

    /* All done, return our object clone */
    return object;
  }

  /**
   * Wrap the specified **proxy** definition instrumenting all functions with
   * remote executors returning {@link module:rodosha/proxy.ProxyPromise}s.
   *
   * @function module:rodosha/proxy.buildProxy
   * @param {*} definition The definition to wrap
   * @return {object} A **proxy** object to an instance from the {@link Worker}.
   */
  function buildProxy(proxy, server) {
    return makeProxy(proxy.definition, [ proxy.id ], server.send, proxy.definition);
  }

  return Object.freeze({ buildProxy: buildProxy });

});
