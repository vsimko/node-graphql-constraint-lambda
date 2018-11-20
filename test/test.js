const { makeExecutableSchema } = require('graphql-tools')
const { GraphQLSchema } = require('graphql')

const { constraint, prepareConstraintDirective } = require('../src/index')
const {
  format2fun,
  defaultValidators,
  defaultValidationCallback,
  defaultErrorMessageCallback
} = require('../src/validators')

describe('@constraint directive usage', () => {
  it('customization of messages', async () => {
    // this is just an example showing that it works, it can be implemented better
    const customizedMessageCallback = input => {
      if (input.argName === 'primaryEmail') return 'Wrong primary email'
      else return defaultErrorMessageCallback(input)
    }

    const MyConstraintClass = prepareConstraintDirective(
      defaultValidationCallback,
      customizedMessageCallback
    )

    const cInst = new MyConstraintClass({ args: { format: 'email' } })

    const details = { field: {} }

    cInst.visitArgumentDefinition({ name: 'primaryEmail' }, details)
    await expect(
      details.field.resolve(null, { primaryEmail: 'some_wrong_email' })
    ).rejects.toEqual(Error([`Wrong primary email`]))

    cInst.visitArgumentDefinition({ name: 'secondaryEmail' }, details)
    await expect(
      details.field.resolve(null, { secondaryEmail: 'some_wrong_email' })
    ).rejects.toEqual(
      Error([`Constriant 'format:email' violated in field 'secondaryEmail'`])
    )
  })

  it('constraint violations should be reported', async () => {
    // eslint-disable-next-line new-cap
    const cInst = new constraint({
      args: {
        maxLength: 5,
        format: 'email',
        minLength: 100
      }
    })

    const details = { field: {} }
    cInst.visitArgumentDefinition({ name: 'primaryEmail' }, details)

    await expect(
      details.field.resolve(null, { primaryEmail: 'test@test.com' })
    ).rejects.toEqual(
      Error([
        `Constriant 'maxLength:5' violated in field 'primaryEmail'`,
        `Constriant 'minLength:100' violated in field 'primaryEmail'`
      ])
    )
  })

  it('testing format2fun', () => {
    expect(format2fun.email('test@test.com')).toEqual(true)
    expect(format2fun.email('testtest.com')).toEqual(false)
  })

  it('testing validators', () => {
    expect(defaultValidators.contains('@')('test@test.com')).toEqual(true)
    expect(defaultValidators.contains('@')('testtest.com')).toEqual(false)
  })
})

describe('@constraint directive class', () => {
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
