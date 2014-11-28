Esquire.define('rodosha/utils', ['$promise'], function(Promise) {

  /* Flatten an array, or array of array, for aguments */
  function flatten(iterable) {
    if (! iterable) return [];

    var array = [];
    for (var i = 0; i < iterable.length; i ++) {
      var current = iterable[i];
      if (Array.isArray(current)) {
        array = array.concat(flatten(current));
      } else if ((typeof(current) === 'object')
              && (typeof(current.length) === 'number')) {
        // JavaScripts' "arguments" is an object, not an array, and on top of
        // that PhantomJS' own implementation is not iterable... Workaround!
        array = array.concat(flatten(current));
      } else {
        array.push(current);
      }
    }
    return array;
  };

  /* Resolve any module from the arguments */
  function resolve() {
    var promises = [];
    var args = flatten(arguments);
    for (var i = 0; i < args.length; i ++) {
      promises.push(Esquire.resolve(args[i], true, true));
    }

    /* Await for resolution of dependencies */
    return Promise.all(promises).then(function(result) {
      var modules = {};
      for (var i = 0; i < result.length; i ++) {
        var resolved = result[i];
        for (var name in resolved) {
          var module = resolved[name];
          if (module.$$dynamic) continue;
          modules[name] = resolved[name];
        }
      }
      return modules;
    });
  };

  return Object.freeze({
    flatten: flatten,
    resolve: resolve,
  });

});
