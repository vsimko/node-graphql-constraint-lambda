const { mapObjIndexed, map, compose } = require('ramda')
const { SchemaDirectiveVisitor } = require('graphql-tools')

const {
  DirectiveLocation,
  GraphQLDirective,
  GraphQLInt,
  GraphQLFloat,
  GraphQLString,
  GraphQLSchema,
  printSchema
} = require('graphql')

const {
  isAfter, isBefore, isCreditCard, isUUID, isURL,
  isEmail, isBase64, isRFC3339, isIP, contains
} = require('validator')

const throwif = (condition, message) => {
  if (condition) throw Error(message)
}

const format2fun = {
  email: isEmail,
  base64: isBase64,
  date: isRFC3339,
  ipv4: x => isIP(x, 4),
  ipv6: x => isIP(x, 6),
  url: isURL,
  uuid: isUUID,
  futuredate: isAfter,
  pastdate: isBefore,
  creditcard: isCreditCard
}

const stringVerifiers = {
  minLength: min => strOrArray => throwif(strOrArray && strOrArray.length < min, `Minimal length allowed is ${min}`),
  maxLength: max => strOrArray => throwif(strOrArray && strOrArray.length > max, `Maximal length allowed is ${max}`),
  startsWith: prefix => str => throwif(str && !str.startsWith(prefix), `Must start with prefix: ${prefix}`),
  endsWith: suffix => str => throwif(str && !str.endsWith(suffix), `Argument must end with suffix: ${suffix}`),
  contains: substr => str => throwif(str && !contains(str, substr), `Must contain ${substr}`),
  notContains: substr => str => throwif(str && contains(str, substr), `Must not contain ${substr}`),
  pattern: pattern => str => throwif(str && !new RegExp(pattern).test(str), `Must match ${pattern}`),
  format: fmtName => str => throwif(str && !format2fun[fmtName](str), `Value does not matches the "${fmtName}" format`),
  differsFrom: argName => (value, queryArgs) => throwif(value === queryArgs[argName], `Values must differ (arg:${argName})`)
}

const numericVerifiers = {
  min: min => x => throwif(x < min, `Value too small`),
  max: max => x => throwif(x > max, `Value too big`),
  exclusiveMin: min => x => throwif(x <= min, `Value too small`),
  exclusiveMax: max => x => throwif(x >= max, `Value too big`),
  notEqual: neq => x => throwif(x === neq, `Value ${neq} not allowed`)
}

const allVerifiers = {
  ...stringVerifiers,
  ...numericVerifiers
}

/**
 * Converts directive arguments into verifiers with partially applied first parameter.
 * Example: @constraint(min:0)
 * This makes `min => x => f(x, min)` into `x => f(x,0)`
 */
const mapVerifiersFromArgs = mapObjIndexed((v, k) => allVerifiers[k](v))

/**
 * Maps a list of functions to a tuple of values (usually just a single value)
 * Currently, the only verifier that utilized more than one value is `differsFrom`
 * TODO: Find ramda function doing the same, perhaps. `ap`, `apply`...
 * */
const verifyValue = fnlist => (...args) => map(fn => fn(...args), fnlist)

const prepareVerifyFn = compose(
  verifyValue,
  mapVerifiersFromArgs
) // should be self-explanatory

module.exports = class extends SchemaDirectiveVisitor {
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
    const verify = prepareVerifyFn(this.args)
    const originalResolver = details.field.resolve

    details.field.resolve = async (...resolveArgs) => {
      const args = resolveArgs[1] // (parent, args, context, info)
      const valueToVerify = args[argument.name]

      try {
        verify(valueToVerify, args)
      } catch (e) {
        throw Error(`${e.message} (failed at argument '${argument.name}')`)
      }

      return originalResolver.apply(this, resolveArgs)
    }
  }
}
