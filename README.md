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
Add dependency into `package.json`:
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
import { constraint } from 'node-graphql-constraint-lambda'

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
