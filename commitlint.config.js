module.exports = {
  extends: ["@commitlint/config-conventional"],
  prompt: {
    messages: {
      skip: ":skip",
      max: "máximo %d caracteres",
      min: "mínimo %d caracteres",
      emptyWarning: "no puede estar vacío",
      upperLimitWarning: "sobre el límite",
      lowerLimitWarning: "bajo el límite",
    },
    questions: {
      type: {
        description: "Tipo de cambio",
        enum: {
          feat: {
            description: "✨ Nueva funcionalidad",
            title: "Features",
          },
          fix: {
            description: "🐛 Corrección de bug",
            title: "Bug Fixes",
          },
          docs: {
            description: "📚 Documentación",
            title: "Documentation",
          },
          style: {
            description: "💎 Formato de código",
            title: "Styles",
          },
          refactor: {
            description: "📦 Refactorización",
            title: "Code Refactoring",
          },
          perf: {
            description: "🚀 Mejora de performance",
            title: "Performance",
          },
          test: {
            description: "🚨 Tests",
            title: "Tests",
          },
          chore: {
            description: "♻️ Mantenimiento",
            title: "Chores",
          },
        },
      },
    },
  },
};
