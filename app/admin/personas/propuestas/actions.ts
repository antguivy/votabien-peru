"use server";

import {
  applyResearchFinding,
  rejectResearchFinding,
} from "../revisiones/actions";

export async function applyResearchProposal(proposalId: string) {
  return await applyResearchFinding(proposalId);
}

export async function rejectResearchProposal(proposalId: string) {
  return await rejectResearchFinding(proposalId);
}
