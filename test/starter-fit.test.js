// §S7 "Starter fit (business)": the contact page renders plugin-contact-form's
// form through the contact-form seam, every control associated with a label
// (`a11y-form-label` clean, the rule at `error`). The form's client script is
// the site's own, same-origin and storage-free, so the `privacy-*` rules have
// nothing to find.
import fs from 'fs'
import path from 'path'
import { describe, expect, inject, it } from 'vitest'
import { SITE, loadYaml } from './helpers/site.js'
import { attr, elementByClass, page, tags } from './helpers/html.js'

const builds = inject('builds')
const pub = builds.default.public
const CONTROLS = ['input', 'select', 'textarea']

describe('Starter fit (business)', () => {
    for (const file of ['contact.html', 'de/kontakt.html']) {
        it(`${file}: renders plugin-contact-form's form inside div.contact__form`, () => {
            const form = elementByClass(page(pub, file), 'div', 'contact__form')
            expect(form).toMatch(/^\s*<form class="contact-form" novalidate data-contact-form>/)
            const fields = loadYaml(path.join(SITE, 'config', 'contact-form.yaml')).fields
            for (const field of fields) {
                const ids = field.type === 'radio' ? field.options.map((_, i) => `contact-${field.name}-${i}`) : [`contact-${field.name}`]
                for (const id of ids) expect(form, field.name).toContain(`id="${id}"`)
            }
            expect(form).toMatch(/<button class="contact-form__submit" type="submit">/)
        })

        it(`${file}: associates every form control with a <label for>`, () => {
            const form = elementByClass(page(pub, file), 'div', 'contact__form')
            const ids = CONTROLS.flatMap((name) => tags(form, name)).map((attrs) => attr(attrs, 'id'))
            const labelled = new Set(tags(form, 'label').map((attrs) => attr(attrs, 'for')))
            // name, email, topic, two reply_by radios, message, privacy and the honeypot
            expect(ids.length).toBe(8)
            for (const id of ids) {
                expect(id).toBeTruthy()
                expect(labelled.has(id), id).toBe(true)
            }
        })

        it(`${file}: renders the checkbox and the radio group in plugin-contact-form's markup`, () => {
            const form = elementByClass(page(pub, file), 'div', 'contact__form')
            for (const name of [
                'contact-form__label--checkbox',
                'contact-form__input--checkbox',
                'contact-form__label--radio',
                'contact-form__input--radio',
                'contact-form__options',
                'contact-form__label-text',
            ]) {
                expect(form, name).toMatch(new RegExp(`class="[^"]*\\b${name}(?![\\w-])`))
            }
            const group = elementByClass(form, 'div', 'contact-form__options')
            expect(group).toMatch(/^\s*<label class="contact-form__label contact-form__label--radio" for="contact-reply_by-0">/)
            expect(tags(group, 'input').map((attrs) => attr(attrs, 'type'))).toEqual(['radio', 'radio'])
            expect(form).toMatch(/<label class="contact-form__label contact-form__label--checkbox" for="contact-privacy"><input class="contact-form__input contact-form__input--checkbox" type="checkbox" id="contact-privacy"/)
        })
    }

    it('translates the form on the German contact page', () => {
        const form = elementByClass(page(pub, 'de/kontakt.html'), 'div', 'contact__form')
        for (const text of ['>Ihr Name</label>', '>Ihre E-Mail-Adresse</label>', '>Thema</label>', '<span class="contact-form__label">Antwort per</span>', '>Telefon</span></label>', '>Nachricht</label>', '>Ich habe die Datenschutzerklärung gelesen</span></label>', '>Nachricht senden</button>', 'href="/de/datenschutz.html"']) {
            expect(form).toContain(text)
        }
    })

    it('runs every nera check rule at error and finds nothing, a11y-form-label included', () => {
        const rules = loadYaml(path.join(SITE, 'config', 'validate.yaml')).rules
        expect(rules['a11y-form-label']).toBe('error')
        expect(Object.values(rules).every((level) => level === 'error')).toBe(true)
        const report = JSON.parse(builds.default.check.stdout)
        expect(report.results).toEqual([])
        expect(report.ok).toBe(true)
        expect(builds.default.check.code).toBe(0)
    })

    it('serves the form\'s client script from the site itself, without device storage or another host', () => {
        const script = fs.readFileSync(path.join(pub, 'js', 'contact-form.js'), 'utf-8')
        expect(script).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie|https?:\/\//)
    })
})
