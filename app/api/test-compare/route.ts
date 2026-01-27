import { getCandidatesComparison } from "@/queries/public/compare";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Obtenemos los DNIs de la URL (separados por coma)
  // Ejemplo: ?dnis=12345678,87654321
  const dnisParam = searchParams.get("dnis");

  if (!dnisParam) {
    return NextResponse.json({ error: "Faltan DNIs" }, { status: 400 });
  }

  const dnis = dnisParam.split(",");

  console.log("🔍 Probando comparación para DNIs:", dnis);

  // Llamamos a tu Server Action directamente
  const result = await getCandidatesComparison(dnis);

  return NextResponse.json(result);
}
