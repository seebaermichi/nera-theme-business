// §S7 "Plugin classes exist": every plugin class of §S3.5 is found in the
// plugin package at its peer floor (the installed files are the npm tarball's).
// Computed classes are matched by their source, as §S8 records.
import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { ROOT } from './helpers/site.js'
import { PLUGIN_CLASSES } from './helpers/contract.js'
import { listFiles } from './helpers/html.js'

// The plugins export only their entry, not ./package.json, so read them from
// node_modules directly.
const packageDir = (name) => path.join(ROOT, 'node_modules', ...name.split('/'))
const floor = (range) => range.replace(/^\^/, '')

// §S8: classes the plugin builds at runtime, matched by the source that emits them.
const COMPUTED = {
    nav: /navBlock = \(app\.nav && app\.nav\.navClass\) \|\| 'nav'/,
    'nav--list': /`\$\{navBlock\}--list`/,
    'nav__item': /`\$\{navBlock\}__item`/,
    'nav__link': /`\$\{navBlock\}__link`/,
    'nav__link--active': /'nav__link--active'/,
    'nav__link--active-path': /'nav__link--active-path'/,
}

describe('Plugin classes exist', () => {
    for (const [name, { range, classes }] of Object.entries(PLUGIN_CLASSES)) {
        it(`${name}: installed at the peer floor ${floor(range)}`, () => {
            const { version } = JSON.parse(fs.readFileSync(path.join(packageDir(name), 'package.json'), 'utf-8'))
            // navigation's lockfile resolves 3.1.1 for ^3.1.0 (3.1.0 is the floor;
            // 3.1.1 changed no class), every other peer is installed at its floor.
            if (name === '@nera-static/plugin-navigation') expect(version).toMatch(/^3\.1\.\d+$/)
            else expect(version).toBe(floor(range))
        })

        it(`${name}: every class of §S3.5 is in the package`, () => {
            const dir = packageDir(name)
            const source = listFiles(dir, ['.pug', '.js', '.css'])
                .filter((file) => !file.startsWith('node_modules'))
                .map((file) => fs.readFileSync(path.join(dir, file), 'utf-8'))
                .join('\n')
            for (const cls of classes) {
                if (COMPUTED[cls]) expect(source, cls).toMatch(COMPUTED[cls])
                else expect(source, cls).toMatch(new RegExp(`(^|[^\\w-])${cls}(?![\\w-])`, 'm'))
            }
        })
    }
})
