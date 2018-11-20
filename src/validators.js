const {
  isAfter,
  isBefore,
  isCreditCard,
  isUUID,
  isURL,
  isEmail,
  isBase64,
  isRFC3339,
  isIP
} = require('validator')

const {
  contains,
  endsWith,
  startsWith,
  length,
  not,
  compose,
  match
} = require('ramda')

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
  startsWith, // from ramda
  endsWith, // from ramda
  contains, // TODO: use `includes` instead since v0.26.0
  notContains: compose(not, contains),
  pattern: match, // from ramda
  differsFrom: argName => (value, queryArgs) => value !== queryArgs[argName]
}

const numericValidators = {
  min: min => x => x >= min,
  max: max => x => x <= max,
  exclusiveMin: min => x => x > min,
  exclusiveMax: max => x => x < max,
  notEqual: neq => x => x !== neq
}

const defaultErrorMessageCallback = ({ argName, cName, cVal, data }) =>
  `Constriant '${cName}:${cVal}' violated in field '${argName}'`

const defaultValidators = {
  ...formatValidator(format2fun),
  ...numericValidators,
  ...stringValidators
}

const defaultValidationCallback = ({ argName, cName, cVal, data }) => {
  const result = defaultValidators[cName](cVal)(data)
  return { argName, cName, cVal, data, result }
}

module.exports = {
  defaultValidators,
  defaultValidationCallback,
  defaultErrorMessageCallback,
  stringValidators,
  numericValidators,
  formatValidator,
  format2fun
}
