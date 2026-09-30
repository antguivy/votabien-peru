import {
  ChecklistTask,
  PhaseDefinition,
  VoteScenario,
  SecurityEnvelope,
  ProtocolItem,
  VisualRef,
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

/* ── ONPE reference visual units (public/miembros_mesa/) ── */

const RECEP_UTILES: VisualRef = {
  id: "recep-utiles",
  title: "Paquete de Útiles",
  images: [
    {
      src: "/miembros_mesa/paquete_utiles.png",
      alt: "Paquete de útiles: lapiceros, tampón para huella y cinta de embalaje ONPE",
      caption: "3 lapiceros, 1 tampón para huella y 1 cinta de embalaje",
    },
  ],
};

const RECEP_INSTALACION: VisualRef = {
  id: "recep-instalacion",
  title: "Paquete de Instalación",
  description: "Bolsa sellada con el material para instalar y abrir la mesa",
  images: [
    {
      src: "/miembros_mesa/paquete_instalacion_1.jpeg",
      alt: "Manual de miembros de mesa, cartilla de personeros y etiqueta de restos",
      caption:
        "Manual de miembros, cartilla de personeros y etiqueta de restos",
    },
    {
      src: "/miembros_mesa/paquete_instalacion_2.jpeg",
      alt: "Cédulas de sufragio y Hoja de control de asistencia",
      caption: "Cédulas de sufragio y Hoja de control de asistencia (3a)",
    },
    {
      src: "/miembros_mesa/paquete_instalacion_3.jpeg",
      alt: "Actas electorales de instalación, sufragio y escrutinio",
      caption:
        "Actas de instalación, sufragio y escrutinio (Secciones A, B y C)",
    },
    {
      src: "/miembros_mesa/paquete_instalacion_4.jpeg",
      alt: "Hojas borrador y certificados de participación",
      caption: "Hojas borrador (5a-5d) y certificados de participación",
    },
    {
      src: "/miembros_mesa/paquete_instalacion_5.jpeg",
      alt: "Lista de electores y sobre anaranjado para la ODPE",
      caption:
        "Lista de electores (padrón de firmas) y sobre plástico anaranjado",
    },
  ],
};

const RECEP_ESCRUTINIO: VisualRef = {
  id: "recep-escrutinio",
  title: "Paquete de Escrutinio",
  description: "Bolsa con material para el conteo final de votos y repliegue",
  images: [
    {
      src: "/miembros_mesa/paquete_escrutinio_1.png",
      alt: "Sobres plásticos de colores para actas y bolsa de repliegue",
      caption:
        "Sobres de colores (Plomo, Rojo, Verde, Celeste) y bolsa de repliegue",
    },
    {
      src: "/miembros_mesa/paquete_escrutinio_2.png",
      alt: "Láminas autoadhesivas transparentes de protección",
      caption:
        "Láminas de protección para casilleros de resultados y observaciones",
    },
    {
      src: "/miembros_mesa/paquete_escrutinio_3.png",
      alt: "Sobre y formulario para impugnaciones",
      caption: "Sobre y formulario de impugnación de votos e identidad",
    },
    {
      src: "/miembros_mesa/paquete_escrutinio_4.png",
      alt: "Cargo de entrega oficial al coordinador de la ONPE",
      caption: "Cargo de entrega de actas y material electoral oficial",
    },
    {
      src: "/miembros_mesa/paquete_escrutinio_5.png",
      alt: "Bolsa para reciclaje y restos",
      caption: "Bolsa para restos electorales y reciclaje",
    },
  ],
};

const REV_AULA_CAMARA: VisualRef = {
  id: "rev-aula-camara",
  title: "Aula y Cámara Secreta",
  description: "Verificación de la puerta del aula y la cámara de votación",
  images: [
    {
      src: "/miembros_mesa/1_2_revision_aula.png",
      alt: "Relación de electores pegada en la puerta exterior del aula",
      caption: "Puerta exterior: pegar la 'Relación de electores'",
    },
    {
      src: "/miembros_mesa/1_2_revision_camara_secreta.png",
      alt: "Cámara secreta con carteles de candidatos instalados",
      caption: "Cámara secreta: sin visibilidad exterior y carteles instalados",
    },
  ],
};

const ROT_RESTOS: VisualRef = {
  id: "rot-restos",
  title: "Caja de Restos Electorales",
  images: [
    {
      src: "/miembros_mesa/1_3_rotulado_restos_electorales.png",
      alt: "Pegar la etiqueta oficial Restos Electorales en la caja vacía",
      caption:
        "Pegar la etiqueta oficial 'Restos Electorales' en la caja vacía de material",
    },
  ],
};

const CONTEO_CEDULAS: VisualRef = {
  id: "conteo-cedulas",
  title: "Verificación y Conteo de Cédulas",
  description: "Verificar rótulo y contar cédulas sin abrir la mesa",
  images: [
    {
      src: "/miembros_mesa/1_4_cantidad_electores.png",
      alt: "Rótulo del paquete con la cantidad de electores hábiles",
      caption:
        "Paso 1: Verificar en el rótulo el total de electores hábiles de la mesa",
    },
    {
      src: "/miembros_mesa/1_4_conteo_cedulas.png",
      alt: "Conteo físico de las cédulas de sufragio",
      caption:
        "Paso 2: Contar las cédulas constatando que coincidan con el rótulo",
    },
  ],
};

const FIRMA_CEDULAS: VisualRef = {
  id: "firma-cedulas",
  title: "Firma en Reverso de Cédulas",
  images: [
    {
      src: "/miembros_mesa/1_5_firma_cedulas.png",
      alt: "Firma de los miembros de mesa en el reverso de cada cédula",
      caption:
        "Los tres miembros firman en el reverso antes de entregarla al elector",
    },
  ],
};

const CONTROL_ASISTENCIA: VisualRef = {
  id: "control-asistencia",
  title: "Hoja de Control de Asistencia",
  description:
    "Llamado en voz alta, firmas de miembros y resguardo en sobre anaranjado",
  images: [
    {
      src: "/miembros_mesa/1_6_desglozar_asistencia.png",
      alt: "Desglosar la hoja de control de asistencia 3a",
      caption: "Paso 1: Desglosar la Hoja de Control de Asistencia (3a)",
    },
    {
      src: "/miembros_mesa/1_6_firma_asistencia_miembros.png",
      alt: "Firma y huella de los miembros presentes",
      caption:
        "Paso 2: Miembros firman y colocan huella (escribir FALTÓ a ausentes)",
    },
    {
      src: "/miembros_mesa/1_6_firma_presidente.png",
      alt: "Firma del Presidente y constancia de refrigerios",
      caption:
        "Paso 3: El Presidente marca recepción de refrigerios y firma al pie",
    },
    {
      src: "/miembros_mesa/1_6_guardar_asistencia.png",
      alt: "Guardar la hoja de control en el sobre plástico anaranjado",
      caption: "Paso 4: Guardar la hoja en el sobre plástico anaranjado",
    },
  ],
};

const ACTAS_INSTALACION: VisualRef = {
  id: "actas-instalacion",
  title: "Actas de Instalación (Sección A)",
  description: "Llenado con letra clara en las actas regionales y municipales",
  images: [
    {
      src: "/miembros_mesa/1_7_completar_acta_instalacion.png",
      alt: "Llenar la Sección A del Acta de Instalación",
      caption:
        "Paso 1: Llenar hora de inicio, estado del material y cantidad de cédulas",
    },
    {
      src: "/miembros_mesa/1_7_desglozar_actas_regionales.png",
      alt: "Desglose de actas regionales",
      caption: "Paso 2: Desglosar las 4 actas electorales regionales",
    },
    {
      src: "/miembros_mesa/1_7_desglozar_actas_municipales.png",
      alt: "Desglose de actas municipales",
      caption: "Paso 3: Desglosar las 4 actas electorales municipales",
    },
    {
      src: "/miembros_mesa/1_7_si_no_puede_firmar.png",
      alt: "Procedimiento si un miembro no puede firmar",
      caption:
        "Si un miembro no puede firmar: imprime huella digital y se anota",
    },
  ],
};

const REF_LISTA_ELECTORES: VisualRef = {
  id: "lista-electores",
  title: "Lista de Electores",
  images: [
    {
      src: "/miembros_mesa/paquete_instalacion_5.jpeg",
      alt: "Cuadernillo de lista de electores y material para marcado de cédulas",
      caption: "Lista de electores con fotos, espacios de firma y huella",
    },
  ],
};

const REF_ACTAS_ESCRUTINIO: VisualRef = {
  id: "actas-escrutinio",
  title: "Actas de Escrutinio (Sección C)",
  images: [
    {
      src: "/miembros_mesa/paquete_instalacion_3.jpeg",
      alt: "Actas de escrutinio anverso y reverso",
      caption: "Actas de escrutinio para registro oficial de votos",
    },
  ],
};

const REF_IMPUGNACIONES: VisualRef = {
  id: "sobre-impugnaciones",
  title: "Sobre de Impugnaciones",
  images: [
    {
      src: "/miembros_mesa/paquete_escrutinio_3.png",
      alt: "Sobre y formulario para impugnaciones de identidad o voto",
      caption: "Sobre y formulario oficial para impugnaciones",
    },
  ],
};

const REF_HOJAS_BORRADOR: VisualRef = {
  id: "hojas-borrador",
  title: "Hojas Borrador (5a-5d)",
  images: [
    {
      src: "/miembros_mesa/paquete_instalacion_4.jpeg",
      alt: "Hojas borrador para conteo con palotes",
      caption: "Hojas borrador 5a, 5b, 5c y 5d para palotes de 5 en 5",
    },
  ],
};

const REF_LAMINAS: VisualRef = {
  id: "laminas-proteccion",
  title: "Láminas Autoadhesivas",
  images: [
    {
      src: "/miembros_mesa/paquete_escrutinio_2.png",
      alt: "Láminas autoadhesivas de protección para resultados",
      caption: "Láminas plásticas para proteger resultados y observaciones",
    },
  ],
};

const REF_CARTELES_RESULTADOS: VisualRef = {
  id: "carteles-resultados",
  title: "Carteles de Resultados",
  images: [
    {
      src: "/miembros_mesa/paquete_instalacion_4.jpeg",
      alt: "Carteles de resultados para publicar fuera del aula",
      caption: "Carteles de resultados regional y municipal",
    },
  ],
};

const REF_SOBRES_SEGURIDAD: VisualRef = {
  id: "sobres-seguridad",
  title: "Sobres de Seguridad",
  images: [
    {
      src: "/miembros_mesa/paquete_escrutinio_1.png",
      alt: "Sobres plásticos de colores para los 5 destinos",
      caption:
        "Sobres Plomo (ODPE), Rojo (ONPE), Verde (JNE), Celeste (JEE) y Anaranjado",
    },
  ],
};

const REF_BOLSA_REPLIEGUE: VisualRef = {
  id: "bolsa-repliegue",
  title: "Bolsa de Repliegue",
  images: [
    {
      src: "/miembros_mesa/paquete_escrutinio_1.png",
      alt: "Bolsa de repliegue para cédulas usadas no impugnadas",
      caption: "Bolsa para repliegue de cédulas no impugnadas",
    },
    {
      src: "/miembros_mesa/paquete_escrutinio_5.png",
      alt: "Bolsa para reciclaje y restos",
      caption: "Bolsa para restos electorales y reciclaje",
    },
  ],
};

const REF_CARGO_ENTREGA: VisualRef = {
  id: "cargo-entrega",
  title: "Cargo de Entrega Oficial",
  images: [
    {
      src: "/miembros_mesa/paquete_escrutinio_4.png",
      alt: "Cargo de entrega de actas y material al coordinador de la ONPE",
      caption:
        "Cargo oficial de entrega: firmar y conservar copia del Presidente",
    },
  ],
};

const REF_CERTIFICADOS: VisualRef = {
  id: "certificados",
  title: "Certificados de Participación",
  images: [
    {
      src: "/miembros_mesa/paquete_instalacion_4.jpeg",
      alt: "Certificado de participación de miembros de mesa",
      caption: "Certificados para tramitar descanso remunerado (Ley 32231)",
    },
  ],
};

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
        visualRefs: [RECEP_UTILES, RECEP_INSTALACION, RECEP_ESCRUTINIO],
      },
      {
        id: "inst-02",
        phaseId: "instalacion",
        title: "Revisión física del aula y cámara secreta",
        description:
          "Verificar que la 'Relación de electores' esté pegada en la puerta del aula y los carteles de candidatos en la cámara secreta. Los personeros pueden participar (Pág. 9, paso 3).",
        isCritical: false,
        roleResponsible: "Todos",
        visualRefs: [REV_AULA_CAMARA],
      },
      {
        id: "inst-03",
        phaseId: "instalacion",
        title: "Rotulado de caja de 'Restos Electorales'",
        description:
          "Pegar la etiqueta oficial 'Restos Electorales' en la caja vacía y colocarla al costado de la mesa (Pág. 8, paso 2).",
        isCritical: false,
        roleResponsible: "Coordinación Interna",
        visualRefs: [ROT_RESTOS],
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
        visualRefs: [CONTEO_CEDULAS],
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
        visualRefs: [FIRMA_CEDULAS],
      },
      {
        id: "inst-06",
        phaseId: "instalacion",
        title: "Control de Asistencia (Hoja 3a)",
        description:
          "El Secretario llama en voz alta a cada miembro para firmar y colocar huella. Escribe 'FALTÓ' a ausentes. El Presidente marca si recibió información de Reniec y refrigerios, y firma (Pág. 10, paso 5).",
        isCritical: true,
        roleResponsible: "Secretario",
        visualRefs: [CONTROL_ASISTENCIA],
      },
      {
        id: "inst-07",
        phaseId: "instalacion",
        title: "Llenado de Actas de Instalación (Sección A)",
        description:
          "Llenar en letras y números claros las 4 actas regionales y 4 municipales: hora de inicio, estado del material y cantidad de cédulas. Firman los tres miembros (Pág. 11, paso 6).",
        isCritical: true,
        roleResponsible: "Secretario",
        visualRefs: [ACTAS_INSTALACION],
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
        visualRefs: [REF_LISTA_ELECTORES],
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
        visualRefs: [FIRMA_CEDULAS],
      },
      {
        id: "esc-03",
        phaseId: "escrutinio",
        title: "Calificación y canto de votos a personeros",
        description:
          "El Presidente lee cada voto en voz alta y muestra la cédula a los personeros. Toda duda se resuelve en la mesa por mayoría simple (Art. 283 LOE / Pág. 25, paso 6).",
        isCritical: true,
        roleResponsible: "Presidente",
        visualRefs: [REF_IMPUGNACIONES],
      },
      {
        id: "esc-04",
        phaseId: "escrutinio",
        title: "Trazado de palotes de 5 en 5 en Hoja Borrador",
        description:
          "El miembro a cargo de la hoja borrador escucha y traza un palote por voto agrupados de cinco en cinco. Repetir en 5A, 5B, 5C y 5D (Pág. 25, paso 7).",
        isCritical: true,
        roleResponsible: "Secretario",
        visualRefs: [REF_HOJAS_BORRADOR],
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
        visualRefs: [REF_ACTAS_ESCRUTINIO],
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
        visualRefs: [REF_LAMINAS],
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
        visualRefs: [REF_CARTELES_RESULTADOS],
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
        visualRefs: [REF_SOBRES_SEGURIDAD],
      },
      {
        id: "ent-03",
        phaseId: "entrega",
        title: "Bolsa de repliegue de cédulas no impugnadas",
        description:
          "Guardar todas las cédulas usadas no impugnadas en la bolsa oficial y colocar cinta de embalaje (Pág. 7).",
        isCritical: true,
        roleResponsible: "Coordinación Interna",
        visualRefs: [REF_BOLSA_REPLIEGUE],
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
        visualRefs: [REF_CARGO_ENTREGA],
      },
      {
        id: "ent-05",
        phaseId: "entrega",
        title: "Certificado de Participación y Ley 32231",
        description:
          "Recibir constancia o certificado oficial para tramitar el día de descanso remunerado ante tu empleador (Ley 32231).",
        isCritical: false,
        roleResponsible: "Todos",
        visualRefs: [REF_CERTIFICADOS],
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
    badgeColorClass: "bg-zinc-600 text-white",
    bgClass: "bg-zinc-900/60",
    borderClass: "border-zinc-500",
    recipient: "ODPE (Oficina Descentralizada de Procesos Electorales)",
    priority: "1er Ejemplar · Cómputo y Digitación Inmediata",
    contents: [
      {
        id: "sp-1",
        text: "1er Ejemplar del Acta Electoral (Instalación, Sufragio y Escrutinio)",
        isCritical: true,
      },
      {
        id: "sp-2",
        text: "Láminas de protección autoadhesivas pegadas sobre resultados y observaciones",
        isCritical: true,
      },
    ],
    warning:
      "Este es el primer sobre procesado en el centro de cómputo de la ODPE para los resultados oficiales. Verifica que las láminas de protección estén bien pegadas antes de cerrar la cinta de seguridad.",
  },
  {
    color: "rojo",
    name: "Sobre Rojo",
    badgeColorClass: "bg-red-600 text-white",
    bgClass: "bg-red-950/40",
    borderClass: "border-red-500",
    recipient: "ONPE (Sede Central en Lima)",
    priority: "2do Ejemplar · Archivo y Custodia Nacional",
    contents: [
      {
        id: "sr-1",
        text: "2do Ejemplar del Acta Electoral (con láminas de protección)",
        isCritical: true,
      },
    ],
    warning:
      "Copia destinada a la sede central de la ONPE en Lima para archivo histórico, control y auditoría electoral.",
  },
  {
    color: "verde",
    name: "Sobre Verde",
    badgeColorClass: "bg-emerald-600 text-white",
    bgClass: "bg-emerald-950/40",
    borderClass: "border-emerald-500",
    recipient: "JNE (Jurado Nacional de Elecciones)",
    priority: "3er Ejemplar · Fiscalización Electoral Superior",
    contents: [
      {
        id: "sv-1",
        text: "3er Ejemplar del Acta Electoral (con láminas de protección)",
        isCritical: true,
      },
    ],
    warning:
      "Copia enviada al Pleno del Jurado Nacional de Elecciones para el cotejo oficial en caso de actas observadas o apeladas.",
  },
  {
    color: "celeste",
    name: "Sobre Celeste",
    badgeColorClass: "bg-sky-600 text-white",
    bgClass: "bg-sky-950/40",
    borderClass: "border-sky-500",
    recipient: "JEE (Jurado Electoral Especial) + Impugnaciones",
    priority: "4to Ejemplar · Justicia Electoral Jurisdiccional",
    contents: [
      {
        id: "sc-1",
        text: "4to Ejemplar del Acta Electoral (con láminas de protección)",
        isCritical: true,
      },
      {
        id: "sc-2",
        text: "Sobres especiales conteniendo Cédulas de Votos Impugnados (si los hubiera)",
        isCritical: false,
      },
      {
        id: "sc-3",
        text: "Sobres de Impugnación de Identidad del Elector (si los hubiera)",
        isCritical: false,
      },
    ],
    warning:
      "⚠️ REGLA CRÍTICA DE LA ONPE: Si hubo votos impugnados o impugnaciones de identidad durante el sufragio o escrutinio, sus sobres especiales van EXCLUSIVAMENTE dentro de este sobre celeste para que los resuelva el JEE. Nunca en el sobre plomo.",
  },
  {
    color: "anaranjado",
    name: "Sobre Anaranjado",
    badgeColorClass: "bg-orange-600 text-white",
    bgClass: "bg-orange-950/40",
    borderClass: "border-orange-500",
    recipient: "ODPE (Lista de Electores y Asistencia)",
    priority: "Material Padronal · Control de Firmas y Asistencia",
    contents: [
      {
        id: "sa-1",
        text: "Lista de Electores completa (cuadernillo con firmas, huellas y sellos de 'NO VOTÓ')",
        isCritical: true,
      },
      {
        id: "sa-2",
        text: "Hoja de Control de Asistencia de Miembros de Mesa",
        isCritical: true,
      },
      {
        id: "sa-3",
        text: "Relación de Miembros de Mesa No Sorteados (si asumió un suplente o de la fila)",
        isCritical: false,
      },
    ],
    warning:
      "⛔ PROHIBIDO: Nunca colocar actas electorales aquí. Este sobre es exclusivo para el padrón de firmas y el control de asistencia.",
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

/**
 * Stable check key for one visual reference of a task: the visual unit itself is
 * the checkable item. Key format: "<taskId>::<ref.id>".
 */
export function getTaskVisualKey(taskId: string, refId: string): string {
  return `${taskId}::${refId}`;
}

/**
 * Check keys for every visual reference attached to a task.
 */
export function getTaskVisualKeys(task: ChecklistTask): string[] {
  return (task.visualRefs ?? []).map((ref) =>
    getTaskVisualKey(task.id, ref.id),
  );
}
