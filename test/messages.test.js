'use strict';

esquire(['rodosha/messages'], function(messages) {

  var RemoteError = messages.RemoteError;
  var encode = messages.encode;
  var decode = messages.decode;

  var hasStack = new Error().stack && true || false;

  var nativeTransfers = messages.nativeTransfers;
  var transferableUndefined  = nativeTransfers ? undefined : { "__$$native$$__" : "undefined" };
  var transferableNotANumber = nativeTransfers ? NaN       : { "__$$native$$__" : "NaN"       };

  describe("Messages", function() {
    it("should encode a basic object", function() {
      var args;

      (function() { args = arguments })('argument0', 1);

      var object = {
        "_undefined": undefined,
        "_null":      null,
        "_true":      true,
        "_false":     false,
        "_number":    123.456,
        "_nan":       NaN,
        "_string":    "Hello, world",
        "_array":     ["zero", 1],
        "_object":    { a: 1, b: "two"},
        "_error":     new ReferenceError("This is an error"),
        "_function":  function(a) { return a + 1 },
        "_arguments": args
      }

      var encoded = encode(object);

      expect(encoded.hasOwnProperty("_undefined")).to.equal(true);
      expect(encoded.hasOwnProperty("_null"     )).to.equal(true);
      expect(encoded.hasOwnProperty("_true"     )).to.equal(true);
      expect(encoded.hasOwnProperty("_false"    )).to.equal(true);
      expect(encoded.hasOwnProperty("_number"   )).to.equal(true);
      expect(encoded.hasOwnProperty("_nan"      )).to.equal(true);
      expect(encoded.hasOwnProperty("_string"   )).to.equal(true);
      expect(encoded.hasOwnProperty("_array"    )).to.equal(true);
      expect(encoded.hasOwnProperty("_object"   )).to.equal(true);
      expect(encoded.hasOwnProperty("_function" )).to.equal(true);
      expect(encoded.hasOwnProperty("_arguments")).to.equal(true);

      expect(encoded["_undefined"]).to.deep.equal(transferableUndefined);
      expect(encoded["_null"     ]).to.equal(null);
      expect(encoded["_true"     ]).to.equal(true);
      expect(encoded["_false"    ]).to.equal(false);
      expect(encoded["_number"   ]).to.equal(123.456);
      expect(encoded["_nan"      ]).to.deep.equal(transferableNotANumber);
      expect(encoded["_string"   ]).to.equal("Hello, world");
      expect(encoded["_array"    ]).to.deep.equal(["zero", 1]);
      expect(encoded["_object"   ]).to.deep.equal({a: 1, b: "two"});

      // Error...
      expect(encoded["_error"]).to.exist;
      expect(encoded["_error"]["__$$error$$__"]).to.exist;
      expect(encoded["_error"]["__$$error$$__"].name).to.equal("ReferenceError");
      expect(encoded["_error"]["__$$error$$__"].message).to.equal("This is an error");
      if (hasStack) {
        expect(encoded["_error"]["__$$error$$__"].stack).to.equal(object._error.stack);
      } else {
        console.debug("No stack traces for errros");
      }

      // Function...
      expect(encoded["_function"]).to.exist;
      expect(encoded["_function"]["__$$function$$__"]).to.exist;
      expect(encoded["_function"]["__$$function$$__"].replace(/\n/mg,' ')).to.match(/^function *\(a\) *{(.*)return a \+ 1 *;? *}$/m);
      expect(encoded["_function"]["__$$function$$__"]).to.equal(object._function.toString());

      // Arguments...
      expect(encoded["_arguments"]).to.deep.equal(['argument0', 1]);
      expect(Array.isArray(encoded["_arguments"])).to.be.true;

    });

    it("should decode a basic object", function() {
      var args;

      (function() { args = arguments })('argument0', 1);

      var object = {
        "_undefined": transferableUndefined,
        "_null":      null,
        "_true":      true,
        "_false":     false,
        "_number":    123.456,
        "_nan":       transferableNotANumber,
        "_string":    "Hello, world",
        "_array":     ["zero", 1],
        "_object":    { a: 1, b: "two"},
        "_error":     { "__$$error$$__": { name: "FooError", message: "BarMessage", stack: "BazStack" } },
        "_function":  { "__$$function$$__": "function(a) { return a + 1 }" },
      }

      var decoded = decode(object);

      expect(decoded.hasOwnProperty("_undefined")).to.equal(true);
      expect(decoded.hasOwnProperty("_null"     )).to.equal(true);
      expect(decoded.hasOwnProperty("_true"     )).to.equal(true);
      expect(decoded.hasOwnProperty("_false"    )).to.equal(true);
      expect(decoded.hasOwnProperty("_number"   )).to.equal(true);
      expect(decoded.hasOwnProperty("_nan"      )).to.equal(true);
      expect(decoded.hasOwnProperty("_string"   )).to.equal(true);
      expect(decoded.hasOwnProperty("_array"    )).to.equal(true);
      expect(decoded.hasOwnProperty("_object"   )).to.equal(true);
      expect(decoded.hasOwnProperty("_function" )).to.equal(true);

      expect(decoded["_undefined"]).to.equal(undefined);
      expect(decoded["_null"     ]).to.equal(null);
      expect(decoded["_true"     ]).to.equal(true);
      expect(decoded["_false"    ]).to.equal(false);
      expect(decoded["_number"   ]).to.equal(123.456);
      expect(decoded["_nan"      ]).to.deep.equal(NaN);
      expect(decoded["_string"   ]).to.equal("Hello, world");
      expect(decoded["_array"    ]).to.deep.equal(["zero", 1]);
      expect(decoded["_object"   ]).to.deep.equal({a: 1, b: "two"});

      //Error...
      expect(decoded["_error"]).to.exist;
      expect(decoded["_error"]).to.be.instanceof(RemoteError);
      expect(decoded["_error"].name).to.equal("RemoteError[FooError]");
      expect(decoded["_error"].message).to.equal("BarMessage");
      expect(decoded["_error"].toString()).to.equal("RemoteError[FooError]: BarMessage");
      if (hasStack) {
        expect(decoded["_error"].stack).to.match(/^- Remote stack:$\n^BazStack$\n^- Local stack:$/m);
      } else {
        expect(decoded["_error"].stack).to.match(/^- Remote stack:$\n^BazStack$/m);
      }
    });

    it("should encode and decode a module", function() {
      var module = Esquire.modules['rodosha/messages'];
      var encoded = encode({id: 123, define: module});
      var decoded = decode(encoded);
      expect(decoded.id).to.equal(123);
      expect(decoded.define).to.exist;
      expect(decoded.define.name).to.equal(module.name);
      expect(decoded.define.dependencies).to.deep.equal(module.dependencies);
      expect(decoded.define.constructor.toString()).to.equal(module.constructor.toString());
    });

    /* ======================================================================== */

    it("should fail encoding objects with deep circular references", function() {
      var object = { a: { b: { c: {} } } };
      object.a.b.c = object;

      try {
        encode(object);
        throw new Error("Exception expected");
      } catch (error) {
        expect(error).to.be.instanceof(TypeError);
        expect(error.message).to.equal("Unable to (en|de)code object: circular reference detected");
      }

    });

    it("should fail encoding objects with shallow circular references", function() {
      var object = {};
      object.object = object;

      try {
        encode(object);
        throw new Error("Exception expected");
      } catch (error) {
        expect(error).to.be.instanceof(TypeError);
        expect(error.message).to.equal("Unable to (en|de)code object: circular reference detected");
      }

    });

    it("should fail decoding objects with deep circular references", function() {
      var object = { a: { b: { c: {} } } };
      object.a.b.c = object;

      try {
        decode(object);
        throw new Error("Exception expected");
      } catch (error) {
        expect(error).to.be.instanceof(TypeError);
        expect(error.message).to.equal("Unable to (en|de)code object: circular reference detected");
      }

    });

    it("should fail decoding objects with shallow circular references", function() {
      var object = {};
      object.object = object;

      try {
        decode(object);
        throw new Error("Exception expected");
      } catch (error) {
        expect(error).to.be.instanceof(TypeError);
        expect(error.message).to.equal("Unable to (en|de)code object: circular reference detected");
      }

    });

  });
});
