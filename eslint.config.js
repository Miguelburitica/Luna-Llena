import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import globals from 'globals'
import luna from '@luna/eslint-rules'

const layer = (name) => `(^|/)${name}(/|$)`

const restrictLayers = (forbidden, extraPaths = []) => ({
  'no-restricted-imports': [
    'error',
    {
      paths: extraPaths,
      patterns: forbidden.map((name) => ({
        regex: layer(name),
        message: `This layer must not depend on ${name}. See openspec/config.yaml (architecture).`
      }))
    }
  ]
})

const frameworkPackages = ['vue', 'vue-router', 'pinia', 'vue-i18n', 'socket.io', 'socket.io-client'].map((name) => ({
  name,
  message: 'The domain layer stays framework-free.'
}))

const testSupport = ['**/*.test.ts', '**/*.fixtures.ts']

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', 'design/**', '.claude/**', 'openspec/**'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tseslint.parser, sourceType: 'module', extraFileExtensions: ['.vue'] }
    }
  },
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { luna },
    rules: {
      'luna/no-comments': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-self-closing': ['error', { html: { void: 'any', normal: 'always', component: 'always' } }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  {
    files: ['**/domain/**/*.{ts,vue}'],
    ignores: testSupport,
    rules: restrictLayers(['application', 'infrastructure'], frameworkPackages)
  },
  { files: ['**/application/**/*.{ts,vue}'], ignores: testSupport, rules: restrictLayers(['infrastructure']) }
)
