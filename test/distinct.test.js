// §S7 "Distinct": business's body font is a sans-serif stack, unlike blog's
// serif default, and business's page types differ from blog's (§S3.1 vs §S4.1).
import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { ROOT, loadYaml } from './helpers/site.js'
import { BLOG_FONT_BODY, BLOG_PAGE_TYPES, PAGE_TYPES } from './helpers/contract.js'

describe('Distinct', () => {
    it('uses a sans-serif body font, not blog\'s serif default', () => {
        const body = loadYaml(path.join(ROOT, 'config', 'theme.yaml')).tokens.font.body
        expect(body).toMatch(/(^|,\s*)sans-serif$/)
        expect(body).not.toBe(BLOG_FONT_BODY)
        expect(BLOG_FONT_BODY).toMatch(/(^|,\s*)serif$/)
    })

    it('has a different set of page types than blog', () => {
        const shipped = fs.readdirSync(path.join(ROOT, 'views', 'pages')).map((f) => `pages/${f}`).sort()
        expect(shipped).toEqual([...PAGE_TYPES].sort())
        expect(shipped).not.toEqual([...BLOG_PAGE_TYPES].sort())
    })
})
