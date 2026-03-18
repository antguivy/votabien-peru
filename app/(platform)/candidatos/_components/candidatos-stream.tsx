import CandidatosList from "@/components/politics/candidatos-list";
import { CandidateCard, FiltersCandidates } from "@/interfaces/candidate";
import { ElectoralDistrictBase } from "@/interfaces/electoral-district";
import { PoliticalPartyListPaginated } from "@/interfaces/political-party";

interface Props {
  candidaturasPromise: Promise<CandidateCard[]>;
  distritos: ElectoralDistrictBase[];
  parties: PoliticalPartyListPaginated["items"];
  procesoId: string;
  currentFilters: FiltersCandidates;
}

// Server component — await aquí ocurre DENTRO del Suspense boundary
// El HTML de la página ya llegó al cliente antes de que esto resuelva
export async function CandidatosStream({
  candidaturasPromise,
  distritos,
  parties,
  procesoId,
  currentFilters,
}: Props) {
  const candidaturas = await candidaturasPromise;

  return (
    <CandidatosList
      candidaturas={candidaturas}
      procesoId={procesoId}
      currentFilters={currentFilters}
    />
  );
}
