import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      // Generated song data — 6k lines of PDF-extracted content
      'src/data/jebathotta-jeyageethangal.ts',
      // Ad-hoc local diagnostic scripts, not part of the app
      'check_outline.mjs',
      'dist-test.cjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Warnings for existing debt; new code should keep these at zero.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Pre-existing pattern in several data-sync hooks; burn down gradually.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Node scripts (admin tooling, dev launcher) run outside the browser.
    files: ['scripts/**/*.mjs', 'server.ts'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        AbortController: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Buffer: 'readonly',
        crypto: 'readonly',
      },
    },
  },
);
