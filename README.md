A form validator compatible with the Ractive.JS framework
=========================================================

This package can be used to perform custom validation on JavaScript objects -- although the name of
the package is `ractive-validator`, it doesn't have to be used with Ractive.  I like to use it on
the client-side with Ractive, and also on the server, with the same rules, checking the request.body
object.

([Ractive.JS](http://www.ractivejs.org/) is a great framework for two-way model binding in javascript
applications.)


Installation
-------------

Install via [npm](https://www.npmjs.org/):

```
$ npm install --save ractive-validator
```

Usage
------

The `RactiveValidator` class can be used with AMD, node, and regular browser script soup type scenarios.  For example, using require.js you could write
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

You can also just use it in the browser with a `script` tag.

### The constructor

The constructor has the signature `new RactiveValidator(basePath, model, rules)`.  The first two
arguments are optional, so you can have either, both, or neither of them.

#### the `rules` parameter

We'll start with `rules`, since that is mandatory.  The rules define what data is valid and what is not,
and are composed of an object keyed by *keypaths*.  A keypath (a Ractive concept) is just a reference
into hierarchical data.  Take the following object:

```javascript
var obj = {
  data: {
    list: [{name: 'bob'}, {name: 'betty'}],
    count: 2
  },
  other: '',
  crap: ''
}
```

The `count` property is at keypath `'data.count'`, while the string `'bob'` is at keypath
`'data.list.0.name'` (note: Ractive also lets you use `'data.list[0].name'`, but I haven't
bothered to implement that...).  Wildcard keypaths are also allowed, so for example,
`'data.list.*.name'` refers to all the name properties in the list.

So, we can now build rules to make sure `count` is positive and each element in `list` has
a name property with a non-empty value:

```javascript
var validator = new RactiveValidator({
  'data.list.*.name': {required: true},
  'data.count': {required: true, positive: true, type: 'integer'}
});
```

As you can hopefully see, rules are defined by creating an object with a property for each keypath.  The
validators to be applied to the keypath are specified in an object as the value of the property.  See
the **Validators** section for what validators are allowed.


#### the `model` parameter

You can provide a model at construction.  It can either be just a Plain Old JavaScript Object, or a
'model' object with `.get` and `.set` methods for getting and setting keypaths (e.g., a Ractive object).  You can also pass it a jQuery selector for a bunch of form fields you want validated.

If the given model also has an `.observe` method (e.g., is a Ractive object), the validator will listen
for changes to the keypaths defined in the rules, and validate in real time.


#### the 'basePath' parameter

`basePath` sets the base keypath.  That is, the example given previously could have been written as:

```javascript
var validator = new RactiveValidator('data', {
  'list.*.name': {required: true},
  'count': {required: true, positive: true, type: 'integer'}
});
```

### the `validate` method

This method runs the validation on the model: this will be the argument supplied to this method
if there is one, or the model given at construction.

```javascript
var validation = validator.validate(model);

if (validation.valid) {
  // yay!!
}
else {
  // oh no!
}
```

Another property of the result object is `data`, which contains only the valid data found at the
keypaths specified by the format rules.  The `errors` property contains any validation error
messages.

By default, if the validator finds an error on a field, it will put the appropriate error message in
a property with the name of the field with `Msg` appended.  E.g., if the `name` field is required,
but has no value, then the `nameMsg` field will be set to `'required'`.  This is useful for frontend
stuff for reporting errors to the user; you would probably have a `span` element to display the value
of the error message, as in the following example using Ractive:

```html
<div class="{{nameMsg ? 'has-error' : ''}}">
  <input type="text" value="{{name}}">
  <span class="validation-message">{{nameMsg}}</span>
</div>
```

I've also made it add an error css class if there is an error present.

### the `validators` property

The validator functions that the validator instance can use live in the `validators` property, with
each validator being given a default set at construction.  The default set live in the static `validators`
property -- changing this will change the default set given to each new instance.

Remember from earlier a rule looks like this:

    'some.keypath': {required: true, type: 'string'}

Here, `required` and `type` match properties of the `validators` property.  If you use a rule name that
is not recognised, it'll throw an exception when validaton is being performed; unless the argument is
a function, in which case, it'll use the function as a validator.  This is a handy way to define
one-off custom validators, e.g.:

    'some.keypath': {mySuperValidator: function (value, ruleValue, result) { ... }}

If you're going to use that validator a bunch of times though, you're better to put it in the `validators`
property:

    validator.validators.mySuperValidator = function (value, ruleValue, result) { ... }

Or, if you're going to use it in loads of different validators, you might even put it in the static
property (before you instance anything that uses it):

    RactiveValidator.validators.mySuperValidator = function (value, ruleValue, result) { ... }

The arguments to the validaion function are thus:
 * `value` - the value being validated
 * `ruleValue` - the value of the property in the rule, e.g., for the example  `required: true`, `ruleValue` is `true`
 * `result` - the result object - gives access to the model and the current errors

`this` is set to the validator instance.

A validator function returns an object with the following properties:
 * `valid` - `true` if the value was valid; otherwise, `false`
 * `error` - if `valid` is `false`, a message indicating why it is invalid
 * `coerced` - the validator can coerce the data to some other value, if desired

It may even return a promise for an object with those properties: this will cause the `validate` method to return a
promise though.  This is especially useful for validators which need to make a call to the server to work.


#### built in validators

There are only a handful of built-in validators, for the most common cases.

**required**

If you add `required: true` as a rule, then the value will be considered invalid if it is an empty string,
`null`, or `undefined`.  `required: false` is always valid, but is a handy way to get a value to show
up in the `data` property of the validation result if there are no other validation requirements.

**moment**

This checks that the value is valid according to the given moment.js format, e.g., `moment: 'DD/MM/YYYY'` will
validate only if the string is a valid UK date.  By default, the `data` property of the validation result
will contain a property for the field containing the same value as the field; however, you can have it
converted to a moment object illustrated in the more complete value below:

```javascript
var validator = new RactiveValidator(ractive, {
  'date': {required: true, moment: {format: 'DD/MM/YYYY', coerce: true}}
});

var validation = validator.validate();
// validation.data.date will be a moment object representing the input date
```

You can also specify the rule as `moment: {format: 'DD/MM/YYYY', coerce: 'YYYY-MM-DD'}` for example, to have
it coerced to a date string in a different format.  This is useful if you want your UI to accept dates in
one format, and have your API accept the date in ISO format for example.

**positive**

This makes sure that the value is positive.

**type**

This ensures that the value matches the specified type, one of the following: string, integer, decimal, and
boolean.  For validation of models passed into the constructor, the data will be coerced into the required
type if possible.  E.g., if the rule is `type: 'decimal'`, and the value is `'5.5'`, then the data after
validation will be `5.5`.

However, for validation of models specified as an argument to `validate`, it will give a validation error if
the type is not actually the specified type.

**password**

A validator for 'confirm password' fields: checks that the value matches the value at the specified keypath.

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


Using on a conventional HTML form
---------------------------------

If you clone the repository and build it with `grunt release`, you'll get a `ractive-validator.js` and `ractive-validator.min.js` in the `dist/` directory.  Your HTML page will need to reference jQuery then one of these JavaScript files.

You can then build an HTML form as normal, and then make a new RactiveValidator instance:

```javascript
var validator = new RactiveValidator($('#myform', {
  // rules...
}));
```

It will automatically subscribe to the `change` event so that the error messages get updated when the field loses focus.

Have a look at `test/html/index.html` for a really quick example.

The end
--------

I made this in my spare time, so it's probably a bit rough around the edges and there's probably some stuff missing, particularly
common, useful validators.  Feel free to get in touch if you think there's something that should be added!
