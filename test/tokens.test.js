// §S7 "Tokens": the defaults of config/theme.yaml are emitted as --theme-*
// custom properties; a site override changes only its token, every other one
// stays at the default read from config/theme.yaml; a value with `}` is not
// emitted.
import path from 'path'
import { describe, expect, inject, it } from 'vitest'
import { ROOT, loadYaml } from './helpers/site.js'
import { page, pages } from './helpers/html.js'

const builds = inject('builds')
const config = loadYaml(path.join(ROOT, 'config', 'theme.yaml'))
const property = (group, name) => `--theme-${group}-${name.replace(/_/g, '-')}`
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const declaration = (group, name, value) => new RegExp(`${escape(property(group, name))}:\\s*${escape(String(value))};`)
const styleOf = (html) => (/<style>([\s\S]*?)<\/style>/.exec(html) || [])[1] || ''
const tokens = Object.entries(config.tokens).flatMap(([group, values]) =>
    Object.entries(values).map(([name, value]) => ({ group, name, value }))
)

describe('Tokens', () => {
    it('reads its defaults from config/theme.yaml, the accent among them', () => {
        expect(tokens.length).toBeGreaterThan(15)
        expect(config.tokens.color.accent).toMatch(/^#[0-9a-f]{6}$/i)
        expect(config.tokens.color.accent).not.toBe('#006400')
    })

    it('emits every default token, the accent included, in one :root rule on every page', () => {
        for (const { file, html } of pages(builds.default.public)) {
            const style = styleOf(html)
            expect(style, file).toMatch(/^\s*:root\s*\{/)
            expect(style, file).toMatch(declaration('color', 'accent', config.tokens.color.accent))
            for (const { group, name, value } of tokens) expect(style, `${file}: ${property(group, name)}`).toMatch(declaration(group, name, value))
        }
    })

    it('emits a site override and keeps every other token at its config/theme.yaml default', () => {
        for (const { file, html } of pages(builds.overrides.public)) {
            const style = styleOf(html)
            expect(style, file).toMatch(declaration('color', 'accent', '#006400'))
            expect(style, file).not.toContain(config.tokens.color.accent)
            for (const { group, name, value } of tokens.filter((t) => !(t.group === 'color' && t.name === 'accent'))) {
                expect(style, `${file}: ${property(group, name)}`).toMatch(declaration(group, name, value))
            }
        }
    })

    it('does not emit a value containing }', () => {
        const html = page(builds.overrides.public, 'index.html')
        expect(html).not.toContain('--theme-color-injected')
        expect(html).not.toContain('display:none')
        expect(styleOf(html).match(/[{}]/g)).toEqual(['{', '}'])
    })
})
