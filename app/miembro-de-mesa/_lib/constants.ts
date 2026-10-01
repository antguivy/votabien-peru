import {
  ChecklistTask,
  PhaseDefinition,
  VoteScenario,
  SecurityEnvelope,
  ProtocolItem,
  VisualRef,
} from "./types";

/* ── ONPE reference visual units (public/miembros_mesa/) ── */

const RECEP_UTILES: VisualRef = {
  id: "recep-utiles",
  title: "Paquete de Útiles",
  images: [
    {
      src: "/miembros_mesa/paquete_utiles.webp",
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
      src: "/miembros_mesa/paquete_instalacion_1.webp",
      alt: "Manual de miembros de mesa, cartilla de personeros y etiqueta de restos",
      caption:
        "Manual de miembros, cartilla de personeros y etiqueta de restos",
    },
    {
      src: "/miembros_mesa/paquete_instalacion_2.webp",
      alt: "Cédulas de sufragio y Hoja de control de asistencia",
      caption: "Cédulas de sufragio y Hoja de control de asistencia (3a)",
    },
    {
      src: "/miembros_mesa/paquete_instalacion_3.webp",
      alt: "Actas electorales de instalación, sufragio y escrutinio",
      caption:
        "Actas de instalación, sufragio y escrutinio (Secciones A, B y C)",
    },
    {
      src: "/miembros_mesa/paquete_instalacion_4.webp",
      alt: "Hojas borrador y certificados de participación",
      caption: "Hojas borrador (5a-5d) y certificados de participación",
    },
    {
      src: "/miembros_mesa/paquete_instalacion_5.webp",
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
      src: "/miembros_mesa/paquete_escrutinio_1.webp",
      alt: "Sobres plásticos de colores para actas y bolsa de repliegue",
      caption:
        "Sobres de colores (Plomo, Rojo, Verde, Celeste) y bolsa de repliegue",
    },
    {
      src: "/miembros_mesa/paquete_escrutinio_2.webp",
      alt: "Láminas autoadhesivas transparentes de protección",
      caption:
        "Láminas de protección para casilleros de resultados y observaciones",
    },
    {
      src: "/miembros_mesa/paquete_escrutinio_3.webp",
      alt: "Sobre y formulario para impugnaciones",
      caption: "Sobre y formulario de impugnación de votos e identidad",
    },
    {
      src: "/miembros_mesa/paquete_escrutinio_4.webp",
      alt: "Cargo de entrega oficial al coordinador de la ONPE",
      caption: "Cargo de entrega de actas y material electoral oficial",
    },
    {
      src: "/miembros_mesa/paquete_escrutinio_5.webp",
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
      src: "/miembros_mesa/1_2_revision_aula.webp",
      alt: "Relación de electores pegada en la puerta exterior del aula",
      caption: "Puerta exterior: pegar la 'Relación de electores'",
    },
    {
      src: "/miembros_mesa/1_2_revision_camara_secreta.webp",
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
      src: "/miembros_mesa/1_3_rotulado_restos_electorales.webp",
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
      src: "/miembros_mesa/1_4_cantidad_electores.webp",
      alt: "Rótulo del paquete con la cantidad de electores hábiles",
      caption:
        "Paso 1: Verificar en el rótulo el total de electores hábiles de la mesa",
    },
    {
      src: "/miembros_mesa/1_4_conteo_cedulas.webp",
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
      src: "/miembros_mesa/1_5_firma_cedulas.webp",
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
      src: "/miembros_mesa/1_6_desglozar_asistencia.webp",
      alt: "Desglosar la hoja de control de asistencia 3a",
      caption: "Paso 1: Desglosar la Hoja de Control de Asistencia (3a)",
    },
    {
      src: "/miembros_mesa/1_6_firma_asistencia_miembros.webp",
      alt: "Firma y huella de los miembros presentes",
      caption:
        "Paso 2: Miembros firman y colocan huella (escribir FALTÓ a ausentes)",
    },
    {
      src: "/miembros_mesa/1_6_firma_presidente.webp",
      alt: "Firma del Presidente y constancia de refrigerios",
      caption:
        "Paso 3: El Presidente marca recepción de refrigerios y firma al pie",
    },
    {
      src: "/miembros_mesa/1_6_guardar_asistencia.webp",
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
      src: "/miembros_mesa/1_7_desglozar_actas_regionales.webp",
      alt: "Desglose de actas regionales",
      caption: "Desglosar las 4 actas electorales regionales",
    },
    {
      src: "/miembros_mesa/1_7_desglozar_actas_municipales.webp",
      alt: "Desglose de actas municipales",
      caption: "Desglosar las 4 actas electorales municipales",
    },
    {
      src: "/miembros_mesa/1_7_completar_acta_instalacion.webp",
      alt: "Llenar la Sección A del Acta de Instalación",
      caption:
        "Llenar hora de inicio, estado del material y cantidad de cédulas",
    },
    {
      src: "/miembros_mesa/1_7_si_no_puede_firmar.webp",
      alt: "Procedimiento si un miembro no puede firmar",
      caption:
        "Si un miembro no puede firmar: imprime huella digital y se anota en observaciones",
      isOptional: true,
      optionalBadge: "Solo si aplica",
    },
  ],
};

