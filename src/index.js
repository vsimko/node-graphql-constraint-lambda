const { SchemaDirectiveVisitor } = require('graphql-tools')
const { defaultValidators } = require('./validators')
const {
  mapObjIndexed,
  map,
  compose,
  values,
  filter,
  unless,
  isEmpty
} = require('ramda')

const {
  DirectiveLocation,
  GraphQLDirective,
  GraphQLInt,
  GraphQLFloat,
  GraphQLString,
  GraphQLSchema,
  printSchema
} = require('graphql')

/**
 * Maps a list of functions to a tuple of values (usually just a single value)
 * Currently, the only validator that utilized more than one value is `differsFrom`
 * Note: `fnlist` parameter is here for better readability. We could have curried it.
 */
const validateValue = fnlist => (...args) => map(fn => fn(...args), fnlist)

/** Converts directive arguments into validator with partially applied first parameter */
const mapValidatorsFromArgs = mapOfValidators =>
  mapObjIndexed((v, k) => mapOfValidators[k](v))

/**
 * Pure function that creates error message for each failed validation result.
 * @example
 * results = {
 *  maxLength: true, // ok - fill be filtered out
 *  minLength: false // failed - will be transformed into a message string
 * }
 */
const resultsToErrorMessages = (constraintArgs, msgFunMap) =>
  compose(
    values,
    mapObjIndexed((msg, key) => `${msg} (failed constraint ${key})`), // TODO: allows translation
    mapObjIndexed((_, key) => msgFunMap[key](constraintArgs[key])),
    filter(x => !x) // keep only failed validation results
  )

/**
 * Pure function that formats multiple error messages into a single string.
 */
const formatJoinedMessage = argname =>
  unless(isEmpty, errors =>
    [
      `Constraints violated at argument '${argname}':`, // TODO: allows translation
      ...map(x => `- ${x}`, errors)
    ].join('\n')
  )

/**
 * Throws and Error if there are some error messages.
 * Note: We know that a code that throws exceptions is bad.
 * However, the `SchemaVisitor` class works this way.
 * We at least isolated such code into a single function.
 */
const throwOnErrors = unless(isEmpty, joinedMsg => {
  throw Error(joinedMsg)
})

const prepareConstraintDirective = allValidators =>
  class extends SchemaDirectiveVisitor {
    /**
     * When using e.g. graphql-yoga, we need to include schema of this directive
     * into our DSL, otherwise the graphql schema validator would report errors.
     */
    static getSchemaDSL () {
      const constraintDirective = this.getDirectiveDeclaration('constraint')
      const schema = new GraphQLSchema({
        directives: [constraintDirective]
      })
      return printSchema(schema)
    }

    static getDirectiveDeclaration (directiveName, schema) {
      return new GraphQLDirective({
        name: directiveName,
        locations: [DirectiveLocation.ARGUMENT_DEFINITION],
        args: {
          /* Strings */
          minLength: { type: GraphQLInt },
          maxLength: { type: GraphQLInt },
          startsWith: { type: GraphQLString },
          endsWith: { type: GraphQLString },
          contains: { type: GraphQLString },
          notContains: { type: GraphQLString },
          pattern: { type: GraphQLString },
          format: { type: GraphQLString },
          differsFrom: { type: GraphQLString },

          /* Numbers (Int/Float) */
          min: { type: GraphQLFloat },
          max: { type: GraphQLFloat },
          notEqual: { type: GraphQLFloat }
        }
      })
    }

    /**
     * @param {GraphQLArgument} argument
     * @param {{field:GraphQLField<any, any>, objectType:GraphQLObjectType | GraphQLInterfaceType}} details
     */
    visitArgumentDefinition (argument, details) {
      /**
       * Creates a `validate` function based on directive arguments that the developer
       * specified in the graphql schema.
       * Example: `age: Int! @constraint(min:0 max:100)` produces a `validate` function
       * that checks numerical value of the `age` graphql parameter using
       * the `min` and the max` constraint, but no ther constraints.
       */
      const prepareValidateFn = compose(
        validateValue,
        mapValidatorsFromArgs(allValidators.fun)
      )

      // validation pipeline that throws errors at the end
      // errors from multiple validators are collected
      const validateAndThrowErrors = compose(
        throwOnErrors,
        formatJoinedMessage(argument.name),
        resultsToErrorMessages(this.args, allValidators.msg),
        prepareValidateFn(this.args)
      )

      // preparing the resolver
      const originalResolver = details.field.resolve
      details.field.resolve = async (...resolveArgs) => {
        const args = resolveArgs[1] // (parent, args, context, info)
        const valueToValidate = args[argument.name]

        validateAndThrowErrors(valueToValidate, args)

        return originalResolver.apply(this, resolveArgs)
      }
    }
  }

module.exports = {
  constraint: prepareConstraintDirective(defaultValidators),
  prepareConstraintDirective
}
