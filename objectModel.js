(function (dependencies, factory) {
  if (typeof exports === 'object') {
    module.exports = factory.apply(null, dependencies.map(require));
  } else if (typeof define === 'function' && define.amd) {
    define(dependencies, factory);
  }
})(['./class'], function (Class) {

  /**
   * Wraps javascript objects with a Ractive-like get/set object to access
   * data by keypath.
   * @author Stewart MacKenzie-Leigh
   * @license MIT
   */

  var ObjectModel = Class.extend({
    /**
     * Constructor.
     * @param model optional object to wrap
     */
    init: function (model) {
      if (!model) {
        this.model = {};
      } else {
        this.model = model;
      }
    },

    /**
     * Gets the value at the specified keypath.
     * @param keypath the keypath to get the value at
     */
    get: function (keypath) {
      var paths = expandKeypath.call(this, keypath);
      var model = this.model;

      var results = paths.map(function (keypath) {
        var result = getObj(model, keypath);
        return result.object[result.child];
      });

      if (results.length > 1) {
        return results;
      } else {
        return results[0];
      }
    },

    /**
     * Sets the value at the specified keypath.
     * @param keypath the keypath to set the value at
     * @param value the value to set it to
     */
    set: function (keypath, value) {
      var paths = expandKeypath.call(this, keypath);
      var model = this.model;

      paths.forEach(function (keypath) {
        var result = getObj(model, keypath);
        result.object[result.child] = value;
      });
    }
  });


  function getObj(obj, keypath) {
    var pos = keypath.indexOf('.');

    if (pos == -1) {
      return {
        object: obj,
        child: keypath
      };
    } else {
      var m = keypath.match(/^([^\.]+)\.(([^\.]+).*)$/);

      if (!obj.hasOwnProperty(m[1])) {
        obj[m[1]] = isNaN(parseInt(m[3])) ? {} : [];
      }

      obj = obj[m[1]];
      return getObj(obj, m[2]);
    }
  }

  function expandKeypath(keypath, parent, paths) {
    if (!paths) paths = [];
    var m = keypath.match(/^([^\*]*)\.\*(\..*)?$/);

    if (m != null) {
      var arrPath = m[1];
      var arr = this.get(arrPath);

      for (var k in arr) {
        expandKeypath.call(this, concat(k, m[2]), concat(parent, arrPath), paths);
      }
    }
    else {
      if (parent) keypath = parent + '.' + keypath;
      paths.push(keypath);
    }

    return paths;
  }

  function concat() {
    var str = '';

    for(var i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] !== 'undefined')
        str += arguments[i];
    }

    return str;
  }

  return ObjectModel;
});