const REF_ACTAS_ESCRUTINIO: VisualRef = {
  id: "actas-escrutinio",
  title: "Actas de Escrutinio (Sección C)",
  images: [
    {
      src: "/miembros_mesa/4_7_llenar_seccion_C.webp",
      alt: "Paso de la hoja borrador al acta electoral: copiar los resultados a la sección C",
      caption:
        "Copiar a la sección C del acta: hora de inicio, cada columna de votos, votos en blanco y nulos, y el total de votos emitidos",
    },
  ],
};

const REF_MESA_ESCRUTINIO: VisualRef = {
  id: "hojas-borrador",
  title: "Hojas Borrador (5a-5b)",
  images: [
    {
      src: "/miembros_mesa/4_1_despejar_mesa_solo_dejar_anfora.webp",
      alt: "Despejar mesa y dejar anfora",
      caption: "Despejar mesa y dejar anfora",
    },
    {
      src: "/miembros_mesa/4_1_hora_inicio_escrutinio_y_guardar.webp",
      alt: "Hora de inicio del escrutinio",
      caption: "Colocar hora de inicio (5a y 5b) y guardar",
    },
  ],
};

const REF_LAMINAS_REGIONAL: VisualRef = {
  id: "laminas-proteccion-regional",
  title: "Láminas Autoadhesivas",
  images: [
    {
      src: "/miembros_mesa/4_8_colocar_laminas_proteccion.webp",
      alt: "Colocación de la lámina autoadhesiva sobre los resultados y observaciones del acta",
      caption:
        "Pegar la lámina sobre los resultados y sobre el campo de Observaciones, aunque esté vacío. Una vez pegada no se retira",
    },
  ],
};

const REF_CARTEL_REGIONAL: VisualRef = {
  id: "cartel-regional",
  title: "Cartel de Resultados Regional",
  images: [
    {
      src: "/miembros_mesa/4_10_pegar_resultados.webp",
      alt: "Colocación del cartel de resultados regional en la parte externa del aula",
      caption:
        "Llenar el cartel de resultados regional y pegarlo afuera del aula. Este paso cierra el escrutinio regional",
    },
  ],
};

const REF_CARTELES_RESULTADOS: VisualRef = {
  id: "carteles-resultados",
  title: "Cartel de Resultados Municipal",
  images: [
    {
      src: "/miembros_mesa/5_9_pegar_resultado_municipal.webp",
      alt: "Colocación del cartel de resultados municipal junto al cartel regional en la parte externa del aula",
      caption:
        "Llenar el cartel municipal y pegarlo afuera del aula, junto al cartel regional que ya está publicado",
    },
  ],
};

const REF_ACTAS_SUFRAGIO: VisualRef = {
  id: "actas-sufragio",
  title: "Acta de Sufragio (Sección B)",
  images: [
    {
      src: "/miembros_mesa/3_4_actas_sufragio_B.webp",
      alt: "Sección B del acta electoral: total de ciudadanos que votaron y total de cédulas no utilizadas, en letras y en números, con firmas y DNI de los miembros de mesa",
      caption:
        "En letras y en números: total de ciudadanos que votaron y total de cédulas no utilizadas. Además, hora de término, firmas, nombres, apellidos y DNI de los tres miembros, y firma de los personeros si desean",
    },
  ],
};

