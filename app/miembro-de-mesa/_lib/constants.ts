import {
  PhaseDefinition,
  VoteScenario,
  SecurityEnvelope,
  ProtocolItem,
} from "./types";

export const OFFICIAL_ERM_2026_PARTIES = [
  "Alianza para el Progreso",
  "Somos Perú",
  "Renovación Popular",
  "Fuerza Popular",
  "Juntos por el Perú",
  "Perú Libre",
  "Podemos Perú",
  "Avanza País",
  "Partido Morado",
  "Frente de la Esperanza",
  "Acción Popular",
  "Partido Patriótico del Perú",
];

export const PHASES_CONFIG: PhaseDefinition[] = [
  {
    id: "instalacion",
    title: "1. Instalación",
    subtitle: "Apertura, verificación y firmas iniciales",
    timeframe: "06:00 AM – 07:00 AM",
    color: "from-blue-600 to-indigo-700",
    warningAlert:
      "CRÍTICO: No permitas el inicio de votación sin haber contado las cédulas y firmado sus reversos.",
    tasks: [
      {
        id: "inst-01",
        phaseId: "instalacion",
        title: "Recepción y apertura de la caja de material",
        description:
          "El Presidente recibe la caja sellada de la ONPE. Se abre entre todos los miembros de mesa para revisar los paquetes de útiles, instalación y escrutinio (Manual Pág. 8, paso 1).",
        isCritical: true,
        roleResponsible: "Todos",
      },
      {
        id: "inst-02",
        phaseId: "instalacion",
        title: "Revisión física del aula y cámara secreta",
        description:
          "Verificar que la 'Relación de electores' esté pegada en la puerta del aula y los carteles de candidatos en la cámara secreta. Los personeros pueden participar (Pág. 9, paso 3).",
        isCritical: false,
        roleResponsible: "Todos",
      },
      {
        id: "inst-03",
        phaseId: "instalacion",
        title: "Rotulado de caja de 'Restos Electorales'",
        description:
          "Pegar la etiqueta oficial 'Restos Electorales' en la caja vacía y colocarla al costado de la mesa (Pág. 8, paso 2).",
        isCritical: false,
        roleResponsible: "Coordinación Interna",
      },
      {
        id: "inst-04",
        phaseId: "instalacion",
        title: "Conteo físico de Cédulas de Sufragio",
        description:
          "Verificar en el rótulo del paquete de cédulas que la cantidad sea igual al número de electores hábiles de la mesa (Pág. 9, paso 4).",
        isCritical: true,
        irreversibleWarning:
          "Si hay faltante o sobrante de cédulas sin abrir la mesa, repórtalo de inmediato al coordinador de ONPE.",
        roleResponsible: "Todos",
      },
      {
        id: "inst-05",
        phaseId: "instalacion",
        title: "Firma obligatoria en el reverso de las cédulas",
        description:
          "Las firman los tres miembros de mesa en el reverso. Pueden firmar un primer grupo para abrir y luego el resto. Los personeros solo firman si lo desean (Pág. 9, paso 4).",
        isCritical: true,
        irreversibleWarning:
          "¡ALERTA MÁXIMA! Cédula sin firma de miembros en el reverso será declarada NULA en el escrutinio.",
        roleResponsible: "Todos",
        legalNote: "Manual ONPE 2026 Pág. 9, paso 4",
      },
      {
        id: "inst-06",
        phaseId: "instalacion",
        title: "Control de Asistencia (Hoja 3a)",
        description:
          "El Secretario llama en voz alta a cada miembro para firmar y colocar huella. Escribe 'FALTÓ' a ausentes. El Presidente marca si recibió información de Reniec y refrigerios, y firma (Pág. 10, paso 5).",
        isCritical: true,
        roleResponsible: "Secretario",
      },
      {
        id: "inst-07",
        phaseId: "instalacion",
        title: "Llenado de Actas de Instalación (Sección A)",
        description:
          "Llenar en letras y números claros las 4 actas regionales y 4 municipales: hora de inicio, estado del material y cantidad de cédulas. Firman los tres miembros (Pág. 11, paso 6).",
        isCritical: true,
        roleResponsible: "Secretario",
      },
    ],
  },
  {
    id: "sufragio",
    title: "2. Sufragio",
    subtitle: "Atención al elector y distribución de puestos",
    timeframe: "07:00 AM – 05:00 PM",
    color: "from-emerald-600 to-teal-700",
    warningAlert:
      "Votan primero el Presidente y los miembros presentes, luego personeros acreditados de esa mesa y finalmente los electores.",
    tasks: [
      {
        id: "suf-01",
        phaseId: "sufragio",
        title: "Votación inicial de autoridades de mesa",
        description:
          "Primero vota el Presidente y de inmediato los demás miembros presentes. Luego personeros que voten en esa mesa (Pág. 12).",
        isCritical: false,
        roleResponsible: "Todos",
      },
      {
        id: "suf-02",
        phaseId: "sufragio",
        title: "Distribución de los 3 puestos de atención",
        description:
          "Presidente: administra cédulas y DNI. Un miembro: maneja Lista de Electores y tampón. Otro miembro: custodia el ánfora (Pág. 12, paso 1).",
        isCritical: true,
        roleResponsible: "Coordinación Interna",
      },
      {
        id: "suf-03",
        phaseId: "sufragio",
        title: "Circuito de atención en 6 pasos",
        description:
          "1. Presidente solicita DNI. 2. Encargado de lista busca número de orden y valida foto. 3. Presidente entrega cédula. 4. Encargado de ánfora vigila depósito. 5. Elector firma y huella. 6. Presidente devuelve DNI (Págs. 12-13).",
        isCritical: true,
        roleResponsible: "Todos",
      },
      {
        id: "suf-04",
        phaseId: "sufragio",
        title: "Atención preferente y Módulo Temporal (MTV)",
        description:
          "Prioridad a adultos mayores, gestantes y personas con discapacidad. Si hay baja movilidad en el MTV, trasladarse con cédula, lista, tampón y ánfora (Pág. 2 PDF).",
        isCritical: false,
        roleResponsible: "Coordinación Interna",
      },
    ],
  },
  {
    id: "cierre",
    title: "3. Cierre de Sufragio",
    subtitle: "05:00 PM: Cierre de puertas y consolidación del padrón",
    timeframe: "05:00 PM puntual",
    color: "from-amber-600 to-orange-700",
    warningAlert:
      "A las 5:00 PM se cierran las puertas del local. Solo sufragan quienes ya estaban en la fila dentro del aula.",
    tasks: [
      {
        id: "cie-01",
        phaseId: "cierre",
        title: "Declaración de cierre de votación",
        description:
          "Cerrar la votación a las 5:00 p.m. Votan únicamente los ciudadanos que se encuentren formados (Pág. 2 PDF).",
        isCritical: true,
        roleResponsible: "Presidente",
      },
      {
        id: "cie-02",
        phaseId: "cierre",
        title: "Sello o marcado de 'NO VOTÓ' a ausentes",
        description:
          "Revisar la Lista de Electores página por página. Escribir o sellar 'NO VOTÓ' en el espacio de firma de cada ciudadano que no acudió (Pág. 2 PDF).",
        isCritical: true,
        irreversibleWarning:
          "No olvides marcar a los ausentes antes de sumar el total general de firmas.",
        roleResponsible: "Secretario",
      },
      {
        id: "cie-03",
        phaseId: "cierre",
        title: "Conteo de firmas y firma del Presidente al pie",
        description:
          "Sumar firmas y huellas por página y el total general. El Presidente firma obligatoriamente al pie de la última página de la lista (Pág. 2 PDF).",
        isCritical: true,
        irreversibleWarning:
          "Este número de votantes (ej: 245) es el valor obligatorio que debe cuadrar en todo el escrutinio.",
        roleResponsible: "Todos",
      },
      {
        id: "cie-04",
        phaseId: "cierre",
        title: "Llenado de Actas de Sufragio (Sección B)",
        description:
          "Llenar las 8 actas (4 regionales y 4 municipales) con: Total de ciudadanos que votaron, cédulas no usadas, hora y firmas de miembros (Pág. 2 PDF).",
        isCritical: true,
        roleResponsible: "Secretario",
      },
    ],
  },
  {
    id: "escrutinio",
    title: "4. Escrutinio (Conteo)",
    subtitle: "Conteo en hojas borrador, verificación y actas",
    timeframe: "05:30 PM en adelante",
    color: "from-purple-600 to-violet-700",
    warningAlert:
      "¡PELIGRO DE ACTA OBSERVADA! El Total de Votos Emitidos DEBE ser exactamente igual al total de ciudadanos que votaron. Usa la calculadora de cuadre.",
    tasks: [
      {
        id: "esc-01",
        phaseId: "escrutinio",
        title: "Organización de los 3 puestos de conteo",
        description:
          "Presidente al centro: cédulas por escrutar. Un miembro: a cargo de las Hojas Borrador (5a, 5b, 5c, 5d). Otro miembro: a cargo de las cédulas escrutadas (Pág. 24, paso 5).",
        isCritical: true,
        roleResponsible: "Coordinación Interna",
      },
      {
        id: "esc-02",
        phaseId: "escrutinio",
        title: "Apertura de ánfora y verificación de firmas",
        description:
          "Abrir ánfora y contar cédulas sin desdoblar. Deben ser iguales al Acta de Sufragio. Al desdoblar, verificar firma de miembros en el reverso (Pág. 24 y 25).",
        isCritical: true,
        irreversibleWarning:
          "Cédula sin firma en el reverso es declarada nula obligatoriamente.",
        roleResponsible: "Presidente",
      },
      {
        id: "esc-03",
        phaseId: "escrutinio",
        title: "Calificación y canto de votos a personeros",
        description:
          "El Presidente lee cada voto en voz alta y muestra la cédula a los personeros. Toda duda se resuelve en la mesa por mayoría simple (Art. 283 LOE / Pág. 25, paso 6).",
        isCritical: true,
        roleResponsible: "Presidente",
      },
      {
        id: "esc-04",
        phaseId: "escrutinio",
        title: "Trazado de palotes de 5 en 5 en Hoja Borrador",
        description:
          "El miembro a cargo de la hoja borrador escucha y traza un palote por voto agrupados de cinco en cinco. Repetir en 5A, 5B, 5C y 5D (Pág. 25, paso 7).",
        isCritical: true,
        roleResponsible: "Secretario",
      },
      {
        id: "esc-05",
        phaseId: "escrutinio",
        title: "VERIFICACIÓN MATEMÁTICA CON CALCULADORA",
        description:
          "Sumar palotes y registrar Total Votos Emitidos. La ONPE autoriza usar la calculadora del celular (Pág. 26). El total DEBE ser igual al Acta de Sufragio (Pág. 27, paso 9).",
        isCritical: true,
        irreversibleWarning:
          "PROHIBIDO transcribir al acta oficial si no cuadra. Si persiste diferencia, se anota en Observaciones.",
        roleResponsible: "Todos",
      },
      {
        id: "esc-06",
        phaseId: "escrutinio",
        title: "Traslado a Actas de Escrutinio (Sección C)",
        description:
          "Copiar resultados a las 8 actas oficiales con letra clara. Firman los 3 miembros y personeros (Pág. 2 PDF).",
        isCritical: true,
        roleResponsible: "Secretario",
      },
      {
        id: "esc-07",
        phaseId: "escrutinio",
        title: "Colocación de láminas plásticas autoadhesivas",
        description:
          "Colocar láminas de protección sobre casilleros de resultados y observaciones de las 8 actas. Una vez pegadas NO se pueden retirar (Pág. 27).",
        isCritical: true,
        irreversibleWarning:
          "¡PUNTO DE NO RETORNO! Una vez pegada la lámina, no se puede enmendar.",
        roleResponsible: "Todos",
      },
    ],
  },
  {
    id: "entrega",
    title: "5. Entrega y Repliegue",
    subtitle: "Sobres de seguridad, carteles de resultados y certificados",
    timeframe: "Cierre de jornada",
    color: "from-rose-600 to-red-700",
    warningAlert:
      "Cada sobre de seguridad va a una entidad diferente. No mezcles las actas ni selles sin revisar.",
    tasks: [
      {
        id: "ent-01",
        phaseId: "entrega",
        title: "Publicación de Carteles de Resultados",
        description:
          "Llenar y pegar los carteles de resultados regional y municipal en la parte exterior del aula (Pág. 3 PDF).",
        isCritical: false,
        roleResponsible: "Coordinación Interna",
      },
      {
        id: "ent-02",
        phaseId: "entrega",
        title: "Enfundado estricto en los 5 Sobres de Seguridad",
        description:
          "Sobre Plomo (ODPE), Sobre Rojo (JNE), Sobre Verde (JEE), Sobre Celeste (ONPE) y Sobre Anaranjado (Padrón/Asistencia). Revisar antes de sellar (Pág. 6 y 7).",
        isCritical: true,
        irreversibleWarning:
          "Los sobres tienen adhesivo inviolable. No metas actas en el sobre anaranjado.",
        roleResponsible: "Todos",
      },
      {
        id: "ent-03",
        phaseId: "entrega",
        title: "Bolsa de repliegue de cédulas no impugnadas",
        description:
          "Guardar todas las cédulas usadas no impugnadas en la bolsa oficial y colocar cinta de embalaje (Pág. 7).",
        isCritical: true,
        roleResponsible: "Coordinación Interna",
      },
      {
        id: "ent-04",
        phaseId: "entrega",
        title: "Entrega al personal ONPE y firma del Cargo",
        description:
          "El Presidente entrega los 5 sobres lacrados, bolsa de repliegue, caja de restos, ánfora y cabinas, y firma el Cargo de Entrega oficial (Pág. 7 y Pág. 3 PDF).",
        isCritical: true,
        irreversibleWarning:
          "Guarda tu copia firmada del cargo. Es tu comprobante legal.",
        roleResponsible: "Presidente",
      },
      {
        id: "ent-05",
        phaseId: "entrega",
        title: "Certificado de Participación y Ley 32231",
        description:
          "Recibir constancia o certificado oficial para tramitar el día de descanso remunerado ante tu empleador (Ley 32231).",
        isCritical: false,
        roleResponsible: "Todos",
      },
    ],
  },
];

