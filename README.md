# gettext-to-messageformat

Converts gettext input (po/pot/mo files) into [messageformat]-compatible JSON,
using [gettext-parser].


#### Installation

```sh
npm install --save gettext-to-messageformat
```
or
```sh
yarn add gettext-to-messageformat
```

If using in an environment that does not natively support ES6 features such as
object destructuring and arrow functions, you'll want to use a transpiler for this.


#### Usage

```js
const { parsePo, parseMo } = require('gettext-to-messageformat')
const json = parsePo(`
# Examples from http://pology.nedohodnik.net/doc/user/en_US/ch-poformat.html
# Note that the given plural-form is incomplete
msgid ""
msgstr ""
"Content-Type: text/plain; charset=UTF-8\n"
"Language: pl\n"
"Plural-Forms: nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);\n"

msgid "Time: %1 second"
msgid_plural "Time: %1 seconds"
msgstr[0] "Czas: %1 sekunda"
msgstr[1] "Czas: %1 sekundy"
msgstr[2] "Czas: %1 sekund"

msgid "%1 took %2 ms to complete."
msgstr "Trebalo je %2 ms da se %1 završi."

msgid "%s took %d ms to complete."
msgstr "Trebalo je %2$d ms da se %1$s završi."

msgid "No star named %(starname)s found."
msgstr "Nema zvezde po imenu %(starname)s."
`)

const MessageFormat = require('messageformat')
const mf = new MessageFormat('pl')
const messages = mf.compile(json)

messages['Time: %1 second']([1])
// 'Czas: 1 sekunda'

messages['%s took %d ms to complete.'](['TASK', 42])
// 'Trebalo je 42 ms da se TASK završi.'

messages['No star named %(starname)s found.']({ starname: 'Chi Draconis' })
// 'Nema zvezde po imenu Chi Draconis.'
```

For more examples, [gettext-parser] includes a selection of `.po` and `.mo` files
in its test fixtures.


#### `parseMo(input, options)` and `parsePo(input, options)`

The two functions differ only in their expectation of the input's format. `input`
may be a string or a Buffer; `options` is an optional set of configuration for
the parser, including the following fields:

- `defaultCharset` (string, default `null`) – For Buffer input only, sets the
  default charset -- otherwise UTF-8 is assumed

- `forceContext` (boolean, default `false`) – If any of the gettext messages
  define a `msgctxt`, that is used as a top-level key in the output, and all
  messages without a context are included under the `''` empty string context.
  If no context is set, by default this top-level key is not included unless
  `forceContext` is set to `true`.

- `pluralCategories` (array of strings) – If the Language header is not set in
  the input, or if its Plural-Forms `nplurals` value is not 1, 2, or 6, this
  needs to be set to the pluralization category names to be used for the input
  enumerated categories if any message includes a plural form.

For more options, take a look at the [source](./index.js).


[messageformat]: https://messageformat.github.io/
[gettext-parser]: https://github.com/smhg/gettext-parser
