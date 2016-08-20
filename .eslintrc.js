module.exports = {
    "extends": "google",
    "rules": {
      "key-spacing": [2, { "align": "value" }],
      "no-eval": 1, // we use it on purpose
      "no-multi-spaces": [2, { exceptions: { "SwitchCase": true }}],
      "no-unused-expressions": 1,
      "no-unused-vars": 1,
      "quote-props": 1,
      "require-jsdoc": 0,  // currently we don't need JSDoc
    }
};
