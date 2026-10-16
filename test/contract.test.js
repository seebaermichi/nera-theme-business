// §S7 "Contract present", shared part (§S2): every view, partial, seam and
// block of §S2.2–§S2.4, every token and key of §S2.5 and the shell classes in
// views/. The shell is also rendered with Pug, so the token filter, the
// extra_css filter, the footer links and the language switch are checked on
// their output.
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'
import { BLOCKS, HELPERS, SEAMS, SHELL_CLASSES, T_KEYS, THEME_KEYS, TOKENS, VIEWS } from './helpers/contract.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const VIEWS_DIR = path.join(ROOT, 'views')

// Pug and yaml from @nera-static/core's own location, so the tests render and
// parse exactly as the build does, with no extra dependency.
const coreRequire = createRequire(createRequire(path.join(ROOT, 'package.json')).resolve('@nera-static/core'))
const pug = coreRequire('pug')
const YAML = coreRequire('yaml')

const read = (file) => fs.readFileSync(path.join(VIEWS_DIR, file), 'utf-8')
const listPug = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) return listPug(full)
        return entry.name.endsWith('.pug') ? [full] : []
    })
const allViews = () => listPug(VIEWS_DIR).map((file) => fs.readFileSync(file, 'utf-8')).join('\n')
const defaults = () => YAML.parse(fs.readFileSync(path.join(ROOT, 'config', 'theme.yaml'), 'utf-8'))

// Render the layout as core does: `app.theme.config` is the merged theme
// config, `t` looks up the page's language and falls back to the key.
function renderShell({ config = defaults(), meta = {}, pagesData = [], translations = {}, content = '<p>Body</p>' } = {}) {
    const app = { name: 'Brot & Zeit', lang: 'en', translations, theme: { config } }
    const lang = meta.lang || app.lang
    const t = (key) => (translations[lang] && translations[lang][key]) || key
    return pug.renderFile(path.join(VIEWS_DIR, 'layouts', 'layout.pug'), {
        basedir: VIEWS_DIR,
        app,
        meta: { title: 'Home', href: '/index.html', ...meta },
        pagesData,
        content,
        t,
    })
}

const page = (href, meta) => ({
    content: '',
    meta: { layout: 'pages/default.pug', href, filename: path.basename(href), dirname: path.dirname(href), ...meta },
})

describe('Contract present (shared, §S2)', () => {
    it('ships every view and partial of §S2.2', () => {
        for (const view of VIEWS) expect(fs.existsSync(path.join(VIEWS_DIR, view)), view).toBe(true)
    })

    it('ships every shared seam of §S2.4, with no markup of its own', () => {
        for (const seam of SEAMS) {
            expect(fs.existsSync(path.join(VIEWS_DIR, seam)), seam).toBe(true)
            const code = read(seam).split('\n').filter((line) => line.trim() && !line.trim().startsWith('//-'))
            expect(code, seam).toEqual([])
        }
    })

    it('defines every block of §S2.3 in the layout', () => {
        const layout = read('layouts/layout.pug')
        for (const block of BLOCKS) expect(layout, block).toMatch(new RegExp(`^\\s*block ${block}$`, 'm'))
    })

    // A `- const` line, or a declaration at the first indent of a `-` block.
    it('defines the helpers of §S2.2 and no other top-level name than themeBusiness', () => {
        const helpers = read('partials/helpers.pug')
        for (const helper of HELPERS) expect(helpers, helper).toMatch(new RegExp(`function ${helper}\\(`))
        const topLevel = [...allViews().matchAll(/^(?:- *| {4})(?:const|let|var|function) +([A-Za-z_$][\w$]*)/gm)]
            .map((match) => match[1])
        expect([...new Set(topLevel)].sort()).toEqual([...HELPERS, 'themeBusiness'].sort())
    })

    it('ships no views/vendor/', () => {
        expect(fs.existsSync(path.join(VIEWS_DIR, 'vendor'))).toBe(false)
    })

    it('declares every token of §S2.5 and every key of §S2.5/§S3.4 in config/theme.yaml', () => {
        const config = defaults()
        for (const key of THEME_KEYS) expect(config, key).toHaveProperty([key])
        for (const [group, names] of Object.entries(TOKENS)) {
            expect(Object.keys(config.tokens[group]).sort()).toEqual([...names].sort())
            for (const name of names) {
                const value = config.tokens[group][name]
                expect(['string', 'number'], `${group}.${name}`).toContain(typeof value)
                expect(String(value)).not.toBe('')
                expect(String(value), `${group}.${name}`).not.toMatch(/[<>{};]/)
            }
        }
        expect(config.label).toBe('Business')
        expect(config.extra_css).toEqual([])
        expect(config.footer_links).toEqual([])
        expect(config.footer).toEqual({ show_hours: true })
    })

    it('uses every shell class of §S3.6 in views/', () => {
        const source = allViews()
        for (const name of SHELL_CLASSES) {
            expect(source, name).toMatch(new RegExp(`(\\.|'|")${name}(?![\\w-])`))
        }
    })

    it('passes every shared UI string through t() with the keys of §S2.6', () => {
        const source = allViews()
        for (const key of T_KEYS) expect(source, key).toContain(`t('${key}')`)
    })
})

