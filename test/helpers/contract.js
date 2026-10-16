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

export const PUBLIC_CLASSES = [...SHELL_CLASSES, ...BUSINESS_CLASSES]

// §S3.5 with the peer floors decided for 1.0.0 (D5, §S8).
export const PLUGIN_CLASSES = {
    '@nera-static/plugin-contact-form': {
        range: '^1.1.1',
        classes: [
            'contact-form',
            'contact-form__intro',
            'contact-form__field',
            'contact-form__label',
            'contact-form__label--checkbox',
            'contact-form__label--radio',
            'contact-form__label-text',
            'contact-form__input',
            'contact-form__input--textarea',
            'contact-form__input--select',
            'contact-form__input--checkbox',
            'contact-form__input--radio',
            'contact-form__input--error',
            'contact-form__options',
            'contact-form__consent',
            'contact-form__status',
            'contact-form__submit',
        ],
    },
    '@nera-static/plugin-images': {
        range: '^1.0.2',
        classes: ['nera-image', 'nera-image__caption'],
    },
    '@nera-static/plugin-navigation': {
        range: '^3.1.0',
        classes: ['nav', 'nav--list', 'nav__item', 'nav__link', 'nav__link--active', 'nav__link--active-path'],
    },
    '@nera-static/plugin-social-media-links': {
        range: '^2.3.0',
        classes: [
            'social-media-links',
            'social-media-links__list',
            'social-media-links__item',
            'social-media-links__link',
            'social-media-links__icon',
            'social-media-links__label',
        ],
    },
}

// §S3.5: plugin-contact-form classes the theme must never style, as both
// elements have to stay hidden.
export const UNSTYLED_PLUGIN_CLASSES = ['contact-form__decoy', 'contact-form__recipient']

// The other theme's values, for "Distinct" (§S4.4, §S4.1).
export const BLOG_FONT_BODY = 'Charter, \'Bitstream Charter\', \'Sitka Text\', Cambria, Georgia, serif'
export const BLOG_PAGE_TYPES = ['pages/default.pug', 'pages/home.pug', 'pages/post.pug', 'pages/archive.pug', 'pages/tag.pug']
