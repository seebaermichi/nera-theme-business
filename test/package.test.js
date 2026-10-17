// §S7 "Package": the tarball and the package.json fields of §S2.1 / §S3.5.
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'
import { describe, expect, it } from 'vitest'
import { PLUGIN_CLASSES } from './helpers/contract.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'))

// §S3.5 peers at the floors of §S8's carry-forward (plan D5), from the one
// place the contract keeps them.
const PEERS = Object.fromEntries(Object.entries(PLUGIN_CLASSES).map(([name, { range }]) => [name, range]))

describe('Package', () => {
    it('npm pack lists only package.json, README.md, LICENSE and files under views/, assets/, config/', () => {
        // npm ≤ 11 prints an array of reports, npm 12 an object keyed by
        // package name (the publish workflow installs npm@latest).
        const reports = JSON.parse(
            execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
                cwd: ROOT,
                encoding: 'utf-8',
                stdio: ['ignore', 'pipe', 'ignore'],
            })
        )
        const [report] = Array.isArray(reports) ? reports : Object.values(reports)
        const files = report.files.map((file) => file.path).sort()

        expect(files).toContain('package.json')
        expect(files).toContain('README.md')
        expect(files).toContain('LICENSE')
        for (const file of files) {
            expect(file).toMatch(/^(package\.json|README\.md|LICENSE|(views|assets|config)\/.+)$/)
            expect(file.startsWith('views/vendor/')).toBe(false)
            expect(file.endsWith('.js')).toBe(false)
        }
    })

    it('has the fields of §S2.1 with the exact values', () => {
        expect(pkg.name).toBe('@nera-static/theme-business')
        // The version is the newest CHANGELOG entry, so a release that forgets
        // one of the two fails here.
        const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf-8')
        expect(pkg.version).toBe(changelog.match(/^## \[(\d+\.\d+\.\d+)\]/m)[1])
        expect(pkg.type).toBe('module')
        expect(pkg.license).toBe('MIT')
        expect(pkg.description).toBe(
            'Nera theme for small-business, organisation and portfolio sites — presentation only.'
        )
        expect(pkg.keywords).toEqual(['nera', 'nera-theme'])
        expect(pkg.files).toEqual(['views', 'assets', 'config'])
        expect(pkg.exports).toEqual({ './package.json': './package.json' })
        expect(pkg.engines).toEqual({ node: '>=22.12.0' })
        expect(pkg.nera).toEqual({ generator: '>=4.15.0' })
        expect(pkg.publishConfig).toEqual({ access: 'public' })
        expect(pkg.repository).toEqual({
            type: 'git',
            url: 'git+https://github.com/seebaermichi/nera-theme-business.git',
        })
        expect(pkg.bugs.url).toBe('https://github.com/seebaermichi/nera-theme-business/issues')
        expect(pkg.homepage).toBe('https://github.com/seebaermichi/nera-theme-business#readme')
        expect(pkg.dependencies).toBeUndefined()
        expect(pkg.bin).toBeUndefined()
        expect(pkg.main).toBeUndefined()
    })

    it('declares every plugin of §S3.5 as an optional peer at the decided range', () => {
        expect(PEERS).toEqual({
            '@nera-static/plugin-contact-form': '^1.1.1',
            '@nera-static/plugin-images': '^1.0.2',
            '@nera-static/plugin-navigation': '^3.1.0',
            '@nera-static/plugin-social-media-links': '^2.3.0',
        })
        expect(pkg.peerDependencies).toEqual(PEERS)
        expect(Object.keys(pkg.peerDependenciesMeta).sort()).toEqual(Object.keys(PEERS).sort())
        for (const meta of Object.values(pkg.peerDependenciesMeta)) {
            expect(meta).toEqual({ optional: true })
        }
    })

    it('installs the peers as devDependencies at the same ranges, next to the CLI', () => {
        for (const [name, range] of Object.entries(PEERS)) {
            expect(pkg.devDependencies[name]).toBe(range)
        }
        expect(pkg.devDependencies['@nera-static/nera']).toBe('^1.12.0')
    })

    it('is in the form npm pkg fix writes', () => {
        const before = fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'theme-business-pkg-fix-'))
        try {
            fs.writeFileSync(path.join(tmp, 'package.json'), before)
            execFileSync('npm', ['pkg', 'fix'], { cwd: tmp, stdio: 'ignore' })
            const after = fs.readFileSync(path.join(tmp, 'package.json'), 'utf-8')
            expect(JSON.parse(after)).toEqual(JSON.parse(before))
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true })
        }
    })
})
