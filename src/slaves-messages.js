'use strict';

/**
 * A module providing utility functions for encoding and decoding messages to
 * and from a {@link Worker}.
 *
 * @module rodosha/messages
 */
Esquire.define('rodosha/messages', [], function messages() {

  /**
   * @classdesc An {@link Error} received from or sent to a {@link Worker}.
   * @class RemoteError
   */
  function RemoteError(error) {
    /**
     * @member {string} message A message detailing the error.
     * @memberof module:rodosha/messages~RemoteError
     * @instance
     */
    var message = error.message || "Unknown error";
    var name = "RemoteError" + (error.name ? ("[" + error.name + "]") : "");
    Error.call(message);

    /* Inject properties */
    this.message = message;
    this.name = name;
    this.toString = function() {
      return name + ": " + message;
    }

    /**
     * @member {string} stack The stack trace associated with this instance,
     *                        combining both local and remote details.
     * @memberof module:rodosha/messages~RemoteError
     * @instance
     */
    var localStack = this.stack || new Error().stack;
    if (localStack) localStack = localStack.replace(/^(Remote)?Error\n/, '');

    if ((error.stack) || (localStack)) {
      var stack = this.toString();
      if (error.stack) stack += "\n- Remote stack:\n" + error.stack;
      if (localStack)  stack += "\n- Local stack:\n"  + localStack;
      this.stack = stack;
    }

  }

  RemoteError.prototype = Object.create(Error.prototype);
  RemoteError.prototype.constructor = RemoteError;
  RemoteError.prototype.name = 'RemoteError';

  /* ======================================================================== */

  /*
   * Copy a source object onto a target, making sure we don't loop, and
   * encoding or decoding all of its members
   */
  function copy(source, target, stack, call) {
    /* Check the stack */
    if (stack.indexOf(source) >= 0) {
      throw new TypeError("Unable to (en|de)code object: circular reference detected");
    } else {
      stack.push(source);
    }

    /* PhantomJS's arguments are not enumerable */
    if (source.hasOwnProperty('callee') && (typeof(source.length) === 'number')) {
      for (var i = 0; i < source.length; i ++) {
        target[i] = call(source[i], stack);
      }
    } else {
      for (var i in source) {
        target[i] = call(source[i], stack);
      }
    }

    /* Pop source from stack and continue */
    stack.pop();
    return target;
  }

  /**
   * Encode a message prior to sending it over with `postMessage()`.
   *
   * @function encode
   * @param {*} decoded - The object to encode (anything, really)
   * @returns {*} The encoded object
   */
  function encode(decoded, stack) {
    if (!stack) stack = [];

    if (decoded === undefined) return undefined;
    if (decoded === null) return null;

    var type = typeof(decoded);
    if (type === 'undefined') return undefined;
    if (type === 'boolean') return decoded;
    if (type === 'number') return decoded;
    if (type === 'string') return decoded;
    if (type === 'function') return { "__$$function$$__": decoded.toString() };

    if (type === 'object') {

      if (decoded instanceof ArrayBuffer) return decoded;
      if (decoded.buffer instanceof ArrayBuffer) return decoded;

      /* Normal arrays */
      if (Array.isArray(decoded)) {
        return copy(decoded, [], stack, encode);
      }

      /* Arguments array */
      else if (decoded.hasOwnProperty('callee') && (typeof(arguments.length) === 'number')) {
        return copy(decoded, [], stack, encode);
      }

      /* Error object */
      else if (decoded instanceof Error) {
        var name = decoded.name || Object.getPrototypeOf(decoded).name;
        var message = decoded.message;
        var stack = decoded.stack;
        var error = {};
        if (name) error.name = name;
        if (message) error.message = message;
        if (stack) error.stack = stack;
        return { "__$$error$$__": error };
      }

      /* Other (normal) object */
      else return copy(decoded, {}, stack, encode);

    }
    return { "__$$typeof$$__": type };
  };

  /**
   * Decode a message after receiving it from `onessage()`.
   *
   * @function decode
   * @param {*} encoded - The object to decode (anything, really)
   * @returns {*} The decoded object
   */
  function decode(encoded, stack) {
    if (!stack) stack = [];

    if (encoded === undefined) return undefined;
    if (encoded === null) return null;

    var type = typeof(encoded);
    if (type === 'undefined') return undefined;
    if (type === 'boolean') return encoded;
    if (type === 'number') return encoded;
    if (type === 'string') return encoded;

    if (type === 'object') {

      if (encoded instanceof ArrayBuffer) return encoded;
      if (encoded.buffer instanceof ArrayBuffer) return encoded;

      if (Array.isArray(encoded)) {
        return copy(encoded, [], stack, decode);
      }

      else if (encoded["__$$error$$__"] != null) {
        return new RemoteError(encoded["__$$error$$__"]);
      }

      else if (encoded["__$$function$$__"] != null) {
        return eval('(' + encoded["__$$function$$__"] + ')');
      }

      /* Other (normal) object */
      else {
        return copy(encoded, {}, stack, decode);
      }
    }

    throw new TypeError("Error decoding " + type + ": " + JSON.stringify(encoded));
  }

  return Object.freeze({
    RemoteError: RemoteError,
    encode: encode,
    decode: decode
  });

});
