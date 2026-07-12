import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["RESOLVED", "IGNORED", "SNOOZED"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const alert = await prisma.systemalert.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, alert });
  } catch (error) {
    console.error("Error al actualizar alerta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
