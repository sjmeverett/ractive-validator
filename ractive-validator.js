
define(['moment'], function (moment) {

  function RactiveValidator(ractive, rules, options) {
    this.ractive = ractive;
    this.rules = rules;
    this.validationErrors = {};

    var defaultOptions = {
      validators: {},
      messages: {},
      messageSuffix: 'Msg',
      enabled: true
    };

    if (typeof options !== 'undefined') {
      merge(defaultOptions, options);
    }

    this._validators = defaultOptions.validators;
    merge(this._validators, RactiveValidator.validators);

    this._messages = defaultOptions.messages;
    merge(this._messages, RactiveValidator.messages);
    
    this._messageSuffix = defaultOptions.messageSuffix;
    this._enabled = defaultOptions.enabled;

    for (var k in rules) {
      setValidator.call(this, k, rules[k]);
    }
  }


  RactiveValidator.validators = {
    required: function (value, rule) {
      return !(typeof value === 'undefined' || value === null || value === '');
    },
    number: function (value, rule) {
      return value.toString().match(/^-?[0-9]+(\.[0-9]+)?$/) != null;
    },
    integer: function (value, rule) {
      return value.toString().match(/^-?[0-9]+$/) != null;
    },
    positive: function (value, rule) {
      return value >= 0;
    },
    date: function (value, rule) {
      return moment(value, rule).isValid() ? true : rule;
    }
  };


  RactiveValidator.messages = {
    required: 'required',
    number: 'must be a number',
    integer: 'must be a whole number',
    positive: 'must be a positive number',
    date: 'must be a date (#)'
  };


  RactiveValidator.prototype.enabled = function (value) {
    this._enabled = value;
  };


  RactiveValidator.prototype.valid = function () {
    if (this._enabled) {
      validateAll.call(this);
      return Object.keys(this.validationErrors).length == 0;
    }
    else {
      return true;
    }
  };


  function validateAll() {
    for (var k in this.rules) {
      validateKeyPath.call(this, undefined, k, this.rules[k]);
    }
  }


  function validateKeyPath(parent, keypath, rules) {
    var m = keypath.match(/^([^\*]*)\.\*(\..*)?$/);

    if (m != null) {
      var arrPath = m[1];
      var arr = this.ractive.get(arrPath);

      for (var k in arr) {
        validateKeyPath.call(this, concat(parent, arrPath), concat(k, m[2]), rules);
      }
    }
    else {
      var keypath = concat(parent, '.', keypath);
      var value = this.ractive.get(keypath);
      validate.call(this, value, rules, keypath);
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


  function setValidator(keypath, rules) {
    var _this = this;

    _this.ractive.observe(keypath, function (newValue, oldValue, keypath) {
      if (!_this._enabled)
        return;

      validate.call(_this, newValue, rules, keypath);
    }, {init: false});
  }


  function validate(value, rules, keypath) {
    var error = null;

    for (var k in rules) {
      if (!this._validators.hasOwnProperty(k))
        throw new Error('validator ' + k + ' not defined');

      var result = this._validators[k].call(this, value, rules[k]);
      var error = null;

      if (typeof result === 'string') {
        error = this._messages[k].replace('#', result);
      }
      else if (!result) {
        error = this._messages[k];
      }

      if (error != null)
        break;
    }

    if (error != null) {
      this.ractive.set(keypath + 'Msg', error);
      this.validationErrors[keypath] = error;
    }
    else {
      this.ractive.set(keypath + 'Msg', undefined);
      delete this.validationErrors[keypath];
    }
  }


  function merge(dest, src) {
    for (var k in src) {
      if (src.hasOwnProperty(k))
        dest[k] = src[k];
    }
  }


  return RactiveValidator;
});
