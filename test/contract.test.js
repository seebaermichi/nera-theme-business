// §S7 "Contract present": every view, partial, seam and block of §S2.2–§S2.4
// and §S3.1–§S3.2, every token and key of §S2.5, every t() key of §S2.6/§S3.3
// and every class of §S3.6 in views/. The shell and the page types are also
// rendered with Pug, so the token filter, the extra_css filter, the footer,
// the language switch and the business markup are checked on their output.
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'
import {
    BLOCKS,
    BUSINESS_CLASSES,
    BUSINESS_PARTIALS,
    BUSINESS_SEAMS,
    HELPERS,
    PAGE_TYPES,
    SEAMS,
    SHELL_CLASSES,
    T_KEYS,
    THEME_KEYS,
    TOKENS,
    VIEWS,
} from './helpers/contract.js'

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

// Render a view as core does: `app.theme.config` is the merged theme config,
// `t` looks up the page's language and falls back to the key.
function renderShell({
    view = 'layouts/layout.pug',
    config = defaults(),
    business,
    meta = {},
    pagesData = [],
    translations = {},
    content = '<p>Body</p>',
} = {}) {
    const app = { name: 'Brot & Zeit', lang: 'en', translations, theme: { config }, business }
    const lang = meta.lang || app.lang
    const t = (key) => (translations[lang] && translations[lang][key]) || key
    return pug.renderFile(path.join(VIEWS_DIR, view), {
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

    it('ships every page type and partial of §S3.1', () => {
        for (const view of [...PAGE_TYPES, ...BUSINESS_PARTIALS]) expect(fs.existsSync(path.join(VIEWS_DIR, view)), view).toBe(true)
    })

    it('extends the layout and fills block main in every page type (§S2.3)', () => {
        for (const view of PAGE_TYPES) {
            expect(read(view), view).toMatch(/^extends \.\.\/layouts\/layout\.pug$/m)
            expect(read(view), view).toMatch(/^block main$/m)
        }
    })

    it('ships every seam of §S2.4 and §S3.2, with no markup of its own', () => {
        for (const seam of [...SEAMS, ...BUSINESS_SEAMS]) {
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

    it('uses every class of §S3.6 in views/', () => {
        const source = allViews()
        for (const name of [...SHELL_CLASSES, ...BUSINESS_CLASSES]) {
            expect(source, name).toMatch(new RegExp(`(\\.|'|")${name}(?![\\w-])`))
        }
    })

    it('passes every UI string through t() with the keys of §S2.6 and §S3.3', () => {
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

const BUSINESS = {
    name: 'Bäckerei Brot & Zeit',
    street: 'Bergstraße 12',
    postal_code: 10115,
    city: 'Berlin',
    phone: '+49 30 1234567',
    email: 'hallo@example.org',
    hours: [
        { days: 'Mon–Fri', opens: '07:00', closes: '18:00' },
        { days: 'Sun', closed: true },
        { days: 'Sat', opens: '08:00' },
        { opens: '09:00', closes: '10:00' },
    ],
    hours_note: 'Closed on public holidays',
}

const mainOf = (html) => html.match(/<main[^>]*>([\s\S]*)<\/main>/)[1]
const footerOf = (html) => html.match(/<footer[\s\S]*<\/footer>/)[0]
const headings = (html) => [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]))
const renderPage = (type, options = {}) => renderShell({ view: `pages/${type}.pug`, business: BUSINESS, ...options })

describe('Page types (§S3.1)', () => {
    it('renders exactly one <h1> and skips no heading level in every page type', () => {
        const cards = [{ title: 'Bread' }]
        const pagesData = [page('/projects/a.html', { title: 'A' })]
        for (const type of ['default', 'home', 'contact', 'list', 'gallery']) {
            for (const cardsTitle of [undefined, 'What we bake']) {
                const html = renderPage(type, { pagesData, meta: { title: 'T', dirname: '/projects', href: '/projects/index.html', cards, cards_title: cardsTitle, show_hours: true } })
                const levels = headings(html)
                expect(levels.filter((level) => level === 1), type).toHaveLength(1)
                expect(levels[0], type).toBe(1)
                levels.forEach((level, i) => i && expect(level - levels[i - 1], `${type}: ${levels}`).toBeLessThanOrEqual(1))
            }
        }
    })

    it('default: header with lead, body, cards and opening hours in order', () => {
        const html = mainOf(renderPage('default', { meta: { title: 'About', lead: 'Since 1990', cards: [{ title: 'Bread', text: 'Daily' }], show_hours: true } }))
        expect(html).toMatch(
            /^<header class="page__header"><h1 class="page__title">About<\/h1><p class="page__lead">Since 1990<\/p><\/header><div class="page__body"><p>Body<\/p><\/div><ul class="cards">[\s\S]*<\/ul><dl class="opening-hours">[\s\S]*<\/p>$/
        )
    })

    it('default: no lead, no cards and no hours unless set', () => {
        const html = mainOf(renderPage('default', { meta: { title: 'About' } }))
        expect(html).toBe('<header class="page__header"><h1 class="page__title">About</h1></header><div class="page__body"><p>Body</p></div>')
        // show_hours without app.business.hours renders nothing either
        expect(mainOf(renderPage('default', { business: {}, meta: { title: 'About', show_hours: true } }))).not.toContain('opening-hours')
    })

    it('cards: h2 titles, a link only with href, entries without a title left out', () => {
        const cards = [{ title: 'Bread', text: 'Daily', href: '/bread.html' }, { title: 'Cake' }, { text: 'no title' }, null]
        expect(mainOf(renderPage('default', { meta: { title: 'S', cards } }))).toContain(
            '<ul class="cards"><li class="card"><h2 class="card__title"><a class="card__link" href="/bread.html">Bread</a></h2><p class="card__text">Daily</p></li>' +
            '<li class="card"><h2 class="card__title">Cake</h2></li></ul>'
        )
    })

    it('cards: with cards_title an h2.cards__title first and h3 card titles', () => {
        const html = mainOf(renderPage('default', { meta: { title: 'S', cards_title: 'Offer', cards: [{ title: 'Bread' }] } }))
        expect(html).toContain('<h2 class="cards__title">Offer</h2><ul class="cards"><li class="card"><h3 class="card__title">Bread</h3></li></ul>')
        // no cards, no cards title
        expect(mainOf(renderPage('default', { meta: { title: 'S', cards_title: 'Offer' } }))).not.toContain('cards__title')
    })

    it('home: the hero holds the <h1>, both buttons, and the empty media seam', () => {
        const hero = { title: 'Fresh bread', text: 'Since 1990', cta: { label: 'Visit', href: '/contact.html' }, cta_secondary: { label: 'Menu', href: '/menu.html' } }
        const html = mainOf(renderPage('home', { meta: { title: 'Home', hero } }))
        expect(html).toMatch(
            /^<section class="hero"><div class="hero__inner"><h1 class="hero__title">Fresh bread<\/h1><p class="hero__text">Since 1990<\/p>/
        )
        expect(html).toContain(
            '<p class="hero__actions"><a class="button" href="/contact.html">Visit</a><a class="button button--secondary" href="/menu.html">Menu</a></p><div class="hero__media"></div></div></section><div class="page__body"><p>Body</p></div>'
        )
        expect(html).not.toContain('page__header')
    })

    it('home: without hero the title falls back to meta.title, and a half-set cta renders no link', () => {
        expect(mainOf(renderPage('home', { meta: { title: 'Home' } }))).toBe(
            '<section class="hero"><div class="hero__inner"><h1 class="hero__title">Home</h1><div class="hero__media"></div></div></section><div class="page__body"><p>Body</p></div>'
        )
        const hero = { cta: { label: 'Visit' }, cta_secondary: { href: '/menu.html' } }
        const html = mainOf(renderPage('home', { meta: { title: 'Home', hero } }))
        expect(html).not.toContain('<a')
        expect(html).not.toContain('hero__actions')
    })

    it('home: opening hours only with show_hours', () => {
        expect(mainOf(renderPage('home', { meta: { title: 'Home' } }))).not.toContain('opening-hours')
        expect(mainOf(renderPage('home', { meta: { title: 'Home', show_hours: true } }))).toContain('<dl class="opening-hours">')
    })

    it('contact: the form seam next to the address and opening hours', () => {
        const html = mainOf(renderPage('contact', { meta: { title: 'Contact' } }))
        expect(html).toMatch(
            /<div class="page__body"><p>Body<\/p><\/div><div class="contact"><div class="contact__form"><\/div><aside class="contact__aside"><h2>Contact details<\/h2><address class="address">[\s\S]*<\/address><h2>Opening hours<\/h2><dl class="opening-hours">[\s\S]*<\/p><\/aside><\/div>$/
        )
    })

    it('contact: headings leave with their data, the aside with both', () => {
        const noHours = mainOf(renderPage('contact', { business: { city: 'Berlin' }, meta: { title: 'Contact' } }))
        expect(noHours).toContain('<aside class="contact__aside"><h2>Contact details</h2><address class="address"><span class="address__line">Berlin</span></address></aside>')
        const onlyHours = mainOf(renderPage('contact', { business: { hours: [{ days: 'Sun', closed: true }] }, meta: { title: 'Contact' } }))
        expect(onlyHours).not.toContain('Contact details')
        expect(onlyHours).toContain('<aside class="contact__aside"><h2>Opening hours</h2>')
        expect(mainOf(renderPage('contact', { business: undefined, meta: { title: 'Contact' } }))).toMatch(/<div class="contact"><div class="contact__form"><\/div><\/div>$/)
    })

    it('gallery: the body is div.page__body.gallery', () => {
        expect(mainOf(renderPage('gallery', { meta: { title: 'Project' } }))).toBe(
            '<header class="page__header"><h1 class="page__title">Project</h1></header><div class="page__body gallery"><p>Body</p></div>'
        )
    })
})

describe('Child pages (§S3.1b)', () => {
    const listMeta = { title: 'Projects', href: '/projects/index.html', dirname: '/projects', filename: 'index.html' }
    const pagesData = [
        { content: '', meta: { ...listMeta, layout: 'pages/list.pug' } },
        page('/projects/zebra.html', { title: 'Zebra' }),
        page('/projects/apple.html', { title: 'Apple', description: 'An apple' }),
        page('/projects/second.html', { title: 'Second', order: 2 }),
        page('/projects/first.html', { title: 'Zz first', order: 1 }),
        page('/projects/minus.html', { title: 'Minus', order: -1 }),
        page('/projects/string-order.html', { title: 'B string', order: '0' }),
        page('/projects/sub/deep.html', { title: 'Deep' }),
        page('/other/x.html', { title: 'Other' }),
        page('/de/projects/apfel.html', { title: 'Apfel', lang: 'de' }),
        { content: '', meta: { href: '/projects/draft.html', dirname: '/projects', filename: 'draft.html', title: 'Draft' } },
    ]
    const titles = (html) => [...html.matchAll(/<a class="card__link" href="[^"]*">([^<]*)<\/a>/g)].map((m) => m[1])

    it('lists the rendered pages of the same folder and language, not itself, order first, then title', () => {
        const html = mainOf(renderPage('list', { pagesData, meta: listMeta }))
        expect(titles(html)).toEqual(['Minus', 'Zz first', 'Second', 'Apple', 'B string', 'Zebra'])
        expect(html).toContain(
            '<ul class="cards cards--list"><li class="card"><div class="card__media"></div><h2 class="card__title"><a class="card__link" href="/projects/minus.html">Minus</a></h2></li>'
        )
        expect(html).toContain('<a class="card__link" href="/projects/apple.html">Apple</a></h2><p class="card__text">An apple</p></li>')
    })

    it('does not depend on the order of pagesData', () => {
        const forward = titles(mainOf(renderPage('list', { pagesData, meta: listMeta })))
        const backward = titles(mainOf(renderPage('list', { pagesData: [...pagesData].reverse(), meta: listMeta })))
        expect(backward).toEqual(forward)
    })

    it('reads meta.list_dir, with or without slashes', () => {
        for (const listDir of ['/projects/sub', 'projects/sub/']) {
            const html = mainOf(renderPage('list', { pagesData, meta: { ...listMeta, href: '/work.html', dirname: '/', list_dir: listDir } }))
            expect(titles(html), listDir).toEqual(['Deep'])
        }
    })

    it('lists the pages of its own language only', () => {
        const html = mainOf(renderPage('list', { pagesData, meta: { ...listMeta, href: '/de/projects/index.html', dirname: '/de/projects', lang: 'de' } }))
        expect(titles(html)).toEqual(['Apfel'])
    })

    it('sorts by title even when lang is no valid locale tag', () => {
        const odd = [page('/projects/b.html', { title: 'B', lang: 'en_US' }), page('/projects/a.html', { title: 'A', lang: 'en_US' })]
        const html = mainOf(renderPage('list', { pagesData: odd, meta: { ...listMeta, lang: 'en_US' } }))
        expect(titles(html)).toEqual(['A', 'B'])
    })

    it('renders no list when there is no child page', () => {
        expect(mainOf(renderPage('list', { pagesData, meta: { ...listMeta, dirname: '/empty' } }))).not.toContain('<ul')
    })
})

describe('Address and opening hours (§S3.1)', () => {
    it('renders the address lines, a tel: link without spaces and a mailto: link', () => {
        const html = mainOf(renderPage('contact', { meta: { title: 'Contact' }, translations: { en: { Phone: 'Tel.' } } }))
        expect(html).toContain(
            '<address class="address"><span class="address__line">Bergstraße 12</span><span class="address__line">10115 Berlin</span>' +
            '<span class="address__line">Tel.: <a class="address__link" href="tel:+49301234567">+49 30 1234567</a></span>' +
            '<span class="address__line">Email: <a class="address__link" href="mailto:hallo@example.org">hallo@example.org</a></span></address>'
        )
    })

    it('renders closed rows and opens–closes rows, drops incomplete ones, and the note, through t()', () => {
        const translations = { de: { 'Mon–Fri': 'Mo–Fr', Sun: 'So', Closed: 'Geschlossen', 'Closed on public holidays': 'An Feiertagen geschlossen' } }
        const html = mainOf(renderPage('default', { translations, meta: { title: 'Über uns', lang: 'de', show_hours: true } }))
        expect(html).toContain(
            '<dl class="opening-hours"><div class="opening-hours__row"><dt class="opening-hours__days">Mo–Fr</dt>' +
            '<dd class="opening-hours__time"><time datetime="07:00">07:00</time> – <time datetime="18:00">18:00</time></dd></div>' +
            '<div class="opening-hours__row"><dt class="opening-hours__days">So</dt><dd class="opening-hours__time">Geschlossen</dd></div></dl>' +
            '<p class="opening-hours__note">An Feiertagen geschlossen</p>'
        )
    })

    it('renders no address and no hours without app.business', () => {
        const html = renderPage('contact', { business: undefined, meta: { title: 'Contact' } })
        expect(html).not.toContain('<address')
        expect(html).not.toContain('opening-hours')
    })
})

describe('Business footer (§S3.1 "Footer", D3)', () => {
    it('renders three columns: name and address, opening hours, the footer-extra seam', () => {
        const footer = footerOf(renderPage('default', { meta: { title: 'About' } }))
        expect(footer).toMatch(
            /^<footer class="site-footer"><div class="site-footer__inner"><div class="site-footer__cols"><div class="site-footer__col"><h2 class="site-footer__heading">Bäckerei Brot &amp; Zeit<\/h2><address class="address">[\s\S]*<\/address><\/div><div class="site-footer__col"><h2 class="site-footer__heading">Opening hours<\/h2><dl class="opening-hours">[\s\S]*<\/p><\/div><div class="site-footer__col"><\/div><\/div><p class="site-footer__copy">/
        )
    })

    it('leaves the hours column empty with footer.show_hours false or no hours, and names the site without a business name', () => {
        const config = { ...defaults(), footer: { show_hours: false } }
        expect(footerOf(renderPage('default', { config, meta: { title: 'About' } }))).toContain('</div><div class="site-footer__col"></div><div class="site-footer__col"></div></div>')
        const bare = footerOf(renderPage('default', { business: undefined, meta: { title: 'About' } }))
        expect(bare).toContain(
            '<div class="site-footer__cols"><div class="site-footer__col"><h2 class="site-footer__heading">Brot &amp; Zeit</h2></div><div class="site-footer__col"></div><div class="site-footer__col"></div></div>'
        )
    })
})
