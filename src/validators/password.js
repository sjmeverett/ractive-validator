
module.exports = function password(value, otherField, result) {
  if (value === result.model.get(otherField)) {
    return {valid: true};
  } else {
    return {valid: false, error: 'passwords must match'};
  }
};
