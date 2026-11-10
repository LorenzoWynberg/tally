const sharedRules = {
  "no-unused-vars": "error",
  "no-undef": "error",
  eqeqeq: "error",
  "no-var": "error",
  "prefer-const": "error",
};

module.exports = [
  { ignores: ["node_modules/**", "playwright-report/**", "test-results/**"] },
  {
    files: ["app.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
      },
    },
    rules: sharedRules,
  },
  {
    files: ["eslint.config.js", "playwright.config.js", "tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        process: "readonly",
        // Tests pass callbacks into the browser via page.evaluate / addInitScript.
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        getComputedStyle: "readonly",
        DOMException: "readonly",
        URL: "readonly",
      },
    },
    rules: sharedRules,
  },
];
