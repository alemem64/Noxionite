import { config } from '@fisch0920/config/eslint'
import nextPlugin from '@next/eslint-plugin-next'

export default [
  ...config,
  {
    files: ['**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@next/next': nextPlugin
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      'react/prop-types': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/prefer-global-this': 'off',
      'no-process-env': 'off',
      'array-callback-return': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/media-has-caption': 'off',
      'jsx-a11y/interactive-supports-focus': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      '@typescript-eslint/naming-convention': 'off',
      'simple-import-sort/imports': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      'react/function-component-definition': 'off',
      'unicorn/prefer-string-replace-all': 'off',
      'unicorn/prefer-number-properties': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/prefer-modern-math-apis': 'off',
      'unicorn/no-useless-switch-case': 'off',
      'unicorn/no-array-for-each': 'off'
    }
  }
]
