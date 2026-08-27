import { API_BASE_URL } from "@/lib/config";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const sessionResponse = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessionResponse || !sessionResponse.session) {
      return new Response(
        JSON.stringify({ detail: "No autorizado - Debes iniciar sesión" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Solo admin puede lanzar el pipeline de investigación (el service corre local, no en prod)
    const { prisma } = await import("@/lib/prisma");
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionResponse.user.id },
      select: { role: true },
    });
    if (!dbUser || !["admin", "super_admin"].includes(dbUser.role)) {
      return new Response(
        JSON.stringify({ detail: "No autorizado - Se requiere rol admin" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Si la API de Python espera el token, le mandamos el ID de sesión de better-auth
    const accessToken = process.env.API_SECRET_KEY;
    const formData = await request.formData();

    // FETCH WORKFLOW FROM DB
    const workflowId = formData.get("workflow_id")?.toString();
    if (workflowId) {
      const workflow = await prisma.ai_workflow.findUnique({
        where: { id: workflowId },
      });
      if (workflow) {
        // Forward workflow config to Python
        formData.append("compressor_prompt", workflow.compressor_prompt);
        formData.append("compressor_model", workflow.compressor_model);
        formData.append("validator_prompt", workflow.validator_prompt);
        formData.append("validator_model", workflow.validator_model);

        // Convert sources array to include_news / include_youtube booleans
        const includeNews =
          workflow.sources.includes("search_web") ||
          workflow.sources.includes("search_jne");
        const includeYoutube = workflow.sources.includes("search_youtube");

        formData.append("include_news", String(includeNews));
        formData.append("include_youtube", String(includeYoutube));
      }
    }

    // FETCH EXISTING CANDIDATE DATA (BACKGROUNDS & POSTURAS) FOR DEDUP
    const personId = formData.get("person_id")?.toString();
    let existingBackgrounds: unknown[] = [];
    let existingPosturas: unknown[] = [];

    if (personId) {
      const person = await prisma.person.findUnique({
        where: { id: personId },
        select: {
          background: {
            select: {
              id: true,
              type: true,
              status: true,
              title: true,
              summary: true,
              sanction: true,
              publication_date: true,
              source: true,
              source_url: true,
            },
          },
          posturas: true,
        },
      });

      if (person) {
        existingBackgrounds = person.background || [];
        existingPosturas = Array.isArray(person.posturas)
          ? person.posturas
          : [];
      }
    } else {
      const candidateName = formData.get("nombre_investigado")?.toString();
      if (candidateName) {
        const person = await prisma.person.findFirst({
          where: { fullname: { equals: candidateName, mode: "insensitive" } },
          select: {
            background: {
              select: {
                id: true,
                type: true,
                status: true,
                title: true,
                summary: true,
                sanction: true,
                publication_date: true,
                source: true,
                source_url: true,
              },
            },
            posturas: true,
          },
        });
        if (person) {
          existingBackgrounds = person.background || [];
          existingPosturas = Array.isArray(person.posturas)
            ? person.posturas
            : [];
        }
      }
    }

    formData.append(
      "existing_backgrounds",
      JSON.stringify(existingBackgrounds),
    );
    formData.append("existing_posturas", JSON.stringify(existingPosturas));
    formData.append(
      "existing_posturasgraphy",
      JSON.stringify(existingPosturas),
    );

    const pythonResponse = await fetch(
      `${API_BASE_URL}/api/v1/research/full-pipeline`,
      {
        method: "POST",
        headers: {
          Accept: "application/x-ndjson",
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      },
    );

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error("🔴 [NextJS Proxy] Error Python:", errorText);
      return new Response(errorText, { status: pythonResponse.status });
    }

    return new Response(pythonResponse.body, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("💥 [NextJS Proxy] Error fatal:", error);
    return new Response(JSON.stringify({ detail: "Error interno Next.js" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
