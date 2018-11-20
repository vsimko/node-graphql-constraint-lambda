const { makeExecutableSchema } = require('graphql-tools')
const { GraphQLSchema } = require('graphql')

const { constraint, prepareConstraintDirective } = require('../src/index')
const {
  format2fun,
  mergeValidators,
  stringValidators,
  numericValidators,
  formatValidator
} = require('../src/validators')

describe('@constraint directive', () => {
  it('testing', async () => {
    const details = { field: { resolve: async () => {} } }

    // eslint-disable-next-line new-cap
    const c = new constraint({
      name: 'constraint',
      args: {
        maxLength: 5,
        format: 'email',
        minLength: 100
      }
    })

    c.visitArgumentDefinition({ name: 'primaryEmail' }, details)

    expect.assertions(1)
    expect(
      details.field.resolve(null, { primaryEmail: 'test@test.com' })
    ).rejects.toEqual(
      Error(
        "Constraints violated at argument 'primaryEmail':\n" +
          '- Maximal length allowed is 5 (failed constraint maxLength)\n' +
          '- Minimal length allowed is 100 (failed constraint minLength)'
      )
    )
  })

  it('testing format2fun', () => {
    expect(format2fun.email('test@test.com')).toEqual(true)
    expect(format2fun.email('testtest.com')).toEqual(false)
  })

  it('testing verifiers', () => {
    const allVerifiers = mergeValidators(
      stringValidators,
      numericValidators,
      formatValidator(format2fun)
    )
    expect(allVerifiers.fun.contains('@')('test@test.com')).toEqual(true)
    expect(allVerifiers.fun.contains('@')('testtest.com')).toEqual(false)
    expect(allVerifiers.msg.contains('@')).toEqual(`Must contain '@'`)
  })

  it('should provide its own schema in DSL', () => {
    const dsl = constraint.getSchemaDSL()
    expect(dsl).toMatch('directive @constraint')
  })

  it('should work when used properly in other graphql schema', () => {
    const withOtherSchema = `
      ${constraint.getSchemaDSL()}
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
      ${constraint.getSchemaDSL()}
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
