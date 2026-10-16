// §S7 "Validates clean" and "Without plugins": `nera validate --json` and
// `nera check --json` report `"ok": true` and `"results": []`, with every
// rule of the validator on (test/site/config/validate.yaml) — the CSS rule
// a11y-reduced-motion included, which reads the built theme.css.
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { describe, expect, inject, it } from 'vitest'
import { ROOT, SITE, loadYaml } from './helpers/site.js'
import { page } from './helpers/html.js'

const builds = inject('builds')
const json = (run) => JSON.parse(run.stdout)
const themeCss = fs.readFileSync(path.join(ROOT, 'assets', 'css', 'theme.css'), 'utf-8')

describe('Validates clean', () => {
    it('nera validate --json reports ok and no results', () => {
        expect(builds.default.validate.code).toBe(0)
        expect(json(builds.default.validate)).toEqual({ ok: true, results: [] })
    })

    it('nera check --json reports ok and no results', () => {
        expect(builds.default.check.code).toBe(0)
        expect(json(builds.default.check)).toEqual({ ok: true, results: [] })
    })

    it('checks the theme\'s stylesheet, copied unchanged into public/', () => {
        expect(fs.readFileSync(path.join(builds.default.public, 'css', 'theme.css'), 'utf-8')).toBe(themeCss)
    })

    it('runs with every rule of nera check on, the opt-in ones included', async () => {
        const require = createRequire(path.join(ROOT, 'package.json'))
        const validate = path.dirname(require.resolve('@nera-static/validate'))
        const { OUTPUT_RULES } = await import(path.join(validate, 'src', 'output-rules.js'))
        const config = loadYaml(path.join(SITE, 'config', 'validate.yaml'))
        const ids = OUTPUT_RULES.map((rule) => rule.id)

        expect(ids).toEqual(expect.arrayContaining(['a11y-form-label', 'a11y-link-lang', 'a11y-target-blank', 'a11y-reduced-motion', 'privacy-storage']))
        expect(Object.keys(config.rules).sort()).toEqual([...ids].sort())
        for (const id of ids) expect(config.rules[id], id).toBe('error')
        expect(config.ignore).toBeUndefined()
    })
})

describe('Without plugins (validate and check)', () => {
    const build = builds.noplugins

    it('nera validate --json reports ok and no results', () => {
        expect(build.validate.code).toBe(0)
        expect(json(build.validate)).toEqual({ ok: true, results: [] })
    })

    it('nera check --json reports ok and no results', () => {
        expect(build.check.code).toBe(0)
        expect(json(build.check)).toEqual({ ok: true, results: [] })
    })

    // theme.css hides an unfilled seam with `:empty`, which whitespace defeats
    it('leaves every unfilled seam wrapper literally empty, so theme.css hides it', () => {
        const wrappers = {
            'index.html': ['hero__media', 'site-footer__col'],
            'contact.html': ['contact__form'],
            [path.join('projects', 'index.html')]: ['card__media'],
        }
        for (const [file, classes] of Object.entries(wrappers)) {
            const html = page(build.public, file)
            for (const name of classes) expect(html, `${file} ${name}`).toContain(`<div class="${name}"></div>`)
        }
        expect(themeCss).toMatch(/\.hero__media:empty[\s\S]*\.card__media:empty[\s\S]*\.contact__form:empty[\s\S]*\.site-footer__col:empty/)
    })
})