const REF_CONTAR_CEDULAS: VisualRef = {
  id: "contar-cedulas",
  title: "Contar las cédulas y revisar las firmas",
  images: [
    {
      src: "/miembros_mesa/4_2_contar_cedulas_sin_desdoblar.webp",
      alt: "Cédulas todavía dobladas contadas contra el total de ciudadanos que votaron del acta de sufragio",
      caption:
        "Paso 1: contar las cédulas dobladas, sin abrirlas. El resultado debe ser igual al total de ciudadanos que votaron del acta",
    },
    {
      src: "/miembros_mesa/4_2_desdoblar_cedulas_firmas_arriba.webp",
      alt: "Cédulas desdobladas mostrando las firmas de los miembros de mesa en el reverso",
      caption:
        "Paso 2: desdoblar y revisar que la cédula tenga las firmas de los miembros de mesa. Si no las tiene, es voto nulo",
    },
  ],
};

const REF_ENTREGA_SOBRES_REGIONAL: VisualRef = {
  id: "entrega-sobres-regional",
  title: "Guardar y entregar las actas en sobres",
  images: [
    {
      src: "/miembros_mesa/4_9_guardar_en_sobres.webp",
      alt: "Las cuatro actas regionales guardadas cada una en un sobre plástico de color",
      caption:
        "Paso 1: guardar un acta en cada sobre. Plomo para la ODPE, rojo para la ONPE, verde para el JNE y celeste para el JEE. Luego cerrarlos",
    },
    {
      src: "/miembros_mesa/4_9_entregar_sobres.webp",
      alt: "El presidente de mesa entrega los sobres cerrados al personal de la ONPE",
      caption:
        "Paso 2: el presidente entrega los sobres cerrados al personal de la ONPE. El sobre anaranjado todavía no se entrega",
    },
    {
      src: "/miembros_mesa/4_9_cargo_de_entrega.webp",
      alt: "Cargo de entrega de actas y material electoral marcado con aspa por cada sobre entregado",
      caption:
        "Paso 3: por cada sobre entregado, marcar con un aspa el cargo de entrega en la columna de acta regional",
    },
  ],
};

const REF_ENTREGA_SOBRES_MUNICIPAL: VisualRef = {
  id: "entrega-sobres-municipal",
  title: "Entregar los sobres municipales",
  images: [
    {
      src: "/miembros_mesa/5_8_entregar_los_5_sobres.webp",
      alt: "El presidente de mesa entrega los sobres municipales y el sobre anaranjado al personal de la ONPE",
      caption:
        "Paso 1: entregar al personal de la ONPE los cuatro sobres municipales cerrados y, ahora sí, el sobre anaranjado",
    },
    {
      src: "/miembros_mesa/5_8_marcar_el_cargo.webp",
      alt: "Cargo de entrega marcado con aspa en la columna de acta municipal",
      caption:
        "Paso 2: marcar con un aspa el cargo de entrega en la columna de acta municipal por cada sobre entregado",
    },
  ],
};

const REF_BOLSA_REPLIEGUE: VisualRef = {
  id: "bolsa-repliegue",
  title: "Sobre de cédulas no impugnadas",
  images: [
    {
      src: "/miembros_mesa/6_2_guardar_cedulas_no_impugnadas.webp",
      alt: "Sobre de cédulas no impugnadas con la etiqueta completada",
      caption:
        "Paso 1: sacar el sobre de repliegue de la bolsa y guardar solo las cédulas utilizadas no impugnadas. Completar la etiqueta",
    },
    {
      src: "/miembros_mesa/6_2_entregar_sobre_cedulas.webp",
      alt: "Entrega del sobre de cédulas no impugnadas al personal de la ONPE",
      caption:
        "Paso 2: cerrar el sobre y entregarlo al personal de la ONPE. No van aquí las cédulas no utilizadas",
    },
  ],
};

