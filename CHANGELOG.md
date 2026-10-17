# Changelog

All notable changes to `@nera-static/theme-business` are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and the theme follows [semantic versioning](https://semver.org/) over its contract (see the README).

## [1.0.0] - 2026-10-16

### Added

-   The "Crust" business theme: `views/`, `assets/css/theme.css` and `config/theme.yaml`, presentation only — no JavaScript, no web fonts, no third-party request.
-   Page types `pages/home.pug` (the hero with `hero.title`, `hero.text`, `hero.cta` and `hero.cta_secondary`, then cards and opening hours), `pages/default.pug` (cards and opening hours), `pages/contact.pug` (the form next to the address and the opening hours), `pages/list.pug` (one card per child page, from `list_dir`, sorted by `order`) and `pages/gallery.pug` (the captioned images of `@nera-static/plugin-images` as a grid).
-   The shell `layouts/layout.pug` with the blocks `head`, `header`, `main`, `footer` and `scripts`; the partials `head.pug`, `tokens.pug`, `helpers.pug` (`pageLang`, `sameLang`, `homeHref`, `formatDate`, `isoDate`, `hrefFor`), `header.pug`, `lang-switch.pug`, `footer.pug` (three columns: business name and address, opening hours, the `footer-extra` seam), `scripts.pug`, `page-header.pug`, `cards.pug`, `opening-hours.pug` and `address.pug`.
-   Seams `head-extra.pug`, `nav-main.pug`, `footer-extra.pug`, `scripts-extra.pug`, `hero-media.pug`, `card-media.pug` and `contact-form.pug`.
-   Design tokens `tokens.color.*` (`bg`, `surface`, `text`, `muted`, `accent`, `accent_text`, `border`, `focus`), `tokens.font.*` (`body`, `heading`, `mono`) and `tokens.size.*` (`base`, `measure`, `width`, `radius`, `space`), emitted as `--theme-*` custom properties; the keys `label`, `extra_css`, `footer_links` and `footer.show_hours`.
-   The frontmatter keys `hero`, `cards`, `cards_title`, `show_hours`, `list_dir` and `order`, and the business facts `app.business` (`name`, `street`, `postal_code`, `city`, `country`, `phone`, `email`, `hours`, `hours_note`) read from the site's `config/app.yaml`.
-   `t()` keys `Skip to content`, `Main navigation`, `Language`, `Legal`, `Opening hours`, `Closed`, `Contact details`, `Phone` and `Email`, plus `language_name` read per language by the language switch.
-   Styles for the classes of `@nera-static/plugin-contact-form` `^1.1.1`, `@nera-static/plugin-images` `^1.0.2`, `@nera-static/plugin-navigation` `^3.1.0` and `@nera-static/plugin-social-media-links` `^2.3.0`, all optional peer dependencies.
-   Requires `@nera-static/core` 4.15.0 or later (`nera.generator: >=4.15.0`).
