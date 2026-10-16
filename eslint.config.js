export default [
    {
        ignores: ['node_modules', 'public', 'dist', 'design', 'test/site/public', 'test/site/node_modules'],
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        rules: {
            indent: ['error', 4],
            semi: ['error', 'never'],
            quotes: ['error', 'single'],
            'no-unused-vars': ['warn'],
        },
    },
]
