module.exports = {
  env: {
    commonjs: true,
    jest: true,
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'no-param-reassign': 0,
    'no-underscore-dangle': 0,
  },
};
