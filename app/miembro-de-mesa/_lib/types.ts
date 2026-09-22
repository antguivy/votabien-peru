export type PhaseId =
  | "instalacion"
  | "sufragio"
  | "cierre"
  | "escrutinio"
  | "entrega";

export type MemberRole =
  | "presidente"
  | "secretario"
  | "tercer_miembro"
  | "todos";

export type AgreementAssignee = "Presidente" | "Secretario" | "Tercer Miembro";

export type RoleResponsible =
  | "Presidente"
  | "Secretario"
  | "Tercer Miembro"
  | "Coordinación Interna"
  | "Todos";

export interface ChecklistTask {
  id: string;
  phaseId: PhaseId;
  title: string;
  description: string;
  isCritical: boolean;
  irreversibleWarning?: string;
  roleResponsible?: RoleResponsible;
  legalNote?: string;
}

export interface PhaseDefinition {
  id: PhaseId;
  title: string;
  subtitle: string;
  timeframe: string;
  color: string;
  warningAlert?: string;
  tasks: ChecklistTask[];
}

export type ElectionType = "5A" | "5B" | "5C" | "5D";

export interface ElectionOption {
  id: string;
  name: string;
  votes: number;
}

export interface ElectionSheetState {
  type: ElectionType;
  title: string;
  subtitle: string;
  options: ElectionOption[];
  whiteVotes: number;
  nullVotes: number;
  impugnedVotes: number;
}

export interface ReconciliationResult {
  totalBallotsCounted: number;
  targetVoters: number;
  difference: number;
  status: "match" | "surplus" | "deficit" | "pending";
  message: string;
}

export type VoteRuling = "valid" | "null" | "white" | "impugned";

export interface VoteScenario {
  id: string;
  title: string;
  ruling: VoteRuling;
  category: "cruz-aspa" | "marcas-ajenas" | "cédula-física" | "preferencial";
  rule: string;
  legalArticle: string;
  recommendation: string;
  visualType:
    | "cruz_perfecta"
    | "cruz_desbordada"
    | "cruz_linea"
    | "signo_check"
    | "carita_feliz"
    | "texto_o_firma"
    | "cedula_rota"
    | "cedula_sin_firma";
}

export type EnvelopeColor =
  | "plomo"
  | "rojo"
  | "verde"
  | "celeste"
  | "anaranjado";

export interface SecurityEnvelope {
  color: EnvelopeColor;
  name: string;
  badgeColorClass: string;
  bgClass: string;
  borderClass: string;
  recipient: string;
  priority: string;
  contents: {
    id: string;
    text: string;
    isCritical: boolean;
  }[];
  warning: string;
}

export interface ProtocolItem {
  id: string;
  category: "ausencia" | "atencion" | "personeros" | "legal";
  title: string;
  summary: string;
  steps: string[];
  legalReference: string;
}