export const VOTE_SCENARIOS: VoteScenario[] = [
  {
    id: "vs-01",
    title: "Cruz o aspa perfecta en el recuadro",
    ruling: "valid",
    category: "cruz-aspa",
    rule: "El elector marcó con una cruz (+) o aspa (x) dentro del recuadro del símbolo o fotografía.",
    legalArticle: "Art. 282 LOE / Manual ONPE 2026",
    recommendation:
      "Válido indiscutible. Contar para la organización política.",
    visualType: "cruz_perfecta",
  },
  {
    id: "vs-02",
    title: "Cruz o aspa que sobrepasa ligeramente el recuadro",
    ruling: "valid",
    category: "cruz-aspa",
    rule: "Los trazos sobresalen del recuadro, pero el punto de intersección (el cruce de las líneas) está claramente DENTRO del recuadro.",
    legalArticle: "Manual Oficial de Capacitación ONPE Pág. 2",
    recommendation:
      "VÁLIDO. Si un personero reclama, recuérdale que la norma exige que la intersección esté dentro, sin importar que los brazos salgan.",
    visualType: "cruz_desbordada",
  },
  {
    id: "vs-03",
    title: "Intersección sobre la línea divisoria o fuera",
    ruling: "null",
    category: "cruz-aspa",
    rule: "El punto donde se cruzan las dos líneas cae exactamente sobre la línea del borde o fuera del casillero.",
    legalArticle: "Resoluciones Jurisprudenciales JNE",
    recommendation:
      "NULO. No hay certeza jurídica de la opción elegida porque el punto de cruce no está dentro.",
    visualType: "cruz_linea",
  },
  {
    id: "vs-04",
    title: "Marca con signo de visto bueno o check (✓)",
    ruling: "null",
    category: "marcas-ajenas",
    rule: "El elector usó un check, visto bueno (✓), línea simple (-) o círculo (o). La ley electoral peruana EXIGE cruz (+) o aspa (x).",
    legalArticle: "Art. 282 Ley Orgánica de Elecciones",
    recommendation:
      "NULO. La ley solo autoriza cruz o aspa. Cualquier otro signo invalida el voto.",
    visualType: "signo_check",
  },
  {
    id: "vs-05",
    title: "Caritas felices, dibujos o garabatos",
    ruling: "null",
    category: "marcas-ajenas",
    rule: "Cédula marcada con dibujos, caritas, símbolos no autorizados o inscripciones ajenas.",
    legalArticle: "Art. 283 Ley Orgánica de Elecciones",
    recommendation: "NULO. Se considera voto viciado por marca no electoral.",
    visualType: "carita_feliz",
  },
  {
    id: "vs-06",
    title: "Nombres, números de DNI, insultos o firmas",
    ruling: "null",
    category: "marcas-ajenas",
    rule: "Cédula que contiene texto escrito, número de documento de identidad, firma o insultos a candidatos.",
    legalArticle: "Violación de secreto de sufragio / Voto nulo",
    recommendation:
      "NULO. Rompe el principio de reserva electoral y contiene signos identificatorios.",
    visualType: "texto_o_firma",
  },
  {
    id: "vs-07",
    title: "Cédula rota o rasgada intencionalmente",
    ruling: "null",
    category: "cédula-física",
    rule: "Cédula que presenta rotura sustancial que afecta los símbolos o la integridad del documento.",
    legalArticle: "Manual de Capacitación ONPE",
    recommendation:
      "NULO. Una cédula mutilada pierde validez legal probatoria.",
    visualType: "cedula_rota",
  },
  {
    id: "vs-08",
    title: "Cédula SIN la firma del Presidente en el reverso",
    ruling: "null",
    category: "cédula-física",
    rule: "Cédula que se extrae del ánfora y no cuenta con la firma del Presidente de mesa en el reverso.",
    legalArticle: "Procedimiento obligatorio de escrutinio ONPE",
    recommendation:
      "NULO DIRECTO. Aunque tenga una cruz perfecta, si no fue firmada por la autoridad de mesa es nula.",
    visualType: "cedula_sin_firma",
  },
];

