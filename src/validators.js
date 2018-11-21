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
  match,
  defaultTo
} = require('ramda')

const defaultToEmptyStr = defaultTo('')

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
  minLength: min => strOrArray => length(defaultToEmptyStr(strOrArray)) >= min,
  maxLength: max => strOrArray => length(defaultToEmptyStr(strOrArray)) <= max,
  startsWith, // from ramda
  endsWith, // from ramda
  contains, // TODO: ramda docs says `contains` is deprecated
  notContains: compose(
    not,
    contains
  ),
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
  `Constraint '${cName}:${cVal}' violated in field '${argName}'`

const defaultValidators = {
  ...formatValidator(format2fun),
  ...numericValidators,
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
  formatValidator,
  format2fun
}
