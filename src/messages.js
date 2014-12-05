'use strict';

/**
 * A module providing utility functions for encoding and decoding messages to
 * and from a {@link Worker}.
 *
 * @module rodosha/messages
 */
Esquire.define('rodosha/messages', [ '$global/process',
                                     '$global/Buffer',
                                     '$global/ArrayBuffer',
                                     '$global/DataView',
                                     '$global/Int8Array',
                                     '$global/Uint8Array',
                                     '$global/Int16Array',
                                     '$global/Uint16Array',
                                     '$global/Int32Array',
                                     '$global/Uint32Array',
                                     '$global/Float32Array',
                                     '$global/Uint8ClampedArray',
                                     '$global/Float64Array' ],
function messages(process,
                  Buffer,
                  ArrayBuffer,
                  DataView,
                  Int8Array,
                  Uint8Array,
                  Int16Array,
                  Uint16Array,
                  Int32Array,
                  Uint32Array,
                  Float32Array,
                  Uint8ClampedArray,
                  Float64Array) {

  /* Node.JS has "process", PhantomJS does not have ArrayBuffer.isView */
  var nativeTransfers = ((process == null) && (ArrayBuffer.isView != null));

  var transferableUndefined  = nativeTransfers ? undefined : { "__$$native$$__" : "undefined" };
  var transferableNotANumber = nativeTransfers ? NaN       : { "__$$native$$__" : "NaN"       };

  function transferDate(date) {
    if (nativeTransfers) return date;
    return { "__$$native$$__" : { "Date" : date.getTime() }};
  }

  function transferRegExp(expr) {
    if (nativeTransfers) return expr;
    return { "__$$native$$__" : { "RegExp" : expr.toString() }};
  }

  /* ======================================================================== */
  /* ARRAY BUFFERS                                                            */
  /* ======================================================================== */

  function decodeArrayBuffer(array) {

    /* Speedup on Node.JS using native BASE64 */
    if (process && Buffer && (array['__$$base64$$__'] != null)) {
      return new Uint8Array(new Buffer(array['__$$base64$$__'], 'base64')).buffer
    }

    /* Normal array processing */
    return new Uint8Array(array).buffer;
  }

  function encodeArrayBuffer(view) {
    /* Always transfer as bytes, with floats we might get NaNs */
    if (!(view instanceof Uint8Array)) {
      view = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    }

    /* Speedup on Node.JS using native BASE64 */
    if (process && Buffer) {
      return { "__$$base64$$__": new Buffer(view).toString('base64') };
    }

    /* Convert the bytes into an array */
    var array = new Array(view.length);
    for (var i = 0; i < view.length; i ++)
      array[i] = view[i];
    return array;
  }


  function receiveNative(object) {
    /* Basics */
    if (object === 'undefined') return undefined;
    if (object === 'NaN') return NaN;
    if (object['Date'])   return new Date(object['Date']);
    if (object['RegExp']) return eval(object['RegExp']);

    if (object['ArrayBuffer'       ]) return                       decodeArrayBuffer(object['ArrayBuffer'       ]);

    if (object['Int8Array'         ]) return new Int8Array        (decodeArrayBuffer(object['Int8Array'         ]));
    if (object['Uint8Array'        ]) return new Uint8Array       (decodeArrayBuffer(object['Uint8Array'        ]));
    if (object['Int16Array'        ]) return new Int16Array       (decodeArrayBuffer(object['Int16Array'        ]));
    if (object['Uint16Array'       ]) return new Uint16Array      (decodeArrayBuffer(object['Uint16Array'       ]));
    if (object['Int32Array'        ]) return new Int32Array       (decodeArrayBuffer(object['Int32Array'        ]));
    if (object['Uint32Array'       ]) return new Uint32Array      (decodeArrayBuffer(object['Uint32Array'       ]));
    if (object['Float32Array'      ]) return new Float32Array     (decodeArrayBuffer(object['Float32Array'      ]));
    if (object['Uint8ClampedArray' ]) return new Uint8ClampedArray(decodeArrayBuffer(object['Uint8ClampedArray' ]));
    if (object['Float64Array'      ]) return new Float64Array     (decodeArrayBuffer(object['Float64Array'      ]));

    throw new Error("Unknown native object " + JSON.stringify(object));
  }

  function encodeBufferOrView(decoded) {
    if (nativeTransfers) return decoded;

    if (decoded instanceof ArrayBuffer)       return { "__$$native$$__": { "ArrayBuffer"       : encodeArrayBuffer(new Uint8Array(decoded)) }};
    if (decoded instanceof Int8Array)         return { "__$$native$$__": { "Int8Array"         : encodeArrayBuffer(decoded) }};
    if (decoded instanceof Uint8Array)        return { "__$$native$$__": { "Uint8Array"        : encodeArrayBuffer(decoded) }};
    if (decoded instanceof Int16Array)        return { "__$$native$$__": { "Int16Array"        : encodeArrayBuffer(decoded) }};
    if (decoded instanceof Uint16Array)       return { "__$$native$$__": { "Uint16Array"       : encodeArrayBuffer(decoded) }};
    if (decoded instanceof Int32Array)        return { "__$$native$$__": { "Int32Array"        : encodeArrayBuffer(decoded) }};
    if (decoded instanceof Uint32Array)       return { "__$$native$$__": { "Uint32Array"       : encodeArrayBuffer(decoded) }};
    if (decoded instanceof Float32Array)      return { "__$$native$$__": { "Float32Array"      : encodeArrayBuffer(decoded) }};
    if (decoded instanceof Uint8ClampedArray) return { "__$$native$$__": { "Uint8ClampedArray" : encodeArrayBuffer(decoded) }};
    if (decoded instanceof Float64Array)      return { "__$$native$$__": { "Float64Array"      : encodeArrayBuffer(decoded) }};

    throw new Error("Unable to encode ArrayBuffer or TypedArray (wrong type)");

  }

  function isBufferOrView(object) {
    if (object instanceof ArrayBuffer) return true;
    if (ArrayBuffer.isView) return ArrayBuffer.isView(object);

    /* No "ArrayBuffer.isView()", basically Node or PhantomJS */
    if (DataView          && (object instanceof DataView         )) return true;
    if (Int8Array         && (object instanceof Int8Array        )) return true;
    if (Uint8Array        && (object instanceof Uint8Array       )) return true;
    if (Int16Array        && (object instanceof Int16Array       )) return true;
    if (Uint16Array       && (object instanceof Uint16Array      )) return true;
    if (Int32Array        && (object instanceof Int32Array       )) return true;
    if (Uint32Array       && (object instanceof Uint32Array      )) return true;
    if (Float32Array      && (object instanceof Float32Array     )) return true;
    if (Uint8ClampedArray && (object instanceof Uint8ClampedArray)) return true;
    if (Float64Array      && (object instanceof Float64Array     )) return true;
    return false;
  }

  /* ======================================================================== */

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

  function toUint8Array(object) {
    if (object instanceof Uint8Array) return object;
    if (Array.isArray(object)) return new Uint8Array(object);
    if (('byteOffset' in object) && ('byteLength' in object)) {
      var array = new Array(object.byteLength);
      for (var i = 0; i < object.byteLength; i++) {
        array[i] = object[i + object.byteOffset];
      }
      return new Uint8Array(array);
    }
    throw new Error("Unable to create Uint8Array");
  }

  /* ======================================================================== */
  /* ENCODING AND DECODING OF MESSAGES                                        */
  /* ======================================================================== */

  var proxies = {};
  var lastProxyId = 0;

  function addProxy(object, id) {
    if (object == null) throw new Error("Unable to proxy null object");
    if (object.hasOwnProperty("__$$proxyId$$__")) return object["__$$proxyId$$__"];

    if (! id) id = "proxy_" + (++ lastProxyId);

    Object.defineProperty(object, "__$$proxyId$$__", { enumerable: false, configurable: false, value: id });
    if (object["__$$proxyId$$__"] != id) {
      throw new Error("Unable to set proxy ID " + id + " on object instance (frozen?)");
    }

    proxies[id] = object;
    return id;
  };

  function getProxy(id) {
    if (proxies.hasOwnProperty(id)) return proxies[id];
    throw new Error("Unkwnown proxy: " + proxyId);
  };

  function deleteProxy(idOrObject) {
    if (proxies.hasOwnProperty(idOrObject)) {
      delete proxies[idOrObject];
      return idOrObject;
    } else if (idOrObject.hasOwnProperty('__$$proxyId$$__')) {
      var id = idOrObject['__$$proxyId$$__'];
      delete proxies[id];
      return id;
    } else {
      throw new Error("Can't delete unkwnown proxy: " + proxyId);
    }
  };

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

    if (decoded === undefined) return transferableUndefined;
    if (decoded === null) return null;

    var type = typeof(decoded);

    if (type === 'boolean') return decoded;
    if (type === 'string') return decoded;
    if (type === 'function') return { "__$$function$$__": decoded.toString() };

    if (type === 'number') {
      if (isNaN(decoded)) {
        return transferableNotANumber;
      } else {
        return decoded;
      }
    }

    if (type === 'object') {

      /* Proxy references */
      if (decoded.hasOwnProperty('__$$proxyId$$__')) {
        return { "__$$proxyId$$__": decoded['__$$proxyId$$__'] };
      }

      /* ArrayBuffers, views, dates, regular expressions, ... */
      if (isBufferOrView(decoded)) return encodeBufferOrView(decoded);
      if (decoded instanceof Date) return transferDate(decoded);
      if (decoded instanceof RegExp) return transferRegExp(decoded);

      /* Error object */
      if (decoded instanceof Error) {
        var name = decoded.name || Object.getPrototypeOf(decoded).name;
        var message = decoded.message;
        var stack = decoded.stack;
        var error = {};
        if (name) error.name = name;
        if (message) error.message = message;
        if (stack) error.stack = stack;
        return { "__$$error$$__": error };
      }

      /* Normal arrays and arrays from arguments calls */
      if ((decoded.hasOwnProperty('callee') && (typeof(decoded.length) === 'number'))
          || Array.isArray(decoded)) {
        return copy(decoded, [], stack, encode);
      }

      /* Other (normal) object */
      return copy(decoded, {}, stack, encode);

    }

    throw new Error("Unable to transfer " + type);
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

    if (type === 'boolean') return encoded;
    if (type === 'number') return encoded;
    if (type === 'string') return encoded;

    if (type === 'object') {

      /* Native transfer of ArrayBuffer(s), views, dates, regular expressions */
      if (isBufferOrView(encoded)) return encoded;
      if (encoded instanceof Date) return encoded;
      if (encoded instanceof RegExp) return encoded;

      /* Errors */
      if (encoded["__$$error$$__"] != null) {
        return new RemoteError(encoded["__$$error$$__"]);
      }

      /* Functions */
      if (encoded["__$$function$$__"] != null) {
        return eval('(' + encoded["__$$function$$__"] + ')');
      }

      /* Native transfers */
      if (encoded["__$$native$$__"] != null) {
        return receiveNative(encoded["__$$native$$__"]);
      }

      /* Proxy references */
      if (encoded["__$$proxyId$$__"] != null) {
        return getProxy(encoded["__$$proxyId$$__"]);
      }

      /* Other (normal) object and arrays */
      return copy(encoded, encoded, stack, decode);
    }

    throw new TypeError("Error decoding " + type + ": " + JSON.stringify(encoded));
  }

  return Object.freeze({
    RemoteError: RemoteError,
    nativeTransfers: nativeTransfers,

    proxies: proxies,
    addProxy: addProxy,
    getProxy: getProxy,
    deleteProxy: deleteProxy,

    encode: encode,
    decode: decode
  });

});
