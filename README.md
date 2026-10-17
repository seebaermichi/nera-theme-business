# @nera-static/theme-business

[![Test](https://github.com/seebaermichi/nera-theme-business/actions/workflows/test.yml/badge.svg)](https://github.com/seebaermichi/nera-theme-business/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/@nera-static/theme-business)](https://www.npmjs.com/package/@nera-static/theme-business)

A theme for the [Nera](https://github.com/seebaermichi/nera) static site generator, made for small businesses, associations and portfolios: a front page with a hero, cards, opening hours, a contact page with the form, project lists and image galleries, legal pages. It is presentation only — Pug views, one stylesheet and a `config/theme.yaml` of design tokens — and carries the Nera business and portfolio starters.

📖 **Documentation:** [nera.js.org](https://nera.js.org)

- **"Crust"**: a cream page under a rust top rule, a system sans-serif for running text, a serif for headings, the home hero and the footer as dark bands, cards in an auto-fill grid with a hairline border.
- **No JavaScript** and **no third-party request**: no script, no web font, no CDN. Every URL the theme emits or its CSS loads is a root-absolute path on your own site, and it works under a `base_path`.
- **Accessible by default**: skip link, one `<main id="main">`, one `<h1>` per page, labelled navigation, visible focus, a language switch with `hreflang` and `lang`, contrast of at least 4.5:1 for every default colour pair, no motion for visitors who asked for less.
- **Plugins are optional**: plugin output reaches a page only through *seams* you fill; without a plugin the seam renders nothing.

## Installation

```bash
npm install @nera-static/theme-business
```

In your site's `config/app.yaml`:

```yaml
theme: business
```

The theme needs Nera's engine, `@nera-static/core`, **4.15.0 or later** (`"nera": { "generator": ">=4.15.0" }`); an older one fails the build with a message naming the range. `npm ls @nera-static/core` shows yours, `npm update @nera-static/core` brings it up. Keep a `theme/views/` folder in your site (it holds your vendor copies and seam overrides anyway; core 4.16.0 or later also builds a themed site without one, the 4.15.0 floor relies on it being there), and remove the `nera new` starter files `theme/views/layouts/layout.pug` and `theme/views/pages/default.pug` if they still carry the `nera:scaffold-default` line, or they hide the theme's files (`nera validate` warns with `theme-shadowed`).

## Page types

Set a page's `layout` to one of these:

| `layout:` | for | renders |
|---|---|---|
| `pages/home.pug` | the front page | the hero (title, text, up to two buttons, the `hero-media` seam), body, cards, opening hours under an `Opening hours` heading (with `show_hours: true`) |
| `pages/default.pug` | about, services, legal pages, anything else | page header, body, cards, opening hours under an `Opening hours` heading (with `show_hours: true`) |
| `pages/contact.pug` | the contact page | page header, body, the `contact-form` seam next to an aside with the address and the opening hours |
| `pages/list.pug` | a section index: projects, a team, an offer list | page header, body, one card per child page |
| `pages/gallery.pug` | one portfolio project, a photo page | page header, the body laid out as an image grid |

The page header (or the home's hero title) is the page's only `<h1>`, so **start a page's Markdown at `##`**: a `#` heading would be a second `<h1>`.

**Hero.** `hero.title` (else `title`) is the `<h1>`, `hero.text` the line under it. `hero.cta` is a solid button, `hero.cta_secondary` an outlined one; each needs both `label` and `href`, or it is left out.

**Cards.** `cards` is a list of `{ title, text, href }`, `href` optional (with it, the title is a link). With `cards_title` set, the list gets that `<h2>` and the card titles become `<h3>`. A services page is a default page with cards.

**Child pages** (`pages/list.pug`): every page with a `layout` in the list page's language whose folder is `list_dir` (default: the list page's own folder), the list page itself left out. Sorted by `order` (numbers first, ascending), then `title`, then URL. Each card shows the `card-media` seam, the page's `title` as a link and its `description`.

**Galleries.** `@nera-static/plugin-images` turns an image that stands alone in a paragraph, `![alt](src "Caption")`, into a `figure.nera-image` with a caption. On a gallery page those figures form a grid of two to four columns; text paragraphs between them span the whole row. Without plugin-images the images stay inline and stack.

```markdown
---
layout: pages/gallery.pug
title: The bakehouse
lead: A morning in the back room.
order: 1
---

![Rye dough in a tub](/images/dough.jpg "Rye dough after 24 hours")

![A baker scoring a loaf](/images/scoring.jpg "Scoring the Landbrot")

Every loaf is scored by hand just before it goes into the oven.
```

Frontmatter the views read:

| key | type | read by |
|---|---|---|
| `title` | string | every page (`<title>`, the `<h1>`, the card of a child page) |
| `description` | string | every page (`<meta name="description">`); the card text of a child page |
| `lead` | string | the page header (every page type but home) |
| `robots` | string | `<meta name="robots">` (else `robots` in `config/app.yaml`) |
| `lang` | string | `<html lang>`, the child pages, `t()` (else `lang` in `config/app.yaml`) |
| `slug` | string | the language switch: translations of one page share a `slug` |
| `hero` | `{ title, text, cta: { label, href }, cta_secondary: { label, href } }` | home |
| `cards`, `cards_title` | list of `{ title, text, href }`, string | home, default |
| `show_hours` | boolean | home, default |
| `list_dir` | site path, e.g. `/projects` | list |
| `order` | number | the child pages of a list |

## Business facts: `app.business`

Address, phone and opening hours are facts about the business, not presentation, so they live in your site's `config/app.yaml` and survive a theme switch. Every key is optional:

```yaml
business:
    name: Brot & Zeit            # the footer's first heading; else app.name
    street: Bergstraße 12
    postal_code: '10115'
    city: Berlin
    country: Deutschland
    phone: '+49 30 1234567'      # a tel: link, spaces removed
    email: hallo@example.org     # a plain mailto: link; leave it out to point to the contact form instead
    hours:                       # days are t() keys
        - days: Mon–Fri
          opens: '07:00'
          closes: '18:00'
        - days: Sat
          opens: '08:00'
          closes: '14:00'
        - days: Sun
          closed: true
    hours_note: Closed on public holidays   # a t() key
```

Quote times (`'07:00'`). An hours row is shown when it has `days` and either `closed: true` or both `opens` and `closes`. The address and the opening hours render nothing when their data is missing; so do their headings on the contact page.

**The footer** has three columns: the business name with the address; `Opening hours` with the hours (turn them off with `footer.show_hours: false` in `config/theme.yaml`); and the `footer-extra` seam. Below them come the legal links and the copyright line. An empty column collapses; on narrow screens the columns stack.

## Seams: where plugin output goes

A seam is a partial the theme ships empty. You fill it by putting a file with the same path into your site's `theme/views/`; your file wins over the theme's. The theme never reads plugin data itself, so a theme update cannot break on a plugin's data shape.

Plugin templates are not found automatically: publish each plugin's templates into your site first, from the site root (`npx nera-<plugin>`, for example `npx nera-contact-form`); they land in `theme/views/vendor/plugin-<name>/`.

| seam (`theme/views/…`) | where | in scope | typical override |
|---|---|---|---|
| `partials/head-extra.pug` | end of `<head>` | `app`, `meta` | canonical and alternate links |
| `partials/nav-main.pug` | inside the header's `<nav>` | `app`, `meta` | plugin-navigation |
| `partials/footer-extra.pug` | the footer's third column, before the legal links | `app`, `meta` | plugin-social-media-links |
| `partials/scripts-extra.pug` | end of `<body>` | `app`, `meta` | your own `<script type="module">` |
| `partials/hero-media.pug` | `div.hero__media` of the home hero (hidden while empty) | `meta` | plugin-images |
| `partials/card-media.pug` | `div.card__media` of a child-page card | `item` (the child page) | plugin-images |
| `partials/contact-form.pug` | `div.contact__form` of the contact page | `app`, `meta` | plugin-contact-form |

The overrides the business starter uses, ready to copy:

```pug
//- theme/views/partials/nav-main.pug — npx nera-navigation
//- The list form, so the theme's labelled <nav> is the only <nav> around it.
include /vendor/plugin-navigation/partials/link-list-navigation
+linkListNav
```

On a multilingual site, give each language its own menu (`elements: { main_en: […], main_de: […] }` in `config/navigation.yaml`) and pass the language's folder as `rootPath`:

```pug
include /vendor/plugin-navigation/partials/link-list-navigation
+linkListNav(((app.nav || {})[`main_${meta.lang || app.lang}`] || { elements: [] }).elements, '', (meta.lang || app.lang) === app.lang ? '/' : `/${meta.lang}`)
```

```pug
//- theme/views/partials/footer-extra.pug — npx nera-social-media-links
//- Never include fontawesome-cdn-link.pug: it loads icons from a CDN.
include /vendor/plugin-social-media-links/social-media-links
```

```pug
//- theme/views/partials/contact-form.pug — npx nera-contact-form
include /vendor/plugin-contact-form/contact-form
```

```pug
//- theme/views/partials/hero-media.pug — npx nera-images
include /vendor/plugin-images/picture
+picture(meta.images && meta.images.image, { alt: meta.image_alt, class: 'hero__image', loading: 'eager' })
```

```pug
//- theme/views/partials/card-media.pug
include /vendor/plugin-images/picture
+picture(item.meta.images && item.meta.images.image, { alt: item.meta.image_alt, class: 'card__image' })
```

A page's image is its `image` frontmatter key (`frontmatter_keys: [image]` in `config/images.yaml`), its text alternative `image_alt`; `hero` holds only the hero's texts. With the hero image rendered eagerly through the seam, set `eager_first: false` in `config/images.yaml`, so it does not compete with the first Markdown image.

## Configuration: `config/theme.yaml`

The theme's `config/theme.yaml` holds every key with a default. Your site's `config/theme.yaml` is deep-merged over it: set only what you change. Arrays (`extra_css`, `footer_links`) are replaced as a whole.

```yaml
label: Business
tokens:
    color:
        bg: '#fbf2e3'          # page background; the text of the hero and the footer
        surface: '#f1e0c3'     # cards, code blocks, the contact form's status line
        text: '#3b2314'        # body text; the background of the hero and the footer
        muted: '#6e4b2e'       # leads, captions, card text
        accent: '#a1400f'      # links, buttons, active navigation, the top rule
        accent_text: '#ffffff' # text on accent (buttons, the skip link)
        border: '#dcc6a3'      # hairlines, card and field borders
        focus: '#1c5f74'       # the :focus-visible outline
    font:
        body: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif"
        heading: "'Fraunces', 'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif"
        mono: "ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"
    size:
        base: '1.0625rem'      # root font size
        measure: '38rem'       # width of running text
        width: '72rem'         # width of header, grids and footer
        radius: '0.5rem'       # corners of cards, buttons, fields
        space: '1.5rem'        # vertical rhythm
extra_css: []
footer_links: []
footer:
    show_hours: true
```

| key | meaning |
|---|---|
| `label` | the theme's human name |
| `tokens.<group>.<name>` | each token becomes the CSS custom property `--theme-<group>-<name>` (`_` → `-`) in an inline `<style>`. A value containing `<`, `>`, `{`, `}` or `;` is dropped, so a typo cannot break out of the rule. `theme.css` repeats every default, so the page is styled even if the `<style>` is blocked (a strict `style-src` CSP). |
| `extra_css` | stylesheets linked after `theme.css`, in order. Only root-absolute paths (`/css/custom.css`) are linked; anything else, `https://…`, `//…` and `/\…` included, or a path with a tab or line break, is ignored. |
| `footer_links` | the footer's legal links: `{ label, href }`. `label` goes through `t()`; `href` is a path or a `{ <lang>: path }` map, and an entry without a path for the page's language is left out. |
| `footer.show_hours` | `false` leaves the opening hours out of the footer |

A site in English and German with an imprint and a privacy page:

```yaml
# your site's config/theme.yaml
footer_links:
    - label: Imprint
      href: { en: /imprint.html, de: /de/impressum.html }
    - label: Privacy
      href: { en: /privacy.html, de: /de/datenschutz.html }
```

**Fonts.** The theme ships no font files. `Fraunces` is only the first name of the heading stack: a visitor who has it installed sees it, everyone else the system serif behind it. To use it (or any web font) for everyone, self-host it: the files in `theme/assets/fonts/`, an `@font-face` in your `custom.css`, the family in `tokens.font.*`. Never a font CDN.

**Another look.** The tokens carry the whole palette, so a different look is a `tokens:` block in your `config/theme.yaml`. The design's plum variant "Fig", with a serif body, a sans-serif for headings and square corners (every contrast pair at least 5.5:1):

```yaml
tokens:
    color: { bg: '#f7f3ee', surface: '#eadfd6', text: '#2e1a2b', muted: '#6a4e63', accent: '#7a2e5c', accent_text: '#ffffff', border: '#d3c3bc', focus: '#0e6b5a' }
    font:
        body: "Charter, 'Bitstream Charter', 'Iowan Old Style', Georgia, serif"
        heading: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    size: { measure: '36rem', width: '68rem', radius: '0' }
```

Keep the contrast pairs listed under [Accessibility](#accessibility-and-privacy) at 4.5:1 when you change colours; the hero and the footer also put `bg` on `text`.

## Translations

Every string the theme renders goes through `t()` with an English key, so an English site needs nothing. For other languages add the keys under `translations.<lang>` in `config/app.yaml`:

```yaml
translations:
    en:
        language_name: English
    de:
        language_name: Deutsch
        Skip to content: Zum Inhalt springen
        Main navigation: Hauptnavigation
        Language: Sprache
        Legal: Rechtliches
        Opening hours: Öffnungszeiten
        Closed: Geschlossen
        Contact details: Kontakt
        Phone: Telefon
        Email: E-Mail
        # your footer_links labels
        Imprint: Impressum
        Privacy: Datenschutz
        # your app.business.hours days and hours_note
        Mon–Fri: Mo–Fr
        Sat: Sa
        Sun: So
        Closed on public holidays: An Feiertagen geschlossen
```

| key | where |
|---|---|
| `Skip to content` | the skip link |
| `Main navigation` | `aria-label` of the header navigation |
| `Language` | `aria-label` of the language switch |
| `Legal` | `aria-label` of the footer's legal links |
| `Opening hours` | heading of the hours in the footer, on the contact page, and on home and default pages with `show_hours: true` |
| `Closed` | an hours row with `closed: true` |
| `Contact details` | heading of the address on the contact page |
| `Phone`, `Email` | the labels before the phone number and the email address |
| `language_name` | each language's own name in the language switch (falls back to the upper-case code) |

The language switch appears when `translations` has two or more languages. For each other language it links the page with the same `slug` in that language, else that language's home page (its `index.html` with the shortest path), else leaves the language out. When no other language is left, there is no switch.

## Overriding the theme

| to change | do this | keeps theme updates for |
|---|---|---|
| a colour, a font, a width | the token in your `config/theme.yaml` | everything |
| a few CSS rules | `theme/assets/css/custom.css` + `extra_css: ['/css/custom.css']` | everything |
| where plugin output goes | override a seam | every other file |
| one partial or page type | copy it to `theme/views/<same path>` | every other file |
| the whole shell | override `layouts/layout.pug` | page types, partials, CSS |
| a new page type | `theme/views/pages/<name>.pug` with `extends ../layouts/layout.pug` | everything |

Never override `assets/css/theme.css` unless you accept losing its updates.

The layout defines these blocks, for your own page types:

| block | where | default |
|---|---|---|
| `head` | end of `<head>`, after `head-extra.pug` | empty |
| `header` | start of `<body>`, after the skip link | the site header |
| `main` | inside `main#main.site-main` | the page's content |
| `footer` | after `</main>` | the site footer |
| `scripts` | end of `<body>` | `scripts-extra.pug` |

```pug
//- theme/views/pages/team.pug
extends ../layouts/layout.pug

block main
    include ../partials/page-header.pug
    .page__body
        != content
    include ../partials/cards.pug
```

The views and partials, all part of the contract: `layouts/layout.pug`; `partials/head.pug`, `tokens.pug`, `helpers.pug`, `header.pug`, `lang-switch.pug`, `footer.pug`, `scripts.pug`, `page-header.pug` (the page's `<h1>` and lead), `cards.pug` (the `cards` of the page), `opening-hours.pug` and `address.pug` (from `app.business`); the seams above; `pages/home.pug`, `default.pug`, `contact.pug`, `list.pug`, `gallery.pug`.

`partials/helpers.pug` defines the functions the views call: `pageLang(page)`, `sameLang(page)`, `homeHref(lang)`, `formatDate(value, lang)`, `isoDate(value)` and `hrefFor(value, lang)`. A layout of your own includes it first (`include ../partials/helpers.pug`). It also defines `themeBusiness`, an object the theme's own views use internally; it is not part of the contract.

### Classes

The theme's public classes, safe to style in your `custom.css`:

- shell: `skip-link`, `site-header`, `site-header__inner`, `site-header__brand`, `site-header__nav`, `lang-switch`, `lang-switch__list`, `lang-switch__item`, `lang-switch__link`, `site-main`, `page__header`, `page__title`, `page__lead`, `page__body`, `site-footer`, `site-footer__inner`, `site-footer__cols`, `site-footer__col`, `site-footer__heading`, `site-footer__legal`, `site-footer__copy`
- hero: `hero`, `hero__inner`, `hero__title`, `hero__text`, `hero__actions`, `hero__media`, `hero__image`, `button`, `button--secondary`
- cards: `cards`, `cards--list`, `cards__title`, `card`, `card__media`, `card__image`, `card__title`, `card__link`, `card__text`
- contact and business facts: `contact`, `contact__form`, `contact__aside`, `opening-hours`, `opening-hours__row`, `opening-hours__days`, `opening-hours__time`, `opening-hours__note`, `address`, `address__line`, `address__link`
- gallery: `gallery`

The plugin classes the theme styles, all optional peer dependencies:

| plugin | peer range | classes |
|---|---|---|
| `@nera-static/plugin-contact-form` | `^1.1.1` | `contact-form` and its elements (`__intro`, `__field`, `__label`, `__label--checkbox`, `__label--radio`, `__label-text`, `__input`, `__input--textarea`, `__input--select`, `__input--checkbox`, `__input--radio`, `__input--error`, `__options`, `__consent`, `__status`, `__submit`); never `__decoy` or `__recipient`, which must stay hidden |
| `@nera-static/plugin-images` | `^1.0.2` | `nera-image`, `nera-image__caption` |
| `@nera-static/plugin-navigation` | `^3.1.0` | `nav`, `nav--list`, `nav__item`, `nav__link`, `nav__link--active`, `nav__link--active-path` — only inside `.site-header__nav`; keep the plugin's default class names |
| `@nera-static/plugin-social-media-links` | `^2.3.0` | `social-media-links`, `social-media-links__list`, `__item`, `__link`, `__icon`, `__label` — only inside `.site-footer` |

## What your site must do

The theme guarantees its own markup. Your content and the plugin output are yours; for `nera check` to report nothing:

1. Keep a `theme/views/` folder (optional with core 4.16.0 or later), and delete the `nera:scaffold-default` starter files from it.
2. Publish every plugin template you use (`npx nera-<plugin>`) and fill the seams; keep plugin-navigation's default class names and call `+linkListNav` (with `rootPath` for a language folder).
3. plugin-contact-form: `npx nera-contact-form` also publishes its client script to `theme/assets/js/contact-form.js`, which the form loads; the theme itself ships none. Give every field a `label`.
4. Never include `fontawesome-cdn-link.pug`; set `open_in_new_tab: false` in `config/social-media-links.yaml`.
5. Set `footer_links` to your imprint and privacy pages, per language, with labels the legal checks recognise (`Imprint`/`Impressum`, `Privacy`/`Datenschutz`); legal texts cite § 5 DDG and the TDDDG, not the TMG or TTDSG.
6. Translate every theme key, `language_name` per language, your `footer_links` labels and the `days` and `hours_note` of your opening hours.
7. Start page bodies at `##`, give every image an `alt`, and the translations of one page the same `slug`.

`test/site/` in this repository is a complete example: the business starter's pages plus a portfolio section, in English and German, with every step above applied, checked in CI with every `nera check` rule on.

## Accessibility and privacy

- Skip link first, one `<main id="main">`, one `<h1>`, no skipped heading level, every theme `<nav>` labelled, `<html lang>` always set, a zoomable viewport, no `target="_blank"`.
- `:focus-visible` gets a 3px outline in the `focus` colour (in the `bg` colour on the dark hero and footer). No animation, no smooth scrolling; the few transitions run only for visitors without a reduced-motion preference.
- The eight default colour pairs reach at least 4.5:1: `text` on `bg` 13.2 and on `surface` 11.3, `muted` 7.0 and 6.0, `accent` 5.8 and 5.0, `accent_text` on `accent` 6.5, `focus` on `bg` 6.4.
- No JavaScript, no cookies or device storage, no request to another host. Narrow screens are handled by CSS alone: the header navigation wraps, the grids and the footer columns stack.

## Versioning

The theme follows semantic versioning over its contract: view, partial, seam and block paths; token names and every `config/theme.yaml` key; the `t()` keys; the frontmatter and `app.*` keys it reads (`app.business` included); the public classes; the plugin classes it styles.

| change | release |
|---|---|
| remove or rename any of these, change an element or its nesting under a public class, change what a key means, raise the `nera.generator` floor, drop a plugin major | major |
| add a view, seam, block, token, key or class; add a plugin major to a peer range; change a token's default | minor (a new `t()` key is named in the [changelog](CHANGELOG.md)) |
| a CSS or markup fix that keeps the contract, an accessibility fix, docs | patch |

## Development

```bash
npm ci
npm run lint
npx vitest run     # builds the fixture site in temporary copies and checks it
```

To look at the fixture site: `cd test/site && npx nera build && npx nera serve`.

`design/` holds the design source the stylesheet was made from (HTML, CSS and token sets); it does not reach the package.

## License

MIT
