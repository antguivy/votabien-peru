"use server";

import { getCandidatesCards } from "@/queries/public/candidacies";
import { CandidateCard } from "@/interfaces/candidate";

interface LoadMoreCandidatesParams {
  electoral_process_id: string;
  type?: string;
  districts?: string[];
  parties?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
  alerts?: string[];
}

export async function loadMoreCandidates(
  params: LoadMoreCandidatesParams,
): Promise<CandidateCard[]> {
  return getCandidatesCards(params);
}
