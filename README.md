# node-graphql-constraint-lambda

[![Build Status](https://travis-ci.org/vsimko/node-graphql-constraint-lambda.svg?branch=master)](https://travis-ci.org/vsimko/node-graphql-constraint-lambda)
[![npm module](https://badge.fury.io/js/node-graphql-constraint-lambda.svg)](https://www.npmjs.org/package/node-graphql-constraint-lambda)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

GraphQL constraint directive written in functional programming style.
This directive provides declarative validation of GraphQL arguments.

## Install

```sh
yarn add node-graphql-constraint-lambda
# or
npm install node-graphql-constraint-lambda
```

## Usage

Example GraphQL Schema:
```graphql
type Query {
  createUser (
    name: String! @constraint(minLength: 5, maxLength: 40)
    emailAddr: String @constraint(format: "email")
    otherEmailAddr: String @constraint(format: "email", differsFrom: "emailAddr")
    age: Int @constraint(min: 18)
  ): User
}
```

Use the constraint from your code:
```js
// when using es6 modules
import { constraint } from 'node-graphql-constraint-lambda'

// when using commonjs
const { constraint } = require('node-graphql-constraint-lambda')

// ... initialize your typeDefs and resolvers here ...

const server = new GraphQLServer({
  typeDefs,
  resolvers,
  schemaDirectives: {
    constraint
  }
  // ... additional graphql server config
})
// ... start your server
```

You may need to declare the directive in the schema:

```graphql
directive @constraint(
  minLength: Int
  maxLength: Int
  startsWith: String
  endsWith: String
  contains: String
  notContains: String
  pattern: String
  format: String
  differsFrom: String
  min: Float
  max: Float
  exclusiveMin: Float
  exclusiveMax: Float
  notEqual: Float
) on ARGUMENT_DEFINITION
```

## API

### Available constraints
See `stringValidators`, `numericValidators` and `formatValidator` mapping in [src/validators.js].

### Available formats
We use some functions from the `validator` package.
See `format2fun` mapping in [src/validators.js].

[src/validators.js]: https://github.com/vsimko/node-graphql-constraint-lambda/blob/master/src/validators.js


## Customization

### Default behavoir

The following code shows how the constraint directive is configured with default behaviour:
```js
// this code:
import { constraint } from 'node-graphql-constraint-lambda'

// is equivalent to:
import {
  prepareConstraintDirective,
  defaultValidationCallback,
  defaultErrorMessageCallback
} from 'node-graphql-constraint-lambda'

const constraint = prepareConstraintDirective(
  defaultValidationCallback, defaultErrorMessageCallback )

```

### Custom error messages

Error messages are generated using a **callback** function that by default
shows a generic error message. It is possible to change this behavior
by implementing a custom callback similar to this one:
```js
const myErrorMessageCallback = ({ argName, cName, cVal, data }) =>
  `Error at field ${argName} in constraint ${cName}:${cVal}, data=${data}`
```

You might also want to customize certain messages and to keep the default callback as a fallback for all other messages:
```js
const myErrorMessageCallback = input => {
  const { argName, cName, cVal, data } = input
  if (/* decide whether to show custom message */)
    return "custom error message" // based on input
  else
    return defaultErrorMessageCallback(input)
}

const constraint = prepareConstraintDirective(
  defaultValidationCallback, myErrorMessageCallback )
```

### Custom validation functions

Also the validation functions are implemented through a callback function.
The constraint directive comes with a set of useful defaults but if you
want to add your own validator, it can be done as follows:
```js
import {
  createValidationCallback,
  prepareConstraintDirective,
  defaultValidators } from 'node-graphql-constraint-lambda'

// you can merge default validators with your own validator
const myValidators = {
  ...defaultValidators,

  // your custom validator comes here
  constraintName: constrintValue => dataToValidate => true/false

  // Example: numerical pin codes of certain size `@constraint(pin:4)`
  pin: size => code => length(code) === size && match(/[0-9]+/)(code)
}

const myValidationCallback = createValidationCallback(myValidators)

// now you can create the constraint class
const constraint = prepareConstraintDirective(
  myValidationCallback, defaultErrorMessageCallback )
```

There is a special `format` validator that supports the following:
-  `@constraint(format: "email")`
-  `@constraint(format: "base64")`
-  `@constraint(format: "date")`
-  `@constraint(format: "ipv4")`
-  `@constraint(format: "ipv6")`
-  `@constraint(format: "url")`
-  `@constraint(format: "uuid")`
-  `@constraint(format: "futuredate")`
-  `@constraint(format: "pastdate")`
-  `@constraint(format: "creditcard")`

Let's say we want to extend it to support `format: "uppercase"` format that checks whether all characters are just uppercase letters:
```js
import {
  formatValidator,
  numericValidators,
  format2fun,
  stringValidators } from 'node-graphql-constraint-lambda'

const customFormat2Fun = {
  ...format2fun,

  uppercase: x => match(/[A-Z]*/)(x)
  // we could have omitted the `x` parameter due to currying in the
  // `match` function from ramda
}

const validators = {
  ...formatValidator(customFormat2Fun),
  ...numericValidators,
  ...stringValidators
}

// now you can create the constraint class
const constraint = prepareConstraintDirective(
  createValidationCallback(validators),
  defaultErrorMessageCallback
)

```
