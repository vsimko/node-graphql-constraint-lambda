const { mergeDeepRight, reduce } = require('ramda')
const {
  isAfter,
  isBefore,
  isCreditCard,
  isUUID,
  isURL,
  isEmail,
  isBase64,
  isRFC3339,
  isIP,
  contains
} = require('validator')

// default formats, you can extend this in your code
const format2fun = {
  email: isEmail,
  base64: isBase64,
  date: isRFC3339,
  ipv4: x => isIP(x, 4),
  ipv6: x => isIP(x, 6),
  url: isURL,
  uuid: isUUID,
  futuredate: isAfter,
  pastdate: isBefore,
  creditcard: isCreditCard
}

// needs to be configured using format2fun
const formatValidator = format2fun => ({
  fun: { format: fmtName => str => str && format2fun[fmtName](str) },
  msg: { format: fmtName => `Value does not matches the '${fmtName}' format` }
})

const stringValidators = {
  fun: {
    minLength: min => strOrArray => strOrArray && strOrArray.length >= min,
    maxLength: max => strOrArray => strOrArray && strOrArray.length <= max,
    startsWith: prefix => str => str && str.startsWith(prefix),
    endsWith: suffix => str => str && str.endsWith(suffix),
    contains: substr => str => str && contains(str, substr),
    notContains: substr => str => str && !contains(str, substr),
    pattern: pattern => str => str && new RegExp(pattern).test(str),
    differsFrom: argName => (value, queryArgs) => value !== queryArgs[argName]
  },
  msg: {
    minLength: min => `Minimal length allowed is ${min}`,
    maxLength: max => `Maximal length allowed is ${max}`,
    startsWith: prefix => `Must start with prefix '${prefix}'`,
    endsWith: suffix => `Argument must end with suffix '${suffix}'`,
    contains: substr => `Must contain '${substr}'`,
    notContains: substr => `Must not contain '${substr}'`,
    pattern: pattern => `Must match pattern '${pattern}'`,
    differsFrom: argName => `Value in argument '${argName}' must be different`
  }
}

const numericValidators = {
  fun: {
    min: min => x => x >= min,
    max: max => x => x <= max,
    exclusiveMin: min => x => x > min,
    exclusiveMax: max => x => x < max,
    notEqual: neq => x => x !== neq
  },
  msg: {
    min: min => `Value too small (min=${min})`,
    max: max => `Value too big (max=${max})`,
    exclusiveMin: min => `Value too small, should be more than ${min}`,
    exclusiveMax: max => `Value too big, should be less than ${max}`,
    notEqual: neq => `Value ${neq} not allowed`
  }
}

/**
 * Merges validators from multiple object together.
 * Note: validators are stored in objects as: `{fun:{...}, msg:{...}}`.
 */
const mergeValidators = (...args) => reduce(mergeDeepRight, {}, args)

module.exports = {
  defaultValidators: mergeValidators(
    stringValidators,
    numericValidators,
    formatValidator(format2fun)
  ),
  stringValidators,
  numericValidators,
  formatValidator,
  format2fun,
  mergeValidators
}
