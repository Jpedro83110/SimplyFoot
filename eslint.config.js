// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
    expoConfig,
    eslintPluginPrettierRecommended,
    {
        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.ts', '.tsx'],
                    moduleDirectory: ['src', 'node_modules'],
                },
            },
        },
        ignores: ['dist/*', 'node_modules/*', '.expo/*'],
        rules: {
            'prettier/prettier': [
                'error',
                {
                    endOfLine: 'auto',
                },
            ],
            'no-restricted-imports': [
                'error',
                {
                    name: 'react-use',
                    message:
                        "Please import the specific function from react-use instead of the whole library (e.g. import useTimeout from 'react-use/lib/useTimeout')",
                },
            ],
            curly: ['error', 'all'],
        },
    },
]);
