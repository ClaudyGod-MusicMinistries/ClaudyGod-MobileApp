module.exports = {
  root: true,
  extends: ['expo', 'eslint:recommended'],
  env: {
    es2021: true,
    node: true,
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  ignorePatterns: ['dist', 'node_modules', '.expo', 'coverage'],
};
