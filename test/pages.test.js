// The page-level behaviour of §S3.1 and §S2.7/§S2.8 on the built fixture:
// the shell on every page; hero, cards, opening hours, address, list order,
// gallery figures, footer and language switch as the spec renders them; and
// every theme string translated on German pages (§S6, item 7).
import path from 'path'
import { describe, expect, inject, it } from 'vitest'
import { SITE, loadYaml } from './helpers/site.js'
import { T_KEYS } from './helpers/contract.js'
import { attr, countTags, elementByClass, page, pages, stripTags, tags } from './helpers/html.js'

const builds = inject('builds')
const pub = builds.default.public
const app = loadYaml(path.join(SITE, 'config', 'app.yaml'))
const theme = loadYaml(path.join(SITE, 'config', 'theme.yaml'))

const hrefsOf = (html, className) =>
    tags(html, 'a').filter((a) => new RegExp(`\\b${className}\\b`).test(attr(a, 'class') || '')).map((a) => attr(a, 'href'))
// The rows of the first opening-hours list, each as plain text.
const hoursRows = (html) => /<dl class="opening-hours">([\s\S]*?)<\/dl>/.exec(html)[1].split('<div class="opening-hours__row">').slice(1).map(stripTags)

describe('Every built page', () => {
    it('has one <h1>, one main#main, the skip link first and no target="_blank"', () => {
        for (const { file, html } of pages(pub)) {
            expect(countTags(html, 'h1'), file).toBe(1)
            expect(countTags(html, 'main'), file).toBe(1)
            expect(html, file).toMatch(/<main class="site-main" id="main">/)
            expect(html, file).toMatch(/<body><a class="skip-link" href="#main">/)
            expect(html, file).not.toMatch(/target="_blank"/)
        }
    })

    it('carries the page language in <html lang>', () => {
        for (const { file, html } of pages(pub)) {
            expect(html, file).toMatch(file.startsWith(`de${path.sep}`) ? /<html lang="de">/ : /<html lang="en">/)
        }
    })

    it('has scripts only from plugin-contact-form, inside div.contact__form of the contact pages', () => {
        for (const { file, html } of pages(pub)) {
            const isContact = ['contact.html', path.join('de', 'kontakt.html')].includes(file)
            expect(countTags(html, 'script'), file).toBe(isContact ? 2 : 0)
            if (!isContact) continue
            const form = elementByClass(html, 'div', 'contact__form')
            expect(tags(form, 'script'), file).toEqual([' type="application/json" data-contact-config', ' src="/js/contact-form.js"'])
        }
    })

    it('labels every <nav>', () => {
        for (const { file, html } of pages(pub)) {
            for (const attrs of tags(html, 'nav')) expect(attr(attrs, 'aria-label'), file).toBeTruthy()
        }
    })
})

