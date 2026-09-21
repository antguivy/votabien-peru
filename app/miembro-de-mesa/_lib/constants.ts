import {
  PhaseDefinition,
  VoteScenario,
  SecurityEnvelope,
  ProtocolItem,
} from "./types";

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
        title: "Presentación puntual y recepción de material",
        description:
          "Presentarse a las 6:00 a.m. Recibir la caja sellada de la ONPE con los 3 paquetes: Útiles, Instalación y Escrutinio.",
        isCritical: true,
        roleResponsible: "Presidente",
      },
      {
        id: "inst-02",
        phaseId: "instalacion",
        title: "Revisión física del aula y cámara secreta",
        description:
          "Verificar que la Relación de Electores esté pegada en la puerta y los Carteles de Candidatos en la cámara secreta sin marcas ni daños.",
        isCritical: false,
        roleResponsible: "Secretario",
      },
      {
        id: "inst-03",
        phaseId: "instalacion",
        title: "Rotulado de caja de 'Restos Electorales'",
        description:
          "Pegar la etiqueta oficial 'Restos Electorales' en la caja vacía para almacenar empaques y cédulas sobrantes más tarde.",
        isCritical: false,
        roleResponsible: "Tercer Miembro",
      },
      {
        id: "inst-04",
        phaseId: "instalacion",
        title: "Conteo físico de Cédulas de Sufragio",
        description:
          "Contar una a una las cédulas recibidas. La cantidad DEBE coincidir exactamente con el número de electores hábiles del rótulo de la caja.",
        isCritical: true,
        irreversibleWarning:
          "Si hay faltante o sobrante de cédulas sin abrir la mesa, repórtalo de inmediato al coordinador de ONPE antes de firmar el acta.",
        roleResponsible: "Todos",
      },
      {
        id: "inst-05",
        phaseId: "instalacion",
        title: "Firma obligatoria en el reverso de las cédulas",
        description:
          "El Presidente (o los 3 miembros) firma el reverso de todas las cédulas. Los personeros acreditados pueden firmar si lo desean.",
        isCritical: true,
        irreversibleWarning:
          "¡ALERTA MÁXIMA! Cédula sin firma del Presidente en el reverso será declarada NULA en el escrutinio.",
        roleResponsible: "Presidente",
        legalNote: "Ley Orgánica de Elecciones / Directiva ONPE",
      },
      {
        id: "inst-06",
        phaseId: "instalacion",
        title: "Hoja de Control de Asistencia",
        description:
          "Desglosar la hoja de asistencia. Titulares y suplentes presentes firman y colocan huella dactilar. Escribir 'FALTÓ' a los ausentes.",
        isCritical: true,
        roleResponsible: "Secretario",
      },
      {
        id: "inst-07",
        phaseId: "instalacion",
        title: "Llenado de Actas de Instalación (Sección A)",
        description:
          "Llenar en números y letras claras las 4 actas regionales y 4 municipales: hora exacta de instalación, estado del material y cantidad de cédulas.",
        isCritical: true,
        roleResponsible: "Secretario",
      },
      {
        id: "inst-08",
        phaseId: "instalacion",
        title: "Firmas y lámina en campo de observaciones",
        description:
          "Los 3 miembros firman y ponen huella. Si se escribió alguna observación, colocar inmediatamente la lámina autoadhesiva de protección.",
        isCritical: true,
        roleResponsible: "Todos",
      },
    ],
  },
  {
    id: "sufragio",
    title: "2. Sufragio",
    subtitle: "Recepción de votantes y orden de mesa",
    timeframe: "07:00 AM – 05:00 PM",
    color: "from-emerald-600 to-teal-700",
    warningAlert:
      "Votan primero los 3 miembros de mesa, luego personeros acreditados de esa mesa y luego electores de la fila.",
    tasks: [
      {
        id: "suf-01",
        phaseId: "sufragio",
        title: "Votación de autoridades de mesa",
        description:
          "Votan primero los miembros de mesa titulares y suplentes presentes. Luego personeros que voten en la misma mesa.",
        isCritical: false,
        roleResponsible: "Todos",
      },
      {
        id: "suf-02",
        phaseId: "sufragio",
        title: "Manejo estricto del circuito de votación",
        description:
          "1. Presidente recibe DNI y entrega cédula abierta/mostrada. 2. Elector vota en cámara secreta. 3. Deposita en ánfora. 4. Firma y huella en lista. 5. Devolución de DNI.",
        isCritical: true,
        roleResponsible: "Todos",
      },
      {
        id: "suf-03",
        phaseId: "sufragio",
        title: "Atención preferente e inclusiva",
        description:
          "Prioridad absoluta a adultos mayores, gestantes, personas con discapacidad y con bebés en brazos. Permitir acompañante de confianza si lo solicitan.",
        isCritical: false,
        roleResponsible: "Tercer Miembro",
      },
      {
        id: "suf-04",
        phaseId: "sufragio",
        title: "Módulo Temporal de Votación (MTV)",
        description:
          "Si un elector con discapacidad severa no puede subir al aula: trasladarse con cédula, lista, tampón y ánfora temporal coordinando con ONPE.",
        isCritical: false,
        roleResponsible: "Presidente",
      },
      {
        id: "suf-05",
        phaseId: "sufragio",
        title: "Control estricto de personeros",
        description:
          "Verificar credenciales oficiales. Los personeros no pueden tocar las cédulas, manipular el ánfora ni interferir con la voluntad del elector.",
        isCritical: true,
        roleResponsible: "Presidente",
      },
    ],
  },
  {
    id: "cierre",
    title: "3. Cierre de Sufragio",
    subtitle: "5:00 PM: Cierre de puertas y consolidación del padrón",
    timeframe: "05:00 PM puntual",
    color: "from-amber-600 to-orange-700",
    warningAlert:
      "A las 5:00 PM se cierran las puertas del local. Solo sufragan quienes ya estaban en la fila dentro del aula.",
    tasks: [
      {
        id: "cie-01",
        phaseId: "cierre",
        title: "Declaración de cierre de fila a las 5:00 PM",
        description:
          "Cerrar la votación. No permitir el ingreso de nuevos electores. Votan únicamente los ciudadanos que se encuentren formados.",
        isCritical: true,
        roleResponsible: "Presidente",
      },
      {
        id: "cie-02",
        phaseId: "cierre",
        title: "Sello o marcado de 'NO VOTÓ' a ausentes",
        description:
          "Revisar la Lista de Electores página por página. Escribir o sellar 'NO VOTÓ' en el espacio de firma de cada ciudadano que no acudió.",
        isCritical: true,
        irreversibleWarning:
          "No olvides marcar a los ausentes. Dejar espacios en blanco causa sospechas de suplantación y errores de conteo.",
        roleResponsible: "Secretario",
      },
      {
        id: "cie-03",
        phaseId: "cierre",
        title: "Conteo minucioso de firmas y huellas",
        description:
          "Contar cuántos ciudadanos firmaron en cada página y sumar el Total General de Ciudadanos que Votaron. El Presidente firma al pie de la última página.",
        isCritical: true,
        irreversibleWarning:
          "Anota este número con precisión (ej: 234). Este número es la BASE MATEMÁTICA OBLIGATORIA de todo el escrutinio.",
        roleResponsible: "Todos",
      },
      {
        id: "cie-04",
        phaseId: "cierre",
        title: "Llenado de Actas de Sufragio (Sección B)",
        description:
          "Llenar las 8 actas (4 regionales y 4 municipales) con: Total de ciudadanos que votaron, Total de cédulas no usadas y hora de término.",
        isCritical: true,
        roleResponsible: "Secretario",
      },
      {
        id: "cie-05",
        phaseId: "cierre",
        title: "Destrucción de Cédulas NO utilizadas",
        description:
          "Inutilizar las cédulas sobrantes (cortándolas por la mitad o según indicación de ONPE) y guardarlas en la caja de Restos Electorales.",
        isCritical: true,
        roleResponsible: "Tercer Miembro",
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
        title: "Despeje total de la mesa",
        description:
          "Retirar lapiceros y papeles no necesarios. Solo deben quedar en la mesa: el ánfora, hojas borrador (5A, 5B, 5C, 5D) y lapicero oficial.",
        isCritical: false,
        roleResponsible: "Todos",
      },
      {
        id: "esc-02",
        phaseId: "escrutinio",
        title: "Apertura de ánfora y verificación de cédulas",
        description:
          "Abrir el ánfora, contar las cédulas sin abrirlas. Su cantidad debe coincidir con el número de personas que votaron según el Acta de Sufragio.",
        isCritical: true,
        irreversibleWarning:
          "Si sobran cédulas con respecto a la lista, se retiran al azar y se destruyen sin abrir (procedimiento ONPE). Repórtalo al coordinador.",
        roleResponsible: "Presidente",
      },
      {
        id: "esc-03",
        phaseId: "escrutinio",
        title: "Validación de firma del Presidente en reverso",
        description:
          "Al desdoblar cada cédula, verificar que tenga la firma en el reverso. Si no tiene firma, se considera automáticamente NULA.",
        isCritical: true,
        roleResponsible: "Todos",
      },
      {
        id: "esc-04",
        phaseId: "escrutinio",
        title: "Conteo con Hoja Borrador 5A (Gobernador Regional)",
        description:
          "El Presidente canta cada voto en voz alta y muestra la cédula. Se colocan palotes de 5 en 5. Sumar válidos + blancos + nulos + impugnados.",
        isCritical: true,
        roleResponsible: "Todos",
      },
      {
        id: "esc-05",
        phaseId: "escrutinio",
        title: "VERIFICACIÓN MATEMÁTICA: Usar Calculadora de Cuadre",
        description:
          "Verificar en la calculadora de la app que la suma de la Hoja Borrador sea idéntica al Total de Votantes. Si no cuadra, recontar antes de pasar al acta.",
        isCritical: true,
        irreversibleWarning:
          "NUNCA transcribas al acta oficial si la suma no coincide con el total de votantes. Provocarás un acta observada.",
        roleResponsible: "Todos",
      },
      {
        id: "esc-06",
        phaseId: "escrutinio",
        title: "Conteo de 5B (Consejeros), 5C (Provincial) y 5D (Distrital)",
        description:
          "Repetir el mismo procedimiento metódico para cada una de las siguientes elecciones, cuadrando cada una de forma independiente.",
        isCritical: true,
        roleResponsible: "Todos",
      },
      {
        id: "esc-07",
        phaseId: "escrutinio",
        title: "Traslado a Actas de Escrutinio (Sección C)",
        description:
          "Copiar cuidadosamente los resultados de las hojas borrador a las 8 actas electorales (4 regionales y 4 municipales) con letra clara.",
        isCritical: true,
        roleResponsible: "Secretario",
      },
      {
        id: "esc-08",
        phaseId: "escrutinio",
        title: "Colocación de LÁMINAS AUTOADHESIVAS DE PROTECCIÓN",
        description:
          "Una vez firmadas por los miembros y personeros, colocar las láminas plásticas transparentes sobre los cuadros de resultados y observaciones.",
        isCritical: true,
        irreversibleWarning:
          "¡ADVERTENCIA FINAL! La lámina NO se puede despegar. Una vez pegada, cualquier tachadura invalida el acta para el escaneo de ONPE.",
        roleResponsible: "Presidente",
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
          "Llenar los 2 carteles de resultados (regional y municipal) con los totales obtenidos y pegarlos en la puerta exterior del aula para conocimiento público.",
        isCritical: false,
        roleResponsible: "Tercer Miembro",
      },
      {
        id: "ent-02",
        phaseId: "entrega",
        title: "Entrega de copias de actas a personeros",
        description:
          "Entregar una copia del acta electoral a los personeros de mesa acreditados que la soliciten, recabando su firma de recepción.",
        isCritical: false,
        roleResponsible: "Secretario",
      },
      {
        id: "ent-03",
        phaseId: "entrega",
        title: "Enfundado estricto en los 5 Sobres de Seguridad",
        description:
          "Consultar el módulo de sobres: Sobre Plomo (ODPE), Sobre Rojo (JNE), Sobre Verde (JEE), Sobre Celeste (ONPE) y Sobre Anaranjado (Padrón/Asistencia).",
        isCritical: true,
        irreversibleWarning:
          "Los sobres tienen adhesivo de seguridad inviolable. Revisa la lista de contenido de cada sobre antes de sellarlo.",
        roleResponsible: "Todos",
      },
      {
        id: "ent-04",
        phaseId: "entrega",
        title: "Embolsado de cédulas usadas para repliegue",
        description:
          "Guardar todas las cédulas usadas no impugnadas en la bolsa oficial de repliegue de cédulas provista por ONPE y sellarla.",
        isCritical: true,
        roleResponsible: "Tercer Miembro",
      },
      {
        id: "ent-05",
        phaseId: "entrega",
        title: "Firma del Cargo de Entrega con personal ONPE",
        description:
          "El Presidente entrega los 5 sobres lacrados, la bolsa de repliegue, la caja de restos electorales, ánfora y cabinas al coordinador de ONPE, firmando el cargo.",
        isCritical: true,
        irreversibleWarning:
          "Guarda tu copia firmada del cargo de entrega. Es tu comprobante legal oficial de haber cumplido la función.",
        roleResponsible: "Presidente",
      },
      {
        id: "ent-06",
        phaseId: "entrega",
        title: "Certificado de Participación y Beneficio Ley 32231",
        description:
          "Recibir el certificado físico o validar la descarga del certificado digital oficial para gozar del día de descanso laboral no compensable.",
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
