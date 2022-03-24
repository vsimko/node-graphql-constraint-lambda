// @ts-check

const { makeExecutableSchema } = require('graphql-tools')
const { GraphQLSchema } = require('graphql')
const { constraint } = require('../src/index')

describe('constraint directive class', () => {
  it('should provide its own graphql SDL', () => {
    const sdl = constraint.getSDL()
    expect(sdl).toMatch('directive @constraint')
  })

  it('should work when used properly in other graphql schema', () => {
    const withOtherSchema = `
      ${constraint.getSDL()}
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
      ${constraint.getSDL()}
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
