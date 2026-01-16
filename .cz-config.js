module.exports = {
  types: [
    { value: "feat", name: "feat:     Nueva funcionalidad" },
    { value: "fix", name: "fix:      Corrección de bug" },
    { value: "docs", name: "docs:     Documentación" },
    { value: "style", name: "style:    Formato de código" },
    { value: "refactor", name: "refactor: Refactorización" },
    { value: "test", name: "test:     Tests" },
    { value: "chore", name: "chore:    Mantenimiento" },
    { value: "ci", name: "ci:       CI/CD" },
    { value: "build", name: "build:    Build system" },
  ],

  scopes: [
    { name: "legislators", description: "Gestión de legisladores" },
    { name: "candidates", description: "Gestión de candidatos" },
    { name: "parties", description: "Partidos políticos" },
    { name: "auth", description: "Autenticación y autorización" },
    { name: "ui", description: "Componentes de interfaz" },
    { name: "config", description: "Configuración del proyecto" },
    { name: "tooling", description: "Herramientas de desarrollo" },
    { name: "deps", description: "Dependencias" },
    { name: "docs", description: "Documentación" },
  ],

  scopeOverrides: {
    feat: [
      { name: "candidates", description: "Nueva funcionalidad de candidatos" },
      { name: "ui", description: "Nuevo componente o página" },
    ],
    fix: [
      { name: "auth", description: "Bug en autenticación" },
      { name: "ui", description: "Bug visual o de componentes" },
    ],
  },

  allowCustomScopes: true,
  allowBreakingChanges: ["feat", "fix"],
  skipQuestions: ["body", "footer"],

  messages: {
    type: "Selecciona el tipo de cambio que estás haciendo:",
    scope: "\nSelecciona el SCOPE (área del cambio):",
    customScope: "Escribe un scope personalizado:",
    subject: "Escribe una descripción CORTA e IMPERATIVA del cambio:\n",
    body: 'Escribe una descripción DETALLADA (opcional). Usa "|" para nuevas líneas:\n',
    breaking: "Lista cualquier BREAKING CHANGE (opcional):\n",
    footer:
      "Lista cualquier ISSUE cerrado por este cambio (opcional). Ej: #31, #34:\n",
    confirmCommit: "¿Estás seguro de continuar con el commit anterior?",
  },

  usePreparedCommit: false,
  allowTicketNumber: false,
  isTicketNumberRequired: false,
  ticketNumberPrefix: "TICKET-",
  ticketNumberRegExp: "\\d{1,5}",

  subjectLimit: 100,
  breaklineChar: "|",
  footerPrefix: "ISSUES CLOSED:",
  breakingPrefix: "BREAKING CHANGE:",
};
