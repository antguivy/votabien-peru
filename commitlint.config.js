module.exports = {
  extends: ["@commitlint/config-conventional"],
  helpUrl:
    '\n\n💡 Tip: Usa "pnpm commit" para un asistente interactivo\n' +
    "   o sigue el formato: tipo(scope): descripción\n",
  rules: {
    "scope-enum": [
      1,
      "always",
      [
        "legislators",
        "candidates",
        "parties",
        "auth",
        "ui",
        "config",
        "tooling",
        "deps",
      ],
    ],
    "scope-empty": [0],
  },
};
