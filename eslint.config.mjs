import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "react-hooks/error-boundaries": "off",
      "react-hooks/static-components": "off",
      "react/jsx-no-comment-textnodes": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "public/sw.js",
      "public/swe-worker-*.js",
      "public/workbox-*.js",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
