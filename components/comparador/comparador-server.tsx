import { publicApi } from "@/lib/public-api";
import ComparadorSplit from "./comparador-split";
import { PersonList } from "@/interfaces/politics";

export default async function ComparadorServer() {
  const [personas] = await Promise.all([
    publicApi.getPersonas({
      is_legislator_active: true,
      limit: 40,
    }) as Promise<PersonList[]>,
  ]);

  const shuffled = [...personas].sort(() => Math.random() - 0.5);
  return <ComparadorSplit legisladores={shuffled} />;
}
