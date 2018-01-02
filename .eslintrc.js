module.exports = {
    "env": {
      "browser": false,
      "es6": true,
      "mocha": true,
      "node": true
    },
    "extends": [
      "google",
      "eslint:recommended"
    ],
    "rules": {
      "block-spacing": [2, "always"],
      "brace-style": [2, "1tbs", { "allowSingleLine": true }],
      "camelcase": [2, {properties: "never"}],
      "comma-dangle": 0,
      "curly": 0,
      "key-spacing": [2, {align: "value"}],
      "max-len": [1, 120],
      "no-console": 1,
      "no-empty": [2, { "allowEmptyCatch": true }],
      "no-eval": 1, // we use it on purpose
      "no-loop-func": 1,
      "no-multi-spaces": 0,
      "no-proto": 1,
      "no-unused-expressions": 1,
      "no-unused-vars": 1,
      "no-var": 0,
      "no-warning-comments": 0,
      "prefer-rest-params": 0,
      "prefer-spread": 0,
      "quote-props": 1,
      "quotes": [2, "single", {avoidEscape: true}],
      "require-jsdoc": 0,
    }
};
