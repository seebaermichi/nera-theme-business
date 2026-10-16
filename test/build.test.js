// §S7 "Builds clean": `nera build` of the fixture exits 0, without a ⚠️ line,
// without `Views folder not found`, with one `HTML created:` line per page that
// has a layout. Every other build the tests make is held to the same log rules.
// Plus the §S6 setup the fixture relies on: the plugins resolve from the repo
// root's node_modules, and no scaffold-default view shadows the theme's.
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { describe, expect, inject, it } from 'vitest'
import { PLUGINS, ROOT, SITE, frontmatter } from './helpers/site.js'
import { listFiles } from './helpers/html.js'

const builds = inject('builds')
// core colours its success lines; strip the ANSI codes before reading the log
const logOf = ({ build }) => `${build.stdout}\n${build.stderr}`.replace(/\x1b\[[0-9;]*m/g, '')

describe('Builds clean', () => {
    it('exits 0', () => {
        expect(builds.default.build.code, logOf(builds.default)).toBe(0)
    })

    it('writes one "HTML created:" line per fixture page that has a layout, and nothing else', () => {
        const log = logOf(builds.default)
        const created = [...log.matchAll(/HTML created: (\S+)/g)].map((m) => m[1])
        const pagesDir = path.join(SITE, 'pages')
        const authored = listFiles(pagesDir, ['.md'])
            .filter((file) => frontmatter(path.join(pagesDir, file)).layout)
            .map((file) => `/${file.split(path.sep).join('/').replace(/\.md$/, '.html')}`)

        expect(authored.length).toBe(22)
        expect([...created].sort()).toEqual([...authored].sort())
        expect(listFiles(builds.default.public, ['.html']).length).toBe(created.length)
    })

    it('logs no ⚠️, no deprecation, no error and no "Views folder not found" in any build', () => {
        for (const build of Object.values(builds)) {
            const log = logOf(build)
            expect(build.build.code, build.name).toBe(0)
            expect(log, build.name).not.toMatch(/⚠️|❌|deprecat|Views folder not found|\bError\b|warn/i)
            expect(log, build.name).toMatch(/0 errors/)
        }
    })

    it('builds in temporary copies, never in test/site/', () => {
        for (const build of Object.values(builds)) expect(build.site.startsWith(SITE), build.name).toBe(false)
    })
})

describe('Fixture setup (§S6)', () => {
    it('loads every peer plugin, resolved from the repo root\'s node_modules', () => {
        const site = JSON.parse(fs.readFileSync(path.join(SITE, 'package.json'), 'utf-8'))
        const root = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'))
        const requireFromSite = createRequire(path.join(SITE, 'package.json'))
        const log = logOf(builds.default)

        expect(Object.keys(site.dependencies).sort()).toEqual(PLUGINS)
        expect(Object.keys(root.peerDependencies).sort()).toEqual(PLUGINS)
        // no install of its own (`nera dev`/`serve` in the fixture may leave node_modules/.vite)
        expect(fs.existsSync(path.join(SITE, 'node_modules', '@nera-static'))).toBe(false)
        for (const name of PLUGINS) {
            expect(site.dependencies[name], name).toBe(root.devDependencies[name])
            expect(requireFromSite.resolve(name).startsWith(path.join(ROOT, 'node_modules', name) + path.sep), name).toBe(true)
            expect(log, name).toContain(`Loaded npm plugin: ${name.replace('@nera-static/', '')}`)
        }
    })

    it('keeps theme/views/ for the vendor copies and seams, without the scaffold-default views', () => {
        const views = path.join(SITE, 'theme', 'views')
        expect(fs.existsSync(path.join(views, 'layouts'))).toBe(false)
        expect(fs.existsSync(path.join(views, 'pages'))).toBe(false)
        for (const file of listFiles(views, ['.pug'])) {
            expect(fs.readFileSync(path.join(views, file), 'utf-8'), file).not.toContain('nera:scaffold-default')
        }
        expect(listFiles(path.join(views, 'partials'), ['.pug'])).toEqual([
            'card-media.pug',
            'contact-form.pug',
            'footer-extra.pug',
            'hero-media.pug',
            'nav-main.pug',
        ])
    })

    it('keeps the vendor copies identical to the published templates of the installed plugins', () => {
        const vendor = path.join(SITE, 'theme', 'views', 'vendor')
        for (const name of PLUGINS) {
            const dir = path.join(vendor, name.replace('@nera-static/', ''))
            const published = path.join(ROOT, 'node_modules', name, 'views')
            const files = listFiles(dir, ['.pug'])
            expect(files.length, name).toBeGreaterThan(0)
            for (const file of files) {
                expect(fs.readFileSync(path.join(dir, file), 'utf-8'), `${name}/${file}`).toBe(fs.readFileSync(path.join(published, file), 'utf-8'))
            }
        }
        expect(fs.readFileSync(path.join(SITE, 'theme', 'assets', 'js', 'contact-form.js'), 'utf-8')).toBe(
            fs.readFileSync(path.join(ROOT, 'node_modules', '@nera-static', 'plugin-contact-form', 'views', 'contact-form.js'), 'utf-8')
        )
    })
})