const REF_CARGO_ENTREGA: VisualRef = {
  id: "cargo-entrega",
  title: "Entrega final y cargo firmado",
  images: [
    {
      src: "/miembros_mesa/6_4_entregar_caja_restos.webp",
      alt: "Entrega de la caja de restos electorales al personal de la ONPE",
      caption:
        "Paso 1: entregar al personal de la ONPE la caja de restos electorales cerrada",
    },
    {
      src: "/miembros_mesa/6_4_entregar_anfora_cabinas.webp",
      alt: "Entrega del ánfora electoral al personal de la ONPE",
      caption: "Paso 2: entregar el ánfora y las cabinas de votación",
    },
    {
      src: "/miembros_mesa/6_4_completar_el_cargo_de_entrega.webp",
      alt: "Cargo de entrega completado con aspa por cada material entregado",
      caption:
        "Paso 3: marcar el cargo por la caja de restos, el ánfora y las cabinas",
    },
    {
      src: "/miembros_mesa/6_4_recibir_cargo_de_entrega_firmado.webp",
      alt: "Cargo de entrega firmado que conserva el presidente de mesa",
      caption:
        "Paso 4: el presidente firma y recibe su copia del cargo. Consérvala, es tu comprobante",
    },
  ],
};

const REF_CERTIFICADOS: VisualRef = {
  id: "certificados",
  title: "Certificados de Participación",
  images: [
    {
      src: "/miembros_mesa/6_1_certificado_participacion.webp",
      alt: "Certificados de participación de los miembros de mesa",
      caption:
        "Escribir el nombre y el DNI de cada miembro en su certificado y entregarlo. Sirve para el descanso de la Ley 32231",
    },
  ],
};

