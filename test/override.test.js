// §S7 "Per-file override": the fixture's theme/views/partials/footer-extra.pug
// appears in every page's footer, inside the theme's own footer.site-footer.
import { describe, expect, inject, it } from 'vitest'
import { elementByClass, pages } from './helpers/html.js'

const builds = inject('builds')
const MARKER = '<!-- fixture: footer-extra override-->'

describe('Per-file override', () => {
    it('renders the site\'s footer-extra.pug inside footer.site-footer on every page', () => {
        const built = pages(builds.default.public)
        expect(built.length).toBe(22)
        for (const { file, html } of built) {
            const footer = elementByClass(html, 'footer', 'site-footer')
            expect(footer, file).toBeDefined()
            expect(footer, file).toContain(MARKER)
            // the theme's footer still renders around it: after the address
            // column, before the legal nav and the copyright line
            const at = footer.indexOf(MARKER)
            expect(footer.indexOf('class="address"'), file).toBeGreaterThan(-1)
            expect(footer.indexOf('class="address"'), file).toBeLessThan(at)
            expect(footer.indexOf('class="site-footer__legal"'), file).toBeGreaterThan(at)
            expect(footer.indexOf('class="site-footer__copy"'), file).toBeGreaterThan(at)
            expect(html.split(MARKER).length, file).toBe(2)
        }
    })

    it('falls back to the theme\'s empty footer-extra.pug without the override', () => {
        for (const { file, html } of pages(builds.noplugins.public)) {
            expect(html, file).not.toContain(MARKER)
            expect(elementByClass(html, 'footer', 'site-footer'), file).toContain('class="site-footer__copy"')
        }
    })
})
