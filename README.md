A form validator for the Ractive.JS framework
==============================================

[Ractive.JS](http://www.ractivejs.org/) is a great framework for two-way model binding in javascript
applications.  This project provides a validator class that you can use for forms bound with
Ractive.

Installation
-------------

Install via [Bower](http://bower.io/):

```
$ bower install -S ractive-validator
```

You can also just clone it from github.  The main file is `ractive-validator.js`, which you could of
course just download on its own.  If you want to run the tests, open `tests/Test.html` in your
browser.

Usage
------

The validator is defined as a [RequireJS](http://requirejs.org/) module, where the export is the
validator class:

```javascript
define(['ractive', 'ractive-validator'], function (Ractive, RactiveValidator) {
  var ractive = new Ractive({...});

  var validator = new RactiveValidator(ractive, {
    //rules
  });
});
```

The rules take the form of a map with [keypaths](http://docs.ractivejs.org/latest/keypaths) as keys
and the validation rule to be applied to the keypath as values.  For example, if you wanted the
`name` field to be required, you would write:

```javascript
var validator = new RactiveValidator(ractive, {
  'name': {required: true}
});
```

Multiple fields are supported by adding more keys to the map:

```javascript
var validator = new RactiveValidator(ractive, {
  'name': {required: true},
  'age': {required: true}
});
```

Pattern keypaths are supported too; for example, if you wanted all the item prices to be numeric
and required, you could write:

```javascript
var validator = new RactiveValidator(ractive, {
  'items.*.price': {required: true, number: true}
});
```

The validator registers observers for all the keypaths you define rules for, so the validation
updates when you edit fields.  Prior to submitting the form, you call the `valid` method, which
runs validation on every field and returns whether or not the form is valid:

```javascript
if (validator.valid()) {
  //submit the form
}
else {
  //scroll up to let the user see validation messages
  window.scrollTo(0,0);
}
```

By default, if the validator finds an error on a field, it will put the appropriate error message in
a property with the name of the field with `Msg` appended.  E.g., if the `name` field is required,
but has no value, then the `nameMsg` field will be set to `'required'`.  You would probably have a
`span` element to display the value of the error message:

```html
<div class="{{nameMsg ? 'has-error' : ''}}">
  <input type="text" value="{{name}}">
  <span class="validation-message">{{nameMsg}}</span>
</div>
```

I've also made it add an error css class if there is an error present.

### Validators

Currently there are only a handful of built in validators.

* `required: true` - the value of the field isn't `''`, `undefined`, or `null`
* `number: true` - the field is a number
* `integer: true` - the field is a whole number
* `positive: true` - the field is positive
* `date: <moment.js date format>` - the field is a valid date according to the given
[moment.js date format](http://momentjs.com/docs/#/parsing/string-format/)

These are defined in `RactiveValidator.validators`.

You can easily create your own validators too.  A validator is just a function which returns `true`
if the value given is valid, or `false` if the value is not valid.  Here is the `required` validator:

```javascript
required: function (value, rule) {
  return !(typeof value === 'undefined' || value === null || value === '');
}
```

The `rule` argument is set to the value given in the rule, i.e. `{required: true}` will call the
`required` validator with `rule` set to `true`, and `{multipleOf: 42}` will call the
`multipleOf` validator (if you had one) with `rule` set to `42`.

The validator can also return a string in the event of an error which provides more information
about the error.  This is used only by the `date` validator currently, which returns the date format
expected:

```javascript
date: function (value, rule) {
  return moment(value, rule).isValid() ? true : rule;
}
```

The `RactiveValidator` constructor takes a third argument containing options.  To add a validation
function, you can pass in a `validators` option:

```javascript
var options = {
  validators: {
    multipleOf: function (value, rule) {
      return value % rule == 0 ? true: rule;
    }
  }
};

var validator = new RactiveValidator(ractive, {
    //rules
}, options);
```

### Messages

There must be a validation message defined for every validator.  The default validation messages are
defined in `RactiveValidator.messages`.  More can be supplied as a `messages` option:

```javascript
var options = {
  validators: {/*...*/},
  messages: {
    multipleOf: 'must be a multiple of something'
  }
};
```

If the validator returns a string instead of `false` for an error, this can be inserted into your
validation message by using a `#` symbol:

```javascript
var options = {
  validators: {/*...*/},
  messages: {
    multipleOf: 'must be a multiple of #'
  }
};
```

This means your validation messages can't contain a normal `#` symbol.

### Disabling validation

Sometimes you might want to disable validation.  For example, if you load some details into the form
at the start, you probably don't want `required` errors on every empty field.  The solution is to
just disable validation until after you have loaded the initial data, and then turn it back on again:

```javascript
validator.enable(false);
//load some data
validator.enable(true);
```

You can also construct the validator with in an initially-disabled state using the options argument:

```javascript
var validator = new RactiveValidator(ractive, {/*rules*/}, {enabled: false});
```

### Changing the message suffix

The `messageSuffix` option lets you configure what the error field for a given field will be.  For
example, if you want the message for `name` to go into `nameError`, you would write:

```javascript
var options = {
  messageSuffix: 'Error'
};
```

The end
--------

It's probably a bit rough around the edges and there's probably some stuff missing, particularly
common, useful validators.  Feel free to get in touch if you think there's something that should be
added!
