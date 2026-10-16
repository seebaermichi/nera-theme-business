// §S7 "Without plugins", the build part: with no plugin dependency, no vendor
// copies and no seam overrides the fixture builds (exit 0, a clean log — see
// build.test.js) and every seam renders nothing. The validate/check part
// follows with the stylesheet (validate.test.js).
import fs from 'fs'
import path from 'path'
import { describe, expect, inject, it } from 'vitest'
import { elementByClass, page, pages, tags } from './helpers/html.js'

const builds = inject('builds')
const build = builds.noplugins
const logOf = ({ build: b }) => `${b.stdout}\n${b.stderr}`.replace(/\x1b\[[0-9;]*m/g, '')
// The inner HTML of every `div` with `className`, as a list: each opening
// tag found, then elementByClass from there.
const divsByClass = (html, className) =>
    [...html.matchAll(new RegExp(`<div\\s[^>]*class="(?:[^"]*\\s)?${className}(?:\\s[^"]*)?"`, 'g'))].map((m) =>
        elementByClass(html.slice(m.index), 'div', className)
    )
const empty = (inner) => inner.replace(/<!--[\s\S]*?-->/g, '').trim() === ''

describe('Without plugins (build)', () => {
    it('builds every page with no plugin loaded', () => {
        expect(build.build.code, logOf(build)).toBe(0)
        expect(logOf(build)).not.toMatch(/Loaded npm plugin/)
        expect(fs.existsSync(path.join(build.site, 'theme', 'views', 'partials'))).toBe(false)
        expect(pages(build.public).map((p) => p.file)).toEqual(pages(builds.default.public).map((p) => p.file))
    })

    it('renders the nav-main and footer-extra seams as nothing on every page', () => {
        for (const { file, html } of pages(build.public)) {
            expect(empty(elementByClass(html, 'nav', 'site-header__nav')), file).toBe(true)
            const cols = divsByClass(elementByClass(html, 'footer', 'site-footer'), 'site-footer__col')
            expect(cols.length, file).toBe(3)
            expect(empty(cols[2]), file).toBe(true)
        }
    })

    it('renders head-extra and scripts-extra as nothing: no script, no extra link', () => {
        for (const { file, html } of pages(build.public)) {
            expect(tags(html, 'script'), file).toEqual([])
            expect(tags(html, 'link').length, file).toBe(1)
            expect(html, file).toMatch(/<\/footer>\s*<\/body>/)
        }
    })

    it('renders hero-media, card-media and contact-form as empty wrappers', () => {
        const home = divsByClass(page(build.public, 'index.html'), 'hero__media')
        expect(home.length).toBe(1)
        expect(empty(home[0])).toBe(true)

        const cards = divsByClass(page(build.public, path.join('projects', 'index.html')), 'card__media')
        expect(cards.length).toBeGreaterThan(1)
        for (const inner of cards) expect(empty(inner)).toBe(true)

        for (const file of ['contact.html', path.join('de', 'kontakt.html')]) {
            const forms = divsByClass(page(build.public, file), 'contact__form')
            expect(forms.length, file).toBe(1)
            expect(empty(forms[0]), file).toBe(true)
        }
    })

    it('renders no plugin markup anywhere', () => {
        for (const { file, html } of pages(build.public)) {
            expect(html, file).not.toMatch(/<picture|<form|class="contact-form|class="social-media|class="nav-/)
        }
    })
})
