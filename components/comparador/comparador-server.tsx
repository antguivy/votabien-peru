import { publicApi } from "@/lib/public-api";
import ComparadorSplit from "./comparador-split";
import { PersonaList } from "@/interfaces/politics";

export default async function ComparadorServer() {
  const [personas] = await Promise.all([
    publicApi.getPersonas({
      es_legislador_activo: true,
      limit: 40,
    }) as Promise<PersonaList[]>,
  ]);

  const shuffled = [...personas].sort(() => Math.random() - 0.5);
  return <ComparadorSplit legisladores={shuffled} />;
}
