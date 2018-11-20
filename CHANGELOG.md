# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="2.0.1"></a>
## [2.0.1](https://github.com/vsimko/node-graphql-constraint-lambda/compare/v2.0.0...v2.0.1) (2018-11-20)



<a name="2.0.0"></a>
# [2.0.0](https://github.com/vsimko/node-graphql-constraint-lambda/compare/v1.0.0...v2.0.0) (2018-11-20)


### Features

* validators and messages can be changed by user ([d910823](https://github.com/vsimko/node-graphql-constraint-lambda/commit/d910823))
* we now use callbacks for validation and error messages ([ec1c192](https://github.com/vsimko/node-graphql-constraint-lambda/commit/ec1c192))


### BREAKING CHANGES

* new functions are exported in `src/validators.js`
* validators are refactored into separate file



<a name="1.0.0"></a>
# [1.0.0](https://github.com/vsimko/node-graphql-constraint-lambda/compare/v0.3.0...v1.0.0) (2018-11-19)


### Chores

* wrap constraint directive class in `module.exports` ([71a2ac9](https://github.com/vsimko/node-graphql-constraint-lambda/commit/71a2ac9))


### BREAKING CHANGES

* the constraint directive is now wrapped  in
`module.exports` as `{constraint}` instead of just returning the
whole class.



<a name="0.3.0"></a>
# [0.3.0](https://github.com/vsimko/node-graphql-constraint-lambda/compare/v0.2.2...v0.3.0) (2018-11-13)


### Features

* add getSchemaDSL method ([c66917c](https://github.com/vsimko/node-graphql-constraint-lambda/commit/c66917c))



<a name="0.2.2"></a>
## [0.2.2](https://github.com/vsimko/node-graphql-constraint-lambda/compare/v0.2.1...v0.2.2) (2018-11-13)



<a name="0.2.1"></a>
## 0.2.1 (2018-11-13)


### Bug Fixes

* primary entry point `main` in packate.json ([97c872b](https://github.com/vsimko/node-graphql-constraint-lambda/commit/97c872b))



<a name="0.1.1"></a>
## 0.1.1 (2018-06-20)
