
module.exports = function (moment) {
  return function (value, format) {
    var coerce, format, m, ref;

    if (!moment) {
      throw new Error('you don\'t have moment support');
    }

    if (typeof format !== 'string') {
      ref = format, format = ref.format, coerce = ref.coerce;
    }

    if ((typeof value === "undefined" || value === null) || value === '') {
      return {
        valid: true
      };
    }

    m = moment.utc(value, format, true);

    if (m.isValid()) {
      if (coerce === true) {
        return {
          valid: true,
          coerced: m
        };
      } else if (coerce === 'date') {
        return {
          valid: true,
          coerced: m.toDate()
        };
      } else if (typeof coerce === 'string') {
        return {
          valid: true,
          coerced: m.format(coerce)
        };
      } else {
        return {
          valid: true
        };
      }
    } else {
      return {
        valid: false,
        error: 'must be ' + format
      };
    }
  };
};
