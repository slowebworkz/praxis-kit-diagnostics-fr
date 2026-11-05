// Packs the tarball and checks what would ship: only the intended files, no English catalog,
// no dependencies, and an installable, importable artifact in an isolated directory.
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
const assert = (ok, message) => {
  if (!ok) throw new Error(`check:package: ${message}`)
}

const work = mkdtempSync(join(tmpdir(), 'pk-diagnostics-fr-'))
try {
  const packed = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', work], process.cwd()))[0]
  const files = packed.files.map((f) => f.path).sort()
  const expected = ['LICENSE', 'README.md', 'catalog/fr.json', 'glossary.md', 'index.d.ts', 'index.js', 'package.json'].sort()
  assert(JSON.stringify(files) === JSON.stringify(expected), `unexpected tarball files:\n${files.join('\n')}`)
  assert(!files.some((f) => /en\.json|\/en\./.test(f)), 'the tarball contains an English catalog')

  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  assert(pkg.dependencies === undefined, 'a runtime dependency was added; the pack must have none')
  assert(pkg.peerDependencies?.['praxis-kit-diagnostics'], 'missing peerDependency on praxis-kit-diagnostics')

  // The catalog must not smuggle English prose: spot-check a few phrases from the English catalog.
  const text = readFileSync('catalog/fr.json', 'utf8')
  for (const phrase of ['already has implicit', 'is not a valid direct child', 'has no accessible name']) {
    assert(!text.includes(phrase), `the catalog contains English text: "${phrase}"`)
  }

  // Install the tarball into an empty directory with the peer, and import it.
  const fixture = join(work, 'fixture')
  mkdirSync(fixture)
  run('npm', ['init', '-y'], fixture)
  const peer = process.env.PRAXIS_DIAGNOSTICS ?? 'praxis-kit-diagnostics@^0.2.0'
  run('npm', ['install', '--no-audit', '--no-fund', peer, join(work, packed.filename)], fixture)
  writeFileSync(
    join(fixture, 'check.mjs'),
    `import { createMessageResolver } from 'praxis-kit-diagnostics'
import fr from 'praxis-kit-diagnostics-fr'
const t = createMessageResolver(fr)({ code: 'HTML3003', context: { tag: 'nav', implicitRole: 'navigation' } })
if (!t.message.includes('rôle implicite')) throw new Error('not French: ' + t.message)
console.log(t.message)
`,
  )
  console.log(run('node', ['check.mjs'], fixture).trim())
  console.log(`check:package: ok (${files.length} files)`)
} finally {
  rmSync(work, { recursive: true, force: true })
}
