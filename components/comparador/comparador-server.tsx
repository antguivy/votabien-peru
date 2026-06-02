import ComparadorSplit from "./comparador-split";
import { getVersusLegislators } from "@/queries/public/legislators";

export default async function ComparadorServer() {
  const legisladores = await getVersusLegislators({
    limit: 40,
    activeOnly: true,
  });
  // eslint-disable-next-line react-hooks/purity
  const shuffled = [...legisladores].sort(() => Math.random() - 0.5);
  return <ComparadorSplit legisladores={shuffled} />;
}
