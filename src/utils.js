// api same as ramda
const map = fn => list => list.map(fn)
const filter = fn => list => list.filter(fn)
const values = obj => Object.keys(obj).map(key => obj[key])
const length = strOrArray => (strOrArray != null ? strOrArray.length : 0)
const isString = x => x != null && x.constructor === String

const compose = (...fnlist) => data =>
  [...fnlist, data].reduceRight((prev, fn) => fn(prev))

const mapObjIndexed = fn => obj => {
  //FIXME: sure, there is a better way to do this
  obj = obj['where'];
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