describe('Page types (§S3.1)', () => {
    it('home: the hero holds the <h1>, the text, both buttons and the image from the hero-media seam', () => {
        const hero = elementByClass(page(pub, 'index.html'), 'section', 'hero')
        expect(hero).toMatch(/^\s*<div class="hero__inner">\s*<h1 class="hero__title">Bread that takes its time\.<\/h1>\s*<p class="hero__text">/)
        expect(hero).toContain('<p class="hero__actions"><a class="button" href="/contact.html">Order for pickup</a><a class="button button--secondary" href="/projects/bakehouse.html">Our bakehouse</a></p>')
        const media = elementByClass(hero, 'div', 'hero__media')
        expect(media).toMatch(/<picture>/)
        expect(media).toMatch(/<img class="hero__image" [^>]*alt="Loaves of sourdough bread on a wooden counter"[^>]*loading="eager" fetchpriority="high">/)
        expect(page(pub, 'de/index.html')).toContain('<h1 class="hero__title">Brot, das sich Zeit nimmt.</h1>')
    })

    it('home: body, then the cards under cards_title with h3 titles, then the opening hours', () => {
        const main = elementByClass(page(pub, 'index.html'), 'main', 'site-main')
        const order = ['<section class="hero">', '<div class="page__body">', '<h2 class="cards__title">What we do</h2>', '<ul class="cards">', '<dl class="opening-hours">']
        const at = order.map((marker) => main.indexOf(marker))
        expect(at.every((i) => i >= 0)).toBe(true)
        expect([...at].sort((a, b) => a - b)).toEqual(at)
        const cards = elementByClass(main, 'ul', 'cards')
        expect(countTags(cards, 'li')).toBe(3)
        expect(countTags(cards, 'h2')).toBe(0)
        expect(cards).toContain('<h3 class="card__title"><a class="card__link" href="/services.html">Breads</a></h3>')
        // a card without href gets a plain title, no empty link
        expect(cards).toContain('<h3 class="card__title">Pastries and cakes</h3>')
    })

    it('default: header with h1 and lead, body, cards with h2 titles when there is no cards_title', () => {
        const main = elementByClass(page(pub, 'services.html'), 'main', 'site-main')
        expect(main).toMatch(/^\s*<header class="page__header">\s*<h1 class="page__title">Services<\/h1>\s*<p class="page__lead">What you can order, book and pick up\.<\/p>\s*<\/header>\s*<div class="page__body">/)
        expect(main).not.toContain('cards__title')
        expect(main).toContain('<h2 class="card__title"><a class="card__link" href="/contact.html">Cakes to order</a></h2>')
        expect(main).not.toContain('opening-hours')
        // no lead, no cards, no hours: only header and body
        const imprint = elementByClass(page(pub, 'imprint.html'), 'main', 'site-main')
        expect(imprint).not.toMatch(/page__lead|class="cards|opening-hours/)
    })

    it('default with show_hours: the opening hours from app.business, days and note through t()', () => {
        const main = elementByClass(page(pub, 'opening-hours.html'), 'main', 'site-main')
        expect(hoursRows(main)).toEqual(['Tue–Fri 07:00 – 18:00', 'Sat 07:30 – 15:00', 'Sun 08:00 – 13:00', 'Mon Closed'])
        expect(main).toContain('<dd class="opening-hours__time"><time datetime="07:00">07:00</time> – <time datetime="18:00">18:00</time></dd>')
        expect(main).toContain('<p class="opening-hours__note">Closed on public holidays.</p>')
        const de = elementByClass(page(pub, 'de/oeffnungszeiten.html'), 'main', 'site-main')
        expect(hoursRows(de)).toEqual([
            'Di–Fr 07:00 – 18:00',
            'Sa 07:30 – 15:00',
            'So 08:00 – 13:00',
            'Mo Geschlossen',
        ])
        expect(de).toContain('<p class="opening-hours__note">An Feiertagen geschlossen.</p>')
    })

    for (const [lang, heading, files] of [
        ['en', 'Opening hours', ['index.html', 'opening-hours.html']],
        ['de', 'Öffnungszeiten', ['de/index.html', 'de/oeffnungszeiten.html']],
    ]) {
        it(`home and default with show_hours (${lang}): one h2 "${heading}" directly before the hours`, () => {
            for (const file of files) {
                const main = elementByClass(page(pub, file), 'main', 'site-main')
                expect(main, file).toMatch(new RegExp(`<h2>${heading}</h2>\\s*<dl class="opening-hours">`))
                expect(main.split(`<h2>${heading}</h2>`), file).toHaveLength(2)
            }
        })
    }

    it('home and default without show_hours: no hours heading in main', () => {
        for (const file of ['services.html', 'imprint.html', 'de/leistungen.html']) {
            expect(elementByClass(page(pub, file), 'main', 'site-main'), file).not.toMatch(/<h2>(Opening hours|Öffnungszeiten)<\/h2>/)
        }
    })

    it('contact: header, body, then the form next to the aside with address and opening hours', () => {
        const html = page(pub, 'contact.html')
        const contact = elementByClass(html, 'div', 'contact')
        expect(contact).toMatch(/^\s*<div class="contact__form">\s*<form class="contact-form"/)
        const aside = elementByClass(contact, 'aside', 'contact__aside')
        expect(aside).toMatch(/^\s*<h2>Contact details<\/h2>\s*<address class="address">/)
        expect(aside).toMatch(/<\/address>\s*<h2>Opening hours<\/h2>\s*<dl class="opening-hours">/)
        expect(elementByClass(page(pub, 'de/kontakt.html'), 'aside', 'contact__aside')).toMatch(/<h2>Kontakt<\/h2>[\s\S]*<h2>Öffnungszeiten<\/h2>/)
    })

    it('address: one line per set field, phone as a tel: link without spaces, no email when none is set', () => {
        const address = /<address class="address">([\s\S]*?)<\/address>/.exec(page(pub, 'contact.html'))[1]
        expect(address).toBe(
            '<span class="address__line">Kollwitzstraße 42</span><span class="address__line">10405 Berlin</span><span class="address__line">Deutschland</span>' +
            '<span class="address__line">Phone: <a class="address__link" href="tel:+493012345678">+49 30 123 456 78</a></span>'
        )
        expect(page(pub, 'de/kontakt.html')).toContain('<span class="address__line">Telefon: <a class="address__link" href="tel:+493012345678">')
        expect(page(pub, 'contact.html')).not.toContain('mailto:')
    })

    for (const [lang, file, expected] of [
        ['en', 'projects/index.html', [['/projects/bakehouse.html', 'The bakehouse'], ['/projects/courses.html', 'Baking courses'], ['/projects/shop-front.html', 'A new shop front']]],
        ['de', 'de/projekte/index.html', [['/de/projekte/backstube.html', 'Die Backstube'], ['/de/projekte/kurse.html', 'Backkurse'], ['/de/projekte/ladenfront.html', 'Eine neue Ladenfront']]],
    ]) {
        it(`list (${lang}): one card per child page of its folder and language, by order, then title`, () => {
            const list = elementByClass(page(pub, file), 'ul', 'cards cards--list')
            expect(countTags(list, 'li')).toBe(3)
            const links = [...list.matchAll(/<h2 class="card__title"><a class="card__link" href="([^"]+)">([^<]+)<\/a><\/h2>/g)].map((m) => [m[1], m[2]])
            expect(links).toEqual(expected)
            // every card has the media seam; only the project with an image fills it
            expect(countTags(list, 'div')).toBe(3)
            expect(list.match(/<img class="card__image" [^>]*loading="lazy"/g).length).toBe(1)
            expect(list).toMatch(/<p class="card__text">/)
        })
    }

    it('list: the card text is the child page\'s description', () => {
        const list = elementByClass(page(pub, 'projects/index.html'), 'ul', 'cards cards--list')
        expect(list).toMatch(/<h2 class="card__title"><a class="card__link" href="\/projects\/courses\.html">Baking courses<\/a><\/h2>\s*<p class="card__text">Learn to bake sourdough bread in a Saturday workshop\.<\/p>/)
    })

    it('gallery: every captioned image is a figure.nera-image directly in div.page__body.gallery', () => {
        for (const file of ['projects/bakehouse.html', 'de/projekte/backstube.html']) {
            const html = page(pub, file)
            expect(html, file).toMatch(/<header class="page__header">\s*<h1 class="page__title">[^<]+<\/h1>\s*<p class="page__lead">[^<]+<\/p>\s*<\/header>\s*<div class="page__body gallery">\s*<figure class="nera-image">/)
            const body = elementByClass(html, 'div', 'page__body')
            expect(countTags(body, 'figure'), file).toBe(3)
            expect(countTags(body, 'figcaption'), file).toBe(3)
            // figures and the text paragraph are siblings, none nested in a <p>
            expect(body, file).not.toMatch(/<p>\s*<(figure|picture|img)/)
            expect(stripTags(body), file).toMatch(/(Every loaf|Jedes Brot)/)
        }
        expect(page(pub, 'projects/bakehouse.html')).toContain('<figcaption class="nera-image__caption">Rye dough after 24 hours of fermentation</figcaption>')
    })
})

describe('Footer and language switch', () => {
    it('footer: business name and address, the opening hours, the footer-extra seam, legal links, copyright', () => {
        const footer = elementByClass(page(pub, 'about.html'), 'footer', 'site-footer')
        const cols = footer.split('<div class="site-footer__col">').slice(1)
        expect(cols.length).toBe(3)
        expect(cols[0]).toMatch(/^\s*<h2 class="site-footer__heading">Brot &amp; Zeit<\/h2>\s*<address class="address">/)
        expect(cols[1]).toMatch(/^\s*<h2 class="site-footer__heading">Opening hours<\/h2>\s*<dl class="opening-hours">/)
        expect(cols[2]).toMatch(/<nav class="social-media-links" aria-label="Social media">/)
        expect(footer).toContain('<nav class="site-footer__legal" aria-label="Legal"><a href="/imprint.html">Imprint</a><a href="/privacy.html">Privacy</a></nav>')
        expect(footer).toContain(`<p class="site-footer__copy">© ${new Date().getFullYear()} Brot &amp; Zeit</p>`)
    })

    it('footer: the legal links of footer_links per language, on every page', () => {
        for (const { file, html } of pages(pub)) {
            const legal = elementByClass(html, 'nav', 'site-footer__legal')
            expect(tags(legal, 'a').map((a) => attr(a, 'href')), file).toEqual(
                file.startsWith(`de${path.sep}`) ? ['/de/impressum.html', '/de/datenschutz.html'] : ['/imprint.html', '/privacy.html']
            )
        }
        expect(page(pub, 'de/index.html')).toContain('<a href="/de/impressum.html">Impressum</a><a href="/de/datenschutz.html">Datenschutz</a>')
    })

    it('switches to the page with the same slug, with hreflang and a matching lang', () => {
        for (const [file, target, current, other] of [
            ['projects/bakehouse.html', '/de/projekte/backstube.html', 'en', 'de'],
            ['de/projekte/backstube.html', '/projects/bakehouse.html', 'de', 'en'],
            ['de/kontakt.html', '/contact.html', 'de', 'en'],
        ]) {
            const html = page(pub, file)
            const links = tags(html, 'a').filter((a) => /lang-switch__link/.test(a))
            expect(links.length, file).toBe(1)
            expect(attr(links[0], 'href'), file).toBe(target)
            expect(attr(links[0], 'hreflang'), file).toBe(other)
            expect(attr(links[0], 'lang'), file).toBe(other)
            expect(html, file).toMatch(new RegExp(`<span class="lang-switch__link" aria-current="true" lang="${current}">${current === 'en' ? 'English' : 'Deutsch'}</span>`))
        }
    })

    it('the brand links the home of the page\'s language; the menu is the language\'s own', () => {
        const de = page(pub, 'de/projekte/kurse.html')
        expect(hrefsOf(de, 'site-header__brand')).toEqual(['/de/index.html'])
        expect(hrefsOf(de, 'nav__link')).toEqual(['/de/index.html', '/de/ueber-uns.html', '/de/leistungen.html', '/de/projekte/index.html', '/de/kontakt.html'])
        expect(hrefsOf(page(pub, 'about.html'), 'site-header__brand')).toEqual(['/index.html'])
        expect(page(pub, 'about.html')).toContain('<a class="nav__link nav__link--active" href="/about.html">About</a>')
    })
})

describe('Translations (§S6, item 7)', () => {
    it('translates every theme key, the footer_links labels and the opening-hours days and note in German', () => {
        const de = app.translations.de
        const keys = [
            ...T_KEYS,
            ...theme.footer_links.map((link) => link.label),
            ...app.business.hours.map((row) => row.days),
            app.business.hours_note,
        ]
        for (const key of keys) expect(de[key], key).toBeTruthy()
        for (const lang of Object.keys(app.translations)) expect(app.translations[lang].language_name, lang).toBeTruthy()
    })

    it('renders no theme key untranslated on a German page', () => {
        for (const { file, html } of pages(pub).filter(({ file }) => file.startsWith(`de${path.sep}`))) {
            const shell = [
                stripTags(/<a class="skip-link"[^>]*>[^<]*<\/a>/.exec(html)[0]),
                ...tags(html, 'nav').map((a) => attr(a, 'aria-label')),
                stripTags(elementByClass(html, 'nav', 'site-footer__legal')),
                stripTags(elementByClass(html, 'footer', 'site-footer')),
            ].join(' ')
            for (const key of ['Skip to content', 'Main navigation', 'Language', 'Legal', 'Opening hours', 'Closed', 'Phone', 'Imprint', 'Privacy', 'Tue–Fri']) {
                expect(shell, `${file}: ${key}`).not.toContain(key)
            }
        }
    })
})
