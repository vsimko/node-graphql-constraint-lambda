const { mapObjIndexed, compose, map, filter, values } = require('./utils')
const { SchemaDirectiveVisitor } = require('graphql-tools')
const {
  defaultValidationCallback,
  defaultErrorMessageCallback
} = require('./validators')

const {
  DirectiveLocation,
  GraphQLDirective,
  GraphQLInt,
  GraphQLFloat,
  GraphQLString,
  GraphQLSchema,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  printSchema
} = require('graphql')

const prepareConstraintDirective = (validationCallback, errorMessageCallback) =>
  class extends SchemaDirectiveVisitor {
    /**
     * When using e.g. graphql-yoga, we need to include schema of this directive
     * into our SDL, otherwise the graphql schema validator would report errors.
     */
    static getSDL () {
      const constraintDirective = this.getDirectiveDeclaration('constraint')
      const schema = new GraphQLSchema({
        directives: [constraintDirective]
      })
      return printSchema(schema)
    }

    static getDirectiveDeclaration (directiveName, schema) {
      const constraintsWhereInput = new GraphQLNonNull(
        new GraphQLInputObjectType({
          name: 'constraintsWhereInput',
          fields: () => ({
            /* Strings */
            AND: { type: new GraphQLList(constraintsWhereInput) },
            OR: { type: new GraphQLList(constraintsWhereInput) },
            NOT: { type: new GraphQLList(constraintsWhereInput) },
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
            exclusiveMin: { type: GraphQLFloat },
            exclusiveMax: { type: GraphQLFloat },
            notEqual: { type: GraphQLFloat }
          })
        })
      )

      return new GraphQLDirective({
        name: directiveName,
        locations: [DirectiveLocation.ARGUMENT_DEFINITION],
        args: {
          where: { type: constraintsWhereInput }
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

        const validate = compose(
          map(errorMessageCallback),
          filter(x => !x.result), // keep only failed validation results
          values,
          mapObjIndexed((cVal, cName) =>
            validationCallback({ argName, cName, cVal, data: valueToValidate })
          )
        )

        const errors = validate(this.args)
        if (errors && errors.length > 0) throw new Error(errors)

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
