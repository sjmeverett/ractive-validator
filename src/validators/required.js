
module.exports = function required(value, required, result) {
  var group, groupName, groupValue, match, ref;

  if (required) {
    if (typeof required === 'string') {
      ref = required.match(/([^\.]+)=(.+)/) || [], match = ref[0], groupName = ref[1], groupValue = ref[2];
      if (!match) {
        throw new Error('invalid require rule: ' + required);
      }
      group = result.groups[groupName];
      if ((typeof value === "undefined" || value === null) || value === '') {
        if (group === groupValue) {
          return {
            valid: false,
            error: 'required'
          };
        } else {
          return {
            valid: true
          };
        }
      } else {
        if (group === void 0) {
          result.groups[groupName] = groupValue;
          return {
            valid: true
          };
        } else if (group === groupValue) {
          return {
            valid: true
          };
        } else {
          return {
            valid: false,
            error: 'not required'
          };
        }
      }
    } else {
      if ((typeof value === "undefined" || value === null) || value === '') {
        return {
          valid: false,
          error: 'required'
        };
      } else {
        return {
          valid: true
        };
      }
    }
  } else {
    return {
      valid: true
    };
  }
};
