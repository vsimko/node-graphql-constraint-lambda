// @ts-check

/** api same as ramda */
const map = fn => list => list.map(fn)

/** api same as ramda */
const filter = fn => list => list.filter(fn)

/** api same as ramda */
const values = obj => Object.keys(obj).map(key => obj[key])

/** api same as ramda */
const length = strOrArray => (strOrArray != null ? strOrArray.length : 0)

/** api same as ramda */
const isString = x => x != null && x.constructor === String

/** api same as ramda */
const compose = (...fnlist) => data =>
  [...fnlist, data].reduceRight((prev, fn) => fn(prev))

/** api same as ramda */
const mapObjIndexed = fn => obj => {
  const acc = {}
  Object.keys(obj).forEach(key => (acc[key] = fn(obj[key], key, obj)))
  return acc
}

module.exports = {
  mapObjIndexed,
  compose,
  map,
  filter,
  values,
  isString,
  length
}
