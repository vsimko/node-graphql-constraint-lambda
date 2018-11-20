const { SchemaDirectiveVisitor } = require('graphql-tools')
const {
  defaultValidationCallback,
  defaultErrorMessageCallback
} = require('./validators')
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

const prepareConstraintDirective = (validationCallback, errorMessageCallback) =>
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
      // preparing the resolver
      const originalResolver = details.field.resolve
      details.field.resolve = async (...resolveArgs) => {
        const argName = argument.name
        const args = resolveArgs[1] // (parent, args, context, info)
        const valueToValidate = args[argName]

        const validateAndThrowErrors = compose(
          unless(isEmpty, errors => {
            throw Error(errors)
          }),
          map(errorMessageCallback),
          filter(x => !x.result), // keep only failed validation results
          values,
          mapObjIndexed((cVal, cName) =>
            validationCallback({ argName, cName, cVal, data: valueToValidate })
          )
        )

        validateAndThrowErrors(this.args)

        return originalResolver.apply(this, resolveArgs)
      }
    }
  }

module.exports = {
  constraint: prepareConstraintDirective(
    defaultValidationCallback,
    defaultErrorMessageCallback
  ),
  prepareConstraintDirective,
  ...require('./validators')
}
