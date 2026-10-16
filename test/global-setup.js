// Build every fixture variant once, in parallel, before the test files run,
// and hand the results to them (`inject('builds')`). The temporary copies are
// removed afterwards.
import fs from 'fs'
import { VARIANTS, buildVariant } from './helpers/site.js'

let builds = {}

export async function setup(project) {
    const results = await Promise.all(Object.keys(VARIANTS).map(buildVariant))
    builds = Object.fromEntries(results.map((result) => [result.name, result]))
    project.provide('builds', builds)
}

export function teardown() {
    for (const { base } of Object.values(builds)) {
        fs.rmSync(base, { recursive: true, force: true })
    }
}
