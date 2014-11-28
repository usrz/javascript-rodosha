'use strict';

esquire(['$global', 'rodosha', 'test/types'], function($global, rodosha, types) {

  /* Prepare an ArrayBuffer */
  function makeArray() {
    var buffer = new ArrayBuffer(128);
    var view = new Uint8Array(buffer);
    for (var i = 0; i < view.length; i ++) {
      view[i] = Math.floor(Math.random() * 256);
    };
    return buffer;
  }

  /* ArrayBuffer and typed arrays */
  var myArrayBuffer       = makeArray();
  var myDataView          = new DataView(makeArray());

  var normalInt8Array     = new Int8Array(makeArray());
  var normalUint8Array    = new Uint8Array(makeArray());
  var normalInt16Array    = new Int16Array(makeArray());
  var normalUint16Array   = new Uint16Array(makeArray());
  var normalInt32Array    = new Int32Array(makeArray());
  var normalUint32Array   = new Uint32Array(makeArray());
  var normalFloat32Array  = new Float32Array(makeArray());

  var partialInt8Array    = new Int8Array(makeArray(),    8, 10);
  var partialUint8Array   = new Uint8Array(makeArray(),   8, 10);
  var partialInt16Array   = new Int16Array(makeArray(),   8, 10);
  var partialUint16Array  = new Uint16Array(makeArray(),  8, 10);
  var partialInt32Array   = new Int32Array(makeArray(),   8, 10);
  var partialUint32Array  = new Uint32Array(makeArray(),  8, 10);
  var partialFloat32Array = new Float32Array(makeArray(), 8, 10);

  /* Not supported by PhantomJS */
  if ($global.Uint8ClampedArray) {
    var normalUint8ClampedArray  = new $global.Uint8ClampedArray(makeArray());
    var partialUint8ClampedArray = new $global.Uint8ClampedArray(makeArray(), 8, 10);
  }

  if ($global.Float64Array) {
    var normalFloat64Array  = new $global.Float64Array(makeArray());
    var partialFloat64Array = new $global.Float64Array(makeArray(), 8, 10);
  }

  /* Check typed arrays (regardless of array buffer) */
  function arrayToString(view) {
    var array = new Array(view.length);
    for (var i = 0; i < view.length; i++) array[i] = view[i];
    return "len=" + view.length + ", data=[" + array.join(", ") + "]";
  }

  function checkTypedArrays(received, expected) {
    var constructor = Object.getPrototypeOf(expected).constructor;
    expect(received, "Invalid type received").to.be.instanceof(constructor);
    expect(received.length, "Wrong length").to.be.equal(expected.length);

    var success = true;
    var wrongIndexes = [];
    for (var i = 0; i < received.length; i ++) {
      if (received[i] === expected[i]) continue;
      if (isNaN(received[i]) && isNaN(expected[i])) continue;
      wrongIndexes.push(i);
      success = false;
    }

    if (success) return;
    throw new Error("Element members differ at indexes [" + wrongIndexes.join(", ") + "]" +
                    "\n- Received: " + arrayToString(received) +
                    "\n- Expected: " + arrayToString(expected));
  }

  /* ======================================================================== */

  var proxy = rodosha.create('test/types', false)
    .then(function(server) {
      return server.proxy('test/types');
    });

  describe("Types", function() {

    it("should validate locally", function() {
      types.test_undefined(undefined);
      types.test_null(null);
      types.test_number(123);
      types.test_number(Number.NaN);
      types.test_string('hello');
      types.test_object({string: 'hello', number: 123, nan: NaN});
      types.test_array([1,'two',3,'four']);
      types.test_date(new Date());
    });

    /* ====================================================================== */

    promises("should validate undefined", function() {
      return proxy.then(function(types) {
        return types.test_undefined(undefined);
      }).then(function(result) {
        expect(result).to.be.a('undefined');
      })
    })

    promises("should validate null", function() {
      return proxy.then(function(types) {
        return types.test_null(null);
      }).then(function(result) {
        expect(result).to.be.null;
      })
    })

    promises("should validate numbers", function() {
      return proxy.then(function(types) {
        return types.test_number(123.456);
      }).then(function(result) {
        expect(result).to.be.a('number');
        expect(result).to.be.equal(123.456);
      })
    })

    promises("should validate NaN", function() {
      return proxy.then(function(types) {
        return types.test_number(Number.NaN);
      }).then(function(result) {
        expect(result).to.be.a('number');
        expect(isNaN(result)).to.be.true;
      })
    })

    promises("should validate strings", function() {
      return proxy.then(function(types) {
        return types.test_string("Hello, world!");
      }).then(function(result) {
        expect(result).to.be.a('string');
        expect(result).to.be.equal("Hello, world!");
      })
    })

    promises("should validate objects", function() {
      var object = {string: 'hello', number: 123, nan: NaN};
      return proxy.then(function(types) {
        return types.test_object(object);
      }).then(function(result) {
        expect(result).to.be.a('object');
        expect(result).to.be.deep.equal(object);
      })
    })

    promises("should validate arrays", function() {
      var array = [1,'two',3,'four'];
      return proxy.then(function(types) {
        return types.test_array(array);
      }).then(function(result) {
        expect(result).to.be.a('array');
        expect(result).to.be.deep.equal(array);
      })
    })

    promises("should validate dates", function() {
      var date = new Date();
      return proxy.then(function(types) {
        return types.test_date(date);
      }).then(function(result) {
        expect(result).to.be.instanceof(Date);
        expect(result).to.be.deep.equal(date);
      })
    })

    /* ====================================================================== */

    promises("should validate an empty ArrayBuffer", function() {
      return proxy.then(function(types) {
        return types.test_ArrayBuffer(new ArrayBuffer());
      }).then(function(result) {
        expect(result).to.be.instanceof(ArrayBuffer);
        expect(result).to.be.deep.equal(new ArrayBuffer());
        expect(new Uint8Array(result)).to.be.deep.equal(new Uint8Array());
      })
    })

    promises("should validate a normal ArrayBuffer", function() {
      return proxy.then(function(types) {
        return types.test_ArrayBuffer(myArrayBuffer);
      }).then(function(result) {
        expect(result).to.be.instanceof(ArrayBuffer);
        expect(result).to.be.deep.equal(myArrayBuffer);
        expect(new Uint8Array(result)).to.be.deep.equal(new Uint8Array(myArrayBuffer));
      })
    })

    /* ====================================================================== */

    promises("should validate an empty Uint8Array", function() {
      return proxy.then(function(types) {
        return types.test_Uint8Array(new Uint8Array());
      }).then(function(result) {
        expect(result).to.be.instanceof(Uint8Array);
        expect(result).to.be.deep.equal(new Uint8Array());
      })
    })

    promises("should validate a normal Uint8Array", function() {
      return proxy.then(function(types) {
        return types.test_Uint8Array(normalUint8Array);
      }).then(function(result) {
        expect(result).to.be.instanceof(Uint8Array);
        expect(result).to.be.deep.equal(normalUint8Array);
      })
    })

    promises("should validate a partial Uint8Array", function() {
      return proxy.then(function(types) {
        return types.test_Uint8Array(partialUint8Array);
      }).then(function(result) {
        expect(result).to.be.instanceof(Uint8Array);
        checkTypedArrays(result, partialUint8Array);
      })
    })

    /* ====================================================================== */

    promises("should validate an empty Int8Array", function() {
      return proxy.then(function(types) {
        return types.test_Int8Array(new Int8Array());
      }).then(function(result) {
        expect(result).to.be.instanceof(Int8Array);
        expect(result).to.be.deep.equal(new Int8Array());
      })
    })

    promises("should validate a normal Int8Array", function() {
      return proxy.then(function(types) {
        return types.test_Int8Array(normalInt8Array);
      }).then(function(result) {
        expect(result).to.be.instanceof(Int8Array);
        expect(result).to.be.deep.equal(normalInt8Array);
      })
    })

    promises("should validate a partial Int8Array", function() {
      return proxy.then(function(types) {
        return types.test_Int8Array(partialInt8Array);
      }).then(function(result) {
        expect(result).to.be.instanceof(Int8Array);
        checkTypedArrays(result, partialInt8Array);
      })
    })



    promises("should validate an empty Int16Array", function() {
      return proxy.then(function(types) {
        return types.test_Int16Array(new Int16Array());
      }).then(function(result) {
        expect(result).to.be.instanceof(Int16Array);
        expect(result).to.be.deep.equal(new Int16Array());
      })
    })

    promises("should validate a normal Int16Array", function() {
      return proxy.then(function(types) {
        return types.test_Int16Array(normalInt16Array);
      }).then(function(result) {
        expect(result).to.be.instanceof(Int16Array);
        expect(result).to.be.deep.equal(normalInt16Array);
      })
    })

    promises("should validate a partial Int16Array", function() {
      return proxy.then(function(types) {
        return types.test_Int16Array(partialInt16Array);
      }).then(function(result) {
        expect(result).to.be.instanceof(Int16Array);
        checkTypedArrays(result, partialInt16Array);
      })
    })



    promises("should validate an empty Uint16Array", function() {
      return proxy.then(function(types) {
        return types.test_Uint16Array(new Uint16Array());
      }).then(function(result) {
        expect(result).to.be.instanceof(Uint16Array);
        expect(result).to.be.deep.equal(new Uint16Array());
      })
    })

    promises("should validate a normal Uint16Array", function() {
      return proxy.then(function(types) {
        return types.test_Uint16Array(normalUint16Array);
      }).then(function(result) {
        expect(result).to.be.instanceof(Uint16Array);
        expect(result).to.be.deep.equal(normalUint16Array);
      })
    })

    promises("should validate a partial Uint16Array", function() {
      return proxy.then(function(types) {
        return types.test_Uint16Array(partialUint16Array);
      }).then(function(result) {
        expect(result).to.be.instanceof(Uint16Array);
        checkTypedArrays(result, partialUint16Array);
      })
    })



    promises("should validate an empty Int32Array", function() {
      return proxy.then(function(types) {
        return types.test_Int32Array(new Int32Array());
      }).then(function(result) {
        expect(result).to.be.instanceof(Int32Array);
        expect(result).to.be.deep.equal(new Int32Array());
      })
    })

    promises("should validate a normal Int32Array", function() {
      return proxy.then(function(types) {
        return types.test_Int32Array(normalInt32Array);
      }).then(function(result) {
        expect(result).to.be.instanceof(Int32Array);
        expect(result).to.be.deep.equal(normalInt32Array);
      })
    })

    promises("should validate a partial Int32Array", function() {
      return proxy.then(function(types) {
        return types.test_Int32Array(partialInt32Array);
      }).then(function(result) {
        expect(result).to.be.instanceof(Int32Array);
        checkTypedArrays(result, partialInt32Array);
      })
    })



    promises("should validate an empty Uint32Array", function() {
      return proxy.then(function(types) {
        return types.test_Uint32Array(new Uint32Array());
      }).then(function(result) {
        expect(result).to.be.instanceof(Uint32Array);
        expect(result).to.be.deep.equal(new Uint32Array());
      })
    })

    promises("should validate a normal Uint32Array", function() {
      return proxy.then(function(types) {
        return types.test_Uint32Array(normalUint32Array);
      }).then(function(result) {
        expect(result).to.be.instanceof(Uint32Array);
        expect(result).to.be.deep.equal(normalUint32Array);
      })
    })

    promises("should validate a partial Uint32Array", function() {
      return proxy.then(function(types) {
        return types.test_Uint32Array(partialUint32Array);
      }).then(function(result) {
        expect(result).to.be.instanceof(Uint32Array);
        checkTypedArrays(result, partialUint32Array);
      })
    })



    promises("should validate an empty Float32Array", function() {
      return proxy.then(function(types) {
        return types.test_Float32Array(new Float32Array());
      }).then(function(result) {
        expect(result).to.be.instanceof(Float32Array);
        expect(result).to.be.deep.equal(new Float32Array());
      })
    })

    promises("should validate a normal Float32Array", function() {
      return proxy.then(function(types) {
        return types.test_Float32Array(normalFloat32Array);
      }).then(function(result) {
        expect(result).to.be.instanceof(Float32Array);
        expect(result).to.be.deep.equal(normalFloat32Array);
      })
    })

    promises("should validate a partial Float32Array", function() {
      return proxy.then(function(types) {
        return types.test_Float32Array(partialFloat32Array);
      }).then(function(result) {
        expect(result).to.be.instanceof(Float32Array);
        checkTypedArrays(result, partialFloat32Array);
      })
    })


    /* ====================================================================== */

    if ($global.Uint8ClampedArray) {

      promises("should validate an empty Uint8ClampedArray", function() {
        return proxy.then(function(types) {
          return types.test_Uint8ClampedArray(new Uint8ClampedArray());
        }).then(function(result) {
          expect(result).to.be.instanceof(Uint8ClampedArray);
          expect(result).to.be.deep.equal(new Uint8ClampedArray());
        })
      })

      promises("should validate a normal Uint8ClampedArray", function() {
        return proxy.then(function(types) {
          return types.test_Uint8ClampedArray(normalUint8ClampedArray);
        }).then(function(result) {
          expect(result).to.be.instanceof(Uint8ClampedArray);
          expect(result).to.be.deep.equal(normalUint8ClampedArray);
        })
      })

      promises("should validate a partial Uint8ClampedArray", function() {
        return proxy.then(function(types) {
          return types.test_Uint8ClampedArray(partialUint8ClampedArray);
        }).then(function(result) {
          expect(result).to.be.instanceof(Uint8ClampedArray);
          checkTypedArrays(result, partialUint8ClampedArray);
        })
      })

    }

    if ($global.Float64Array) {

      promises("should validate an empty Float64Array", function() {
        return proxy.then(function(types) {
          return types.test_Float64Array(new Float64Array());
        }).then(function(result) {
          expect(result).to.be.instanceof(Float64Array);
          expect(result).to.be.deep.equal(new Float64Array());
        })
      })

      if ($global.Float64Array)
      promises("should validate a normal Float64Array", function() {
        return proxy.then(function(types) {
          return types.test_Float64Array(normalFloat64Array);
        }).then(function(result) {
          expect(result).to.be.instanceof(Float64Array);
          expect(result).to.be.deep.equal(normalFloat64Array);
        })
      })

      if ($global.Float64Array)
      promises("should validate a partial Float64Array", function() {
        return proxy.then(function(types) {
          return types.test_Float64Array(partialFloat64Array);
        }).then(function(result) {
          expect(result).to.be.instanceof(Float64Array);
          checkTypedArrays(result, partialFloat64Array);
        })
      })
    }
  });
});

