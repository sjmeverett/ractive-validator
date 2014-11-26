
(function (factory) {
  if (typeof exports === 'object') {
    var moment = require('moment');
    module.exports = factory(moment);
  } else if (typeof define === 'function' && define.amd) {
    define(['moment'], factory);
  }
})(function (moment) {

  Class = (function () {

    /* Simple JavaScript Inheritance
     * By John Resig http://ejohn.org/
     * MIT Licensed.
     */
     //http://ejohn.org/blog/simple-javascript-inheritance
    // Inspired by base2 and Prototype


    var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

    // The base Class implementation (does nothing)
    var Class = function(){};

    // Create a new Class that inherits from this class
    Class.extend = function(prop) {
      var _super = this.prototype;

      // Instantiate a base class (but only create the instance,
      // don't run the init constructor)
      initializing = true;
      var prototype = new this();
      initializing = false;

      // Copy the properties over onto the new prototype
      for (var name in prop) {
        // Check if we're overwriting an existing function
        prototype[name] = typeof prop[name] == "function" &&
          typeof _super[name] == "function" && fnTest.test(prop[name]) ?
          (function(name, fn){
            return function() {
              var tmp = this._super;

              // Add a new ._super() method that is the same method
              // but on the super-class
              this._super = _super[name];

              // The method only need to be bound temporarily, so we
              // remove it when we're done executing
              var ret = fn.apply(this, arguments);
              this._super = tmp;

              return ret;
            };
          })(name, prop[name]) :
          prop[name];
      }

      // The dummy class constructor
      function Class() {
        // All construction is actually done in the init method
        if (!initializing && this.init)
          this.init.apply(this, arguments);
      }

      // Populate our constructed prototype object
      Class.prototype = prototype;

      // Enforce the constructor to be what we expect
      Class.prototype.constructor = Class;

      // And make this class extendable
      Class.extend = arguments.callee;

      return Class;
    };

    return Class;
  })();
  
  
  var ObjectModel = (function () {

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
  })();
  
  
  /**
   * Validates objects according to given rules, in a manner compatible with
   * Ractive (ractivejs.org).
   * @author Stewart MacKenzie-Leigh
   * @license MIT
   */

  var RactiveValidator = Class.extend({
    /**
     * Constructor.
     * @param model a Ractive instance, some other object with get and set
     * methods, or an ordinary object, which you want to have validated
     * @param format a map of keypaths to rules
     */
    init: function (model, format) {
      this.format = format;
      this.enabled = true;

      if (model.get && model.set) {
        this.model = model;
      } else {
        this.model = new ObjectModel(model);
      }

      if (this.model.observe) {
        var self = this;

        var result = {
          valid: true,
          model: this.model,
          errors: new ObjectModel(),
          data: new ObjectModel()
        };

        for (var keypath in format) {
          this.model.observe(keypath, function (newValue, oldValue, keypath) {
            if (self.enabled) {
              validate.call(self, newValue, keypath, result, format[keypath]);
            }
          }, {init: false});
        }
      }
    },

    /**
     * Runs validation on the data model object.
     * @return a result object indicating if validation was successful,
     * any errors present, and the valid data.
     */
    validate: function () {
      this.groups = {};

      var result = {
        valid: true,
        model: this.model,
        errors: new ObjectModel(),
        data: new ObjectModel()
      };

      for (var keypath in this.format) {
        validateKeypath.call(this, undefined, keypath, result, this.format[keypath]);
      }

      return {
        valid: result.valid,
        errors: result.errors.model,
        data: result.data.model
      };
    },

    /**
     * Enable or disable active validation.
     */
    enable: function (value) {
      this.enabled = value;

      for (var keypath in this.format) {
        this.model.set(keypath + this.errorSuffix);
      }
    },

    /**
     * If set, if there is a validation error with a given keypath, then the
     * error text will be set at the keypath with the errorSuffix appended.
     */
    errorSuffix: 'Msg',

    validators: {
      /**
       * Makes sure the data is present if required.  As well as simple
       * true/false it supports named groups, so that groups of data can be
       * required together.
       */
      required: function (value, required) {
        if (required) {
          if (typeof required == 'string') {
            var match = required.match(/([^\.]+)\.(.+)/);

            if (match === null)
              throw new Error('invalid require rule: ' + required);

            var groupName = match[1];
            var groupValue = match[2];
            var group = this.groups[groupName];
            
            if (isblank(value)) {
              if (group === groupValue) {
                return {valid: false, error: 'required'};
              } else {
                return {valid: true}
              }
            } else {
              if (typeof group === 'undefined') {
                this.groups[groupName] = groupValue;
              } else if (group == groupValue) {
                return {valid: true};
              } else {
                return {valid: false, error: 'not required'};
              }
            }
          } else {
            if (isblank(value)) {
              return {valid: false, error: 'required'};
            }
          }
        }

        return {valid: true};
      },

      /**
       * This would go on the 'confirm password' box with the keypath to the
       * original password field.
       */
      password: function (value, otherfield, result) {
        if (value != result.model.get(otherfield)) {
          return {valid: false, error: 'passwords must match'};
        } else {
          return {valid: true};
        }
      },

      /**
       * Ensures a value matches a given moment.js format.
       */
      moment: function (value, format) {
        if (!isblank(value) && !moment(value, format, true).isValid()) {
          return {valid: false, error: 'must be ' + format};
        } else {
          return {valid: true};
        }
      },

      /**
       * Checks the data type (mostly for programmer-facing APIs and such)
       */
      dataType: function (value, dataType) {
        if (typeof value === 'undefined') {
          return {valid: true}
        } else if (dataType == 'string' && typeof value !== 'string') {
          return {valid: false, error: 'must be a string'};
        } else if (dataType == 'integer' && (typeof value !== 'number' || value % 1 != 0)) {
          return {valid: false, error: 'must be an integer'};
        } else if (dataType == 'boolean' && typeof value !== 'boolean') {
          return {valid: false, error: 'must be a boolean'};
        } else {
          return {valid: true};
        }
      },

      number: function (value) {
        if (!isblank(value) && value.toString().match(/^-?[0-9]+(\.[0-9]+)?$/) == null) {
          return {valid: false, error: 'must be a number'};
        } else {
          return {valid: true};
        }
      },

      integer: function (value) {
        if (!isblank(value) && value.toString().match(/^-?[0-9]+$/) == null) {
          return {valid: false, error: 'must be a whole number'};
        } else {
          return {valid: true};
        }
      },

      positive: function (value) {
        if (!isblank(value) && value < 0) {
          return {valid: false, error: 'must be a positive number'};
        } else {
          return {valid: true};
        }
      }
    }
  });


  function isblank(value) {
    return value === '' || typeof value === 'undefined' || value === null;
  }


  function validateKeypath(parent, keypath, result, format) {
    var m = keypath.match(/^([^\*]*)\.\*(\..*)?$/);

    if (m != null) {
      var arrPath = m[1];
      var p = (parent ? parent + '.' : '') + arrPath;
      var arr = result.model.get(p);

      for (var k in arr) {
        validateKeypath.call(this, p, concat(k, m[2]), result, format);
      }
    }
    else {
      if (parent) keypath = parent + '.' + keypath;
      var value = result.model.get(keypath);
      validate.call(this, value, keypath, result, format);
    }
  }


  function validate(value, keypath, result, format) {
    var valid = true;

    for (var k in format) {
      if (!this.validators.hasOwnProperty(k))
        throw new Error('validator ' + k + ' not defined');

      var validation = this.validators[k].call(this, value, format[k], result);

      if (validation.valid) {
        if (this.errorSuffix) {
          result.model.set(keypath + this.errorSuffix, undefined);
        }
      } else {
        result.valid = false;
        valid = false;
        result.errors.set(keypath, validation.error);

        if (this.errorSuffix) {
          result.model.set(keypath + this.errorSuffix, validation.error);
        }
        
        break;
      }
    }

    if (valid) {
      result.data.set(keypath, value);
    }
  }


  function concat() {
    var str = '';

    for(var i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] !== 'undefined')
        str += arguments[i];
    }

    return str;
  }

  RactiveValidator.ObjectModel = ObjectModel;

  return RactiveValidator;
});
