# praxis-kit-diagnostics-fr

French (`fr`) diagnostic messages for [Praxis Kit](https://github.com/slowebworkz/praxis-kit).

> **Draft.** The translation is machine-assisted and has **not** been reviewed by a native speaker.
> Expect wording to change. Terms are tracked in [`glossary.md`](./glossary.md).

Praxis Kit emits diagnostic _facts_ (a code and the values involved), not prose.
[`praxis-kit-diagnostics`](https://github.com/slowebworkz/praxis-kit/tree/main/packages/diagnostics)
turns them into text from a catalog. This package is a catalog for French.

## Use

```sh
npm install praxis-kit-diagnostics praxis-kit-diagnostics-fr
```

```ts
import { createMessageResolver } from 'praxis-kit-diagnostics'
import fr from 'praxis-kit-diagnostics-fr'

const resolveMessage = createMessageResolver(fr)
```

English is not bundled. To fall back to English for anything this pack does not cover, opt in:

```ts
import en from 'praxis-kit-diagnostics/en'

createMessageResolver(fr, { fallback: en })
```

Without a fallback, an untranslated diagnostic prints as its code (`Warning HTML3004`).

**Coverage.** This pack translates every catalog-driven diagnostic in contract 1 (54 ids). A number
of Praxis Kit diagnostics are not catalog-driven yet and print as their code in every language.

## Developing

The pack depends only on the public `praxis-kit-diagnostics` package (its CLI, contract and schema).

```sh
npm install
npm run validate        # structure and 100% coverage of the contract
npm test                # renders every contract example; checks fallback and failure modes
npm run check:package   # packs the tarball and checks what would ship
```

The catalog is `catalog/fr.json`. `scripts/build-catalog.py` is the source it was generated from;
once the catalog is maintained by hand, edit the JSON directly and delete the script.

Until `praxis-kit-diagnostics@0.2.0` is published, install it from a tarball instead:
`npm install --no-save /path/to/praxis-kit-diagnostics-0.2.0.tgz`.

## Compatibility

The catalog declares the contract major it targets (`"contract": 1`); `peerDependencies` carries the
supported `praxis-kit-diagnostics` range. A pack for another contract major is ignored by the
resolver (and reported through `onIssue`) rather than throwing.

## License

MIT
