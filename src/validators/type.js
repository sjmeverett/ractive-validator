
module.exports = function type(value, type, result) {
  if (typeof value === "undefined" || value === null) {
    return {
      valid: true
    };
  }

  if (type === 'string') {
    if (typeof value !== 'string') {
      return {
        valid: false,
        error: 'must be a string'
      };
    } else {
      return {
        valid: true
      };
    }
  } else if (type === 'integer') {
    if (value === '') {
      return {
        valid: true,
        coerced: null
      };
    } else if ((typeof value === 'number' && (value % 1) !== 0) || (typeof value !== 'number' && result.immediate) || ((typeof value !== "undefined" && value !== null) && value !== '' && !/^(\-|\+)?([0-9]+)$/.test(value))) {
      return {
        valid: false,
        error: 'must be a whole number'
      };
    } else {
      return {
        valid: true,
        coerced: Number(value)
      };
    }
  } else if (type === 'decimal') {
    if (value === '') {
      return {
        valid: true,
        coerced: null
      };
    } else if ((typeof value !== 'number' && result.immediate) || ((typeof value !== "undefined" && value !== null) && value !== '' && !/^(\-|\+)?([0-9]+(\.[0-9]+)?)$/.test(value))) {
      return {
        valid: false,
        error: 'must be a decimal'
      };
    } else {
      return {
        valid: true,
        coerced: Number(value)
      };
    }
  } else if (type === 'boolean') {
    if (value === '') {
      return {
        valid: true,
        coerced: null
      };
    } else if ((typeof value !== 'boolean' && result.immediate) || ((typeof value !== "undefined" && value !== null) && value !== '' && !/^(true|false)$/.test(value))) {
      return {
        valid: false,
        error: 'must be a boolean'
      };
    } else {
      return {
        valid: true,
        coerced: value === 'true' || value === true
      };
    }
  } else {
    throw new Error('unknown data type ' + type);
  }
};
