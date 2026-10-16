// §S7 "Subdirectory deploy": with `base_path: /sub` every theme link and
// stylesheet in the output starts with /sub/.
import { describe, expect, inject, it } from 'vitest'
import { attr, elementByClass, pages, tags } from './helpers/html.js'

const builds = inject('builds')
const external = /^(https?:|mailto:|tel:|#)/

describe('Subdirectory deploy', () => {
    it('prefixes every root-absolute href, src and srcset with /sub/', () => {
        let count = 0
        for (const { file, html } of pages(builds.sub.public)) {
            for (const [, , url] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
                if (external.test(url)) continue
                count++
                expect(url, `${file}: ${url}`).toMatch(/^\/sub\//)
            }
            for (const [, set] of html.matchAll(/\ssrcset="([^"]*)"/g)) {
                for (const part of set.split(',')) expect(part.trim(), file).toMatch(/^\/sub\//)
            }
        }
        expect(count).toBeGreaterThan(200)
    })

    it('links the theme\'s stylesheet and the theme\'s own links under /sub/', () => {
        for (const { file, html } of pages(builds.sub.public)) {
            const stylesheets = tags(html, 'link').filter((a) => attr(a, 'rel') === 'stylesheet').map((a) => attr(a, 'href'))
            expect(stylesheets[0], file).toBe('/sub/css/theme.css')
            const brand = tags(html, 'a').find((a) => /site-header__brand/.test(a))
            expect(attr(brand, 'href'), file).toMatch(/^\/sub\/(de\/)?index\.html$/)
            const legal = elementByClass(html, 'nav', 'site-footer__legal')
            const legalHrefs = tags(legal, 'a').map((a) => attr(a, 'href'))
            expect(legalHrefs.length, file).toBe(2)
            for (const href of legalHrefs) expect(href, file).toMatch(/^\/sub\//)
            for (const a of tags(elementByClass(html, 'ul', 'lang-switch__list') || '', 'a')) expect(attr(a, 'href'), file).toMatch(/^\/sub\//)
        }
    })
})
