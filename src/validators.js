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
  matches,
  contains
} = require('validator')

const { length } = require('./utils')

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
  format: fmtName => format2fun[fmtName]
})

const stringValidators = {
  minLength: min => strOrArray => length(strOrArray) >= min,
  maxLength: max => strOrArray => length(strOrArray) <= max,
  startsWith: prefix => str => str != null && str.startsWith(prefix),
  endsWith: suffix => str => str != null && str.endsWith(suffix),
  contains: el => str => contains(str, el),
  notContains: el => str => !contains(str, el),
  pattern: pat => str => matches(str, pat),
  differsFrom: argName => (value, queryArgs) => value !== queryArgs[argName]
}

const numericValidators = {
  min: min => x => x >= min,
  max: max => x => x <= max,
  exclusiveMin: min => x => x > min,
  exclusiveMax: max => x => x < max,
  notEqual: neq => x => x !== neq
}

// TODO: implement it
const logicalValidators = {
  // OR: ,
  // AND: ,
  // NOT:
}

const defaultErrorMessageCallback = ({ argName, cName, cVal, data }) =>
  `Constraint '${cName}:${cVal}' violated in field '${argName}'`

const defaultValidators = {
  ...formatValidator(format2fun),
  ...numericValidators,
  ...logicalValidators,
  ...stringValidators
}

const createValidationCallback = validators => input => ({
  ...input,
  result: validators[input.cName](input.cVal)(input.data)
})

module.exports = {
  defaultValidators,
  defaultValidationCallback: createValidationCallback(defaultValidators),
  defaultErrorMessageCallback,
  createValidationCallback,
  stringValidators,
  numericValidators,
  logicalValidators,
  formatValidator,
  format2fun
}
