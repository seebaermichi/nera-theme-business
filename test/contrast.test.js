// §S7 "Contrast": the eight default pairs of §S2.7, computed from
// config/theme.yaml, each reach 4.5:1 (WCAG 2.2 relative luminance). The
// hero and the footer are dark bands that swap text and bg, so the pairs
// they print text in are checked too.
import path from 'path'
import { describe, expect, it } from 'vitest'
import { ROOT, loadYaml } from './helpers/site.js'

const { color } = loadYaml(path.join(ROOT, 'config', 'theme.yaml')).tokens

const luminance = (hex) => {
    const match = /^#([0-9a-f]{6})$/i.exec(hex)
    if (!match) throw new Error(`not a #rrggbb colour: ${hex}`)
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(match[1].slice(i, i + 2), 16) / 255)
        .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (a, b) => {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (light + 0.05) / (dark + 0.05)
}

const PAIRS = [
    ['text', 'bg'],
    ['text', 'surface'],
    ['muted', 'bg'],
    ['muted', 'surface'],
    ['accent', 'bg'],
    ['accent', 'surface'],
    ['accent_text', 'accent'],
    ['focus', 'bg'],
]

// theme.css on the dark bands: bg for text, links, headings and the focus
// outline; border for the footer's copyright line and hours note.
const DARK_BAND_PAIRS = [
    ['bg', 'text'],
    ['border', 'text'],
]

describe('Contrast', () => {
    for (const [fg, bg] of [...PAIRS, ...DARK_BAND_PAIRS]) {
        it(`${fg} on ${bg} reaches 4.5:1`, () => {
            expect(contrast(color[fg], color[bg])).toBeGreaterThanOrEqual(4.5)
        })
    }

    it('matches the ratios recorded for "Crust" in §S3.4', () => {
        const recorded = {
            'text/bg': 13.17,
            'text/surface': 11.27,
            'muted/bg': 6.98,
            'muted/surface': 5.98,
            'accent/bg': 5.81,
            'accent/surface': 4.97,
            'accent_text/accent': 6.45,
            'focus/bg': 6.44,
        }
        for (const [fg, bg] of PAIRS) {
            expect(contrast(color[fg], color[bg]), `${fg}/${bg}`).toBeCloseTo(recorded[`${fg}/${bg}`], 1)
        }
    })
})
