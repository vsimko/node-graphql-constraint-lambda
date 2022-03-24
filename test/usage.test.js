const { constraint, prepareConstraintDirective } = require('../src/index')
const {
  format2fun,
  defaultValidators,
  defaultValidationCallback,
  defaultErrorMessageCallback
} = require('../src/validators')

describe('constraint directive usage', () => {
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
      Error([`Constraint 'format:email' violated in field 'secondaryEmail'`])
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
        `Constraint 'maxLength:5' violated in field 'primaryEmail'`,
        `Constraint 'minLength:100' violated in field 'primaryEmail'`
      ])
    )
  })
})

describe('nested logical operators', () => {
  it('TODO', async () => {
    // eslint-disable-next-line new-cap
    const cInst = new constraint({
      args: {
        OR: [
          { contains: "foo" },
          { contains: "bar" }
        ]
      }
    })

    const details = { field: {} }
    cInst.visitArgumentDefinition({ name: 'primaryEmail' }, details)
    await expect(
      details.field.resolve(null, { primaryEmail: 'test@test.com' })
    ).rejects.toEqual(
      Error([
        `Constraint 'maxLength:5' violated in field 'primaryEmail'`,
        `Constraint 'minLength:100' violated in field 'primaryEmail'`
      ])
    )
  })
})

describe('format2fun', () => {
  it('email', () => {
    expect(format2fun.email('test@test.com')).toEqual(true)
    expect(format2fun.email('testtest.com')).toEqual(false)
  })
})

describe('defaultValidators', () => {
  it('contains', () => {
    const { contains } = defaultValidators
    expect(contains('@')('test@test.com')).toEqual(true)
    expect(contains('@')('testtest.com')).toEqual(false)
  })
  it('startsWith', () => {
    const { startsWith } = defaultValidators
    expect(startsWith('b')('ab')).toEqual(false)
    expect(startsWith('a')('ab')).toEqual(true)
    expect(startsWith('')('')).toEqual(true)
    expect(startsWith('')('a')).toEqual(true)
    expect(startsWith('a')('')).toEqual(false)
  })

  it('endsWith', () => {
    const { endsWith } = defaultValidators
    expect(endsWith('b')('ab')).toEqual(true)
    expect(endsWith('a')('ab')).toEqual(false)
    expect(endsWith('')('')).toEqual(true)
    expect(endsWith('')('a')).toEqual(true)
    expect(endsWith('a')('')).toEqual(false)
  })

  it('minLength', () => {
    const { minLength } = defaultValidators
    expect(minLength(10)('ab')).toEqual(false)
    expect(minLength(2)('ab')).toEqual(true)
    expect(minLength(0)('ab')).toEqual(true)
    expect(minLength(0)('')).toEqual(true)
    expect(minLength(1)('')).toEqual(false)
  })
})
