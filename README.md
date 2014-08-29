A form validator compatible with the Ractive.JS framework
=========================================================

[Ractive.JS](http://www.ractivejs.org/) is a great framework for two-way model binding in javascript
applications.  This project provides a validator class that you can use for forms bound with
Ractive.

It is also available as an npm package -- although the name of the package is `ractive-validator`,
that is historical, and in fact any data can be validated.  I use this feature to have data checked
on the client, AJAXd to the server and checked again with the same rules.  This way the user
gets to know immediately if something is up, and my API doesn't accept dodgy data.

Installation
-------------

Install via [Bower](http://bower.io/):

```
$ bower install -S ractive-validator
```

Install via [npm](https://www.npmjs.org/):

```
$ npm install --save ractive-validator
```

You can also just clone it from github.  The main file is `ractive-validator.js`, which you could of
course just download on its own.  If you want to run the tests, open `tests/Test.html` in your
browser.

Usage
------

The validator class can be used with AMD and node.  For example, using require.js you could write
the following:

```javascript
define(['ractive', 'ractive-validator'], function (Ractive, RactiveValidator) {
  var ractive = new Ractive({...});

  var validator = new RactiveValidator(ractive, {
    //rules
  });
});
```

Or, for node:

```javascript
var RactiveValidator = require('ractive-validator');

var validator = new RactiveValidator(mymodel, {
  //rules
});
```

The first parameter to the constructor is the data model.  This could be a normal javascript object
containing the data, or it could be a Ractive instance (or indeed anything with `get` and `set` methods).
Note that if your data model contains `get` or `set` properties, you will need to manually wrap it in
an `ObjectModel` instance:

```javascript
var mymodel = {get: 5, set: 3};
var validator = new RactiveValidator(new RactiveValidator.ObjectModel(mymodel), rules);
```

The rules argument to the constructor takes the form of a map with
[keypaths](http://docs.ractivejs.org/latest/keypaths) as keys and the validation rule to be applied to
the keypath as values.  For example, if you wanted the `name` field to be required, you would write:

```javascript
var validator = new RactiveValidator(model, {
  'name': {required: true}
});
```

Multiple fields are supported by adding more keys to the map:

```javascript
var validator = new RactiveValidator(model, {
  'name': {required: true},
  'age': {required: true}
});
```

Pattern keypaths are supported too; for example, if you wanted all the item prices to be numeric
and required, you could write:

```javascript
var validator = new RactiveValidator(model, {
  'items.*.price': {required: true, number: true}
});
```

If the `model` argument has an `observe` method, the keypaths supplied in the rules are
automatically observed for changes.  So, if you are using it with Ractive, form validation will
happen as the user types into the form.

Prior to submitting the form, you call the `validate` method, which runs validation on every
field and returns an object with the validation results.  One of the properties is `valid`, a
boolean indicating whether or not the form is valid:

```javascript
var validation = validator.validate();

if (validation.valid) {
  //submit the form
}
else {
  //scroll up to let the user see validation messages
  window.scrollTo(0,0);
}
```

Another property of the result object is `data`, which contains only the valid data found at the
keypaths specified by the format rules.  The `errors` property contains any validation error
messages.

By default, if the validator finds an error on a field, it will put the appropriate error message in
a property with the name of the field with `Msg` appended.  E.g., if the `name` field is required,
but has no value, then the `nameMsg` field will be set to `'required'`.  This is useful for frontend
stuff for reporting errors to the user; you would probably have a `span` element to display the value
of the error message:

```html
<div class="{{nameMsg ? 'has-error' : ''}}">
  <input type="text" value="{{name}}">
  <span class="validation-message">{{nameMsg}}</span>
</div>
```

In the example, I've also made it add an error css class if there is an error present.

### Validators

Currently there are only a handful of built in validators.

* `required: true` - the value of the field isn't `''`, `undefined`, or `null`
* `required: 'group name'` - the field will be required if other things in the same
group have data, otherwise, it should be empty
* `number: true` - the field is a number
* `integer: true` - the field is a whole number
* `positive: true` - the field is positive
* `moment: <moment.js date format>` - the field is a valid date according to the given
[moment.js date format](http://momentjs.com/docs/#/parsing/string-format/)
* `dataType: <string|integer|boolean>` - checks the data type of the object, mostly
for backend API stuff
* `password: 'keypath'` - makes sure the field and the specified keypath match, handy
for forms with a 'confirm password' field


You can easily create your own validators too.  A validator is just a function which returns
an object with a `valid` property, and an `error` message if not valid.  The arguments passed
to the validator function are the field value, the value specified in the rule, and the result
object, in that order, and `this` is the validator instance.  For example, here is the
`password` validator:

```javascript
password: function (value, otherfield, result) {
  if (value != result.model.get(otherfield)) {
    return {valid: false, error: 'passwords must match'};
  } else {
    return {valid: true};
  }
}
```

It might be handy for you to know that the library uses John Resig's ridiculously obfuscated
[Class pattern](http://ejohn.org/blog/simple-javascript-inheritance) (seriously, he's a genius, but
I would hate to be on a team with him) to define the `RactiveValidator` and `RactiveValidator.ObjectModel`
classes, so they can be extended in the manner described in that article.  An obvious use for this
would be to add more validators:

```javascript
var MyValidator = RactiveValidator.extend({
  init: function (model, format) {
    this._super(model, format);
    this.validators.mysupervalidator = mysupervalidator;
  }
});

var validator = new MyValidator(model, format);
```

### Disabling validation

Sometimes you might want to disable validation.  For example, if you load some details into the form
at the start, you probably don't want `required` errors on every empty field.  The solution is to
just disable validation until after you have loaded the initial data, and then turn it back on again:

```javascript
validator.enable(false);

///...
//load some data
///...

validator.enable(true);
```

Calling the `enable` method with any value clears the validation errors at the `...Msg` fields
described earlier.

### Changing the error suffix

The `errorSuffix` property lets you configure what the error field for a given field will be.  For
example, if you want the message for `name` to go into `nameError`, you would write:

```javascript
validator.errorSuffix = 'Error';
```

The end
--------

It's probably a bit rough around the edges and there's probably some stuff missing, particularly
common, useful validators.  Feel free to get in touch if you think there's something that should be
added!
