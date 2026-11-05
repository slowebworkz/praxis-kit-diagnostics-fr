import catalog from './catalog/fr.json' with { type: 'json' }

// The French catalog. Pass it to the resolver from `praxis-kit-diagnostics`:
//
//   createMessageResolver(fr)                       // French, then the printed code
//   createMessageResolver(fr, { fallback: en })     // French, then English, then the code
export default catalog
