module.exports = {
    "env": {
      "browser": false,
      "node": true,
      "mocha": true
    },
    "extends": "google",
    "rules": {
      "camelcase": [2, {properties: "never"}],
      "key-spacing": [2, {align: "value"}],
      "max-len": [1, 120],
      "no-eval": 1, // we use it on purpose
      "no-loop-func": 1,
      "no-multi-spaces": 0,
      "no-proto": 1,
      "no-unused-expressions": 1,
      "no-unused-vars": 1,
      "no-warning-comments": 0,
      "quote-props": 1,
      "require-jsdoc": 0,
    }
};