export const SECURITY_ENVELOPES: SecurityEnvelope[] = [
  {
    color: "plomo",
    name: "Sobre Plomo",
    badgeColorClass: "bg-slate-600 text-white",
    bgClass: "bg-slate-900/60",
    borderClass: "border-slate-500",
    recipient: "ODPE / ONPE (Centro de Cómputo Oficial)",
    priority: "MÁXIMA PRIORIDAD - El primer ejemplar procesado",
    contents: [
      {
        id: "sp-1",
        text: "1er Ejemplar del Acta Electoral Regional (Instalación, Sufragio y Escrutinio con lámina)",
        isCritical: true,
      },
      {
        id: "sp-2",
        text: "1er Ejemplar del Acta Electoral Municipal (Instalación, Sufragio y Escrutinio con lámina)",
        isCritical: true,
      },
    ],
    warning:
      "Este sobre es el que se traslada inmediatamente a la ODPE para la digitación oficial del cómputo. No olvides colocar las láminas plásticas antes de meter el acta.",
  },
  {
    color: "rojo",
    name: "Sobre Rojo",
    badgeColorClass: "bg-red-600 text-white",
    bgClass: "bg-red-950/40",
    borderClass: "border-red-500",
    recipient: "Jurado Nacional de Elecciones (JNE)",
    priority: "Fiscalización Electoral Superior",
    contents: [
      {
        id: "sr-1",
        text: "2do Ejemplar del Acta Electoral Regional (con lámina de protección)",
        isCritical: true,
      },
      {
        id: "sr-2",
        text: "2do Ejemplar del Acta Electoral Municipal (con lámina de protección)",
        isCritical: true,
      },
    ],
    warning:
      "Copia destinada al JNE para el cotejo oficial en caso de actas observadas o apeladas.",
  },
  {
    color: "verde",
    name: "Sobre Verde",
    badgeColorClass: "bg-emerald-600 text-white",
    bgClass: "bg-emerald-950/40",
    borderClass: "border-emerald-500",
    recipient: "Jurado Electoral Especial (JEE)",
    priority: "Justicia Electoral Jurisdiccional",
    contents: [
      {
        id: "sv-1",
        text: "3er Ejemplar del Acta Electoral Regional (con lámina de protección)",
        isCritical: true,
      },
      {
        id: "sv-2",
        text: "3er Ejemplar del Acta Electoral Municipal (con lámina de protección)",
        isCritical: true,
      },
    ],
    warning:
      "Va directamente a la sede del Jurado Electoral Especial de la circunscripción.",
  },
  {
    color: "celeste",
    name: "Sobre Celeste",
    badgeColorClass: "bg-sky-600 text-white",
    bgClass: "bg-sky-950/40",
    borderClass: "border-sky-500",
    recipient: "Oficina Nacional de Procesos Electorales (Archivo / ONPE)",
    priority: "Archivo Institucional e Impugnaciones",
    contents: [
      {
        id: "sc-1",
        text: "4to Ejemplar del Acta Electoral Regional (con lámina de protección)",
        isCritical: true,
      },
      {
        id: "sc-2",
        text: "4to Ejemplar del Acta Electoral Municipal (con lámina de protección)",
        isCritical: true,
      },
      {
        id: "sc-3",
        text: "Sobres especiales conteniendo Cédulas de Votos Impugnados (si los hubiera)",
        isCritical: false,
      },
    ],
    warning:
      "Si hubo votos impugnados durante el escrutinio, sus sobres especiales van dentro de este sobre celeste.",
  },
  {
    color: "anaranjado",
    name: "Sobre Anaranjado",
    badgeColorClass: "bg-orange-600 text-white",
    bgClass: "bg-orange-950/40",
    borderClass: "border-orange-500",
    recipient: "Padrón Electoral y Documentación de Mesa",
    priority: "Resguardo de Identidades y Asistencia",
    contents: [
      {
        id: "sa-1",
        text: "Lista Oficial de Electores (con firmas, huellas y marcas de 'NO VOTÓ')",
        isCritical: true,
      },
      {
        id: "sa-2",
        text: "Hoja de Control de Asistencia de Miembros de Mesa",
        isCritical: true,
      },
      {
        id: "sa-3",
        text: "Relación de Miembros de Mesa No Sorteados (si asumió alguien de la fila)",
        isCritical: false,
      },
    ],
    warning:
      "¡CUIDADO! Nunca metas las actas electorales aquí. Este sobre es exclusivo para el padrón de firmas y control de asistencia.",
  },
];

