import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const districts = await prisma.electoraldistrict.findMany({
      where: { active: true },
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    const formattedDistricts = districts.map((item) => ({
      id: item.id,
      code: item.code,
      nombre: item.name,
    }));

    return NextResponse.json({
      data: formattedDistricts,
      count: formattedDistricts.length,
    });
  } catch (error) {
    console.error("Error fetching districts:", error);
    return NextResponse.json(
      { detail: "Error consultando distritos electorales" },
      { status: 500 },
    );
  }
}
