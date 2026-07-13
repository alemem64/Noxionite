import { config } from '@fisch0920/config/eslint'
import nextPlugin from '@next/eslint-plugin-next'

export default [
  // Cloudflare 이전(2026-07-13): 빌드 산출물과 어댑터 설정은 lint 제외
  // (open-next.config.ts는 @cloudflare/workers-types를 끌어와 typed lint 메모리를 폭증시킨다)
  {
    ignores: [
      '.open-next/**',
      '.wrangler/**',
      'open-next.config.ts',
      'public/og-images/**'
    ]
  },
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
