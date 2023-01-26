let context = {}

module.exports = {
  get: (k) => { return context[k] },
  set: (k, v) => { context[k] = v },
  clear: () => { context = {} }
}