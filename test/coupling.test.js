// §S7 "No unlisted plugin coupling": every class selector in theme.css is a
// public class of §S3.6 or a plugin class listed in §S3.5. With it, what
// §S2.5, §S2.7 and §S3.5 demand of the stylesheet itself: every token read
// with the default of config/theme.yaml, no motion outside the
// reduced-motion query, and the contact form's hidden parts left alone.
import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { ROOT, loadYaml } from './helpers/site.js'
import { PLUGIN_CLASSES, PUBLIC_CLASSES, UNSTYLED_PLUGIN_CLASSES } from './helpers/contract.js'

const css = fs.readFileSync(path.join(ROOT, 'assets', 'css', 'theme.css'), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '')
// class selectors only appear in the prelude of a rule, before `{`
const preludes = () => [...css.matchAll(/([^{}]+)\{/g)].map((m) => m[1]).filter((p) => !p.trim().startsWith('@'))
const selectors = () => preludes().flatMap((prelude) => prelude.split(',').map((s) => s.trim()))
const selectorClasses = () => {
    const found = new Set()
    for (const prelude of preludes()) {
        for (const [, name] of prelude.matchAll(/\.([A-Za-z_][\w-]*)/g)) found.add(name)
    }
    return [...found].sort()
}

// `css` without the body of every `@media (prefers-reduced-motion: no-preference)`.
const outsideNoPreference = () => {
    let out = css
    for (;;) {
        const start = out.search(/@media\s*\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)\s*\{/)
        if (start === -1) return out
        let depth = 0
        let end = out.indexOf('{', start)
        for (; end < out.length; end++) {
            if (out[end] === '{') depth++
            else if (out[end] === '}' && --depth === 0) break
        }
        out = out.slice(0, start) + out.slice(end + 1)
    }
}

describe('No unlisted plugin coupling', () => {
    it('uses only public classes and listed plugin classes', () => {
        const allowed = new Set([...PUBLIC_CLASSES, ...Object.values(PLUGIN_CLASSES).flatMap((p) => p.classes)])
        const classes = selectorClasses()
        expect(classes.length).toBeGreaterThan(60)
        expect(classes.filter((name) => !allowed.has(name))).toEqual([])
    })

    it('styles plugin-navigation only under .site-header__nav and social-media-links only under .site-footer', () => {
        for (const selector of selectors()) {
            if (/\.nav(?![\w-])|\.nav(--|__)/.test(selector)) expect(selector).toMatch(/^\.site-header__nav /)
            if (/\.social-media-links/.test(selector)) expect(selector).toMatch(/^\.site-footer /)
        }
    })

    it('never styles contact-form__decoy or contact-form__recipient', () => {
        for (const name of UNSTYLED_PLUGIN_CLASSES) expect(css).not.toContain(name)
        // and no rule reaches them from the form through a classless subject
        // (`.contact-form > div`, `.contact-form span`): a rule below the form
        // itself always names the plugin class it styles
        for (const selector of selectors()) {
            if (!/\.contact-form(?![\w-])\s*[\s>+~]/.test(selector)) continue
            const subject = selector.split(/\s*[\s>+~]\s*/).pop()
            expect(subject, selector).toMatch(/^\.contact-form__/)
        }
    })
})

describe('Tokens in the stylesheet', () => {
    const defaults = loadYaml(path.join(ROOT, 'config', 'theme.yaml')).tokens
    const uses = [...css.matchAll(/var\(\s*(--theme-[\w-]+)\s*(?:,\s*([^()]*?))?\s*\)/g)]

    it('reads only the tokens of §S2.5', () => {
        const names = new Set(Object.entries(defaults).flatMap(([group, values]) =>
            Object.keys(values).map((key) => `--theme-${group}-${key.replace(/_/g, '-')}`)))
        expect(uses.length).toBeGreaterThan(100)
        // a fallback with parentheses would escape `uses`, and so this check
        expect(uses.length).toBe(css.match(/var\(\s*--theme-/g).length)
        for (const [, name] of uses) expect(names.has(name), name).toBe(true)
        expect(new Set(uses.map(([, name]) => name))).toEqual(names)
    })

    it('reads every token with the default of config/theme.yaml as its fallback', () => {
        for (const [use, name, fallback] of uses) {
            const [, group, key] = /^--theme-(\w+)-(.+)$/.exec(name)
            expect(fallback, use).toBe(defaults[group][key.replace(/-/g, '_')])
        }
    })
})

describe('Motion', () => {
    it('has no animation and no smooth scrolling', () => {
        expect(css).not.toMatch(/(^|[\s;{])animation(-name)?\s*:/m)
        expect(css).not.toMatch(/scroll-behavior\s*:\s*smooth/)
    })

    it('has transitions only inside @media (prefers-reduced-motion: no-preference)', () => {
        expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)/)
        expect(css).toMatch(/transition\s*:/)
        expect(outsideNoPreference()).not.toMatch(/transition(-[\w-]+)?\s*:/)
    })

    it('gives :focus-visible a 3px outline in the focus token', () => {
        expect(css).toMatch(/(^|\n):focus-visible\s*\{\s*outline:\s*3px solid var\(--theme-color-focus, #1c5f74\);/)
    })

    it('draws the card focus ring inside the card, which clips its overflow', () => {
        expect(css).toMatch(/\n\.card\s*\{[^}]*overflow:\s*hidden;/)
        const ring = /\n\.card__link:focus-visible::after\s*\{([^}]*)\}/.exec(css)
        expect(ring).not.toBeNull()
        expect(ring[1]).toMatch(/outline:\s*3px solid var\(--theme-color-focus, #1c5f74\);/)
        expect(Number(/outline-offset:\s*(-?[\d.]+)px/.exec(ring[1])?.[1])).toBeLessThanOrEqual(-3)
    })
})