const REF_CAJA_RESTOS: VisualRef = {
  id: "caja-restos",
  title: "Caja de restos electorales",
  images: [
    {
      src: "/miembros_mesa/6_3_destruir_cedulas_no_impugnadas.webp",
      alt: "Destrucción de las cédulas no utilizadas y su depósito en la caja de restos",
      caption:
        "Paso 1: destruir las cédulas no utilizadas y ponerlas en la caja de restos electorales",
    },
    {
      src: "/miembros_mesa/6_3_guardar_lapiceros_sobres_imp_no_usados.webp",
      alt: "Lapiceros, tampón y sobres de impugnación no usados dentro de la bolsa de reciclaje",
      caption:
        "Paso 2: en la bolsa de reciclaje van lapiceros, tampón y sobres de impugnación no usados",
    },
    {
      src: "/miembros_mesa/6_3_cerrar_caja_de_restos.webp",
      alt: "Cierre de la caja de restos electorales con cinta de embalaje",
      caption:
        "Paso 3: cerrar la bolsa de reciclaje y cerrar la caja de restos electorales",
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
        roleResponsible: "Coordinación Interna",
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
          "Presidente: administra cédulas y DNI. Secretario: maneja Lista de Electores y tampón. Tercer miembro: custodia el ánfora.",
        isCritical: true,
        roleResponsible: "Todos",
      },
      {
        id: "suf-03",
        phaseId: "sufragio",
        title: "Circuito de atención a electores",
        description:
          "1. Presidente solicita DNI.\n2. Encargado de lista busca número de orden y valida foto.\n3. Presidente entrega cédula.\n4. Encargado de ánfora vigila depósito.\n5. Elector firma y huella.\n6. Presidente devuelve DNI (Págs. 12-13).",
        isCritical: true,
        roleResponsible: "Todos",
      },
      {
        id: "suf-04",
        phaseId: "sufragio",
        title: "Atención preferente y Módulo Temporal de Votación",
        description:
          "Prioridad a adultos mayores, gestantes y personas con discapacidad. Si hay baja movilidad, trasladarse con cédula, lista, tampón y ánfora (dejando el resto del material bajo resguardo de ONPE).",
        isCritical: false,
        roleResponsible: "Todos",
      },
    ],
  },
  {
    id: "cierre",
    title: "3. Cierre de Sufragio",
    subtitle: "05:00 PM: Cierre de puertas y consolidación del padrón",
    timeframe: "05:00 PM APROXIMADAMENTE",
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
        title: "Marcado de 'NO VOTÓ' a ausentes",
        description:
          "Revisar la Lista de Electores página por página. Escribir 'NO VOTÓ' en el espacio de firma de cada ciudadano que no acudió (Pág. 2 PDF).",
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
        title: "Llenado de las 8 actas de sufragio (sección B)",
        description:
          "Llenar las 8 actas (4 regionales y 4 municipales) con: Total de ciudadanos que votaron, cédulas no usadas, hora y firmas de miembros (Pág. 2 PDF).",
        isCritical: true,
        roleResponsible: "Secretario",
        visualRefs: [REF_ACTAS_SUFRAGIO],
      },
    ],
  },
  {
    id: "escrutinio_regional",
    title: "4. Escrutinio regional",
    subtitle: "Gobernador y consejeros: hojas 5A y 5B, actas, sobres y cartel",
    timeframe: "Primero. No abrir 5C ni 5D",
    color: "from-purple-600 to-violet-700",
    warningAlert:
      "El escrutinio empieza solo con la Elección Regional. Las hojas 5C y 5D permanecen guardadas hasta pegar el cartel regional fuera del aula (Manual ONPE, págs. 18 y 24, pasos 1 y 4).",
    tasks: [
      {
        id: "reg-01",
        phaseId: "escrutinio_regional",
        title: "Dejar solo el ánfora y anotar la hora de inicio",
        description:
          "Guardar el material y dejar solo el ánfora.\nDesglosar únicamente las hojas borrador regionales 5A (gobernador, anverso) y 5B (consejero, reverso).\nAnotar en cada una la hora de inicio. No desglosar 5C ni 5D (Manual pág. 18, paso 1).",
        isCritical: true,
        roleResponsible: "Todos",
        visualRefs: [REF_MESA_ESCRUTINIO],
      },
      {
        id: "reg-02",
        phaseId: "escrutinio_regional",
        title: "Contar las cédulas y revisar la firma del reverso",
        description:
          "Contar las cédulas sin abrirlas. Deben coincidir con el total de ciudadanos que votaron del Acta de Sufragio.\nSi sobran, destruir al azar las excedentes sin ver el voto. Si faltan, continuar y anotarlo en Observaciones.\nAl abrir, separar las que no tengan la firma del presidente: son nulas (Manual págs. 19, pasos 2 y 3).",
        isCritical: true,
        irreversibleWarning:
          "Cédula sin firma del presidente en el reverso es voto nulo.",
        roleResponsible: "Todos",
        visualRefs: [REF_CONTAR_CEDULAS],
      },
      {
        id: "reg-03",
        phaseId: "escrutinio_regional",
        title: "Repartir los tres puestos de conteo",
        description:
          "Presidente al centro: cédulas por escrutar.\nUn miembro: hojas borrador 5A y 5B.\nOtro miembro: cédulas ya escrutadas.\nSobre la mesa van solo esas dos hojas, anverso y reverso (Manual pág. 24, pasos 4 y 5).",
        isCritical: true,
        roleResponsible: "Todos",
      },
      {
        id: "reg-04",
        phaseId: "escrutinio_regional",
        title: "Calificar cada cédula en voz alta con los personeros",
        description:
          "Revisar cada cédula en conjunto y mostrarla a los personeros.\nCalificar primero la columna de gobernador y vicegobernador. Después, la de consejero regional.\nLas dudas se resuelven en la mesa por mayoría (Art. 283 LOE / Manual pág. 25, paso 6).",
        isCritical: true,
        roleResponsible: "Presidente",
      },
      {
        id: "reg-05",
        phaseId: "escrutinio_regional",
        title: "Anotar los palotes en 5A y luego en 5B",
        description:
          "El encargado de las hojas escucha cada voto y traza un palote, agrupado de cinco en cinco.\nPrimero la hoja 5A (gobernador). Luego la misma acción en la 5B (consejero). No anotar aún votos municipales (Manual pág. 25, paso 7).",
        isCritical: true,
        roleResponsible: "Secretario",
      },
      {
        id: "reg-06",
        phaseId: "escrutinio_regional",
        title: "Sumar y verificar el cuadre de 5A y 5B",
        description:
          "En cada hoja regional: sumar palotes, anotar el total por opción y el Total de Votos Emitidos.\nEse total debe ser igual al Acta de Sufragio regional. La ONPE permite usar la calculadora del celular.\nSi no cuadra, revisar sumas. Si la diferencia persiste, anotarla en Observaciones. No copiar al acta oficial mientras el descuadre no esté revisado (Manual págs. 26-27, pasos 8 y 9).",
        isCritical: true,
        irreversibleWarning:
          "Prohibido transcribir a la sección C si el total no fue verificado contra el Acta de Sufragio.",
        roleResponsible: "Todos",
      },
      {
        id: "reg-07",
        phaseId: "escrutinio_regional",
        title: "Llenar la sección C de las 4 actas regionales",
        description:
          "Extraer las cuatro actas regionales y llenar la sección C con letras y números claros.\nCopiar hora de inicio, total de ciudadanos que votaron, columna de gobernador desde la 5A y columna de consejero desde la 5B.\nFirmar miembros de mesa. Los personeros firman si lo desean. Anotar hora de término (Manual págs. 28-29, paso 10).",
        isCritical: true,
        roleResponsible: "Secretario",
        visualRefs: [REF_ACTAS_ESCRUTINIO],
      },
      {
        id: "reg-08",
        phaseId: "escrutinio_regional",
        title: "Pegar las láminas de protección en las actas regionales",
        description:
          "Pegar las láminas regionales sobre los resultados y el campo de Observaciones de las cuatro actas regionales, aunque Observaciones esté vacío (Manual pág. 30, paso 11).",
        isCritical: true,
        irreversibleWarning:
          "Punto de no retorno: la lámina pegada no se retira ni se enmienda.",
        roleResponsible: "Todos",
        visualRefs: [REF_LAMINAS_REGIONAL],
      },
      {
        id: "reg-09",
        phaseId: "escrutinio_regional",
        title: "Guardar las actas en sobres y entregarlas a la ONPE",
        description:
          "Separar un juego de sobres plomo (ODPE), rojo (ONPE), verde (JNE) y celeste (JEE).\nGuardar un acta regional en cada sobre y cerrarlos.\nEl presidente los entrega al personal de la ONPE y marca con aspa el cargo de entrega. El sobre anaranjado no se entrega todavía (Manual págs. 30-31, pasos 12 a 14).",
        isCritical: true,
        irreversibleWarning:
          "No metas actas municipales en este primer juego. El anaranjado espera al cierre municipal.",
        roleResponsible: "Presidente",
        visualRefs: [REF_ENTREGA_SOBRES_REGIONAL],
      },
      {
        id: "reg-10",
        phaseId: "escrutinio_regional",
        title: "Pegar el cartel regional fuera del aula",
        description:
          "Llenar el Cartel de resultados de la Elección Regional y pegarlo en la parte externa del aula.\nEste paso cierra el escrutinio regional. Solo después se abre el escrutinio municipal (Manual pág. 31, paso 15).",
        isCritical: true,
        irreversibleWarning:
          "No desglosar las hojas 5C y 5D antes de pegar este cartel.",
        roleResponsible: "Coordinación Interna",
        visualRefs: [REF_CARTEL_REGIONAL],
      },
      {
        id: "reg-11",
        phaseId: "escrutinio_regional",
        title: "Entregar copia del acta regional a los personeros",
        description:
          "Si un personero acreditado lo solicita, llenar, firmar y entregarle un acta electoral regional. Esa copia no lleva lámina ni va en sobre. Si nadie la pide, marcar la tarea como hecha (Manual pág. 31, paso 16).",
        isCritical: false,
        roleResponsible: "Presidente",
      },
    ],
  },
  {
    id: "escrutinio_municipal",
    title: "5. Escrutinio municipal",
    subtitle: "Provincial y distrital: hojas 5C y 5D, actas, sobres y cartel",
    timeframe: "Después del cartel regional",
    color: "from-indigo-600 to-blue-700",
    warningAlert:
      "Recién ahora se desglosan 5C y 5D. El cuadre municipal se contrasta con el Acta de Sufragio municipal, no con las sumas regionales (Manual págs. 32 y 35, pasos 17 y 21).",
    tasks: [
      {
        id: "mun-01",
        phaseId: "escrutinio_municipal",
        title: "Sacar las hojas 5C y 5D y anotar la hora",
        description:
          "Desglosar la hoja 5C (Elección Municipal Provincial, anverso) y la 5D (Elección Municipal Distrital, reverso).\nAnotar en cada una la hora de inicio de este segundo escrutinio.\nOrganizar los mismos tres puestos que en el regional (Manual pág. 32, paso 17).",
        isCritical: true,
        roleResponsible: "Todos",
      },
      {
        id: "mun-02",
        phaseId: "escrutinio_municipal",
        title: "Calificar cada cédula: provincial y luego distrital",
        description:
          "Revisar otra vez cada cédula.\nCalificar primero la columna de la Elección Municipal Provincial. Después, la Distrital.\nMostrar la cédula a los personeros (Manual pág. 32, paso 18).",
        isCritical: true,
        roleResponsible: "Presidente",
      },
      {
        id: "mun-03",
        phaseId: "escrutinio_municipal",
        title: "Anotar los palotes en 5C y luego en 5D",
        description:
          "Trazar palotes de cinco en cinco en la hoja 5C (provincial) y repetir la misma acción en la 5D (distrital). No reutilizar los palotes de 5A ni 5B (Manual pág. 33, paso 19).",
        isCritical: true,
        roleResponsible: "Secretario",
      },
      {
        id: "mun-04",
        phaseId: "escrutinio_municipal",
        title: "Sumar y verificar el cuadre de 5C y 5D",
        description:
          "Sumar cada hoja municipal y registrar el Total de Votos Emitidos.\nDebe coincidir con el total de ciudadanos que votaron del Acta de Sufragio municipal.\nSi no cuadra, revisar antes de continuar. Si la diferencia persiste, anotarla en Observaciones (Manual págs. 34-35, pasos 20 y 21).",
        isCritical: true,
        irreversibleWarning:
          "Prohibido transcribir a la sección C municipal si el total no fue verificado.",
        roleResponsible: "Todos",
      },
      {
        id: "mun-05",
        phaseId: "escrutinio_municipal",
        title: "Llenar la sección C de las 4 actas municipales",
        description:
          "Extraer las cuatro actas municipales y llenar la sección C.\nCopiar la columna provincial desde la 5C y la distrital desde la 5D, más hora de inicio, total de votantes, firmas y hora de término (Manual págs. 36-37, paso 22).",
        isCritical: true,
        roleResponsible: "Secretario",
      },
      {
        id: "mun-06",
        phaseId: "escrutinio_municipal",
        title: "Pegar las láminas de protección en las actas municipales",
        description:
          "Pegar las láminas de la Elección Municipal sobre resultados y Observaciones de las cuatro actas municipales, aunque Observaciones esté vacío (Manual pág. 38, paso 23).",
        isCritical: true,
        irreversibleWarning:
          "Punto de no retorno: la lámina municipal pegada no se retira.",
        roleResponsible: "Todos",
        visualRefs: [],
      },
      {
        id: "mun-07",
        phaseId: "escrutinio_municipal",
        title: "Guardar las actas municipales en el segundo juego de sobres",
        description:
          "Separar el segundo juego: plomo (ODPE), rojo (ONPE), verde (JNE) y celeste (JEE).\nGuardar un acta municipal en cada sobre y cerrarlos.\nSi hubo impugnación de identidad o de voto, esos sobres van solo dentro del celeste municipal (Manual pág. 38, paso 24).",
        isCritical: true,
        irreversibleWarning:
          "No reutilices los sobres ya entregados en el escrutinio regional.",
        roleResponsible: "Todos",
        visualRefs: [],
      },
      {
        id: "mun-08",
        phaseId: "escrutinio_municipal",
        title: "Entregar los sobres municipales y el sobre anaranjado",
        description:
          "El presidente entrega a la ONPE los cuatro sobres municipales cerrados y, ahora sí, el sobre anaranjado (lista de electores y hoja de asistencia).\nMarcar con aspa el cargo por cada sobre entregado (Manual pág. 39, pasos 25 y 26).",
        isCritical: true,
        roleResponsible: "Presidente",
        visualRefs: [REF_ENTREGA_SOBRES_MUNICIPAL],
      },
      {
        id: "mun-09",
        phaseId: "escrutinio_municipal",
        title: "Pegar el cartel municipal fuera del aula",
        description:
          "Llenar el Cartel de resultados de la Elección Municipal y pegarlo en la parte externa del aula, junto al cartel regional que ya está publicado (Manual pág. 40, paso 27).",
        isCritical: true,
        roleResponsible: "Coordinación Interna",
        visualRefs: [REF_CARTELES_RESULTADOS],
      },
      {
        id: "mun-10",
        phaseId: "escrutinio_municipal",
        title: "Entregar copia del acta municipal a los personeros",
        description:
          "Si un personero acreditado lo solicita, entregar un acta electoral municipal firmada, sin lámina y sin sobre. Si nadie la pide, marcar la tarea como hecha (Manual pág. 40, paso 28).",
        isCritical: false,
        roleResponsible: "Presidente",
      },
    ],
  },
  {
    id: "entrega",
    title: "6. Cierre y repliegue",
    subtitle: "Certificados, cédulas, restos y cargo final",
    timeframe: "Después de los dos carteles",
    color: "from-rose-600 to-red-700",
    warningAlert:
      "Los sobres de actas y los dos carteles ya se entregaron en su elección. Aquí solo queda el repliegue y el cargo final (Manual págs. 41-42, pasos 29 a 35).",
    tasks: [
      {
        id: "ent-05",
        phaseId: "entrega",
        title: "Certificados de participación",
        description:
          "Desglosar los certificados, escribir nombres y apellidos, y entregarlos a quien corresponda. Sirven para el descanso remunerado de la Ley 32231 (Manual pág. 41, paso 29).",
        isCritical: false,
        roleResponsible: "Todos",
        visualRefs: [REF_CERTIFICADOS],
      },
      {
        id: "ent-03",
        phaseId: "entrega",
        title: "Guardar las cédulas no impugnadas en su sobre",
        description:
          "Sacar el sobre de repliegue de la bolsa de materiales.\nGuardar solo las cédulas utilizadas no impugnadas, completar la etiqueta, cerrar y entregar el sobre a la ONPE.\nNo colocar aquí las cédulas no utilizadas (Manual pág. 41, pasos 30 y 31).",
        isCritical: true,
        roleResponsible: "Coordinación Interna",
        visualRefs: [REF_BOLSA_REPLIEGUE],
      },
      {
        id: "ent-06",
        phaseId: "entrega",
        title: "Destruir las cédulas no usadas y armar la caja de restos",
        description:
          "Destruir las cédulas no utilizadas y ponerlas en la caja de restos electorales.\nEn la bolsa de reciclaje van lapiceros, tampón y sobres de impugnación no usados. Cerrar esa bolsa y colocarla también en la caja de restos (Manual pág. 42, pasos 32 y 33).",
        isCritical: true,
        roleResponsible: "Todos",
        visualRefs: [REF_CAJA_RESTOS],
      },
      {
        id: "ent-04",
        phaseId: "entrega",
        title: "Entregar la caja de restos, el ánfora y las cabinas",
        description:
          "Entregar a la ONPE la caja de restos, el ánfora y las cabinas.\nMarcar el cargo de entrega y firmarlo. El presidente recibe su copia (Manual pág. 42, pasos 34 y 35).",
        isCritical: true,
        irreversibleWarning:
          "Conserva la copia firmada del cargo. Es el comprobante de la entrega.",
        roleResponsible: "Presidente",
        visualRefs: [REF_CARGO_ENTREGA],
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
      "Regla crítica: si hubo votos impugnados o impugnaciones de identidad, esos sobres van dentro de este sobre celeste para que los resuelva el JEE. Nunca en el sobre plomo.",
  },
  {
    color: "anaranjado",
    name: "Sobre Anaranjado",
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
      "Prohibido: nunca colocar actas electorales aquí. Este sobre es solo para el padrón de firmas y el control de asistencia.",
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
 * Stable check key for one specific reference image / subtask.
 * Key format: "<taskId>::<image.src>".
 */
export function getTaskVisualItemKey(taskId: string, imageSrc: string): string {
  return `${taskId}::${imageSrc}`;
}

/**
 * Returns required check keys for images attached to a task.
 * Filters out images marked with isOptional: true so conditional steps don't block 100%.
 */
export function getTaskVisualRequiredKeys(task: ChecklistTask): string[] {
  return (task.visualRefs ?? []).flatMap((ref) =>
    ref.images
      .filter((img) => !img.isOptional)
      .map((img) => getTaskVisualItemKey(task.id, img.src)),
  );
}
