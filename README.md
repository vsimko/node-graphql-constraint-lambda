# node-graphql-constraint-lambda

[![Build Status](https://travis-ci.org/vsimko/node-graphql-constraint-lambda.svg?branch=master)](https://travis-ci.org/vsimko/node-graphql-constraint-lambda)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

GraphQL constraint directive written in functional programming style.
This directive provides declarative verification of GraphQL arguments.

Example GraphQL Schema:
```graphql
type Query {
  createUser (
    name: String! @constraint(maxLength:40 minLength:5)
    emailAddr: String @constraint(format:"email")
    otherEmailAddr: String @constraint(format:"email" differsFrom:"emailAddr")
    age: Int @constraint(min:18)
  ): User
}
```
Add dependency into `package.json` (the package is not in npm yet):
```json
{ ...
  "dependencies": {
    ...
    "node-graphql-constraint-lambda": "https://github.com/vsimko/node-graphql-constraint-lambda.git",
    ...
  },
  ...
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

# Available constraints
See `stringVerifiers` and `numericVerifiers` mapping in [src/index.js].

# Available formats
We use functions from `validator` package. See `format2fun` mapping in [src/index.js].

[src/index.js]: https://github.com/vsimko/node-graphql-constraint-lambda/blob/master/src/index.js


# Customization

## Default behavoir

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

## Custom validation functions

TODO: description of the validation callback

## Custom error messages

Error messages are generated using a **callback** function that by default
shows a generic error message. It is possible to change this behavior
by implementing a custom callback as follows:
```js
// custom callback with a fallback to the default callback
const myErrorMessageCallback = input => {
  const { argName, cName, cVal, data } = input
  if(/* decide whether to show custom message */)
    return "custom error message" // based on input
  else
    return defaultErrorMessageCallback(input)
}

const constraint = prepareConstraintDirective(
  defaultValidationCallback, myErrorMessageCallback )
```
