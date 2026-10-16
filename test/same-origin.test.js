// §S7 "Same origin only": every src, srcset and stylesheet href of the built
// pages and every url() of the built CSS is root-absolute or a fragment;
// assets/ holds no http(s):// outside comments; a foreign extra_css entry is
// not linked.
import fs from 'fs'
import path from 'path'
import { describe, expect, inject, it } from 'vitest'
import { ROOT } from './helpers/site.js'
import { attr, listFiles, pages, tags } from './helpers/html.js'

const builds = inject('builds')
const ASSETS = path.join(ROOT, 'assets')
const sameOrigin = (url) => /^\/(?![/\\])/.test(url) || url.startsWith('#')
const stylesheetsOf = (html) => tags(html, 'link').filter((a) => attr(a, 'rel') === 'stylesheet').map((a) => attr(a, 'href'))

const resourceUrls = (html) => {
    const urls = []
    for (const name of ['img', 'source', 'script', 'iframe', 'video', 'audio']) {
        for (const attrs of tags(html, name)) {
            const src = attr(attrs, 'src')
            if (src !== undefined) urls.push(src)
            const srcset = attr(attrs, 'srcset')
            if (srcset !== undefined) urls.push(...srcset.split(',').map((part) => part.trim().split(/\s+/)[0]))
        }
    }
    for (const attrs of tags(html, 'link')) {
        if (/stylesheet|preload|icon|manifest/.test(attr(attrs, 'rel') || '')) urls.push(attr(attrs, 'href'))
    }
    return urls
}

describe('Same origin only', () => {
    for (const name of ['default', 'overrides', 'noplugins']) {
        it(`${name}: every src, srcset and stylesheet href is root-absolute or a fragment`, () => {
            let count = 0
            for (const { file, html } of pages(builds[name].public)) {
                for (const url of resourceUrls(html)) {
                    count++
                    expect(sameOrigin(url), `${file}: ${url}`).toBe(true)
                }
            }
            expect(count).toBeGreaterThan(22)
        })

        it(`${name}: every url() in the built CSS is root-absolute or a fragment`, () => {
            for (const file of listFiles(builds[name].public, ['.css'])) {
                const css = fs.readFileSync(path.join(builds[name].public, file), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '')
                for (const [, , url] of css.matchAll(/url\(\s*(['"]?)([^'")]*)\1\s*\)/g)) {
                    expect(sameOrigin(url) || url.startsWith('data:'), `${file}: ${url}`).toBe(true)
                }
                expect(css, file).not.toMatch(/@import/)
            }
        })
    }

    // assets/ arrives with the stylesheet (Step 6); until then there is
    // nothing to read, and the test says so rather than passing empty.
    it.skipIf(!fs.existsSync(ASSETS))('assets/ contains no http:// or https:// outside comments, and no font files', () => {
        for (const file of listFiles(ASSETS, ['.css', '.svg', '.json', '.webmanifest', '.txt', '.html'])) {
            const text = fs.readFileSync(path.join(ASSETS, file), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '')
            expect(text, file).not.toMatch(/https?:\/\//)
        }
        expect(listFiles(ASSETS, ['.woff', '.woff2', '.ttf', '.otf', '.eot'])).toEqual([])
    })

    it('links root-absolute extra_css entries after the theme\'s stylesheet and drops every other one', () => {
        for (const { file, html } of pages(builds.overrides.public)) {
            expect(stylesheetsOf(html), file).toEqual(['/css/theme.css', '/css/site.css'])
            expect(html, file).not.toMatch(/example\.org\/[xyz]\.css/)
            expect(html, file).not.toContain('relative.css')
        }
        expect(fs.existsSync(path.join(builds.overrides.public, 'css', 'site.css'))).toBe(true)
    })

    it('links only the theme\'s stylesheet when extra_css is the default []', () => {
        for (const { file, html } of pages(builds.default.public)) expect(stylesheetsOf(html), file).toEqual(['/css/theme.css'])
    })
})
