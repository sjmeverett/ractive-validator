
require.config({
  baseUrl: 'jasmine',
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
    'moment': '../../bower_components/moment/moment',
    'ractive': '../../bower_components/ractive/ractive',
    'ractive-validator': '../../ractive-validator'
  }
});

define(['ractive-validator', 'jasmine-start', 'ractive'], function (RactiveValidator, jasmineStart, Ractive) {

  describe('The built-in validators', function () {
    var val = RactiveValidator.validators;

    it('include a required validator', function () {
      expect(val.required(undefined, true)).toEqual(false);
      expect(val.required(null, true)).toEqual(false);
      expect(val.required('', true)).toEqual(false);
      expect(val.required('a value', true)).toEqual(true);
    });

    it('include a number validator', function () {
      expect(val.number(1, true)).toEqual(true);
      expect(val.number('100', true)).toEqual(true);
      expect(val.number('1.52', true)).toEqual(true);
      expect(val.number('-1.3', true)).toEqual(true);
      expect(val.number('a', true)).toEqual(false);
      expect(val.number('1.', true)).toEqual(false);
      expect(val.number('1abc', true)).toEqual(false);
      expect(val.number('', true)).toEqual(true);
    });

    it('include an integer validator', function () {
      expect(val.integer(1, true)).toEqual(true);
      expect(val.integer('100', true)).toEqual(true);
      expect(val.integer('-1', true)).toEqual(true);
      expect(val.integer('a', true)).toEqual(false);
      expect(val.integer('1.', true)).toEqual(false);
      expect(val.integer('1abc', true)).toEqual(false);
      expect(val.integer('1.1', true)).toEqual(false);
      expect(val.integer('', true)).toEqual(true);
    });

    it('include a positive validator', function () {
      expect(val.positive(1, true)).toEqual(true);
      expect(val.positive('5', true)).toEqual(true);
      expect(val.positive('0', true)).toEqual(true);
      expect(val.positive(-1, true)).toEqual(false);
      expect(val.positive('', true)).toEqual(true);
    });

    it('include a date validator', function () {
      expect(val.date('15/04/2014', 'DD/MM/YYYY')).toEqual(true);
      expect(val.date('1100/92/451', 'DD/MM/YYYY')).toEqual('DD/MM/YYYY');
      expect(val.date('fish', 'DD/MM/YYYY')).toEqual('DD/MM/YYYY');
      expect(val.date('', true)).toEqual(true);
    });
  });


  describe('RactiveValidator.valid', function () {
    var html = '<input type="text" value="{{num}}"><input type="text" value="{{str}}">';

    it('returns true for a valid model', function () {
      var ractive = new Ractive({template: html, data: {num: 1, str: 'fish'}});
      var validator = new RactiveValidator(ractive, {num: {required: true, number: true}, str: {required: true}});
      var valid = validator.valid();

      expect(valid).toEqual(true);
    });

    it('returns false for an invalid model', function () {
      var ractive = new Ractive({el: '#el', template: html, data: {num: '', str: ''}});
      var validator = new RactiveValidator(ractive, {num: {required: true, number: true}, str: {required: true}});
      var valid = validator.valid();

      expect(valid).toEqual(false);
    });

    it('sets error messages for an invalid model', function () {
      var model = {num: 'a', str: ''};
      var ractive = new Ractive({el: '#el', template: html, data: model});
      var validator = new RactiveValidator(ractive, {num: {required: true, number: true}, str: {required: true}});
      var valid = validator.valid();

      expect(model.numMsg).toEqual(RactiveValidator.messages.number);
      expect(model.strMsg).toEqual(RactiveValidator.messages.required);
    });

    it('handles array wildcard keypaths', function () {
      var model = {items: [{num: 'a', str: ''}, {num: '5', str: 'a str'}]};
      var ractive = new Ractive({el: '#el', template: html, data: model});
      var validator = new RactiveValidator(ractive, {'items.*.num': {required: true, number: true}, 'items.*.str': {required: true}});
      var valid = validator.valid();

      expect(model.items[0].numMsg).toEqual(RactiveValidator.messages.number);
      expect(model.items[0].strMsg).toEqual(RactiveValidator.messages.required);
      expect(model.items[1].numMsg).toEqual(undefined);
      expect(model.items[1].strMsg).toEqual(undefined);
    });

    it('handles object wildcard keypaths', function () {
      var model = {items: {a: {num: 'a', str: ''}, b:{num: '5', str: 'a str'}}};
      var ractive = new Ractive({el: '#el', template: html, data: model});
      var validator = new RactiveValidator(ractive, {'items.*.num': {required: true, number: true}, 'items.*.str': {required: true}});
      var valid = validator.valid();

      expect(model.items.a.numMsg).toEqual(RactiveValidator.messages.number);
      expect(model.items.a.strMsg).toEqual(RactiveValidator.messages.required);
      expect(model.items.b.numMsg).toEqual(undefined);
      expect(model.items.b.strMsg).toEqual(undefined);
    })
  });

  describe('RactiveValidator.enabled', function () {
    var html = '<input type="text" value="{{num}}"><input type="text" value="{{str}}">';

    it('disables validation', function () {
      var ractive = new Ractive({template: html, data: {num: '', str: ''}});
      var validator = new RactiveValidator(ractive, {num: {required: true, number: true}, str: {required: true}});
      validator.enabled(false);

      var valid = validator.valid();
      expect(valid).toEqual(true);
      expect(ractive.get('numMsg')).toEqual('');
      expect(ractive.get('strMsg')).toEqual('');
    });

    it('deletes previous messages', function () {
      var ractive = new Ractive({template: html, data: {num: '', str: ''}});
      var validator = new RactiveValidator(ractive, {num: {required: true, number: true}, str: {required: true}});
      var valid = validator.valid();
      validator.enabled(false);
      expect(ractive.get('numMsg')).toEqual('');
      expect(ractive.get('strMsg')).toEqual('');
    });
  });

  jasmineStart();
});