describe('Shell (§S2.2–§S2.5, §S2.8)', () => {
    it('renders the layout: lang, skip link first, one main#main, header, footer, no script', () => {
        const html = renderShell({ meta: { lang: 'de', title: 'Start' } })
        expect(html).toMatch(/^<!DOCTYPE html><html lang="de">/)
        expect(html).toMatch(/<body><a class="skip-link" href="#main">Skip to content<\/a><header class="site-header">/)
        expect(html.match(/<main[\s>]/g)).toHaveLength(1)
        expect(html).toContain('<main class="site-main" id="main"><p>Body</p></main>')
        expect(html).toContain('<nav class="site-header__nav" aria-label="Main navigation"></nav>')
        expect(html).toContain('<title>Start – Brot &amp; Zeit</title>')
        expect(html).toContain('<link rel="stylesheet" href="/css/theme.css">')
        expect(html).toMatch(/<p class="site-footer__copy">© \d{4} Brot &amp; Zeit<\/p><\/div><\/footer><\/body><\/html>$/)
        expect(html).not.toContain('<script')
        expect(html).not.toContain('lang-switch')
        expect(html).not.toContain('site-footer__legal')
    })

    it('titles a page whose title is the site name with the name alone', () => {
        expect(renderShell({ meta: { title: 'Brot & Zeit' } })).toContain('<title>Brot &amp; Zeit</title>')
    })

    it('emits every default token as a --theme-* custom property', () => {
        const html = renderShell()
        expect(html).toContain('--theme-color-accent:#a1400f;')
        expect(html).toContain('--theme-color-accent-text:#ffffff;')
        expect(html).toContain('--theme-size-measure:38rem;')
        const rule = html.match(/<style>:root\{([^}]*)\}<\/style>/)[1]
        const count = Object.values(TOKENS).reduce((sum, names) => sum + names.length, 0)
        expect(rule.split(';').filter(Boolean)).toHaveLength(count)
    })

    it('drops token values and names that could break out of the rule', () => {
        const config = defaults()
        config.tokens.color.accent = 'red}body{display:none'
        config.tokens.color.text = '#000;x'
        config.tokens.color.bg = '</style><script>'
        config.tokens.color.border = { nested: true }
        config.tokens.color['bad name'] = 'red'
        config.tokens['g}'] = { x: 'red' }
        config.tokens.size.space = 2
        const html = renderShell({ config })
        const rule = html.match(/<style>(.*?)<\/style>/)[1]
        expect(rule).not.toContain('--theme-color-accent:')
        expect(rule).not.toContain('--theme-color-text:')
        expect(rule).not.toContain('--theme-color-bg:')
        expect(rule).not.toContain('--theme-color-border:')
        expect(rule).not.toContain('bad')
        expect(rule).not.toContain('--theme-g')
        expect(rule).toContain('--theme-size-space:2;')
        expect(rule.match(/[{}]/g)).toEqual(['{', '}'])
        expect(html).not.toContain('<script')
    })

    it('emits no <style> when no token survives', () => {
        expect(renderShell({ config: { tokens: { color: { accent: 'x}' } } } })).not.toContain('<style>')
    })

    it('links only root-absolute extra_css entries, in order, after theme.css', () => {
        const config = {
            ...defaults(),
            extra_css: ['/css/custom.css', 'https://example.org/x.css', '//example.org/y.css', '/\\example.org/z.css', 'css/rel.css', 42, '/\t/example.org/t.css', '/\n/example.org/n.css', '/\r\\example.org/r.css', '/_nera/code-blocks.css'],
        }
        const links = [...renderShell({ config }).matchAll(/<link rel="stylesheet" href="([^"]*)">/g)].map((m) => m[1])
        expect(links).toEqual(['/css/theme.css', '/css/custom.css', '/_nera/code-blocks.css'])
    })

    it('renders footer_links through t(), resolved for the page language', () => {
        const config = {
            ...defaults(),
            footer_links: [
                { label: 'Imprint', href: { en: '/imprint.html', de: '/de/impressum.html' } },
                { label: 'Privacy', href: '/privacy.html' },
                { label: 'English only', href: { en: '/en-only.html' } },
                { href: '/no-label.html' },
            ],
        }
        const translations = { en: {}, de: { Imprint: 'Impressum', Legal: 'Rechtliches' } }
        const html = renderShell({ config, translations, meta: { lang: 'de' } })
        expect(html).toContain(
            '<nav class="site-footer__legal" aria-label="Rechtliches"><a href="/de/impressum.html">Impressum</a><a href="/privacy.html">Privacy</a></nav>'
        )
    })

    it('links the other language to the page with the same slug, else to its home (§S2.8)', () => {
        const translations = { en: { language_name: 'English' }, de: { language_name: 'Deutsch' } }
        const pagesData = [
            page('/index.html', { slug: 'home' }),
            page('/about.html', { slug: 'about' }),
            page('/de/index.html', { lang: 'de', slug: 'home' }),
            page('/de/ueber-uns.html', { lang: 'de', slug: 'about' }),
            { content: '', meta: { href: '/de/draft.html', lang: 'de', slug: 'contact', filename: 'draft.html', dirname: '/de' } },
        ]
        const twin = renderShell({ translations, pagesData, meta: { href: '/about.html', slug: 'about' } })
        expect(twin).toContain(
            '<nav class="lang-switch" aria-label="Language"><ul class="lang-switch__list">' +
            '<li class="lang-switch__item"><span class="lang-switch__link" aria-current="true" lang="en">English</span></li>' +
            '<li class="lang-switch__item"><a class="lang-switch__link" href="/de/ueber-uns.html" hreflang="de" lang="de">Deutsch</a></li>' +
            '</ul></nav>'
        )
        // the German twin has no layout, so the switch falls back to the German home
        const fallback = renderShell({ translations, pagesData, meta: { href: '/contact.html', slug: 'contact' } })
        expect(fallback).toContain('href="/de/index.html" hreflang="de" lang="de">Deutsch</a>')
        // the brand links to the page language's home
        expect(renderShell({ translations, pagesData, meta: { lang: 'de' } }))
            .toContain('<a class="site-header__brand" href="/de/index.html">Brot &amp; Zeit</a>')
    })

    it('renders no switch when no other language has a page, or with one translation', () => {
        const pagesData = [page('/index.html', { slug: 'home' })]
        expect(renderShell({ translations: { en: {}, de: {} }, pagesData })).not.toContain('lang-switch')
        expect(renderShell({ translations: { en: {} }, pagesData })).not.toContain('lang-switch')
    })
})
