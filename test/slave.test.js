'use strict';

esquire(['$esquire', 'slave', 'promize'], function($esquire, slave, promize) {

  Esquire.define("module_a", function() { return "a-value"});
  Esquire.define("module_b", function() { return function() { return "b-value" }});
  Esquire.define("module_c", ["module_a", "module_b", "$window"], function(a, b, $window) {
    return {
      prp_a: a,
      fnc_b: b,
      fnc_c: function(x) {
        if ($window.document) {
          throw new Error("Sorry, but this should not work");
        } else {
          return [x, a, b()].join(' ');
        }
      },
      obj_d: {
        fnc_e: function(x) {
          if ($window.document) {
            throw new Error("Sorry, but this should not work");
          } else {
            return [b(), a, x].join(' ');
          }
        }
      }
    };
  });

  describe("Slaves", function() {

    it("should validate locally", function() {
      var a = $esquire.require("module_a");
      var b = $esquire.require("module_b");
      var c = $esquire.require("module_c");

      expect(a).to.be.equal('a-value');

      expect(b).to.be.a('function');
      expect(b()).to.be.equal('b-value');

      expect(c.prp_a).to.be.equal(a);
      expect(c.fnc_b()).to.be.equal(b());
      expect(function() { c.fnc_c("hello")   }).to.throw(/^Sorry, but this should not work$/);
      expect(function() { c.obj_d.fnc_e("world") }).to.throw(/^Sorry, but this should not work$/);

    });

    it("should create proxy to a string", function(done) {
      slave.create(false)

      .then(function(slave) {
        return slave.proxy("module_a");
      })

      .then(function(proxy) {
        expect(proxy).to.be.equal("a-value");
      })

      .then(function(success) {
        done();
      }, function(failure) {
        done(failure);
      })

    });

    it("should create proxy to a function", function(done) {
      slave.create(false)

      .then(function(slave) {
        return slave.proxy("module_b");
      })

      .then(function(proxy) {
        return proxy();
      })

      .then(function(result) {
        expect(result).to.be.equal("b-value");
      })

      .then(function(success) {
        done();
      }, function(failure) {
        done(failure);
      })

    });

    it("should create a proxy to an object", function(done) {

      slave.create(false)

      .then(function(slave) {
        return slave.proxy("module_c");
      })

      .then(function(proxy) {
        return promize.Promise.all([
          proxy.prp_a,
          proxy.fnc_b(),
          proxy.fnc_c("hello"),
          proxy.obj_d.fnc_e("world")
        ]);
      })

      .then(function(success) {
        expect(success).to.be.instanceof(Array);
        expect(success.length).to.be.equal(4);
        expect(success[0]).to.be.equal('a-value');
        expect(success[1]).to.be.equal('b-value');
        expect(success[2]).to.be.equal('hello a-value b-value');
        expect(success[3]).to.be.equal('b-value a-value world');
      })

      .then(function(success) {
        done();
      }, function(failure) {
        done(failure);
      })

    });
  });
});
