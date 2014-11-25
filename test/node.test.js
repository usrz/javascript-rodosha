describe("Rodosha in Node.JS", function() {

  var rodosha = require("../index.js");

  it("should export a create function", function() {
    expect(rodosha).to.exist();
    expect(rodosha.create).to.be.a('function');
  })

  promises("should create and close properly", function() {
    return rodosha.create()
    .then(function(instance) {
      return instance.close();
    })
    .then(function(result) {
      expect(result).to.be.equal(undefined);
    });
  });

});