export const PROTOCOLS_LIST: ProtocolItem[] = [
  {
    id: "prot-01",
    category: "ausencia",
    title: "¿Qué hacer si falta uno o más miembros de mesa?",
    summary:
      "Procedimiento legal a seguir a partir de las 7:00 a.m. para completar la mesa de 3 miembros.",
    steps: [
      "A las 7:00 a.m., si falta algún titular, asumen los suplentes en estricto orden de sorteo.",
      "A las 7:01 a.m., si aún no se completan los 3 miembros, el Presidente invita a los ciudadanos que se encuentren formados en la fila.",
      "Los miembros de la fila elegidos están obligados por ley a asumir, bajo pena de multa de la ONPE.",
      "Completar inmediatamente la 'Relación de Miembros de Mesa No Sorteados' con los datos y DNI del nuevo miembro.",
      "Firmar la Hoja de Control de Asistencia indicando 'ASUMIÓ DE LA COLA'.",
    ],
    legalReference: "Art. 249 de la Ley Orgánica de Elecciones Nº 26859",
  },
  {
    id: "prot-02",
    category: "personeros",
    title: "¿Cuáles son los límites y derechos de los personeros?",
    summary:
      "Evita abusos o intimidación en el aula. Los personeros fiscalizan, no mandan.",
    steps: [
      "Tienen derecho a: Estar presentes desde la instalación, presenciar la votación y el conteo, firmar el reverso de cédulas al inicio (opcional) y recibir copia del acta al final.",
      "NO TIENEN DERECHO A: Tocar las cédulas, manipular el ánfora, ordenar a los miembros de mesa ni interrumpir la votación.",
      "En el escrutinio: Si discrepan de un voto calificado por la mesa, pueden IMPUGNARLO (se coloca en el sobre de impugnación). NO pueden decidir por la mesa.",
      "Regla de Oro: La mesa es la máxima autoridad por mayoría de votos (2 a 1 entre los 3 miembros).",
    ],
    legalReference: "Manual Oficial de Capacitación Electoral ONPE 2026",
  },
  {
    id: "prot-03",
    category: "atencion",
    title: "Módulo Temporal de Votación (MTV) para discapacidad severa",
    summary:
      "Protocolo para cuando un elector no puede subir las escaleras hasta el aula.",
    steps: [
      "El coordinador de ONPE avisa que hay un elector con baja movilidad en el MTV del primer piso.",
      "Los miembros de mesa designan a dos miembros (o asiste el Presidente y un miembro) llevando: Cédula, Lista de electores, Lapicero, Tampón y el Ánfora.",
      "El resto del material queda resguardado en el aula por el tercer miembro y la Policía Nacional / FFAA.",
      "El elector vota con total privacidad en el módulo y se retorna de inmediato al aula.",
    ],
    legalReference: "Protocolo de Atención Inclusiva ONPE",
  },
  {
    id: "prot-04",
    category: "legal",
    title: "Beneficio Laboral por Ley 32231 (Día de descanso)",
    summary:
      "Todo miembro de mesa que cumpla su labor tiene derecho por ley a un día de descanso remunerado.",
    steps: [
      "La Ley 32231 otorga un día de descanso remunerado y no compensable al día siguiente de las elecciones.",
      "Aplica tanto para trabajadores del sector público como del sector privado.",
      "El comprobante válido es el Certificado de Participación emitido por ONPE o la constancia de asistencia oficial.",
      "Adicionalmente, se entrega la compensación económica oficial por jornada (abonada por ONPE según cronograma).",
    ],
    legalReference: "Ley Nº 32231 - Congreso de la República",
  },
];
