import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ✅ Strict type safety - critical for runtime correctness
      '@typescript-eslint/no-explicit-any': 'error',

      // ⚠️ Unsafe operations - warn to catch but not block
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',

      // ⚠️ Null safety - warn because game dev often has guaranteed existence
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',

      // ✅ Code clarity and self-documenting code
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { accessibility: 'explicit' },
      ],

      // ✅ Code style consistency
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/consistent-generic-constructors': [
        'error',
        'constructor',
      ],

      // ✅ Modern patterns and best practices
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // ❌ Disabled - overkill for this project
      '@typescript-eslint/strict-boolean-expressions': 'off',

      // ✅ Keep disabled - needed for game dev patterns
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'js/**'],
  },
];
