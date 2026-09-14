import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';
import sonarjs from 'eslint-plugin-sonarjs';

const sonarjsPlugin = sonarjs.configs.recommended.plugins.sonarjs;

const config = [
  ...coreWebVitals,
  ...typescript,
  {
    ...sonarjs.configs.recommended,
    rules: {
      ...sonarjs.configs.recommended.rules,
      // Honour the `_`-prefix convention for intentionally-unused args/vars.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // Comment hygiene: own-line comments only, no commented-out code. See templatecentral:standards code-standards/comments.md.
      'no-inline-comments': [
        'error',
        { ignorePattern: 'eslint-|@ts-|prettier-|c8 |istanbul |webpackChunkName' },
      ],
      // recommended leaves this off; templateCentral's comment-hygiene gate requires it.
      'sonarjs/no-commented-code': 'error',
    },
  },
  {
    // shadcn/ui primitives are generated, not hand-edited — prefer-read-only-props
    // fires on their prop typing and can't be fixed without diverging from `shadcn add` output.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    plugins: { sonarjs: sonarjsPlugin },
    rules: { 'sonarjs/prefer-read-only-props': 'off' },
  },
  {
    // Test fixtures legitimately use fake secrets and http:// literals to exercise guards.
    files: ['test/**/*.{test,spec}.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    plugins: { sonarjs: sonarjsPlugin },
    rules: {
      'sonarjs/no-hardcoded-secrets': 'off',
      'sonarjs/no-clear-text-protocols': 'off',
    },
  },
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', '.claude/**'] },
];

export default config;
