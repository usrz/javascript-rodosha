'use strict';

esquire(['$esquire', 'slaves', 'promize', 'slaves/messages'], function($esquire, slaves, promize, messages) {

  var debug = false;

  Esquire.define("module_a", function() { return "a-value"});

  Esquire.define("module_b", ['$window'], function($window) {
    return function() {
      if ($window.document) {
        throw new Error("module_b not running in worker");
      } else {
        return "b-value"
      }
    }
  });

  Esquire.define("module_c", ["module_a", "module_b", "$window"], function(a, b, $window) {
    var array = [];
    return {
      prp_a: a,
      fnc_b: b,
      fnc_c: function(x) {
        if ($window.document) {
          throw new Error("module_c[fnc_c] not running in worker");
        } else {
          return [x, a, b()].join(' ');
        }
      },
      obj_d: {
        prp: null,
        fnc: function(x) {
          if ($window.document) {
            throw new Error("module_c[obj_d][fnc] not running in worker");
          } else {
            var array = [b(), a, x];
            if (this.prp) array.push(prp);
            return [b(), a, x].join(' ');
          }
        }
      },
      arr_e: array,
      fnc_f: function(x) {
        if ($window.document) {
          throw new Error("module_c[fnc_f] not running in worker");
        } else {
          this.arr_e.push(x);
          return x;
        }
      },
      fnc_g: function() {
        throw new Error("This will always throw something");
      }
    };
  });

  /* ======================================================================== */

  describe("Slaves", function() {

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
      var openSlave;
      slaves.create(debug)

      .then(function(slave) {
        openSlave = slave;
        return slave.proxy("module_a");
      })

      .then(function(proxy) {
        expect(proxy).to.be.a('string');
        expect(proxy).to.be.equal("a-value");
        openSlave.close();
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
      var openSlave;
      slaves.create(debug)

      .then(function(slave) {
        openSlave = slave;
        return slave.proxy("module_b");
      })

      .then(function(proxy) {
        expect(proxy).to.be.a('function');
        return proxy();
      })

      .then(function(result) {
        expect(result).to.be.equal("b-value");
        openSlave.close();
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

      var openSlave;
      slaves.create(debug)

      .then(function(slave) {
        openSlave = slave;
        return slave.proxy("module_c");
      })

      .then(function(proxy) {

        var a = proxy.prp_a;
        var b = proxy.fnc_b();
        var c = proxy.fnc_c("hello");
        var d = proxy.obj_d.fnc("world");
        var e = proxy.arr_e;

        expect(a).to.be.a('object');
        expect(b).to.be.a('object');
        expect(c).to.be.a('object');
        expect(d).to.be.a('object');
        expect(e).to.be.a('object');

        expect(a.then).to.be.a('function');
        expect(b.then).to.be.a('function');
        expect(c.then).to.be.a('function');
        expect(d.then).to.be.a('function');
        expect(e.then).to.be.a('function');

        return promize.Promise.all([a, b, c, d, e]);
      })

      .then(function(success) {
        expect(success).to.be.instanceof(Array);
        expect(success.length).to.be.equal(5);
        expect(success[0]).to.be.equal('a-value');
        expect(success[1]).to.be.equal('b-value');
        expect(success[2]).to.be.equal('hello a-value b-value');
        expect(success[3]).to.be.equal('b-value a-value world');
        expect(success[4]).to.be.deep.equal([]);
        openSlave.close();
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

      var openSlave;
      var random = Math.floor(Math.random() * 0x0FFFFFFFF);
      var rproxy = null;
      var rarray = null;

      slaves.create(debug)

      .then(function(slave) {
        openSlave = slave;
        return slave.proxy("module_c");
      })

      .then(function(proxy) {
        rproxy = proxy;
        return promize.Promise.all([
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
        openSlave.close();
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

      var random = Math.floor(Math.random() * 0x0FFFFFFFF);
      var rproxy = null;
      var rarray = null;

      slaves.create(debug)

      .then(function(slave) {
        return slave.proxy("module_c");
      })

      .then(function(proxy) {
        return proxy.fnc_g()
      })

      .then(function(success) {
        throw new Error("Not rejected");
      }, function(failure) {
        expect(failure).to.be.instanceof(messages.RemoteError);
        expect(failure.message).to.be.equal("This will always throw something")
      })

      .then(function(success) {
        done();
      }, function(failure) {
        done(failure);
      })

    });

    /* ---------------------------------------------------------------------- */

    /* Simple timings for a number of messages */
    it("should validate performance", function(done) {

      var start = new Date().getTime();
      var count = 1000;
      var openSlave;

      slaves.create(debug)

      .then(function(slave) {
        var now = new Date().getTime();
        console.log("Created in " + (now - start) + " ms");

        openSlave = slave;

        var promise = slave.proxy("module_b");
        start = new Date().getTime();
        return promise;
      })

      .then(function(proxy) {
        var now = new Date().getTime();
        console.log("Proxied in " + (now - start) + " ms");
        start = new Date().getTime();

        var promises = [];
        for (var i = 0; i < count; i ++) {
          promises.push(proxy());
        }
        now = new Date().getTime();
        console.log("Created " + promises.length + " messages in " + (now - start) + " ms");

        var promise = promize.Promise.all(promises);
        start = new Date().getTime();
        return promise;
      })

      .then(function(results) {
        var now = new Date().getTime();
        var avg = Number((results.length * 1000) / (now - start)).toFixed(3);
        console.log("Received " + results.length + " responses in " + (now - start) + " ms (avg " + avg + " msg/s)");
        expect(results.length).to.equal(count);
        var promise = openSlave.close();
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

      var openSlave;
      var openProxy;

      slaves.create(debug)

      .then(function(slave) {
        openSlave = slave;
        return slave.proxy("module_b");
      })

      .then(function(proxy) {
        console.log("PROMISE IS", proxy);
        openProxy = proxy;
        var resultPromise = proxy(); // this will be processed
        var closePromise = openSlave.close(); // this will kill the slave
        return promize.Promise.all([resultPromise, closePromise]);
      })

      .then(function(result) {
        expect(result).to.be.instanceof(Array);
        expect(result.length).to.be.equal(2);
        expect(result[0]).to.be.equal("b-value");
        expect(result[1]).to.be.equal(undefined);
        return openProxy();
      })

      .then(function(success) {
        throw new Error("Not rejected");
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



  });
});
