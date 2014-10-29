
require.config({
  baseUrl: '..',
  shim: {
    'jasmine': {
      exports: 'jasmine'
    },
    'jasmine-html': {
      deps: ['jasmine'],
      exports: 'jasmine'
    }
  },
  paths: {
    'moment': 'bower_components/moment/moment',
    'ractive': 'bower_components/ractive/ractive',
    'jasmine': 'tests/jasmine/jasmine',
    'jasmine-html': 'tests/jasmine/jasmine-html',
    'jasmine-start': 'tests/jasmine/jasmine-start'
  }
});

define(['ractive-validator', 'jasmine-start', 'ractive', 'objectModel'], function (RactiveValidator, jasmineStart, Ractive, ObjectModel) {

  describe('The built-in validators', function () {
    var validator = new RactiveValidator({}, {});
    var val = validator.validators;

    it('include a required validator', function () {
      expect(val.required(undefined, true).valid).toEqual(false);
      expect(val.required(null, true).valid).toEqual(false);
      expect(val.required('', true).valid).toEqual(false);
      expect(val.required('a value', true).valid).toEqual(true);
      expect(val.required('', false).valid).toEqual(true);
      
      validator.groups = {};
      expect(val.required.call(validator, 'foo', 'group.value').valid).toEqual(true);
      expect(validator.groups['group']).toEqual('value');
      expect(val.required.call(validator, 'foo', 'group.value').valid).toEqual(true);
      expect(val.required.call(validator, 'foo', 'group.another').valid).toEqual(false);
      expect(val.required.call(validator, undefined, 'group2.value').valid).toEqual(true);
      expect(validator.groups['group2']).toEqual(undefined);
      expect(val.required.call(validator, 'foo', 'group2.another').valid).toEqual(true);
      expect(validator.groups['group2']).toEqual('another');
    });

    it('include a number validator', function () {
      expect(val.number(1, true).valid).toEqual(true);
      expect(val.number('100', true).valid).toEqual(true);
      expect(val.number('1.52', true).valid).toEqual(true);
      expect(val.number('-1.3', true).valid).toEqual(true);
      expect(val.number('a', true).valid).toEqual(false);
      expect(val.number('1.', true).valid).toEqual(false);
      expect(val.number('1abc', true).valid).toEqual(false);
      expect(val.number('', true).valid).toEqual(true);
    });

    it('include an integer validator', function () {
      expect(val.integer(1, true).valid).toEqual(true);
      expect(val.integer('100', true).valid).toEqual(true);
      expect(val.integer('-1', true).valid).toEqual(true);
      expect(val.integer('a', true).valid).toEqual(false);
      expect(val.integer('1.', true).valid).toEqual(false);
      expect(val.integer('1abc', true).valid).toEqual(false);
      expect(val.integer('1.1', true).valid).toEqual(false);
      expect(val.integer('', true).valid).toEqual(true);
    });

    it('include a positive validator', function () {
      expect(val.positive(1, true).valid).toEqual(true);
      expect(val.positive('5', true).valid).toEqual(true);
      expect(val.positive('0', true).valid).toEqual(true);
      expect(val.positive(-1, true).valid).toEqual(false);
      expect(val.positive('', true).valid).toEqual(true);
    });

    it('include a moment validator', function () {
      expect(val.moment('15/04/2014', 'DD/MM/YYYY').valid).toEqual(true);
      expect(val.moment('1100/92/451', 'DD/MM/YYYY').valid).toEqual(false);
      expect(val.moment('fish', 'DD/MM/YYYY').valid).toEqual(false);
      expect(val.moment('', true).valid).toEqual(true);
    });

    it('include a password validator', function () {
      var mock = {model: {get: function(keypath) { return keypath; }}};
      expect(val.password('password', 'password', mock).valid).toEqual(true);
      expect(val.password('foo', 'password', mock).valid).toEqual(false);
    });
    
    it('include a data type validator', function () {
      expect(val.dataType('a string', 'string').valid).toEqual(true);
      expect(val.dataType('a string', 'integer').valid).toEqual(false);
      expect(val.dataType(5, 'integer').valid).toEqual(true);
      expect(val.dataType(5, 'string').valid).toEqual(false);
      expect(val.dataType(true, 'boolean').valid).toEqual(true);
      expect(val.dataType(true, 'integer').valid).toEqual(false);
      expect(val.dataType(undefined, 'string').valid).toEqual(true);
    });
  });


  describe('RactiveValidator.validate', function () {
    it('returns true for a valid model', function () {
      var validator = new RactiveValidator(new ObjectModel({num: 1, str: 'fish'}), {num: {required: true, number: true}, str: {required: true}});
      var result = validator.validate();

      expect(result.valid).toEqual(true);
    });

    it('returns false for an invalid model', function () {
      var validator = new RactiveValidator(new ObjectModel({num: '', str: ''}), {num: {required: true, number: true}, str: {required: true}});
      var result = validator.validate();

      expect(result.valid).toEqual(false);
    });

    it('sets error messages for an invalid model', function () {
      var model = {num: 'a', str: ''};
      var validator = new RactiveValidator(new ObjectModel(model), {num: {required: true, number: true}, str: {required: true}});
      var result = validator.validate();

      expect(model.numMsg).toEqual(validator.validators.number('a').error);
      expect(model.strMsg).toEqual(validator.validators.required('', true).error);
      expect(result.errors.num).toEqual(model.numMsg);
      expect(result.errors.str).toEqual(model.strMsg);
    });

    it('handles array wildcard keypaths', function () {
      var model = {items: [{num: 'a', str: ''}, {num: '5', str: 'a str'}]};
      var validator = new RactiveValidator(new ObjectModel(model), {'items.*.num': {required: true, number: true}, 'items.*.str': {required: true}});
      var result = validator.validate();

      expect(model.items[0].numMsg).toEqual(validator.validators.number('a').error);
      expect(model.items[0].strMsg).toEqual(validator.validators.required('', true).error);
      expect(model.items[1].numMsg).toEqual(undefined);
      expect(model.items[1].strMsg).toEqual(undefined);
    });

    it('handles object wildcard keypaths', function () {
      var model = {items: {a: {num: 'a', str: ''}, b:{num: '5', str: 'a str'}}};
      var validator = new RactiveValidator(new ObjectModel(model), {'items.*.num': {required: true, number: true}, 'items.*.str': {required: true}});
      var result = validator.validate();

      expect(model.items.a.numMsg).toEqual(validator.validators.number('a').error);
      expect(model.items.a.strMsg).toEqual(validator.validators.required('', true).error);
      expect(model.items.b.numMsg).toEqual(undefined);
      expect(model.items.b.strMsg).toEqual(undefined);
    });

    it('works with simple arrays', function () {
      var model = {tags: ['tag1', 'selfie']};
      var validator = new RactiveValidator(model, {'tags.*': {dataType: 'string'}});
      var result = validator.validate();

      expect(result.valid).toEqual(true);
    });
  });

  describe('RactiveValidator.enabled', function () {
    it('deletes previous messages', function () {
      var model = {num: '', str: ''};
      var validator = new RactiveValidator(new ObjectModel(model), {num: {required: true, number: true}, str: {required: true}});
      var result = validator.validate();
      validator.enable(false);
      expect(model.numMsg).toEqual(undefined);
      expect(model.strMsg).toEqual(undefined);
    });
  });

  describe('ObjectModel', function () {
    it('supports setting non-existent array properties', function () {
      var data = {};
      var model = new ObjectModel(data);
      model.set('array.0', 'fish');
      expect(Array.isArray(data.array)).toEqual(true);
      expect(data.array[0]).toEqual('fish');
    });

    it('supports setting wildcard keypaths', function () {
      var data = {array: [0, 0, 0]};
      var model = new ObjectModel(data);
      model.set('array.*', 1);
      expect(data.array[0]).toEqual(1);
      expect(data.array[1]).toEqual(1);
      expect(data.array[2]).toEqual(1);
    });
  });

  jasmineStart();
});
