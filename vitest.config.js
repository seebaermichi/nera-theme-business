import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['test/**/*.test.js'],
        globalSetup: ['test/global-setup.js'],
        testTimeout: 60000,
        hookTimeout: 180000,
        // The test files only read the shared builds; one worker per file is not needed.
        isolate: false,
    },
})
