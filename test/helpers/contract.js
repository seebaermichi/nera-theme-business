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
