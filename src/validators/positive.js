
module.exports = function positive(value, type) {
  if (value >= 0) {
    return {valid: true};
  } else {
    return {valid: false, error: 'must be positive'};
  }
};
