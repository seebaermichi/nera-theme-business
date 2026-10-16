// Small readers for the built output. The pages are core's beautified HTML,
// so attribute-level regular expressions are enough; no HTML parser needed.
import fs from 'fs'
import path from 'path'

// Every file under `dir` with one of `extensions`, as paths relative to `dir`.
export function listFiles(dir, extensions) {
    const out = []
    const walk = (current) => {
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const full = path.join(current, entry.name)
            if (entry.isDirectory()) walk(full)
            else if (extensions.includes(path.extname(entry.name))) out.push(path.relative(dir, full))
        }
    }
    walk(dir)
    return out.sort()
}

// Every built page as { file, html }.
export function pages(publicDir) {
    return listFiles(publicDir, ['.html']).map((file) => ({
        file,
        html: fs.readFileSync(path.join(publicDir, file), 'utf-8'),
    }))
}

export function page(publicDir, file) {
    return fs.readFileSync(path.join(publicDir, file), 'utf-8')
}

// Count the opening tags of `name` (`<h1>`, `<h1 class="…">`).
export const countTags = (html, name) => (html.match(new RegExp(`<${name}[\\s>]`, 'g')) || []).length

// Every opening tag of `name` as its attribute string.
export const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}(\\s[^>]*)?>`, 'g'))].map((m) => m[1] || '')

// One attribute's value from an attribute string, or undefined.
export function attr(attrs, name) {
    const match = new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attrs)
    return match ? match[1] : undefined
}

// The inner HTML of the first element with `class` among its classes.
export function elementByClass(html, tag, className) {
    const open = new RegExp(`<${tag}\\s[^>]*class="(?:[^"]*\\s)?${className}(?:\\s[^"]*)?"[^>]*>`).exec(html)
    if (!open) return undefined
    let depth = 1
    const re = new RegExp(`<(/?)${tag}[\\s>]`, 'g')
    re.lastIndex = open.index + open[0].length
    let match
    while ((match = re.exec(html))) {
        depth += match[1] ? -1 : 1
        if (depth === 0) return html.slice(open.index + open[0].length, match.index)
    }
    return undefined
}

export const stripTags = (html) => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
