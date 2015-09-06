
import $ from 'jquery';
import FormModel from './FormModel';
import moment from 'moment';
import ObjectModel from './ObjectModel';


class RactiveValidator {
  constructor() {
    [this.rules, this.model, this.basePath] = Array.prototype.slice.call(arguments).reverse();
    this.basePath = this.basePath ? this.basePath + '.' : '';
    this.validators = RactiveValidator.validators;
    this.enabled = true;
    this.errorSuffix = 'Msg';

    if (this.model)
      this.model = this.wrapModel();

    if (this.model && this.model.observe) {
      this.observeModel();
    }
  }


  observeModel() {
    let _this = this;

    let result = {
      valid: true,
      model: this.wrapModel(),
      errors: new ObjectModel(),
      data: new ObjectModel(),
      groups: [],
      immediate: false
    };

    for (let rulepath in this.rules) {
      this.model.observe(rulepath, function (newValue, oldValue, keypath) {
        if (_this.enabled) {
          _this.validateKeypath(newValue, keypath, result, _this.rules[rulepath]);
        }
      }, {init: false});
    }
  }


  enable(value) {
    this.enabled = value;

    for (let keypath in this.rules) {
      this.model.clearError(this.basePath + keypath);
    }
  }


  validate(model) {
    let result = {
      valid: true,
      model: this.wrapModel(model),
      errors: new ObjectModel(),
      data: new ObjectModel(),
      groups: [],
      immediate: model != null
    };

    let promises = [];

    for (let keypath in this.rules) {
      let rules = this.rules[keypath];
      let ret = this.validateWildcardKeypath(this.basePath + keypath, result, rules);

      if (ret && ret.then) {
        promises.push(ret);
      }
    }

    let resultFn = () => ({
      valid: result.valid,
      errors: result.errors.model,
      data: result.data.get(this.basePath.substring(0, this.basePath.length - 1))
    });

    if (promises.length) {
      return Promise.all(promises).then(resultFn);
    } else {
      return resultFn();
    }
  }


  validateWildcardKeypath(keypath, result, rules) {
    let paths = result.model.expandKeypath(keypath);
    let promises = [];

    for (let i in paths) {
      let ret = this.validateKeypath(result.model.get(paths[i]), paths[i], result, rules);

      if (ret && ret.then) {
        promises.push(ret);
      }
    }

    if (promises.length) {
      return Promise.all(promises);
    }
  }


  validateKeypath(value, keypath, result, rules) {
    let ar = [];

    for (let rule in rules) {
      ar.push({key: rule, value: rules[rule]});
    }

    let coerced = this.validateKeypathRules(value, keypath, result, ar);

    let resultFn = (coerced) => {
      // if the result was valid, set the corresponding result.data field
      if (result.valid) {
        result.data.set(keypath, typeof coerced !== 'undefined' ? coerced : value);
      }
    };

    if (coerced && coerced.then) {
      return coerced.then(resultFn);
    } else {
      resultFn(coerced);
    }
  }


  validateKeypathRules(value, keypath, result, rules, i=0, coerced) {
    let rule = rules[i];
    let validator;

    // figure out whether it's a normal validator or a custom one
    if (!this.validators.hasOwnProperty(rule.key)) {
      if (typeof rule.value === 'function') {
        validator = rule.value;
      } else {
        throw new Error(`validator ${rule.key} not defined`);
      }
    } else {
      validator = this.validators[rule.key];
    }

    // do the validation
    let validation = validator.call(this, value, rule.value, result);

    // sometimes we have promises, sometimes not, hence the weirdness
    let resultFn = (validation) => {
      // was it valid?
      if (validation.valid) {
        if (!result.immediate)
          result.model.clearError(keypath);

        if (typeof validation.coerced !== 'undefined')
          coerced = validation.coerced;

        if (i + 1 < rules.length) {
          return this.validateKeypathRules(value, keypath, result, rules, i + 1, coerced);
        } else {
          return coerced;
        }

      } else {
        result.valid = false;
        result.errors.set(keypath, validation.error);
        result.model.setError(keypath, validation.error);
      }
    };

    if (!validation) {
      throw new Error(`validator ${rule.key} did not return a value`);
    } else if (validation.then) {
      if (!Promise) {
        throw new Error(`validator ${rule.key} returns a promise and you don't have promise support`);
      } else {
        return validation.then(resultFn);
      }
    } else {
      return resultFn(validation);
    }
  }


  wrapModel(model) {
    let _this = this;
    model = model || this.model;

    // jQuery forms get handled separately
    if ($ && model instanceof $) {
      model = new FormModel(model);

    } else {
      // POJOs get wrapped in ObjectModel
      if (!(model.get && model.set)) {
        model = new ObjectModel(model);
      }

      // fill out missing methods in model, e.g. if it is a ractive instance
      if (!model.expandKeypath) {
        model.expandKeypath = ObjectModel.prototype.expandKeypath;
      }

      if (!model.setError) {
        model.setError = function (keypath, value) {
          _this.model.set(keypath + _this.errorSuffix, value);
        };
      }

      if (!model.clearError) {
        model.clearError = function (keypath) {
          _this.model.set(keypath + _this.errorSuffix);
        };
      }
    }

    return model;
  }
}

module.exports = RactiveValidator;

// require the validators
let bulk = require('bulk-require');
let all = bulk(__dirname, ['validators/*.js']);

// hackety hack
// give the moment validator a possible reference to Moment
all.validators.moment = all.validators.moment(moment);

RactiveValidator.validators = all.validators;

RactiveValidator.ObjectModel = ObjectModel;
RactiveValidator.FormModel = FormModel;
