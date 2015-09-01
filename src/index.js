
import factory from './RactiveValidator';


if (typeof window !== 'undefined') {
  module.exports = factory(window.moment, window.$);
} else if (typeof define === 'function' && define.amd) {
  define(['moment', 'jquery'], factory);
} else {
  let moment, $;

  try {
    moment = require('moment');
  } catch (e) {}

  try {
    $ = require('jquery');
  } catch (e) {}

  module.exports = factory(moment, $);
}
