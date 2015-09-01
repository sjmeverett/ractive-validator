
import Ractive from 'ractive';
import RactiveValidator, {ObjectModel} from '../dist/ractive-validator';
import {expect} from 'chai';

Ractive.DEBUG = false;
const val = RactiveValidator.validators;

describe('RactiveValidator', function () {
  describe('built-in', function () {
    describe('required validator', function () {
      it('should be valid for non-empty string when group is not set', function () {
        expect(val.required('foo', 'group=value', {groups: {}}).valid).to.be.true;
      });

      it('should be valid for empty string when group is not set', function () {
        expect(val.required('', 'group=value', {groups: {}}).valid).to.be.true;
      });

      it('should be valid for non-empty string when group is set to same value', function () {
        expect(val.required('foo', 'group=value', {groups: {group: 'value'}}).valid).to.betrue;
      });

      it('should be invalid for non-empty string when group is set to different value', function () {
        expect(val.required('foo', 'group=different', {groups: {group: 'value'}}).valid).to.be.false;
      });

      it('should be valid for empty string when group is set to different value', function () {
        expect(val.required('', 'group=different', {groups: {group: 'value'}}).valid).to.be.true;
      });
    });


    describe('password validator', function () {
      it('should be valid for same value', function () {
        expect(val.password('password', 'password', {model: {get: (x) => x}}).valid).to.be.true
      });

      it('should be invalid for different value', function () {
        expect(val.password('password', 'foo', {model: {get: (x) => x}}).valid).to.be.false;
      });
    });


    describe('moment validator', function () {
      it('should be valid for an empty value', function() {
        expect(val.moment('', 'DD/MM/YYYY').valid).to.be.true;
      });

      it('should be valid for a correct value', function() {
        expect(val.moment('05/12/1989', 'DD/MM/YYYY').valid).to.be.true;
      });

      it('should be invalid for a wrong value', function() {
        expect(val.moment('fish', 'DD/MM/YYYY').valid).to.be.false;
      });

      it('should coerce the value if asked', function() {
        expect(val.moment('05/12/1989', {format: 'DD/MM/YYYY', coerce: true}).coerced.isValid).to.exist;

        expect(val.moment('05/12/1989', {format: 'DD/MM/YYYY', coerce: true}).coerced
          .format('YYYY-MM-DD HH:mm')).to.equal('1989-12-05 00:00');
      });

      it('should coerce to the specified format', function() {
        expect(val.moment('05/12/1989', {format: 'DD/MM/YYYY', coerce: 'YYYY-MM-DD'}).coerced)
          .to.equal('1989-12-05');
      });

      it('should coerce to date', function() {
        expect(val.moment('05/12/1989', {format: 'DD/MM/YYYY', coerce: 'date'})
          .coerced - new Date('1989-12-05')).to.equal(0);
      });
    });


    describe('type validator', function() {
      it('should be valid for string type and empty string', function() {
        expect(val.type('foo', 'string', {
          immediate: false
        }).valid).to.be.true;
      });

      it('should be invalid for string type and an integer', function() {
        expect(val.type(5, 'string', {
          immediate: false
        }).valid).to.be.false;
      });

      it('should be valid for integer type and an empty string', function() {
        expect(val.type('', 'integer', {
          immediate: false
        }).valid).to.be.true;
      });

      it('should be valid for integer type and an integer', function() {
        expect(val.type(5, 'integer', {
          immediate: false
        }).valid).to.be.true;
      });

      it('should be invalid for integer type and a decimal', function() {
        expect(val.type(5.5, 'integer', {
          immediate: false
        }).valid).to.be.false;
      });

      it('should be valid for integer type and an integer string', function() {
        var v = val.type('5', 'integer', {
          immediate: false
        });
        expect(v.valid).to.be.true;
        expect(v.coerced).to.equal(5);
      });

      it('should be valid for integer type and an empty string', function() {
        var v = val.type('', 'integer', {
          immediate: false
        });
        expect(v.valid).to.be.true;
        expect(v.coerced).to.equal(null);
      });

      it('should be invalid for integer type and a decimal string', function() {
        expect(val.type('5.5', 'integer', {
          immediate: false
        }).valid).to.be.false;
      });

      it('should be invalid for integer type and an arbitrary string', function() {
        expect(val.type('foo', 'integer', {
          immediate: false
        }).valid).to.be.false;
      });

      it('should be invalid for integer type and an integer string if immediate is true', function() {
        expect(val.type('5', 'integer', {
          immediate: true
        }).valid).to.be.false;
      });

      it('should be valid for decimal type and an empty string', function() {
        expect(val.type('', 'decimal', {
          immediate: false
        }).valid).to.be.true;
      });

      it('should be valid for decimal type and a decimal', function() {
        expect(val.type(5.5, 'decimal', {
          immediate: false
        }).valid).to.be.true;
      });

      it('should be valid for decimal type and a decimal string', function() {
        var v = val.type('5.5', 'decimal', {
          immediate: false
        });
        expect(v.valid).to.be.true;
        expect(v.coerced).to.equal(5.5);
      });

      it('should be invalid for decimal type and an arbitrary string', function() {
        expect(val.type('foo', 'decimal', {
          immediate: false
        }).valid).to.be.false;
      });

      it('should be valid for decimal type and an integer string', function() {
        expect(val.type('5', 'decimal', {
          immediate: false
        }).valid).to.be.true;
      });

      it('should be invalid for decimal type and a decimal string if immediate is true', function() {
        expect(val.type('5.5', 'decimal', {
          immediate: true
        }).valid).to.be.false;
      });

      it('should be valid for boolean type and an empty string', function() {
        expect(val.type('', 'boolean', {
          immediate: false
        }).valid).to.be.true;
      });

      it('should be valid for boolean type and a boolean', function() {
        expect(val.type(true, 'boolean', {
          immediate: false
        }).valid).to.be.true;
      });

      it('should be valid for boolean type and a boolean string', function() {
        var v = val.type('false', 'boolean', {
          immediate: false
        });
        expect(v.valid).to.be.true;
        expect(v.coerced).to.be.false;
      });

      it('should be invalid for boolean type and an arbitrary string', function() {
        expect(val.type('foo', 'boolean', {
          immediate: false
        }).valid).to.be.false;
      });

      it('should be invalid for boolean type and a boolean string if immediate is true', function() {
        expect(val.type('true', 'boolean', {
          immediate: true
        }).valid).to.be.false;
      });
    });


    describe('positive validator', function() {
      it('should be valid for positive numbers', function() {
        expect(val.positive(5).valid).to.be.true;
      });
      it('should be invalid for negative numbers', function() {
        expect(val.positive(-1).valid).to.be.false;
      });
    });
  });


  describe('.validate', function() {
    it('should be valid for a valid model', function() {
      var model, validation, validator;
      model = new ObjectModel({
        num: '1',
        str: 'fish',
        empty: ''
      });
      validator = new RactiveValidator(model, {
        num: {
          required: true,
          type: 'integer'
        },
        str: {
          required: true
        },
        empty: {
          type: 'integer'
        }
      });
      validation = validator.validate();
      expect(validation.valid).to.be.true;
      expect(validation.data.num).to.equal(1);
      expect(validation.data.str).to.equal('fish');
      expect(validation.data.empty).to.equal(null);
    });

    it('should be invalid for an invalid model', function() {
      var model, numMsg, strMsg, validation, validator;
      model = new ObjectModel({
        num: 'fish',
        str: ''
      });
      validator = new RactiveValidator(model, {
        num: {
          required: true,
          type: 'integer'
        },
        str: {
          required: true
        }
      });
      numMsg = val.type('fish', 'integer', {
        immediate: false
      }).error;
      strMsg = val.required('', true).error;
      validation = validator.validate();
      expect(validation.valid).to.be.false;
      expect(model.get('numMsg')).to.equal(numMsg);
      expect(model.get('strMsg')).to.equal(strMsg);
      expect(validation.errors.num).to.equal(numMsg);
      expect(validation.errors.str).to.equal(strMsg);
    });

    it('should set the error message to the first encountered error', function() {
      var validation, validator;
      validator = new RactiveValidator(new ObjectModel({
        a: ''
      }), {
        a: {
          custom: (function() {
            return {
              valid: false,
              error: 'custom'
            };
          }),
          required: true
        }
      });
      validation = validator.validate();
      expect(validation.valid).to.be.false;
      expect(validation.errors.a).to.equal('custom');
    });

    it('handles array wildcard keypaths', function() {
      var model, validation, validator;
      model = new ObjectModel({
        items: [
          {
            str: ''
          }, {
            str: 'a'
          }
        ]
      });
      validator = new RactiveValidator(model, {
        'items.*.str': {
          required: true
        }
      });
      validation = validator.validate();
      expect(validation.valid).to.be.false;
      expect(model.get('items.0.strMsg')).to.exist;
      expect(model.get('items.1.strMsg')).to.not.exist;
    });

    it('handles multiple wildcards', function() {
      var model, validation, validator;
      model = new ObjectModel({
        items: [
          {
            a: [
              {
                str: ''
              }, {
                str: 'a'
              }
            ]
          }
        ]
      });
      validator = new RactiveValidator(model, {
        'items.*.a.*.str': {
          required: true
        }
      });
      validation = validator.validate();
      expect(validation.valid).to.be.false;
      expect(model.get('items.0.a.0.strMsg')).to.exist;
      expect(model.get('items.0.a.1.strMsg')).to.not.exist;
    });

    it('handles object wildcards', function() {
      var model, validation, validator;
      model = new ObjectModel({
        items: {
          a: {
            str: ''
          },
          b: {
            str: 'a'
          }
        }
      });
      validator = new RactiveValidator(model, {
        'items.*.str': {
          required: true
        }
      });
      validation = validator.validate();
      expect(validation.valid).to.be.false;
      expect(model.get('items.a.strMsg')).to.exist;
      expect(model.get('items.b.strMsg')).to.not.exist;
    });

    it('handles validators with promises', async function () {
      var model, validation, validator;
      model = new ObjectModel({
        a: ''
      });
      validator = new RactiveValidator(model, {
        'a': {
          custom: (function() {
            return new Promise(function (resolve, reject) {
              resolve({valid: false});
            });
          })
        }
      });
      validation = validator.validate();
      expect(validation.then).to.exist;
      validation = (await validation);
      expect(validation.valid).to.be.false;
    });

    it('allows you to set the base path', function() {
      var model, validation, validator;
      model = new ObjectModel({
        data: {
          str: 'hello'
        }
      });
      validator = new RactiveValidator('data', model, {
        'str': {
          required: true
        }
      });
      validation = validator.validate();
      expect(validation.valid).to.be.true;
      expect(validation.data.str).to.equal('hello');
    });
  });


  describe('Observable', function () {
    it('should set an error message when a field is updated', function () {
      let ractive = new Ractive({data: {a: ''}});
      let validator = new RactiveValidator(ractive, {a: {type: 'integer'}});
      ractive.set('a', 'fish');
      expect(ractive.get('aMsg')).to.equal('must be a whole number');
    });

    it('should clear the error message if a field is updated to be correct', function () {
      let ractive = new Ractive({data: {a: ''}});
      let validator = new RactiveValidator(ractive, {a: {required: true}});
      ractive.set('aMsg', 'error');
      ractive.set('a', 'fish');
      expect(ractive.get('aMsg')).to.not.exist;
    });
  });
});