/* ========================================================================== */

Esquire.define('test/types', function() {

  function Failure(message, param) {
    var details;
    if ((param != null) && (typeof(param) === 'object')) {
      if (Array.isArray(param)) {
        details = "array[" + param.length + "] ==>\n" + JSON.stringify(param, null, 2);
      } else if (param.prototype && param.prototype.name) {
        details = "object[" + param.prototype.name + "] ==>\n" + JSON.stringify(param, null, 2);
      } else if (param.prototype && param.prototype.constructor && param.prototype.constructor.name) {
        details = "object[" + param.prototype.constructor.name + "] ==>\n" + JSON.stringify(param, null, 2);
      } else {
        details = "object ==>\n" + JSON.stringify(param, null, 2);
      }
    } else {
      details = typeof(param) + " -> " + param + " <-";
    }
    message = message ? message + ": " + details : "Details: " + details;
    Error.call(this, message);
    this.message = message;
  };

  Failure.prototype = Object.create(Error.prototype);
  Failure.prototype.constructor = Failure;
  Failure.prototype.name = 'Failure';

  return {
    test_undefined: function(param) {
      if (typeof(param) === 'undefined') return undefined;
      throw new Failure("Should be 'undefined'", param);
    },
    test_null: function(param) {
      if ((typeof(param) === 'object') && (param === null)) return null;
      throw new Failure("Should be 'null'", param);
    },
    test_number: function(param) {
      if (typeof(param) === 'number') return param;
      throw new Failure("Should be a number", param);
    },
    test_string: function(param) {
      if (typeof(param) === 'string') return param;
      throw new Failure("Should be a string", param);
    },
    test_object: function(param) {
      if ((typeof(param) === 'object') && (param != null)) return param;
      throw new Failure("Should be an object", param);
    },
    test_array: function(param) {
      if ((typeof(param) === 'object') && (Array.isArray(param))) return param;
      throw new Failure("Should be an array", param);
    },
    test_date: function(param) {
      if (param instanceof Date) return param;
      throw new Failure("Should be a Date", param);
    },
    /* ---------------------------------------------------------------------- */
    test_ArrayBuffer: function(param) {
      if (param instanceof ArrayBuffer) return param;
      throw new Failure("Should be an ArrayBuffer", param);
    },
    test_Uint8Array: function(param) {
      if (param instanceof Uint8Array) return param;
      throw new Failure("Should be an Uint8Array", param);
    },
    /* ---------------------------------------------------------------------- */
    test_Int8Array: function(param) {
      if (param instanceof Int8Array) return param;
      throw new Failure("Should be an Int8Array", param);
    },
    test_Int16Array: function(param) {
      if (param instanceof Int16Array) return param;
      throw new Failure("Should be an Int16Array", param);
    },
    test_Uint16Array: function(param) {
      if (param instanceof Uint16Array) return param;
      throw new Failure("Should be an Uint16Array", param);
    },
    test_Int32Array: function(param) {
      if (param instanceof Int32Array) return param;
      throw new Failure("Should be an Int32Array", param);
    },
    test_Uint32Array: function(param) {
      if (param instanceof Uint32Array) return param;
      throw new Failure("Should be an Uint32Array", param);
    },
    test_Float32Array: function(param) {
      if (param instanceof Float32Array) return param;
      throw new Failure("Should be an Float32Array", param);
    },
    /* ---------------------------------------------------------------------- */
    test_Uint8ClampedArray: function(param) {
      if (param instanceof Uint8ClampedArray) return param;
      throw new Failure("Should be an Uint8ClampedArray", param);
    },
    test_Float64Array: function(param) {
      if (param instanceof Float64Array) return param;
      throw new Failure("Should be an Float64Array", param);
    },
  };

});
