
import $ from 'jquery';

export default class FormModel {
  constructor(selector, options={}) {
    this.selector = selector;
    this.fields = {};
    this.errorClass = options.errorClass || 'has-error';
    this.messageClass = options.messageClass || 'validation-message';

    let _this = this;

    selector.each(function () {
      $(this).find(':input').each(function () {
        let field = $(this);
        let name = field.attr('name');

        if (!_this.fields[name]) {
          _this.fields[name] = [field];
        } else {
          _this.fields[name].push(field);
        }
      });
    });
  }


  get(keypath) {
    let fields = this.fields[keypath];

    if (fields) {
      let values = fields.map((x) => x.val());
      return values.length > 1 ? values : values[0];
    }
  }


  set(keypath, value) {
    let fields = this.fields[keypath];

    if (fields) {
      fields.forEach(function (field) {
        field.val(value);
      });
    }
  }


  observe(keypath, fn) {
    this.selector.find(`[name="${keypath}"]`).on('change', function () {
      fn($(this).val(), null, keypath);
    });
  }


  setError(keypath, value) {
    let fields = this.fields[keypath];
    let _this = this;

    if (fields) {
      fields.forEach(function (field) {
        // add an error class to the field
        field.addClass(_this.errorClass);
        // remove any existing error message
        field.next('.' + _this.messageClass).remove();
        // add an error message span after the field
        field.after($('<span>').addClass(_this.messageClass).text(value));
      });
    }
  }


  clearError(keypath, value) {
    let fields = this.fields[keypath];
    let _this = this;

    if (fields) {
      fields.forEach(function (field) {
        // remove the error class from the field
        field.removeClass(_this.errorClass);
        // remove any existing error message
        field.next('.' + _this.messageClass).remove();
      });
    }
  }
};
