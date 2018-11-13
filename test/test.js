const { readFileSync } = require('fs')
const { makeExecutableSchema } = require('graphql-tools')
const { GraphQLSchema } = require('graphql')

const constraint = require('../src/index')
const constraintSchemaDsl = readFileSync('constraint-directive.graphql', 'utf8')

describe('@constraint directive', () => {
  it('should work when used properly in other graphql schema', () => {
    const withOtherSchema = `
      ${constraintSchemaDsl}
      type Mutation {
        signup(
          name: String @constraint(maxLength:20)
        ): Boolean
      }
    `
    const schema = makeExecutableSchema({
      typeDefs: withOtherSchema,
      schemaDirectives: { constraint }
    })
    expect(schema).toBeInstanceOf(GraphQLSchema)
  })

  it('should NOT work when using unknown parameter', () => {
    const withOtherSchema = `
      ${constraintSchemaDsl}
      type Mutation {
        signup(
          name: String @constraint(DUMMY:123)
        ): Boolean
      }
    `
    expect(() =>
      makeExecutableSchema({
        typeDefs: withOtherSchema,
        schemaDirectives: { constraint }
      })
    ).toThrowError('Unknown argument "DUMMY" on directive "@constraint"')
  })
})
