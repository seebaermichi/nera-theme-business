// Builds of the fixture site (test/site) in temporary copies, shared by every
// test file through vitest's globalSetup (test/global-setup.js).
//
// A copy lives in `<tmp>/test/site`, next to symlinks to the repo's `views/`,
// `assets/`, `config/`, `package.json` and `node_modules/`, so the fixture's
// `theme: ../..` and its plugin lookups resolve exactly as in the repo, and
// `test/site/public/` is never touched.
import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawn } from 'child_process'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const SITE = path.join(ROOT, 'test', 'site')

const NERA = path.join(ROOT, 'node_modules', '@nera-static', 'nera', 'bin', 'nera.js')
const LINKED = ['views', 'assets', 'config', 'package.json', 'node_modules']
const NOT_COPIED = new Set(['public', '.nera-cache', 'node_modules'])

export const PLUGINS = [
    '@nera-static/plugin-contact-form',
    '@nera-static/plugin-images',
    '@nera-static/plugin-navigation',
    '@nera-static/plugin-social-media-links',
]

// Copy the fixture into a fresh temporary mirror of the repo; `mutate(site)`
// may change the copy before it is built. A repo entry that does not exist
// (yet) is not linked, as it would not be there for the build either.
export function makeSite(name, mutate) {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), `nera-theme-business-${name}-`))
    for (const entry of LINKED) {
        if (fs.existsSync(path.join(ROOT, entry))) fs.symlinkSync(path.join(ROOT, entry), path.join(base, entry))
    }
    const site = path.join(base, 'test', 'site')
    fs.cpSync(SITE, site, {
        recursive: true,
        filter: (src) => !NOT_COPIED.has(path.relative(SITE, src).split(path.sep)[0]),
    })
    if (mutate) mutate(site)
    return { base, site }
}

// Run the installed `nera` CLI in a site. Resolves with the exit code and
// both output streams; never rejects on a non-zero exit.
export function nera(site, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [NERA, ...args], {
            cwd: site,
            env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
        })
        let stdout = ''
        let stderr = ''
        child.stdout.on('data', (chunk) => (stdout += chunk))
        child.stderr.on('data', (chunk) => (stderr += chunk))
        child.on('error', reject)
        child.on('close', (code) => resolve({ code, stdout, stderr }))
    })
}

// The fixture variants of §S7, each built once per test run.
export const VARIANTS = {
    // The fixture as committed.
    default: null,
}

// Build one variant: copy, mutate, `nera build`, then `nera validate --json`
// and `nera check --json` on the result.
export async function buildVariant(name) {
    const { base, site } = makeSite(name, VARIANTS[name])
    const build = await nera(site, ['build'])
    const validate = await nera(site, ['validate', '--json'])
    const check = await nera(site, ['check', '--json'])
    return { name, base, site, public: path.join(site, 'public'), build, validate, check }
}

// The YAML parser core itself reads config with, resolved from core's own
// location (core depends on `yaml` directly), so the tests need no extra
// dependency and parse exactly as the build does.
const coreRequire = createRequire(createRequire(path.join(ROOT, 'package.json')).resolve('@nera-static/core'))
const YAML = coreRequire('yaml')

export const loadYaml = (file) => YAML.parse(fs.readFileSync(file, 'utf-8'))

// A page's frontmatter (core's options: YAML dates become Date objects).
export function frontmatter(file) {
    const match = /^---\n([\s\S]*?)\n---/.exec(fs.readFileSync(file, 'utf-8'))
    return match ? YAML.parse(match[1], { customTags: ['timestamp'] }) || {} : {}
}
