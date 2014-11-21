'use strict';

esquire(['$esquire', 'rodosha', 'defers/Promise', 'defers/Deferred', 'rodosha/messages', '$global'],
function($esquire, rodosha, Promise, Deferred, messages, $global) {

  /* Run tests on Node */
  if (!('document' in $global)) $global.document = "fake";

  /* Debug flag */
  var debug = false;

  Esquire.define("module_a", function() { return "a-value"});

  Esquire.define("module_b", ['$global'], function($global) {
    return function() {
      if ($global.document) {
        throw new Error("module_b not running in worker");
      } else {
        return "b-value"
      }
    }
  });

  Esquire.define("module_c", ["module_a", "module_b", "defers/Deferred", "$global"], function(a, b, Deferred, $global) {
    var array = [];
    return {
      prp_a: a,
      fnc_b: b,
      fnc_c: function(x) {
        if ($global.document) {
          throw new Error("module_c[fnc_c] not running in worker");
        } else {
          return [x, a, b()].join(' ');
        }
      },
      fnc_d: function() {
        return this.obj_d
      },
      obj_d: {
        prp: null,
        fnc: function(x) {
          if ($global.document) {
            throw new Error("module_c[obj_d][fnc] not running in worker");
          } else {
            var array = [b(), a, x];
            if (this.prp) array.push(this.prp);
            return array.join(' ');
          }
        }
      },
      arr_e: array,
      fnc_f: function(x) {
        if ($global.document) {
          throw new Error("module_c[fnc_f] not running in worker");
        } else {
          this.arr_e.push(x);
          return x;
        }
      },
      fnc_g: function() {
        throw new Error("This will always throw something");
      },
      fnc_h: function(success) {
        var deferred = new Deferred();
        $global.setTimeout(function() {
          deferred.resolve(success);
        }, 100);
        return deferred.promise;
      },
      fnc_i: function(failure) {
        var deferred = new Deferred();
        $global.setTimeout(function() {
          deferred.reject(new Error(failure));
        }, 100);
        return deferred.promise;
      },
      fnc_j: function(num) {
        return "count " + num;
      }
    };
  });

  /* ======================================================================== */

  describe("Rodosha", function() {

    /* A quick check to valdate our bloated object here */
    it("should validate locally", function() {
      var a = $esquire.require("module_a");
      var b = $esquire.require("module_b");
      var c = $esquire.require("module_c");

      expect(a).to.be.equal('a-value');

      expect(b).to.be.a('function');
      expect(function() { b() }).to.throw(/^module_b not running in worker$/);

      expect(c.prp_a).to.be.equal(a);
      expect(function() { c.fnc_c("hello") }).to.throw('module_c[fnc_c] not running in worker');
      expect(function() { c.obj_d.fnc("world") }).to.throw('module_c[obj_d][fnc] not running in worker');

      expect(c.arr_e).to.be.deep.equal([]);
      expect(function() { c.fnc_f("hello") }).to.throw('module_c[fnc_f] not running in worker');
    });

    /* ---------------------------------------------------------------------- */

    /* Create a proxy to a string (module_a) and check it */
    it("should create proxy to a string", function(done) {
      var openRodosha;
      rodosha.create(debug)

      .then(function(instance) {
        openRodosha = instance;
        return instance.proxy("module_a");
      })

      .then(function(proxy) {
        expect(proxy).to.be.a('string');
        expect(proxy).to.be.equal("a-value");
        return openRodosha.close();
      })

      .then(function(success) {
        done();
      }, function(failure) {
        done(failure);
      })

    });

    /* ---------------------------------------------------------------------- */

    /* Create a proxy to a function (module_b) and check it */
    it("should create proxy to a function", function(done) {
      var openRodosha;
      rodosha.create(debug)

      .then(function(instance) {
        openRodosha = instance;
        return instance.proxy("module_b");
      })

      .then(function(proxy) {
        expect(proxy).to.be.a('function');
        return proxy();
      })

      .then(function(result) {
        expect(result).to.be.equal("b-value");
        return openRodosha.close();
      })

      .then(function(success) {
        done();
      }, function(failure) {
        done(failure);
      })

    });


    /* ---------------------------------------------------------------------- */

    /* Create a proxy to a more complex object (module_c) and check it */
    it("should create a proxy to an object", function(done) {

      var openRodosha;
      rodosha.create(debug)

      .then(function(instance) {
        openRodosha = instance;
        return instance.proxy("module_c");
      })

      .then(function(proxy) {

        var a = proxy.prp_a;
        var b = proxy.fnc_b();
        var c = proxy.fnc_c("hello");
        var d_p = proxy.obj_d.prp;
        var d_f = proxy.obj_d.fnc("world");
        var e = proxy.arr_e;

        expect(a.then).to.be.a('function');
        expect(b.then).to.be.a('function');
        expect(c.then).to.be.a('function');
        expect(d_p.then).to.be.a('function');
        expect(d_f.then).to.be.a('function');
        expect(e.then).to.be.a('function');

        return Promise.all([a, b, c, d_p, d_f, e]);
      })

      .then(function(success) {
        expect(success).to.be.instanceof(Array);
        expect(success.length).to.be.equal(6);
        expect(success[0]).to.be.equal('a-value');
        expect(success[1]).to.be.equal('b-value');
        expect(success[2]).to.be.equal('hello a-value b-value');
        expect(success[3]).to.be.equal(null);
        expect(success[4]).to.be.equal('b-value a-value world');
        expect(success[5]).to.be.deep.equal([]);
        return openRodosha.close();
      })

      .then(function(success) {
        done();
      }, function(failure) {
        done(failure);
      })

    });


    /* ---------------------------------------------------------------------- */

    /* Create a proxy to a more complex object (module_c) and check it */
    it("should create a proxy on-demand", function(done) {

      var openRodosha;
      var openProxy;

      rodosha.create(debug)

      .then(function(instance) {
        openRodosha = instance;
        return instance.proxy("module_c");
      })

      .then(function(proxy) {
        openProxy = proxy;
        return proxy.fnc_d().asProxy();
      })

      .then(function(result) {
        expect(result).to.be.a('object');
        expect(result.$$proxyId$$, "result.$$proxyId$$").exist;
        expect(result.$$proxyId$$).to.not.equal(openProxy.$$proxyId$$);
        return Promise.all([openProxy.obj_d.fnc('foo'), result.fnc('bar')]);
      })

      .then(function(success) {
        expect(success).to.be.instanceof(Array);
        expect(success.length).to.be.equal(2);
        expect(success[0]).to.be.equal('b-value a-value foo');
        expect(success[1]).to.be.equal('b-value a-value bar');
        return openRodosha.close();
      })

      .then(function(success) {
        done();
      }, function(failure) {
        done(failure);
      })

    });


    /* ---------------------------------------------------------------------- */

    /* Make sure that arrays are cloned, not proxied like objects */
    it("should ignore arrays proxying", function(done) {

      var openRodosha;
      var random = Math.floor(Math.random() * 0x0FFFFFFFF);
      var rproxy = null;
      var rarray = null;

      rodosha.create(debug)

      .then(function(instance) {
        openRodosha = instance;
        return instance.proxy("module_c");
      })

      .then(function(proxy) {
        rproxy = proxy;
        return Promise.all([
          proxy.arr_e,
          proxy.fnc_f(random),
        ]);
      })

      .then(function(success) {
        expect(success).to.be.instanceof(Array);
        expect(success.length).to.be.equal(2);

        expect(success[0]).to.be.instanceof(Array);
        expect(success[0]).not.to.include(random);
        rarray = success[0];

        expect(success[1]).to.be.a('number');
        expect(success[1]).to.be.equal(random);

        // another promise !
        return rproxy.arr_e;
      })

      .then(function(success) {
        expect(success).to.be.instanceof(Array);
        expect(success).to.include(random);
        expect(success).to.not.be.deep.equal(rarray);
        return openRodosha.close();
      })

      .then(function(success) {
        done();
      }, function(failure) {
        done(failure);
      })

    });

    /* ---------------------------------------------------------------------- */

    it("should correctly set remote values", function(done) {

      var random = Math.floor(Math.random() * 0x0FFFFFFFF);
      var openRodosha;

      rodosha.create(debug)

      .then(function(instance) {
        openRodosha = instance;
        return instance.proxy("module_c");
      })

      .then(function(proxy) {

        /* Initially get the value... This will trigger the first road trip */
        var oldPromise = proxy.obj_d.prp;

        /* Now, the "initialvalue" should be what has been proxied: null */
        expect(oldPromise.initialValue()).to.be.equal(null);

        /* This will trigger a road trip, but also change the initial value */
        proxy.obj_d.prp = random;

        /* Check the "initialvalue" of the new promise */
        var prpPromise = proxy.obj_d.prp;
        expect(oldPromise.initialValue()).to.be.equal(null);
        expect(prpPromise.initialValue()).to.be.equal(random);

        /* Just call the function */
        var fncPromise = proxy.obj_d.fnc("then");

        /* Make sure those are all promises */
        expect(prpPromise).to.be.a('object');
        expect(fncPromise).to.be.a('object');
        expect(prpPromise.then).to.be.a('function');
        expect(fncPromise.then).to.be.a('function');

        /* Next step... */
        return Promise.all([oldPromise, prpPromise, fncPromise]);
      })

      .then(function(success) {
        expect(success).to.be.instanceof(Array);

        // [0] -> original value, [1] -> property getter promise, [2] -> function after getter
        expect(success).to.deep.equal([null, random, "b-value a-value then " + random]);

        return openRodosha.close();
      })

      .then(function(success) {
        done();
      }, function(failure) {
        done(failure);
      })

    });

    /* ---------------------------------------------------------------------- */

    /* Make sure that exceptions are properly propagated from the worker */
    it("should correctly reject exceptions", function(done) {

      var openRodosha;
      rodosha.create(debug)

      .then(function(instance) {
        openRodosha = instance;
        return instance.proxy("module_c");
      })

      .then(function(proxy) {
        return proxy.fnc_g()
      })

      .then(function(success) {
        throw new Error("Not rejected: " + success);
      }, function(failure) {
        expect(failure).to.be.instanceof(messages.RemoteError);
        expect(failure.message).to.be.equal("This will always throw something");
        return openRodosha.close();
      })

      .then(function(success) {
        done();
      }, function(failure) {
        done(failure);
      })

    });

    /* ---------------------------------------------------------------------- */

    it("should resolve a remote resolved promise", function(done) {

      var result = "This should be thrown: " + Math.floor(Math.random() * 0x0FFFFFFFF);

      rodosha.create(debug)

      .then(function(instance) {
        return instance.proxy("module_c");
      })

      .then(function(proxy) {
        return proxy.fnc_h(result);
      })

      .then(function(success) {
        expect(success).to.be.equal(result);
      })

      .then(function(success) {
        done();
      }, function(failure) {
        done(failure);
      })

    });

    /* ---------------------------------------------------------------------- */

    it("should reject a remote rejected promise", function(done) {

      var result = "This should be good: " + Math.floor(Math.random() * 0x0FFFFFFFF);
      var openRodosha;

      rodosha.create(debug)

      .then(function(instance) {
        openRodosha = instance;
        return instance.proxy("module_c");
      })

      .then(function(proxy) {
        return proxy.fnc_i(result);
      })

      .then(function(success) {
        throw new Error("Not rejected: " + success);
      }, function(failure) {
        expect(failure).to.be.instanceof(messages.RemoteError);
        expect(failure.message).to.be.equal(result);
        return openRodosha.close();
      })

      .then(function(success) {
        done();
      }, function(failure) {
        done(failure);
      })

    });

    /* ---------------------------------------------------------------------- */

    it("should destroy a remote proxy", function(done) {

      var openRodosha;
      var openProxy;

      rodosha.create(debug)

      .then(function(instance) {
        openRodosha = instance;
        return instance.proxy("module_c");
      })

      .then(function(proxy) {
        openProxy = proxy;
        return openRodosha.destroy(proxy);
      })

      .then(function(success) {
        return openProxy.obj_d.fnc();
      })

      .then(function(success) {
        throw new Error("Not rejected: " + success);
      }, function(failure) {
        expect(failure).to.be.instanceof(messages.RemoteError);
        expect(failure.message).to.be.equal("Proxy 'proxy_1.obj_d.fnc' not found");
        return openRodosha.close();
      })

      .then(function(success) {
        done();
      }, function(failure) {
        done(failure);
      })

    });

    /* ---------------------------------------------------------------------- */

    /* Simple timings for a number of messages (skip on debug) */
    var itx = function() { return (debug ? it.skip : it).apply(null, arguments) }
    itx("should validate performance", function(done) {

      var start = new Date().getTime();
      var count = 1000;
      var openRodosha;

      rodosha.create(debug)

      .then(function(instance) {
        var now = new Date().getTime();
        console.log("Created in " + (now - start) + " ms");

        openRodosha = instance;

        var promise = instance.proxy("module_c");
        start = new Date().getTime();
        return promise;
      })

      .then(function(proxy) {
        var now = new Date().getTime();
        console.log("Proxied in " + (now - start) + " ms");
        start = new Date().getTime();

        var promises = [];
        for (var i = 0; i < count; i ++) {
          promises.push(proxy.fnc_j(i));
        }
        now = new Date().getTime();
        console.log("Created " + promises.length + " messages in " + (now - start) + " ms");

        var promise = Promise.all(promises);
        start = new Date().getTime();
        return promise;
      })

      .then(function(results) {
        var now = new Date().getTime();
        var avg = Number((results.length * 1000) / (now - start)).toFixed(3);
        console.warn("Received " + results.length + " responses in " + (now - start) + " ms (avg " + avg + " msg/s)");
        expect(results.length).to.equal(count);
        for (var i in results) {
          expect(results[i], "Result at index " + i).to.be.equal('count ' + i);
        }
        var promise = openRodosha.close();
        start = new Date().getTime();
        return promise;
      })

      .then(function(results) {
        var now = new Date().getTime();
        console.log("Closed in " + (now - start) + " ms");
        done();
      }, function(failure) {
        done(failure);
      });

    });

    /* ---------------------------------------------------------------------- */

    /* Make sure that close will gracefully close the worker */
    it("should close successfully", function(done) {

      var openRodosha;
      var openProxy;

      rodosha.create(debug)

      .then(function(instance) {
        openRodosha = instance;
        return instance.proxy("module_b");
      })

      .then(function(proxy) {
        openProxy = proxy;
        var resultPromise = proxy().then(); // make sure message gets sent ...
        var closePromise = openRodosha.close(); // ... before instance is closed!
        return Promise.all([resultPromise, closePromise]);
      })

      .then(function(result) {
        expect(result).to.be.instanceof(Array);
        expect(result.length).to.be.equal(2);
        expect(result[0]).to.be.equal("b-value");
        expect(result[1]).to.be.equal(undefined);
        return openProxy();
      })

      .then(function(success) {
        throw new Error("Not rejected: " + success);
      }, function(failure) {
        expect(failure).to.be.instanceof(Error);
        expect(failure.message).to.match(/Worker \w+ unavailable/);
      })

      .then(function(success) {
        done();
      }, function(failure) {
        done(failure);
      })

    });

    /* ---------------------------------------------------------------------- */

    /* Make sure that close will gracefully close the worker */
    it("should terminate immediately", function(done) {

      var termination = new Error("Terminated foolishly");
      var openRodosha;

      rodosha.create(debug)

      .then(function(instance) {
        openRodosha = instance;
        return instance.proxy("module_b");
      })

      .then(function(proxy) {
        var resultPromise = proxy().then(); // make sure message gets sent ...
        openRodosha.terminate(termination);   // ... before instance is terminated!
        return resultPromise;
      })

      .then(function(success) {
        throw new Error("Not rejected: " + success);
      }, function(failure) {
        expect(failure).to.be.equal(termination);
      })

      .then(function(success) {
        done();
      }, function(failure) {
        done(failure);
      })

    });

  });
});
