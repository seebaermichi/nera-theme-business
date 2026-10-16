// The theme's contract as ROADMAP-themes.md states it (§S2, §S3), in one
// place for the tests.

export const VIEWS = [
    'layouts/layout.pug',
    'partials/head.pug',
    'partials/tokens.pug',
    'partials/helpers.pug',
    'partials/header.pug',
    'partials/lang-switch.pug',
    'partials/footer.pug',
    'partials/scripts.pug',
]

// §S3.1: the page types (the `layout:` values) and the partials they use.
export const PAGE_TYPES = ['pages/default.pug', 'pages/home.pug', 'pages/contact.pug', 'pages/list.pug', 'pages/gallery.pug']

export const BUSINESS_PARTIALS = [
    'partials/page-header.pug',
    'partials/cards.pug',
    'partials/address.pug',
    'partials/opening-hours.pug',
]

// §S3.2
export const BUSINESS_SEAMS = ['partials/hero-media.pug', 'partials/card-media.pug', 'partials/contact-form.pug']

export const SEAMS = [
    'partials/head-extra.pug',
    'partials/nav-main.pug',
    'partials/footer-extra.pug',
    'partials/scripts-extra.pug',
]

export const BLOCKS = ['head', 'header', 'main', 'footer', 'scripts']

export const HELPERS = ['pageLang', 'sameLang', 'homeHref', 'formatDate', 'isoDate', 'hrefFor']

export const TOKENS = {
    color: ['bg', 'surface', 'text', 'muted', 'accent', 'accent_text', 'border', 'focus'],
    font: ['body', 'heading', 'mono'],
    size: ['base', 'measure', 'width', 'radius', 'space'],
}

export const THEME_KEYS = ['label', 'tokens', 'extra_css', 'footer_links', 'footer']

export const T_KEYS = [
    // shared (§S2.6)
    'Skip to content',
    'Main navigation',
    'Language',
    'Legal',
    // business (§S3.3)
    'Opening hours',
    'Closed',
    'Contact details',
    'Phone',
    'Email',
]

export const SHELL_CLASSES = [
    'skip-link',
    'site-header',
    'site-header__inner',
    'site-header__brand',
    'site-header__nav',
    'lang-switch',
    'lang-switch__list',
    'lang-switch__item',
    'lang-switch__link',
    'site-main',
    'site-footer',
    'site-footer__inner',
    'site-footer__legal',
    'site-footer__copy',
]

// §S3.6, the classes beyond the shell.
export const BUSINESS_CLASSES = [
    'page__header',
    'page__title',
    'page__lead',
    'page__body',
    'hero',
    'hero__inner',
    'hero__title',
    'hero__text',
    'hero__actions',
    'hero__media',
    'hero__image',
    'button',
    'button--secondary',
    'cards',
    'cards--list',
    'cards__title',
    'card',
    'card__media',
    'card__image',
    'card__title',
    'card__link',
    'card__text',
    'contact',
    'contact__form',
    'contact__aside',
    'gallery',
    'opening-hours',
    'opening-hours__row',
    'opening-hours__days',
    'opening-hours__time',
    'opening-hours__note',
    'address',
    'address__line',
    'address__link',
    'site-footer__cols',
    'site-footer__col',
    'site-footer__heading',
]
