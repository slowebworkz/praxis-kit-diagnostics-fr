// Makes `praxis-kit-diagnostics` available for CI before it is published to npm.
//
//   node scripts/provide-diagnostics.mjs <version-or-tag>     e.g. 0.2.0 or latest
//
// 1. If the registry has that version, install it (the normal, post-release path).
// 2. Otherwise build the package from the public monorepo source, stamp it with the version the
//    pack's peer range needs, pack a tarball and install that. Nothing is published anywhere.
//
// Either way the chosen install spec is appended to $GITHUB_ENV as PRAXIS_DIAGNOSTICS so later
// steps (`npm run check:package`) use the same one. Remove step 2 once 0.2.0 is on npm.
import { execFileSync } from 'node:child_process'
import { appendFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const spec = process.argv[2] ?? 'latest'
const ref = process.env.PRAXIS_KIT_REF ?? 'feat/language-pack-contract' // until the contract is merged to develop
const repo = process.env.PRAXIS_KIT_REPO ?? 'https://github.com/slowebworkz/praxis-kit.git'
const stamp = /^\d+\.\d+\.\d+/.test(spec) ? spec : '0.2.0'

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })
const exported = (value) => {
  console.log(`PRAXIS_DIAGNOSTICS=${value}`)
  if (process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, `PRAXIS_DIAGNOSTICS=${value}\n`)
}

let onRegistry = true
try {
  // Quiet on purpose: a 404 here is the expected "not published yet" answer, not an error.
  execFileSync('npm', ['view', `praxis-kit-diagnostics@${spec}`, 'version'], { stdio: 'ignore' })
} catch {
  onRegistry = false
}

if (onRegistry) {
  run('npm', ['install', '--no-save', '--no-audit', '--no-fund', `praxis-kit-diagnostics@${spec}`], process.cwd())
  exported(`praxis-kit-diagnostics@${spec}`)
} else {
  console.log(`praxis-kit-diagnostics@${spec} is not on npm; building ${repo}#${ref} (stamped ${stamp}) …`)
  const work = mkdtempSync(join(tmpdir(), 'praxis-kit-src-'))
  const src = join(work, 'praxis-kit')
  run('git', ['clone', '--depth', '1', '--branch', ref, repo, src])
  run('corepack', ['enable'], src)
  run('pnpm', ['install', '--frozen-lockfile', '--filter', 'praxis-kit-diagnostics...'], src)
  const pkgDir = join(src, 'packages', 'diagnostics')
  run('pnpm', ['build'], pkgDir)

  // Pack from a copy so the monorepo checkout is untouched and the version can be stamped.
  const staged = join(work, 'stage')
  run('mkdir', ['-p', staged])
  for (const entry of ['dist', 'package.json', 'LICENSE', 'README.md']) run('cp', ['-R', join(pkgDir, entry), staged])
  const pkg = JSON.parse(readFileSync(join(staged, 'package.json'), 'utf8'))
  pkg.version = stamp
  delete pkg.devDependencies
  delete pkg.scripts
  writeFileSync(join(staged, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`)
  const packed = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', work], staged))[0]
  const tarball = join(work, packed.filename)
  run('npm', ['install', '--no-save', '--no-audit', '--no-fund', tarball], process.cwd())
  exported(tarball)
}
