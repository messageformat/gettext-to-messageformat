const { mo, po } = require('gettext-parser')
const pluralCategories = require('make-plural/umd/pluralCategories')

const defaultOptions = {
  defaultCharset: null,
  forceContext: false,
  pluralCategories: null,
  pluralVariablePattern: /%(?:\((\w+)\))?\w/,
  replacements: [
    {
      pattern: /[\\{}#]/g,
      replacement: '\\$&'
    },
    {
      pattern: /%(\d+)(?:\$\w)?/g,
      replacement: (_, n) => `{${n - 1}}`
    },
    {
      pattern: /%\((\w+)\)\w/g,
      replacement: '{$1}'
    },
    {
      pattern: /%\w/g,
      replacement: function () { return `{${this.n++}}` },
      state: { n: 0 }
    },
    {
      pattern: /%%/g,
      replacement: '%'
    }
  ]
}

const getPluralCategories = ({ language, 'plural-forms': pluralForms }) => {
  if (language) {
    const pc = pluralCategories[language.replace(/[-_].*/, '')]
    if (pc) return pc.cardinal
  }
  const m = pluralForms && pluralForms.match(/^nplurals=(\d);/)
  switch (m && m[1]) {
    case '1': return ['other']
    case '2': return ['one', 'other']
    case '6': return ['zero', 'one', 'two', 'few', 'many', 'other']
    default: return null
  }
}

const getMessageFormat = (
  { pluralCategories, pluralVariablePattern, replacements },
  { msgid, msgid_plural, msgstr }
) => {
  if (!msgid || !msgstr) return null
  if (!msgstr[0]) msgstr[0] = msgid
  if (msgid_plural) {
    if (!pluralCategories) throw new Error('Plural categories not identified')
    for (let i = 1; i < pluralCategories.length; ++i) {
      if (!msgstr[i]) msgstr[i] = msgid_plural
    }
  }
  msgstr = msgstr.map(str => (
    replacements.reduce((str, { pattern, replacement, state }) => {
      if (state) replacement = replacement.bind(Object.assign({}, state))
      return str.replace(pattern, replacement)
    }, str)
  ))
  if (msgid_plural) {
    const m = msgid_plural.match(pluralVariablePattern)
    const pv = m && m[1] || '0'
    const pc = pluralCategories.map((c, i) => `${c}{${msgstr[i]}}`)
    return `{${pv}, plural, ${pc.join(' ')}}`
  }
  return msgstr[0]
}

const convert = (parse, input, options) => {
  options = Object.assign(defaultOptions, options)
  const { headers, translations } = parse(input, options.defaultCharset)
  if (!options.pluralCategories) options.pluralCategories = getPluralCategories(headers)
  let hasContext = false
  for (const context in translations) {
    if (context) hasContext = true
    const data = translations[context]
    for (const id in data) {
      const mf = getMessageFormat(options, data[id])
      if (mf) data[id] = mf
      else delete data[id]
    }
  }
  return hasContext || options.forceContext ? translations : translations['']
}

module.exports = {
  parseMo: (input, options) => convert(mo.parse, input, options),
  parsePo: (input, options) => convert(po.parse, input, options)
}
